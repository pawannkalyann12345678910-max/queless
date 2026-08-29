import express from 'express';
import db from '../database/db.js';
import {
  startWhatsAppSession,
  getWhatsAppSessionStatus,
  disconnectWhatsAppSession,
  sendWhatsAppMessage
} from '../services/whatsappManager.js';

const router = express.Router();

// 1. Get status & QR code of a WhatsApp session
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const status = getWhatsAppSessionStatus(sessionId);
  res.json(status);
});

// 2. Trigger connection / Generate QR code
router.post('/connect/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const result = await startWhatsAppSession(sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Disconnect session
router.post('/disconnect/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const result = await disconnectWhatsAppSession(sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Send Token Alert / Notification / Test via WhatsApp
router.post('/send-token-alert', async (req, res) => {
  const { orgId, queueId, tokenId, phone, messageType = 'CALL', customText } = req.body;

  try {
    let token = null;
    let targetPhone = phone || '';
    let customerName = 'Valued Customer';
    let tokenNumber = '';

    // If real tokenId is provided (not 'test')
    if (tokenId && tokenId !== 'test') {
      token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(tokenId);
      if (token) {
        targetPhone = token.CUSTOMER_PHONE || targetPhone;
        customerName = token.CUSTOMER_NAME || customerName;
        tokenNumber = token.TOKEN_NUMBER || '';
      }
    }

    if (!targetPhone) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    // 2. Get queue & organization info
    const queue = queueId || (token ? token.QUEUE_ID : null) 
      ? db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId || token.QUEUE_ID)
      : null;

    const targetOrgId = orgId || (token ? token.ORG_ID : null) || (queue ? queue.ORG_ID : null);
    const org = targetOrgId
      ? db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(targetOrgId)
      : null;

    const orgName = org ? org.NAME : 'Service Counter';
    const counterLabel = queue ? (queue.COUNTER_LABEL || 'Counter 1') : 'Counter 1';
    const allowStaffWhatsApp = queue && queue.ALLOW_STAFF_WHATSAPP === 1;

    // 3. Determine active session (Staff session vs Admin session)
    let selectedSessionId = null;
    let senderType = null;

    if (allowStaffWhatsApp && queue) {
      const staffStatus = getWhatsAppSessionStatus(`staff_${queue.QUEUE_ID}`);
      if (staffStatus.status === 'CONNECTED') {
        selectedSessionId = `staff_${queue.QUEUE_ID}`;
        senderType = 'STAFF';
      }
    }

    if (!selectedSessionId && org) {
      const adminStatus = getWhatsAppSessionStatus(`admin_${org.ORG_ID}`);
      if (adminStatus.status === 'CONNECTED') {
        selectedSessionId = `admin_${org.ORG_ID}`;
        senderType = 'ADMIN';
      }
    }

    // Fallback: check if ANY active admin session exists
    if (!selectedSessionId) {
      const allOrgs = db.prepare('SELECT * FROM ORGANIZATIONS').all();
      for (const o of allOrgs) {
        const adminStatus = getWhatsAppSessionStatus(`admin_${o.ORG_ID}`);
        if (adminStatus.status === 'CONNECTED') {
          selectedSessionId = `admin_${o.ORG_ID}`;
          senderType = 'ADMIN';
          break;
        }
      }
    }

    // 4. Generate notification message body
    let messageBody = '';
    if (messageType === 'CALL') {
      messageBody = `🎟️ *QUELESS LIVE TURN ALERT*\n\nHello *${customerName}*,\nYour turn for Token *${tokenNumber || 'NOW'}* has arrived!\n\n📍 *Counter:* ${counterLabel}\n🏢 *Location:* ${orgName}\n\n👉 *Please proceed to the counter area now.*`;
    } else if (messageType === 'ADVANCE_5M') {
      messageBody = `⚠️ *QUELESS QUEUE UPDATE*\n\nHello *${customerName}*,\nYour Token *${tokenNumber || ''}* is now *#1 next in line* (~5 mins wait).\n\n📍 *Counter:* ${counterLabel}\n🏢 *Location:* ${orgName}\n\n👉 *Please start walking towards the waiting area.*`;
    } else {
      messageBody = customText || `Hello ${customerName}, update regarding token ${tokenNumber} at ${orgName}.`;
    }

    // If neither session is connected
    if (!selectedSessionId) {
      return res.status(400).json({
        success: false,
        connected: false,
        error: 'WhatsApp is not connected yet. Please click "Connect WhatsApp" (or "WhatsApp Bot" in Admin Console) and scan the QR code to link your number.'
      });
    }

    // 5. Send via active connected session
    const sendResult = await sendWhatsAppMessage(selectedSessionId, targetPhone, messageBody);

    res.json({
      success: true,
      connected: true,
      senderType,
      sender: sendResult.sender,
      recipient: sendResult.recipient,
      messageId: sendResult.messageId
    });
  } catch (err) {
    console.error('WhatsApp token alert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Toggle per-queue staff WhatsApp permission
router.put('/queue/:queueId/toggle-staff-whatsapp', (req, res) => {
  const { queueId } = req.params;
  const { allowStaffWhatsApp } = req.body;

  try {
    const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const val = (allowStaffWhatsApp === true || Number(allowStaffWhatsApp) === 1) ? 1 : 0;
    queue.ALLOW_STAFF_WHATSAPP = val;

    res.json({
      success: true,
      queueId,
      allowStaffWhatsApp: val
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
