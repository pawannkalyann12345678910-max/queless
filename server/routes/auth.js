import express from 'express';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Verify token and return user profile with resolved roles
router.post('/verify', authenticate, (req, res) => {
  res.json({
    user: req.user,
    role: req.user.ROLE,
    adminOrgs: req.user.adminOrgs,
    staffAssignments: req.user.staffAssignments
  });
});

// Update customer / user profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { displayName, phone } = req.body;
    const userId = req.user.USER_ID;

    if (displayName) {
      db.prepare('UPDATE USERS SET DISPLAY_NAME = ? WHERE USER_ID = ?').run(displayName.trim(), userId);
    }
    if (phone !== undefined) {
      db.prepare('UPDATE USERS SET PHONE = ? WHERE USER_ID = ?').run(phone.trim(), userId);
    }

    const updatedUser = db.prepare('SELECT * FROM USERS WHERE USER_ID = ?').get(userId);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
