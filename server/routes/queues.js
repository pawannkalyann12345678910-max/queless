import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper to verify if user is admin of the queue's org
function isOrgAdmin(user, orgId) {
  const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(orgId);
  if (!org) return false;
  return org.ADMIN_EMAIL.toLowerCase() === user.EMAIL.toLowerCase() || org.ADMIN_UID === user.USER_ID;
}

// 1. Create a Queue under an Organization (Admin Only)
router.post('/org/:orgId', authenticate, (req, res) => {
  const { orgId } = req.params;

  if (!isOrgAdmin(req.user, orgId)) {
    return res.status(403).json({ error: 'Forbidden: You are not the admin of this organization' });
  }

  const {
    name,
    prefix = 'Q-',
    counterLabel = 'Counter 1',
    avgServiceMins = 10,
    maxDailyTokens = 0,
    operatingHours = '09:00 - 17:00',
    staffEmails = [] // Optional staff emails to assign right upon creation
  } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Queue name is required' });
  }

  const queueId = uuidv4();
  const formattedPrefix = prefix.trim().endsWith('-') ? prefix.trim().toUpperCase() : `${prefix.trim().toUpperCase()}-`;

  db.prepare(`
    INSERT INTO QUEUES (
      QUEUE_ID, ORG_ID, NAME, PREFIX, COUNTER_LABEL,
      AVG_SERVICE_MINS, MAX_DAILY_TOKENS, CURRENT_TOKEN_SEQ,
      IS_ACTIVE, IS_PAUSED, OPERATING_HOURS
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, 0, ?)
  `).run(
    queueId,
    orgId,
    name.trim(),
    formattedPrefix,
    counterLabel.trim(),
    parseInt(avgServiceMins) || 10,
    parseInt(maxDailyTokens) || 0,
    operatingHours.trim()
  );

  // Assign staff emails if provided
  if (Array.isArray(staffEmails)) {
    for (const email of staffEmails) {
      if (email && email.trim() !== '') {
        const cleanEmail = email.trim().toLowerCase();
        db.prepare(`
          INSERT INTO STAFF_ASSIGNMENTS (ASSIGNMENT_ID, QUEUE_ID, ORG_ID, STAFF_EMAIL, STAFF_NAME, ROLE)
          VALUES (?, ?, ?, ?, ?, 'OPERATOR')
        `).run(uuidv4(), queueId, orgId, cleanEmail, cleanEmail.split('@')[0]);
      }
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, 'QUEUE_CREATED', ?, ?)
  `).run(uuidv4(), orgId, queueId, req.user.USER_ID, `Created queue: ${name}`);

  const createdQueue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);
  const assignedStaff = db.prepare('SELECT * FROM STAFF_ASSIGNMENTS WHERE QUEUE_ID = ?').all(queueId);

  res.status(201).json({
    message: 'Queue created successfully',
    queue: createdQueue,
    staff: assignedStaff
  });
});

// 2. Update Queue Settings (Admin Only)
router.put('/:id', authenticate, (req, res) => {
  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  if (!isOrgAdmin(req.user, queue.ORG_ID)) {
    return res.status(403).json({ error: 'Forbidden: You are not the admin of this organization' });
  }

  const {
    name,
    prefix,
    counterLabel,
    avgServiceMins,
    maxDailyTokens,
    operatingHours,
    isActive
  } = req.body;

  db.prepare(`
    UPDATE QUEUES
    SET NAME = COALESCE(?, NAME),
        PREFIX = COALESCE(?, PREFIX),
        COUNTER_LABEL = COALESCE(?, COUNTER_LABEL),
        AVG_SERVICE_MINS = COALESCE(?, AVG_SERVICE_MINS),
        MAX_DAILY_TOKENS = COALESCE(?, MAX_DAILY_TOKENS),
        OPERATING_HOURS = COALESCE(?, OPERATING_HOURS),
        IS_ACTIVE = COALESCE(?, IS_ACTIVE)
    WHERE QUEUE_ID = ?
  `).run(
    name ? name.trim() : null,
    prefix ? (prefix.trim().endsWith('-') ? prefix.trim().toUpperCase() : `${prefix.trim().toUpperCase()}-`) : null,
    counterLabel ? counterLabel.trim() : null,
    avgServiceMins !== undefined ? parseInt(avgServiceMins) : null,
    maxDailyTokens !== undefined ? parseInt(maxDailyTokens) : null,
    operatingHours ? operatingHours.trim() : null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );

  const updatedQueue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(req.params.id);

  res.json({
    message: 'Queue updated successfully',
    queue: updatedQueue
  });
});

// 3. Pause or Resume Queue Intake (Staff or Admin)
router.post('/:id/toggle-pause', authenticate, (req, res) => {
  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  // Check if admin OR staff assigned to this queue
  const isStaff = db.prepare(`
    SELECT * FROM STAFF_ASSIGNMENTS 
    WHERE QUEUE_ID = ? AND LOWER(STAFF_EMAIL) = LOWER(?)
  `).get(req.params.id, req.user.EMAIL);

  if (!isOrgAdmin(req.user, queue.ORG_ID) && !isStaff) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to manage this queue' });
  }

  const newPausedState = queue.IS_PAUSED === 1 ? 0 : 1;

  db.prepare('UPDATE QUEUES SET IS_PAUSED = ? WHERE QUEUE_ID = ?').run(newPausedState, req.params.id);

  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, QUEUE_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    queue.ORG_ID,
    queue.QUEUE_ID,
    newPausedState === 1 ? 'QUEUE_PAUSED' : 'QUEUE_RESUMED',
    req.user.USER_ID,
    newPausedState === 1 ? 'Staff paused online bookings' : 'Staff resumed online bookings'
  );

  res.json({
    message: newPausedState === 1 ? 'Queue online bookings paused' : 'Queue online bookings resumed',
    isPaused: newPausedState === 1
  });
});

// 4. Delete a Queue (Admin Only)
router.delete('/:id', authenticate, (req, res) => {
  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  if (!isOrgAdmin(req.user, queue.ORG_ID)) {
    return res.status(403).json({ error: 'Forbidden: You are not the admin of this organization' });
  }

  db.prepare('DELETE FROM QUEUES WHERE QUEUE_ID = ?').run(req.params.id);

  res.json({ message: 'Queue deleted successfully' });
});

export default router;
