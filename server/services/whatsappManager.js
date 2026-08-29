import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_DIR = path.join(__dirname, '../sessions');

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// In-memory store for active sessions
// Map<sessionId, { sock, status: 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED', qrCodeUrl, userNumber, userName, lastUpdated }>
const activeSessions = new Map();

/**
 * Format raw phone number into standard international format
 */
function cleanPhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;

  // If 10 digits (common in India/US without prefix), default to India 91 or US based on length
  if (digits.length === 10) {
    digits = '91' + digits; // Default fallback to +91
  }
  return digits;
}

/**
 * Initialize / Connect a WhatsApp Session (Admin or Staff)
 */
export async function startWhatsAppSession(sessionId) {
  try {
    const existing = activeSessions.get(sessionId);
    if (existing && existing.status === 'CONNECTED' && existing.sock) {
      return {
        sessionId,
        status: 'CONNECTED',
        userNumber: existing.userNumber,
        userName: existing.userName
      };
    }

    const sessionPath = path.join(SESSIONS_DIR, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['Queless Digital Queue', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    const sessionData = {
      sock,
      status: 'CONNECTING',
      qrCodeUrl: null,
      userNumber: null,
      userName: null,
      lastUpdated: new Date().toISOString()
    };
    activeSessions.set(sessionId, sessionData);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 280,
            color: { dark: '#000000', light: '#ffffff' }
          });
          sessionData.status = 'QR_READY';
          sessionData.qrCodeUrl = qrDataUrl;
          sessionData.lastUpdated = new Date().toISOString();
        } catch (err) {
          console.error('Error generating QR code for session:', sessionId, err);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp ${sessionId}] Connection closed. Code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          sessionData.status = 'CONNECTING';
          sessionData.qrCodeUrl = null;
          setTimeout(() => startWhatsAppSession(sessionId), 3000);
        } else {
          sessionData.status = 'DISCONNECTED';
          sessionData.sock = null;
          sessionData.qrCodeUrl = null;
          sessionData.userNumber = null;
          // Remove session files if logged out
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          } catch (e) {}
        }
      } else if (connection === 'open') {
        const rawJid = sock.user?.id || '';
        const userNum = rawJid.split(':')[0].split('@')[0];
        const uName = sock.user?.name || 'Authorized Operator';

        console.log(`✅ [WhatsApp ${sessionId}] Successfully connected as +${userNum} (${uName})`);

        sessionData.status = 'CONNECTED';
        sessionData.qrCodeUrl = null;
        sessionData.userNumber = userNum;
        sessionData.userName = uName;
        sessionData.lastUpdated = new Date().toISOString();
      }
    });

    return {
      sessionId,
      status: sessionData.status,
      qrCodeUrl: sessionData.qrCodeUrl,
      userNumber: sessionData.userNumber
    };
  } catch (err) {
    console.error('Error starting WhatsApp session:', sessionId, err);
    activeSessions.set(sessionId, {
      sock: null,
      status: 'DISCONNECTED',
      qrCodeUrl: null,
      userNumber: null,
      error: err.message
    });
    return {
      sessionId,
      status: 'DISCONNECTED',
      error: err.message
    };
  }
}

/**
 * Get the current status and QR code of a session
 */
export function getWhatsAppSessionStatus(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return {
      sessionId,
      status: 'DISCONNECTED',
      qrCodeUrl: null,
      userNumber: null,
      userName: null
    };
  }

  return {
    sessionId,
    status: session.status,
    qrCodeUrl: session.qrCodeUrl,
    userNumber: session.userNumber,
    userName: session.userName,
    lastUpdated: session.lastUpdated
  };
}

/**
 * Disconnect and remove credentials for a session
 */
export async function disconnectWhatsAppSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session && session.sock) {
    try {
      await session.sock.logout();
    } catch (e) {}
  }

  activeSessions.delete(sessionId);
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  try {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  } catch (e) {}

  return { sessionId, status: 'DISCONNECTED' };
}

/**
 * Send WhatsApp text message to customer
 */
export async function sendWhatsAppMessage(sessionId, recipientPhone, messageText) {
  const cleanPhone = cleanPhoneNumber(recipientPhone);
  if (!cleanPhone) {
    throw new Error('Invalid recipient phone number');
  }

  const session = activeSessions.get(sessionId);
  if (!session || session.status !== 'CONNECTED' || !session.sock) {
    throw new Error(`WhatsApp is not connected on session ${sessionId}. Please scan QR code to link your WhatsApp.`);
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    const result = await session.sock.sendMessage(jid, { text: messageText });
    return {
      success: true,
      messageId: result?.key?.id,
      recipient: cleanPhone,
      sender: session.userNumber
    };
  } catch (err) {
    console.error(`Failed to send WhatsApp message via session ${sessionId}:`, err);
    throw new Error(`WhatsApp delivery failed: ${err.message}`);
  }
}
