import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Public HDMI Display Data for a Queue
// Strictly sanitized: NO customer names, NO phone numbers, NO internal notes
router.get('/queue/:queueId', (req, res) => {
  const { queueId } = req.params;

  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);

  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(queue.ORG_ID);

  const fullQueue = {
    ...queue,
    NAME: queue.NAME,
    QUEUE_NAME: queue.NAME,
    ORG_NAME: org ? org.NAME : '',
    ORG_CATEGORY: org ? org.CATEGORY : '',
    ORG_LOGO_URL: org ? org.LOGO_URL : ''
  };

  // Currently called / serving token
  const activeTokens = db.prepare('SELECT * FROM TOKENS WHERE QUEUE_ID = ?').all(queueId);
  
  const nowServingList = activeTokens
    .filter(t => t.STATUS === 'CALLED' || t.STATUS === 'SERVING')
    .sort((a, b) => (b.CALLED_AT || '').localeCompare(a.CALLED_AT || ''));
  
  const nowServing = nowServingList.length > 0 ? {
    TOKEN_ID: nowServingList[0].TOKEN_ID,
    TOKEN_NUMBER: nowServingList[0].TOKEN_NUMBER,
    STATUS: nowServingList[0].STATUS,
    CALLED_AT: nowServingList[0].CALLED_AT
  } : null;

  // Next in line upcoming tokens (Token numbers ONLY)
  const nextInLine = activeTokens
    .filter(t => t.STATUS === 'WAITING')
    .sort((a, b) => (a.TOKEN_SEQ || 0) - (b.TOKEN_SEQ || 0))
    .slice(0, 5)
    .map(t => ({
      TOKEN_ID: t.TOKEN_ID,
      TOKEN_NUMBER: t.TOKEN_NUMBER,
      POSITION_IN_QUEUE: t.POSITION_IN_QUEUE || 1,
      ESTIMATED_WAIT_MINS: t.ESTIMATED_WAIT_MINS || 5
    }));

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
