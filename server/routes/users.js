import express from 'express';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM USERS WHERE USER_ID = ?').get(req.user.USER_ID);
  res.json({
    user,
    role: req.user.ROLE,
    adminOrgs: req.user.adminOrgs,
    staffAssignments: req.user.staffAssignments
  });
});

// Complete or update mandatory user profile (name, phone)
router.put('/profile', authenticate, (req, res) => {
  const { displayName, phone } = req.body;

  if (!phone || phone.trim() === '') {
    return res.status(400).json({ error: 'Phone number is mandatory and required' });
  }

  const name = displayName && displayName.trim() !== '' ? displayName.trim() : req.user.DISPLAY_NAME;

  db.prepare(`
    UPDATE USERS 
    SET DISPLAY_NAME = ?, PHONE = ?, PROFILE_COMPLETE = 1, UPDATED_AT = CURRENT_TIMESTAMP 
    WHERE USER_ID = ?
  `).run(name, phone.trim(), req.user.USER_ID);

  const updatedUser = db.prepare('SELECT * FROM USERS WHERE USER_ID = ?').get(req.user.USER_ID);

  res.json({
    message: 'Profile completed successfully',
    user: updatedUser
  });
});

export default router;
