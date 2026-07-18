import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import {
  getAllDevices,
  saveDevice,
  getAllUsers,
  saveUser,
  getUser,
  getOrCreateConversation,
  saveMessage,
  getMessagesForConversation
} from './db.js';
import { Message, User } from './types.js';
import { backupSessionToSupabase, deleteSessionFromSupabase, restoreSessionFromSupabase } from './supabase.js';


// Map of active WhatsApp socket connections by device ID
export const activeSockets = new Map<string, any>();

// Map of active reconnect timeouts by device ID
export const activeReconnectTimeouts = new Map<string, NodeJS.Timeout>();

// Map of consecutive conflict disconnects by device ID to prevent infinite fight loops
export const conflictCounters = new Map<string, number>();

// Map of consecutive reconnection attempts by device ID
export const reconnectionAttempts = new Map<string, number>();

// Set of device IDs that are currently in the middle of being initialized
export const sessionsInProgress = new Set<string>();

/**
 * Helper to check if a device has stored credentials (indicating it has been paired/scanned before)
 */
export function hasSavedSession(deviceId: string): boolean {
  const credsPath = path.join(process.cwd(), 'whatsapp-sessions', deviceId, 'creds.json');
  return fs.existsSync(credsPath);
}

/**
 * Helper to resolve WhatsApp LID JIDs to real phone JIDs using multi-file auth files
 */
export function resolveLidToPhone(jid: string, deviceId: string): string {
  if (!jid) return jid;

  const parts = jid.split('@');
  const id = parts[0];
  const domain = parts[1] || '';

  // If it's an LID JID (either ends with @lid or we have a reverse mapping file for it)
  const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', deviceId);
  const reversePath = path.join(sessionPath, `lid-mapping-${id}_reverse.json`);

  if (fs.existsSync(reversePath)) {
    try {
      const mappedPhone = JSON.parse(fs.readFileSync(reversePath, 'utf8'));
      if (mappedPhone && typeof mappedPhone === 'string') {
        const resolved = `${mappedPhone}@s.whatsapp.net`;
        console.log(`[resolveLidToPhone] Resolved LID ${jid} to phone number JID: ${resolved}`);
        return resolved;
      }
    } catch (err) {
      console.error(`[resolveLidToPhone] Failed to read reverse LID mapping for ${id}:`, err);
    }
  }

  // Fallback if domain is specifically lid
  if (domain === 'lid') {
    return `${id}@s.whatsapp.net`;
  }

  return jid;
}

// Broadcast helper (will be injected by server.ts to push updates to front-end)
let broadcastUpdate: (event: any) => void = () => {};
export function setBroadcastHandler(handler: (event: any) => void) {
  broadcastUpdate = handler;
}

// AI Agent incoming message hook (injected by server.ts)
let incomingMessageHandler: (
  deviceId: string,
  sock: any,
  jid: string,
  pushName: string | undefined,
  messageContent: any,
  fromMe: boolean,
  timestamp: number,
  messageId: string
) => Promise<void> = async () => {};

export function setIncomingMessageHandler(handler: typeof incomingMessageHandler) {
  incomingMessageHandler = handler;
}

/**
 * Dynamically fetch and sync profile pictures of contacts from WhatsApp server
 */
async function syncProfilePicture(sock: any, jid: string, contactId: string) {
  try {
    if (!sock || !jid) return;
    
    // Check if the user already has a real WhatsApp profile picture URL
    const existing = getAllUsers().find((u) => u.id === contactId);
    if (existing && existing.avatarUrl && existing.avatarUrl.includes('pps.whatsapp.net')) {
      return; // Already loaded real WhatsApp avatar
    }

    const url = await sock.profilePictureUrl(jid, 'image');
    if (url) {
      const user = getAllUsers().find((u) => u.id === contactId);
      if (user) {
        user.avatarUrl = url;
        saveUser(user);
        broadcastUpdate({
          type: 'user:update',
          user
        });
      }
    }
  } catch (err) {
    // Silently ignore if profile picture is private, unavailable or rate-limited
  }
}

/**
 * Sync logged-in user profile details (avatar and username) from linked WhatsApp account
 */
async function syncOwnProfileDetails(sock: any) {
  try {
    if (!sock || !sock.user) return;
    const fullJid = sock.user.id || '';
    const cleanPhone = fullJid.split(':')[0] || fullJid.split('@')[0] || '';
    const jid = `${cleanPhone}@s.whatsapp.net`;
    
    // Fetch profile picture of own account
    const url = await sock.profilePictureUrl(jid, 'image').catch(() => null);
    const realName = sock.user.name || `+${cleanPhone}`;
    
    if (url || realName) {
      const dbUsers = getAllUsers();
      // Update any real non-contact logged-in users in our database
      for (const u of dbUsers) {
        if (u.id !== 'meta-ai' && !u.id.startsWith('contact_')) {
          let updated = false;
          if (url && u.avatarUrl !== url) {
            u.avatarUrl = url;
            updated = true;
          }
          // Only update name if it was a placeholder or generic
          if (realName && (u.username === 'user_default' || u.username.length <= 3 || u.username.match(/^\d+$/))) {
            u.username = realName;
            updated = true;
          }
          if (updated) {
            saveUser(u);
            broadcastUpdate({
              type: 'user:update',
              user: u
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error syncing own profile details:', err);
  }
}

/**
 * Get or create contact from real WhatsApp JID
 */
function getOrCreateContactUser(jid: string, pushName?: string) {
  const phonePrefix = jid.split('@')[0];
  const contactId = `contact_${phonePrefix}`;
  const existing = getAllUsers().find((u) => u.id === contactId);
  if (existing) {
    if (pushName && existing.username !== pushName && existing.username === `+${phonePrefix}`) {
      existing.username = pushName;
      saveUser(existing);
    }
    return existing;
  }

  const newContact: User = {
    id: contactId,
    username: pushName || `+${phonePrefix}`,
    avatarUrl: `https://images.unsplash.com/photo-${[
      '1535713875002-d1d0cf377fde',
      '1570295999919-56ceb5ecca61',
      '1633332755192-727a05c4013d',
      '1580489944761-15a19d654956'
    ][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&w=150&q=80`,
    statusText: 'WhatsApp Contact',
    isOnline: false,
    lastSeenAt: new Date().toISOString(),
    subscriptionStatus: 'inactive',
    totalTokensUsed: 0,
    costInDollars: 0,
    aiMessagesUsed: 0,
    aiMessagesLimit: 0,
    role: 'user'
  };
  saveUser(newContact);
  return newContact;
}

/**
 * Recursively unwrap common Baileys message containers (ephemeral, view-once, template, etc.)
 */
function getRealMessageContent(messageObj: any): any {
  if (!messageObj) return null;
  
  // If it's a message wrapper, drill down
  if (messageObj.ephemeralMessage && messageObj.ephemeralMessage.message) {
    return getRealMessageContent(messageObj.ephemeralMessage.message);
  }
  if (messageObj.viewOnceMessage && messageObj.viewOnceMessage.message) {
    return getRealMessageContent(messageObj.viewOnceMessage.message);
  }
  if (messageObj.viewOnceMessageV2 && messageObj.viewOnceMessageV2.message) {
    return getRealMessageContent(messageObj.viewOnceMessageV2.message);
  }
  if (messageObj.documentWithCaptionMessage && messageObj.documentWithCaptionMessage.message) {
    return getRealMessageContent(messageObj.documentWithCaptionMessage.message);
  }
  if (messageObj.templateMessage && messageObj.templateMessage.hydratedTemplate) {
    return getRealMessageContent(messageObj.templateMessage.hydratedTemplate);
  }
  if (messageObj.interactiveMessage && messageObj.interactiveMessage.body) {
    return messageObj.interactiveMessage.body;
  }
  if (messageObj.editedMessage && messageObj.editedMessage.message) {
    return getRealMessageContent(messageObj.editedMessage.message);
  }
  if (messageObj.deviceSentMessage && messageObj.deviceSentMessage.message) {
    return getRealMessageContent(messageObj.deviceSentMessage.message);
  }
  
  return messageObj;
}

/**
 * Extract text from a Baileys message object
 */
function getMessageText(messageObj: any): string {
  if (!messageObj) return '';
  if (typeof messageObj === 'string') return messageObj;

  const cleanObj = getRealMessageContent(messageObj);
  if (!cleanObj) return '';

  if (cleanObj.conversation) return cleanObj.conversation;
  if (cleanObj.extendedTextMessage) return cleanObj.extendedTextMessage.text || '';
  if (cleanObj.imageMessage) {
    return cleanObj.imageMessage.caption || '[Image/صورة]';
  }
  if (cleanObj.videoMessage) {
    return cleanObj.videoMessage.caption || '[Video/فيديو]';
  }
  if (cleanObj.audioMessage) return '[Voice Message/رسالة صوتية]';
  if (cleanObj.documentMessage) {
    return cleanObj.documentMessage.fileName || cleanObj.documentMessage.caption || '[Document/مستند]';
  }
  if (cleanObj.stickerMessage) return '[Sticker/ملصق]';
  if (cleanObj.locationMessage) return '[Location/موقع]';
  if (cleanObj.liveLocationMessage) return '[Live Location/موقع مباشر]';
  if (cleanObj.contactMessage || cleanObj.contactsArrayMessage) return '[Contact/جهة اتصال]';
  if (cleanObj.pollCreationMessage) {
    return cleanObj.pollCreationMessage.name ? `[Poll/استطلاع رأي]: ${cleanObj.pollCreationMessage.name}` : '[Poll/استطلاع رأي]';
  }
  if (cleanObj.pollUpdateMessage) return '[Poll Vote/تصويت]';
  if (cleanObj.reactionMessage) {
    return cleanObj.reactionMessage.text ? `[Reaction/تفاعل]: ${cleanObj.reactionMessage.text}` : '[Reaction/تفاعل]';
  }
  if (cleanObj.buttonResponseMessage) {
    return cleanObj.buttonResponseMessage.buttonText || '[Button Response/رد زر]';
  }
  if (cleanObj.templateButtonReplyMessage) {
    return cleanObj.templateButtonReplyMessage.selectedDisplayText || '[Button Response/رد زر]';
  }
  if (cleanObj.listResponseMessage) {
    return cleanObj.listResponseMessage.title || '[List Response/رد قائمة]';
  }
  if (cleanObj.interactiveResponseMessage) {
    return '[Interactive Response/رد تفاعلي]';
  }
  
  // Skip protocol/sender key distribution messages which are internal WhatsApp signals
  if (cleanObj.protocolMessage || cleanObj.senderKeyDistributionMessage) {
    return '';
  }

  // Generic fallback so we never silently ignore user messages
  return '[Message/رسالة]';
}

/**
 * Sync a single incoming/outgoing Baileys message to local database
 */
function syncIncomingBaileysMessage(sock: any, jid: string, pushName: string | undefined, messageContent: any, fromMe: boolean, timestamp: number, messageId: string, deviceId: string, isHistory = false) {
  // 1. Get or create contact user in our database
  const contactUser = getOrCreateContactUser(jid, pushName);

  // Sync profile pic in background
  syncProfilePicture(sock, jid, contactUser.id).catch(() => {});

  // 2. Find the owner of this device to restrict synchronization (SaaS Isolation)
  let realUsers: any[] = [];
  const dbDevice = getAllDevices().find(d => d.id === deviceId);
  if (dbDevice && dbDevice.ownerId) {
    const ownerUser = getUser(dbDevice.ownerId);
    if (ownerUser) {
      realUsers = [ownerUser];
    }
  }

  // Fallback to all real users if the device does not have an owner set yet (backward compatibility)
  if (realUsers.length === 0) {
    realUsers = getAllUsers().filter((u) => u.id !== 'meta-ai' && !u.id.startsWith('contact_'));
  }
  
  if (realUsers.length === 0) {
    // If no users have logged in yet, let's create a default placeholder user so the sync works
    const defaultUser: User = {
      id: 'user_default',
      username: 'WhatsApp Manager',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      statusText: 'WhatsApp Web Manager',
      isOnline: true,
      lastSeenAt: new Date().toISOString(),
      subscriptionStatus: 'active',
      totalTokensUsed: 0,
      costInDollars: 0,
      aiMessagesUsed: 0,
      aiMessagesLimit: 5000,
      role: 'user'
    };
    saveUser(defaultUser);
    realUsers.push(defaultUser);
  }

  const text = getMessageText(messageContent);
  if (!text) {
    console.log(`[syncIncomingBaileysMessage] Ignored message with no readable text/media content from ${contactUser.username}`);
    return; // skip if no readable text content
  }

  console.log(`[syncIncomingBaileysMessage] Processing message - FromMe: ${fromMe}, JID: ${jid}, Sender: ${contactUser.username}, Text: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}", msgId: ${messageId}, realUsersCount: ${realUsers.length}`);
  
  if (!fromMe) {
    console.log(`[DEBUG] Incoming message received for contact: ${contactUser.username}`);
  }

  let type: 'text' | 'image' | 'audio' | 'document' = 'text';
  if (messageContent?.imageMessage) type = 'image';
  if (messageContent?.audioMessage) type = 'audio';
  if (messageContent?.documentMessage) type = 'document';

  const dateStr = new Date(timestamp * 1000).toISOString();

  for (const realUser of realUsers) {
    // 3. Ensure a conversation exists
    const conv = getOrCreateConversation(realUser.id, contactUser.id, deviceId);

    // Prevent duplicate entries
    const existingMessages = getMessagesForConversation(conv.id);
    const isDuplicate = existingMessages.some(
      (m) => m.id === messageId || (m.content === text && Math.abs(new Date(m.timestamp).getTime() - (timestamp * 1000)) < 4000)
    );
    if (isDuplicate) {
      console.log(`[syncIncomingBaileysMessage] Skipped duplicate message ${messageId} for user ${realUser.username}`);
      continue;
    }

    // 4. Save the message to DB
    const newMessage: Message = {
      id: messageId || `msg_${Math.random().toString(36).substring(2, 11)}`,
      conversationId: conv.id,
      senderId: fromMe ? realUser.id : contactUser.id,
      recipientId: fromMe ? contactUser.id : realUser.id,
      content: text,
      type,
      status: 'read',
      timestamp: dateStr
    };

    saveMessage(newMessage);
    console.log(`[syncIncomingBaileysMessage] Saved message ${newMessage.id} in conversation ${conv.id} for user ${realUser.username}`);

    // 5. Broadcast to active sockets
    broadcastUpdate({
      type: 'message:new',
      message: newMessage
    });
  }

  // 6. If not fromMe AND not history, trigger the AI Agent auto-responder hook
  if (!fromMe && !isHistory) {
    incomingMessageHandler(deviceId, sock, jid, pushName, messageContent, fromMe, timestamp, messageId).catch((err) => {
      console.error('Error in AI Agent message handler:', err);
    });
  }
}

/**
 * Bulk handle messages (history or live updates)
 */
async function handleBaileysMessages(sock: any, messages: any[], deviceId: string, isHistory = false) {
  console.log(`Processing ${messages.length} WhatsApp messages (isHistory: ${isHistory})...`);
  for (const m of messages) {
    if (!m.message) continue;
    const rawJid = m.key.remoteJid;
    if (!rawJid || rawJid.endsWith('@g.us') || rawJid.includes('status')) {
      // Skip group messages and status broadcasts to focus on individual chats
      continue;
    }

    // Resolve LID to PN standard JID
    const jid = resolveLidToPhone(rawJid, deviceId);

    const fromMe = !!m.key.fromMe;
    const pushName = m.pushName || undefined;
    
    // Safely parse timestamp
    let timestamp = Date.now() / 1000;
    if (m.messageTimestamp) {
      if (typeof m.messageTimestamp === 'number') {
        timestamp = m.messageTimestamp;
      } else if (m.messageTimestamp.low) {
        timestamp = m.messageTimestamp.low;
      }
    }

    const messageId = m.key.id;
    syncIncomingBaileysMessage(sock, jid, pushName, m.message, fromMe, timestamp, messageId, deviceId, isHistory);
  }
}

/**
 * Bulk handle contacts
 */
async function handleBaileysContacts(sock: any, contacts: any[], deviceId: string) {
  console.log(`Processing ${contacts.length} WhatsApp contacts...`);
  for (const c of contacts) {
    const rawJid = c.id;
    if (!rawJid || rawJid.endsWith('@g.us') || rawJid.includes('status')) continue;
    
    // Resolve LID to PN standard JID
    const jid = resolveLidToPhone(rawJid, deviceId);

    const pushName = c.name || c.verifiedName || c.notify;
    const contactUser = getOrCreateContactUser(jid, pushName);
    
    // Sync profile picture in background
    syncProfilePicture(sock, jid, contactUser.id).catch(() => {});
  }
}

/**
 * Clean up session folder
 */
function deleteSessionFolder(deviceId: string) {
  const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', deviceId);
  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`Deleted session folder for device: ${deviceId}`);
    } catch (err) {
      console.error(`Failed to delete session folder for device ${deviceId}:`, err);
    }
  }
  // Delete from Supabase as well
  deleteSessionFromSupabase(deviceId).catch((err) => {
    console.error(`[Supabase Delete] Failed to delete session from Supabase for device ${deviceId}:`, err);
  });
}

const backupDebounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Debounces the session file backup to Supabase to prevent spamming HTTP requests during heavy activity
 */
export function debouncedBackupSession(deviceId: string) {
  if (backupDebounceTimers.has(deviceId)) {
    clearTimeout(backupDebounceTimers.get(deviceId)!);
  }

  const timer = setTimeout(() => {
    backupDebounceTimers.delete(deviceId);
    console.log(`[Supabase Backup Triggered] Running debounced batch backup to Supabase for device: ${deviceId}`);
    backupSessionToSupabase(deviceId).catch((err) => {
      console.error(`[Supabase Auto-Backup] Failed to backup session for device ${deviceId}:`, err);
    });
  }, 10000); // 10 seconds debounce

  backupDebounceTimers.set(deviceId, timer);
}

/**
 * Start a real WhatsApp session using Baileys
 */
export function closeSocketOnly(deviceId: string) {
  console.log(`[WhatsApp Session] Closing socket only for device: ${deviceId}`);
  const sock = activeSockets.get(deviceId);
  if (sock) {
    sock.wasClosedIntentionally = true;
    try {
      sock.end(undefined);
    } catch (err) {
      console.error(`[WhatsApp Session] Error closing socket for device ${deviceId}:`, err);
    }
    activeSockets.delete(deviceId);
    console.log(`[WhatsApp Session] Removed socket from memory for device: ${deviceId}`);
  }
}

export async function startWhatsAppSession(deviceId: string) {
  if (sessionsInProgress.has(deviceId)) {
    console.log(`[WhatsApp Session] Session initialization for device ${deviceId} is already in progress. Skipping duplicate call.`);
    return;
  }
  sessionsInProgress.add(deviceId);

  // Load device configuration for Proxy and Custom settings
  const device = getAllDevices().find((d) => d.id === deviceId);
  const proxyUrl = device?.proxyUrl;

  let agent: any = undefined;
  if (proxyUrl) {
    console.log(`[WhatsApp Session] Device ${deviceId} is configuring proxy connection: ${proxyUrl}`);
    try {
      if (proxyUrl.startsWith('socks')) {
        agent = new SocksProxyAgent(proxyUrl);
      } else if (proxyUrl.startsWith('http')) {
        agent = new HttpsProxyAgent(proxyUrl);
      }
    } catch (proxyErr) {
      console.error(`[WhatsApp Session] Failed to initialize proxy agent for ${proxyUrl}:`, proxyErr);
    }
  }

  // Retrieve or generate a persistent browser signature for this device to avoid fingerprint bans
  let browserSignature: [string, string, string];
  if (device && device.browserSignature && Array.isArray(device.browserSignature) && device.browserSignature.length === 3) {
    browserSignature = device.browserSignature as [string, string, string];
    console.log(`[WhatsApp Session] Using persistent browser fingerprint for device ${deviceId}:`, browserSignature);
  } else {
    const browsers = [
      ['Windows', 'Chrome', '124.0.0'],
      ['macOS', 'Chrome', '124.0.0'],
      ['Windows', 'Firefox', '125.0'],
      ['macOS', 'Firefox', '125.0'],
      ['macOS', 'Safari', '17.4'],
      ['Windows', 'Edge', '123.0']
    ];
    const selectedBrowser = browsers[Math.floor(Math.random() * browsers.length)];
    browserSignature = [selectedBrowser[0], selectedBrowser[1], selectedBrowser[2]];
    
    if (device) {
      device.browserSignature = browserSignature;
      saveDevice(device);
      console.log(`[WhatsApp Session] Generated and persisted new browser fingerprint for device ${deviceId}:`, browserSignature);
    }
  }

  // Clear any existing reconnect timeouts
  const existingTimeout = activeReconnectTimeouts.get(deviceId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    activeReconnectTimeouts.delete(deviceId);
    console.log(`[WhatsApp Session] Cleared existing scheduled reconnection timeout for device ${deviceId}`);
  }

  try {
    // If already running, clean it up first
    closeSocketOnly(deviceId);

    const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', deviceId);
    const credsPath = path.join(sessionPath, 'creds.json');
    
    // Validate local credentials. A session is only valid if creds.json exists and is valid JSON
    let localCredsValid = false;
    if (fs.existsSync(credsPath)) {
      try {
        const content = fs.readFileSync(credsPath, 'utf8');
        JSON.parse(content);
        localCredsValid = true;
      } catch (parseErr: any) {
        console.warn(`[WhatsApp Session] Detected corrupted local creds.json for device ${deviceId}:`, parseErr.message);
      }
    }

    if (!localCredsValid) {
      console.log(`[WhatsApp Session] Local creds.json for device ${deviceId} is missing or corrupted. Attempting to restore from Supabase...`);
      // Force clear the directory to prevent file conflicts
      if (fs.existsSync(sessionPath)) {
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch (rmErr) {
          console.error(`[WhatsApp Session] Failed to clear partial session path:`, rmErr);
        }
      }
      
      const restored = await restoreSessionFromSupabase(deviceId);
      
      if (restored) {
        // Re-verify after restore
        if (fs.existsSync(credsPath)) {
          try {
            const content = fs.readFileSync(credsPath, 'utf8');
            JSON.parse(content);
            console.log(`[WhatsApp Session] Successfully restored valid session for device ${deviceId} from Supabase.`);
          } catch (parseErr) {
            console.error(`[WhatsApp Session] Restored creds.json from Supabase is corrupted. Clearing folder to start fresh.`);
            try {
              fs.rmSync(sessionPath, { recursive: true, force: true });
            } catch (rmErr) {}
          }
        }
      }
    }

    let state: any;
    let saveCreds: any;

    try {
      const auth = await useMultiFileAuthState(sessionPath);
      state = auth.state;
      saveCreds = auth.saveCreds;
    } catch (authErr) {
      console.error(`[WhatsApp Session] Local session data for device ${deviceId} is corrupted. Deleting and forcing a clean re-fetch from Supabase...`, authErr);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
      await restoreSessionFromSupabase(deviceId);
      const auth = await useMultiFileAuthState(sessionPath);
      state = auth.state;
      saveCreds = auth.saveCreds;
    }

    let version: any = [2, 3000, 1017577713]; // Fallback version
    try {
      const latest = await fetchLatestBaileysVersion();
      version = latest.version;
      console.log(`[WhatsApp Session] Dynamically fetched latest WhatsApp version: ${version.join('.')}`);
    } catch (verErr) {
      console.warn(`[WhatsApp Session] Failed to fetch latest WhatsApp version, using fallback:`, verErr);
    }

    console.log(`Initializing Baileys session for device: ${deviceId}`);

    const makeSocketFn = (makeWASocket as any).default || makeWASocket;
    const sock = makeSocketFn({
      auth: state,
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      linkPreviewImageUpload: false,
      agent,
      // --- Stability Settings ---
      // Keep the TCP connection alive with periodic pings to prevent server-side timeout
      keepAliveIntervalMs: 25000, // 25 second keepalive ping
      // Retry failed message deliveries with a small delay instead of immediately
      retryRequestDelayMs: 2000,
      // Maximum number of message retries before giving up
      maxMsgRetryCount: 5,
      // Emulate a real browser to avoid WhatsApp flagging the connection as a bot
      browser: browserSignature,
      // Do not generate high-res link previews to reduce bandwidth and avoid disconnects
      generateHighQualityLinkPreview: false,
    });

    activeSockets.set(deviceId, sock);

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      debouncedBackupSession(deviceId);
    });

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      // Skip intermediate Baileys handshake updates that have no actionable state change
      // These fire repeatedly during TLS negotiation and produce noisy device:update floods
      if (!connection && !qr) {
        return;
      }

      const devices = getAllDevices();
      const device = devices.find((d) => d.id === deviceId);
      if (!device) {
        console.log(`Device ${deviceId} was deleted. Ending socket connection.`);
        try {
          sock.end(undefined);
        } catch {}
        if (activeSockets.get(deviceId) === sock) {
          activeSockets.delete(deviceId);
        }
        deleteSessionFolder(deviceId);
        return;
      }

      if (qr) {
        console.log(`QR Code generated for device ${deviceId}`);
        // Generate a real scanable QR image
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=00a884&data=${encodeURIComponent(qr)}`;
        device.qrCodeUrl = qrImage;
        device.status = 'linking';
        saveDevice(device);

        broadcastUpdate({
          type: 'device:update',
          device
        });
      }

      if (connection === 'close') {
        if (sock.wasClosedIntentionally) {
          console.log(`Connection closed intentionally for device ${deviceId}. Skipping reconnect handling.`);
          if (activeSockets.get(deviceId) === sock) {
            activeSockets.delete(deviceId);
          }
          return;
        }

        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        // 401 is unauthorized, which indicates a permanent logout (e.g. unlinked from phone).
        // 400 (badSession), 403 (forbidden), and 405 (method not allowed) are often transient 
        // network/file locks and should NOT trigger deletion of local/cloud sessions.
        const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

        const err = lastDisconnect?.error;
        const errMsg = (err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err))).toLowerCase();
        
        const isConflict = errMsg.includes('conflict') || statusCode === 440;
        const isQrExpired = errMsg.includes('qr refs attempts ended');
        const isRestartRequired = statusCode === 515;

        if (isConflict) {
          console.log(`[WhatsApp] Connection closed for device ${deviceId} due to session conflict (handled gracefully). Reason code: ${statusCode}.`);
        } else {
          console.log(`Connection closed for device ${deviceId}. Reason code: ${statusCode}. Permanent disconnect: ${loggedOut}.`);
        }

        if (activeSockets.get(deviceId) === sock) {
          activeSockets.delete(deviceId);
        }

        if (loggedOut || isQrExpired) {
          // Device un-paired permanently or QR expired (session needs re-scan)
          if (isQrExpired) {
            console.log(`[WhatsApp] QR pairing timeout for device ${deviceId}. Setting status to disconnected.`);
          } else {
            console.log(`[WhatsApp] Device ${deviceId} un-paired permanently (logged out). Setting status to disconnected.`);
          }
          device.status = 'disconnected';
          device.qrCodeUrl = undefined;
          device.phoneNumber = undefined;
          device.linkedAt = undefined;
          saveDevice(device);
          deleteSessionFolder(deviceId);

          broadcastUpdate({
            type: 'device:update',
            device
          });
        } else {
          // Temporary disconnection, update state to 'connecting' and retry
          // Conflict (440) is handled here now as transient

          if (isConflict) {
            const currentConflicts = (conflictCounters.get(deviceId) || 0) + 1;
            conflictCounters.set(deviceId, currentConflicts);
            console.log(`[WhatsApp] Conflict count for device ${deviceId} is now ${currentConflicts}.`);

            if (currentConflicts >= 2) {
              console.log(`[WhatsApp] Two consecutive conflicts for device ${deviceId}. Auto-reconnect halted to let the primary session connect.`);
              device.status = 'disconnected';
              device.qrCodeUrl = undefined;
              saveDevice(device);
              broadcastUpdate({
                type: 'device:update',
                device
              });
              return; // Halt reconnect flow to let the other connection win and stop the ping-pong fight
            }
          }

          console.log(`[WhatsApp] Transient disconnect handled for ${deviceId}. Reason code: ${statusCode}. Reconnecting...`);
          device.status = 'connecting';
          saveDevice(device);

          broadcastUpdate({
            type: 'device:update',
            device
          });

          // Clear previous reconnect timeout if any
          const prevTimeout = activeReconnectTimeouts.get(deviceId);
          if (prevTimeout) {
            clearTimeout(prevTimeout);
          }

          // Track consecutive reconnection attempts
          const attempts = reconnectionAttempts.get(deviceId) || 0;
          reconnectionAttempts.set(deviceId, attempts + 1);

          // Exponential backoff: base 5s delay, doubling each retry up to 10 minutes max, with jitter
          const baseDelay = 5000;
          const maxDelay = 10 * 60 * 1000; // 10 minutes
          let delay = baseDelay * Math.pow(2, attempts);
          if (delay > maxDelay) delay = maxDelay;
          // Add 0-5 seconds of random jitter to prevent synchronized stampedes
          delay += Math.random() * 5000;

          if (isRestartRequired) {
            delay = 5000;
          }

          if (isConflict) {
            const conflictCount = conflictCounters.get(deviceId) || 1;
            delay = conflictCount * 30000 + Math.random() * 10000; // 30s for first conflict, 60s for second conflict
            console.log(`[WhatsApp] Backing off connection retry due to conflict. Waiting ${Math.round(delay / 1000)} seconds.`);
          }

          console.log(`Reconnecting to WhatsApp for device ${deviceId} (attempt ${attempts + 1}) in ${Math.round(delay / 1000)} seconds...`);
          const timeoutId = setTimeout(() => {
            activeReconnectTimeouts.delete(deviceId);
            // Verify device still exists in database and is not deleted
            const currentDevices = getAllDevices();
            const exists = currentDevices.some((d) => d.id === deviceId);
            if (exists) {
              const currentActiveSock = activeSockets.get(deviceId);
              if (!currentActiveSock || currentActiveSock === sock) {
                closeSocketOnly(deviceId);
                startWhatsAppSession(deviceId);
              } else {
                console.log(`[WhatsApp] Skipping reconnect for device ${deviceId} because another active socket is already registered.`);
              }
            }
          }, delay);

          activeReconnectTimeouts.set(deviceId, timeoutId);
        }
      } else if (connection === 'open') {
        const fullJid = sock.user?.id || '';
        const cleanPhone = fullJid.split(':')[0] || fullJid.split('@')[0] || '';
        console.log(`WhatsApp connected successfully on +${cleanPhone} for device ${deviceId}!`);

        // Clear conflict counter and reconnection attempts on successful connection open
        conflictCounters.set(deviceId, 0);
        reconnectionAttempts.set(deviceId, 0);

        device.status = 'connected';
        device.phoneNumber = `+${cleanPhone}`;
        device.qrCodeUrl = undefined;
        device.linkedAt = new Date().toISOString();
        saveDevice(device);

        broadcastUpdate({
          type: 'device:update',
          device
        });

        // Sync own profile details and photos!
        setTimeout(() => {
          syncOwnProfileDetails(sock).catch(err => console.error(err));

          // Sync full session credentials to Supabase once logged in
          debouncedBackupSession(deviceId);
        }, 5000);
      }
    });

    // Listen for incoming calls
    sock.ev.on('call', async (calls: any[]) => {
      for (const call of calls) {
        if (call.status === 'offer') {
          console.log(`[WhatsApp Call] Incoming call from ${call.from} for device ${deviceId}. Rejecting...`);
          try {
            await sock.rejectCall(call.id, call.from);
            
            // Optionally, we can trigger the AI to send a reply message explaining why we rejected
            const jid = call.from;
            const pushName = undefined; // We don't have pushName here easily
            
            // Send a custom message notifying about the call rejection
            const callRejectionText = "عذراً، لا يمكنني استقبال المكالمات الصوتية حالياً. يرجى إرسال رسالة نصية أو صوتية هنا وسأقوم بالرد عليك فوراً.";
            await sendBaileysMessage(deviceId, jid, callRejectionText);
            
            // Log it in our database
            const contactPhone = jid.split('@')[0];
            const contactId = `contact_${contactPhone}`;
            const realUsers = getAllUsers().filter((u) => u.id !== 'meta-ai' && !u.id.startsWith('contact_'));
            const ownerId = realUsers[0]?.id || 'user_default';
            const conv = getOrCreateConversation(ownerId, contactId, deviceId);
            
            const callMsg: Message = {
              id: `call_${call.id}`,
              conversationId: conv.id,
              senderId: contactId,
              recipientId: ownerId,
              content: `[Incoming Call Rejected]`,
              type: 'text',
              status: 'delivered',
              timestamp: new Date().toISOString()
            };
            saveMessage(callMsg);
            
            broadcastUpdate({
              type: 'message:new',
              message: callMsg
            });

          } catch (err) {
            console.error('Failed to reject WhatsApp call:', err);
          }
        }
      }
    });

    // Sync WhatsApp message and contact history on initial connection
    sock.ev.on('messaging-history.set', async ({ chats, contacts, messages }: any) => {
      // Check if history sync is allowed for this device
      const dev = getAllDevices().find((d) => d.id === deviceId);
      const shouldSyncHistory = dev?.syncHistory !== false; // Default is true

      if (!shouldSyncHistory) {
        console.log(`[WhatsApp Session] Skipping initial history sync for device ${deviceId} due to syncHistory configuration.`);
        return;
      }

      try {
        if (contacts) {
          await handleBaileysContacts(sock, contacts, deviceId);
        }
        if (messages) {
          await handleBaileysMessages(sock, messages, deviceId, true);
        }
      } catch (err) {
        console.error('Error handling WhatsApp history set:', err);
      }
    });

    // Listen for live incoming and outgoing messages
    sock.ev.on('messages.upsert', async (m: any) => {
      try {
        if (m.messages) {
          const isHistory = m.type !== 'notify';
          await handleBaileysMessages(sock, m.messages, deviceId, isHistory);
        }
      } catch (err) {
        console.error('Error handling live WhatsApp message upsert:', err);
      }
    });

  } catch (err) {
    console.error(`Error starting Baileys session for device ${deviceId}:`, err);
  } finally {
    sessionsInProgress.delete(deviceId);
  }
}

/**
 * Automatically normalizes any input phone string to international WhatsApp format.
 * Supports Egypt (20), UAE (971), KSA (966), Kuwait (965), Qatar (974), Oman (968), Jordan (962), etc.
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  let clean = raw.replace(/[\s\+\-\(\)]/g, '').trim();

  // Remove leading '00'
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }

  // Already international format checks
  if (/^201[0125]\d{8}$/.test(clean)) return clean;
  if (/^9715\d{8}$/.test(clean)) return clean;
  if (/^9665\d{8}$/.test(clean)) return clean;
  if (/^965\d{8}$/.test(clean)) return clean;

  // Local Egyptian mobile (010, 011, 012, 015 -> 201x...)
  if (/^01[0125]\d{8}$/.test(clean)) {
    return '20' + clean.substring(1);
  }
  // Local Egyptian mobile without leading zero (10, 11, 12, 15 -> 201x...)
  if (/^1[0125]\d{8}$/.test(clean)) {
    return '20' + clean;
  }

  // Local UAE mobile (050, 052, 054, 055, 056, 058 -> 9715x...)
  if (/^05[024568]\d{7}$/.test(clean)) {
    return '971' + clean.substring(1);
  }

  // Local Saudi Arabia mobile (051, 053, 057, 059 -> 9665x...)
  if (/^05[1379]\d{7}$/.test(clean)) {
    return '966' + clean.substring(1);
  }

  // Generic 10-digit Gulf number starting with 05 -> 9715...
  if (/^05\d{8}$/.test(clean)) {
    return '971' + clean.substring(1);
  }

  return clean;
}

/**
 * Send a real message using Baileys
 */
export async function sendBaileysMessage(
  deviceId: string, 
  to: string, 
  text: string, 
  audioBuffer?: Buffer,
  pdfBuffer?: Buffer,
  pdfFilename?: string,
  imageBuffer?: Buffer
): Promise<{ success: boolean; error?: string }> {
  const sock = activeSockets.get(deviceId);
  if (!sock) {
    return { success: false, error: 'Device connection is offline or starting up' };
  }

  try {
    let cleanPhone = normalizePhoneNumber(to);

    if (!cleanPhone.endsWith('@s.whatsapp.net')) {
      cleanPhone = `${cleanPhone}@s.whatsapp.net`;
    }

    if (audioBuffer) {
      // Validate that the number is actually registered on WhatsApp
      try {
        const [result] = await sock.onWhatsApp(cleanPhone);
        if (!result || !result.exists) {
          console.warn(`[Baileys Send] Number ${cleanPhone} is not registered on WhatsApp!`);
          return { success: false, error: 'Target phone number is not registered on WhatsApp' };
        }
        cleanPhone = result.jid;
      } catch (checkErr) {
        console.warn(`[Baileys Send] Failed to verify number on WhatsApp, attempting anyway:`, checkErr);
      }

      await sock.sendMessage(cleanPhone, { 
        audio: audioBuffer, 
        mimetype: 'audio/mpeg', // MP3/MPEG compliant MIME type for Gemini TTS audio files
        ptt: true // Send as a real Voice Note
      });
    } else if (pdfBuffer) {
      // Validate that the number is actually registered on WhatsApp
      try {
        const [result] = await sock.onWhatsApp(cleanPhone);
        if (!result || !result.exists) {
          console.warn(`[Baileys Send] Number ${cleanPhone} is not registered on WhatsApp!`);
          return { success: false, error: 'Target phone number is not registered on WhatsApp' };
        }
        cleanPhone = result.jid;
      } catch (checkErr) {
        console.warn(`[Baileys Send] Failed to verify number on WhatsApp, attempting anyway:`, checkErr);
      }

      await sock.sendMessage(cleanPhone, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: pdfFilename || 'ticket.pdf',
        caption: text
      });
    } else if (imageBuffer) {
      // Validate that the number is actually registered on WhatsApp
      try {
        const [result] = await sock.onWhatsApp(cleanPhone);
        if (!result || !result.exists) {
          console.warn(`[Baileys Send] Number ${cleanPhone} is not registered on WhatsApp!`);
          return { success: false, error: 'Target phone number is not registered on WhatsApp' };
        }
        cleanPhone = result.jid;
      } catch (checkErr) {
        console.warn(`[Baileys Send] Failed to verify number on WhatsApp, attempting anyway:`, checkErr);
      }

      await sock.sendMessage(cleanPhone, {
        image: imageBuffer,
        caption: text
      });
    } else {
      // Validate that the number is actually registered on WhatsApp
      try {
        const [result] = await sock.onWhatsApp(cleanPhone);
        if (!result || !result.exists) {
          console.warn(`[Baileys Send] Number ${cleanPhone} is not registered on WhatsApp!`);
          return { success: false, error: 'Target phone number is not registered on WhatsApp' };
        }
        cleanPhone = result.jid;
      } catch (checkErr) {
        console.warn(`[Baileys Send] Failed to verify number on WhatsApp, attempting anyway:`, checkErr);
      }

      await sock.sendMessage(cleanPhone, { text });
    }
    
    return { success: true };
  } catch (err: any) {
    console.error(`Failed to send message via Baileys for device ${deviceId}:`, err);
    return { success: false, error: err.message || 'Failed to dispatch' };
  }
}

/**
 * Shut down a session
 */
export function stopWhatsAppSession(deviceId: string) {
  console.log(`[WhatsApp Session] Stopping session for device: ${deviceId}`);
  const sock = activeSockets.get(deviceId);
  if (sock) {
    sock.wasClosedIntentionally = true;
    try {
      console.log(`[WhatsApp Session] Closing socket for device: ${deviceId}`);
      sock.end(undefined);
    } catch (err) {
      console.error(`[WhatsApp Session] Error closing socket for device ${deviceId}:`, err);
    }
    activeSockets.delete(deviceId);
    console.log(`[WhatsApp Session] Removed socket from memory for device: ${deviceId}`);
  } else {
    console.log(`[WhatsApp Session] No active socket found for device: ${deviceId}`);
  }
  deleteSessionFolder(deviceId);
}

/**
 * Simple Spintax helper to randomly select choices inside brackets like {أهلاً|مرحباً|تحياتي}
 */
export function parseSpintax(text: string): string {
  if (!text) return text;
  const spintaxPattern = /\{([^{}]+)\}/g;
  let newText = text;
  let matches = spintaxPattern.exec(newText);
  while (matches) {
    const options = matches[1].split('|');
    const chosenOption = options[Math.floor(Math.random() * options.length)];
    newText = newText.replace(matches[0], chosenOption);
    spintaxPattern.lastIndex = 0;
    matches = spintaxPattern.exec(newText);
  }
  return newText;
}
