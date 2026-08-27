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

// 1. Get queues assigned to the current authenticated staff member (Staff Auto-Routing)
router.get('/my-queues', authenticate, (req, res) => {
  const staffEmail = req.user.EMAIL.toLowerCase();

  const assignedQueues = db.prepare(`
    SELECT 
      q.*,
      o.NAME as ORG_NAME,
      o.CATEGORY as ORG_CATEGORY,
      o.LOGO_URL as ORG_LOGO_URL,
      sa.ROLE as STAFF_ROLE,
      (SELECT COUNT(*) FROM TOKENS t WHERE t.QUEUE_ID = q.QUEUE_ID AND t.STATUS = 'WAITING') as WAITING_COUNT,
      (SELECT COUNT(*) FROM TOKENS t WHERE t.QUEUE_ID = q.QUEUE_ID AND t.STATUS = 'COMPLETED') as COMPLETED_TODAY,
      (SELECT COUNT(*) FROM TOKENS t WHERE t.QUEUE_ID = q.QUEUE_ID AND t.STATUS = 'NO_SHOW') as NOSHOW_TODAY,
      (SELECT COUNT(*) FROM TOKENS t WHERE t.QUEUE_ID = q.QUEUE_ID AND t.DELAY_STATUS = 'REQUESTED_5M') as PENDING_DELAYS,
      (SELECT TOKEN_NUMBER FROM TOKENS t WHERE t.QUEUE_ID = q.QUEUE_ID AND t.STATUS IN ('CALLED', 'SERVING') ORDER BY t.CALLED_AT DESC LIMIT 1) as CURRENT_SERVING_TOKEN
    FROM STAFF_ASSIGNMENTS sa
    JOIN QUEUES q ON sa.QUEUE_ID = q.QUEUE_ID
    JOIN ORGANIZATIONS o ON sa.ORG_ID = o.ORG_ID
    WHERE LOWER(sa.STAFF_EMAIL) = ? AND q.IS_ACTIVE = 1
  `).all(staffEmail);

  res.json({ queues: assignedQueues });
});

// 2. List staff assignments for a queue (Admin Only)
router.get('/queue/:queueId', authenticate, (req, res) => {
  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(req.params.queueId);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  if (!isOrgAdmin(req.user, queue.ORG_ID)) {
    return res.status(403).json({ error: 'Forbidden: You are not the admin of this organization' });
  }

  const staff = db.prepare(`
    SELECT sa.*, u.DISPLAY_NAME as USER_NAME, u.PHOTO_URL as USER_PHOTO
    FROM STAFF_ASSIGNMENTS sa
    LEFT JOIN USERS u ON LOWER(sa.STAFF_EMAIL) = LOWER(u.EMAIL)
    WHERE sa.QUEUE_ID = ?
    ORDER BY sa.CREATED_AT DESC
  `).all(req.params.queueId);

  res.json({ staff });
});

// 3. Assign a staff email to a queue (Admin Only)
router.post('/queue/:queueId', authenticate, (req, res) => {
  const { queueId } = req.params;
  const { staffEmail, role = 'OPERATOR' } = req.body;

  if (!staffEmail || staffEmail.trim() === '') {
    return res.status(400).json({ error: 'Staff email is required' });
  }

  const queue = db.prepare('SELECT * FROM QUEUES WHERE QUEUE_ID = ?').get(queueId);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found' });
  }

  if (!isOrgAdmin(req.user, queue.ORG_ID)) {
    return res.status(403).json({ error: 'Forbidden: You are not the admin of this organization' });
  }

  const cleanEmail = staffEmail.trim().toLowerCase();

  // Check if already assigned
  const existing = db.prepare(`
    SELECT * FROM STAFF_ASSIGNMENTS 
    WHERE QUEUE_ID = ? AND LOWER(STAFF_EMAIL) = ?
  `).get(queueId, cleanEmail);

  if (existing) {
    return res.status(400).json({ error: 'Staff member is already assigned to this queue' });
  }

  const assignmentId = uuidv4();
  const staffName = cleanEmail.split('@')[0];

  db.prepare(`
    INSERT INTO STAFF_ASSIGNMENTS (ASSIGNMENT_ID, QUEUE_ID, ORG_ID, STAFF_EMAIL, STAFF_NAME, ROLE)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(assignmentId, queueId, queue.ORG_ID, cleanEmail, staffName, role);

  const createdAssignment = db.prepare('SELECT * FROM STAFF_ASSIGNMENTS WHERE ASSIGNMENT_ID = ?').get(assignmentId);

  res.status(201).json({
    message: `Staff member ${cleanEmail} assigned successfully`,
    assignment: createdAssignment
  });
});

// 4. Remove a staff assignment (Admin Only)
router.delete('/:assignmentId', authenticate, (req, res) => {
  const assignment = db.prepare('SELECT * FROM STAFF_ASSIGNMENTS WHERE ASSIGNMENT_ID = ?').get(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Staff assignment not found' });
  }

  if (!isOrgAdmin(req.user, assignment.ORG_ID)) {
    return res.status(403).json({ error: 'Forbidden: You are not the admin of this organization' });
  }

  db.prepare('DELETE FROM STAFF_ASSIGNMENTS WHERE ASSIGNMENT_ID = ?').run(req.params.assignmentId);

  res.json({ message: 'Staff assignment removed successfully' });
});

export default router;
