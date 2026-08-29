import express from 'express';
import db from '../database/db.js';
import {
  getVapiPhoneNumbers,
  buyVapiPhoneNumber,
  getVapiAssistants,
  makeVapiOutboundCall
} from '../services/vapiService.js';

const router = express.Router();

// 1. Get Vapi config for an organization
router.get('/config/:orgId', (req, res) => {
  const { orgId } = req.params;
  const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(orgId);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const hasApiKey = Boolean(org.VAPI_API_KEY);
  const maskedKey = hasApiKey 
    ? org.VAPI_API_KEY.slice(0, 7) + '...' + org.VAPI_API_KEY.slice(-4)
    : '';

  res.json({
    configured: hasApiKey,
    apiKeyMasked: maskedKey,
    phoneNumberId: org.VAPI_PHONE_NUMBER_ID || '',
    phoneNumber: org.VAPI_PHONE_NUMBER || '',
    assistantId: org.VAPI_ASSISTANT_ID || ''
  });
});

// 2. Save Vapi API key & auto-fetch/assign phone number
router.post('/config/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const { apiKey, phoneNumberId, assistantId } = req.body;

  try {
    const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const cleanKey = apiKey ? apiKey.trim() : (org.VAPI_API_KEY || '');
    if (!cleanKey) {
      return res.status(400).json({ error: 'Vapi Private API Key is required' });
    }

    // Auto-fetch phone numbers using the provided API Key to verify and assign
    let activePhoneNumbers = [];
    try {
      activePhoneNumbers = await getVapiPhoneNumbers(cleanKey);
    } catch (err) {
      return res.status(400).json({ error: `Invalid Vapi API Key: ${err.message}` });
    }

    // If 0 phone numbers found, try auto-buying one using their Vapi free trial credits
    if (activePhoneNumbers.length === 0) {
      try {
        console.log('Attempting auto-provision of Vapi phone number...');
        const newNum = await buyVapiPhoneNumber(cleanKey);
        if (newNum && newNum.id) {
          activePhoneNumbers.push({
            id: newNum.id,
            number: newNum.number || newNum.phoneNumber || newNum.id,
            name: 'Auto-Claimed Vapi Number'
          });
        }
      } catch (autoBuyErr) {
        console.warn('Auto-buy number notice:', autoBuyErr.message);
      }
    }

    // Determine target phone number ID
    let targetPhoneId = phoneNumberId;
    let targetPhoneNumber = '';

    if (targetPhoneId) {
      const match = activePhoneNumbers.find(p => p.id === targetPhoneId);
      targetPhoneNumber = match ? match.number : '';
    } else if (activePhoneNumbers.length > 0) {
      targetPhoneId = activePhoneNumbers[0].id;
      targetPhoneNumber = activePhoneNumbers[0].number;
    }

    // Fetch assistants list for convenience
    const assistants = await getVapiAssistants(cleanKey).catch(() => []);

    // Save to database
    org.VAPI_API_KEY = cleanKey;
    org.VAPI_PHONE_NUMBER_ID = targetPhoneId || '';
    org.VAPI_PHONE_NUMBER = targetPhoneNumber || '';
    org.VAPI_ASSISTANT_ID = assistantId ? assistantId.trim() : (org.VAPI_ASSISTANT_ID || '');

    if (activePhoneNumbers.length === 0) {
      return res.json({
        success: true,
        needsPhoneNumber: true,
        message: 'Vapi API Key connected! To start placing calls, please go to your Vapi Dashboard (dashboard.vapi.ai/phone-numbers) and click "Buy Number" using your $10 free credit balance.',
        phoneNumberId: '',
        phoneNumber: '',
        assistantId: org.VAPI_ASSISTANT_ID,
        availablePhoneNumbers: [],
        availableAssistants: assistants
      });
    }

    res.json({
      success: true,
      needsPhoneNumber: false,
      message: `Vapi Voice Agent saved! Assigned Outbound Caller ID: ${org.VAPI_PHONE_NUMBER}`,
      phoneNumberId: org.VAPI_PHONE_NUMBER_ID,
      phoneNumber: org.VAPI_PHONE_NUMBER,
      assistantId: org.VAPI_ASSISTANT_ID,
      availablePhoneNumbers: activePhoneNumbers,
      availableAssistants: assistants
    });
  } catch (err) {
    console.error('Vapi config save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Test outbound call to verify Vapi integration
router.post('/test-call/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const { testPhone } = req.body;

  try {
    const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(orgId);
    if (!org || !org.VAPI_API_KEY) {
      return res.status(400).json({ error: 'Please configure your Vapi Private API Key first.' });
    }

    if (!testPhone) {
      return res.status(400).json({ error: 'Test phone number is required.' });
    }

    const callResult = await makeVapiOutboundCall({
      apiKey: org.VAPI_API_KEY,
      phoneNumberId: org.VAPI_PHONE_NUMBER_ID,
      assistantId: org.VAPI_ASSISTANT_ID,
      customerPhone: testPhone,
      customerName: 'Authorized Admin',
      tokenNumber: 'TEST-001',
      counterLabel: 'Counter 1',
      orgName: org.NAME || 'Queless Platform'
    });

    res.json({
      success: true,
      message: `Test call placed successfully to ${callResult.recipient}! Check your phone.`,
      callId: callResult.callId,
      status: callResult.status
    });
  } catch (err) {
    console.error('Vapi test call error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Staff Triggers Live Vapi Call for a Token
router.post('/call-token', async (req, res) => {
  const { tokenId, queueId, orgId } = req.body;

  try {
    const token = db.prepare('SELECT * FROM TOKENS WHERE TOKEN_ID = ?').get(tokenId);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (!token.CUSTOMER_PHONE) {
      return res.status(400).json({ error: 'Customer does not have a phone number on their pass.' });
    }

    const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId || token.QUEUE_ID);
    const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(orgId || token.ORG_ID);

    if (!org || !org.VAPI_API_KEY) {
      return res.status(400).json({
        configured: false,
        error: 'Vapi Voice Agent is not configured for this organization. Please add your Vapi API Key in Admin Console.'
      });
    }

    const callResult = await makeVapiOutboundCall({
      apiKey: org.VAPI_API_KEY,
      phoneNumberId: org.VAPI_PHONE_NUMBER_ID,
      assistantId: org.VAPI_ASSISTANT_ID,
      customerPhone: token.CUSTOMER_PHONE,
      customerName: token.CUSTOMER_NAME || 'Customer',
      tokenNumber: token.TOKEN_NUMBER || 'Next',
      counterLabel: queue ? (queue.COUNTER_LABEL || 'Counter 1') : 'Counter 1',
      orgName: org.NAME || 'Service Desk'
    });

    res.json({
      success: true,
      callId: callResult.callId,
      status: callResult.status,
      recipient: callResult.recipient,
      tokenNumber: token.TOKEN_NUMBER,
      customerName: token.CUSTOMER_NAME
    });
  } catch (err) {
    console.error('Vapi token calling error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
