import express from 'express';
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

export default router;
