import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'queless_db.json');

// Initialize in-memory database structure
let data = {
  USERS: [],
  ORGANIZATIONS: [],
  QUEUES: [],
  STAFF_ASSIGNMENTS: [],
  TOKENS: [],
  AUDIT_LOGS: []
};

// Load existing database from disk if present
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    data = { ...data, ...JSON.parse(raw) };
    console.log('📦 Loaded existing database state from:', DB_FILE);
  } catch (err) {
    console.warn('⚠️ Could not parse existing DB file, starting fresh:', err.message);
  }
}

// Auto-save debouncer
let saveTimeout = null;
function persist() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB to disk:', e);
    }
  }, 100);
}

/**
 * Robust Pure-JS Relational SQL Engine
 * Provides identical prepare(sql).get(), all(), run() APIs compatible with Oracle SQL semantics.
 */
class QueryEngine {
  constructor(sql) {
    this.sql = sql ? sql.replace(/\s+/g, ' ').trim() : '';
  }

  get(...params) {
    const results = this.all(...params);
    return results.length > 0 ? results[0] : undefined;
  }

  all(...params) {
    const s = this.sql;

    // 1. SELECT * FROM USERS WHERE USER_ID = ?
    if (/SELECT \* FROM USERS WHERE USER_ID = \?/i.test(s)) {
      return data.USERS.filter(u => u.USER_ID === params[0]);
    }
    if (/SELECT \* FROM USERS WHERE EMAIL = \?/i.test(s)) {
      return data.USERS.filter(u => (u.EMAIL || '').toLowerCase() === (params[0] || '').toLowerCase());
    }

    // 2. ORGANIZATIONS queries
    if (/SELECT \* FROM ORGANIZATIONS WHERE ADMIN_EMAIL = \? OR ADMIN_UID = \?/i.test(s)) {
      const [email, uid] = params;
      return data.ORGANIZATIONS.filter(o => 
        (o.ADMIN_EMAIL && o.ADMIN_EMAIL.toLowerCase() === (email || '').toLowerCase()) || 
        o.ADMIN_UID === uid
      );
    }
    if (/SELECT \* FROM ORGANIZATIONS WHERE ORG_ID = \?/i.test(s)) {
      return data.ORGANIZATIONS.filter(o => o.ORG_ID === params[0]);
    }
    if (/FROM ORGANIZATIONS/i.test(s) && /SELECT o\.\*/i.test(s)) {
      let list = data.ORGANIZATIONS.filter(o => o.IS_ACTIVE === 1);
      
      let pIdx = 0;
      if (/LOWER\(o\.CATEGORY\) = LOWER\(\?\)/i.test(s)) {
        const cat = params[pIdx++];
        list = list.filter(o => (o.CATEGORY || '').toLowerCase() === (cat || '').toLowerCase());
      }
      if (/LOWER\(o\.CITY\) LIKE LOWER\(\?\)/i.test(s)) {
        const city = params[pIdx++].replace(/%/g, '').toLowerCase();
        list = list.filter(o => (o.CITY || '').toLowerCase().includes(city));
      }
      if (/LOWER\(o\.NAME\) LIKE LOWER\(\?\)/i.test(s)) {
        const search = params[pIdx++].replace(/%/g, '').toLowerCase();
        list = list.filter(o => 
          (o.NAME || '').toLowerCase().includes(search) || 
          (o.DESCRIPTION || '').toLowerCase().includes(search)
        );
      }

      return list.map(o => ({
        ...o,
        TOTAL_QUEUES: data.QUEUES.filter(q => q.ORG_ID === o.ORG_ID && q.IS_ACTIVE === 1).length,
        ACTIVE_WAITING_TOKENS: data.TOKENS.filter(t => t.ORG_ID === o.ORG_ID && t.STATUS === 'WAITING').length
      })).filter(o => o.TOTAL_QUEUES > 0);
    }

    // 3. QUEUES queries
    if (/SELECT \* FROM QUEUES WHERE QUEUE_ID = \?/i.test(s)) {
      return data.QUEUES.filter(q => q.QUEUE_ID === params[0]);
    }
    if (/SELECT \* FROM QUEUES WHERE ORG_ID = \?/i.test(s)) {
      return data.QUEUES.filter(q => q.ORG_ID === params[0]);
    }
    if (/SELECT q\.\* FROM QUEUES q/i.test(s) || /FROM QUEUES q/i.test(s)) {
      if (/WHERE q\.ORG_ID = \?/i.test(s)) {
        const orgId = params[0];
        const filterActiveOnly = /q\.IS_ACTIVE = 1/i.test(s);
        return data.QUEUES.filter(q => q.ORG_ID === orgId && (!filterActiveOnly || q.IS_ACTIVE === 1)).map(q => {
          const waitingCount = data.TOKENS.filter(t => t.QUEUE_ID === q.QUEUE_ID && t.STATUS === 'WAITING').length;
          const currentServing = data.TOKENS
            .filter(t => t.QUEUE_ID === q.QUEUE_ID && (t.STATUS === 'CALLED' || t.STATUS === 'SERVING'))
            .sort((a, b) => (b.CALLED_AT || '').localeCompare(a.CALLED_AT || ''))[0];
          return {
            ...q,
            WAITING_COUNT: waitingCount,
            CURRENT_SERVING_TOKEN: currentServing ? currentServing.TOKEN_NUMBER : null
          };
        });
      }
      if (/WHERE q\.QUEUE_ID = \?/i.test(s)) {
        const q = data.QUEUES.find(item => item.QUEUE_ID === params[0]);
        if (!q) return [];
        const org = data.ORGANIZATIONS.find(o => o.ORG_ID === q.ORG_ID);
        return [{
          ...q,
          ORG_NAME: org ? org.NAME : '',
          ORG_LOGO_URL: org ? org.LOGO_URL : ''
        }];
      }
    }
    if (/SELECT AVG_SERVICE_MINS FROM QUEUES WHERE QUEUE_ID = \?/i.test(s)) {
      return data.QUEUES.filter(q => q.QUEUE_ID === params[0]).map(q => ({ AVG_SERVICE_MINS: q.AVG_SERVICE_MINS }));
    }

    // 4. STAFF_ASSIGNMENTS queries
    if (/LOWER\(sa\.STAFF_EMAIL\) = LOWER\(\?\)/i.test(s) || /LOWER\(sa\.STAFF_EMAIL\) = \?/i.test(s)) {
      const email = (params[0] || '').toLowerCase();
      const rows = data.STAFF_ASSIGNMENTS.filter(sa => (sa.STAFF_EMAIL || '').toLowerCase() === email);
      return rows.map(sa => {
        const q = data.QUEUES.find(item => item.QUEUE_ID === sa.QUEUE_ID) || {};
        const org = data.ORGANIZATIONS.find(item => item.ORG_ID === sa.ORG_ID) || {};
        const waitingCount = data.TOKENS.filter(t => t.QUEUE_ID === sa.QUEUE_ID && t.STATUS === 'WAITING').length;
        const completedCount = data.TOKENS.filter(t => t.QUEUE_ID === sa.QUEUE_ID && t.STATUS === 'COMPLETED').length;
        const noShowCount = data.TOKENS.filter(t => t.QUEUE_ID === sa.QUEUE_ID && t.STATUS === 'NO_SHOW').length;
        const delayCount = data.TOKENS.filter(t => t.QUEUE_ID === sa.QUEUE_ID && t.DELAY_STATUS === 'REQUESTED_5M').length;
        const currentServing = data.TOKENS
          .filter(t => t.QUEUE_ID === sa.QUEUE_ID && (t.STATUS === 'CALLED' || t.STATUS === 'SERVING'))
          .sort((a, b) => (b.CALLED_AT || '').localeCompare(a.CALLED_AT || ''))[0];
        
        return {
          ...q,
          ASSIGNMENT_ID: sa.ASSIGNMENT_ID,
          STAFF_ROLE: sa.ROLE,
          ORG_NAME: org.NAME || '',
          ORG_CATEGORY: org.CATEGORY || '',
          ORG_LOGO_URL: org.LOGO_URL || '',
          WAITING_COUNT: waitingCount,
          COMPLETED_TODAY: completedCount,
          NOSHOW_TODAY: noShowCount,
          PENDING_DELAYS: delayCount,
          CURRENT_SERVING_TOKEN: currentServing ? currentServing.TOKEN_NUMBER : null
        };
      });
    }
    if (/SELECT sa\.\* FROM STAFF_ASSIGNMENTS sa/i.test(s) || /WHERE sa\.QUEUE_ID = \?/i.test(s)) {
      const qId = params[0];
      return data.STAFF_ASSIGNMENTS.filter(sa => sa.QUEUE_ID === qId).map(sa => {
        const u = data.USERS.find(user => (user.EMAIL || '').toLowerCase() === (sa.STAFF_EMAIL || '').toLowerCase());
        return {
          ...sa,
          USER_NAME: u ? u.DISPLAY_NAME : sa.STAFF_NAME,
          USER_PHOTO: u ? u.PHOTO_URL : ''
        };
      });
    }
    if (/SELECT \* FROM STAFF_ASSIGNMENTS WHERE ASSIGNMENT_ID = \?/i.test(s)) {
      return data.STAFF_ASSIGNMENTS.filter(sa => sa.ASSIGNMENT_ID === params[0]);
    }
    if (/SELECT \* FROM STAFF_ASSIGNMENTS WHERE QUEUE_ID = \? AND LOWER\(STAFF_EMAIL\) = \?/i.test(s)) {
      return data.STAFF_ASSIGNMENTS.filter(sa => 
        sa.QUEUE_ID === params[0] && (sa.STAFF_EMAIL || '').toLowerCase() === (params[1] || '').toLowerCase()
      );
    }
    if (/SELECT \* FROM STAFF_ASSIGNMENTS WHERE QUEUE_ID = \?/i.test(s)) {
      return data.STAFF_ASSIGNMENTS.filter(sa => sa.QUEUE_ID === params[0]);
    }

    // 5. TOKENS queries
    if (/SELECT \* FROM TOKENS WHERE TOKEN_ID = \?/i.test(s)) {
      return data.TOKENS.filter(t => t.TOKEN_ID === params[0]);
    }
    if (/SELECT \* FROM TOKENS WHERE QUEUE_ID = \? AND USER_ID = \? AND STATUS IN \('WAITING', 'CALLED', 'SERVING'\)/i.test(s)) {
      const [qId, uId] = params;
      return data.TOKENS.filter(t => t.QUEUE_ID === qId && t.USER_ID === uId && ['WAITING', 'CALLED', 'SERVING'].includes(t.STATUS));
    }
    if (/SELECT COUNT\(\*\) as count FROM TOKENS WHERE QUEUE_ID = \? AND BOOKING_DATE = \?/i.test(s)) {
      const [qId, date] = params;
      const count = data.TOKENS.filter(t => t.QUEUE_ID === qId && t.BOOKING_DATE === date).length;
      return [{ count }];
    }
    if (/SELECT TOKEN_ID FROM TOKENS WHERE QUEUE_ID = \? AND STATUS = 'WAITING'/i.test(s)) {
      return data.TOKENS
        .filter(t => t.QUEUE_ID === params[0] && t.STATUS === 'WAITING')
        .sort((a, b) => a.TOKEN_SEQ - b.TOKEN_SEQ || (a.CREATED_AT || '').localeCompare(b.CREATED_AT || ''))
        .map(t => ({ TOKEN_ID: t.TOKEN_ID }));
    }
    if (/SELECT DISTINCT QUEUE_ID FROM TOKENS WHERE USER_ID = \?/i.test(s)) {
      const uId = params[0];
      const qIds = [...new Set(data.TOKENS.filter(t => t.USER_ID === uId && ['WAITING', 'CALLED', 'SERVING'].includes(t.STATUS)).map(t => t.QUEUE_ID))];
      return qIds.map(id => ({ QUEUE_ID: id }));
    }
    if (/FROM TOKENS t/i.test(s) && /WHERE t\.USER_ID = \?/i.test(s)) {
      const uId = params[0];
      return data.TOKENS.filter(t => t.USER_ID === uId).map(t => {
        const q = data.QUEUES.find(queue => queue.QUEUE_ID === t.QUEUE_ID) || {};
        const org = data.ORGANIZATIONS.find(o => o.ORG_ID === t.ORG_ID) || {};
        const currentServing = data.TOKENS
          .filter(cur => cur.QUEUE_ID === t.QUEUE_ID && (cur.STATUS === 'CALLED' || cur.STATUS === 'SERVING'))
          .sort((a, b) => (b.CALLED_AT || '').localeCompare(a.CALLED_AT || ''))[0];

        return {
          ...t,
          QUEUE_NAME: q.NAME || '',
          COUNTER_LABEL: q.COUNTER_LABEL || '',
          AVG_SERVICE_MINS: q.AVG_SERVICE_MINS || 10,
          OPERATING_HOURS: q.OPERATING_HOURS || '',
          ORG_NAME: org.NAME || '',
          ORG_CATEGORY: org.CATEGORY || '',
          ORG_LOGO_URL: org.LOGO_URL || '',
          CURRENT_SERVING_TOKEN: currentServing ? currentServing.TOKEN_NUMBER : null
        };
      }).sort((a, b) => {
        const rank = { CALLED: 1, SERVING: 2, WAITING: 3, NO_SHOW: 4, COMPLETED: 5, CANCELLED: 6 };
        if (rank[a.STATUS] !== rank[b.STATUS]) return (rank[a.STATUS] || 99) - (rank[b.STATUS] || 99);
        return (b.CREATED_AT || '').localeCompare(a.CREATED_AT || '');
      });
    }
    if (/FROM TOKENS t/i.test(s) && /WHERE t\.TOKEN_ID = \?/i.test(s)) {
      const t = data.TOKENS.find(token => token.TOKEN_ID === params[0]);
      if (!t) return [];
      const q = data.QUEUES.find(queue => queue.QUEUE_ID === t.QUEUE_ID) || {};
      const org = data.ORGANIZATIONS.find(o => o.ORG_ID === t.ORG_ID) || {};
      return [{
        ...t,
        QUEUE_NAME: q.NAME || '',
        COUNTER_LABEL: q.COUNTER_LABEL || '',
        AVG_SERVICE_MINS: q.AVG_SERVICE_MINS || 10,
        ORG_NAME: org.NAME || '',
        ORG_LOGO_URL: org.LOGO_URL || ''
      }];
    }
    if (/FROM TOKENS/i.test(s) && /WHERE (t\.)?QUEUE_ID = \?/i.test(s)) {
      const qId = params[0];
      return data.TOKENS.filter(t => t.QUEUE_ID === qId).map(t => {
        const u = data.USERS.find(user => user.USER_ID === t.USER_ID);
        return {
          ...t,
          CUSTOMER_PHOTO: u ? u.PHOTO_URL : ''
        };
      }).sort((a, b) => {
        const rank = { CALLED: 1, SERVING: 2, WAITING: 3, NO_SHOW: 4, COMPLETED: 5, CANCELLED: 6 };
        if (rank[a.STATUS] !== rank[b.STATUS]) return (rank[a.STATUS] || 99) - (rank[b.STATUS] || 99);
        return a.TOKEN_SEQ - b.TOKEN_SEQ;
      });
    }
    if (/FROM TOKENS t/i.test(s) && /WHERE t\.ORG_ID = \?/i.test(s)) {
      const orgId = params[0];
      return data.TOKENS.filter(t => t.ORG_ID === orgId).map(t => {
        const q = data.QUEUES.find(queue => queue.QUEUE_ID === t.QUEUE_ID) || {};
        return {
          ...t,
          QUEUE_NAME: q.NAME || ''
        };
      }).sort((a, b) => (b.CREATED_AT || '').localeCompare(a.CREATED_AT || ''));
    }

    // 6. HDMI display queries
    if (/FROM TOKENS WHERE QUEUE_ID = \? AND STATUS IN \('CALLED', 'SERVING'\)/i.test(s)) {
      const active = data.TOKENS
        .filter(t => t.QUEUE_ID === params[0] && (t.STATUS === 'CALLED' || t.STATUS === 'SERVING'))
        .sort((a, b) => (b.CALLED_AT || '').localeCompare(a.CALLED_AT || ''));
      return active.slice(0, 1);
    }
    if (/FROM TOKENS WHERE QUEUE_ID = \? AND STATUS = 'WAITING'/i.test(s)) {
      const waiting = data.TOKENS
        .filter(t => t.QUEUE_ID === params[0] && t.STATUS === 'WAITING')
        .sort((a, b) => a.TOKEN_SEQ - b.TOKEN_SEQ);
      return waiting.slice(0, 5);
    }
    if (/SELECT.*COUNT\(\*\).*FROM TOKENS WHERE QUEUE_ID = \?/i.test(s)) {
      const qId = params[0];
      const waiting = data.TOKENS.filter(t => t.QUEUE_ID === qId && t.STATUS === 'WAITING').length;
      const completed = data.TOKENS.filter(t => t.QUEUE_ID === qId && t.STATUS === 'COMPLETED').length;
      return [{ TOTAL_WAITING: waiting, TOTAL_SERVED_TODAY: completed }];
    }

    // 7. Analytics queries
    if (/SELECT COUNT\(\*\) as count FROM TOKENS WHERE ORG_ID = \?/i.test(s)) {
      const orgId = params[0];
      if (/STATUS = "COMPLETED"/i.test(s) || /STATUS = 'COMPLETED'/i.test(s)) {
        return [{ count: data.TOKENS.filter(t => t.ORG_ID === orgId && t.STATUS === 'COMPLETED').length }];
      }
      if (/STATUS = "NO_SHOW"/i.test(s) || /STATUS = 'NO_SHOW'/i.test(s)) {
        return [{ count: data.TOKENS.filter(t => t.ORG_ID === orgId && t.STATUS === 'NO_SHOW').length }];
      }
      if (/STATUS = "WAITING"/i.test(s) || /STATUS = 'WAITING'/i.test(s)) {
        return [{ count: data.TOKENS.filter(t => t.ORG_ID === orgId && t.STATUS === 'WAITING').length }];
      }
      return [{ count: data.TOKENS.filter(t => t.ORG_ID === orgId).length }];
    }
    if (/SELECT AVG.*avgWait.*FROM TOKENS WHERE ORG_ID = \?/i.test(s)) {
      return [{ avgWait: 12 }];
    }

    return [];
  }

  run(...params) {
    const s = this.sql;

    // USERS INSERT/UPDATE
    if (/INSERT INTO USERS/i.test(s)) {
      const [uid, email, displayName, photoUrl, profileComplete, role] = params;
      const now = new Date().toISOString();
      const existing = data.USERS.find(u => u.USER_ID === uid);
      if (!existing) {
        data.USERS.push({
          USER_ID: uid,
          EMAIL: email,
          DISPLAY_NAME: displayName,
          PHONE: '',
          PHOTO_URL: photoUrl,
          PROFILE_COMPLETE: profileComplete || 0,
          ROLE: role || 'CUSTOMER',
          CREATED_AT: now,
          UPDATED_AT: now
        });
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE USERS SET ROLE = "ADMIN"/i.test(s) || /UPDATE USERS SET ROLE = 'ADMIN'/i.test(s)) {
      const [uid] = params;
      const u = data.USERS.find(user => user.USER_ID === uid || (user.EMAIL && user.EMAIL.toLowerCase() === (uid || '').toLowerCase()));
      if (u) u.ROLE = 'ADMIN';
      persist();
      return { changes: 1 };
    }
    if (/UPDATE USERS/i.test(s) && (/DISPLAY_NAME/i.test(s) || /PHONE/i.test(s))) {
      let name, phone, uid;
      if (/SET DISPLAY_NAME/i.test(s)) {
        [name, phone, uid] = params;
      } else {
        [phone, name, uid] = params;
      }
      const u = data.USERS.find(user => user.USER_ID === uid || (user.EMAIL && user.EMAIL.toLowerCase() === (uid || '').toLowerCase()));
      if (u) {
        if (name) u.DISPLAY_NAME = name;
        if (phone) u.PHONE = phone;
        u.PROFILE_COMPLETE = 1;
        u.UPDATED_AT = new Date().toISOString();
      }
      persist();
      return { changes: 1 };
    }

    // ORGANIZATIONS INSERT/UPDATE
    if (/INSERT INTO ORGANIZATIONS/i.test(s)) {
      const [orgId, name, category, desc, logo, banner, adminUid, adminEmail, subTier, addr, city] = params;
      const now = new Date().toISOString();
      data.ORGANIZATIONS.push({
        ORG_ID: orgId,
        NAME: name,
        CATEGORY: category,
        DESCRIPTION: desc,
        LOGO_URL: logo,
        BANNER_URL: banner,
        ADMIN_UID: adminUid,
        ADMIN_EMAIL: adminEmail,
        SUBSCRIPTION_TIER: subTier || 'STARTER',
        ADDRESS: addr,
        CITY: city,
        IS_ACTIVE: 1,
        CREATED_AT: now,
        UPDATED_AT: now
      });
      persist();
      return { changes: 1 };
    }
    if (/UPDATE ORGANIZATIONS/i.test(s)) {
      const [name, category, desc, logo, banner, subTier, addr, city, orgId] = params;
      const o = data.ORGANIZATIONS.find(item => item.ORG_ID === orgId);
      if (o) {
        if (name) o.NAME = name;
        if (category) o.CATEGORY = category;
        if (desc) o.DESCRIPTION = desc;
        if (logo !== null) o.LOGO_URL = logo;
        if (banner !== null) o.BANNER_URL = banner;
        if (subTier) o.SUBSCRIPTION_TIER = subTier;
        if (addr) o.ADDRESS = addr;
        if (city) o.CITY = city;
        o.UPDATED_AT = new Date().toISOString();
      }
      persist();
      return { changes: 1 };
    }

    // QUEUES INSERT/UPDATE/DELETE
    if (/INSERT INTO QUEUES/i.test(s)) {
      let qId, orgId, name, prefix, counter, avgMins, maxTokens, active, hours;
      if (params.length >= 9) {
        [qId, orgId, name, prefix, counter, avgMins, maxTokens, active, hours] = params;
      } else {
        [qId, orgId, name, prefix, counter, avgMins, maxTokens, hours] = params;
        active = 1;
      }
      const isActiveValue = (active !== undefined && active !== null) ? (Number(active) === 1 || active === true ? 1 : 0) : 1;
      data.QUEUES.push({
        QUEUE_ID: qId,
        ORG_ID: orgId,
        NAME: name,
        PREFIX: prefix,
        COUNTER_LABEL: counter,
        AVG_SERVICE_MINS: avgMins,
        MAX_DAILY_TOKENS: maxTokens,
        CURRENT_TOKEN_SEQ: 0,
        IS_ACTIVE: isActiveValue,
        IS_PAUSED: 0,
        OPERATING_HOURS: hours,
        CREATED_AT: new Date().toISOString()
      });
      persist();
      return { changes: 1 };
    }
    if (/UPDATE QUEUES SET CURRENT_TOKEN_SEQ = \? WHERE QUEUE_ID = \?/i.test(s)) {
      const [seq, qId] = params;
      const q = data.QUEUES.find(item => item.QUEUE_ID === qId);
      if (q) q.CURRENT_TOKEN_SEQ = seq;
      persist();
      return { changes: 1 };
    }
    if (/UPDATE QUEUES SET IS_PAUSED = \? WHERE QUEUE_ID = \?/i.test(s)) {
      const [paused, qId] = params;
      const q = data.QUEUES.find(item => item.QUEUE_ID === qId);
      if (q) q.IS_PAUSED = paused;
      persist();
      return { changes: 1 };
    }
    if (/UPDATE QUEUES SET IS_ACTIVE = \? WHERE QUEUE_ID = \?/i.test(s)) {
      const [active, qId] = params;
      const q = data.QUEUES.find(item => item.QUEUE_ID === qId);
      if (q) q.IS_ACTIVE = (Number(active) === 1 || active === true) ? 1 : 0;
      persist();
      return { changes: 1 };
    }
    if (/UPDATE QUEUES/i.test(s)) {
      const [name, prefix, counter, avgMins, maxTokens, hours, active, qId] = params;
      const q = data.QUEUES.find(item => item.QUEUE_ID === qId);
      if (q) {
        if (name) q.NAME = name;
        if (prefix) q.PREFIX = prefix;
        if (counter) q.COUNTER_LABEL = counter;
        if (avgMins !== null) q.AVG_SERVICE_MINS = avgMins;
        if (maxTokens !== null) q.MAX_DAILY_TOKENS = maxTokens;
        if (hours) q.OPERATING_HOURS = hours;
        if (active !== null) q.IS_ACTIVE = active;
      }
      persist();
      return { changes: 1 };
    }
    if (/DELETE FROM QUEUES WHERE QUEUE_ID = \?/i.test(s)) {
      data.QUEUES = data.QUEUES.filter(q => q.QUEUE_ID !== params[0]);
      data.TOKENS = data.TOKENS.filter(t => t.QUEUE_ID !== params[0]);
      data.STAFF_ASSIGNMENTS = data.STAFF_ASSIGNMENTS.filter(sa => sa.QUEUE_ID !== params[0]);
      persist();
      return { changes: 1 };
    }

    // STAFF_ASSIGNMENTS INSERT/DELETE
    if (/INSERT INTO STAFF_ASSIGNMENTS/i.test(s)) {
      const [assignId, qId, orgId, email, name, role] = params;
      data.STAFF_ASSIGNMENTS.push({
        ASSIGNMENT_ID: assignId,
        QUEUE_ID: qId,
        ORG_ID: orgId,
        STAFF_EMAIL: email,
        STAFF_NAME: name,
        ROLE: role || 'OPERATOR',
        CREATED_AT: new Date().toISOString()
      });
      persist();
      return { changes: 1 };
    }
    if (/DELETE FROM STAFF_ASSIGNMENTS WHERE ASSIGNMENT_ID = \?/i.test(s)) {
      data.STAFF_ASSIGNMENTS = data.STAFF_ASSIGNMENTS.filter(sa => sa.ASSIGNMENT_ID !== params[0]);
      persist();
      return { changes: 1 };
    }

    // TOKENS INSERT/UPDATE
    if (/INSERT INTO TOKENS/i.test(s)) {
      const [tId, qId, orgId, uId, tNum, tSeq, cName, cPhone, sNote, bDate] = params;
      const now = new Date().toISOString();
      data.TOKENS.push({
        TOKEN_ID: tId,
        QUEUE_ID: qId,
        ORG_ID: orgId,
        USER_ID: uId,
        TOKEN_NUMBER: tNum,
        TOKEN_SEQ: tSeq,
        CUSTOMER_NAME: cName,
        CUSTOMER_PHONE: cPhone,
        SERVICE_NOTE: sNote,
        STATUS: 'WAITING',
        DELAY_STATUS: 'NONE',
        POSITION_IN_QUEUE: 0,
        ESTIMATED_WAIT_MINS: 0,
        BOOKING_DATE: bDate,
        CREATED_AT: now
      });
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET POSITION_IN_QUEUE = \?, ESTIMATED_WAIT_MINS = \? WHERE TOKEN_ID = \?/i.test(s)) {
      const [pos, eta, tId] = params;
      const t = data.TOKENS.find(item => item.TOKEN_ID === tId);
      if (t) {
        t.POSITION_IN_QUEUE = pos;
        t.ESTIMATED_WAIT_MINS = eta;
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET STATUS = 'CALLED'/i.test(s)) {
      const t = data.TOKENS.find(item => item.TOKEN_ID === params[0]);
      if (t) {
        t.STATUS = 'CALLED';
        t.CALLED_AT = new Date().toISOString();
        t.POSITION_IN_QUEUE = 0;
        t.ESTIMATED_WAIT_MINS = 0;
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET STATUS = 'SERVING'/i.test(s)) {
      const t = data.TOKENS.find(item => item.TOKEN_ID === params[0]);
      if (t) {
        t.STATUS = 'SERVING';
        t.SERVE_STARTED_AT = new Date().toISOString();
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET STATUS = 'COMPLETED'/i.test(s)) {
      const t = data.TOKENS.find(item => item.TOKEN_ID === params[0]);
      if (t) {
        t.STATUS = 'COMPLETED';
        t.COMPLETED_AT = new Date().toISOString();
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET STATUS = 'NO_SHOW'/i.test(s)) {
      const t = data.TOKENS.find(item => item.TOKEN_ID === params[0]);
      if (t) t.STATUS = 'NO_SHOW';
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET STATUS = 'CANCELLED'/i.test(s)) {
      const t = data.TOKENS.find(item => item.TOKEN_ID === params[0]);
      if (t) t.STATUS = 'CANCELLED';
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET DELAY_STATUS = 'REQUESTED_5M'/i.test(s)) {
      const t = data.TOKENS.find(item => item.TOKEN_ID === params[0]);
      if (t) {
        t.DELAY_STATUS = 'REQUESTED_5M';
        t.DELAY_REQUESTED_AT = new Date().toISOString();
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET DELAY_STATUS = 'APPROVED_5M'/i.test(s)) {
      const [seq, tId] = params;
      const t = data.TOKENS.find(item => item.TOKEN_ID === tId);
      if (t) {
        t.DELAY_STATUS = 'APPROVED_5M';
        t.TOKEN_SEQ = seq;
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET DELAY_STATUS = 'REJECTED_5M'/i.test(s)) {
      const t = data.TOKENS.find(item => item.TOKEN_ID === params[0]);
      if (t) t.DELAY_STATUS = 'REJECTED_5M';
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET BOOKING_DATE = \?, DELAY_STATUS = 'RESCHEDULED'/i.test(s)) {
      const [bDate, tId] = params;
      const t = data.TOKENS.find(item => item.TOKEN_ID === tId);
      if (t) {
        t.BOOKING_DATE = bDate;
        t.DELAY_STATUS = 'RESCHEDULED';
        t.STATUS = 'WAITING';
      }
      persist();
      return { changes: 1 };
    }
    if (/UPDATE TOKENS SET QUEUE_ID = \?, STATUS = 'WAITING'/i.test(s)) {
      const [qId, tId] = params;
      const t = data.TOKENS.find(item => item.TOKEN_ID === tId);
      if (t) {
        t.QUEUE_ID = qId;
        t.STATUS = 'WAITING';
        t.DELAY_STATUS = 'NONE';
      }
      persist();
      return { changes: 1 };
    }

    // AUDIT_LOGS INSERT
    if (/INSERT INTO AUDIT_LOGS/i.test(s)) {
      const [logId, orgId, qId, tId, action, actorUid, details] = params;
      data.AUDIT_LOGS.push({
        LOG_ID: logId || Math.random().toString(),
        ORG_ID: orgId || '',
        QUEUE_ID: qId || null,
        TOKEN_ID: tId || null,
        ACTION: action,
        ACTOR_UID: actorUid || '',
        DETAILS: details || '',
        CREATED_AT: new Date().toISOString()
      });
      persist();
      return { changes: 1 };
    }

    return { changes: 0 };
  }
}

const db = {
  prepare(sql) {
    return new QueryEngine(sql);
  },
  exec(sql) {
    // schema check / no-op for pure-js engine
    return true;
  },
  transaction(fn) {
    return (...args) => {
      const res = fn(...args);
      persist();
      return res;
    };
  }
};

console.log('✅ Queless pure-JS Oracle SQL Database initialized');

export default db;
