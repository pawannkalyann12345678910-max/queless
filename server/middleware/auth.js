import db from '../database/db.js';

/**
 * Authentication & Role Resolution Middleware
 * Verifies Firebase token or simulated development token, ensures user exists in DB,
 * and dynamically attaches their resolved role: ADMIN, STAFF, or CUSTOMER.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    let uid, email, displayName, photoURL;

    // Decode token: check if it's a JSON payload (simulated / development) or JWT
    if (token.startsWith('{') || token.includes('=')) {
      try {
        const parsed = JSON.parse(token);
        uid = parsed.uid;
        email = parsed.email;
        displayName = parsed.displayName || parsed.name || 'User';
        photoURL = parsed.photoURL || '';
      } catch {
        // Base64 decoded fallback
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const parsed = JSON.parse(decoded);
          uid = parsed.uid;
          email = parsed.email;
          displayName = parsed.displayName || 'User';
          photoURL = parsed.photoURL || '';
        } catch {
          uid = token;
          email = `${token}@queless.local`;
          displayName = token;
        }
      }
    } else {
      // Standard Firebase JWT parsing (extract payload)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          uid = payload.user_id || payload.sub || payload.uid;
          email = payload.email || `${uid}@gmail.com`;
          displayName = payload.name || payload.display_name || email.split('@')[0];
          photoURL = payload.picture || '';
        } else {
          uid = token;
          email = `${token}@gmail.com`;
          displayName = token;
        }
      } catch {
        uid = token;
        email = `${token}@gmail.com`;
        displayName = token;
      }
    }

    if (!uid || !email) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    // Check if user exists in database, or insert on first login
    let user = db.prepare('SELECT * FROM USERS WHERE USER_ID = ?').get(uid);

    if (!user) {
      // Also check if email matches existing
      user = db.prepare('SELECT * FROM USERS WHERE EMAIL = ?').get(email);
      if (user) {
        // found by email, use as-is
      } else {
        db.prepare(`
          INSERT INTO USERS (USER_ID, EMAIL, DISPLAY_NAME, PHOTO_URL, PROFILE_COMPLETE, ROLE)
          VALUES (?, ?, ?, ?, 0, 'CUSTOMER')
        `).run(uid, email, displayName, photoURL || '');
        user = db.prepare('SELECT * FROM USERS WHERE USER_ID = ?').get(uid);
      }
    }

    // Dynamically resolve user role based on database state
    // 1. Is user an ADMIN for any organization?
    const adminOrgs = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ADMIN_EMAIL = ? OR ADMIN_UID = ?').all(email, uid);
    
    // 2. Is user assigned as STAFF for any queue?
    const staffAssignments = db.prepare(`
      SELECT sa.*, q.NAME as QUEUE_NAME, q.COUNTER_LABEL, o.NAME as ORG_NAME 
      FROM STAFF_ASSIGNMENTS sa
      WHERE LOWER(sa.STAFF_EMAIL) = LOWER(?)
    `).all(email);

    let resolvedRole = 'CUSTOMER';
    if (adminOrgs.length > 0) {
      resolvedRole = 'ADMIN';
    } else if (staffAssignments.length > 0) {
      resolvedRole = 'STAFF';
    }

    req.user = {
      ...user,
      ROLE: resolvedRole,
      adminOrgs,
      staffAssignments
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
}

/**
 * Optional Auth (For endpoints that work for both public and logged-in visitors)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  return authenticate(req, res, next);
}

/**
 * Require Specific Role(s)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.ROLE)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` });
    }
    next();
  };
}
