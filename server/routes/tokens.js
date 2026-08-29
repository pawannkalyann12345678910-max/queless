import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper to recalculate queue positions and estimated wait times
function recalculateQueuePositions(queueId) {
  const queue = db.prepare('SELECT AVG_SERVICE_MINS FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);
  const avgMins = queue ? queue.AVG_SERVICE_MINS : 10;

  const waitingTokens = db.prepare(`
    SELECT TOKEN_ID FROM TOKENS 
    WHERE QUEUE_ID = ? AND STATUS = 'WAITING' 
    ORDER BY TOKEN_SEQ ASC, CREATED_AT ASC
  `).all(queueId);

  const updateStmt = db.prepare(`
    UPDATE TOKENS 
    SET POSITION_IN_QUEUE = ?, ESTIMATED_WAIT_MINS = ? 
    WHERE TOKEN_ID = ?
  `);

  const updateMany = db.transaction((tokens) => {
    tokens.forEach((token, index) => {
      const position = index + 1;
      const eta = position * avgMins;
      updateStmt.run(position, eta, token.TOKEN_ID);
    });
  });

  updateMany(waitingTokens);
}

// 1. Book a Token (Customer)
router.post('/queue/:queueId/book', authenticate, (req, res) => {
  const { queueId } = req.params;
  const { serviceNote, customerName, customerPhone } = req.body;

  // Validate mandatory profile fields
  const user = db.prepare('SELECT * FROM USERS WHERE USER_ID = ?').get(req.user.USER_ID);
  const finalName = customerName || user.DISPLAY_NAME || req.user.DISPLAY_NAME;
  const finalPhone = customerPhone || user.PHONE || req.user.PHONE;

  if (!finalPhone || finalPhone.trim() === '') {
    return res.status(400).json({ error: 'Mandatory phone number is required to book a token' });
  }

  // Update user profile with phone if not already saved
  if (!user.PHONE || user.PROFILE_COMPLETE === 0) {
    db.prepare('UPDATE USERS SET PHONE = ?, DISPLAY_NAME = ?, PROFILE_COMPLETE = 1 WHERE USER_ID = ?')
      .run(finalPhone.trim(), finalName.trim(), req.user.USER_ID);
  }

  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  if (queue.IS_PAUSED === 1) {
    return res.status(400).json({ error: 'Online token intake is temporarily paused by staff. Please try again shortly.' });
  }

  // Check if customer already has an active waiting/called/serving token in this queue
  const existingActiveToken = db.prepare(`
    SELECT * FROM TOKENS 
    WHERE QUEUE_ID = ? AND USER_ID = ? AND STATUS IN ('WAITING', 'CALLED', 'SERVING')
  `).get(queueId, req.user.USER_ID);

  if (existingActiveToken) {
    return res.status(400).json({ 
      error: `You already have an active pass (${existingActiveToken.TOKEN_NUMBER}) in this queue.`,
      token: existingActiveToken
    });
  }

  const today = new Date().toISOString().split('T')[0];

  // Daily quota check
  if (queue.MAX_DAILY_TOKENS > 0) {
    const todayCount = db.prepare('SELECT COUNT(*) as count FROM TOKENS WHERE QUEUE_ID = ? AND BOOKING_DATE = ?')
      .get(queueId, today).count;
    if (todayCount >= queue.MAX_DAILY_TOKENS) {
      return res.status(400).json({ error: 'Daily token limit reached for this queue' });
    }
  }

  // Next sequence number
  const nextSeq = queue.CURRENT_TOKEN_SEQ + 1;
  const tokenNumber = `${queue.PREFIX}${nextSeq.toString().padStart(3, '0')}`;
  const tokenId = uuidv4();

  // Increment queue current sequence
  db.prepare('UPDATE QUEUES SET CURRENT_TOKEN_SEQ = ? WHERE QUEUE_ID = ?').run(nextSeq, queueId);

  // Insert token
  db.prepare(`
    INSERT INTO TOKENS (
      TOKEN_ID, QUEUE_ID, ORG_ID, USER_ID, TOKEN_NUMBER, TOKEN_SEQ,
      CUSTOMER_NAME, CUSTOMER_PHONE, SERVICE_NOTE, STATUS, DELAY_STATUS,
      BOOKING_DATE
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING', 'NONE', ?)
  `).run(
    tokenId,
    queueId,
    queue.ORG_ID,
    req.user.USER_ID,
    tokenNumber,
    nextSeq,
    finalName.trim(),
    finalPhone.trim(),
    serviceNote ? serviceNote.trim() : '',
    today
  );

  // Recalculate positions
  recalculateQueuePositions(queueId);

  // Audit log
  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'TOKEN_BOOKED', ?, ?)
  `).run(uuidv4(), queue.ORG_ID, queueId, tokenId, req.user.USER_ID, `Booked token: ${tokenNumber}`);

  const bookedToken = db.prepare(`
    SELECT t.*, q.NAME as QUEUE_NAME, q.COUNTER_LABEL, q.AVG_SERVICE_MINS, o.NAME as ORG_NAME, o.LOGO_URL as ORG_LOGO_URL
    FROM TOKENS t
    JOIN QUEUES q ON t.QUEUE_ID = q.QUEUE_ID
    JOIN ORGANIZATIONS o ON t.ORG_ID = o.ORG_ID
    WHERE t.TOKEN_ID = ?
  `).get(tokenId);

  res.status(201).json({
    message: 'Token booked successfully',
    token: bookedToken
  });
});

// 2. Get My Tokens (Customer Dashboard)
router.get('/my-tokens', authenticate, (req, res) => {
  // Recalculate active queues first
  const activeQueueIds = db.prepare(`
    SELECT DISTINCT QUEUE_ID FROM TOKENS WHERE USER_ID = ? AND STATUS IN ('WAITING', 'CALLED', 'SERVING')
  `).all(req.user.USER_ID);

  activeQueueIds.forEach(row => recalculateQueuePositions(row.QUEUE_ID));

  const tokens = db.prepare(`
    SELECT 
      t.*,
      q.NAME as QUEUE_NAME,
      q.COUNTER_LABEL,
      q.AVG_SERVICE_MINS,
      q.OPERATING_HOURS,
      o.NAME as ORG_NAME,
      o.CATEGORY as ORG_CATEGORY,
      o.LOGO_URL as ORG_LOGO_URL,
      (SELECT TOKEN_NUMBER FROM TOKENS cur WHERE cur.QUEUE_ID = t.QUEUE_ID AND cur.STATUS IN ('CALLED', 'SERVING') ORDER BY cur.CALLED_AT DESC LIMIT 1) as CURRENT_SERVING_TOKEN
    FROM TOKENS t
    JOIN QUEUES q ON t.QUEUE_ID = q.QUEUE_ID
    JOIN ORGANIZATIONS o ON t.ORG_ID = o.ORG_ID
    WHERE t.USER_ID = ?
    ORDER BY 
      CASE 
        WHEN t.STATUS = 'CALLED' THEN 1
        WHEN t.STATUS = 'SERVING' THEN 2
        WHEN t.STATUS = 'WAITING' THEN 3
        ELSE 4
      END,
      t.CREATED_AT DESC
  `).all(req.user.USER_ID);

  res.json({ tokens });
});

// 3. Get All Tokens for a Queue (Staff / Admin View)
router.get('/queue/:queueId', authenticate, (req, res) => {
  const { queueId } = req.params;

  recalculateQueuePositions(queueId);

  const tokens = db.prepare(`
    SELECT t.*, u.PHOTO_URL as CUSTOMER_PHOTO, u.EMAIL as CUSTOMER_EMAIL
    FROM TOKENS t
    LEFT JOIN USERS u ON t.USER_ID = u.USER_ID
    WHERE t.QUEUE_ID = ?
    ORDER BY 
      CASE 
        WHEN t.STATUS = 'CALLED' THEN 1
        WHEN t.STATUS = 'SERVING' THEN 2
        WHEN t.STATUS = 'WAITING' THEN 3
        WHEN t.STATUS = 'NO_SHOW' THEN 4
        ELSE 5
      END,
      t.TOKEN_SEQ ASC
  `).all(queueId);

  const queue = db.prepare(`
    SELECT q.*, o.NAME as ORG_NAME, o.LOGO_URL as ORG_LOGO_URL
    FROM QUEUES q
    JOIN ORGANIZATIONS o ON q.ORG_ID = o.ORG_ID
    WHERE q.QUEUE_ID = ?
  `).get(queueId);

  res.json({ queue, tokens });
});

// 4. Call Next Token (Staff)
router.post('/:id/call', authenticate, (req, res) => {
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  // Update token status to CALLED
  db.prepare(`
    UPDATE TOKENS 
    SET STATUS = 'CALLED', CALLED_AT = CURRENT_TIMESTAMP, POSITION_IN_QUEUE = 0, ESTIMATED_WAIT_MINS = 0
    WHERE TOKEN_ID = ?
  `).run(req.params.id);

  recalculateQueuePositions(token.QUEUE_ID);

  // Audit log
  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'TOKEN_CALLED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Called token: ${token.TOKEN_NUMBER}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: `Token ${token.TOKEN_NUMBER} called`, token: updatedToken });
});

// 5. Start Serving Token (Staff)
router.post('/:id/serve', authenticate, (req, res) => {
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  db.prepare(`
    UPDATE TOKENS 
    SET STATUS = 'SERVING', SERVE_STARTED_AT = CURRENT_TIMESTAMP 
    WHERE TOKEN_ID = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'SERVING_STARTED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Serving token: ${token.TOKEN_NUMBER}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: `Serving token ${token.TOKEN_NUMBER}`, token: updatedToken });
});

// 6. Complete Service (Staff)
router.post('/:id/complete', authenticate, (req, res) => {
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  db.prepare(`
    UPDATE TOKENS 
    SET STATUS = 'COMPLETED', COMPLETED_AT = CURRENT_TIMESTAMP 
    WHERE TOKEN_ID = ?
  `).run(req.params.id);

  recalculateQueuePositions(token.QUEUE_ID);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Completed service for: ${token.TOKEN_NUMBER}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: `Completed service for ${token.TOKEN_NUMBER}`, token: updatedToken });
});

// 7. Mark No-Show (Staff)
router.post('/:id/no-show', authenticate, (req, res) => {
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  db.prepare(`
    UPDATE TOKENS 
    SET STATUS = 'NO_SHOW' 
    WHERE TOKEN_ID = ?
  `).run(req.params.id);

  recalculateQueuePositions(token.QUEUE_ID);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'NO_SHOW', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Marked no-show: ${token.TOKEN_NUMBER}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: `Token ${token.TOKEN_NUMBER} marked as No-Show`, token: updatedToken });
});

// 8. Cancel Token Pass (Customer or Staff)
router.post('/:id/cancel', authenticate, (req, res) => {
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  db.prepare(`
    UPDATE TOKENS 
    SET STATUS = 'CANCELLED' 
    WHERE TOKEN_ID = ?
  `).run(req.params.id);

  recalculateQueuePositions(token.QUEUE_ID);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'CANCELLED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Cancelled token: ${token.TOKEN_NUMBER}`);

  res.json({ message: `Token ${token.TOKEN_NUMBER} cancelled successfully` });
});

// 9. Request Flexible Delay (Customer: +5m, +10m, +15m with reason)
router.post('/:id/delay-request', authenticate, (req, res) => {
  const { delayMins = 5, reason = '🚗 Parking / Traffic Delay' } = req.body;
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  if (token.STATUS !== 'WAITING') {
    return res.status(400).json({ error: 'Delays can only be requested while waiting in line' });
  }

  const mins = Number(delayMins) || 5;
  const statusStr = mins === 15 ? 'REQUESTED_15M' : mins === 10 ? 'REQUESTED_10M' : 'REQUESTED_5M';

  db.prepare(`
    UPDATE TOKENS 
    SET DELAY_STATUS = ?, 
        DELAY_MINUTES = ?, 
        DELAY_REASON = ?, 
        DELAY_REQUESTED_AT = CURRENT_TIMESTAMP 
    WHERE TOKEN_ID = ?
  `).run(statusStr, mins, reason, req.params.id);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'DELAY_REQUESTED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Requested +${mins}m delay (${reason}) for: ${token.TOKEN_NUMBER}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: `Delay request (+${mins}m) submitted to counter staff`, token: updatedToken });
});

// 10. Approve & Arrange Delay Request (Staff)
router.post('/:id/delay-approve', authenticate, (req, res) => {
  const { customShift } = req.body;
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  const delayMins = token.DELAY_MINUTES || 5;
  // Shift sequence based on requested minutes: 5m -> ~2.5, 10m -> ~4.5, 15m -> ~6.5
  const shift = customShift ? Number(customShift) : (delayMins >= 15 ? 6.5 : delayMins >= 10 ? 4.5 : 2.5);
  const newSeq = token.TOKEN_SEQ + shift;
  const statusStr = delayMins >= 15 ? 'APPROVED_15M' : delayMins >= 10 ? 'APPROVED_10M' : 'APPROVED_5M';

  db.prepare(`
    UPDATE TOKENS 
    SET DELAY_STATUS = ?, TOKEN_SEQ = ? 
    WHERE TOKEN_ID = ?
  `).run(statusStr, newSeq, req.params.id);

  recalculateQueuePositions(token.QUEUE_ID);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'DELAY_APPROVED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Approved +${delayMins}m delay (${token.DELAY_REASON || 'General'}) for: ${token.TOKEN_NUMBER}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: `Delay request (+${delayMins}m) approved and arranged. Token shifted down.`, token: updatedToken });
});

// 11. Reject Delay Request (Staff)
router.post('/:id/delay-reject', authenticate, (req, res) => {
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  db.prepare(`
    UPDATE TOKENS 
    SET DELAY_STATUS = 'REJECTED_5M' 
    WHERE TOKEN_ID = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'DELAY_REJECTED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Staff rejected delay request for: ${token.TOKEN_NUMBER}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: 'Delay request rejected. Customer notified.', token: updatedToken });
});

// 12. Reschedule to Next Day (Customer)
router.post('/:id/reschedule', authenticate, (req, res) => {
  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  // Calculate next day's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  db.prepare(`
    UPDATE TOKENS 
    SET BOOKING_DATE = ?, DELAY_STATUS = 'RESCHEDULED', STATUS = 'WAITING' 
    WHERE TOKEN_ID = ?
  `).run(tomorrowStr, req.params.id);

  recalculateQueuePositions(token.QUEUE_ID);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'RESCHEDULED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, token.QUEUE_ID, token.TOKEN_ID, req.user.USER_ID, `Rescheduled ${token.TOKEN_NUMBER} to ${tomorrowStr}`);

  const updatedToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  res.json({ message: `Token rescheduled to ${tomorrowStr}`, token: updatedToken });
});

// 13. Transfer Token to Another Queue (Staff)
router.post('/:id/transfer', authenticate, (req, res) => {
  const { targetQueueId } = req.body;
  if (!targetQueueId) return res.status(400).json({ error: 'Target queue ID is required' });

  const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(req.params.id);
  if (!token) return res.status(404).json({ error: 'Token not found' });

  const targetQueue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(targetQueueId);
  if (!targetQueue) return res.status(404).json({ error: 'Target queue not found' });

  const oldQueueId = token.QUEUE_ID;

  db.prepare(`
    UPDATE TOKENS 
    SET QUEUE_ID = ?, STATUS = 'WAITING', DELAY_STATUS = 'NONE', POSITION_IN_QUEUE = 0
    WHERE TOKEN_ID = ?
  `).run(targetQueueId, req.params.id);

  recalculateQueuePositions(oldQueueId);
  recalculateQueuePositions(targetQueueId);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'TRANSFERRED', ?, ?)
  `).run(uuidv4(), token.ORG_ID, targetQueueId, token.TOKEN_ID, req.user.USER_ID, `Transferred ${token.TOKEN_NUMBER} to ${targetQueue.NAME}`);

  res.json({ message: `Token transferred to ${targetQueue.NAME}` });
});

// 14. Issue Walk-In Token (Staff)
router.post('/queue/:queueId/walk-in', authenticate, (req, res) => {
  const { queueId } = req.params;
  const { customerName, customerPhone, serviceNote } = req.body;

  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'Customer name and phone are required for walk-in token' });
  }

  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  const today = new Date().toISOString().split('T')[0];
  const nextSeq = queue.CURRENT_TOKEN_SEQ + 1;
  const tokenNumber = `${queue.PREFIX}${nextSeq.toString().padStart(3, '0')}`;
  const tokenId = uuidv4();

  db.prepare('UPDATE QUEUES SET CURRENT_TOKEN_SEQ = ? WHERE QUEUE_ID = ?').run(nextSeq, queueId);

  db.prepare(`
    INSERT INTO TOKENS (
      TOKEN_ID, QUEUE_ID, ORG_ID, USER_ID, TOKEN_NUMBER, TOKEN_SEQ,
      CUSTOMER_NAME, CUSTOMER_PHONE, SERVICE_NOTE, STATUS, DELAY_STATUS,
      BOOKING_DATE
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING', 'NONE', ?)
  `).run(
    tokenId,
    queueId,
    queue.ORG_ID,
    `walkin-${uuidv4().slice(0, 8)}`,
    tokenNumber,
    nextSeq,
    customerName.trim(),
    customerPhone.trim(),
    serviceNote ? serviceNote.trim() : 'Walk-in customer',
    today
  );

  recalculateQueuePositions(queueId);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, TOKEN_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, 'WALKIN_ISSUED', ?, ?)
  `).run(uuidv4(), queue.ORG_ID, queueId, tokenId, req.user.USER_ID, `Issued walk-in token: ${tokenNumber}`);

  const createdToken = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(tokenId);
  res.status(201).json({ message: 'Walk-in token issued', token: createdToken });
});

export default router;
