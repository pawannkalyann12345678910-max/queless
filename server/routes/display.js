import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Public HDMI Display Data for a Queue
// Strictly sanitized: NO customer names, NO phone numbers, NO internal notes
router.get('/queue/:queueId', (req, res) => {
  let { queueId } = req.params;

  let queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);

  // Graceful fallback to the first active queue if demo ID or custom ID is passed
  if (!queue) {
    queue = db.prepare('SELECT * FROM QUEUES WHERE IS_ACTIVE = 1').get() || db.prepare('SELECT * FROM QUEUES').get();
  }

  if (!queue) {
    // If no queue exists at all in DB, return sample queue
    const sampleQueue = {
      QUEUE_ID: 'q-general-opd',
      ORG_ID: 'org-sample',
      NAME: 'General OPD',
      COUNTER_LABEL: 'Counter 1',
      AVG_SERVICE_MINS: 8,
      ORG_NAME: 'Apex Healthcare & Clinic',
      ORG_CATEGORY: 'Clinic',
      ORG_LOGO_URL: ''
    };

    return res.json({
      queue: sampleQueue,
      nowServing: {
        TOKEN_ID: 'sample-called',
        TOKEN_NUMBER: 'DOC-104',
        STATUS: 'CALLED',
        CALLED_AT: new Date().toISOString()
      },
      nextInLine: [
        { TOKEN_ID: 't-1', TOKEN_NUMBER: 'DOC-105', POSITION_IN_QUEUE: 1, ESTIMATED_WAIT_MINS: 5 },
        { TOKEN_ID: 't-2', TOKEN_NUMBER: 'DOC-106', POSITION_IN_QUEUE: 2, ESTIMATED_WAIT_MINS: 12 },
        { TOKEN_ID: 't-3', TOKEN_NUMBER: 'DOC-107', POSITION_IN_QUEUE: 3, ESTIMATED_WAIT_MINS: 18 }
      ],
      stats: {
        TOTAL_WAITING: 3,
        TOTAL_SERVED_TODAY: 14
      },
      timestamp: new Date().toISOString()
    });
  }

  const resolvedQueueId = queue.QUEUE_ID;
  const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(queue.ORG_ID);

  const fullQueue = {
    ...queue,
    NAME: queue.NAME,
    QUEUE_NAME: queue.NAME,
    ORG_NAME: org ? org.NAME : 'Service Counter',
    ORG_CATEGORY: org ? org.CATEGORY : 'Counter',
    ORG_LOGO_URL: org ? org.LOGO_URL : ''
  };

  // Currently called / serving token
  const activeTokens = db.prepare('SELECT * FROM TOKENS WHERE QUEUE_ID = ?').all(resolvedQueueId);
  
  const nowServingList = activeTokens
    .filter(t => t.STATUS === 'CALLED' || t.STATUS === 'SERVING')
    .sort((a, b) => (b.CALLED_AT || '').localeCompare(a.CALLED_AT || ''));
  
  let nowServing = nowServingList.length > 0 ? {
    TOKEN_ID: nowServingList[0].TOKEN_ID,
    TOKEN_NUMBER: nowServingList[0].TOKEN_NUMBER,
    STATUS: nowServingList[0].STATUS,
    CALLED_AT: nowServingList[0].CALLED_AT
  } : null;

  // Next in line upcoming tokens (Token numbers ONLY)
  let nextInLine = activeTokens
    .filter(t => t.STATUS === 'WAITING')
    .sort((a, b) => (a.TOKEN_SEQ || 0) - (b.TOKEN_SEQ || 0))
    .slice(0, 5)
    .map(t => ({
      TOKEN_ID: t.TOKEN_ID,
      TOKEN_NUMBER: t.TOKEN_NUMBER,
      POSITION_IN_QUEUE: t.POSITION_IN_QUEUE || 1,
      ESTIMATED_WAIT_MINS: t.ESTIMATED_WAIT_MINS || 5
    }));

  // If no tokens active, provide sample upcoming tokens for display preview
  if (!nowServing && nextInLine.length === 0) {
    const latestToken = activeTokens[0];
    if (latestToken) {
      nowServing = {
        TOKEN_ID: latestToken.TOKEN_ID,
        TOKEN_NUMBER: latestToken.TOKEN_NUMBER,
        STATUS: latestToken.STATUS,
        CALLED_AT: latestToken.CALLED_AT || latestToken.CREATED_AT
      };
    }
  }

  const totalWaiting = activeTokens.filter(t => t.STATUS === 'WAITING').length;
  const totalServed = activeTokens.filter(t => t.STATUS === 'COMPLETED').length;

  res.json({
    queue: fullQueue,
    nowServing,
    nextInLine,
    stats: {
      TOTAL_WAITING: totalWaiting,
      TOTAL_SERVED_TODAY: totalServed
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
