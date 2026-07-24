import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { User, Conversation, Message, StatusStory, DeviceLink, Campaign, CatalogItem, OtpLog, OtpSettings, Folder } from './types.js';
import { backupDbToSupabase } from './supabase.js';

dotenv.config();

// Safe dynamic Prisma initialization to prevent 503 startup crash if .prisma/client is missing on host
let prismaInstance: any;
try {
  const { PrismaClient } = require('@prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const pg = require('pg');

  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter });
  } else {
    prismaInstance = new PrismaClient();
  }
} catch (e: any) {
  console.warn('[Prisma Init Warning] Could not load Prisma Client. Fallback to store database:', e?.message || e);
  const dummyHandler: ProxyHandler<any> = {
    get: () => new Proxy(() => Promise.resolve(null), dummyHandler),
    apply: () => Promise.resolve(null)
  };
  prismaInstance = new Proxy({}, dummyHandler);
}

export const prisma = prismaInstance;

const DB_FILE = path.join(process.cwd(), 'db-store.json');


export interface PaymentSettings {
  vodafoneCashNumber: string;
  instaPayAddress: string;
  bankAccountIban: string;
  accountHolderName: string;
  bankName: string;
  transferNotes: string;
  telegramBotToken?: string;
  telegramBotEnabled?: boolean;
  telegramBotInfo?: any;
}

export interface DbSchema {
  users: Record<string, User>;
  conversations: Record<string, Conversation>;
  messages: Message[];
  statuses: StatusStory[];
  devices: Record<string, DeviceLink>;
  campaigns: Record<string, Campaign>;
  catalog: CatalogItem[];
  demoLeads: DemoLead[];
  otpLogs?: OtpLog[];
  otpSettings?: OtpSettings;
  folders?: Record<string, Folder>;
  agentsConfig?: Record<string, any>;
  paymentSettings?: PaymentSettings;
}

export interface DemoLead {
  id: string;
  username: string;
  phone: string;
  createdAt: string;
  leadSource?: 'whatsapp' | 'web';
  status?: 'new' | 'contacted' | 'qualified' | 'converted';
  notes?: string;
  score?: number;
  extractedNeeds?: string[];
}

const META_AI_USER: User = {
  id: 'meta-ai',
  username: 'Meta AI',
  role: 'user',
  avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
  statusText: 'with Gemini AI. Type anything to start talking!',
  isOnline: true,
  lastSeenAt: new Date().toISOString(),
  subscriptionStatus: 'active',
  totalTokensUsed: 0,
  costInDollars: 0,
  aiMessagesUsed: 0,
  aiMessagesLimit: 5000,
};

const ADMIN_USER: User = {
  id: 'admin-tarek',
  username: 'Tarek Roshdi',
  email: 'tarekroshdi@gmail.com',
  password: 'Tarek@2026',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  statusText: 'System Administrator',
  isOnline: true,
  lastSeenAt: new Date().toISOString(),
  subscriptionStatus: 'active',
  totalTokensUsed: 0,
  costInDollars: 0,
  aiMessagesUsed: 0,
  aiMessagesLimit: 50000,
};

function getInitialDb(): DbSchema {
  return {
    users: {
      'meta-ai': META_AI_USER,
      'admin-tarek': ADMIN_USER
    },
    conversations: {},
    messages: [],
    statuses: [],
    devices: {},
    campaigns: {},
    catalog: [],
    demoLeads: [],
    otpLogs: [],
    otpSettings: {
      template: 'مرحباً بك في ChatCore. رمز التحقق الخاص بك هو: {otp}. يرجى إدخاله في الموقع لتفعيل حسابك.'
    },
    folders: {}
  };
}

let cachedDb: DbSchema | null = null;

export function resetDbCache(): void {
  cachedDb = null;
}

export function readDb(): DbSchema {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      cachedDb = initial;
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as any;
    if (!parsed.users) parsed.users = {};
    if (!parsed.users['meta-ai']) {
      parsed.users['meta-ai'] = META_AI_USER;
    }
    if (!parsed.users['admin-tarek']) {
      parsed.users['admin-tarek'] = ADMIN_USER;
    }
    if (!parsed.conversations) parsed.conversations = {};
    if (!parsed.messages) parsed.messages = [];
    if (!parsed.statuses) parsed.statuses = [];
    if (!parsed.devices) parsed.devices = {};
    if (!parsed.campaigns) parsed.campaigns = {};
    if (!parsed.demoLeads) parsed.demoLeads = [];
    if (!parsed.otpLogs) parsed.otpLogs = [];
    if (!parsed.otpSettings) {
      parsed.otpSettings = {
        template: 'مرحباً بك في ChatCore. رمز التحقق الخاص بك هو: {otp}. يرجى إدخاله في الموقع لتفعيل حسابك.'
      };
    }
    if (!parsed.folders) {
      parsed.folders = {};
    }
    
    cachedDb = parsed as DbSchema;
    return cachedDb;
  } catch (error) {
    console.error('Error reading JSON database, returning initial state', error);
    const initial = getInitialDb();
    cachedDb = initial;
    return initial;
  }
}

let writeTimeout: NodeJS.Timeout | null = null;
let isWriting = false;
let pendingWrite = false;

export function writeDb(data: DbSchema): void {
  cachedDb = data;
  
  if (writeTimeout) return; // Debounce already active
  
  writeTimeout = setTimeout(async () => {
    writeTimeout = null;
    
    if (isWriting) {
      pendingWrite = true;
      return;
    }
    
    await performWrite(data);
  }, 2000); // 2-second debounce window
}

async function performWrite(data: DbSchema) {
  isWriting = true;
  pendingWrite = false;
  try {
    // console.log(`[Database Write] Writing database to disk asynchronously... Total users: ${Object.keys(data.users).length}`);
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    
    // Back up to Supabase asynchronously on every database write
    backupDbToSupabase(data).catch(err => {
      console.error('[Supabase DB Backup Error]', err);
    });
  } catch (err) {
    console.error('[Database Write Error]', err);
  } finally {
    isWriting = false;
    if (pendingWrite && cachedDb) {
      performWrite(cachedDb);
    }
  }
}

// User Actions
export function getUser(userId: string): User | undefined {
  const db = readDb();
  return db.users[userId];
}

export function getUserByUsername(username: string): User | undefined {
  const db = readDb();
  return Object.values(db.users).find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

export function getAllUsers(): User[] {
  const db = readDb();
  return Object.values(db.users);
}

export function saveUser(user: User): User {
  const db = readDb();
  // Provide defaults for SaaS if missing
  if (!user.subscriptionPlan) user.subscriptionPlan = 'starter';
  if (user.aiMessagesUsed === undefined) user.aiMessagesUsed = 0;
  if (user.aiMessagesLimit === undefined) {
    if (user.subscriptionPlan === 'starter') user.aiMessagesLimit = 2500;
    else if (user.subscriptionPlan === 'pro') user.aiMessagesLimit = 7000;
    else if (user.subscriptionPlan === 'enterprise') user.aiMessagesLimit = 20000;
  }
  
  db.users[user.id] = user;
  writeDb(db);
  
  // Async Prisma Sync
  prisma.users.upsert({
    where: { id: user.id },
    update: {
      username: user.username,
      password_hash: user.password || '',
    },
    create: {
      id: user.id,
      username: user.username,
      password_hash: user.password || '',
    }
  }).catch(e => console.error('[Prisma Sync] Error saving user', e));

  return user;
}

export function deleteUser(userId: string): void {
  const db = readDb();
  if (db.users[userId]) {
    delete db.users[userId];
    writeDb(db);
  }
}

export function incrementUserAiUsage(userId: string): { limitReached: boolean; user?: User } {
  const db = readDb();
  const user = db.users[userId];
  if (!user) return { limitReached: true };

  if (user.aiMessagesUsed >= (user.aiMessagesLimit || 2000)) {
    return { limitReached: true, user };
  }

  user.aiMessagesUsed += 1;
  db.users[userId] = user;
  writeDb(db);
  return { limitReached: false, user };
}

export function updateUserPresence(userId: string, isOnline: boolean): User | undefined {
  const db = readDb();
  if (db.users[userId]) {
    db.users[userId].isOnline = isOnline;
    db.users[userId].lastSeenAt = new Date().toISOString();
    writeDb(db);
    return db.users[userId];
  }
  return undefined;
}

// Conversation Actions
export function getOrCreateConversation(userA: string, userB: string, deviceId?: string): Conversation {
  const db = readDb();
  
  // Find existing conversation (matching participantIds)
  const existing = Object.values(db.conversations).find(
    (c) => c.participantIds.includes(userA) && c.participantIds.includes(userB)
  );
  
  if (existing) {
    if (deviceId && existing.deviceId !== deviceId) {
      existing.deviceId = deviceId;
      writeDb(db);
    }
    return existing;
  }
  
  // Create new conversation
  const newId = `conv_${Math.random().toString(36).substring(2, 11)}`;
  const newConv: Conversation = {
    id: newId,
    participantIds: [userA, userB],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceId: deviceId
  };
  
  db.conversations[newId] = newConv;
  writeDb(db);

  // Async Prisma Sync
  prisma.conversation.upsert({
    where: { id: newConv.id },
    update: {
      deviceId: newConv.deviceId || 'default',
      contactPhone: newConv.participantIds.find(id => id.startsWith('contact_')) || newConv.participantIds[1] || 'unknown',
      status: 'open',
      label: newConv.label || 'None',
      updatedAt: new Date(newConv.updatedAt)
    },
    create: {
      id: newConv.id,
      deviceId: newConv.deviceId || 'default',
      contactPhone: newConv.participantIds.find(id => id.startsWith('contact_')) || newConv.participantIds[1] || 'unknown',
      status: 'open',
      label: newConv.label || 'None',
      createdAt: new Date(newConv.createdAt),
      updatedAt: new Date(newConv.updatedAt)
    }
  }).catch(e => console.error('[Prisma Sync] Error saving conversation', e));

  return newConv;
}

export function getConversationsForUser(userId: string): Conversation[] {
  const db = readDb();
  const user = db.users[userId];
  if (user && user.role === 'admin') {
    return Object.values(db.conversations);
  }
  return Object.values(db.conversations).filter((c) =>
    c.participantIds.includes(userId)
  );
}

export function saveConversation(conv: Conversation): Conversation {
  const db = readDb();
  db.conversations[conv.id] = conv;
  writeDb(db);

  prisma.conversation.upsert({
    where: { id: conv.id },
    update: {
      deviceId: conv.deviceId || 'default',
      contactPhone: conv.participantIds.find(id => id.startsWith('contact_')) || conv.participantIds[1] || 'unknown',
      status: 'open',
      label: conv.label || 'None',
      updatedAt: new Date(conv.updatedAt)
    },
    create: {
      id: conv.id,
      deviceId: conv.deviceId || 'default',
      contactPhone: conv.participantIds.find(id => id.startsWith('contact_')) || conv.participantIds[1] || 'unknown',
      status: 'open',
      label: conv.label || 'None',
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt)
    }
  }).catch(e => console.error('[Prisma Sync] Error saving conversation', e));

  return conv;
}

// Message Actions
export function getMessagesForConversation(convId: string): Message[] {
  const db = readDb();
  return db.messages.filter((m) => m.conversationId === convId);
}

export function saveMessage(message: Message): Message {
  const db = readDb();
  db.messages.push(message);
  
  // Update conversation timeline & reset cached AI analysis to ensure fresh real-time insights
  if (db.conversations[message.conversationId]) {
    db.conversations[message.conversationId].updatedAt = new Date().toISOString();
    delete (db.conversations[message.conversationId] as any).aiAnalysis;
  }
  
  writeDb(db);

  prisma.message.create({
    data: {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content || '',
      type: message.type,
      mediaUrl: message.mediaUrl,
      status: message.status,
      timestamp: new Date(message.timestamp)
    }
  }).catch(e => console.error('[Prisma Sync] Error saving message', e));

  return message;
}

export function updateMessageStatus(messageId: string, status: 'delivered' | 'read' | 'failed'): Message | undefined {
  const db = readDb();
  const msg = db.messages.find((m) => m.id === messageId);
  if (msg) {
    // Only upgrade status, don't downgrade (e.g. read -> delivered)
    if (status === 'failed' || status === 'read' || (status === 'delivered' && msg.status === 'sent')) {
      msg.status = status;
      writeDb(db);
    }
    return msg;
  }
  return undefined;
}

export function markConversationAsRead(convId: string, userId: string): string[] {
  const db = readDb();
  const updatedIds: string[] = [];
  db.messages.forEach((m) => {
    if (m.conversationId === convId && m.recipientId === userId && m.status !== 'read') {
      m.status = 'read';
      updatedIds.push(m.id);
    }
  });
  if (updatedIds.length > 0) {
    writeDb(db);
  }
  return updatedIds;
}

// Status Stories Actions
export function getActiveStatuses(): StatusStory[] {
  const db = readDb();
  const now = new Date().getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  // Filter stories older than 24h
  return db.statuses.filter((s) => {
    const storyTime = new Date(s.createdAt).getTime();
    return now - storyTime < twentyFourHours;
  });
}

export function saveStatus(status: StatusStory): StatusStory {
  const db = readDb();
  db.statuses.push(status);
  writeDb(db);
  return status;
}

export function addStatusViewer(statusId: string, viewerId: string): StatusStory | undefined {
  const db = readDb();
  const status = db.statuses.find((s) => s.id === statusId);
  if (status) {
    if (!status.viewers.includes(viewerId) && status.userId !== viewerId) {
      status.viewers.push(viewerId);
      writeDb(db);
    }
    return status;
  }
  return undefined;
}

// Device API helpers
export function getAllDevices(userId?: string): DeviceLink[] {
  const db = readDb();
  const list = Object.values(db.devices || {});
  if (userId) {
    return list.filter((d) => d.ownerId === userId || !d.ownerId);
  }
  return list;
}

export function saveDevice(device: DeviceLink): DeviceLink {
  const db = readDb();
  if (!db.devices) db.devices = {};
  db.devices[device.id] = device;
  writeDb(db);

  const validUserId = (device.ownerId && !device.ownerId.includes('admin') && !device.ownerId.includes('meta')) ? device.ownerId : null;

  prisma.device.upsert({
    where: { id: device.id },
    update: {
      name: device.name,
      phoneNumber: device.phoneNumber,
      phoneId: device.phoneId,
      method: device.method,
      status: device.status,
      tenantId: 'default',
      userId: validUserId
    },
    create: {
      id: device.id,
      name: device.name,
      phoneNumber: device.phoneNumber,
      phoneId: device.phoneId,
      method: device.method,
      status: device.status,
      tenantId: 'default',
      userId: validUserId
    }
  }).catch(e => console.error('[Prisma Sync] Error saving device', e));

  return device;
}

export function deleteDevice(deviceId: string): void {
  const db = readDb();
  if (db.devices && db.devices[deviceId]) {
    delete db.devices[deviceId];
    writeDb(db);
    console.log(`[Device Delete] Device ${deviceId} removed from DB.`);
  } else {
    console.warn(`[Device Delete] Device ${deviceId} not found in DB.`);
  }
}

// Campaign API helpers
export function getAllCampaigns(userId?: string, role?: string): Campaign[] {
  const db = readDb();
  const list = Object.values(db.campaigns || {});
  if (role === 'admin') return list;
  if (userId) {
    return list.filter((c) => c.ownerId === userId);
  }
  return list;
}

export function saveCampaign(campaign: Campaign): Campaign {
  const db = readDb();
  if (!db.campaigns) db.campaigns = {};
  db.campaigns[campaign.id] = campaign;
  writeDb(db);
  return campaign;
}

export function deleteCampaign(campaignId: string): void {
  const db = readDb();
  if (db.campaigns && db.campaigns[campaignId]) {
    delete db.campaigns[campaignId];
    writeDb(db);
  }
}

export function deleteConversation(conversationId: string): void {
  const db = readDb();
  if (db.conversations && db.conversations[conversationId]) {
    delete db.conversations[conversationId];
    
    // Purge all messages associated with this conversation to guarantee data confidentiality
    if (db.messages) {
      for (const msgId of Object.keys(db.messages)) {
        if (db.messages[msgId].conversationId === conversationId) {
          delete db.messages[msgId];
        }
      }
    }
    writeDb(db);
    console.log(`[DB] Deleted conversation ${conversationId} and purged all associated messages.`);
  }
}

/**
 * Clone conversations and messages from user_default to a new user
 */
export function cloneDefaultUserConversations(newUserId: string) {
  if (newUserId === 'user_default' || newUserId === 'meta-ai' || newUserId.startsWith('contact_')) return;
  
  const db = readDb();
  const defaultConvList = Object.values(db.conversations).filter(c => c.participantIds.includes('user_default'));
  
  let changed = false;
  for (const conv of defaultConvList) {
    const contactId = conv.participantIds.find(id => id !== 'user_default');
    if (!contactId) continue;
    
    // Check if this new user already has a conversation with this contact
    const exists = Object.values(db.conversations).some(
      c => c.participantIds.includes(newUserId) && c.participantIds.includes(contactId)
    );
    if (exists) continue;
    
    // Create cloned conversation
    const newConvId = `conv_${Math.random().toString(36).substring(2, 11)}`;
    const newConv: Conversation = {
      id: newConvId,
      participantIds: [newUserId, contactId],
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    };
    db.conversations[newConvId] = newConv;
    changed = true;
    
    // Clone messages for this conversation
    const defaultMessages = db.messages.filter(m => m.conversationId === conv.id);
    for (const m of defaultMessages) {
      const clonedMsg: Message = {
        ...m,
        id: `msg_${Math.random().toString(36).substring(2, 11)}`,
        conversationId: newConvId,
        senderId: m.senderId === 'user_default' ? newUserId : m.senderId,
        recipientId: m.recipientId === 'user_default' ? newUserId : m.recipientId
      };
      db.messages.push(clonedMsg);
    }
  }
  
  if (changed) {
    writeDb(db);
  }
}

/**
 * Update conversation label
 */
export function updateConversationLabel(convId: string, label?: string): Conversation | undefined {
  const db = readDb();
  if (db.conversations[convId]) {
    db.conversations[convId].label = label;
    writeDb(db);
    return db.conversations[convId];
  }
  return undefined;
}

/**
 * Update conversation AI paused status
 */
export function updateConversationAiPaused(convId: string, aiPaused: boolean): Conversation | undefined {
  const db = readDb();
  if (db.conversations[convId]) {
    db.conversations[convId].aiPaused = aiPaused;
    writeDb(db);
    return db.conversations[convId];
  }
  return undefined;
}

/**
 * Scans whatsapp-sessions and merges duplicate LID-based contacts/conversations into their PN-based versions
 */
export function mergeLidContactsAndConversations() {
  const sessionParent = path.join(process.cwd(), 'whatsapp-sessions');
  if (!fs.existsSync(sessionParent)) return;

  const db = readDb();
  let changed = false;

  try {
    const devices = fs.readdirSync(sessionParent);
    for (const deviceId of devices) {
      const sessionPath = path.join(sessionParent, deviceId);
      if (!fs.statSync(sessionPath).isDirectory()) continue;

      const files = fs.readdirSync(sessionPath);
      for (const file of files) {
        if (file.startsWith('lid-mapping-') && file.endsWith('_reverse.json')) {
          // Extracts the LID ID from e.g. "lid-mapping-87273903284267_reverse.json" -> "87273903284267"
          const lidId = file.replace('lid-mapping-', '').replace('_reverse.json', '');
          const filePath = path.join(sessionPath, file);
          
          try {
            const mappedPhone = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (mappedPhone && typeof mappedPhone === 'string') {
              const duplicateContactId = `contact_${lidId}`;
              const realContactId = `contact_${mappedPhone}`;

              // If the duplicate LID contact exists in our DB, we merge it!
              if (db.users[duplicateContactId]) {
                console.log(`[Migration] Found duplicate LID contact ${duplicateContactId} which should map to ${realContactId}`);
                
                // 1. Ensure the real contact exists in DB, if not we clone it or rename
                if (!db.users[realContactId]) {
                  db.users[realContactId] = {
                    ...db.users[duplicateContactId],
                    id: realContactId,
                    username: db.users[duplicateContactId].username === `+${lidId}` ? `+${mappedPhone}` : db.users[duplicateContactId].username,
                  };
                }

                // 2. Find all conversations with duplicateContactId
                const conversations = Object.values(db.conversations);
                for (const conv of conversations) {
                  if (conv.participantIds.includes(duplicateContactId)) {
                    // Find the user ID who is in conversation with this duplicate contact
                    const userId = conv.participantIds.find(id => id !== duplicateContactId);
                    if (!userId) continue;

                    // Find or create the real conversation with realContactId
                    let realConv = Object.values(db.conversations).find(
                      c => c.participantIds.includes(userId) && c.participantIds.includes(realContactId)
                    );

                    if (!realConv) {
                      const newConvId = `conv_${Math.random().toString(36).substring(2, 11)}`;
                      realConv = {
                        id: newConvId,
                        participantIds: [userId, realContactId],
                        createdAt: conv.createdAt,
                        updatedAt: conv.updatedAt,
                        label: conv.label // Preserve any label like "VIP"
                      };
                      db.conversations[newConvId] = realConv;
                      console.log(`[Migration] Created new merged conversation ${newConvId} for user ${userId} and contact ${realContactId}`);
                    } else {
                      // Preserve label if real conversation doesn't have one but duplicate did
                      if (conv.label && !realConv.label) {
                        realConv.label = conv.label;
                      }
                    }

                    // 3. Move all messages from the duplicate conversation to the real conversation
                    db.messages.forEach((m) => {
                      if (m.conversationId === conv.id) {
                        m.conversationId = realConv!.id;
                        if (m.senderId === duplicateContactId) m.senderId = realContactId;
                        if (m.recipientId === duplicateContactId) m.recipientId = realContactId;
                      }
                    });

                    // 4. Delete the duplicate conversation from records
                    delete db.conversations[conv.id];
                    console.log(`[Migration] Merged and deleted conversation ${conv.id} into ${realConv.id}`);
                  }
                }

                // 5. Delete the duplicate LID contact from users list
                delete db.users[duplicateContactId];
                console.log(`[Migration] Deleted duplicate contact ${duplicateContactId}`);
                changed = true;
              }
            }
          } catch (err) {
            console.error(`[Migration] Failed processing file ${file}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Migration] Failed scanning session parent directory for LID mappings:', err);
  }

  if (changed) {
    writeDb(db);
    console.log('[Migration] Database write successful after LID migration.');
  }
}

export function mergeDuplicateConversations() {
  const db = readDb();
  let changed = false;

  // Update orphaned deviceIds to current active device if device was deleted
  const validDeviceIds = Object.keys(db.devices || {});
  const activeDevice = Object.values(db.devices || {})[0];
  if (activeDevice) {
    for (const conv of Object.values(db.conversations)) {
      if (!conv.deviceId || !validDeviceIds.includes(conv.deviceId)) {
        conv.deviceId = activeDevice.id;
        changed = true;
      }
    }
  }
  
  const conversations = Object.values(db.conversations);
  
  // Group conversations by participants
  const grouped: Record<string, Conversation[]> = {};
  for (const conv of conversations) {
    // Sort participant IDs so they are order-independent key
    const sortedParticipants = [...conv.participantIds].sort().join(',');
    if (!grouped[sortedParticipants]) {
      grouped[sortedParticipants] = [];
    }
    grouped[sortedParticipants].push(conv);
  }
  
  // For any group with size > 1, merge them
  for (const [key, convs] of Object.entries(grouped)) {
    if (convs.length > 1) {
      console.log(`[Migration] Found duplicate conversations for participants [${key}]:`, convs.map(c => c.id));
      
      // Keep the one that has a deviceId, or the first one if none or both have it
      const toKeep = convs.find(c => !!c.deviceId) || convs[0];
      const toDelete = convs.filter(c => c.id !== toKeep.id);
      
      for (const conv of toDelete) {
        // Move all messages from the duplicate conversation to the kept one
        db.messages.forEach((m) => {
          if (m.conversationId === conv.id) {
            m.conversationId = toKeep.id;
          }
        });
        
        // Merge label
        if (conv.label && !toKeep.label) {
          toKeep.label = conv.label;
        }
        
        // Merge deviceId
        if (conv.deviceId && !toKeep.deviceId) {
          toKeep.deviceId = conv.deviceId;
        }
        
        // Delete the duplicate conversation from records
        delete db.conversations[conv.id];
        console.log(`[Migration] Merged conversation ${conv.id} into ${toKeep.id}`);
        changed = true;
      }
    }
  }
  
  if (changed) {
    writeDb(db);
    console.log('[Migration] Database write successful after merging duplicate conversations.');
  }
}

export function getOtpLogs(): OtpLog[] {
  const db = readDb();
  return db.otpLogs || [];
}

export function saveOtpLog(log: OtpLog): void {
  const db = readDb();
  if (!db.otpLogs) db.otpLogs = [];
  db.otpLogs.push(log);
  writeDb(db);
}

export function getOtpSettings(): OtpSettings {
  const db = readDb();
  if (!db.otpSettings) {
    db.otpSettings = {
      template: 'مرحباً بك في ChatCore. رمز التحقق الخاص بك هو: {otp}. يرجى إدخاله في الموقع لتفعيل حسابك.'
    };
  }
  return db.otpSettings;
}

export function saveOtpSettings(settings: OtpSettings): void {
  const db = readDb();
  db.otpSettings = settings;
  writeDb(db);
}

// Folder Actions
export function getAllFolders(ownerId?: string): Folder[] {
  const db = readDb();
  const allFolders = Object.values(db.folders || {});
  if (ownerId) {
    return allFolders.filter(f => f.ownerId === ownerId);
  }
  return allFolders;
}

export function saveFolder(folder: Folder): Folder {
  const db = readDb();
  if (!db.folders) db.folders = {};
  db.folders[folder.id] = folder;
  writeDb(db);
  return folder;
}

export function deleteFolder(folderId: string): void {
  const db = readDb();
  if (db.folders && db.folders[folderId]) {
    delete db.folders[folderId];
    
    // Clean up conversations belonging to this folder
    Object.values(db.conversations).forEach(c => {
      if (c.folderId === folderId) {
        c.folderId = undefined;
      }
    });
    
    writeDb(db);
  }
}

export function getLeads(): DemoLead[] {
  const db = readDb();
  return db.demoLeads || [];
}

export function saveLead(lead: DemoLead): void {
  const db = readDb();
  if (!db.demoLeads) db.demoLeads = [];
  const existingIdx = db.demoLeads.findIndex(l => l.id === lead.id || l.phone === lead.phone);
  if (existingIdx >= 0) {
    db.demoLeads[existingIdx] = { ...db.demoLeads[existingIdx], ...lead };
  } else {
    db.demoLeads.push(lead);
  }
  writeDb(db);
}




export function getPaymentSettings(): PaymentSettings {
  const db = readDb();
  return db.paymentSettings || {
    vodafoneCashNumber: '01115822923',
    instaPayAddress: 'trkroshdi@instapay',
    bankAccountIban: 'EG1234567890123456789012345',
    accountHolderName: 'طارق رشدي (Tarek Roshdi)',
    bankName: 'البنك الأهلي المصري (NBE)',
    transferNotes: 'يرجى إرسال المبلغ باسم طارق رشدي عبر إنستا باي أو محفظة فودافون كاش ورفع سكرين شوت الإيصال لتأكيد الفاتورة فورا.',
    telegramBotToken: '',
    telegramBotEnabled: false
  };
}

export function savePaymentSettings(settings: PaymentSettings): PaymentSettings {
  const db = readDb();
  db.paymentSettings = settings;
  writeDb(db);
  return settings;
}

export async function initializeDbFromPrisma() {
  console.log('[Prisma] Loading database from PostgreSQL into memory cache...');
  try {
    if (!prisma || typeof prisma.users?.findMany !== 'function') {
      console.log('[Prisma] Prisma client findMany not available. Operating on store database.');
      return;
    }

    const users = await prisma.users.findMany().catch(() => null);
    const devices = await prisma.device?.findMany().catch(() => null);
    const conversations = await prisma.conversation?.findMany().catch(() => null);
    const messages = await prisma.message?.findMany().catch(() => null);
    
    if (!Array.isArray(users) || !Array.isArray(messages)) {
      console.log('[Prisma] PostgreSQL connection or data unavailable. Using store database.');
      return;
    }
    
    const db = readDb(); // load from local json first to get legacy data
    
    // Override with Postgres data
    users.forEach((u: any) => {
      if (db.users[u.id]) {
        db.users[u.id].username = u.username;
      }
    });
    
    messages.forEach(m => {
      const exists = db.messages.find(existing => existing.id === m.id);
      if (!exists) {
        db.messages.push({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          recipientId: m.recipientId,
          content: m.content || '',
          type: m.type as any,
          mediaUrl: m.mediaUrl || undefined,
          status: m.status as any,
          timestamp: m.timestamp.toISOString()
        });
      }
    });
    
    writeDb(db);
    console.log('[Prisma] Database loaded successfully.');
  } catch (err) {
    console.error('[Prisma] Error loading from DB', err);
  }
}
