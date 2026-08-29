import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. List / Search Organizations (Public)
router.get('/', (req, res) => {
  const { category, search, city } = req.query;
  
  let query = `
    SELECT o.*, 
      (SELECT COUNT(*) FROM QUEUES q WHERE q.ORG_ID = o.ORG_ID AND q.IS_ACTIVE = 1) as TOTAL_QUEUES,
      (SELECT COUNT(*) FROM TOKENS t WHERE t.ORG_ID = o.ORG_ID AND t.STATUS = 'WAITING') as ACTIVE_WAITING_TOKENS
    FROM ORGANIZATIONS o
    WHERE o.IS_ACTIVE = 1
  `;
  const params = [];

  if (category && category !== 'All' && category.trim() !== '') {
    query += ' AND LOWER(o.CATEGORY) = LOWER(?)';
    params.push(category);
  }

  if (city && city.trim() !== '') {
    query += ' AND LOWER(o.CITY) LIKE LOWER(?)';
    params.push(`%${city}%`);
  }

  if (search && search.trim() !== '') {
    query += ' AND (LOWER(o.NAME) LIKE LOWER(?) OR LOWER(o.DESCRIPTION) LIKE LOWER(?))';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY o.CREATED_AT DESC';

  const organizations = db.prepare(query).all(...params);
  res.json({ organizations });
});

// 2. Get Organization Details with its Queues (Direct Link / Shared Link / QR Code View)
router.get('/:id', (req, res) => {
  const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(req.params.id);

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // When visiting an organization via direct link or QR code, all counters are accessible to book
  const query = `
    SELECT q.*,
      (SELECT COUNT(*) FROM TOKENS t WHERE t.QUEUE_ID = q.QUEUE_ID AND t.STATUS = 'WAITING') as WAITING_COUNT,
      (SELECT TOKEN_NUMBER FROM TOKENS t WHERE t.QUEUE_ID = q.QUEUE_ID AND t.STATUS IN ('CALLED', 'SERVING') ORDER BY t.CALLED_AT DESC LIMIT 1) as CURRENT_SERVING_TOKEN
    FROM QUEUES q
    WHERE q.ORG_ID = ?
    ORDER BY q.CREATED_AT ASC
  `;

  const queues = db.prepare(query).all(req.params.id);

  res.json({ organization: org, queues });
});

// 3. Self-Service Register / Onboard New Organization (Authenticated)
router.post('/', authenticate, (req, res) => {
  const {
    name,
    category,
    description,
    logoUrl,
    bannerUrl,
    subscriptionTier = 'STARTER',
    address,
    city
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Organization name and category are required' });
  }

  const orgId = uuidv4();

  db.prepare(`
    INSERT INTO ORGANIZATIONS (
      ORG_ID, NAME, CATEGORY, DESCRIPTION, LOGO_URL, BANNER_URL,
      ADMIN_UID, ADMIN_EMAIL, SUBSCRIPTION_TIER, ADDRESS, CITY, IS_ACTIVE
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    orgId,
    name.trim(),
    category.trim(),
    description ? description.trim() : '',
    logoUrl || '',
    bannerUrl || '',
    req.user.USER_ID,
    req.user.EMAIL,
    subscriptionTier,
    address ? address.trim() : '',
    city ? city.trim() : ''
  );

  // Update user role to ADMIN if not already
  db.prepare('UPDATE USERS SET ROLE = "ADMIN" WHERE USER_ID = ?').run(req.user.USER_ID);

  // Log action in audit logs
  db.prepare(`
    INSERT INTO AUDIT_LOGS (LOG_ID, ORG_ID, ACTION, ACTOR_UID, DETAILS)
    VALUES (?, ?, 'ORGANIZATION_REGISTERED', ?, ?)
  `).run(uuidv4(), orgId, req.user.USER_ID, `Registered org: ${name} (${category})`);

  const createdOrg = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(orgId);

  res.status(201).json({
    message: 'Organization onboarded successfully',
    organization: createdOrg
  });
});

// 4. Update Organization Profile / Branding (Admin Only)
router.put('/:id', authenticate, (req, res) => {
  const org = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(req.params.id);

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Verify that requester is the admin of this organization
  if (org.ADMIN_EMAIL.toLowerCase() !== req.user.EMAIL.toLowerCase() && org.ADMIN_UID !== req.user.USER_ID) {
    return res.status(403).json({ error: 'Forbidden: You are not the admin of this organization' });
  }

  const {
    name,
    category,
    description,
    logoUrl,
    bannerUrl,
    subscriptionTier,
    address,
    city
  } = req.body;

  db.prepare(`
    UPDATE ORGANIZATIONS 
    SET NAME = COALESCE(?, NAME),
        CATEGORY = COALESCE(?, CATEGORY),
        DESCRIPTION = COALESCE(?, DESCRIPTION),
        LOGO_URL = COALESCE(?, LOGO_URL),
        BANNER_URL = COALESCE(?, BANNER_URL),
        SUBSCRIPTION_TIER = COALESCE(?, SUBSCRIPTION_TIER),
        ADDRESS = COALESCE(?, ADDRESS),
        CITY = COALESCE(?, CITY),
        UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ORG_ID = ?
  `).run(
    name ? name.trim() : null,
    category ? category.trim() : null,
    description ? description.trim() : null,
    logoUrl !== undefined ? logoUrl : null,
    bannerUrl !== undefined ? bannerUrl : null,
    subscriptionTier || null,
    address ? address.trim() : null,
    city ? city.trim() : null,
    req.params.id
  );

  const updatedOrg = db.prepare('SELECT * FROM ORGANIZATIONS WHERE ORG_ID = ?').get(req.params.id);

  res.json({
    message: 'Organization updated successfully',
    organization: updatedOrg
  });
});

export default router;
