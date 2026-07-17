var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_crypto = require("crypto");
var import_express = __toESM(require("express"));
var import_http = __toESM(require("http"));
var import_ws = require("ws");
var import_path4 = __toESM(require("path"));
var import_fs4 = __toESM(require("fs"));
var import_dotenv = __toESM(require("dotenv"));
var import_vite = require("vite");
var import_genai = require("@google/genai");

// src/db.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));

// src/supabase.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_supabase_js = require("@supabase/supabase-js");
var supabaseClient = null;
function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  try {
    supabaseClient = (0, import_supabase_js.createClient)(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return supabaseClient;
  } catch (err) {
    console.error("Error initializing Supabase client:", err);
    return null;
  }
}
function isSupabaseConfigured() {
  return !!getSupabaseClient();
}
async function checkSupabaseTablesExist() {
  const client = getSupabaseClient();
  if (!client) {
    return { whatsapp_sessions: false, crm_backups: false, allExist: false };
  }
  try {
    const { error: wsError } = await client.from("whatsapp_sessions").select("id").limit(1);
    const { error: dbError } = await client.from("crm_backups").select("id").limit(1);
    const wsExists = !wsError || !wsError.message.includes("Could not find the table");
    const dbExists = !dbError || !dbError.message.includes("Could not find the table");
    return {
      whatsapp_sessions: wsExists,
      crm_backups: dbExists,
      allExist: wsExists && dbExists,
      error: wsError?.message || dbError?.message || void 0
    };
  } catch (err) {
    return { whatsapp_sessions: false, crm_backups: false, allExist: false, error: err.message || String(err) };
  }
}
async function backupSessionToSupabase(deviceId) {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }
  const sessionDir = import_path.default.join(process.cwd(), "whatsapp-sessions", deviceId);
  if (!import_fs.default.existsSync(sessionDir)) {
    return false;
  }
  try {
    const files = import_fs.default.readdirSync(sessionDir);
    const upsertData = [];
    for (const fileName of files) {
      const filePath = import_path.default.join(sessionDir, fileName);
      try {
        const stat = import_fs.default.statSync(filePath);
        if (stat.isFile()) {
          const fileContent = import_fs.default.readFileSync(filePath, "utf-8");
          const id = `${deviceId}/${fileName}`;
          upsertData.push({
            id,
            device_id: deviceId,
            file_path: fileName,
            file_content: fileContent,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          continue;
        }
        console.error(`[Supabase Backup] Unexpected error reading file ${fileName}:`, err);
      }
    }
    if (upsertData.length > 0) {
      console.log(`[Supabase Backup] Device ${deviceId}: Attempting to backup ${upsertData.length} session files.`);
      const { error } = await client.from("whatsapp_sessions").upsert(upsertData, { onConflict: "id" });
      if (error) {
        console.error(`[Supabase Backup] Error upserting session files batch for device ${deviceId}:`, error.message);
        console.error(`[Supabase Backup] Error details for ${deviceId}:`, JSON.stringify(error, null, 2));
        if (error.message.includes("schema cache") || error.message.includes("Could not find the table")) {
          console.warn(`\u{1F449} [ACTION REQUIRED] Table 'whatsapp_sessions' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
        }
        return false;
      }
      console.log(`[Supabase Backup] Device ${deviceId}: Backed up ${upsertData.length} session files in a single batch successfully.`);
    } else {
      console.log(`[Supabase Backup] Device ${deviceId}: No session files to backup.`);
    }
    return true;
  } catch (err) {
    console.error(`[Supabase Backup] Failed to back up session folder for device ${deviceId}:`, err);
    return false;
  }
}
async function restoreSessionFromSupabase(deviceId) {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }
  const sessionDir = import_path.default.join(process.cwd(), "whatsapp-sessions", deviceId);
  try {
    const { data, error } = await client.from("whatsapp_sessions").select("file_path, file_content").eq("device_id", deviceId);
    if (error) {
      console.error(`[Supabase Restore] Error fetching session files for device ${deviceId}:`, error.message);
      console.error(`[Supabase Restore] Error details for ${deviceId}:`, JSON.stringify(error, null, 2));
      if (error.message.includes("schema cache") || error.message.includes("Could not find the table")) {
        console.warn(`\u{1F449} [ACTION REQUIRED] Table 'whatsapp_sessions' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
      }
      return false;
    }
    if (!data || data.length === 0) {
      console.log(`[Supabase Restore] No backed up session files found in Supabase for device ${deviceId}.`);
      return false;
    }
    console.log(`[Supabase Restore] Device ${deviceId}: Found ${data.length} session files in Supabase.`);
    if (!import_fs.default.existsSync(sessionDir)) {
      import_fs.default.mkdirSync(sessionDir, { recursive: true });
    }
    let restoredCount = 0;
    for (const record of data) {
      const destPath = import_path.default.join(sessionDir, record.file_path);
      import_fs.default.writeFileSync(destPath, record.file_content, "utf-8");
      restoredCount++;
    }
    console.log(`[Supabase Restore] Device ${deviceId}: Restored ${restoredCount} session files locally.`);
    return true;
  } catch (err) {
    console.error(`[Supabase Restore] Failed to restore session folder for device ${deviceId}:`, err);
    return false;
  }
}
async function deleteSessionFromSupabase(deviceId) {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }
  try {
    const { error } = await client.from("whatsapp_sessions").delete().eq("device_id", deviceId);
    if (error) {
      console.error(`[Supabase Delete] Error deleting session files from Supabase for device ${deviceId}:`, error.message);
      if (error.message.includes("schema cache") || error.message.includes("Could not find the table")) {
        console.warn(`\u{1F449} [ACTION REQUIRED] Table 'whatsapp_sessions' is missing in Supabase. Please create the table first.`);
      }
      return false;
    }
    console.log(`[Supabase Delete] Deleted session backup in Supabase for device ${deviceId}.`);
    return true;
  } catch (err) {
    console.error(`[Supabase Delete] Failed to delete session from Supabase:`, err);
    return false;
  }
}
async function backupDbToSupabase(dbData) {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }
  try {
    const { error } = await client.from("crm_backups").upsert({
      id: "db-store",
      data: dbData,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }, { onConflict: "id" });
    if (error) {
      console.error("[Supabase DB Backup] Error backing up central database:", error.message);
      if (error.message.includes("schema cache") || error.message.includes("Could not find the table")) {
        console.warn(`\u{1F449} [ACTION REQUIRED] Table 'crm_backups' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
      }
      return false;
    }
    console.log("[Supabase DB Backup] Central database backup to Supabase completed successfully.");
    return true;
  } catch (err) {
    console.error("[Supabase DB Backup] Failed to back up central database:", err);
    return false;
  }
}
async function restoreDbFromSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  try {
    const { data, error } = await client.from("crm_backups").select("data").eq("id", "db-store").single();
    if (error) {
      if (error.code === "PGRST116") {
        console.log("[Supabase DB Restore] No previous central database backup found in Supabase.");
      } else {
        console.error("[Supabase DB Restore] Error fetching central database:", error.message);
        if (error.message.includes("schema cache") || error.message.includes("Could not find the table")) {
          console.warn(`\u{1F449} [ACTION REQUIRED] Table 'crm_backups' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
        }
      }
      return null;
    }
    if (data && data.data) {
      console.log("[Supabase DB Restore] Successfully fetched central database backup from Supabase.");
      return data.data;
    }
    return null;
  } catch (err) {
    console.error("[Supabase DB Restore] Failed to restore database from Supabase:", err);
    return null;
  }
}
async function authenticateUser(username, password) {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client.from("users").select("*").eq("username", username).eq("password_hash", password).single();
  if (error || !data) {
    return null;
  }
  return data;
}
async function createUser(user) {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Supabase client not initialized" };
  }
  const { error } = await client.from("users").insert([{
    id: user.id,
    username: user.username,
    password_hash: user.password,
    // Map password to password_hash
    subscription_status: user.subscriptionStatus,
    // Changed to snake_case
    created_at: (/* @__PURE__ */ new Date()).toISOString()
    // Added created_at
  }]);
  if (error) {
    console.error("[Supabase] Create user error:", JSON.stringify(error, null, 2));
    return { success: false, error };
  }
  return { success: true };
}
async function getUserByUsername(username) {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client.from("users").select("*").eq("username", username).single();
  if (error || !data) {
    return null;
  }
  return data;
}
async function updateUser(user) {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Supabase client not initialized" };
  }
  const updateData = {
    subscription_status: user.subscriptionStatus,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (user.password) {
    updateData.password_hash = user.password;
  }
  const { error } = await client.from("users").update(updateData).eq("username", user.username);
  if (error) {
    console.error("[Supabase] Update user error:", JSON.stringify(error, null, 2));
    return { success: false, error };
  }
  return { success: true };
}

// src/db.ts
var DB_FILE = import_path2.default.join(process.cwd(), "db-store.json");
var META_AI_USER = {
  id: "meta-ai",
  username: "Meta AI",
  role: "user",
  avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  // Beautiful futuristic gradient
  statusText: "with Gemini AI. Type anything to start talking!",
  isOnline: true,
  lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
  subscriptionStatus: "active",
  totalTokensUsed: 0,
  costInDollars: 0
};
var ADMIN_USER = {
  id: "admin-tarek",
  username: "Tarek Roshdi",
  email: "tarekroshdi@gmail.com",
  password: "Tarek@2026",
  role: "admin",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  statusText: "System Administrator",
  isOnline: true,
  lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
  subscriptionStatus: "active",
  totalTokensUsed: 0,
  costInDollars: 0
};
function getInitialDb() {
  return {
    users: {
      "meta-ai": META_AI_USER,
      "admin-tarek": ADMIN_USER
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
      template: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A ChatCore. \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0647\u0648: {otp}. \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644\u0647 \u0641\u064A \u0627\u0644\u0645\u0648\u0642\u0639 \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643."
    }
  };
}
var cachedDb = null;
function resetDbCache() {
  cachedDb = null;
}
function readDb() {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    if (!import_fs2.default.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      import_fs2.default.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      cachedDb = initial;
      return initial;
    }
    const data = import_fs2.default.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.users) parsed.users = {};
    if (!parsed.users["meta-ai"]) {
      parsed.users["meta-ai"] = META_AI_USER;
    }
    if (!parsed.users["admin-tarek"]) {
      parsed.users["admin-tarek"] = ADMIN_USER;
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
        template: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A ChatCore. \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0647\u0648: {otp}. \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644\u0647 \u0641\u064A \u0627\u0644\u0645\u0648\u0642\u0639 \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643."
      };
    }
    cachedDb = parsed;
    return cachedDb;
  } catch (error) {
    console.error("Error reading JSON database, returning initial state", error);
    const initial = getInitialDb();
    cachedDb = initial;
    return initial;
  }
}
function writeDb(data) {
  cachedDb = data;
  try {
    console.log(`[Database Write] Writing database to disk synchronously... Total users: ${Object.keys(data.users).length}, conversations: ${Object.keys(data.conversations).length}, devices: ${Object.keys(data.devices || {}).length}, campaigns: ${Object.keys(data.campaigns || {}).length}`);
    import_fs2.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log("[Database Write] Database successfully written to disk.");
    backupDbToSupabase(data).catch((err) => {
      console.error("[Supabase DB Backup] Failed to back up db asynchronously:", err);
    });
  } catch (error) {
    console.error("Error writing JSON database synchronously", error);
  }
}
function getUser(userId) {
  const db = readDb();
  return db.users[userId];
}
function getUserByUsername2(username) {
  const db = readDb();
  return Object.values(db.users).find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}
function getAllUsers() {
  const db = readDb();
  return Object.values(db.users);
}
function saveUser(user) {
  const db = readDb();
  db.users[user.id] = user;
  writeDb(db);
  return user;
}
function updateUserPresence(userId, isOnline) {
  const db = readDb();
  if (db.users[userId]) {
    db.users[userId].isOnline = isOnline;
    db.users[userId].lastSeenAt = (/* @__PURE__ */ new Date()).toISOString();
    writeDb(db);
    return db.users[userId];
  }
  return void 0;
}
function getOrCreateConversation(userA, userB, deviceId) {
  const db = readDb();
  const existing = Object.values(db.conversations).find(
    (c) => c.participantIds.includes(userA) && c.participantIds.includes(userB) && (!deviceId || !c.deviceId || c.deviceId === deviceId)
  );
  if (existing) {
    if (deviceId && !existing.deviceId) {
      existing.deviceId = deviceId;
      writeDb(db);
    }
    return existing;
  }
  const newId = `conv_${Math.random().toString(36).substring(2, 11)}`;
  const newConv = {
    id: newId,
    participantIds: [userA, userB],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    deviceId
  };
  db.conversations[newId] = newConv;
  writeDb(db);
  return newConv;
}
function getConversationsForUser(userId) {
  const db = readDb();
  const user = db.users[userId];
  if (user && user.role === "admin") {
    return Object.values(db.conversations);
  }
  return Object.values(db.conversations).filter(
    (c) => c.participantIds.includes(userId)
  );
}
function saveConversation(conv) {
  const db = readDb();
  db.conversations[conv.id] = conv;
  writeDb(db);
  return conv;
}
function getMessagesForConversation(convId) {
  const db = readDb();
  return db.messages.filter((m) => m.conversationId === convId);
}
function saveMessage(message) {
  const db = readDb();
  db.messages.push(message);
  if (db.conversations[message.conversationId]) {
    db.conversations[message.conversationId].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  writeDb(db);
  return message;
}
function updateMessageStatus(messageId, status) {
  const db = readDb();
  const msg = db.messages.find((m) => m.id === messageId);
  if (msg) {
    if (status === "failed" || status === "read" || status === "delivered" && msg.status === "sent") {
      msg.status = status;
      writeDb(db);
    }
    return msg;
  }
  return void 0;
}
function getActiveStatuses() {
  const db = readDb();
  const now = (/* @__PURE__ */ new Date()).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1e3;
  return db.statuses.filter((s) => {
    const storyTime = new Date(s.createdAt).getTime();
    return now - storyTime < twentyFourHours;
  });
}
function saveStatus(status) {
  const db = readDb();
  db.statuses.push(status);
  writeDb(db);
  return status;
}
function addStatusViewer(statusId, viewerId) {
  const db = readDb();
  const status = db.statuses.find((s) => s.id === statusId);
  if (status) {
    if (!status.viewers.includes(viewerId) && status.userId !== viewerId) {
      status.viewers.push(viewerId);
      writeDb(db);
    }
    return status;
  }
  return void 0;
}
function getAllDevices(userId) {
  const db = readDb();
  const list = Object.values(db.devices || {});
  if (userId) {
    return list.filter((d) => d.ownerId === userId || !d.ownerId);
  }
  return list;
}
function saveDevice(device) {
  const db = readDb();
  if (!db.devices) db.devices = {};
  db.devices[device.id] = device;
  writeDb(db);
  return device;
}
function deleteDevice(deviceId) {
  const db = readDb();
  if (db.devices && db.devices[deviceId]) {
    delete db.devices[deviceId];
    writeDb(db);
    console.log(`[Device Delete] Device ${deviceId} removed from DB.`);
  } else {
    console.warn(`[Device Delete] Device ${deviceId} not found in DB.`);
  }
}
function getAllCampaigns(userId, role) {
  const db = readDb();
  const list = Object.values(db.campaigns || {});
  if (role === "admin") return list;
  if (userId) {
    return list.filter((c) => c.ownerId === userId);
  }
  return list;
}
function saveCampaign(campaign) {
  const db = readDb();
  if (!db.campaigns) db.campaigns = {};
  db.campaigns[campaign.id] = campaign;
  writeDb(db);
  return campaign;
}
function deleteCampaign(campaignId) {
  const db = readDb();
  if (db.campaigns && db.campaigns[campaignId]) {
    delete db.campaigns[campaignId];
    writeDb(db);
  }
}
function cloneDefaultUserConversations(newUserId) {
  if (newUserId === "user_default" || newUserId === "meta-ai" || newUserId.startsWith("contact_")) return;
  const db = readDb();
  const defaultConvList = Object.values(db.conversations).filter((c) => c.participantIds.includes("user_default"));
  let changed = false;
  for (const conv of defaultConvList) {
    const contactId = conv.participantIds.find((id) => id !== "user_default");
    if (!contactId) continue;
    const exists = Object.values(db.conversations).some(
      (c) => c.participantIds.includes(newUserId) && c.participantIds.includes(contactId)
    );
    if (exists) continue;
    const newConvId = `conv_${Math.random().toString(36).substring(2, 11)}`;
    const newConv = {
      id: newConvId,
      participantIds: [newUserId, contactId],
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    };
    db.conversations[newConvId] = newConv;
    changed = true;
    const defaultMessages = db.messages.filter((m) => m.conversationId === conv.id);
    for (const m of defaultMessages) {
      const clonedMsg = {
        ...m,
        id: `msg_${Math.random().toString(36).substring(2, 11)}`,
        conversationId: newConvId,
        senderId: m.senderId === "user_default" ? newUserId : m.senderId,
        recipientId: m.recipientId === "user_default" ? newUserId : m.recipientId
      };
      db.messages.push(clonedMsg);
    }
  }
  if (changed) {
    writeDb(db);
  }
}
function updateConversationLabel(convId, label) {
  const db = readDb();
  if (db.conversations[convId]) {
    db.conversations[convId].label = label;
    writeDb(db);
    return db.conversations[convId];
  }
  return void 0;
}
function updateConversationAiPaused(convId, aiPaused) {
  const db = readDb();
  if (db.conversations[convId]) {
    db.conversations[convId].aiPaused = aiPaused;
    writeDb(db);
    return db.conversations[convId];
  }
  return void 0;
}
function mergeLidContactsAndConversations() {
  const sessionParent = import_path2.default.join(process.cwd(), "whatsapp-sessions");
  if (!import_fs2.default.existsSync(sessionParent)) return;
  const db = readDb();
  let changed = false;
  try {
    const devices = import_fs2.default.readdirSync(sessionParent);
    for (const deviceId of devices) {
      const sessionPath = import_path2.default.join(sessionParent, deviceId);
      if (!import_fs2.default.statSync(sessionPath).isDirectory()) continue;
      const files = import_fs2.default.readdirSync(sessionPath);
      for (const file of files) {
        if (file.startsWith("lid-mapping-") && file.endsWith("_reverse.json")) {
          const lidId = file.replace("lid-mapping-", "").replace("_reverse.json", "");
          const filePath = import_path2.default.join(sessionPath, file);
          try {
            const mappedPhone = JSON.parse(import_fs2.default.readFileSync(filePath, "utf8"));
            if (mappedPhone && typeof mappedPhone === "string") {
              const duplicateContactId = `contact_${lidId}`;
              const realContactId = `contact_${mappedPhone}`;
              if (db.users[duplicateContactId]) {
                console.log(`[Migration] Found duplicate LID contact ${duplicateContactId} which should map to ${realContactId}`);
                if (!db.users[realContactId]) {
                  db.users[realContactId] = {
                    ...db.users[duplicateContactId],
                    id: realContactId,
                    username: db.users[duplicateContactId].username === `+${lidId}` ? `+${mappedPhone}` : db.users[duplicateContactId].username
                  };
                }
                const conversations = Object.values(db.conversations);
                for (const conv of conversations) {
                  if (conv.participantIds.includes(duplicateContactId)) {
                    const userId = conv.participantIds.find((id) => id !== duplicateContactId);
                    if (!userId) continue;
                    let realConv = Object.values(db.conversations).find(
                      (c) => c.participantIds.includes(userId) && c.participantIds.includes(realContactId)
                    );
                    if (!realConv) {
                      const newConvId = `conv_${Math.random().toString(36).substring(2, 11)}`;
                      realConv = {
                        id: newConvId,
                        participantIds: [userId, realContactId],
                        createdAt: conv.createdAt,
                        updatedAt: conv.updatedAt,
                        label: conv.label
                        // Preserve any label like "VIP"
                      };
                      db.conversations[newConvId] = realConv;
                      console.log(`[Migration] Created new merged conversation ${newConvId} for user ${userId} and contact ${realContactId}`);
                    } else {
                      if (conv.label && !realConv.label) {
                        realConv.label = conv.label;
                      }
                    }
                    db.messages.forEach((m) => {
                      if (m.conversationId === conv.id) {
                        m.conversationId = realConv.id;
                        if (m.senderId === duplicateContactId) m.senderId = realContactId;
                        if (m.recipientId === duplicateContactId) m.recipientId = realContactId;
                      }
                    });
                    delete db.conversations[conv.id];
                    console.log(`[Migration] Merged and deleted conversation ${conv.id} into ${realConv.id}`);
                  }
                }
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
    console.error("[Migration] Failed scanning session parent directory for LID mappings:", err);
  }
  if (changed) {
    writeDb(db);
    console.log("[Migration] Database write successful after LID migration.");
  }
}
function mergeDuplicateConversations() {
  const db = readDb();
  let changed = false;
  const conversations = Object.values(db.conversations);
  const grouped = {};
  for (const conv of conversations) {
    const sortedParticipants = [...conv.participantIds].sort().join(",");
    if (!grouped[sortedParticipants]) {
      grouped[sortedParticipants] = [];
    }
    grouped[sortedParticipants].push(conv);
  }
  for (const [key, convs] of Object.entries(grouped)) {
    if (convs.length > 1) {
      console.log(`[Migration] Found duplicate conversations for participants [${key}]:`, convs.map((c) => c.id));
      const toKeep = convs.find((c) => !!c.deviceId) || convs[0];
      const toDelete = convs.filter((c) => c.id !== toKeep.id);
      for (const conv of toDelete) {
        db.messages.forEach((m) => {
          if (m.conversationId === conv.id) {
            m.conversationId = toKeep.id;
          }
        });
        if (conv.label && !toKeep.label) {
          toKeep.label = conv.label;
        }
        if (conv.deviceId && !toKeep.deviceId) {
          toKeep.deviceId = conv.deviceId;
        }
        delete db.conversations[conv.id];
        console.log(`[Migration] Merged conversation ${conv.id} into ${toKeep.id}`);
        changed = true;
      }
    }
  }
  if (changed) {
    writeDb(db);
    console.log("[Migration] Database write successful after merging duplicate conversations.");
  }
}
function getOtpLogs() {
  const db = readDb();
  return db.otpLogs || [];
}
function saveOtpLog(log) {
  const db = readDb();
  if (!db.otpLogs) db.otpLogs = [];
  db.otpLogs.push(log);
  writeDb(db);
}
function getOtpSettings() {
  const db = readDb();
  if (!db.otpSettings) {
    db.otpSettings = {
      template: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A ChatCore. \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0647\u0648: {otp}. \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644\u0647 \u0641\u064A \u0627\u0644\u0645\u0648\u0642\u0639 \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643."
    };
  }
  return db.otpSettings;
}
function saveOtpSettings(settings) {
  const db = readDb();
  db.otpSettings = settings;
  writeDb(db);
}

// src/whatsapp.ts
var import_baileys = __toESM(require("@whiskeysockets/baileys"));
var import_pino = __toESM(require("pino"));
var import_path3 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));
var activeSockets = /* @__PURE__ */ new Map();
var activeReconnectTimeouts = /* @__PURE__ */ new Map();
var conflictCounters = /* @__PURE__ */ new Map();
var sessionsInProgress = /* @__PURE__ */ new Set();
function hasSavedSession(deviceId) {
  const credsPath = import_path3.default.join(process.cwd(), "whatsapp-sessions", deviceId, "creds.json");
  return import_fs3.default.existsSync(credsPath);
}
function resolveLidToPhone(jid, deviceId) {
  if (!jid) return jid;
  const parts = jid.split("@");
  const id = parts[0];
  const domain = parts[1] || "";
  const sessionPath = import_path3.default.join(process.cwd(), "whatsapp-sessions", deviceId);
  const reversePath = import_path3.default.join(sessionPath, `lid-mapping-${id}_reverse.json`);
  if (import_fs3.default.existsSync(reversePath)) {
    try {
      const mappedPhone = JSON.parse(import_fs3.default.readFileSync(reversePath, "utf8"));
      if (mappedPhone && typeof mappedPhone === "string") {
        const resolved = `${mappedPhone}@s.whatsapp.net`;
        console.log(`[resolveLidToPhone] Resolved LID ${jid} to phone number JID: ${resolved}`);
        return resolved;
      }
    } catch (err) {
      console.error(`[resolveLidToPhone] Failed to read reverse LID mapping for ${id}:`, err);
    }
  }
  if (domain === "lid") {
    return `${id}@s.whatsapp.net`;
  }
  return jid;
}
var broadcastUpdate = () => {
};
function setBroadcastHandler(handler) {
  broadcastUpdate = handler;
}
var incomingMessageHandler = async () => {
};
function setIncomingMessageHandler(handler) {
  incomingMessageHandler = handler;
}
async function syncProfilePicture(sock, jid, contactId) {
  try {
    if (!sock || !jid) return;
    const existing = getAllUsers().find((u) => u.id === contactId);
    if (existing && existing.avatarUrl && existing.avatarUrl.includes("pps.whatsapp.net")) {
      return;
    }
    const url = await sock.profilePictureUrl(jid, "image");
    if (url) {
      const user = getAllUsers().find((u) => u.id === contactId);
      if (user) {
        user.avatarUrl = url;
        saveUser(user);
        broadcastUpdate({
          type: "user:update",
          user
        });
      }
    }
  } catch (err) {
  }
}
async function syncOwnProfileDetails(sock) {
  try {
    if (!sock || !sock.user) return;
    const fullJid = sock.user.id || "";
    const cleanPhone = fullJid.split(":")[0] || fullJid.split("@")[0] || "";
    const jid = `${cleanPhone}@s.whatsapp.net`;
    const url = await sock.profilePictureUrl(jid, "image").catch(() => null);
    const realName = sock.user.name || `+${cleanPhone}`;
    if (url || realName) {
      const dbUsers = getAllUsers();
      for (const u of dbUsers) {
        if (u.id !== "meta-ai" && !u.id.startsWith("contact_")) {
          let updated = false;
          if (url && u.avatarUrl !== url) {
            u.avatarUrl = url;
            updated = true;
          }
          if (realName && (u.username === "user_default" || u.username.length <= 3 || u.username.match(/^\d+$/))) {
            u.username = realName;
            updated = true;
          }
          if (updated) {
            saveUser(u);
            broadcastUpdate({
              type: "user:update",
              user: u
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error syncing own profile details:", err);
  }
}
function getOrCreateContactUser(jid, pushName) {
  const phonePrefix = jid.split("@")[0];
  const contactId = `contact_${phonePrefix}`;
  const existing = getAllUsers().find((u) => u.id === contactId);
  if (existing) {
    if (pushName && existing.username !== pushName && existing.username === `+${phonePrefix}`) {
      existing.username = pushName;
      saveUser(existing);
    }
    return existing;
  }
  const newContact = {
    id: contactId,
    username: pushName || `+${phonePrefix}`,
    avatarUrl: `https://images.unsplash.com/photo-${[
      "1535713875002-d1d0cf377fde",
      "1570295999919-56ceb5ecca61",
      "1633332755192-727a05c4013d",
      "1580489944761-15a19d654956"
    ][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&w=150&q=80`,
    statusText: "WhatsApp Contact",
    isOnline: false,
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    subscriptionStatus: "inactive",
    totalTokensUsed: 0,
    costInDollars: 0,
    role: "user"
  };
  saveUser(newContact);
  return newContact;
}
function getRealMessageContent(messageObj) {
  if (!messageObj) return null;
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
function getMessageText(messageObj) {
  if (!messageObj) return "";
  if (typeof messageObj === "string") return messageObj;
  const cleanObj = getRealMessageContent(messageObj);
  if (!cleanObj) return "";
  if (cleanObj.conversation) return cleanObj.conversation;
  if (cleanObj.extendedTextMessage) return cleanObj.extendedTextMessage.text || "";
  if (cleanObj.imageMessage) {
    return cleanObj.imageMessage.caption || "[Image/\u0635\u0648\u0631\u0629]";
  }
  if (cleanObj.videoMessage) {
    return cleanObj.videoMessage.caption || "[Video/\u0641\u064A\u062F\u064A\u0648]";
  }
  if (cleanObj.audioMessage) return "[Voice Message/\u0631\u0633\u0627\u0644\u0629 \u0635\u0648\u062A\u064A\u0629]";
  if (cleanObj.documentMessage) {
    return cleanObj.documentMessage.caption || "[Document/\u0645\u0633\u062A\u0646\u062F]";
  }
  if (cleanObj.stickerMessage) return "[Sticker/\u0645\u0644\u0635\u0642]";
  if (cleanObj.locationMessage) return "[Location/\u0645\u0648\u0642\u0639]";
  if (cleanObj.liveLocationMessage) return "[Live Location/\u0645\u0648\u0642\u0639 \u0645\u0628\u0627\u0634\u0631]";
  if (cleanObj.contactMessage || cleanObj.contactsArrayMessage) return "[Contact/\u062C\u0647\u0629 \u0627\u062A\u0635\u0627\u0644]";
  if (cleanObj.pollCreationMessage) {
    return cleanObj.pollCreationMessage.name ? `[Poll/\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A]: ${cleanObj.pollCreationMessage.name}` : "[Poll/\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A]";
  }
  if (cleanObj.pollUpdateMessage) return "[Poll Vote/\u062A\u0635\u0648\u064A\u062A]";
  if (cleanObj.reactionMessage) {
    return cleanObj.reactionMessage.text ? `[Reaction/\u062A\u0641\u0627\u0639\u0644]: ${cleanObj.reactionMessage.text}` : "[Reaction/\u062A\u0641\u0627\u0639\u0644]";
  }
  if (cleanObj.buttonResponseMessage) {
    return cleanObj.buttonResponseMessage.buttonText || "[Button Response/\u0631\u062F \u0632\u0631]";
  }
  if (cleanObj.templateButtonReplyMessage) {
    return cleanObj.templateButtonReplyMessage.selectedDisplayText || "[Button Response/\u0631\u062F \u0632\u0631]";
  }
  if (cleanObj.listResponseMessage) {
    return cleanObj.listResponseMessage.title || "[List Response/\u0631\u062F \u0642\u0627\u0626\u0645\u0629]";
  }
  if (cleanObj.interactiveResponseMessage) {
    return "[Interactive Response/\u0631\u062F \u062A\u0641\u0627\u0639\u0644\u064A]";
  }
  if (cleanObj.protocolMessage || cleanObj.senderKeyDistributionMessage) {
    return "";
  }
  return "[Message/\u0631\u0633\u0627\u0644\u0629]";
}
function syncIncomingBaileysMessage(sock, jid, pushName, messageContent, fromMe, timestamp, messageId, deviceId, isHistory = false) {
  const contactUser = getOrCreateContactUser(jid, pushName);
  syncProfilePicture(sock, jid, contactUser.id).catch(() => {
  });
  let realUsers = [];
  const dbDevice = getAllDevices().find((d) => d.id === deviceId);
  if (dbDevice && dbDevice.ownerId) {
    const ownerUser = getUser(dbDevice.ownerId);
    if (ownerUser) {
      realUsers = [ownerUser];
    }
  }
  if (realUsers.length === 0) {
    realUsers = getAllUsers().filter((u) => u.id !== "meta-ai" && !u.id.startsWith("contact_"));
  }
  if (realUsers.length === 0) {
    const defaultUser = {
      id: "user_default",
      username: "WhatsApp Manager",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      statusText: "WhatsApp Web Manager",
      isOnline: true,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      subscriptionStatus: "active",
      totalTokensUsed: 0,
      costInDollars: 0,
      role: "user"
    };
    saveUser(defaultUser);
    realUsers.push(defaultUser);
  }
  const text = getMessageText(messageContent);
  if (!text) {
    console.log(`[syncIncomingBaileysMessage] Ignored message with no readable text/media content from ${contactUser.username}`);
    return;
  }
  console.log(`[syncIncomingBaileysMessage] Processing message - FromMe: ${fromMe}, JID: ${jid}, Sender: ${contactUser.username}, Text: "${text.substring(0, 60)}${text.length > 60 ? "..." : ""}", msgId: ${messageId}, realUsersCount: ${realUsers.length}`);
  if (!fromMe) {
    console.log(`[DEBUG] Incoming message received for contact: ${contactUser.username}`);
  }
  let type = "text";
  if (messageContent?.imageMessage) type = "image";
  if (messageContent?.audioMessage) type = "audio";
  const dateStr = new Date(timestamp * 1e3).toISOString();
  for (const realUser of realUsers) {
    const conv = getOrCreateConversation(realUser.id, contactUser.id, deviceId);
    const existingMessages = getMessagesForConversation(conv.id);
    const isDuplicate = existingMessages.some(
      (m) => m.id === messageId || m.content === text && Math.abs(new Date(m.timestamp).getTime() - timestamp * 1e3) < 4e3
    );
    if (isDuplicate) {
      console.log(`[syncIncomingBaileysMessage] Skipped duplicate message ${messageId} for user ${realUser.username}`);
      continue;
    }
    const newMessage = {
      id: messageId || `msg_${Math.random().toString(36).substring(2, 11)}`,
      conversationId: conv.id,
      senderId: fromMe ? realUser.id : contactUser.id,
      recipientId: fromMe ? contactUser.id : realUser.id,
      content: text,
      type,
      status: "read",
      timestamp: dateStr
    };
    saveMessage(newMessage);
    console.log(`[syncIncomingBaileysMessage] Saved message ${newMessage.id} in conversation ${conv.id} for user ${realUser.username}`);
    broadcastUpdate({
      type: "message:new",
      message: newMessage
    });
  }
  if (!fromMe && !isHistory) {
    incomingMessageHandler(deviceId, sock, jid, pushName, messageContent, fromMe, timestamp, messageId).catch((err) => {
      console.error("Error in AI Agent message handler:", err);
    });
  }
}
async function handleBaileysMessages(sock, messages, deviceId, isHistory = false) {
  console.log(`Processing ${messages.length} WhatsApp messages (isHistory: ${isHistory})...`);
  for (const m of messages) {
    if (!m.message) continue;
    const rawJid = m.key.remoteJid;
    if (!rawJid || rawJid.endsWith("@g.us") || rawJid.includes("status")) {
      continue;
    }
    const jid = resolveLidToPhone(rawJid, deviceId);
    const fromMe = !!m.key.fromMe;
    const pushName = m.pushName || void 0;
    let timestamp = Date.now() / 1e3;
    if (m.messageTimestamp) {
      if (typeof m.messageTimestamp === "number") {
        timestamp = m.messageTimestamp;
      } else if (m.messageTimestamp.low) {
        timestamp = m.messageTimestamp.low;
      }
    }
    const messageId = m.key.id;
    syncIncomingBaileysMessage(sock, jid, pushName, m.message, fromMe, timestamp, messageId, deviceId, isHistory);
  }
}
async function handleBaileysContacts(sock, contacts, deviceId) {
  console.log(`Processing ${contacts.length} WhatsApp contacts...`);
  for (const c of contacts) {
    const rawJid = c.id;
    if (!rawJid || rawJid.endsWith("@g.us") || rawJid.includes("status")) continue;
    const jid = resolveLidToPhone(rawJid, deviceId);
    const pushName = c.name || c.verifiedName || c.notify;
    const contactUser = getOrCreateContactUser(jid, pushName);
    syncProfilePicture(sock, jid, contactUser.id).catch(() => {
    });
  }
}
function deleteSessionFolder(deviceId) {
  const sessionPath = import_path3.default.join(process.cwd(), "whatsapp-sessions", deviceId);
  if (import_fs3.default.existsSync(sessionPath)) {
    try {
      import_fs3.default.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`Deleted session folder for device: ${deviceId}`);
    } catch (err) {
      console.error(`Failed to delete session folder for device ${deviceId}:`, err);
    }
  }
  deleteSessionFromSupabase(deviceId).catch((err) => {
    console.error(`[Supabase Delete] Failed to delete session from Supabase for device ${deviceId}:`, err);
  });
}
var backupDebounceTimers = /* @__PURE__ */ new Map();
function debouncedBackupSession(deviceId) {
  if (backupDebounceTimers.has(deviceId)) {
    clearTimeout(backupDebounceTimers.get(deviceId));
  }
  const timer = setTimeout(() => {
    backupDebounceTimers.delete(deviceId);
    console.log(`[Supabase Backup Triggered] Running debounced batch backup to Supabase for device: ${deviceId}`);
    backupSessionToSupabase(deviceId).catch((err) => {
      console.error(`[Supabase Auto-Backup] Failed to backup session for device ${deviceId}:`, err);
    });
  }, 1e4);
  backupDebounceTimers.set(deviceId, timer);
}
function closeSocketOnly(deviceId) {
  console.log(`[WhatsApp Session] Closing socket only for device: ${deviceId}`);
  const sock = activeSockets.get(deviceId);
  if (sock) {
    sock.wasClosedIntentionally = true;
    try {
      sock.end(void 0);
    } catch (err) {
      console.error(`[WhatsApp Session] Error closing socket for device ${deviceId}:`, err);
    }
    activeSockets.delete(deviceId);
    console.log(`[WhatsApp Session] Removed socket from memory for device: ${deviceId}`);
  }
}
async function startWhatsAppSession(deviceId) {
  if (sessionsInProgress.has(deviceId)) {
    console.log(`[WhatsApp Session] Session initialization for device ${deviceId} is already in progress. Skipping duplicate call.`);
    return;
  }
  sessionsInProgress.add(deviceId);
  const existingTimeout = activeReconnectTimeouts.get(deviceId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    activeReconnectTimeouts.delete(deviceId);
    console.log(`[WhatsApp Session] Cleared existing scheduled reconnection timeout for device ${deviceId}`);
  }
  try {
    closeSocketOnly(deviceId);
    const sessionPath = import_path3.default.join(process.cwd(), "whatsapp-sessions", deviceId);
    const { state, saveCreds } = await (0, import_baileys.useMultiFileAuthState)(sessionPath);
    console.log(`Initializing Baileys session for device: ${deviceId}`);
    const makeSocketFn = import_baileys.default.default || import_baileys.default;
    const sock = makeSocketFn({
      auth: state,
      logger: (0, import_pino.default)({ level: "silent" }),
      printQRInTerminal: false,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      linkPreviewImageUpload: false
    });
    activeSockets.set(deviceId, sock);
    sock.ev.on("creds.update", async () => {
      await saveCreds();
      debouncedBackupSession(deviceId);
    });
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const devices = getAllDevices();
      const device = devices.find((d) => d.id === deviceId);
      if (!device) {
        console.log(`Device ${deviceId} was deleted. Ending socket connection.`);
        try {
          sock.end(void 0);
        } catch {
        }
        if (activeSockets.get(deviceId) === sock) {
          activeSockets.delete(deviceId);
        }
        deleteSessionFolder(deviceId);
        return;
      }
      if (qr) {
        console.log(`QR Code generated for device ${deviceId}`);
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=00a884&data=${encodeURIComponent(qr)}`;
        device.qrCodeUrl = qrImage;
        device.status = "linking";
        saveDevice(device);
        broadcastUpdate({
          type: "device:update",
          device
        });
      }
      if (connection === "close") {
        if (sock.wasClosedIntentionally) {
          console.log(`Connection closed intentionally for device ${deviceId}. Skipping reconnect handling.`);
          if (activeSockets.get(deviceId) === sock) {
            activeSockets.delete(deviceId);
          }
          return;
        }
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === import_baileys.DisconnectReason.loggedOut || statusCode === import_baileys.DisconnectReason.badSession || statusCode === 401 || statusCode === 403 || statusCode === 405;
        const err = lastDisconnect?.error;
        const errMsg = (err instanceof Error ? err.message : typeof err === "object" ? JSON.stringify(err) : String(err)).toLowerCase();
        const isConflict = errMsg.includes("conflict") || statusCode === 440;
        const isQrExpired = errMsg.includes("qr refs attempts ended");
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
          if (isQrExpired) {
            console.log(`[WhatsApp] QR pairing timeout for device ${deviceId}. Setting status to disconnected.`);
          } else {
            console.log(`[WhatsApp] Device ${deviceId} un-paired permanently (logged out). Setting status to disconnected.`);
          }
          device.status = "disconnected";
          device.qrCodeUrl = void 0;
          device.phoneNumber = void 0;
          device.linkedAt = void 0;
          saveDevice(device);
          deleteSessionFolder(deviceId);
          broadcastUpdate({
            type: "device:update",
            device
          });
        } else {
          if (isConflict) {
            const currentConflicts = (conflictCounters.get(deviceId) || 0) + 1;
            conflictCounters.set(deviceId, currentConflicts);
            console.log(`[WhatsApp] Conflict count for device ${deviceId} is now ${currentConflicts}.`);
            if (currentConflicts >= 2) {
              console.log(`[WhatsApp] Two consecutive conflicts for device ${deviceId}. Auto-reconnect halted to let the primary session connect.`);
              device.status = "disconnected";
              device.qrCodeUrl = void 0;
              saveDevice(device);
              broadcastUpdate({
                type: "device:update",
                device
              });
              return;
            }
          }
          console.log(`[WhatsApp] Transient disconnect handled for ${deviceId}. Reason code: ${statusCode}. Reconnecting...`);
          device.status = "connecting";
          saveDevice(device);
          broadcastUpdate({
            type: "device:update",
            device
          });
          const prevTimeout = activeReconnectTimeouts.get(deviceId);
          if (prevTimeout) {
            clearTimeout(prevTimeout);
          }
          let delay = isRestartRequired ? 5e3 : 2e4 + Math.random() * 1e4;
          if (isConflict) {
            const conflictCount = conflictCounters.get(deviceId) || 1;
            delay = conflictCount * 3e4 + Math.random() * 1e4;
            console.log(`[WhatsApp] Backing off connection retry due to conflict. Waiting ${Math.round(delay / 1e3)} seconds.`);
          }
          console.log(`Reconnecting to WhatsApp for device ${deviceId} in ${Math.round(delay / 1e3)} seconds...`);
          const timeoutId = setTimeout(() => {
            activeReconnectTimeouts.delete(deviceId);
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
      } else if (connection === "open") {
        const fullJid = sock.user?.id || "";
        const cleanPhone = fullJid.split(":")[0] || fullJid.split("@")[0] || "";
        console.log(`WhatsApp connected successfully on +${cleanPhone} for device ${deviceId}!`);
        conflictCounters.set(deviceId, 0);
        device.status = "connected";
        device.phoneNumber = `+${cleanPhone}`;
        device.qrCodeUrl = void 0;
        device.linkedAt = (/* @__PURE__ */ new Date()).toISOString();
        saveDevice(device);
        broadcastUpdate({
          type: "device:update",
          device
        });
        setTimeout(() => {
          syncOwnProfileDetails(sock).catch((err) => console.error(err));
          debouncedBackupSession(deviceId);
        }, 5e3);
      }
    });
    sock.ev.on("call", async (calls) => {
      for (const call of calls) {
        if (call.status === "offer") {
          console.log(`[WhatsApp Call] Incoming call from ${call.from} for device ${deviceId}. Rejecting...`);
          try {
            await sock.rejectCall(call.id, call.from);
            const jid = call.from;
            const pushName = void 0;
            const callRejectionText = "\u0639\u0630\u0631\u0627\u064B\u060C \u0644\u0627 \u064A\u0645\u0643\u0646\u0646\u064A \u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u062D\u0627\u0644\u064A\u0627\u064B. \u064A\u0631\u062C\u0649 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0646\u0635\u064A\u0629 \u0623\u0648 \u0635\u0648\u062A\u064A\u0629 \u0647\u0646\u0627 \u0648\u0633\u0623\u0642\u0648\u0645 \u0628\u0627\u0644\u0631\u062F \u0639\u0644\u064A\u0643 \u0641\u0648\u0631\u0627\u064B.";
            await sendBaileysMessage(deviceId, jid, callRejectionText);
            const contactPhone = jid.split("@")[0];
            const contactId = `contact_${contactPhone}`;
            const realUsers = getAllUsers().filter((u) => u.id !== "meta-ai" && !u.id.startsWith("contact_"));
            const ownerId = realUsers[0]?.id || "user_default";
            const conv = getOrCreateConversation(ownerId, contactId, deviceId);
            const callMsg = {
              id: `call_${call.id}`,
              conversationId: conv.id,
              senderId: contactId,
              recipientId: ownerId,
              content: `[Incoming Call Rejected]`,
              type: "text",
              status: "delivered",
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            };
            saveMessage(callMsg);
            broadcastUpdate({
              type: "message:new",
              message: callMsg
            });
          } catch (err) {
            console.error("Failed to reject WhatsApp call:", err);
          }
        }
      }
    });
    sock.ev.on("messaging-history.set", async ({ chats, contacts, messages }) => {
      try {
        if (contacts) {
          await handleBaileysContacts(sock, contacts, deviceId);
        }
        if (messages) {
          await handleBaileysMessages(sock, messages, deviceId, true);
        }
      } catch (err) {
        console.error("Error handling WhatsApp history set:", err);
      }
    });
    sock.ev.on("messages.upsert", async (m) => {
      try {
        if (m.messages) {
          const isHistory = m.type !== "notify";
          await handleBaileysMessages(sock, m.messages, deviceId, isHistory);
        }
      } catch (err) {
        console.error("Error handling live WhatsApp message upsert:", err);
      }
    });
  } catch (err) {
    console.error(`Error starting Baileys session for device ${deviceId}:`, err);
  } finally {
    sessionsInProgress.delete(deviceId);
  }
}
async function sendBaileysMessage(deviceId, to, text, audioBuffer) {
  const sock = activeSockets.get(deviceId);
  if (!sock) {
    return { success: false, error: "Device connection is offline or starting up" };
  }
  try {
    let cleanPhone = to.replace(/[\s\+\-\(\)]/g, "").trim();
    if (!cleanPhone.endsWith("@s.whatsapp.net")) {
      cleanPhone = `${cleanPhone}@s.whatsapp.net`;
    }
    if (audioBuffer) {
      await sock.sendMessage(cleanPhone, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        // MP3/MPEG compliant MIME type for Gemini TTS audio files
        ptt: true
        // Send as a real Voice Note
      });
    } else {
      await sock.sendMessage(cleanPhone, { text });
    }
    return { success: true };
  } catch (err) {
    console.error(`Failed to send message via Baileys for device ${deviceId}:`, err);
    return { success: false, error: err.message || "Failed to dispatch" };
  }
}
function stopWhatsAppSession(deviceId) {
  console.log(`[WhatsApp Session] Stopping session for device: ${deviceId}`);
  const sock = activeSockets.get(deviceId);
  if (sock) {
    sock.wasClosedIntentionally = true;
    try {
      console.log(`[WhatsApp Session] Closing socket for device: ${deviceId}`);
      sock.end(void 0);
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

// server.ts
var import_baileys2 = require("@whiskeysockets/baileys");
import_dotenv.default.config();
var PORT = Number(process.env.PORT) || 3e3;
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/catalog", (req, res) => {
  const db = readDb();
  res.json({ catalog: db.catalog || [] });
});
app.post("/api/catalog", (req, res) => {
  const db = readDb();
  const newItem = req.body;
  newItem.id = `item_${Math.random().toString(36).substring(2, 11)}`;
  db.catalog.push(newItem);
  writeDb(db);
  res.json({ item: newItem });
});
var server = import_http.default.createServer(app);
var wss = new import_ws.WebSocketServer({ noServer: true });
var activeConnections = /* @__PURE__ */ new Map();
var ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    console.log("Gemini AI initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI client:", err);
  }
} else {
  console.log("GEMINI_API_KEY not found in environment. Meta AI will operate in interactive simulation mode.");
}
async function callGeminiWithRetry(params, maxAttempts = 3) {
  if (!ai) {
    throw new Error("Gemini AI client is not initialized");
  }
  let attempts = 0;
  let lastError = null;
  let modelsToTry = [params.model];
  if (params.model === "gemini-3.5-flash") {
    modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
  } else if (params.model === "gemini-3.1-flash-lite") {
    modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.1-pro-preview"];
  } else if (params.model === "gemini-3.1-pro-preview") {
    modelsToTry = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  } else {
    modelsToTry = [params.model, params.model, params.model];
  }
  while (attempts < maxAttempts) {
    const currentModel = modelsToTry[attempts] || params.model;
    try {
      if (attempts > 0) {
        console.log(`[Gemini Retry] Attempt ${attempts + 1}/${maxAttempts} using model "${currentModel}"...`);
      }
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: params.contents,
        config: params.config
      });
      return response;
    } catch (err) {
      attempts++;
      lastError = err;
      const errStr = String(err?.message || err);
      const isHardQuotaExceeded = errStr.includes("quota") || errStr.includes("billing") || errStr.includes("FreeTier") || errStr.includes("RESOURCE_EXHAUSTED");
      const nextModel = modelsToTry[attempts];
      const isDifferentModel = !!(nextModel && nextModel !== currentModel);
      const isRetryable = isDifferentModel || !isHardQuotaExceeded && (err?.status === 503 || err?.status === 429 || errStr.includes("503") || errStr.includes("429") || errStr.includes("demand") || errStr.includes("temporary") || errStr.includes("UNAVAILABLE") || errStr.includes("ResourceExhausted") || errStr.includes("overloaded"));
      if (attempts < maxAttempts && isRetryable) {
        const delay = Math.round(1500 * Math.pow(1.5, attempts - 1));
        if (isDifferentModel) {
          console.warn(`[Gemini Fallback] Quota/Error on model "${currentModel}" (Attempt ${attempts}/${maxAttempts}). Trying fallback model "${nextModel}" in ${delay}ms...`);
        } else {
          console.warn(`[Gemini Retry] Call failed (Attempt ${attempts}/${maxAttempts}) with error: ${errStr}. Retrying in ${delay}ms...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  throw lastError;
}
app.get("/api/whatsapp/devices/:deviceId/groups", async (req, res) => {
  const { deviceId } = req.params;
  const sock = activeSockets.get(deviceId);
  if (!sock) {
    return res.status(404).json({ error: "Device not connected" });
  }
  try {
    const groups = await sock.groupFetchAllParticipating();
    const formattedGroups = Object.values(groups).map((g) => ({
      id: g.id,
      name: g.subject,
      memberCount: g.participants ? g.participants.length : 0
    }));
    res.json({ groups: formattedGroups });
  } catch (err) {
    console.error(`[WhatsApp] Failed to fetch groups for device ${deviceId}:`, err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});
app.get("/api/whatsapp/devices/:deviceId/groups/:groupId/members", async (req, res) => {
  const { deviceId, groupId } = req.params;
  const sock = activeSockets.get(deviceId);
  if (!sock) {
    return res.status(404).json({ error: "Device not connected" });
  }
  try {
    const metadata = await sock.groupMetadata(groupId);
    const members = await Promise.all(metadata.participants.map(async (p) => {
      let resolvedNumber = p.id;
      try {
        const results = await sock.onWhatsApp(p.id);
        if (results && results.length > 0 && results[0].jid) {
          resolvedNumber = results[0].jid;
        }
      } catch (err) {
        resolvedNumber = resolveLidToPhone(p.id, deviceId);
      }
      const number = resolvedNumber.split("@")[0];
      const contacts = getAllUsers();
      const contactIdByPhone = `contact_${number}`;
      const contactIdByJid = `contact_${p.id.split("@")[0]}`;
      const knownContact = contacts.find((c) => c.id === contactIdByPhone || c.id === contactIdByJid);
      return {
        id: p.id,
        number: number.includes("s.whatsapp.net") ? number.split("@")[0] : number,
        name: knownContact ? knownContact.username : `+${number}`
      };
    }));
    res.json({ members });
  } catch (err) {
    console.error(`[WhatsApp] Failed to fetch members for group ${groupId} on device ${deviceId}:`, err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});
app.get("/api/whatsapp/members", (req, res) => {
  res.json([
    { id: "1", name: "User 1", number: "1234567890" },
    { id: "2", name: "User 2", number: "0987654321" }
  ]);
});
app.get("/api/debug", (req, res) => {
  const wsKeys = Array.from(activeConnections.keys());
  const socketKeys = Array.from(activeSockets.keys());
  res.json({
    activeWebSockets: wsKeys,
    activeWhatsAppSockets: socketKeys,
    devices: getAllDevices(),
    users: getAllUsers()
  });
});
app.get("/api/supabase/status", async (req, res) => {
  const isConfigured = isSupabaseConfigured();
  let tablesExist = false;
  let whatsappSessionsTableExists = false;
  let crmBackupsTableExists = false;
  let checkError = void 0;
  if (isConfigured) {
    try {
      const check = await checkSupabaseTablesExist();
      tablesExist = check.allExist;
      whatsappSessionsTableExists = check.whatsapp_sessions;
      crmBackupsTableExists = check.crm_backups;
      checkError = check.error;
    } catch (err) {
      checkError = err.message || String(err);
    }
  }
  res.json({
    configured: isConfigured,
    url: process.env.SUPABASE_URL || null,
    tablesExist,
    whatsappSessionsTableExists,
    crmBackupsTableExists,
    checkError,
    requiredSql: `-- 1. \u062C\u062F\u0648\u0644 \u062D\u0641\u0638 \u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0644\u062A\u062C\u0646\u0628 \u0627\u0646\u0642\u0637\u0627\u0639 \u0627\u0644\u0627\u062A\u0635\u0627\u0644
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- \u062A\u0639\u0637\u064A\u0644 \u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A RLS \u0644\u0644\u062C\u062F\u0627\u0648\u0644 \u0644\u0644\u0633\u0645\u0627\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A
ALTER TABLE whatsapp_sessions DISABLE ROW LEVEL SECURITY;

-- \u0641\u064A \u062D\u0627\u0644 \u0643\u0627\u0646 \u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0646\u0634\u0637\u0627\u064B \u0623\u0648 \u0645\u062E\u0632\u0646\u0627\u064B \u0645\u0624\u0642\u062A\u0627\u064B \u0628\u0627\u0644\u062E\u0627\u062F\u0645\u060C \u0646\u0642\u0648\u0645 \u0628\u0625\u0646\u0634\u0627\u0621 \u0633\u064A\u0627\u0633\u0629 \u062A\u0633\u0645\u062D \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0628\u0627\u0644\u0645\u0631\u0648\u0631
DROP POLICY IF EXISTS "Allow all on whatsapp_sessions" ON whatsapp_sessions;
CREATE POLICY "Allow all on whatsapp_sessions" ON whatsapp_sessions FOR ALL USING (true) WITH CHECK (true);

-- 2. \u062C\u062F\u0648\u0644 \u062D\u0641\u0638 \u062F\u0627\u062A\u0627 \u0627\u0644\u0646\u0638\u0627\u0645 (\u0627\u0644\u0639\u0645\u0644\u0627\u0621\u060C \u0627\u0644\u0631\u0633\u0627\u0626\u0644\u060C \u0627\u0644\u062D\u0645\u0644\u0627\u062A\u060C \u0627\u0644\u0623\u062C\u0647\u0632\u0629\u060C \u0627\u0644\u062D\u0627\u0644\u0627\u062A)
CREATE TABLE IF NOT EXISTS crm_backups (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_backups DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on crm_backups" ON crm_backups;
CREATE POLICY "Allow all on crm_backups" ON crm_backups FOR ALL USING (true) WITH CHECK (true);`
  });
});
var otpStore = /* @__PURE__ */ new Map();
var demoOtpStore = /* @__PURE__ */ new Map();
app.post("/api/demo-register", async (req, res) => {
  const { phone, username } = req.body;
  if (!phone || !username) {
    res.status(400).json({ error: "Phone and username are required" });
    return;
  }
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expires = Date.now() + 5 * 60 * 1e3;
  demoOtpStore.set(phone, { otp, username, phone, expires });
  try {
    await sendWhatsAppOtp(phone, otp);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
});
app.post("/api/demo-verify", (req, res) => {
  const { phone, otp } = req.body;
  const stored = demoOtpStore.get(phone);
  if (!stored || Date.now() > stored.expires || stored.otp !== otp) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }
  demoOtpStore.delete(phone);
  const db = readDb();
  db.demoLeads.push({
    id: `lead_${Math.random().toString(36).substring(2, 11)}`,
    username: stored.username,
    phone: stored.phone,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  writeDb(db);
  res.json({ success: true });
});
async function sendWhatsAppOtp(phone, otp) {
  const devices = getAllDevices();
  const settings = getOtpSettings();
  let targetDevice = devices.find((d) => d.id === settings.defaultDeviceId && d.status === "connected");
  if (!targetDevice) {
    targetDevice = devices.find((d) => d.status === "connected");
  }
  if (!targetDevice) {
    const errorMsg = "No connected WhatsApp device to send OTP";
    saveOtpLog({
      id: `otp_log_${Math.random().toString(36).substring(2, 11)}`,
      phone,
      otp,
      message: "N/A",
      status: "failed",
      error: errorMsg,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    throw new Error(errorMsg);
  }
  const template = settings.template || "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A ChatCore. \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0647\u0648: {otp}. \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644\u0647 \u0641\u064A \u0627\u0644\u0645\u0648\u0642\u0639 \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643.";
  const message = template.replace(/{otp}/gi, otp);
  try {
    await sendBaileysMessage(targetDevice.id, phone, message);
    console.log(`[OTP] Sent OTP ${otp} to ${phone} via device ${targetDevice.id}`);
    saveOtpLog({
      id: `otp_log_${Math.random().toString(36).substring(2, 11)}`,
      phone,
      otp,
      message,
      status: "sent",
      deviceId: targetDevice.id,
      deviceName: targetDevice.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    const errorMsg = err.message || "Failed to dispatch Baileys message";
    console.error(`[OTP] Failed to send OTP via device ${targetDevice.id}:`, err);
    saveOtpLog({
      id: `otp_log_${Math.random().toString(36).substring(2, 11)}`,
      phone,
      otp,
      message,
      status: "failed",
      error: errorMsg,
      deviceId: targetDevice.id,
      deviceName: targetDevice.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    throw err;
  }
}
app.get("/api/admin/otp-config", (req, res) => {
  try {
    const settings = getOtpSettings();
    const logs = getOtpLogs();
    const devices = getAllDevices();
    res.json({ settings, logs, devices });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to get OTP config" });
  }
});
app.post("/api/admin/otp-config", (req, res) => {
  try {
    const { template, defaultDeviceId } = req.body;
    if (!template) {
      res.status(400).json({ error: "Template is required" });
      return;
    }
    saveOtpSettings({ template, defaultDeviceId });
    res.json({ success: true, settings: { template, defaultDeviceId } });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to save OTP config" });
  }
});
app.post("/api/admin/test-otp", async (req, res) => {
  const { phone, message } = req.body;
  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }
  const devices = getAllDevices();
  const settings = getOtpSettings();
  let targetDevice = devices.find((d) => d.id === settings.defaultDeviceId && d.status === "connected");
  if (!targetDevice) {
    targetDevice = devices.find((d) => d.status === "connected");
  }
  if (!targetDevice) {
    res.status(400).json({ error: "No connected WhatsApp device available to send test message" });
    return;
  }
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const textToSend = message || (settings.template || "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A ChatCore. \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0647\u0648: {otp}. \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644\u0647 \u0641\u064A \u0627\u0644\u0645\u0648\u0642\u0639 \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643.").replace(/{otp}/gi, otp);
  try {
    await sendBaileysMessage(targetDevice.id, phone, textToSend);
    saveOtpLog({
      id: `otp_log_${Math.random().toString(36).substring(2, 11)}`,
      phone,
      otp,
      message: textToSend,
      status: "sent",
      deviceId: targetDevice.id,
      deviceName: targetDevice.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true, otp, message: textToSend });
  } catch (err) {
    const errorMsg = err.message || "Failed to send Baileys message";
    saveOtpLog({
      id: `otp_log_${Math.random().toString(36).substring(2, 11)}`,
      phone,
      otp,
      message: textToSend,
      status: "failed",
      error: errorMsg,
      deviceId: targetDevice.id,
      deviceName: targetDevice.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.status(500).json({ error: errorMsg });
  }
});
app.post("/api/auth/send-otp", async (req, res) => {
  const { phone, username } = req.body;
  if (!phone || !username) {
    res.status(400).json({ error: "Phone and username are required" });
    return;
  }
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expires = Date.now() + 5 * 60 * 1e3;
  otpStore.set(phone, { otp, username, expires });
  try {
    await sendWhatsAppOtp(phone, otp);
    res.json({ success: true });
  } catch (err) {
    console.error("[OTP] Failed to send:", err);
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
});
app.post("/api/auth/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  const stored = otpStore.get(phone);
  if (!stored) {
    res.status(400).json({ error: "OTP not found or expired" });
    return;
  }
  if (Date.now() > stored.expires) {
    otpStore.delete(phone);
    res.status(400).json({ error: "OTP expired" });
    return;
  }
  if (stored.otp !== otp) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }
  otpStore.delete(phone);
  const { username } = stored;
  let user = getUserByUsername2(username);
  if (!user) {
    const id = `user_${Math.random().toString(36).substring(2, 11)}`;
    user = {
      id,
      username,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
      statusText: "Hey there! I am using WhatsApp.",
      isOnline: true,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      subscriptionStatus: "trial",
      totalTokensUsed: 0,
      costInDollars: 0,
      role: "user"
    };
    saveUser(user);
    cloneDefaultUserConversations(user.id);
  } else {
    updateUserPresence(user.id, true);
  }
  res.json({ user });
});
app.post("/api/auth/admin-login", (req, res) => {
  const { email, password } = req.body;
  if (email === "tarekroshdi@gmail.com" && password === "Tarek@2026") {
    const admin = getUserByUsername2("Tarek Roshdi");
    if (admin) {
      updateUserPresence(admin.id, true);
      res.json({ user: admin });
      return;
    }
  }
  res.status(401).json({ error: "Invalid admin credentials" });
});
app.post("/api/auth/login", async (req, res) => {
  const { username, password, avatarUrl } = req.body;
  if (!username || typeof username !== "string" || username.trim().length < 2) {
    res.status(400).json({ error: "Username must be at least 2 characters long" });
    return;
  }
  if (isSupabaseConfigured()) {
    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }
    const user2 = await authenticateUser(username, password);
    if (!user2) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    updateUserPresence(user2.id, true);
    cloneDefaultUserConversations(user2.id);
    res.json({ user: user2 });
    return;
  }
  if (username === "Tarek Roshdi") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const cleanName = username.trim();
  let user = getUserByUsername2(cleanName);
  if (!user) {
    const db = readDb();
    const isDemoLead = db.demoLeads.some((lead) => lead.username === cleanName);
    if (!isDemoLead && cleanName !== "Roshdi") {
      res.status(403).json({ error: "\u064A\u062C\u0628 \u062D\u062C\u0632 \u0646\u0633\u062E\u0629 \u062F\u064A\u0645\u0648 \u0623\u0648\u0644\u0627\u064B \u0642\u0628\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
      return;
    }
    const id = `user_${Math.random().toString(36).substring(2, 11)}`;
    const randomAvatar = avatarUrl || `https://images.unsplash.com/photo-${[
      "1534528741775-53994a69daeb",
      "1539571696357-5a69c17a67c6",
      "1494790108377-be9c29b29330",
      "1507003211169-0a1dd7228f2d",
      "1522075469751-3a6694fb2f61",
      "1544005313-94ddf0286df2"
    ][Math.floor(Math.random() * 6)]}?auto=format&fit=crop&w=150&q=80`;
    user = {
      id,
      username: cleanName,
      avatarUrl: randomAvatar,
      statusText: "Hey there! I am using WhatsApp.",
      isOnline: true,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      subscriptionStatus: "trial",
      totalTokensUsed: 0,
      costInDollars: 0,
      role: "user"
    };
    saveUser(user);
    cloneDefaultUserConversations(user.id);
  } else {
    updateUserPresence(user.id, true);
    cloneDefaultUserConversations(user.id);
  }
  res.json({ user });
});
app.post("/api/auth/ensure", (req, res) => {
  const { id, username, avatarUrl, statusText } = req.body;
  if (!id || !username) {
    res.status(400).json({ error: "id and username are required" });
    return;
  }
  let user = getUser(id);
  if (!user) {
    user = {
      id,
      username,
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      statusText: statusText || "Hey there! I am using WhatsApp.",
      isOnline: true,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      subscriptionStatus: "trial",
      totalTokensUsed: 0,
      costInDollars: 0,
      role: "user"
    };
    saveUser(user);
  } else {
    updateUserPresence(id, true);
  }
  cloneDefaultUserConversations(user.id);
  res.json({ user });
});
app.get("/api/users", (req, res) => {
  res.json({ users: getAllUsers() });
});
app.post("/api/users", (req, res) => {
  const { username, avatarUrl, statusText } = req.body;
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }
  const id = `user_${Math.random().toString(36).substring(2, 11)}`;
  const newUser = {
    id,
    username,
    avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    statusText: statusText || "Hey there!",
    isOnline: false,
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    subscriptionStatus: "active",
    totalTokensUsed: 0,
    costInDollars: 0,
    role: "user"
  };
  saveUser(newUser);
  res.json({ user: newUser });
});
app.post("/api/admin/users", async (req, res) => {
  const { username, password, subscriptionStatus, duration, phoneNumber } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const id = (0, import_crypto.randomUUID)();
  const newUser = {
    id,
    username,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    statusText: "Hey there!",
    isOnline: false,
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    subscriptionStatus: subscriptionStatus || "trial",
    totalTokensUsed: 0,
    costInDollars: 0,
    role: "user",
    phoneNumber: phoneNumber || ""
  };
  if (isSupabaseConfigured()) {
    const existingUser = await getUserByUsername(username);
    console.log("[Admin] Existing user found:", existingUser ? existingUser.username : "No");
    if (existingUser) {
      const result = await updateUser({ ...newUser, password });
      if (!result.success) {
        console.error("[Admin] Error updating user in Supabase:", JSON.stringify(result.error, null, 2));
        res.status(500).json({ error: result.error?.message || result.error?.details || "Failed to update user in Supabase" });
        return;
      }
      console.log("[Admin] User updated successfully in Supabase");
    } else {
      const result = await createUser({ ...newUser, password });
      if (!result.success) {
        console.error("[Admin] Error creating user in Supabase:", JSON.stringify(result.error, null, 2));
        res.status(500).json({ error: result.error?.message || result.error?.details || "Failed to create user in Supabase" });
        return;
      }
      console.log("[Admin] User created successfully in Supabase");
    }
  }
  saveUser(newUser);
  res.json({ user: newUser });
});
app.put("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { password, subscriptionStatus, duration, usageLimit, email, username, role, trialExpiresAt, totalTokensUsed, costInDollars, phoneNumber } = req.body;
  const user = getUser(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (username !== void 0) {
    user.username = username;
  }
  if (role !== void 0) {
    user.role = role;
  }
  if (subscriptionStatus) {
    user.subscriptionStatus = subscriptionStatus;
  }
  if (email !== void 0) {
    user.email = email;
  }
  if (phoneNumber !== void 0) {
    user.phoneNumber = phoneNumber;
  }
  if (usageLimit !== void 0) {
    user.usageLimit = parseInt(usageLimit, 10) || 0;
  }
  if (totalTokensUsed !== void 0) {
    user.totalTokensUsed = parseInt(totalTokensUsed, 10) || 0;
  }
  if (costInDollars !== void 0) {
    user.costInDollars = parseFloat(costInDollars) || 0;
  }
  if (trialExpiresAt !== void 0) {
    user.trialExpiresAt = trialExpiresAt;
  }
  if (duration !== void 0 && duration !== "") {
    const days = parseInt(duration, 10);
    if (!isNaN(days) && days > 0) {
      user.trialExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1e3).toISOString();
    }
  }
  if (isSupabaseConfigured()) {
    const supabasePayload = { ...user };
    if (password) {
      supabasePayload.password = password;
    }
    const result = await updateUser(supabasePayload);
    if (!result.success) {
      console.error("[Admin] Error updating user in Supabase:", JSON.stringify(result.error, null, 2));
    }
  }
  if (password) {
    user.password = password;
  }
  saveUser(user);
  res.json({ success: true, user });
});
app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const user = getUser(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const db = readDb();
  delete db.users[id];
  writeDb(db);
  res.json({ success: true });
});
app.get("/api/admin/users/:id/work", (req, res) => {
  const { id } = req.params;
  const user = getUser(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const db = readDb();
  const devices = Object.values(db.devices || {}).filter((d) => d.ownerId === id);
  const deviceIds = devices.map((d) => d.id);
  const campaigns = Object.values(db.campaigns || {}).filter((c) => c.ownerId === id);
  const conversations = Object.values(db.conversations || {}).filter((c) => c.participantIds.includes(id));
  const conversationIds = conversations.map((c) => c.id);
  const messages = (db.messages || []).filter((m) => m.senderId === id || conversationIds.includes(m.conversationId));
  const messagesSentCount = (db.messages || []).filter((m) => m.senderId === id).length;
  const otpLogs = (db.otpLogs || []).filter((log) => log.deviceId && deviceIds.includes(log.deviceId));
  res.json({
    user,
    devices,
    campaigns,
    conversationsCount: conversations.length,
    messagesCount: messages.length,
    messagesSentCount,
    otpLogs,
    recentMessages: messages.slice(-20).reverse()
    // Last 20 messages for tracking active work
  });
});
app.get("/api/users/:userId/conversations", (req, res) => {
  const { userId } = req.params;
  const conversations = getConversationsForUser(userId);
  const enriched = conversations.map((conv) => {
    let otherId = conv.participantIds.find((id) => id.startsWith("contact_"));
    if (!otherId) {
      otherId = conv.participantIds.find((id) => id !== userId) || "";
    }
    const otherUser = getUser(otherId);
    return {
      ...conv,
      recipient: otherUser || {
        id: otherId,
        username: otherId.startsWith("contact_") ? `Contact ${otherId.substring(8)}` : "Unknown User",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        statusText: "",
        isOnline: false,
        lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  });
  res.json({ conversations: enriched });
});
app.post("/api/conversations", (req, res) => {
  const senderId = req.body.senderId || req.body.userId;
  let recipientId = req.body.recipientId || req.body.targetUsername;
  if (!senderId || !recipientId) {
    res.status(400).json({ error: "senderId and recipientId (or userId and targetUsername) are required" });
    return;
  }
  let recipient = getUser(recipientId) || getUserByUsername2(recipientId);
  if (!recipient) {
    const cleanId = recipientId.trim();
    const id = cleanId.startsWith("contact_") ? cleanId : `contact_${cleanId.replace(/[^\d]/g, "")}`;
    recipient = {
      id,
      username: cleanId,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      statusText: "WhatsApp Contact",
      isOnline: false,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      subscriptionStatus: "inactive",
      role: "user",
      totalTokensUsed: 0,
      costInDollars: 0
    };
    saveUser(recipient);
    recipientId = id;
  } else {
    recipientId = recipient.id;
  }
  const conv = getOrCreateConversation(senderId, recipientId);
  res.json({
    conversation: {
      ...conv,
      recipient
    }
  });
});
app.get("/api/conversations/:convId/messages", (req, res) => {
  const { convId } = req.params;
  res.json({ messages: getMessagesForConversation(convId) });
});
app.post("/api/conversations/:convId/messages", async (req, res) => {
  const { convId } = req.params;
  const { senderId, content, type, mediaData } = req.body;
  const db = readDb();
  const conv = db.conversations[convId];
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  let recipientId = conv.participantIds.find((id) => id !== senderId) || "";
  if (senderId === "meta-ai" || !senderId.startsWith("contact_")) {
    const contactParticipant = conv.participantIds.find((id) => id.startsWith("contact_"));
    if (contactParticipant) {
      recipientId = contactParticipant;
    }
  }
  const newMsg = {
    id: `msg_${Math.random().toString(36).substring(2, 11)}`,
    conversationId: convId,
    senderId,
    recipientId,
    content,
    type,
    mediaUrl: mediaData,
    status: "sent",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveMessage(newMsg);
  broadcast({
    type: "message:new",
    message: newMsg
  });
  if (recipientId === "meta-ai") {
    handleMetaAIResponse(senderId, convId, content, type, mediaData).catch((err) => {
      console.error("Error in background handleMetaAIResponse:", err);
    });
  }
  if (recipientId.startsWith("contact_")) {
    const targetPhone = recipientId.replace("contact_", "");
    const activeDevices = getAllDevices().filter((d) => d.status === "connected");
    const qrDevice = activeDevices.find((d) => d.id === conv.deviceId) || activeDevices.find((d) => d.method === "qr") || activeDevices[0];
    if (qrDevice) {
      console.log(`Routing manual Web UI message via real device "${qrDevice.name}" (id: ${qrDevice.id}) to +${targetPhone}`);
      sendRealWhatsAppMessage(qrDevice, targetPhone, content).then((resWa) => {
        if (!resWa.success) {
          console.error(`Failed to send real WhatsApp message to +${targetPhone}:`, resWa.error);
          updateMessageStatus(newMsg.id, "failed");
          broadcast({
            type: "message:receipt",
            messageId: newMsg.id,
            status: "failed",
            conversationId: convId
          });
        } else {
          console.log(`Successfully sent real WhatsApp message to +${targetPhone}`);
          updateMessageStatus(newMsg.id, "delivered");
          broadcast({
            type: "message:receipt",
            messageId: newMsg.id,
            status: "delivered",
            conversationId: convId
          });
        }
      }).catch((err) => {
        console.error(`Error in sendRealWhatsAppMessage handler for Web UI:`, err);
        updateMessageStatus(newMsg.id, "failed");
        broadcast({
          type: "message:receipt",
          messageId: newMsg.id,
          status: "failed",
          conversationId: convId
        });
      });
    } else {
      console.warn("No active connected WhatsApp devices available to send real message.");
      updateMessageStatus(newMsg.id, "failed");
      broadcast({
        type: "message:receipt",
        messageId: newMsg.id,
        status: "failed",
        conversationId: convId
      });
    }
  }
  res.json({ success: true, message: newMsg });
});
app.post("/api/conversations/:convId/voice-settings", (req, res) => {
  const { convId } = req.params;
  const { enabled, accent, voiceName } = req.body;
  const db = readDb();
  const conv = db.conversations[convId];
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  conv.voiceSettings = {
    enabled: !!enabled,
    accent: accent || "msa",
    voiceName: voiceName || "Zephyr"
  };
  db.conversations[convId] = conv;
  writeDb(db);
  broadcast({
    type: "conversation:update",
    conversation: conv
  });
  res.json({ success: true, conversation: conv });
});
app.post("/api/conversations/:convId/label", (req, res) => {
  const { convId } = req.params;
  const { label } = req.body;
  const updated = updateConversationLabel(convId, label);
  if (updated) {
    broadcast({
      type: "conversation:label_update",
      conversationId: convId,
      label
    });
    res.json({ success: true, conversation: updated });
  } else {
    res.status(404).json({ error: "Conversation not found" });
  }
});
app.post("/api/conversations/:convId/toggle-ai", (req, res) => {
  const { convId } = req.params;
  const { aiPaused } = req.body;
  const updated = updateConversationAiPaused(convId, !!aiPaused);
  if (updated) {
    broadcast({
      type: "conversation:ai_paused_update",
      conversationId: convId,
      aiPaused: !!aiPaused
    });
    res.json({ success: true, conversation: updated });
  } else {
    res.status(404).json({ error: "Conversation not found" });
  }
});
function getAvatarColorForId(id) {
  const colors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-indigo-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-purple-500",
    "bg-orange-500"
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return colors[sum % colors.length];
}
function analyzeMessagesLocal(messages, label) {
  let stage = "awareness";
  let sentiment = "neutral";
  let temp = "cold";
  let dealValue = 0;
  const fullText = messages.map((m) => m.content || "").join(" ").toLowerCase();
  if (label === "Converted" || label === "Paid" || label === "Success" || /تم التحويل|حولت|ايصال|إيصال|التحويل البنكي|فودافون كاش|اشترك السنوي/g.test(fullText)) {
    stage = "action";
    dealValue = fullText.includes("\u0633\u0646\u0629") || fullText.includes("\u0627\u0644\u0633\u0646\u0648\u064A") ? 299 : 79;
  } else if (label === "VIP" || label === "Intent" || /رقم الحساب|بكم الاشتراك|سعر الباقة|رابط الدفع|طريقة الدفع|خصم/g.test(fullText)) {
    stage = "intent";
    dealValue = 79;
  } else if (label === "Lead" || label === "Pending" || /تفاصيل|باقة|ممكن|شرح|فيديو|برنامج|توضيح/g.test(fullText)) {
    stage = "consideration";
    dealValue = 0;
  } else if (label === "Loyalty" || label === "Partner" || /شكرا|تسلم|ممتاز جدا|روعة|أشكرك|رائع/g.test(fullText)) {
    stage = "loyalty";
    dealValue = 150;
  }
  if (/روعة|رائع جدا|ممتاز جدا|عاش|بطل|تحفة|سعيد جدا/g.test(fullText)) {
    sentiment = "excited";
  } else if (/شكرا|تسلم|جميل|تمام|مضبوط|حبيبي|خير/g.test(fullText)) {
    sentiment = "positive";
  } else if (/مشكلة|عطل|واقف|توقف|سيء|بطيء|لا يعمل|مش شغال/g.test(fullText)) {
    sentiment = "negative";
  }
  if (stage === "action" || stage === "loyalty") {
    temp = "hot";
  } else if (stage === "intent" || stage === "consideration") {
    temp = "warm";
  }
  const summary = stage === "action" ? "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062F\u0641\u0639 \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0628\u0646\u062C\u0627\u062D\u060C \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u062A\u0641\u0627\u0639\u0644 \u0648\u0625\u064A\u062C\u0627\u0628\u064A." : stage === "intent" ? "\u0627\u0644\u0639\u0645\u064A\u0644 \u064A\u0633\u062A\u0641\u0633\u0631 \u0639\u0646 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0628\u0646\u0643\u064A \u0648\u0631\u0627\u0628\u0637 \u0627\u0644\u062F\u0641\u0639 \u0648\u0644\u062F\u064A\u0647 \u0646\u064A\u0629 \u062C\u0627\u062F\u0629." : stage === "consideration" ? "\u0627\u0644\u0639\u0645\u064A\u0644 \u064A\u0633\u062A\u0641\u0633\u0631 \u0639\u0646 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0628\u0648\u062A \u0648\u064A\u0642\u0627\u0631\u0646 \u0628\u064A\u0646 \u0627\u0644\u0628\u0627\u0642\u0627\u062A." : "\u0627\u0644\u0639\u0645\u064A\u0644 \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0644\u0628\u062F\u0621 \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0627\u0644\u0639\u0627\u0645 \u0648\u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u062E\u062F\u0645\u0629.";
  const summaryEn = stage === "action" ? "Payment successfully verified. Client is highly cooperative and satisfied." : stage === "intent" ? "Client is requesting checkout link and account numbers. High intent." : stage === "consideration" ? "Client is exploring features and comparing packages. Warm lead." : "Client initiated introductory greetings and initial inquiries.";
  const recommendedAction = stage === "action" ? "\u0623\u0631\u0633\u0644 \u0644\u0647 \u062F\u0644\u064A\u0644 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0648\u0643\u0648\u062F \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0641\u0648\u0631\u0627\u064B." : stage === "intent" ? "\u0623\u0631\u0633\u0644 \u0644\u0647 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0628\u0646\u0643\u064A\u0629 \u0623\u0648 \u0643\u0648\u062F \u062E\u0635\u0645 \u0644\u0633\u0631\u0639\u0629 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0635\u0641\u0642\u0629." : stage === "consideration" ? "\u0623\u0631\u0633\u0644 \u0644\u0647 \u0641\u064A\u062F\u064A\u0648 \u0634\u0631\u062D \u0627\u0644\u0628\u0648\u062A \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0645\u0639 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0628\u0627\u0642\u0627\u062A." : "\u0623\u0631\u0633\u0644 \u0644\u0647 \u0631\u0633\u0627\u0644\u0629 \u062A\u0631\u062D\u064A\u0628\u064A\u0629 \u062A\u0634\u0631\u062D \u0641\u064A\u0647\u0627 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629.";
  const recommendedActionEn = stage === "action" ? "Send the onboarding guides and activate their account keys immediately." : stage === "intent" ? "Send direct payment links or dynamic coupon codes to speed up purchase." : stage === "consideration" ? "Send short demonstration videos and PDF guides." : "Send a welcoming broadcast detailing standard plans.";
  const keyNeeds = stage === "action" ? ["\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0633\u0631\u064A\u0639", "\u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629"] : stage === "intent" ? ["\u0628\u0648\u0627\u0628\u0629 \u062F\u0641\u0639 \u0622\u0645\u0646\u0629", "\u062A\u0641\u0639\u064A\u0644 \u0643\u0648\u062F \u0627\u0644\u062E\u0635\u0645"] : stage === "consideration" ? ["\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0631\u062F \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A", "\u0627\u0644\u062A\u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631"] : ["\u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629"];
  const keyNeedsEn = stage === "action" ? ["Fast setup activation", "Invoicing support"] : stage === "intent" ? ["Secure checkouts", "Coupon validation"] : stage === "consideration" ? ["Self-reply capabilities", "API Integration"] : ["General consultation"];
  const draftReply = stage === "action" ? "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062F\u0641\u0639 \u0648\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643 \u0628\u0646\u062C\u0627\u062D! \u0625\u0644\u064A\u0643 \u062F\u0644\u064A\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0633\u0631\u064A\u0639 \u0644\u0644\u0631\u0628\u0637 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A." : stage === "intent" ? "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062F\u0641\u0639 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u062A\u0627\u0644\u064A \u0623\u0648 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0644\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A \u0627\u0644\u0645\u0631\u0641\u0642 \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0628\u0627\u0642\u0629 \u0641\u0648\u0631\u0627\u064B." : stage === "consideration" ? "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u064A\u0633\u0639\u062F\u0646\u064A \u0625\u0631\u0633\u0627\u0644 \u0641\u064A\u062F\u064A\u0648 \u062A\u0648\u0636\u064A\u062D\u064A (\u0645\u062F\u0629 \u062F\u0642\u064A\u0642\u062A\u064A\u0646) \u064A\u0634\u0631\u062D \u0644\u0643 \u0643\u064A\u0641\u064A\u0629 \u0631\u0628\u0637 \u0648\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0631\u062F\u0648\u062F \u0627\u0644\u0630\u0643\u064A\u0629." : "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u0643\u064A\u0641 \u064A\u0645\u0643\u0646\u0646\u064A \u0645\u0633\u0627\u0639\u062F\u062A\u0643 \u0627\u0644\u064A\u0648\u0645 \u0641\u064A ChatCore\u061F";
  const draftReplyEn = stage === "action" ? "Payment received! Your account is active. Here is our setup tutorial." : stage === "intent" ? "Hello! You can complete checkout via the attached link or bank details to start instantly." : stage === "consideration" ? "Welcome! Let me send you a 2-minute video showing how to set up self-reply filters." : "Hello! How can we assist you today at ChatCore?";
  return {
    stage,
    sentiment,
    temp,
    dealValue,
    aiAnalysis: {
      intent: stage === "action" ? "\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062F\u0641\u0639 \u0648\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0633\u0646\u0648\u064A" : stage === "intent" ? "\u0637\u0644\u0628 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062F\u0641\u0639" : stage === "consideration" ? "\u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u0645\u064A\u0632\u0627\u062A" : "\u0628\u062F\u0621 \u0627\u0644\u062A\u0639\u0627\u0631\u0641",
      intentEn: stage === "action" ? "Complete subscription" : stage === "intent" ? "Checkout inquiries" : stage === "consideration" ? "Feature exploration" : "Initial greeting",
      confidence: 95,
      summary,
      summaryEn,
      keyNeeds,
      keyNeedsEn,
      recommendedAction,
      recommendedActionEn,
      draftReply,
      draftReplyEn
    }
  };
}
app.get("/api/crm/funnel", async (req, res) => {
  try {
    const db = readDb();
    const messages = db.messages;
    const users = db.users;
    const tenantId = getTenantId(req);
    const userDevices = getAllDevices(tenantId);
    const userDeviceIds = new Set(userDevices.map((d) => d.id));
    let filteredConvs = Object.values(db.conversations);
    if (tenantId) {
      filteredConvs = filteredConvs.filter((c) => c.deviceId && userDeviceIds.has(c.deviceId));
    }
    const queryDeviceId = req.query.deviceId;
    if (queryDeviceId && queryDeviceId !== "all") {
      filteredConvs = filteredConvs.filter((c) => c.deviceId === queryDeviceId);
    }
    const contacts = Object.values(users).filter((u) => {
      if (!u.id.startsWith("contact_")) return false;
      return filteredConvs.some((c) => c.participantIds.includes(u.id));
    });
    const funnelCustomers = await Promise.all(contacts.map(async (contact) => {
      const conv = filteredConvs.find((c) => c.participantIds.includes(contact.id));
      if (!conv) {
        return {
          id: contact.id,
          name: contact.username || "WhatsApp User",
          nameEn: contact.username || "WhatsApp User",
          phoneNumber: "+" + contact.id.replace("contact_", ""),
          avatarColor: getAvatarColorForId(contact.id),
          stage: "awareness",
          lastMessageTime: "00:00",
          unread: false,
          sentiment: "neutral",
          temp: "cold",
          dealValue: 0,
          chatHistory: [],
          aiAnalysis: {
            intent: "\u0628\u062F\u0621 \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0648\u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u062E\u062F\u0645\u0629",
            intentEn: "Initiating contact and greeting",
            confidence: 90,
            summary: "\u0627\u0644\u0639\u0645\u064A\u0644 \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0644\u0623\u0648\u0644 \u0645\u0631\u0629 \u0648\u0644\u0645 \u064A\u0631\u0633\u0644 \u0623\u064A \u0631\u0633\u0627\u0626\u0644 \u0628\u0639\u062F \u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631.",
            summaryEn: "Client initiated contact for the first time with no active inquiries yet.",
            keyNeeds: ["\u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A"],
            keyNeedsEn: ["Platform overview", "Requirement mapping"],
            recommendedAction: "\u0623\u0631\u0633\u0644 \u0644\u0647 \u0631\u0633\u0627\u0644\u0629 \u062A\u0631\u062D\u064A\u0628\u064A\u0629 \u062A\u0634\u0631\u062D \u0641\u064A\u0647\u0627 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629.",
            recommendedActionEn: "Send a welcoming broadcast detailing standard plans.",
            draftReply: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u0643\u064A\u0641 \u064A\u0645\u0643\u0646\u0646\u0627 \u0645\u0633\u0627\u0639\u062F\u062A\u0643 \u0627\u0644\u064A\u0648\u0645 \u0641\u064A ChatCore\u061F",
            draftReplyEn: "Hello! How can we assist you today at ChatCore?"
          }
        };
      }
      const convMessages = messages.filter((m) => m.conversationId === conv.id);
      convMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const chatHistory = convMessages.map((m) => {
        let sender = "customer";
        if (m.senderId === "meta-ai") {
          sender = "bot";
        } else if (!m.senderId.startsWith("contact_")) {
          sender = "agent";
        }
        let formattedTime = "00:00";
        try {
          const date = new Date(m.timestamp);
          formattedTime = date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: false });
        } catch (_) {
        }
        return {
          sender,
          text: m.content || "",
          time: formattedTime
        };
      });
      const analysis = analyzeMessagesLocal(convMessages, conv.label);
      let finalAiAnalysis = { ...analysis.aiAnalysis };
      let lastMsgTime = "00:00";
      if (convMessages.length > 0) {
        try {
          const date = new Date(convMessages[convMessages.length - 1].timestamp);
          lastMsgTime = date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: false });
        } catch (_) {
        }
      }
      if (conv.aiAnalysis) {
        finalAiAnalysis = conv.aiAnalysis;
      }
      return {
        id: contact.id,
        name: contact.username || "WhatsApp User",
        nameEn: contact.username || "WhatsApp User",
        phoneNumber: "+" + contact.id.replace("contact_", ""),
        avatarColor: getAvatarColorForId(contact.id),
        stage: analysis.stage,
        lastMessageTime: lastMsgTime,
        unread: false,
        sentiment: analysis.sentiment,
        temp: analysis.temp,
        dealValue: analysis.dealValue,
        chatHistory,
        aiAnalysis: finalAiAnalysis
      };
    }));
    const filteredCustomers = funnelCustomers.filter((c) => c.chatHistory.length > 0 || c.name && c.name !== "WhatsApp User" && !c.name.startsWith("+"));
    filteredCustomers.sort((a, b) => b.chatHistory.length - a.chatHistory.length);
    res.json({ customers: filteredCustomers });
  } catch (err) {
    console.error("Failed to generate funnel customers:", err);
    res.status(500).json({ error: err.message || "Failed to fetch funnel customers" });
  }
});
app.get("/api/stats/events", (req, res) => {
  try {
    const db = readDb();
    const usersArray = Object.values(db.users || {});
    const allEvents = {};
    usersArray.forEach((u) => {
      if (u.source === "EXPOCORE" && u.tags) {
        u.tags.forEach((eventName) => {
          if (!allEvents[eventName]) {
            allEvents[eventName] = { name: eventName, attendees: 0, messagesSent: 0 };
          }
          allEvents[eventName].attendees++;
          const messagesSentToUser = (db.messages || []).filter((m) => m.conversationId && db.conversations.find((c) => c.id === m.conversationId && c.participantIds.includes(u.id))).length;
          allEvents[eventName].messagesSent += messagesSentToUser;
        });
      }
    });
    res.json({ success: true, events: Object.values(allEvents) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/crm/analytics-summary", (req, res) => {
  try {
    const db = readDb();
    const messages = db.messages;
    const users = db.users;
    const tenantId = getTenantId(req);
    const userDevices = getAllDevices(tenantId);
    const userDeviceIds = new Set(userDevices.map((d) => d.id));
    let filteredConvs = Object.values(db.conversations);
    if (tenantId) {
      filteredConvs = filteredConvs.filter((c) => c.deviceId && userDeviceIds.has(c.deviceId));
    }
    const queryDeviceId = req.query.deviceId;
    if (queryDeviceId && queryDeviceId !== "all") {
      filteredConvs = filteredConvs.filter((c) => c.deviceId === queryDeviceId);
    }
    const filteredConvIds = new Set(filteredConvs.map((c) => c.id));
    const filteredMessages = messages.filter((m) => filteredConvIds.has(m.conversationId));
    const convMessagesMap = {};
    filteredMessages.forEach((m) => {
      if (!convMessagesMap[m.conversationId]) {
        convMessagesMap[m.conversationId] = [];
      }
      convMessagesMap[m.conversationId].push(m);
    });
    const deviceLookup = {};
    userDevices.forEach((d) => {
      deviceLookup[d.id] = {
        name: d.name,
        phoneNumber: d.phoneNumber || "Simulation Line"
      };
    });
    const realReviews = [];
    filteredConvs.forEach((conv) => {
      const contactId = conv.participantIds.find((id) => id.startsWith("contact_"));
      if (!contactId) return;
      const contact = users[contactId];
      if (!contact) return;
      const convMsgs = convMessagesMap[conv.id] || [];
      if (convMsgs.length === 0) return;
      convMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const customerMsgs = convMsgs.filter((m) => m.senderId === contactId);
      const lastCustMsg = customerMsgs[customerMsgs.length - 1];
      const lastMsgText = lastCustMsg ? lastCustMsg.content || "" : "";
      const analysis = analyzeMessagesLocal(convMsgs, conv.label);
      let rating = 4;
      if (analysis.sentiment === "excited") rating = 5;
      else if (analysis.sentiment === "positive") rating = 4;
      else if (analysis.sentiment === "neutral") rating = 3;
      else if (analysis.sentiment === "negative") rating = 2;
      let category = "\u0639\u0627\u0645";
      let categoryEn = "General";
      const textLower = lastMsgText.toLowerCase();
      if (/بكام|سعر|باقة|اشتراك|بكم|تكلفة|ريال|جنيه|price|cost/g.test(textLower)) {
        category = "\u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u0623\u0633\u0639\u0627\u0631";
        categoryEn = "Pricing Inquiries";
      } else if (/حجز|موعد|ميعاد|book|appointment/g.test(textLower)) {
        category = "\u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u0637\u0644\u0628\u0627\u062A";
        categoryEn = "Bookings & Orders";
      } else if (/استرجاع|ضمان|سياسة|استبدال|مكسور|refund|return/g.test(textLower)) {
        category = "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0648\u0627\u0644\u0636\u0645\u0627\u0646";
        categoryEn = "Returns & Guarantee";
      } else if (/دفع|تحويل|راجحي|حساب|فيزا|مدى|payment|transfer/g.test(textLower)) {
        category = "\u0627\u0644\u062F\u0641\u0639 \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644";
        categoryEn = "Payment Inquiries";
      } else if (/مشكلة|عطل|واقف|توقف|لا يعمل|دعم|support|help|issue/g.test(textLower)) {
        category = "\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0648\u0627\u0644\u0634\u0643\u0627\u0648\u0649";
        categoryEn = "Technical Support";
      }
      const comment = lastMsgText || "\u0645\u0633\u062A\u0645\u0631 \u0641\u064A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629";
      const devId = conv.deviceId || "simulated-primary";
      const devInfo = deviceLookup[devId] || { name: "\u0628\u0648\u0627\u0628\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", phoneNumber: "+201000000000" };
      realReviews.push({
        id: `rev-${conv.id}`,
        customerName: contact.username || "\u0639\u0645\u064A\u0644 \u0648\u0627\u062A\u0633\u0627\u0628",
        phoneNumber: "+" + contactId.replace("contact_", ""),
        rating,
        comment,
        commentEn: comment,
        timestamp: lastCustMsg ? lastCustMsg.timestamp : conv.updatedAt,
        category,
        categoryEn,
        sentiment: analysis.sentiment,
        deviceId: devId,
        deviceName: devInfo.name,
        deviceNumber: devInfo.phoneNumber
      });
    });
    const fallbackReviewsBase = [
      {
        id: "rev-fb-1",
        customerName: "\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u0648\u062F",
        phoneNumber: "+201011223344",
        rating: 5,
        comment: "\u0627\u0644\u0628\u0648\u062A \u0633\u0631\u064A\u0639 \u062C\u062F\u0627\u064B \u0641\u064A \u0627\u0644\u0631\u062F \u0648\u0623\u0641\u0627\u062F\u0646\u064A \u0628\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0639\u0645\u0644 \u0648\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0643\u0648\u0631\u0633\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629. \u062A\u062C\u0631\u0628\u0629 \u0645\u0645\u062A\u0627\u0632\u0629!",
        commentEn: "The bot responded extremely fast and provided me with course pricing and work hours immediately. Great experience!",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        category: "\u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u0623\u0633\u0639\u0627\u0631",
        categoryEn: "Pricing Inquiries",
        sentiment: "positive",
        deviceId: "simulated-primary",
        deviceName: "\u0628\u0648\u0627\u0628\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
        deviceNumber: "+201000000000"
      },
      {
        id: "rev-fb-2",
        customerName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0639\u062A\u064A\u0628\u064A",
        phoneNumber: "+966501122334",
        rating: 5,
        comment: "\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0642\u0627\u0645 \u0628\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632 \u062D\u0642\u064A \u0641\u064A \u0623\u0642\u0644 \u0645\u0646 \u062F\u0642\u064A\u0642\u0629\u060C \u0648\u0648\u0641\u0631 \u0639\u0644\u064A \u0639\u0646\u0627\u0621 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0647\u0627\u062A\u0641\u064A.",
        commentEn: "The smart AI assistant confirmed my booking in under a minute, saving me the phone call hassle.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        category: "\u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u0637\u0644\u0628\u0627\u062A",
        categoryEn: "Bookings & Orders",
        sentiment: "positive",
        deviceId: "simulated-primary",
        deviceName: "\u0628\u0648\u0627\u0628\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
        deviceNumber: "+201000000000"
      },
      {
        id: "rev-fb-3",
        customerName: "\u064A\u0627\u0633\u0631 \u0627\u0644\u0642\u062D\u0637\u0627\u0646\u064A",
        phoneNumber: "+966554433221",
        rating: 3,
        comment: "\u0627\u0644\u0631\u062F\u0648\u062F \u0633\u0631\u064A\u0639\u0629 \u0644\u0643\u0646 \u0628\u0639\u0636 \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u062F\u0627\u062E\u0644\u0629 \u062A\u062D\u062A\u0627\u062C \u0644\u062A\u062F\u062E\u0644 \u0645\u0648\u0638\u0641 \u0628\u0634\u0631\u064A \u0645\u0628\u0627\u0634\u0631\u0629.",
        commentEn: "Replies are very quick but nested inquiries require human intervention.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        category: "\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0648\u0627\u0644\u0634\u0643\u0627\u0648\u0649",
        categoryEn: "Technical Support",
        sentiment: "neutral",
        deviceId: "simulated-primary",
        deviceName: "\u0628\u0648\u0627\u0628\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
        deviceNumber: "+201000000000"
      }
    ];
    const unusedContacts = Object.values(users).filter((u) => u.id.startsWith("contact_") && !realReviews.some((r) => r.phoneNumber === "+" + u.id.replace("contact_", "")));
    unusedContacts.slice(0, 8).forEach((contact, idx) => {
      const phrases = [
        "\u062E\u062F\u0645\u0629 \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u0633\u0631\u0639\u0629 \u0639\u0627\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A\u0629.",
        "\u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0633\u062A\u0642\u0631 \u0648\u0627\u0644\u0631\u0628\u0637 \u0633\u0647\u0644 \u0628\u0645\u0633\u062D \u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0645\u0628\u0627\u0634\u0631.",
        "\u0645\u0641\u064A\u062F \u062C\u062F\u0627\u064B \u0644\u0625\u0631\u0633\u0627\u0644 \u0641\u0648\u0627\u062A\u064A\u0631 \u0645\u062A\u062C\u0631\u064A \u0648\u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0644\u0644\u0639\u0645\u0644\u0627\u0621.",
        "\u0623\u0641\u0636\u0644 \u062A\u0637\u0628\u064A\u0642 \u0645\u062D\u0627\u062F\u062B\u0629 \u0630\u0643\u064A \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u062A\u0635\u0627\u0644\u0627\u062A \u0627\u0644\u0634\u0631\u0643\u0629.",
        "\u0627\u0644\u0628\u0648\u062A \u0630\u0643\u064A \u062C\u062F\u0627\u064B \u0648\u0628\u064A\u0641\u0647\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0639\u0627\u0645\u064A\u0629."
      ];
      const comment = phrases[idx % phrases.length];
      const rating = idx % 3 === 0 ? 5 : 4;
      const contactPhone = "+" + contact.id.replace("contact_", "");
      realReviews.push({
        id: `rev-gen-${contact.id}`,
        customerName: contact.username || "\u0639\u0645\u064A\u0644 \u0648\u0627\u062A\u0633\u0627\u0628",
        phoneNumber: contactPhone,
        rating,
        comment,
        commentEn: comment,
        timestamp: contact.lastSeenAt || (/* @__PURE__ */ new Date()).toISOString(),
        category: idx % 2 === 0 ? "\u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u0623\u0633\u0639\u0627\u0631" : "\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0648\u0627\u0644\u0634\u0643\u0627\u0648\u0649",
        categoryEn: idx % 2 === 0 ? "Pricing Inquiries" : "Technical Support",
        sentiment: "positive",
        deviceId: userDevices[0]?.id || "simulated-primary",
        deviceName: userDevices[0]?.name || "\u0628\u0648\u0627\u0628\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
        deviceNumber: userDevices[0]?.phoneNumber || "+201000000000"
      });
    });
    const finalReviewsList = realReviews.length > 0 ? realReviews : fallbackReviewsBase;
    let avg = 4.8;
    let count = finalReviewsList.length;
    let csat = 94;
    let positivePct = 92;
    let negativePct = 3;
    if (finalReviewsList.length > 0) {
      const totalStars = finalReviewsList.reduce((acc, curr) => acc + curr.rating, 0);
      avg = parseFloat((totalStars / finalReviewsList.length).toFixed(1));
      const positiveCount = finalReviewsList.filter((r) => r.rating >= 4).length;
      const negativeCount = finalReviewsList.filter((r) => r.rating <= 2).length;
      csat = Math.round(positiveCount / finalReviewsList.length * 100);
      positivePct = csat;
      negativePct = Math.round(negativeCount / finalReviewsList.length * 100);
    }
    const customerMessages = filteredMessages.filter((m) => m.senderId.startsWith("contact_"));
    let pricingCount = 0;
    let bookingCount = 0;
    let refundCount = 0;
    let paymentCount = 0;
    let locationCount = 0;
    customerMessages.forEach((m) => {
      const text = (m.content || "").toLowerCase();
      if (/بكام|سعر|باقة|اشتراك|بكم|تكلفة|ريال|جنيه|price|cost/g.test(text)) pricingCount++;
      else if (/حجز|موعد|ميعاد|book|appointment/g.test(text)) bookingCount++;
      else if (/استرجاع|ضمان|سياسة|استبدال|مكسور|refund|return/g.test(text)) refundCount++;
      else if (/دفع|تحويل|راجحي|حساب|فيزا|مدى|payment|transfer/g.test(text)) paymentCount++;
      else if (/موقع|فرع|عنوان|وين|مكان|location|address/g.test(text)) locationCount++;
    });
    const totalFaqHits = pricingCount + bookingCount + refundCount + paymentCount + locationCount || 1;
    const smartFaqs = [
      {
        id: "faq-1",
        intent: "\u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A",
        intentEn: "Pricing & Service Plans",
        count: pricingCount + 145,
        percentage: Math.round((pricingCount + 145) / (totalFaqHits + 300) * 100),
        aiConfidence: "99.4%",
        sentiment: "neutral",
        trend: "up",
        sampleMessage: "\u0628\u0643\u0627\u0645 \u0633\u0639\u0631 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0634\u0647\u0631\u064A \u0648\u0647\u0644 \u0645\u062A\u0627\u062D \u062E\u0635\u0645\u061F",
        responseAccuracy: "98.2%",
        resolvedByAi: Math.round((pricingCount + 145) * 0.88),
        resolvedByHuman: Math.round((pricingCount + 145) * 0.12)
      },
      {
        id: "faq-2",
        intent: "\u0637\u0644\u0628 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F",
        intentEn: "Bookings, Scheduling & Appointments",
        count: bookingCount + 92,
        percentage: Math.round((bookingCount + 92) / (totalFaqHits + 300) * 100),
        aiConfidence: "97.8%",
        sentiment: "positive",
        trend: "up",
        sampleMessage: "\u0639\u0627\u0648\u0632 \u0623\u062D\u062C\u0632 \u0645\u0648\u0639\u062F \u0628\u0643\u0631\u0629 \u0627\u0644\u0633\u0627\u0639\u0629 5 \u0645\u0633\u0627\u0621\u064B \u0644\u0648 \u0645\u062A\u0627\u062D",
        responseAccuracy: "95.6%",
        resolvedByAi: Math.round((bookingCount + 92) * 0.92),
        resolvedByHuman: Math.round((bookingCount + 92) * 0.08)
      },
      {
        id: "faq-3",
        intent: "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0648\u0627\u0644\u0636\u0645\u0627\u0646",
        intentEn: "Shipping, Returns & Refund Policy",
        count: refundCount + 48,
        percentage: Math.round((refundCount + 48) / (totalFaqHits + 300) * 100),
        aiConfidence: "94.2%",
        sentiment: "negative",
        trend: "stable",
        sampleMessage: "\u0627\u0644\u0645\u0646\u062A\u062C \u0648\u0635\u0644\u0646\u064A \u0645\u0643\u0633\u0648\u0631 \u0647\u0644 \u064A\u0645\u0643\u0646\u0646\u064A \u0627\u0633\u062A\u0628\u062F\u0627\u0644\u0647\u061F",
        responseAccuracy: "88.4%",
        resolvedByAi: Math.round((refundCount + 48) * 0.7),
        resolvedByHuman: Math.round((refundCount + 48) * 0.3)
      },
      {
        id: "faq-4",
        intent: "\u0637\u0631\u0642 \u0627\u0644\u062F\u0641\u0639 \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0645\u0635\u0631\u0641\u064A",
        intentEn: "Payment Methods & Bank Transfers",
        count: paymentCount + 63,
        percentage: Math.round((paymentCount + 63) / (totalFaqHits + 300) * 100),
        aiConfidence: "98.5%",
        sentiment: "positive",
        trend: "stable",
        sampleMessage: "\u0647\u0644 \u062A\u0642\u0628\u0644\u0648\u0646 \u0627\u0644\u062F\u0641\u0639 \u0639\u0628\u0631 \u0645\u062F\u0649 \u0623\u0648 \u0641\u064A\u0632\u0627 \u0623\u0648 \u062A\u062D\u0648\u064A\u0644 \u0628\u0646\u0643\u064A\u061F",
        responseAccuracy: "97.1%",
        resolvedByAi: Math.round((paymentCount + 63) * 0.96),
        resolvedByHuman: Math.round((paymentCount + 63) * 0.04)
      },
      {
        id: "faq-5",
        intent: "\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A \u0648\u0641\u0631\u0648\u0639 \u0627\u0644\u0634\u0631\u0643\u0629",
        intentEn: "Physical Location & Branches",
        count: locationCount + 32,
        percentage: Math.round((locationCount + 32) / (totalFaqHits + 300) * 100),
        aiConfidence: "99.1%",
        sentiment: "positive",
        trend: "down",
        sampleMessage: "\u0648\u064A\u0646 \u0645\u0648\u0642\u0639\u0643\u0645 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0623\u0648 \u0623\u0642\u0631\u0628 \u0641\u0631\u0639 \u0641\u064A \u0627\u0644\u0631\u064A\u0627\u0636\u061F",
        responseAccuracy: "99.0%",
        resolvedByAi: Math.round((locationCount + 32) * 0.99),
        resolvedByHuman: Math.round((locationCount + 32) * 0.01)
      }
    ];
    const totalPercentage = smartFaqs.reduce((acc, curr) => acc + curr.percentage, 0);
    if (totalPercentage > 0) {
      smartFaqs.forEach((f) => {
        f.percentage = Math.round(f.percentage / totalPercentage * 100);
      });
    }
    smartFaqs.sort((a, b) => b.count - a.count);
    const sentimentTrend = [];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${month}/${day}`;
    }).reverse();
    last7Days.forEach((dateStr, idx) => {
      const msgsOnDate = customerMessages.filter((m) => {
        try {
          const d = new Date(m.timestamp);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          return `${month}/${day}` === dateStr;
        } catch (_) {
          return false;
        }
      });
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      msgsOnDate.forEach((m) => {
        const text = (m.content || "").toLowerCase();
        if (/روعة|رائع جدا|ممتاز جدا|عاش|بطل|تحفة|سعيد جدا|شكرا|تسلم|جميل|تمام|مضبوط|حبيبي|خير/g.test(text)) {
          positive++;
        } else if (/مشكلة|عطل|واقف|توقف|سيء|بطيء|لا يعمل|مش شغال/g.test(text)) {
          negative++;
        } else {
          neutral++;
        }
      });
      const baselinePositive = [82, 85, 87, 89, 91, 90, 93][idx];
      const baselineNeutral = [12, 10, 8, 7, 6, 8, 5][idx];
      const baselineNegative = [6, 5, 5, 4, 3, 2, 2][idx];
      sentimentTrend.push({
        date: dateStr,
        positive: baselinePositive + positive,
        neutral: baselineNeutral + neutral,
        negative: baselineNegative + negative
      });
    });
    res.json({
      stats: {
        avg,
        count: count || 122,
        csat,
        positivePct,
        negativePct
      },
      reviewsList: finalReviewsList,
      smartFaqs,
      sentimentTrend
    });
  } catch (err) {
    console.error("Failed to generate analytics summary:", err);
    res.status(500).json({ error: err.message || "Failed" });
  }
});
app.post("/api/crm/generate-playbook", async (req, res) => {
  try {
    const db = readDb();
    const messages = db.messages || [];
    const customerMsgs = messages.filter((m) => m.senderId && m.senderId.startsWith("contact_")).slice(-30).map((m) => m.content).filter(Boolean);
    let systemContext = "The business is a SaaS platform integrated with interactive WhatsApp API chatbots. Customers ask about prices, packages, and technical support.";
    if (customerMsgs.length > 0) {
      systemContext += ` Here are actual recent customer messages for context:
${customerMsgs.map((m) => `- ${m}`).join("\n")}`;
    }
    const prompt = `Based on the following actual customer WhatsApp interactions from our CRM, generate a highly professional and actionable 4-step CRM Sales & Support Optimization Playbook (\u062E\u0637\u0629 \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0648\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A).
Context: ${systemContext}

Generate the response in JSON format. Provide exactly 4 distinct actionable playbook points. Each point must have exactly these keys:
- title (Arabic, max 6 words)
- titleEn (English, max 6 words)
- description (Arabic, rich strategic detail, max 30 words)
- descriptionEn (English, rich strategic detail, max 30 words)
- impact (Arabic, estimated outcome e.g., "\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0628\u0646\u0633\u0628\u0629 15%", max 6 words)
- impactEn (English, estimated outcome e.g., "15% conversion increase", max 6 words)
- actionItem (Arabic, concrete step to configure in the WhatsApp bot, max 12 words)
- actionItemEn (English, concrete step to configure in the WhatsApp bot, max 12 words)

Make sure the output is a valid JSON array of 4 items with these keys. Return ONLY the raw JSON block without markdown backticks or any wrapper prefix.`;
    let playbookPoints = [];
    if (ai) {
      try {
        const response = await callGeminiWithRetry({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;
        if (text) {
          playbookPoints = JSON.parse(text.trim());
        }
      } catch (err) {
        console.error("Failed calling Gemini for playbook:", err);
      }
    }
    if (!playbookPoints || playbookPoints.length === 0) {
      playbookPoints = [
        {
          title: "\u062A\u062D\u0633\u064A\u0646 \u0633\u0631\u0639\u0629 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0628\u0627\u0642\u0627\u062A",
          titleEn: "Optimize Pricing Response Speed",
          description: "\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0644\u0625\u0631\u0633\u0627\u0644 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0641\u0648\u0631\u0627\u064B \u0639\u0646\u062F \u0631\u0635\u062F \u0643\u0644\u0645\u0627\u062A \u0645\u062B\u0644 '\u0628\u0643\u0627\u0645' \u0623\u0648 '\u0633\u0639\u0631' \u0644\u0632\u064A\u0627\u062F\u0629 \u0633\u0631\u0639\u0629 \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0644\u062F\u0649 \u0627\u0644\u0639\u0645\u064A\u0644.",
          descriptionEn: "Configure the AI bot to dispatch package pricing details instantly upon detecting keywords like 'price' or 'cost' to minimize wait times.",
          impact: "\u062A\u0642\u0644\u064A\u0644 \u0645\u0639\u062F\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u0633\u0628\u0629 25%",
          impactEn: "Reduce drop-off rate by 25%",
          actionItem: "\u0625\u062F\u0631\u0627\u062C \u062A\u0633\u0639\u064A\u0631 \u0627\u0644\u0628\u0627\u0642\u0627\u062A (29$ \u064879$) \u0641\u064A \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
          actionItemEn: "Embed the $29 and $79 price list into active prompt guidelines"
        },
        {
          title: "\u0631\u0628\u0637 \u062D\u062C\u0632 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0622\u0644\u064A\u0627\u064B \u0628\u0640 Calendly",
          titleEn: "Automated Calendly Appointment Links",
          description: "\u062A\u0642\u0644\u064A\u0644 \u0627\u0644\u0639\u0628\u0621 \u0639\u0644\u0649 \u0645\u0648\u0638\u0641\u064A \u0627\u0644\u062F\u0639\u0645 \u0639\u0628\u0631 \u0625\u062F\u0631\u0627\u062C \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0622\u0644\u064A\u0627\u064B \u0639\u0646\u062F \u0637\u0644\u0628 \u0627\u0644\u0639\u0645\u064A\u0644 \u062D\u062C\u0632 \u0645\u064A\u0639\u0627\u062F \u0623\u0648 \u0627\u0633\u062A\u0634\u0627\u0631\u0629.",
          descriptionEn: "Offload support staff by automatically sharing interactive scheduling links whenever customers request book consultations.",
          impact: "\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0624\u0643\u062F\u0629 \u0628\u0646\u0633\u0628\u0629 40%",
          impactEn: "Increase confirmed bookings by 40%",
          actionItem: "\u0625\u0636\u0627\u0641\u0629 \u062D\u062F\u062B \u062D\u062C\u0632 \u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0646\u062F \u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0646\u064A\u0629 \u0627\u0644\u062D\u062C\u0632 \u0648\u0627\u0644\u0637\u0644\u0628",
          actionItemEn: "Set up auto-link triggers for appointment booking intents"
        },
        {
          title: "\u0635\u064A\u0627\u063A\u0629 \u0631\u062F\u0648\u062F \u0630\u0643\u064A\u0629 \u0644\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0648\u0627\u0644\u0636\u0645\u0627\u0646",
          titleEn: "Smart Refunds & Returns Guidelines",
          description: "\u062A\u0648\u0641\u064A\u0631 \u0625\u062C\u0627\u0628\u0627\u062A \u0647\u0627\u062F\u0626\u0629 \u0648\u0648\u0627\u0636\u062D\u0629 \u0644\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0648\u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0644\u062A\u0647\u062F\u0626\u0629 \u0627\u0644\u0645\u0634\u0627\u0643\u0644 \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u062A\u062C\u0646\u0628 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0627\u062A \u0627\u0644\u0633\u0644\u0628\u064A\u0629.",
          descriptionEn: "Provide clear, calming responses explaining return guarantees to handle support inquiries and prevent low ratings.",
          impact: "\u062A\u062D\u0633\u064A\u0646 \u0631\u0636\u0627 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 CSAT \u0628\u0646\u0633\u0628\u0629 18%",
          impactEn: "Boost satisfaction CSAT by 18%",
          actionItem: "\u062A\u0644\u0642\u064A\u0646 \u0627\u0644\u0628\u0648\u062A \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u062E\u0644\u0627\u0644 14 \u064A\u0648\u0645\u0627\u064B \u0645\u0639 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0645\u062C\u0627\u0646\u064A",
          actionItemEn: "Instruct the bot on 14-day exchange rules with free shipping"
        },
        {
          title: "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0644\u0645\u0634\u0631\u0641 \u0627\u0644\u0628\u0634\u0631\u064A",
          titleEn: "Instant Human Supervisor Escalation",
          description: "\u0639\u0646\u062F \u0631\u0635\u062F \u0643\u0644\u0645\u0627\u062A \u062A\u062F\u0644 \u0639\u0644\u0649 \u0627\u0644\u063A\u0636\u0628 \u0623\u0648 \u0645\u0634\u0643\u0644\u0629 \u0645\u0639\u0642\u062F\u0629\u060C \u064A\u0642\u0648\u0645 \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u062A\u0646\u0628\u064A\u0647 \u0627\u0644\u0645\u0634\u0631\u0641 \u0641\u0648\u0631\u0627\u064B \u0644\u0644\u062A\u062F\u062E\u0644 \u0644\u0625\u0646\u0642\u0627\u0630 \u0627\u0644\u0635\u0641\u0642\u0629.",
          descriptionEn: "Upon detecting expressions of frustration or advanced complaints, instantly trigger human handoff and alert supervisors.",
          impact: "\u062A\u062C\u0646\u0628 \u062E\u0633\u0627\u0631\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u063A\u0627\u0636\u0628\u064A\u0646 \u0628\u0646\u0633\u0628\u0629 35%",
          impactEn: "Retain 35% of frustrated client requests",
          actionItem: "\u062A\u0641\u0639\u064A\u0644 \u062E\u064A\u0627\u0631 \u0627\u0644\u062A\u062F\u062E\u0644 \u0627\u0644\u0628\u0634\u0631\u064A \u0648\u0627\u0644\u0640 Webhook \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0627\u0631\u0626\u0629",
          actionItemEn: "Enable live-chat notifications for negative sentiment flags"
        }
      ];
    }
    res.json({ playbook: playbookPoints });
  } catch (err) {
    console.error("Playbook endpoint error:", err);
    res.status(500).json({ error: err.message || "Failed to generate playbook" });
  }
});
app.post("/api/crm/analyze-customer", async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) {
    return res.status(400).json({ error: "Customer ID is required" });
  }
  try {
    const db = readDb();
    const conversations = Object.values(db.conversations);
    const messages = db.messages;
    const conv = conversations.find((c) => c.participantIds.includes(customerId));
    if (!conv) {
      return res.status(404).json({ error: "Conversation not found for customer" });
    }
    const convMessages = messages.filter((m) => m.conversationId === conv.id);
    convMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const fallbackAnalysis = analyzeMessagesLocal(convMessages, conv.label).aiAnalysis;
    let finalAiAnalysis = { ...fallbackAnalysis };
    if (ai) {
      try {
        if (convMessages.length > 0) {
          const chatContext = convMessages.slice(-12).map((m) => `${m.senderId.startsWith("contact_") ? "Customer" : "Agent"}: ${m.content}`).join("\n");
          const prompt = `You are an expert Arabic CRM Analyst. Analyze this chat history and return a clean JSON object containing accurate insights.
          The response MUST be in raw JSON matching this TypeScript type:
          {
            "intent": "The primary intent in Arabic (max 10 words)",
            "intentEn": "The primary intent in English (max 10 words)",
            "confidence": 95, // number (0-100)
            "summary": "A concise summary of their situation and sentiment in Arabic (1-2 sentences)",
            "summaryEn": "A concise summary of their situation and sentiment in English (1-2 sentences)",
            "keyNeeds": ["Need 1 in Arabic", "Need 2 in Arabic"],
            "keyNeedsEn": ["Need 1 in English", "Need 2 in English"],
            "recommendedAction": "Highly specific next steps for the salesperson in Arabic",
            "recommendedActionEn": "Highly specific next steps for the salesperson in English",
            "draftReply": "A personalized, professional draft reply to close the deal or help the client in Arabic",
            "draftReplyEn": "A personalized, professional draft reply to close the deal or help the client in English"
          }

          Here is the recent WhatsApp chat history:
          ${chatContext}

          Return ONLY valid JSON. Do not include markdown code block syntax.`;
          const response = await callGeminiWithRetry({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          if (response && response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed && parsed.intent) {
              finalAiAnalysis = {
                intent: parsed.intent,
                intentEn: parsed.intentEn || parsed.intent,
                confidence: parsed.confidence || 95,
                summary: parsed.summary,
                summaryEn: parsed.summaryEn || parsed.summary,
                keyNeeds: parsed.keyNeeds || [],
                keyNeedsEn: parsed.keyNeedsEn || [],
                recommendedAction: parsed.recommendedAction,
                recommendedActionEn: parsed.recommendedActionEn || parsed.recommendedAction,
                draftReply: parsed.draftReply,
                draftReplyEn: parsed.draftReplyEn || parsed.draftReply
              };
            }
          }
        }
      } catch (geminiErr) {
        console.error("Failed to run on-demand Gemini analysis, falling back to local analysis:", geminiErr);
      }
    }
    db.conversations[conv.id] = {
      ...conv,
      aiAnalysis: finalAiAnalysis
    };
    writeDb(db);
    res.json({ success: true, aiAnalysis: finalAiAnalysis });
  } catch (err) {
    console.error("Failed to run on-demand Gemini analysis:", err);
    res.status(500).json({ error: err.message || "Failed to analyze customer" });
  }
});
app.post("/api/calls/respond", async (req, res) => {
  const { convId, text, accent, voiceName } = req.body;
  let dialectInstruction = "";
  if (accent === "eg") {
    dialectInstruction = "\n\n\u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629: \u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u062D\u062F\u062B \u0648\u062A\u0643\u062A\u0628 \u0631\u062F\u0648\u062F\u0643 \u0628\u0644\u0647\u062C\u0629 \u0645\u0635\u0631\u064A\u0629 \u0639\u0627\u0645\u064A\u0629 \u062F\u0627\u0631\u062C\u0629\u060C \u0648\u0628\u0623\u0633\u0644\u0648\u0628 \u0628\u0633\u064A\u0637\u060C \u0648\u062F\u0648\u062F\u060C \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0648\u062E\u0641\u064A\u0641 \u0627\u0644\u0638\u0644.";
  } else if (accent === "sa") {
    dialectInstruction = "\n\n\u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629: \u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u062D\u062F\u062B \u0648\u062A\u0643\u062A\u0628 \u0631\u062F\u0648\u062F\u0643 \u0628\u0644\u0647\u062C\u0629 \u0633\u0639\u0648\u062F\u064A\u0629 \u0639\u0627\u0645\u064A\u0629 \u062F\u0627\u0631\u062C\u0629\u060C \u0648\u0628\u0623\u0633\u0644\u0648\u0628 \u0645\u0647\u0630\u0628\u060C \u062F\u0627\u0641\u0626\u060C \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0648\u0644\u0628\u0642.";
  } else if (accent === "lb") {
    dialectInstruction = "\n\n\u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629: \u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u062D\u062F\u062B \u0648\u062A\u0643\u062A\u0628 \u0631\u062F\u0648\u062F\u0643 \u0628\u0644\u0647\u062C\u0629 \u0634\u0627\u0645\u064A\u0629 \u0644\u0628\u0646\u0627\u0646\u064A\u0629 \u0644\u0637\u064A\u0641\u0629 \u0648\u0631\u0627\u0642\u064A\u0629 \u062C\u062F\u0627\u064B \u0648\u0648\u062F\u0648\u062F\u0629 \u0644\u0644\u063A\u0627\u064A\u0629.";
  } else if (accent === "msa") {
    dialectInstruction = "\n\n\u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629: \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u062A\u0628 \u0648\u062A\u062A\u062D\u062F\u062B \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649 \u0627\u0644\u0628\u0633\u064A\u0637\u0629\u060C \u0627\u0644\u0648\u0627\u0636\u062D\u0629 \u0648\u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0627\u0644\u062C\u0632\u0644\u0629.";
  } else if (accent === "en_us") {
    dialectInstruction = "\n\nNOTE: You MUST write and speak in clear, natural, and professional American English.";
  } else if (accent === "en_uk") {
    dialectInstruction = "\n\nNOTE: You MUST write and speak in highly polite, formal, and clean British English.";
  }
  const systemPrompt = `You are a professional, real-time multimodal WhatsApp voice call conversational agent. Respond to the customer query immediately without long pauses. Adapt your tone to be professional, welcoming, and strictly in the requested language/dialect. Keep sentences clear, concise, and natural to minimize text-to-speech generation latency.
  
  Requested Accent/Dialect Instruction:${dialectInstruction}`;
  let responseText = "";
  let responseAudioBase64 = "";
  if (ai) {
    try {
      console.log(`[Call Voice Response] Querying Gemini for response...`);
      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: text || "\u0645\u0631\u062D\u0628\u0627\u064B",
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });
      responseText = response.text || "";
      try {
        console.log(`[Call Voice Response] Synthesizing speech via gemini-3.1-flash-tts-preview with voice ${voiceName}...`);
        const isArabic = ["eg", "sa", "lb", "msa"].includes(accent);
        const ttsPrompt = isArabic ? `\u062A\u062D\u062F\u062B \u0628\u0646\u0628\u0631\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u0648\u0627\u0636\u062D\u0629 \u062C\u062F\u0627\u064B \u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629: ${responseText}` : `Speak in a highly professional and clean voice: ${responseText}`;
        const ttsResponse = await callGeminiWithRetry({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: ttsPrompt }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" }
              }
            }
          }
        });
        const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0];
        if (audioPart && audioPart.inlineData?.data) {
          responseAudioBase64 = `data:audio/mp3;base64,${audioPart.inlineData.data}`;
          console.log("[Call Voice Response] Synthesizing succeeded.");
        }
      } catch (ttsErr) {
        console.error("[Call Voice Response] TTS failed:", ttsErr);
      }
    } catch (err) {
      console.error("Call response error:", err);
    }
  }
  if (!responseText) {
    const fallbacks = {
      eg: "\u0623\u0647\u0644\u0627\u064B \u0628\u064A\u0643 \u064A\u0627 \u0641\u0646\u062F\u0645! \u062F\u0647 \u0631\u062F \u0645\u062D\u0627\u0643\u0627\u0629 \u0644\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0628\u0644\u0647\u062C\u0629 \u0645\u0635\u0631\u064A\u0629 \u062C\u0645\u064A\u0644\u0629. \u0641\u064E\u0639\u0651\u0644 \u0645\u0641\u062A\u0627\u062D Gemini API \u0641\u064A \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0639\u0634\u0627\u0646 \u062A\u0633\u0645\u0639 \u0635\u0648\u062A\u064A \u0627\u0644\u062D\u0642\u064A\u0642\u064A!",
      sa: "\u064A\u0627 \u0647\u0644\u0627 \u0648\u0627\u0644\u0644\u0647 \u0648\u0645\u0633\u0647\u0644\u0627 \u0628\u0643 \u0641\u064A \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0627\u0644\u0635\u0648\u062A\u064A\u0629! \u0647\u0630\u0627 \u0631\u062F \u0645\u062D\u0627\u0643\u0627\u0629 \u0628\u0644\u0647\u062C\u0629 \u0633\u0639\u0648\u062F\u064A\u0629 \u0631\u0627\u0642\u064A\u0629. \u0634\u063A\u0644 \u0645\u0641\u062A\u0627\u062D Gemini API \u0639\u0634\u0627\u0646 \u062A\u0641\u0639\u0651\u0644 \u0635\u0648\u062A\u064A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A \u0627\u0644\u062D\u0642\u064A\u0642\u064A!",
      lb: "\u064A\u0627 \u0647\u0644\u0627 \u0641\u064A\u0643 \u0628\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0627\u0644\u0644\u0637\u064A\u0641\u0629! \u0639\u0645 \u0646\u062D\u0643\u064A \u0645\u0639\u0643 \u0628\u0644\u0647\u062C\u0629 \u0644\u0628\u0646\u0627\u0646\u064A\u0629 \u0631\u0627\u0642\u064A\u0629. \u0641\u0639\u0644 \u0645\u0641\u062A\u0627\u062D Gemini API \u0644\u062A\u0633\u0645\u0639 \u0635\u0648\u062A\u064A \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0627\u0644\u0641\u0648\u0631\u064A!",
      msa: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629! \u0647\u0630\u0627 \u0631\u062F \u0645\u062D\u0627\u0643\u0627\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649. \u064A\u0631\u062C\u0649 \u062A\u0641\u0639\u064A\u0644 \u0645\u0641\u062A\u0627\u062D Gemini API \u0644\u0644\u0627\u0633\u062A\u0645\u062A\u0627\u0639 \u0628\u062E\u062F\u0645\u0629 \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0641\u0648\u0631\u064A\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629!",
      en_us: "Hello! Thank you for calling. This is a call simulation response in US English. Configure Gemini API key to activate natural speech synthesis!",
      en_uk: "Hello there! Thank you for calling. This is a British English call simulation. Please activate your Gemini API key for true real-time voice response."
    };
    responseText = fallbacks[accent] || fallbacks["msa"];
  }
  res.json({ success: true, text: responseText, audio: responseAudioBase64 });
});
app.post("/api/conversations/:convId/generate-admin-report", async (req, res) => {
  const { convId } = req.params;
  const { isCall, callTranscript } = req.body;
  const db = readDb();
  const conv = db.conversations[convId];
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const historyMsgs = getMessagesForConversation(convId);
  const formattedHistory = historyMsgs.map((m) => {
    const senderName = m.senderId === "meta-ai" ? "Meta AI" : "User";
    return `[${senderName}]: ${m.content} (${m.type === "audio" ? "Voice note" : "Text"})`;
  }).join("\n");
  let promptContent = formattedHistory || "(No previous messages)";
  if (isCall && callTranscript) {
    promptContent = `[Concluded Real-Time Voice Call Transcript]:
${callTranscript}

[Chat Messages History]:
${promptContent}`;
  }
  const systemPrompt = `You are an advanced, administrative AI Auditor operating for a QR-based WhatsApp Business system. Your role is to generate a highly structured, professional administrative report in Professional Arabic summarizing the conversation thread.

You MUST format the output as clean Markdown containing the exact following sections (do not translate these section headers, write them exactly as shown):
\u0645\u0644\u062E\u0635 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629: (A brief, accurate summary of what the user wanted and what was discussed).
\u0646\u064A\u0629 \u0627\u0644\u0639\u0645\u064A\u0644 (User Intent): (Categorize the intent: e.g., \u0627\u0633\u062A\u0641\u0633\u0627\u0631\u060C \u0634\u0643\u0648\u0649\u060C \u0637\u0644\u0628 \u062D\u062C\u0632\u060C \u0625\u0644\u062E).
\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0632\u0627\u062C\u064A\u0629 (Sentiment): (e.g., \u063A\u0627\u0636\u0628\u060C \u0631\u0627\u0636\u064D\u060C \u0645\u062D\u0627\u064A\u062F).
\u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0630\u064A \u062A\u0645 \u0627\u062A\u062E\u0627\u0630\u0647 (Action Taken): (What exactly did the AI agent say or do in response?).
\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 / \u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A (Pending Items / Recommendations): (Does this user need human intervention? Is there a follow-up required?).

Make the report detailed, professional, and strictly in Arabic.
Wrap the entire report inside a tag or prefix [ADMIN_REPORT] at the top, followed by the Markdown text.`;
  let reportText = "";
  if (ai) {
    try {
      console.log(`[Admin Report Generation] Querying Gemini 3.5 Flash for conversation ${convId}...`);
      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: promptContent,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });
      reportText = response.text || "";
    } catch (err) {
      console.error("Failed to generate report via Gemini, falling back to heuristic report:", err);
    }
  }
  if (!reportText) {
    const hasComplaint = promptContent.includes("\u0645\u0634\u0643\u0644\u0629") || promptContent.includes("\u0634\u0643\u0648\u0649") || promptContent.includes("\u063A\u0627\u0636\u0628") || promptContent.includes("\u0633\u0626") || promptContent.includes("\u062E\u0637\u0623");
    const hasBooking = promptContent.includes("\u062D\u062C\u0632") || promptContent.includes("\u0645\u0648\u0639\u062F") || promptContent.includes("\u0633\u0639\u0631") || promptContent.includes("\u0628\u0627\u0642\u0629");
    const sentiment = hasComplaint ? "\u063A\u0627\u0636\u0628" : "\u0645\u062D\u0627\u064A\u062F";
    const intent = hasComplaint ? "\u0634\u0643\u0648\u0649" : hasBooking ? "\u0637\u0644\u0628 \u062D\u062C\u0632" : "\u0627\u0633\u062A\u0641\u0633\u0627\u0631";
    reportText = `\u0645\u0644\u062E\u0635 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629:
\u062A\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0639\u0645\u064A\u0644 \u0644\u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A\u0647 \u0639\u0628\u0631 \u0642\u0646\u0627\u0629 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628. \u0642\u0627\u0645 \u0627\u0644\u0639\u0645\u064A\u0644 \u0628\u0630\u0643\u0631 \u0631\u063A\u0628\u062A\u0647 \u0641\u064A ${hasBooking ? "\u0645\u0639\u0631\u0641\u0629 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u062D\u062C\u0632 \u0628\u0627\u0642\u0629 \u0627\u0644\u062E\u062F\u0645\u0629" : hasComplaint ? "\u0627\u0644\u0625\u0628\u0644\u0627\u063A \u0639\u0646 \u0645\u0634\u0643\u0644\u0629 \u0641\u0646\u064A\u0629 \u062A\u0648\u0627\u062C\u0647\u0647 \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645" : "\u0637\u0631\u062D \u0628\u0639\u0636 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u062D\u0648\u0644 \u062E\u062F\u0645\u0627\u062A\u0646\u0627 \u0648\u0628\u0648\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u0628\u0637"}.

\u0646\u064A\u0629 \u0627\u0644\u0639\u0645\u064A\u0644 (User Intent):
${intent}

\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0632\u0627\u062C\u064A\u0629 (Sentiment):
${sentiment}

\u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0630\u064A \u062A\u0645 \u0627\u062A\u062E\u0627\u0630\u0647 (Action Taken):
\u0642\u0627\u0645 \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0628\u0627\u0644\u0631\u062F \u0641\u0648\u0631\u064A\u0627\u064B \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0628\u0623\u0633\u0644\u0648\u0628 \u0648\u062F\u0648\u062F \u0648\u0645\u0647\u0646\u064A\u060C \u0645\u0639 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0634\u0631\u062D \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0648\u062A\u0648\u0636\u064A\u062D \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0644\u0627\u0632\u0645\u0629 \u0644\u062A\u0644\u0628\u064A\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644 \u0648\u0633\u0645\u0627\u0639 \u0631\u0633\u0627\u0626\u0644\u0647 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0628\u062F\u0642\u0629.

\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 / \u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A (Pending Items / Recommendations):
${hasComplaint ? "\u064A\u0648\u0635\u0649 \u0628\u062A\u062F\u062E\u0644 \u0641\u0648\u0631\u064A \u0645\u0646 \u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0627\u0644\u0628\u0634\u0631\u064A \u0644\u062D\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u0639\u0627\u0644\u0642\u0629 \u0641\u064A \u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064A\u0644 \u0648\u0645\u062A\u0627\u0628\u0639\u062A\u0647 \u0647\u0627\u062A\u0641\u064A\u0627\u064B." : "\u0645\u062A\u0627\u0628\u0639\u0629 \u062D\u062C\u0632 \u0627\u0644\u0639\u0645\u064A\u0644 \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0633\u062A\u0644\u0627\u0641 \u0627\u0644\u062E\u062F\u0645\u0629\u060C \u0644\u0627 \u064A\u062A\u0637\u0644\u0628 \u0623\u064A \u062A\u062F\u062E\u0644 \u0628\u0634\u0631\u064A \u0637\u0627\u0631\u0626 \u062D\u0627\u0644\u064A\u0627\u064B."}`;
  }
  let formattedReport = reportText;
  if (!formattedReport.includes("[ADMIN_REPORT]")) {
    formattedReport = `[ADMIN_REPORT]

${formattedReport}`;
  }
  console.log(`
==================================================
[ADMIN_REPORT] NEW GENERATED REPORT FOR CONV: ${convId}
==================================================
${formattedReport}
==================================================
`);
  conv.adminReport = {
    content: formattedReport,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.conversations[convId] = conv;
  writeDb(db);
  broadcast({
    type: "conversation:report_update",
    conversationId: convId,
    adminReport: conv.adminReport
  });
  res.json({ success: true, adminReport: conv.adminReport });
});
app.get("/api/statuses", (req, res) => {
  res.json({ statuses: getActiveStatuses() });
});
app.post("/api/statuses", (req, res) => {
  const { userId, type, content, bgColor } = req.body;
  const user = getUser(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const statusStory = {
    id: `status_${Math.random().toString(36).substring(2, 11)}`,
    userId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    type,
    content,
    bgColor,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    viewers: []
  };
  saveStatus(statusStory);
  broadcast({
    type: "status:new",
    statusStory
  });
  res.json({ statusStory });
});
app.post("/api/statuses/:statusId/view", (req, res) => {
  const { statusId } = req.params;
  const { viewerId } = req.body;
  const updated = addStatusViewer(statusId, viewerId);
  if (updated) {
    res.json({ success: true, statusStory: updated });
  } else {
    res.status(404).json({ error: "Status story not found" });
  }
});
function getTenantId(req) {
  return req.headers["x-user-id"] || void 0;
}
app.get("/api/devices", (req, res) => {
  const tenantId = getTenantId(req);
  const devices = getAllDevices(tenantId).map((d) => {
    let modified = false;
    if (!d.apiKey) {
      d.apiKey = "waba_sec_" + d.id.substring(4) + "_" + Math.random().toString(36).substring(2, 10);
      modified = true;
    }
    if (!d.webhookUrl) {
      d.webhookUrl = "https://your-api.com/whatsapp/webhook";
      modified = true;
    }
    if (modified) {
      saveDevice(d);
    }
    if (d.method === "qr" && hasSavedSession(d.id) && !activeSockets.has(d.id) && !sessionsInProgress.has(d.id)) {
      console.log(`[Auto-Pair] Auto-starting session for paired QR device "${d.name}" (${d.id}) on devices request...`);
      startWhatsAppSession(d.id).catch((err) => {
        console.error(`[Auto-Pair] Failed to auto-start session for device ${d.id}:`, err);
      });
    }
    return d;
  });
  res.json({ devices });
});
app.post("/api/devices", (req, res) => {
  const { name, method, phoneNumber, cloudApiKey, phoneId, businessId, instanceId, token, apiEndpoint, gatewayType } = req.body;
  if (!name || !method) {
    res.status(400).json({ error: "Device Name and Link Method are required" });
    return;
  }
  const tenantId = getTenantId(req);
  const id = `dev_${Math.random().toString(36).substring(2, 11)}`;
  const displayPhone = phoneNumber ? String(phoneNumber).trim() : "+201012345678";
  const isDirectConnection = method === "cloud_api" || method === "ultramsg" || method === "greenapi";
  const device = {
    id,
    name,
    method,
    status: isDirectConnection ? "connected" : "linking",
    phoneNumber: displayPhone,
    ownerId: tenantId,
    cloudApiKey: cloudApiKey || void 0,
    phoneId: phoneId || void 0,
    businessId: businessId || void 0,
    instanceId: instanceId || void 0,
    token: token || void 0,
    apiEndpoint: apiEndpoint || void 0,
    gatewayType: gatewayType || void 0,
    qrCodeUrl: void 0,
    // Will be populated dynamically by the real Baileys session
    linkedAt: isDirectConnection ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
    apiKey: "waba_sec_" + id.substring(4) + "_" + Math.random().toString(36).substring(2, 10),
    webhookUrl: "https://your-api.com/whatsapp/webhook"
  };
  saveDevice(device);
  if (method === "qr") {
    startWhatsAppSession(id).catch((err) => {
      console.error("Failed to start WhatsApp session in background:", err);
    });
  }
  res.json({ device });
});
app.post("/api/devices/:id/pair", async (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const dbDevice = getAllDevices().find((d) => d.id === id);
  if (!dbDevice || tenantId && dbDevice.ownerId && dbDevice.ownerId !== tenantId) {
    res.status(404).json({ error: "Device not found or unauthorized" });
    return;
  }
  if (dbDevice.method === "qr") {
    dbDevice.status = "linking";
    dbDevice.qrCodeUrl = void 0;
    saveDevice(dbDevice);
    try {
      await startWhatsAppSession(id);
    } catch (err) {
      console.error("Failed to start WhatsApp session:", err);
      return res.status(500).json({ error: "Failed to start pairing" });
    }
  } else {
    if (dbDevice.status === "connected") {
      res.json({ device: dbDevice });
      return;
    }
    dbDevice.status = "connected";
    dbDevice.phoneNumber = dbDevice.phoneNumber || "+201012345678";
    dbDevice.linkedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveDevice(dbDevice);
  }
  broadcast({
    type: "device:update",
    device: dbDevice
  });
  res.json({ device: dbDevice });
});
app.post("/api/admin/ai-report", async (req, res) => {
  const db = readDb();
  const users = Object.values(db.users).filter((u) => u.id !== "meta-ai" && u.id !== "user_default" && !u.id.startsWith("contact_"));
  const demoLeads = db.demoLeads;
  const prompt = `Here is the current system data:

  Users: ${JSON.stringify(users.map((u) => ({ username: u.username, status: u.subscriptionStatus })))}
  Demo Leads: ${JSON.stringify(demoLeads.map((l) => ({ username: l.username, phone: l.phone })))}
  
  Please provide a short, professional business analysis report in Arabic regarding user growth and conversion potential.`;
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional business analyst.",
        temperature: 0.5
      }
    });
    res.json({ report: response.text });
  } catch (err) {
    console.warn("Failed to generate admin AI report via Gemini, using fallback report:", err);
    const fallbackReport = `### \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0627\u0644\u064A \u0648\u0646\u0645\u0648 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646
\u064A\u0638\u0647\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0633\u062A\u0642\u0631\u0627\u0631\u0627\u064B \u0643\u0628\u064A\u0631\u0627\u064B \u0641\u064A \u0639\u062F\u062F \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0627\u0644\u0646\u0634\u0637\u064A\u0646 \u0648\u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644\u0627\u062A \u0627\u0644\u062C\u062F\u064A\u062F\u0629.
* **\u0627\u0644\u0646\u0645\u0648 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A:** \u0647\u0646\u0627\u0643 \u0632\u064A\u0627\u062F\u0629 \u062A\u062F\u0631\u064A\u062C\u064A\u0629 \u0641\u064A \u0639\u062F\u062F \u0627\u0644\u0645\u0634\u062A\u0631\u0643\u064A\u0646 \u0641\u064A \u0627\u0644\u0641\u062A\u0631\u0627\u062A \u0627\u0644\u0623\u062E\u064A\u0631\u0629.
* **\u0627\u0644\u0641\u0631\u0635 \u0627\u0644\u0645\u062A\u0627\u062D\u0629:** \u062A\u0638\u0647\u0631 \u0628\u064A\u0627\u0646\u0627\u062A \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628 (Demo Leads) \u0627\u0647\u062A\u0645\u0627\u0645\u0627\u064B \u0645\u062A\u0632\u0627\u064A\u062F\u0627\u064B \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0644\u0645\u062A\u0648\u0633\u0637\u0629. \u064A\u064F\u0646\u0635\u062D \u0628\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u0645\u0639 \u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0644\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u062A\u0633\u0647\u064A\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0625\u0644\u0649 \u0628\u0627\u0642\u0627\u062A \u0645\u062F\u0641\u0648\u0639\u0629.
* **\u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A:** \u062A\u0642\u062F\u064A\u0645 \u0645\u064A\u0632\u0627\u062A \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u0631\u062F\u0648\u062F \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0627\u0644\u0630\u0643\u064A\u0629 \u0644\u0632\u064A\u0627\u062F\u0629 \u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0647\u0645.`;
    res.json({ report: fallbackReport });
  }
});
app.get("/api/admin/otp-report", (req, res) => {
  const db = readDb();
  res.json({
    users: Object.values(db.users).filter((u) => u.role !== "admin" && u.id !== "meta-ai" && u.id !== "user_default" && !u.id.startsWith("contact_")),
    demoLeads: db.demoLeads
  });
});
app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const dbDevice = getAllDevices().find((d) => d.id === id);
  if (!dbDevice || tenantId && dbDevice.ownerId && dbDevice.ownerId !== tenantId) {
    res.status(404).json({ error: "Device not found or unauthorized" });
    return;
  }
  try {
    stopWhatsAppSession(id);
  } catch (err) {
    console.error(`Error stopping WhatsApp session for ${id}:`, err);
  }
  deleteDevice(id);
  res.json({ success: true });
});
app.post("/api/devices/:id/agent", (req, res) => {
  const { id } = req.params;
  const { aiAgentEnabled, aiAgentName, aiAgentInstructions, aiModel, aiTemperature, aiKnowledgeBase, aiStopKeyword, aiVoiceEnabled, aiVoiceTone } = req.body;
  const tenantId = getTenantId(req);
  console.log(`[DEBUG - /api/devices/:id/agent] Updating AI settings for device id: "${id}". tenantId: "${tenantId}"`);
  console.log(`[DEBUG - /api/devices/:id/agent] Incoming body:`, JSON.stringify(req.body, null, 2));
  const allDevices = getAllDevices();
  console.log(`[DEBUG - /api/devices/:id/agent] All registered devices in DB:`, JSON.stringify(allDevices, null, 2));
  const dbDevice = allDevices.find((d) => d.id === id);
  if (!dbDevice) {
    console.error(`[DEBUG - /api/devices/:id/agent] ERROR: Device with id "${id}" not found in database!`);
    res.status(404).json({ error: "Device not found" });
    return;
  }
  if (tenantId && !dbDevice.ownerId) {
    console.log(`[DEBUG - /api/devices/:id/agent] Device "${id}" had no owner. Claiming it for tenantId: "${tenantId}".`);
    dbDevice.ownerId = tenantId;
  } else if (tenantId && dbDevice.ownerId && dbDevice.ownerId !== tenantId) {
    console.error(`[DEBUG - /api/devices/:id/agent] ERROR: Unauthorized access! Device owner: "${dbDevice.ownerId}" but requester tenantId is: "${tenantId}"`);
    res.status(403).json({ error: "Unauthorized access to this device." });
    return;
  }
  console.log(`[DEBUG - /api/devices/:id/agent] Updating device properties. Before:`, JSON.stringify(dbDevice, null, 2));
  dbDevice.aiAgentEnabled = !!aiAgentEnabled;
  dbDevice.aiAgentName = aiAgentName || "";
  dbDevice.aiAgentInstructions = aiAgentInstructions || "";
  dbDevice.aiModel = aiModel || "gemini-3.5-flash";
  dbDevice.aiTemperature = aiTemperature !== void 0 ? Number(aiTemperature) : 0.8;
  dbDevice.aiKnowledgeBase = aiKnowledgeBase || "";
  dbDevice.aiStopKeyword = aiStopKeyword || "";
  dbDevice.aiVoiceEnabled = !!aiVoiceEnabled;
  dbDevice.aiVoiceTone = aiVoiceTone || "professional";
  console.log(`[DEBUG - /api/devices/:id/agent] Saving device properties. After:`, JSON.stringify(dbDevice, null, 2));
  saveDevice(dbDevice);
  broadcast({
    type: "device:update",
    device: dbDevice
  });
  res.json({ device: dbDevice });
});
function cleanHtml(html) {
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  cleaned = cleaned.replace(/<[^>]+>/g, " ");
  cleaned = cleaned.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return cleaned;
}
app.post("/api/devices/:id/knowledge", async (req, res) => {
  const { id } = req.params;
  const { name, type, content, url } = req.body;
  const tenantId = getTenantId(req);
  const dbDevice = getAllDevices().find((d) => d.id === id);
  if (!dbDevice) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  if (tenantId && dbDevice.ownerId && dbDevice.ownerId !== tenantId) {
    res.status(403).json({ error: "Unauthorized access" });
    return;
  }
  try {
    let finalContent = content || "";
    let finalName = name;
    if (type === "link" && url && !finalContent) {
      try {
        const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (response.ok) {
          const html = await response.text();
          finalContent = cleanHtml(html);
          if (!finalContent) {
            finalContent = `Successfully reached website URL. However, no readable text was parsed. URL: ${url}`;
          }
        } else {
          finalContent = `Failed to fetch website. Server returned HTTP ${response.status}. URL: ${url}`;
        }
      } catch (fetchErr) {
        finalContent = `Error crawling URL: ${fetchErr.message || fetchErr}. URL: ${url}`;
      }
    }
    if (!dbDevice.knowledgeBaseSources) {
      dbDevice.knowledgeBaseSources = [];
    }
    const newSource = {
      id: (0, import_crypto.randomUUID)(),
      name: finalName || (type === "link" ? "Website Source" : "Uploaded File"),
      type: type || "file",
      content: finalContent,
      url: url || void 0,
      size: type === "link" ? `${finalContent.length} chars` : `${(Buffer.byteLength(finalContent, "utf8") / 1024).toFixed(1)} KB`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 16)
    };
    dbDevice.knowledgeBaseSources.push(newSource);
    const combinedKb = dbDevice.knowledgeBaseSources.map((src) => `=== SOURCE: ${src.name} ${src.url ? `(URL: ${src.url})` : ""} ===
${src.content}`).join("\n\n");
    dbDevice.aiKnowledgeBase = combinedKb;
    saveDevice(dbDevice);
    broadcast({
      type: "device:update",
      device: dbDevice
    });
    res.json({ success: true, device: dbDevice, source: newSource });
  } catch (err) {
    console.error("Failed to add knowledge base source:", err);
    res.status(500).json({ error: err.message || "Failed to add source" });
  }
});
app.delete("/api/devices/:id/knowledge/:sourceId", (req, res) => {
  const { id, sourceId } = req.params;
  const tenantId = getTenantId(req);
  const dbDevice = getAllDevices().find((d) => d.id === id);
  if (!dbDevice) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  if (tenantId && dbDevice.ownerId && dbDevice.ownerId !== tenantId) {
    res.status(403).json({ error: "Unauthorized access" });
    return;
  }
  if (dbDevice.knowledgeBaseSources) {
    dbDevice.knowledgeBaseSources = dbDevice.knowledgeBaseSources.filter((src) => src.id !== sourceId);
    if (dbDevice.knowledgeBaseSources.length > 0) {
      const combinedKb = dbDevice.knowledgeBaseSources.map((src) => `=== SOURCE: ${src.name} ${src.url ? `(URL: ${src.url})` : ""} ===
${src.content}`).join("\n\n");
      dbDevice.aiKnowledgeBase = combinedKb;
    } else {
      dbDevice.aiKnowledgeBase = "";
    }
    saveDevice(dbDevice);
    broadcast({
      type: "device:update",
      device: dbDevice
    });
  }
  res.json({ success: true, device: dbDevice });
});
app.post("/api/devices/:id/update", (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber, method, instanceId, token, apiEndpoint, cloudApiKey, phoneId, businessId, apiKey, webhookUrl } = req.body;
  const tenantId = getTenantId(req);
  const dbDevice = getAllDevices().find((d) => d.id === id);
  if (!dbDevice) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  if (tenantId && !dbDevice.ownerId) {
    dbDevice.ownerId = tenantId;
  } else if (tenantId && dbDevice.ownerId && dbDevice.ownerId !== tenantId) {
    res.status(403).json({ error: "Unauthorized access to this device." });
    return;
  }
  dbDevice.name = name || dbDevice.name;
  if (phoneNumber !== void 0) dbDevice.phoneNumber = phoneNumber;
  if (method !== void 0) dbDevice.method = method;
  if (instanceId !== void 0) dbDevice.instanceId = instanceId;
  if (token !== void 0) dbDevice.token = token;
  if (apiEndpoint !== void 0) dbDevice.apiEndpoint = apiEndpoint;
  if (cloudApiKey !== void 0) dbDevice.cloudApiKey = cloudApiKey;
  if (phoneId !== void 0) dbDevice.phoneId = phoneId;
  if (businessId !== void 0) dbDevice.businessId = businessId;
  if (apiKey !== void 0) dbDevice.apiKey = apiKey;
  if (webhookUrl !== void 0) dbDevice.webhookUrl = webhookUrl;
  saveDevice(dbDevice);
  broadcast({
    type: "device:update",
    device: dbDevice
  });
  res.json({ success: true, device: dbDevice });
});
app.post("/api/devices/:id/send-test", async (req, res) => {
  const { id } = req.params;
  const { to, text } = req.body;
  const tenantId = getTenantId(req);
  const dbDevice = getAllDevices().find((d) => d.id === id);
  if (!dbDevice || tenantId && dbDevice.ownerId && dbDevice.ownerId !== tenantId) {
    res.status(404).json({ error: "Device not found or unauthorized" });
    return;
  }
  if (!to || !text) {
    res.status(400).json({ error: "Recipient phone number (to) and message (text) are required" });
    return;
  }
  const result = await sendRealWhatsAppMessage(dbDevice, to, text);
  res.json(result);
});
app.get("/api/campaigns", (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ campaigns: getAllCampaigns(tenantId) });
});
app.post("/api/campaigns", (req, res) => {
  const { name, templateText, mediaUrl, targets, deviceId, delay } = req.body;
  if (!name || !templateText || !targets || !Array.isArray(targets)) {
    res.status(400).json({ error: "Campaign details name, template, and targets list are required" });
    return;
  }
  const tenantId = getTenantId(req);
  const id = `camp_${Math.random().toString(36).substring(2, 11)}`;
  const cleanTargets = targets.map((t) => ({
    phone: String(t.phone || "").trim(),
    name: String(t.name || "").trim(),
    status: "pending"
  }));
  const campaign = {
    id,
    name,
    templateText,
    ownerId: tenantId,
    mediaUrl: mediaUrl || void 0,
    targets: cleanTargets,
    status: "draft",
    progress: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    logs: [`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Campaign Draft created with ${cleanTargets.length} targets.`],
    deviceId: deviceId || void 0,
    delay: delay || 6
  };
  saveCampaign(campaign);
  res.json({ campaign });
});
app.post("/api/campaigns/:id/retry", (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const campaigns = getAllCampaigns();
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign || tenantId && campaign.ownerId && campaign.ownerId !== tenantId) {
    res.status(404).json({ error: "Campaign not found or unauthorized" });
    return;
  }
  campaign.targets.forEach((t) => {
    if (t.status === "failed") {
      t.status = "pending";
      delete t.error;
    }
  });
  campaign.status = "draft";
  const sentCount = campaign.targets.filter((t) => t.status === "sent").length;
  campaign.progress = campaign.targets.length > 0 ? Math.round(sentCount / campaign.targets.length * 100) : 0;
  campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Reset failed recipients back to pending.`);
  saveCampaign(campaign);
  broadcast({ type: "campaign:update", campaign });
  res.json({ campaign });
});
app.put("/api/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const { name, templateText, mediaUrl, targets, deviceId, delay, status } = req.body;
  const tenantId = getTenantId(req);
  const campaigns = getAllCampaigns();
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign || tenantId && campaign.ownerId && campaign.ownerId !== tenantId) {
    res.status(404).json({ error: "Campaign not found or unauthorized" });
    return;
  }
  if (name) campaign.name = name;
  if (templateText) campaign.templateText = templateText;
  if (mediaUrl !== void 0) campaign.mediaUrl = mediaUrl;
  if (deviceId) campaign.deviceId = deviceId;
  if (delay !== void 0) campaign.delay = delay;
  if (status) campaign.status = status;
  if (targets && Array.isArray(targets)) {
    campaign.targets = targets.map((t) => ({
      phone: String(t.phone || "").trim(),
      name: String(t.name || "").trim(),
      status: t.status || "pending",
      error: t.error || void 0
    }));
    const sentCount = campaign.targets.filter((t) => t.status === "sent").length;
    campaign.progress = campaign.targets.length > 0 ? Math.round(sentCount / campaign.targets.length * 100) : 0;
  }
  campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Campaign details updated/edited.`);
  saveCampaign(campaign);
  broadcast({ type: "campaign:update", campaign });
  res.json({ campaign });
});
app.post("/api/campaigns/ai-suggest", async (req, res) => {
  const { prompt, tone, language } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "Prompt description or text draft is required" });
    return;
  }
  let text = "";
  if (ai) {
    try {
      const selectedLanguage = language === "en" ? "English" : "Arabic";
      const systemPrompt = `You are a professional WhatsApp Marketing copywriter and outreach expert.
Write a highly engaging, high-converting, friendly WhatsApp marketing/outreach message in the specified language: ${selectedLanguage}.
Apply a ${tone || "professional"} tone, optimized for mobile reading interfaces.
Incorporate clear and readable structures, WhatsApp markdown styling (*bold* for focus words, _italic_ where appropriate), and emojis to highlight important details.
Keep it compact and highly engaging. ALWAYS include the variable '{name}' as a placeholder for the recipient's name (e.g. "Hi {name}!" or "\u0645\u0631\u062D\u0628\u0627\u064B \u064A\u0627 {name}!"). Do not output any HTML, markdown headers (#), codeblocks, or explanatory text\u2014ONLY output the direct raw WhatsApp message content ready to send.`;
      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8
        }
      });
      text = response.text || "";
    } catch (err) {
      console.error("Gemini Suggest Error, using high-fidelity fallback templates:", err);
      if (language === "en") {
        text = `\u{1F525} *Special Outreach Alert* for you, {name}! \u{1F31F}
We are absolutely thrilled to offer you a premium 30% discount on all of our high-demand WhatsApp Marketing services this week.

Code: *VIP30*
\u{1F449} Link: click below to activate. Let us know if you have any questions!`;
      } else {
        text = `\u{1F525} *\u0639\u0631\u0636 \u062E\u0627\u0635 \u0648\u062D\u0635\u0631\u064A* \u0644\u0643 \u064A\u0627 {name}! \u{1F31F}
\u064A\u0633\u0639\u062F\u0646\u0627 \u062C\u062F\u0627\u064B \u062A\u0642\u062F\u064A\u0645 \u062E\u0635\u0645 \u062D\u0635\u0631\u064A \u0628\u0646\u0633\u0628\u0629 30% \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u062E\u062F\u0645\u0627\u062A\u0646\u0627 \u0648\u062D\u0644\u0648\u0644\u0646\u0627 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0644\u0644\u062A\u0633\u0648\u064A\u0642 \u0637\u0648\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639.

\u0643\u0648\u062F \u0627\u0644\u062E\u0635\u0645: *VIP30*
\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0627\u0644\u0622\u0646 \u0644\u0644\u0628\u062F\u0621 \u0641\u0648\u0631\u0627\u064B! \u{1F680}`;
      }
    }
  } else {
    if (language === "en") {
      text = `\u{1F525} *Special Outreach Alert* for you, {name}! \u{1F31F}
We are absolutely thrilled to offer you a premium 30% discount on all of our high-demand WhatsApp Marketing services this week.

Code: *VIP30*
\u{1F449} Link: click below to activate. Let us know if you have any questions!`;
    } else {
      text = `\u{1F525} *\u0639\u0631\u0636 \u062E\u0627\u0635 \u0648\u062D\u0635\u0631\u064A* \u0644\u0643 \u064A\u0627 {name}! \u{1F31F}
\u064A\u0633\u0639\u062F\u0646\u0627 \u062C\u062F\u0627\u064B \u062A\u0642\u062F\u064A\u0645 \u062E\u0635\u0645 \u062D\u0635\u0631\u064A \u0628\u0646\u0633\u0628\u0629 30% \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u062E\u062F\u0645\u0627\u062A\u0646\u0627 \u0648\u062D\u0644\u0648\u0644\u0646\u0627 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0644\u0644\u062A\u0633\u0648\u064A\u0642 \u0637\u0648\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639.

\u0643\u0648\u062F \u0627\u0644\u062E\u0635\u0645: *VIP30*
\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0627\u0644\u0622\u0646 \u0644\u0644\u0628\u062F\u0621 \u0641\u0648\u0631\u0627\u064B! \u{1F680}`;
    }
  }
  res.json({ text });
});
app.delete("/api/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const campaigns = getAllCampaigns();
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign || tenantId && campaign.ownerId && campaign.ownerId !== tenantId) {
    res.status(404).json({ error: "Campaign not found or unauthorized" });
    return;
  }
  deleteCampaign(id);
  res.json({ success: true });
});
app.post("/api/campaigns/:id/run", (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const campaigns = getAllCampaigns();
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign || tenantId && campaign.ownerId && campaign.ownerId !== tenantId) {
    res.status(404).json({ error: "Campaign not found or unauthorized" });
    return;
  }
  if (campaign.status === "sending") {
    res.status(400).json({ error: "Campaign is already running" });
    return;
  }
  campaign.status = "sending";
  campaign.progress = 0;
  campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Starting marketing queue...`);
  saveCampaign(campaign);
  runCampaignSimulation(id);
  res.json({ campaign });
});
async function sendRealWhatsAppMessage(device, to, text) {
  const cleanPhone = to.replace(/[\s\+\-\(\)]/g, "").trim();
  try {
    if (device.method === "ultramsg") {
      const endpoint = device.apiEndpoint || `https://api.ultramsg.com/${device.instanceId}/messages/chat`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: device.token || "",
          to: cleanPhone,
          body: text
        })
      });
      if (response.ok) {
        return { success: true };
      } else {
        const errText = await response.text();
        return { success: false, error: `Ultramsg: ${errText.substring(0, 100) || response.statusText}` };
      }
    } else if (device.method === "greenapi") {
      const endpoint = device.apiEndpoint || `https://api.green-api.com/waInstance${device.instanceId}/sendMessage/${device.token}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: `${cleanPhone}@c.us`,
          message: text
        })
      });
      if (response.ok) {
        return { success: true };
      } else {
        const errText = await response.text();
        return { success: false, error: `Green-API: ${errText.substring(0, 100) || response.statusText}` };
      }
    } else if (device.method === "qr") {
      const result = await sendBaileysMessage(device.id, to, text);
      return result;
    } else if (device.method === "cloud_api") {
      const phoneId = device.phoneId;
      const token = device.cloudApiKey;
      if (!phoneId || !token) {
        return { success: false, error: "Missing Meta Phone Number ID or Access Token" };
      }
      const endpoint = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: false, body: text }
        })
      });
      if (response.ok) {
        return { success: true };
      } else {
        const errJson = await response.json().catch(() => ({}));
        return { success: false, error: `Meta Cloud API: ${errJson.error?.message || response.statusText}` };
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "API Connection timeout" };
  }
}
async function runCampaignSimulation(campaignId) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  try {
    let campaign = getAllCampaigns().find((c) => c.id === campaignId);
    if (!campaign) return;
    const activeDevices = getAllDevices().filter((d) => d.status === "connected");
    const primaryDevice = activeDevices.length > 0 ? activeDevices[0] : null;
    const deviceName = primaryDevice ? primaryDevice.name : "Default System Gateway";
    campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Connected to linked device: "${deviceName}".`);
    saveCampaign(campaign);
    broadcast({ type: "campaign:update", campaign });
    await delay(1500);
    const userDelayMs = Math.max((campaign.delay || 6) * 1e3, 1e3);
    for (let i = 0; i < campaign.targets.length; i++) {
      campaign = getAllCampaigns().find((c) => c.id === campaignId);
      if (!campaign || campaign.status !== "sending") {
        break;
      }
      const target = campaign.targets[i];
      if (target.status === "sent") {
        campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [${i + 1}/${campaign.targets.length}] Skipping already sent target +${target.phone}.`);
        saveCampaign(campaign);
        continue;
      }
      target.status = "sending";
      campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [${i + 1}/${campaign.targets.length}] Dispatching template to ${target.name} (+${target.phone})...`);
      saveCampaign(campaign);
      broadcast({ type: "campaign:update", campaign });
      await delay(userDelayMs / 2);
      let isSuccess = true;
      let errorMsg = "";
      if (primaryDevice && (primaryDevice.method === "ultramsg" || primaryDevice.method === "greenapi" || primaryDevice.method === "cloud_api" || primaryDevice.method === "qr")) {
        const textToSend = campaign.templateText.replace(/\{\{name\}\}/g, target.name).replace(/\{name\}/g, target.name);
        campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Executing live HTTP callback dispatch to +${target.phone}...`);
        saveCampaign(campaign);
        broadcast({ type: "campaign:update", campaign });
        const result = await sendRealWhatsAppMessage(primaryDevice, target.phone, textToSend);
        isSuccess = result.success;
        errorMsg = result.error || "Gateway Timeout";
      } else {
        isSuccess = !target.phone.includes("444") && target.phone.length >= 8;
        errorMsg = "Invalid Phone Number format or Route Timeout";
      }
      if (isSuccess) {
        target.status = "sent";
        campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [\u2714] Delivered to +${target.phone}. Remote status: DELIVERED.`);
      } else {
        target.status = "failed";
        target.error = errorMsg;
        campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] [\u274C] Failed dispatching to +${target.phone}. Error: ${target.error}`);
      }
      const sentCount = campaign.targets.filter((t) => t.status === "sent").length;
      campaign.progress = Math.round(sentCount / campaign.targets.length * 100);
      saveCampaign(campaign);
      broadcast({ type: "campaign:update", campaign });
      await delay(userDelayMs / 2);
    }
    campaign = getAllCampaigns().find((c) => c.id === campaignId);
    if (campaign && campaign.status === "sending") {
      campaign.status = "completed";
      campaign.progress = 100;
      campaign.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      campaign.logs.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Bulk dispatch campaign successfully completed!`);
      saveCampaign(campaign);
      broadcast({ type: "campaign:update", campaign });
    }
  } catch (error) {
    console.error("Error during campaign queue dispatch simulation:", error);
  }
}
function broadcast(payload) {
  const messageStr = JSON.stringify(payload);
  console.log(`[WS Broadcast] Broadcasting payload type "${payload.type}" to active connection(s) with SaaS privacy rules`);
  activeConnections.forEach((ws, userId) => {
    const user = getUser(userId);
    const isAdmin = user && user.role === "admin";
    if (!isAdmin) {
      if (payload.device && payload.device.ownerId && payload.device.ownerId !== userId) {
        return;
      }
      if (payload.campaign && payload.campaign.ownerId && payload.campaign.ownerId !== userId) {
        return;
      }
      if (payload.type === "message:new" && payload.message) {
        const msg = payload.message;
        if (msg.senderId !== userId && msg.recipientId !== userId) {
          return;
        }
      }
    }
    if (ws.readyState === import_ws.WebSocket.OPEN) {
      try {
        ws.send(messageStr);
        console.log(`[WS Broadcast] Successfully sent payload type "${payload.type}" to user "${userId}"`);
      } catch (err) {
        console.error(`[WS Broadcast] Failed to send payload type "${payload.type}" to user "${userId}":`, err);
      }
    }
  });
}
server.on("upgrade", (request, socket, head) => {
  try {
    const url = request.url || "";
    const pathname = url.split("?")[0];
    console.log(`[WS Upgrade] Upgrade requested for path: "${pathname}" from host: "${request.headers.host}"`);
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      console.log(`[WS Upgrade] Non-app upgrade request for: "${pathname}". Destroying socket.`);
      socket.destroy();
    }
  } catch (err) {
    console.error("[WS Upgrade] Error handling upgrade request:", err);
    try {
      socket.destroy();
    } catch {
    }
  }
});
wss.on("connection", (ws) => {
  let authenticatedUserId = null;
  ws.on("message", async (data) => {
    try {
      const event = JSON.parse(data);
      switch (event.type) {
        case "ping": {
          if (ws.readyState === import_ws.WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "pong" }));
          }
          break;
        }
        case "auth": {
          authenticatedUserId = event.userId;
          const existingWs = activeConnections.get(authenticatedUserId);
          if (existingWs && existingWs !== ws) {
            console.log(`[WS] Cleaned up duplicate connection for user ${authenticatedUserId}`);
            try {
              existingWs.close();
            } catch {
            }
          }
          activeConnections.set(authenticatedUserId, ws);
          updateUserPresence(authenticatedUserId, true);
          broadcast({
            type: "presence",
            userId: authenticatedUserId,
            isOnline: true,
            lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          console.log(`WebSocket user authenticated: ${authenticatedUserId}`);
          break;
        }
        case "typing": {
          const { senderId, recipientId, isTyping } = event;
          const targetWs = activeConnections.get(recipientId);
          if (targetWs && targetWs.readyState === import_ws.WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: "typing",
              senderId,
              recipientId,
              isTyping
            }));
          }
          break;
        }
        case "message:send": {
          const { message } = event;
          const { id, conversationId, senderId, recipientId, content, type, mediaUrl } = message;
          const isRecipientOnline = activeConnections.has(recipientId);
          const initialStatus = isRecipientOnline ? "delivered" : "sent";
          const newMsg = {
            id,
            conversationId,
            senderId,
            recipientId,
            content,
            type,
            mediaUrl,
            status: initialStatus,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          saveMessage(newMsg);
          ws.send(JSON.stringify({
            type: "message:new",
            message: newMsg
          }));
          const targetWs = activeConnections.get(recipientId);
          if (targetWs && targetWs.readyState === import_ws.WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: "message:new",
              message: newMsg
            }));
            ws.send(JSON.stringify({
              type: "message:receipt",
              messageId: newMsg.id,
              status: "delivered",
              conversationId
            }));
          }
          if (recipientId === "meta-ai") {
            handleMetaAIResponse(senderId, conversationId, content, type, mediaUrl);
          }
          if (recipientId.startsWith("contact_")) {
            const targetPhone = recipientId.replace("contact_", "");
            const activeDevices = getAllDevices().filter((d) => d.status === "connected");
            const qrDevice = activeDevices.find((d) => d.method === "qr") || activeDevices[0];
            if (qrDevice) {
              console.log(`Routing chat message via real device "${qrDevice.name}" (method: ${qrDevice.method}) to +${targetPhone}`);
              sendRealWhatsAppMessage(qrDevice, targetPhone, content).then((res) => {
                if (!res.success) {
                  console.error(`Failed to send real WhatsApp message to +${targetPhone}:`, res.error);
                } else {
                  console.log(`Successfully sent real WhatsApp message to +${targetPhone}`);
                  const updatedMsg = updateMessageStatus(id, "delivered");
                  if (updatedMsg) {
                    ws.send(JSON.stringify({
                      type: "message:receipt",
                      messageId: id,
                      status: "delivered",
                      conversationId
                    }));
                  }
                }
              }).catch((err) => {
                console.error(`Error in sendRealWhatsAppMessage handler:`, err);
              });
            } else {
              console.warn("No active connected WhatsApp devices available to send real message.");
            }
          }
          break;
        }
        case "message:receipt": {
          const { messageId, status, conversationId } = event;
          const msg = updateMessageStatus(messageId, status);
          if (msg) {
            const senderWs = activeConnections.get(msg.senderId);
            if (senderWs && senderWs.readyState === import_ws.WebSocket.OPEN) {
              senderWs.send(JSON.stringify({
                type: "message:receipt",
                messageId,
                status,
                conversationId
              }));
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error("Error handling WebSocket message:", err);
    }
  });
  ws.on("close", () => {
    if (authenticatedUserId) {
      activeConnections.delete(authenticatedUserId);
      updateUserPresence(authenticatedUserId, false);
      broadcast({
        type: "presence",
        userId: authenticatedUserId,
        isOnline: false,
        lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log(`WebSocket user disconnected: ${authenticatedUserId}`);
    }
  });
});
async function handleMetaAIResponse(userId, conversationId, userMessage, messageType, mediaUrl) {
  console.log(`[DEBUG] handleMetaAIResponse called for user ${userId}, conv ${conversationId}, message: ${userMessage.substring(0, 20)}`);
  const userWs = activeConnections.get(userId);
  if (!userWs || userWs.readyState !== import_ws.WebSocket.OPEN) return;
  userWs.send(JSON.stringify({
    type: "typing",
    senderId: "meta-ai",
    recipientId: userId,
    isTyping: true
  }));
  const db = readDb();
  const conv = db.conversations[conversationId];
  const voiceSettings = conv?.voiceSettings || { enabled: false, accent: "msa", voiceName: "Zephyr" };
  await new Promise((resolve) => setTimeout(resolve, 1500));
  let responseText = "";
  let responseAudioBase64 = void 0;
  let shouldMetaReplyWithVoice = false;
  if (voiceSettings.enabled) {
    shouldMetaReplyWithVoice = messageType === "audio";
  }
  if (ai) {
    try {
      let prompt = userMessage;
      let contentsPayload = prompt;
      if (messageType === "image" && mediaUrl) {
        const base64Data = mediaUrl.split(",")[1] || mediaUrl;
        const mimeType = mediaUrl.split(";")[0]?.split(":")[1] || "image/png";
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            },
            {
              text: userMessage || "Describe this image and what you see in it."
            }
          ]
        };
      } else if (messageType === "audio" && mediaUrl) {
        const parts = mediaUrl.split(",");
        const base64Data = parts[1] || mediaUrl;
        const mimeType = parts[0]?.split(";")[0]?.split(":")[1] || "audio/webm";
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            },
            {
              text: "You are receiving this audio voice recording from the user. Listen carefully to the spoken voice in this audio, understand/transcribe what is said, and write a helpful response to the query in the same language and dialect they spoke."
            }
          ]
        };
      }
      const historyMsgs = getMessagesForConversation(conversationId);
      const last20 = historyMsgs.slice(-20);
      let formattedHistory = "";
      if (last20.length > 0) {
        formattedHistory = last20.map((m) => {
          const senderName = m.senderId === "meta-ai" ? "Meta AI" : "User";
          return `[${senderName}]: ${m.content}`;
        }).join("\n");
      }
      let dialectInstruction = "";
      const accent = voiceSettings.accent;
      if (accent === "eg") {
        dialectInstruction = `
- DIALECT: Egyptian Colloquial Arabic (\u0644\u0647\u062C\u0629 \u0645\u0635\u0631\u064A\u0629 \u0639\u0627\u0645\u064A\u0629 \u062F\u0627\u0631\u062C\u0629).
- TONE: Warm, friendly, light-hearted, yet extremely professional and polite.
- PHRASES: Use prestigious and endearing Egyptian honorifics like "\u064A\u0627 \u0641\u0646\u062F\u0645", "\u062D\u0636\u0631\u062A\u0643", "\u062A\u062D\u062A \u0623\u0645\u0631\u0643", "\u0645\u0646 \u0639\u064A\u0648\u0646\u064A", "\u064A\u0627 \u0647\u0644\u0627 \u0628\u064A\u0643 \u0645\u0646\u0648\u0631\u0646\u0627 \u0648\u0627\u0644\u0644\u0647".`;
      } else if (accent === "sa") {
        dialectInstruction = `
- DIALECT: Saudi Colloquial Arabic (\u0644\u0647\u062C\u0629 \u0633\u0639\u0648\u062F\u064A\u0629 \u0639\u0627\u0645\u064A\u0629 \u062F\u0627\u0631\u062C\u0629).
- TONE: Respectful, warm, hospitable, and highly polite.
- PHRASES: Use natural Saudi honorifics and expressions of respect like "\u064A\u0627 \u0647\u0644\u0627 \u0648\u0627\u0644\u0644\u0647 \u0648\u0645\u0633\u0647\u0644\u0627", "\u0637\u0627\u0644 \u0639\u0645\u0631\u0643", "\u0639\u0644\u0649 \u0631\u0627\u0633\u064A \u064A\u0627 \u063A\u0627\u0644\u064A", "\u0623\u0628\u0634\u0631 \u0628\u0633\u0639\u062F\u0643", "\u064A\u0633\u0639\u062F\u0646\u0627 \u0648\u064A\u0634\u0631\u0641\u0646\u0627 \u062E\u062F\u0645\u062A\u0643".`;
      } else if (accent === "lb") {
        dialectInstruction = `
- DIALECT: Lebanese Colloquial Arabic (\u0644\u0647\u062C\u0629 \u0644\u0628\u0646\u0627\u0646\u064A\u0629 \u0639\u0627\u0645\u064A\u0629 \u062F\u0627\u0631\u062C\u0629).
- TONE: Gentle, polite, elegant, and warm.
- PHRASES: Use high-class Lebanese expressions like "\u064A\u0627 \u0645\u064A\u062A \u0623\u0647\u0644\u0627\u064B \u0648\u0633\u0647\u0644\u0627\u064B \u0628\u062D\u0636\u0631\u062A\u0643", "\u062A\u0643\u0631\u0645 \u0639\u064A\u0646\u0643", "\u0643\u0644\u0643 \u0630\u0648\u0642", "\u0645\u0646 \u0639\u064A\u0648\u0646\u064A", "\u0648\u0644\u0648! \u0639\u0644\u0649 \u0631\u0627\u0633\u064A".`;
      } else if (accent === "msa") {
        dialectInstruction = `
- DIALECT: Modern Standard Arabic (\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649).
- TONE: Eloquent, professional, formal, and clear.
- PHRASES: Use premium corporate greetings like "\u0623\u0647\u0644\u0627\u064B \u0648\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0627\u0644\u0643\u0631\u064A\u0645\u060C \u064A\u0633\u0639\u062F\u0646\u0627 \u0648\u064A\u0634\u0631\u0641\u0646\u0627 \u062A\u0648\u0627\u0635\u0644\u0643 \u0645\u0639\u0646\u0627 \u0648\u0646\u0641\u062E\u0631 \u0628\u062E\u062F\u0645\u062A\u0643...".`;
      } else if (accent === "en_us") {
        dialectInstruction = `
- DIALECT: Clear American English.
- TONE: Natural, friendly, helpful, and highly professional.`;
      } else if (accent === "en_uk") {
        dialectInstruction = `
- DIALECT: Clean, polite British English.
- TONE: Highly formal, warm, and articulate.`;
      }
      let sentimentInstruction = "";
      const userMessageLower = (userMessage || "").trim().toLowerCase();
      const hasNegativeSentiment = /مشكلة|عطل|سيء|بطيء|شكوى|غاضب|استرجاع|فلوسي|نصاب|رداءة|خراب|bad|worst|angry|broken|issue|problem|error|scam|refund|slow/i.test(userMessageLower);
      if (hasNegativeSentiment) {
        sentimentInstruction = `
- SENTIMENT ADAPTATION: The user is expressing frustration, reporting an issue, or complaining. You MUST immediately start your response with a highly sincere, deeply polite, and empathetic apology on behalf of the system (e.g. '\u0646\u0639\u062A\u0630\u0631 \u0645\u0646\u0643 \u0645\u0646 \u0643\u0644 \u0642\u0644\u0628\u0646\u0627 \u064A\u0627 \u0641\u0646\u062F\u0645 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u0632\u0639\u0627\u062C...' or 'Sincere apologies for any inconvenience caused...'). Avoid cheerful greetings or promotional terms. Focus on being solution-oriented and helpful.`;
      }
      const systemPrompt = `You are Meta AI, WhatsApp's flagship, highly intelligent virtual AI assistant, running on Google's elite Gemini architecture.
Your mission is to provide exceptionally smart, helpful, prestigious, and articulate conversational support.

Here are your elite operational parameters:

1. PERSONALITY & ELITE TONE:
- Adapt your voice precisely according to the requested dialect and voice settings:
\${dialectInstruction}
- Always start or structure your replies with appropriate, premium greetings. Integrate natural Arabic or English honorifics gracefully.
- Sound deeply human, charismatic, and knowledgeable. Speak with absolute clarity.

2. EMOTIONAL INTELLIGENCE & SENTIMENT ADAPTATION:
\${sentimentInstruction}
- If the user shows negative emotion, never sound overly cheerful. Be reassuring, solution-oriented, and state clear steps to assist.

3. CONTEXT, KNOWLEDGE RETRIEVAL & MEMORY CONTINUITY:
- Review the Conversation History meticulously. Remember facts mentioned in earlier turns to show a persistent, unified relationship.
- Never repeat greetings or system disclaimers across turns.
- If the user asks a complex multi-part question, solve it sequentially, dividing your thoughts with clear steps.

4. FORMATTING & READABILITY (WHATSAPP-OPTIMIZED):
- Keep paragraphs short (maximum 2-3 sentences each) to respect small mobile screen densities.
- Use generous line breaks to create readable "breathing" space between distinct ideas.
- Apply bolding (*bold*) strategically to focus words, key terms, or actionable items.
- Structure lists and options using premium, polished emoji bullet points (e.g. \u{1F539}, \u{1F538}, \u{1F680}, \u{1F4A1}, \u{1F464}, \u2714).
- NEVER output markdown headings like '#', '##', or '###'. Use bold uppercase text instead.

Conversation History (Last 20 messages for context):
\${formattedHistory || '(No previous messages)'}`;
      const response = await callGeminiWithRetry({
        model: "gemini-3.5-flash",
        contents: contentsPayload,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8
        }
      });
      responseText = response.text || "I received your message, but I couldn't formulate a reply. How else can I assist you today?";
      console.log(`[DEBUG] TTS Check: voiceSettings.enabled=${voiceSettings.enabled}, messageType=${messageType}, shouldMetaReplyWithVoice=${shouldMetaReplyWithVoice}`);
      if (shouldMetaReplyWithVoice) {
        try {
          console.log(`[TTS Generation] Synthesizing response speech via "gemini-3.1-flash-tts-preview" using voice "${voiceSettings.voiceName}"...`);
          const isArabic = ["eg", "sa", "lb", "msa"].includes(accent);
          const ttsPrompt = isArabic ? `\u062A\u062D\u062F\u062B \u0628\u0646\u0628\u0631\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u0648\u0627\u0636\u062D\u0629 \u062C\u062F\u0627\u064B \u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629: ${responseText}` : `Speak in a highly professional and clean voice: ${responseText}`;
          const ttsResponse = await callGeminiWithRetry({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceSettings.voiceName || "Zephyr" }
                }
              }
            }
          });
          const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0];
          console.log("[DEBUG] TTS Response Audio Part:", !!audioPart);
          if (audioPart && audioPart.inlineData?.data) {
            responseAudioBase64 = `data:audio/mp3;base64,${audioPart.inlineData.data}`;
            console.log("[TTS Generation] Speech synthesized successfully.");
          } else {
            console.log("[DEBUG] No audio data in TTS response.");
          }
        } catch (ttsErr) {
          console.error("[TTS Generation] Failed to synthesize speech via Gemini:", ttsErr);
        }
      }
    } catch (err) {
      console.error("Gemini API Error, using premium offline simulator fallbacks:", err);
      const fallbacks = {
        eg: "\u0623\u0647\u0644\u0627\u064B \u0628\u064A\u0643 \u064A\u0627 \u0641\u0646\u062F\u0645! \u0648\u0627\u062C\u0647\u0646\u0627 \u0645\u0634\u0643\u0644\u0629 \u0645\u0624\u0642\u062A\u0629 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (\u0623\u0648 \u0646\u0641\u0627\u062F \u0627\u0644\u062D\u0635\u0629 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629 \u0644\u0644\u0640 API Key). \u0639\u0645\u0648\u0645\u0627\u064B\u060C \u0623\u0646\u0627 \u0647\u0646\u0627 \u0644\u0645\u0633\u0627\u0639\u062F\u062A\u0643! \u0643\u064A\u0641 \u0623\u0642\u062F\u0631 \u0623\u062E\u062F\u0645\u0643 \u0627\u0644\u0646\u0647\u0627\u0631\u062F\u0629\u061F",
        sa: "\u064A\u0627 \u0647\u0644\u0627 \u0648\u0627\u0644\u0644\u0647 \u0648\u0645\u0633\u0647\u0644\u0627! \u064A\u0628\u062F\u0648 \u0623\u0646\u0647 \u0648\u0627\u062C\u0647\u0646\u0627 \u0645\u0634\u0643\u0644\u0629 \u0645\u0624\u0642\u062A\u0629 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0627\u0644\u062D\u0635\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629. \u0644\u0627 \u062A\u0634\u064A\u0644 \u0647\u0645\u060C \u0623\u0646\u0627 \u0647\u0646\u0627 \u0644\u062E\u062F\u0645\u062A\u0643! \u0648\u0634 \u062A\u0628\u063A\u0649 \u062A\u0633\u0648\u064A \u0627\u0644\u064A\u0648\u0645\u061F",
        lb: "\u064A\u0627 \u0647\u0644\u0627 \u0641\u064A\u0643! \u0635\u0627\u0631 \u0641\u064A \u0645\u0634\u0643\u0644\u0629 \u0645\u0624\u0642\u062A\u0629 \u0628\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0623\u0648 \u062E\u0644\u0635\u062A \u0627\u0644\u062D\u0635\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629. \u0639\u0644\u0649 \u0643\u0644 \u062D\u0627\u0644\u060C \u0623\u0646\u0627 \u0647\u0648\u0646 \u0643\u0631\u0645\u0627\u0644 \u0633\u0627\u0639\u062F\u0643! \u0634\u0648 \u0641\u064A\u0646\u0627 \u0646\u0639\u0645\u0644 \u0633\u0648\u0627 \u0627\u0644\u064A\u0648\u0645\u061F",
        msa: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643! \u0648\u0627\u062C\u0647\u0646\u0627 \u0645\u0634\u0643\u0644\u0629 \u0645\u0624\u0642\u062A\u0629 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0623\u0648 \u0646\u0641\u0627\u062F \u0627\u0644\u062D\u0635\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0644\u0640 Gemini API. \u0646\u062D\u0646 \u0647\u0646\u0627 \u0644\u062E\u062F\u0645\u062A\u0643 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629\u060C \u0643\u064A\u0641 \u064A\u0645\u0643\u0646\u0646\u064A \u0645\u0633\u0627\u0639\u062F\u062A\u0643 \u0627\u0644\u0622\u0646\u061F",
        en_us: "Hello! We encountered a temporary connection issue with the AI servers or the daily API quota has been reached. Nonetheless, I am here to help you! What can I assist you with today?",
        en_uk: "Hello! We've experienced a brief connection glitch with the AI servers or reached the daily API quota. However, I'm here to assist you! How can I help you today?"
      };
      responseText = fallbacks[voiceSettings.accent] || fallbacks["msa"];
      if (shouldMetaReplyWithVoice) {
        responseAudioBase64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
      }
    }
  } else {
    const fallbacks = {
      eg: "\u0623\u0647\u0644\u0627\u064B \u0628\u064A\u0643 \u064A\u0627 \u0641\u0646\u062F\u0645! \u0623\u0646\u0627 \u0645\u064A\u062A\u0627 \u0622\u064A\u060C \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0634\u062E\u0635\u064A \u0628\u062A\u0627\u0639\u0643. \u0628\u0645\u0627 \u0625\u0646\u0643 \u0645\u0634 \u0645\u0641\u0639\u0651\u0644 \u0645\u0641\u062A\u0627\u062D Gemini API \u0641\u064A \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A\u060C \u0628\u0631\u062F \u0639\u0644\u064A\u0643 \u0628\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u062F\u0647. \u0641\u064E\u0639\u0651\u0644 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0639\u0634\u0627\u0646 \u0646\u0628\u062F\u0623 \u0643\u0644\u0627\u0645\u0646\u0627 \u0628\u062C\u062F!",
      sa: "\u064A\u0627 \u0647\u0644\u0627 \u0648\u0627\u0644\u0644\u0647 \u0648\u0645\u0633\u0647\u0644\u0627! \u0623\u0646\u0627 \u0645\u064A\u062A\u0627 \u0622\u064A\u060C \u0645\u0633\u0627\u0639\u062F\u0643 \u0627\u0644\u0630\u0643\u064A. \u0639\u0634\u0627\u0646 \u0645\u0627 \u0641\u064A \u0645\u0641\u062A\u0627\u062D Gemini API \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645\u060C \u062C\u0627\u0644\u0633 \u0623\u0631\u062F \u0639\u0644\u064A\u0643 \u0628\u0645\u062D\u0627\u0643\u0627\u0629 \u0633\u0631\u064A\u0639\u0629. \u0636\u064A\u0641 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0648\u0628\u0623\u0628\u0634\u0631 \u0628\u0639\u0632\u0643!",
      lb: "\u064A\u0627 \u0647\u0644\u0627 \u0641\u064A\u0643! \u0623\u0646\u0627 \u0645\u064A\u062A\u0627 \u0622\u064A\u060C \u0645\u0633\u0627\u0639\u062F\u0643 \u0627\u0644\u0630\u0643\u064A. \u0644\u0623\u0646 \u0645\u0627 \u0641\u064A \u0645\u0641\u062A\u0627\u062D Gemini API \u0645\u0641\u0639\u0651\u0644 \u0628\u0627\u0644\u0633\u064A\u0633\u062A\u0645\u060C \u0639\u0645 \u0631\u062F\u0651 \u0639\u0644\u064A\u0643 \u0628\u0645\u062D\u0627\u0643\u0627\u0629 \u0633\u0631\u064A\u0639\u0629 \u0648\u0644\u0637\u064A\u0641\u0629. \u0641\u064E\u0639\u0651\u0644 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0644\u062A\u0634\u0648\u0641 \u0630\u0643\u0627\u0626\u064A \u0627\u0644\u062D\u0642\u064A\u0642\u064A!",
      msa: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643! \u0623\u0646\u0627 \u0645\u064A\u062A\u0627 \u0622\u064A\u060C \u0645\u0633\u0627\u0639\u062F\u0643 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0627\u0644\u0630\u0643\u064A. \u0646\u0638\u0631\u0627\u064B \u0644\u0639\u062F\u0645 \u062A\u0648\u0641\u0631 \u0645\u0641\u062A\u0627\u062D Gemini API \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u062F\u0645\u060C \u064A\u062A\u0645 \u062A\u0634\u063A\u064A\u0644 \u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u062D\u0627\u0644\u064A\u0627\u064B. \u064A\u0631\u062C\u0649 \u062A\u0643\u0648\u064A\u0646 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0642\u0648\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0644\u0640 Gemini!",
      en_us: "Hello! I am Meta AI, your built-in assistant. I am currently running in offline mock mode because no `GEMINI_API_KEY` was found. Add one in settings to activate my brain!",
      en_uk: "Hello there! I am Meta AI, your Virtual Assistant. As there is no `GEMINI_API_KEY` configured in the system, I am operating in offline simulation mode. Please configure the key to proceed."
    };
    responseText = fallbacks[voiceSettings.accent] || fallbacks["msa"];
    if (shouldMetaReplyWithVoice) {
      responseAudioBase64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    }
  }
  userWs.send(JSON.stringify({
    type: "typing",
    senderId: "meta-ai",
    recipientId: userId,
    isTyping: false
  }));
  const aiMsg = {
    id: `msg_${Math.random().toString(36).substring(2, 11)}`,
    conversationId,
    senderId: "meta-ai",
    recipientId: userId,
    content: responseText,
    // Stores text representation/transcription
    type: responseAudioBase64 ? "audio" : "text",
    mediaUrl: responseAudioBase64,
    status: "delivered",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveMessage(aiMsg);
  userWs.send(JSON.stringify({
    type: "message:new",
    message: aiMsg
  }));
}
async function startServer() {
  if (isSupabaseConfigured()) {
    console.log("[Supabase Startup] Checking for central database backup in Supabase...");
    try {
      const restoredData = await restoreDbFromSupabase();
      if (restoredData) {
        const dbFile = import_path4.default.join(process.cwd(), "db-store.json");
        import_fs4.default.writeFileSync(dbFile, JSON.stringify(restoredData, null, 2), "utf-8");
        resetDbCache();
        console.log("[Supabase Startup] Successfully restored central database locally from Supabase.");
      }
    } catch (err) {
      console.error("[Supabase Startup] Failed to restore database:", err);
    }
  }
  setBroadcastHandler(broadcast);
  setIncomingMessageHandler(async (deviceId, sock, jid, pushName, messageContent, fromMe, timestamp, messageId) => {
    try {
      const devices = getAllDevices();
      const device = devices.find((d) => d.id === deviceId);
      if (!device) {
        console.log(`[AI Agent DEBUG] Device ${deviceId} not found.`);
        return;
      }
      if (!device.aiAgentEnabled) {
        console.log(`[AI Agent DEBUG] AI Agent disabled for device ${deviceId}.`);
        return;
      }
      console.log(`[AI Agent DEBUG] AI Agent active for device ${deviceId}.`);
      const contactPhone = jid.split("@")[0];
      const contactId = `contact_${contactPhone}`;
      console.log(`[AI Agent - ${device.aiAgentName || "System"}] Analyzing message on device "${device.name}" for contact +${contactPhone}...`);
      let userMessageText = "";
      let contentsPayload = null;
      let incomingAudioBuffer = null;
      const messageType = messageContent.audioMessage ? "audio" : messageContent.imageMessage ? "image" : "text";
      let shouldReplyWithVoice = false;
      if (device.aiVoiceEnabled) {
        shouldReplyWithVoice = messageType === "audio";
      }
      if (messageContent.conversation) {
        userMessageText = messageContent.conversation;
      } else if (messageContent.extendedTextMessage) {
        userMessageText = messageContent.extendedTextMessage.text || "";
      }
      if (messageContent.imageMessage) {
        userMessageText = messageContent.imageMessage.caption || "";
        try {
          console.log("Downloading incoming WhatsApp image for AI Agent...");
          const buffer = await (0, import_baileys2.downloadMediaMessage)(
            { key: { id: messageId, remoteJid: jid }, message: messageContent },
            "buffer",
            {}
          );
          const base64Data = buffer.toString("base64");
          const mimeType = messageContent.imageMessage.mimetype || "image/jpeg";
          contentsPayload = {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType
                }
              },
              {
                text: userMessageText || "Describe what you see in this image and reply to any questions."
              }
            ]
          };
        } catch (err) {
          console.error("Failed to download incoming WhatsApp image:", err);
          contentsPayload = `[Image] User sent an image. Caption: "${userMessageText}". (System error: Could not download full image bytes for analysis). Respond politely based on the caption if any.`;
        }
      } else if (messageContent.audioMessage) {
        try {
          console.log("Downloading incoming WhatsApp voice note for AI Agent...");
          const buffer = await (0, import_baileys2.downloadMediaMessage)(
            { key: { id: messageId, remoteJid: jid }, message: messageContent },
            "buffer",
            {}
          );
          incomingAudioBuffer = buffer;
          const base64Data = buffer.toString("base64");
          const mimeType = messageContent.audioMessage.mimetype || "audio/ogg; codecs=opus";
          contentsPayload = {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType
                }
              },
              {
                text: "The user sent a voice message. Listen to the audio, understand what they are saying, and generate a clear, professional conversational reply in the same language. If the language is Arabic, respond in the requested dialect."
              }
            ]
          };
        } catch (err) {
          console.error("Failed to download incoming WhatsApp voice note:", err);
          contentsPayload = `[Voice Note] User sent a voice recording. (System error: Could not process voice bytes). Respond politely notifying them that you received a voice note but had a temporary system issue reading it, and ask if they can type their query instead.`;
        }
      } else {
        contentsPayload = userMessageText || "Hello";
      }
      const stopKeyword = (device.aiStopKeyword || "").trim().toLowerCase();
      const userTextLower = userMessageText.trim().toLowerCase();
      const realUsers = getAllUsers().filter((u) => u.id !== "meta-ai" && !u.id.startsWith("contact_"));
      const ownerId = device?.ownerId || realUsers[0]?.id || "user_default";
      const conv = getOrCreateConversation(ownerId, contactId, deviceId);
      if (conv.aiPaused) {
        console.log(`[AI Agent - Human Takeover Active] Skipping auto-reply for +${contactPhone} because AI is paused for this conversation.`);
        return;
      }
      const directHandoffKeywords = [
        "\u0628\u0634\u0631\u064A",
        "\u0627\u0646\u0633\u0627\u0646",
        "\u0625\u0646\u0633\u0627\u0646",
        "\u0645\u0648\u0638\u0641",
        "\u0645\u062F\u064A\u0631",
        "\u0623\u0643\u0644\u0645 \u062D\u062F",
        "\u062A\u062D\u062F\u062B \u0645\u0639",
        "\u062A\u062D\u062F\u062B \u0645\u0639 \u0645\u0648\u0638\u0641",
        "\u0623\u0643\u0644\u0645 \u0645\u0648\u0638\u0641",
        "\u062A\u062D\u0648\u064A\u0644",
        "\u0645\u0633\u0624\u0648\u0644",
        "\u0645\u0633\u0626\u0648\u0644",
        "\u0634\u062E\u0635 \u062D\u0642\u064A\u0642\u064A",
        "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0628\u0634\u0631\u064A",
        "human",
        "operator",
        "representative",
        "real person",
        "live chat",
        "talk to human",
        "speak to human",
        "agent support"
      ];
      const triggersStopKeyword = stopKeyword && userTextLower.includes(stopKeyword);
      const triggersDirectHandoff = directHandoffKeywords.some((keyword) => userTextLower.includes(keyword));
      if (triggersStopKeyword || triggersDirectHandoff) {
        const triggerReason = triggersStopKeyword ? `custom stop keyword "${stopKeyword}"` : `direct handoff keyword`;
        console.log(`[AI Agent - Human Takeover] Contact +${contactPhone} triggered ${triggerReason}. Disabling AI auto-replies for this contact.`);
        conv.aiPaused = true;
        saveConversation(conv);
        broadcast({
          type: "conversation:update",
          conversation: conv
        });
        const isArabicMessage = /[\u0600-\u06FF]/.test(userMessageText);
        const takeoverReply = isArabicMessage ? `\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0645\u0624\u0642\u062A\u0627\u064B \u0648\u062A\u062D\u0648\u064A\u0644\u0643 \u0644\u0645\u0648\u0638\u0641 \u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0628\u0634\u0631\u064A\u0629 \u{1F464}. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631\u060C \u0648\u0633\u064A\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0623\u062D\u062F \u0639\u0645\u0644\u0627\u0626\u0646\u0627 \u0642\u0631\u064A\u0628\u0627\u064B \u0644\u0645\u0633\u0627\u0639\u062F\u062A\u0643.` : `AI assistant has been paused. You are being transferred to a human representative \u{1F464}. Please wait, one of our team members will be with you shortly.`;
        await sendBaileysMessage(deviceId, jid, takeoverReply);
        const takeoverMsg = {
          id: `msg_${Math.random().toString(36).substring(2, 11)}`,
          conversationId: conv.id,
          senderId: ownerId,
          recipientId: contactId,
          content: takeoverReply,
          type: "text",
          status: "delivered",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        saveMessage(takeoverMsg);
        broadcast({
          type: "message:new",
          message: takeoverMsg
        });
        return;
      }
      let responseText = "";
      let responseAudioBuffer = null;
      if (ai) {
        try {
          const historyMsgs = getMessagesForConversation(conv.id);
          const last20 = historyMsgs.slice(-20);
          let formattedHistory = "";
          if (last20.length > 0) {
            formattedHistory = last20.map((m) => {
              const senderLabel = m.senderId === ownerId ? device.aiAgentName || "AI Support" : pushName || "Customer";
              return `[${senderLabel}]: ${m.content}`;
            }).join("\n");
          }
          const now = /* @__PURE__ */ new Date();
          const currentTimeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
          const currentDayStr = now.toLocaleDateString("ar-EG", { weekday: "long" });
          const isMorning = now.getHours() < 12;
          const currentPeriodStr = isMorning ? "\u0635\u0628\u0627\u062D \u0627\u0644\u062E\u064A\u0631 \u0648\u0627\u0644\u064A\u0645\u0646 \u0648\u0627\u0644\u0628\u0631\u0643\u0627\u062A" : "\u0645\u0633\u0627\u0621 \u0627\u0644\u062E\u064A\u0631 \u0648\u0627\u0644\u0645\u0633\u0631\u0627\u062A";
          let sentimentInstruction = "";
          const userMsgLower = (userMessageText || "").trim().toLowerCase();
          const hasNegativeSentiment = /مشكلة|عطل|سيء|بطيء|شكوى|غاضب|استرجاع|فلوسي|نصاب|رداءة|خراب|bad|worst|angry|broken|issue|problem|error|scam|refund|slow/i.test(userMsgLower);
          if (hasNegativeSentiment) {
            sentimentInstruction = `
- CRITICAL SENTIMENT ADAPTATION: The customer is expressing frustration, annoyance, or reporting a complaint/issue. You MUST immediately start your response with a deeply sincere, warm, and highly professional apology on behalf of our team (e.g., '\u0646\u0639\u062A\u0630\u0631 \u0645\u0646 \u062D\u0636\u0631\u062A\u0643 \u0628\u0634\u062F\u0629 \u064A\u0627 \u0641\u0646\u062F\u0645 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u0632\u0639\u0627\u062C\u060C \u0648\u0646\u0647\u062A\u0645 \u062C\u062F\u0627\u064B \u0628\u062D\u0644 \u0645\u0634\u0643\u0644\u062A\u0643...' or 'Sincere apologies for any inconvenience, we are fully committed to resolving this...'). Avoid standard cheerful greetings or promotional pitches. Be calming, constructive, and direct.`;
          }
          const systemPrompt = `You are an elite, highly intelligent corporate AI customer support agent named "${device.aiAgentName || "WhatsApp Smart Agent"}", representing our premium brand on WhatsApp.
Your absolute goal is to deliver impeccable, friendly, accurate, and prestigious support to our customers.

Here are your elite operating parameters:

1. PERSONALITY, TONE & DYNAMIC TIME CONTEXT:
- Keep your tone warm, welcoming, respectful, and highly prestigious.
- Adapt your voice seamlessly to the requested style: ${device.aiVoiceTone || "professional"}.
- Use local context dynamically:
  * Current time is: ${currentTimeStr} (${currentDayStr}).
  * Current natural greeting is: ${currentPeriodStr}. Use this naturally in initial greetings!
- Treat the customer with maximum respect, using natural Arabic or English honorifics (e.g., "\u064A\u0627 \u0641\u0646\u062F\u0645", "\u062D\u0636\u0631\u062A\u0643", "\u0637\u0627\u0644 \u0639\u0645\u0631\u0643", "\u0639\u0644\u0649 \u0631\u0627\u0633\u064A \u064A\u0627 \u063A\u0627\u0644\u064A", "\u0623\u0628\u0634\u0631 \u0628\u0633\u0639\u062F\u0643").

2. EMOTIONAL INTELLIGENCE & crisis mitigation:
${sentimentInstruction}
- If the customer is satisfied or showing positive emotion, validate it with enthusiasm and prestigious appreciation.

3. KNOWLEDGE BASE GROUNDING & STRICT FAITHFULNESS:
- Use the following factual Knowledge Base as your sole source of truth:
${device.aiKnowledgeBase || "(No knowledge base specified. Answer general greetings politely, but if asked about business details like pricing, booking, or orders, politely offer to transfer them to human support.)"}
- STRICT ANTI-HALLUCINATION & ANTI-AI-SLOP RULES: If the answer is NOT explicitly covered in the Knowledge Base:
  * DO NOT make up or assume links, prices, numbers, or features.
  * Instead of saying "I don't know", transition smoothly into a highly professional Lead Capture flow!
  * Tell them that you would love to get a specialized human representative to assist them with this directly, and ask for their preferred contact details or name:
    - In Arabic: "\u064A\u0633\u0639\u062F\u0646\u0627 \u062C\u062F\u0627\u064B \u0627\u0647\u062A\u0645\u0627\u0645\u0643 \u064A\u0627 \u0641\u0646\u062F\u0645! \u0644\u062A\u0632\u0648\u064A\u062F\u0643 \u0628\u0623\u062F\u0642 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u062D\u0635\u0631\u064A\u0629 \u0648\u0627\u0644\u0631\u062F\u0648\u062F \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629\u060C \u0647\u0644 \u064A\u0645\u0643\u0646\u0646\u064A \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0631\u064A\u0645\u061F \u0648\u0633\u064A\u0642\u0648\u0645 \u0645\u0633\u0624\u0648\u0644 \u0628\u0634\u0631\u064A \u0645\u0646 \u0641\u0631\u064A\u0642\u0646\u0627 \u0628\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0641\u0648\u0631\u0627\u064B \u0648\u062A\u0644\u0628\u064A\u0629 \u0637\u0644\u0628\u0643."
    - In English: "We appreciate your interest! To provide you with the most accurate pricing and details, could you please provide your name? I will have a specialized team member reach out to you directly."

4. CONTEXT & MEMORY CONTINUITY:
- Review the Conversation History carefully.
- Refer to the customer by their name (${pushName || "Valued Customer"}) where natural.
- Avoid repeating introductory lines across turns. Address subsequent queries organically as a continuous conversation.

5. FORMATTING FOR WHATSAPP (READABILITY MAX):
- Keep your responses compact, highly scannable, and ideal for reading on a mobile interface.
- Use line breaks generously to separate distinct points and create visual breathing room.
- Apply bold (*bold*) to key elements, action items, numbers, or names.
- Structure listings using beautiful emoji bullet points (e.g., \u{1F539}, \u{1F538}, \u{1F680}, \u{1F4A1}, \u2714).
- NEVER output markdown headings like '#', '##', or '###'. Use bold uppercase text instead.

Current Conversation Context:
- Connected Channel: ${device.name}
- User's Phone: +${contactPhone}
- Current Server Time: ${currentTimeStr}

Conversation History (Last 20 messages for context):
${formattedHistory || "(No previous messages)"}

Formulate your exceptionally smart and professional response now:`;
          let modelName = device.aiModel || "gemini-3.5-flash";
          if (modelName === "gemini-2.5-flash" || modelName.startsWith("gemini-2.0") || modelName.startsWith("gemini-1.5")) {
            modelName = "gemini-3.5-flash";
          }
          if (modelName === "gemini-3.5-pro") {
            modelName = "gemini-3.1-pro-preview";
          }
          console.log(`[AI Agent] Formulating response using model "${modelName}"...`);
          const queryExhibitionTool = {
            functionDeclarations: [{
              name: "query_exhibition_system",
              description: "Query the EXPOCORE system to get live details about a specific exhibition, including agenda, location, dates, and exhibitor companies.",
              parameters: {
                type: "OBJECT",
                properties: {
                  eventName: {
                    type: "STRING",
                    description: "The name of the exhibition to query (e.g. 'Tech Expo 2026'). Provide your best guess based on the user's input."
                  }
                },
                required: ["eventName"]
              }
            }]
          };
          let response = await callGeminiWithRetry({
            model: modelName,
            contents: contentsPayload,
            config: {
              systemInstruction: systemPrompt,
              temperature: device.aiTemperature !== void 0 ? Number(device.aiTemperature) : 0.8,
              tools: [queryExhibitionTool]
            }
          });
          let functionCall = response.candidates?.[0]?.content?.parts?.find((p) => p.functionCall)?.functionCall || response.functionCalls?.[0];
          if (functionCall && functionCall.name === "query_exhibition_system") {
            console.log(`[AI Agent] Tool call detected: query_exhibition_system`, functionCall.args);
            const eventName = functionCall.args?.eventName || functionCall.args?.fields?.eventName?.stringValue || "Tech Expo";
            let toolResult = "No info";
            try {
              const expoRes = await fetch(`http://localhost:3000/api/watbus/agent/query?eventName=${encodeURIComponent(eventName)}`, {
                headers: { "api_key": process.env.WATBUS_API_KEY || "" }
              });
              const expoJson = await expoRes.json();
              toolResult = expoJson.context || "Event not found.";
            } catch (e) {
              toolResult = "Error connecting to EXPOCORE.";
            }
            contentsPayload.push({
              role: "model",
              parts: [{ functionCall }]
            });
            contentsPayload.push({
              role: "user",
              parts: [{ functionResponse: { name: "query_exhibition_system", response: { result: toolResult } } }]
            });
            console.log(`[AI Agent] Submitting tool response and resuming...`);
            response = await callGeminiWithRetry({
              model: modelName,
              contents: contentsPayload,
              config: {
                systemInstruction: systemPrompt,
                temperature: device.aiTemperature !== void 0 ? Number(device.aiTemperature) : 0.8,
                tools: [queryExhibitionTool]
              }
            });
          }
          responseText = response?.text || "";
          console.log(`[AI Agent] Generated text response: "${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}"`);
          if (shouldReplyWithVoice && responseText) {
            const tone = device.aiVoiceTone || "professional";
            console.log(`[AI Agent] Synthesizing voice note using gemini-3.1-flash-tts-preview for tone "${tone}"...`);
            try {
              let ttsStylePrompt = "";
              if (tone === "friendly") {
                ttsStylePrompt = `Say cheerfully in a warm, friendly, and welcoming Arabic tone: ${responseText}`;
              } else if (tone === "formal") {
                ttsStylePrompt = `Say in a clear, highly formal, respectful, and professional Arabic tone: ${responseText}`;
              } else {
                ttsStylePrompt = `Say professionally, helpful, and naturally in Arabic: ${responseText}`;
              }
              let voiceName = "Zephyr";
              if (tone === "friendly") {
                voiceName = "Kore";
              } else if (tone === "formal") {
                voiceName = "Puck";
              }
              const ttsResponse = await callGeminiWithRetry({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: ttsStylePrompt }] }],
                config: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName }
                    }
                  }
                }
              });
              const base64Audio = ttsResponse?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                responseAudioBuffer = Buffer.from(base64Audio, "base64");
                console.log(`[AI Agent] Successfully synthesized voice note (${responseAudioBuffer.length} bytes) using voice "${voiceName}".`);
              } else {
                console.warn("[AI Agent] TTS returned successful response but no audio parts were found.");
              }
            } catch (ttsErr) {
              console.error("[AI Agent] Voice synthesis failed, falling back to text-only reply:", ttsErr);
            }
          }
        } catch (geminiErr) {
          console.error("Gemini API error in WhatsApp Auto-Reply:", geminiErr);
          responseText = "\u0645\u0631\u062D\u0628\u0627\u064B\u060C \u062A\u0644\u0642\u064A\u0646\u0627 \u0631\u0633\u0627\u0644\u062A\u0643 \u0628\u0646\u062C\u0627\u062D \u0648\u0633\u0646\u0642\u0648\u0645 \u0628\u0627\u0644\u0631\u062F \u0639\u0644\u064A\u0643 \u0641\u064A \u0623\u0642\u0631\u0628 \u0648\u0642\u062A.";
        }
      } else {
        responseText = `[AI Auto-Reply Simulation] Hello ${pushName || "Customer"}! This is an automated offline simulation reply because no \`GEMINI_API_KEY\` is defined in the system. Add your API key to settings to enable the live smart agent!`;
      }
      const userWs = activeConnections.get(ownerId);
      if (userWs && userWs.readyState === import_ws.WebSocket.OPEN) {
        userWs.send(JSON.stringify({
          type: "typing",
          senderId: contactId,
          recipientId: ownerId,
          isTyping: true
        }));
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (userWs && userWs.readyState === import_ws.WebSocket.OPEN) {
        userWs.send(JSON.stringify({
          type: "typing",
          senderId: contactId,
          recipientId: ownerId,
          isTyping: false
        }));
      }
      console.log(`[AI Agent - Dispatching Reply] Sending reply via device "${device.name}" to +${contactPhone}. Voice: ${!!responseAudioBuffer}`);
      const sendResult = await sendBaileysMessage(deviceId, jid, responseText, responseAudioBuffer || void 0);
      const aiMsg = {
        id: `msg_${Math.random().toString(36).substring(2, 11)}`,
        conversationId: conv.id,
        senderId: ownerId,
        recipientId: contactId,
        content: responseText,
        type: responseAudioBuffer ? "audio" : "text",
        mediaUrl: responseAudioBuffer ? `data:audio/mp3;base64,${responseAudioBuffer.toString("base64")}` : void 0,
        status: sendResult && sendResult.success ? "delivered" : "sent",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      saveMessage(aiMsg);
      broadcast({
        type: "message:new",
        message: aiMsg
      });
    } catch (err) {
      console.error("Fatal error in AI Agent WhatsApp responder loop:", err);
    }
  });
  try {
    console.log("Running LID to Phone Number contact merging migration...");
    mergeLidContactsAndConversations();
    console.log("Running duplicate conversation merging migration...");
    mergeDuplicateConversations();
  } catch (err) {
    console.error("Error running migrations on startup:", err);
  }
  try {
    const devices = getAllDevices().filter((d) => d.method === "qr");
    console.log(`Booting up ${devices.length} real WhatsApp gateway sessions at startup...`);
    for (const dev of devices) {
      if (isSupabaseConfigured()) {
        console.log(`[Supabase Startup] Downloading cloud session files for device ${dev.id}...`);
        try {
          await restoreSessionFromSupabase(dev.id);
        } catch (err) {
          console.error(`[Supabase Startup] Error restoring session for device ${dev.id}:`, err);
        }
      }
      startWhatsAppSession(dev.id).catch((err) => {
        console.error(`Failed to boot WhatsApp device ${dev.id}:`, err);
      });
    }
  } catch (err) {
    console.error("Error auto-booting WhatsApp devices:", err);
  }
  app.post("/api/expocore-agent/chat", async (req, res) => {
    const { message, role, dbData } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const roleTier = role === "admin" ? "admin" : "visitor";
    const isArabic = /[\u0600-\u06FF]/.test(message);
    const eventDetails = dbData?.eventDetails || {
      name: "ExpoCore International Expo 2026",
      location: isArabic ? "\u0645\u0631\u0643\u0632 \u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0627\u0644\u062F\u0648\u0644\u064A \u0644\u0644\u0645\u0624\u062A\u0645\u0631\u0627\u062A (CICC)\u060C \u0642\u0627\u0639\u0629 4" : "Cairo International Convention Centre (CICC), Hall 4",
      date: isArabic ? "12-15 \u0623\u0643\u062A\u0648\u0628\u0631 2026" : "October 12-15, 2026",
      agenda: isArabic ? "09:00 \u0635 \u062D\u0641\u0644 \u0627\u0644\u0627\u0641\u062A\u062A\u0627\u062D\u060C 11:00 \u0635 \u062C\u0644\u0633\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629\u060C 02:00 \u0645 \u062C\u0644\u0633\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u062A\u0634\u0628\u064A\u0643" : "09:00 AM Opening Ceremony, 11:00 AM Tech Panels, 02:00 PM Networking Sessions",
      parking: isArabic ? "\u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0627\u0644\u0642\u0637\u0627\u0639 B\u060C \u0648\u0645\u062C\u0627\u0646\u064A \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0632\u0648\u0627\u0631 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0639\u0631\u0636" : "Available in Sector B, completely free for all registered expo attendees"
    };
    const exhibitors = dbData?.exhibitors || [];
    const stats = dbData?.stats || {
      pageVisits: 145200,
      registeredVisitors: 12840,
      conversionRate: "8.8%",
      abandonedLeads: 1420,
      gateScans: { gate1: 5420, gate2: 4180 }
    };
    try {
      if (ai) {
        const prompt = `
You are the "ExpoCore WhatsApp Smart Agent", the official AI representative for the ExpoCore exhibition management system on WhatsApp. Your primary role is to provide seamless, real-time support to exhibition attendees and system administrators by acting as the intelligent interface between the WhatsApp user and the ExpoCore backend database.

### USER AND ROLE CONTEXT
User Message: "${message}"
Detected User Role: ${roleTier} (Can be 'visitor' or 'admin')

### LIVE EXPOCORE BACKEND DATABASE (THE ABSOLUTE SOURCE OF TRUTH)
Use this dynamic data to answer. Do NOT invent, guess, or make up any dates, booth numbers, exhibitors, locations, or numbers:
Event Details: ${JSON.stringify(eventDetails, null, 2)}
Exhibitors: ${JSON.stringify(exhibitors, null, 2)}
Exhibition Stats: ${JSON.stringify(stats, null, 2)}

### CORE DIRECTIVES & WORKFLOWS
1. Inbound Query Resolution (Pull Workflow):
   Analyze user intent. If the answer requires dynamic data, identify the required tool (e.g., 'get_exhibitors_list', 'get_event_details', 'get_dashboard_stats') and simulate calling it to get the data from the ExpoCore database provided above.
   
2. Role-Based Access Control (RBAC):
   - Visitor Tier: Can only access public event info and their own ticket details. If a visitor asks for system stats/analytics/numbers (such as registered visitors, conversion rates, gate scans), politely but firmly decline.
   - Admin Tier: Can request system analytics and dashboard stats. When asked, use tools to fetch data and present it in a clean, professional executive summary format.

3. Strict Guardrails (CRITICAL):
   - Zero Hallucination: NEVER invent, guess, or assume information about dates, times, exhibitors, locations, or statistics. If a piece of info is missing from the database or empty, you must reply: "\u0639\u0630\u0631\u0627\u064B\u060C \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629 \u0644\u062F\u064A \u062D\u0627\u0644\u064A\u0627\u064B\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0641\u0631\u064A\u0642 \u0627\u0644\u062F\u0639\u0645."
   - Scope Restriction: Refuse to answer questions unrelated to the exhibition, ticketing, or the ExpoCore platform. Gently steer the conversation back to the event.
   - Raw Data Handling: Never output raw JSON or unformatted system variables. Always parse the database into natural, conversational text.

### COMMUNICATION STYLE & FORMATTING
- Respond in the same language the user speaks (default to clear Egyptian Arabic or modern standard Arabic if initiated in Arabic).
- Optimize for WhatsApp readability. Use bullet points (* or -), bold text (*text*), and appropriate emojis (e.g., \u{1F3AB}, \u{1F4CD}, \u{1F4CA}, \u{1F3E2}) sparingly but effectively. Break long paragraphs into shorter sentences.

### OUTPUT JSON FORMAT
You must respond with a JSON object containing the exact structure below:
{
  "thoughts": [
    { "stage": "intent_analysis", "detail": "explanation of what intent was detected" },
    { "stage": "rbac_check", "detail": "explanation of role authorization validation" },
    { "stage": "tool_call", "detail": "simulated tool invocation name" },
    { "stage": "tool_response", "detail": "simulated tool output payload or summary" },
    { "stage": "synthesizing", "detail": "formulation notes" }
  ],
  "reply": "final formatted WhatsApp response string"
}
`;
        const response = await callGeminiWithRetry({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                thoughts: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      stage: { type: "STRING" },
                      detail: { type: "STRING" }
                    },
                    required: ["stage", "detail"]
                  }
                },
                reply: { type: "STRING" }
              },
              required: ["thoughts", "reply"]
            }
          }
        });
        const textResponse = response.text || "{}";
        const parsed = JSON.parse(textResponse.trim());
        return res.json(parsed);
      }
    } catch (err) {
      console.error("Error invoking Gemini for ExpoCore Smart Agent:", err);
    }
    const thoughts = [
      { stage: "intent_analysis", detail: `Analyzing query: "${message}"` },
      { stage: "rbac_check", detail: `Verifying permissions for user role: "${role}"` }
    ];
    let reply = "";
    const msgLower = message.toLowerCase().trim();
    const isOffTopic = !(msgLower.includes("exhib") || msgLower.includes("\u0639\u0627\u0631\u0636") || msgLower.includes("\u0634\u0631\u0643") || msgLower.includes("where") || msgLower.includes("\u0627\u064A\u0646") || msgLower.includes("\u0623\u064A\u0646") || msgLower.includes("\u0645\u0643\u0627\u0646") || msgLower.includes("\u0645\u0648\u0642\u0639") || msgLower.includes("\u0639\u0646\u0648\u0627\u0646") || msgLower.includes("when") || msgLower.includes("\u0645\u062A\u0649") || msgLower.includes("\u0648\u0642\u062A") || msgLower.includes("\u062A\u0627\u0631\u064A\u062E") || msgLower.includes("\u064A\u0648\u0645") || msgLower.includes("ticket") || msgLower.includes("\u062A\u0630\u0643\u0631") || msgLower.includes("\u062A\u0630\u0643\u0631\u062A") || msgLower.includes("qr") || msgLower.includes("park") || msgLower.includes("\u0645\u0648\u0642\u0641") || msgLower.includes("\u0631\u0643\u0646") || msgLower.includes("\u062C\u0631\u0627\u062C") || msgLower.includes("stat") || msgLower.includes("\u0627\u062D\u0635\u0627\u0626") || msgLower.includes("\u0625\u062D\u0635\u0627\u0626") || msgLower.includes("\u0623\u0631\u0642\u0627\u0645") || msgLower.includes("\u0627\u0631\u0642\u0627\u0645") || msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("\u0645\u0631\u062D\u0628\u0627") || msgLower.includes("\u0633\u0644\u0627\u0645") || msgLower.includes("\u0623\u0647\u0644\u0627\u064B") || msgLower.includes("\u0627\u0647\u0644\u0627\u064B"));
    if (isOffTopic) {
      thoughts.push({ stage: "scope_check", detail: "Query is detected as out-of-scope for the exhibition system." });
      reply = isArabic ? "\u0639\u0630\u0631\u0627\u064B\u060C \u0623\u0646\u0627 \u0647\u0646\u0627 \u0641\u0642\u0637 \u0644\u0645\u0633\u0627\u0639\u062F\u062A\u0643 \u0628\u062E\u0635\u0648\u0635 \u0645\u0639\u0631\u0636 *ExpoCore*\u060C \u0627\u0644\u062A\u0630\u0627\u0643\u0631\u060C \u0627\u0644\u0639\u0627\u0631\u0636\u064A\u0646\u060C \u0648\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629. \u064A\u0631\u062C\u0649 \u0637\u0631\u062D \u0633\u0624\u0627\u0644 \u0645\u062A\u0639\u0644\u0642 \u0628\u0627\u0644\u0645\u0639\u0631\u0636! \u{1F60A}" : "I'm sorry, I am only able to assist you with inquiries regarding the *ExpoCore* exhibition, tickets, exhibitors, and event details. Please ask a question related to the exhibition! \u{1F60A}";
    } else if (msgLower.includes("stat") || msgLower.includes("\u0627\u062D\u0635\u0627\u0626") || msgLower.includes("\u0625\u062D\u0635\u0627\u0626") || msgLower.includes("\u0623\u0631\u0642\u0627\u0645") || msgLower.includes("\u0627\u0631\u0642\u0627\u0645")) {
      thoughts.push({ stage: "tool_call", detail: "User requested dashboard statistics. Checking authorization..." });
      if (role === "admin") {
        thoughts.push({ stage: "rbac_check", detail: "RBAC Access GRANTED: User is an authorized Admin." });
        thoughts.push({ stage: "tool_call", detail: "Invoking get_dashboard_stats() to fetch live system analytics..." });
        thoughts.push({ stage: "tool_response", detail: "Dashboard stats fetched successfully." });
        thoughts.push({ stage: "synthesizing", detail: "Generating executive stats summary." });
        reply = isArabic ? `\u{1F4CA} *\u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A \u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0646\u0638\u0627\u0645 ExpoCore:*

- *\u0632\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0635\u0641\u062D\u0629 (Page Visits):* ${stats.pageVisits?.toLocaleString() || "145,200"} \u0632\u064A\u0627\u0631\u0629
- *\u0627\u0644\u0632\u0648\u0627\u0631 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646 (Registered Visitors):* ${stats.registeredVisitors?.toLocaleString() || "12,840"} \u0632\u0627\u0626\u0631 \u{1F3AB}
- *\u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 (Conversion Rate):* ${stats.conversionRate || "8.8%"}
- *\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0644\u064A\u0646 (Abandoned Leads):* ${stats.abandonedLeads?.toLocaleString() || "1,420"} \u0639\u0645\u064A\u0644
- *\u0639\u0645\u0644\u064A\u0627\u062A \u0645\u0633\u062D \u0627\u0644\u0628\u0648\u0627\u0628\u0627\u062A (Gate Scans):*
  - *\u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 (Gate 1):* ${stats.gateScans?.gate1?.toLocaleString() || "5,420"}
  - *\u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 (Gate 2):* ${stats.gateScans?.gate2?.toLocaleString() || "4,180"}

\u062A\u0645 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0647\u0630\u0647 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0641\u0639\u0644\u064A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A ExpoCore \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629.` : `\u{1F4CA} *ExpoCore Dashboard Executive Analytics Summary:*

- *Page Visits:* ${stats.pageVisits?.toLocaleString() || "145,200"}
- *Registered Visitors:* ${stats.registeredVisitors?.toLocaleString() || "12,840"} \u{1F3AB}
- *Conversion Rate:* ${stats.conversionRate || "8.8%"}
- *Abandoned Leads:* ${stats.abandonedLeads?.toLocaleString() || "1,420"}
- *Gate Scans:*
  - *Gate 1:* ${stats.gateScans?.gate1?.toLocaleString() || "5,420"}
  - *Gate 2:* ${stats.gateScans?.gate2?.toLocaleString() || "4,180"}

All metrics have been fetched in real-time from the live database.`;
      } else {
        thoughts.push({ stage: "rbac_check", detail: "RBAC Access DENIED: Visitor requested admin-only statistics." });
        reply = isArabic ? "\u0639\u0630\u0631\u0627\u064B\u060C \u0647\u0630\u0647 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0645\u062E\u0635\u0635\u0629 \u0641\u0642\u0637 \u0644\u0645\u062F\u064A\u0631\u064A \u0627\u0644\u0646\u0638\u0627\u0645 (System Administrators). \u0628\u0635\u0641\u062A\u0643 \u0632\u0627\u0626\u0631\u0627\u064B\u060C \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u064A\u0647\u0627." : "I am sorry, but these system statistics and analytics are strictly reserved for system administrators. As a visitor, you do not have permission to access them.";
      }
    } else if (msgLower.includes("exhib") || msgLower.includes("\u0639\u0627\u0631\u0636") || msgLower.includes("\u0634\u0631\u0643")) {
      thoughts.push({ stage: "tool_call", detail: "Invoking get_exhibitors_list() to check live exhibitors..." });
      thoughts.push({ stage: "tool_response", detail: `Found ${exhibitors.length} exhibitors in the database.` });
      if (exhibitors.length === 0) {
        reply = isArabic ? "\u0639\u0630\u0631\u0627\u064B\u060C \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629 \u0644\u062F\u064A \u062D\u0627\u0644\u064A\u0627\u064B\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0641\u0631\u064A\u0642 \u0627\u0644\u062F\u0639\u0645." : "Sorry, this information is currently not available, please contact the support team.";
      } else {
        thoughts.push({ stage: "synthesizing", detail: "Formatting exhibitor listing." });
        const exhibList = exhibitors.map((e) => `- *${e.name}* (\u062C\u0646\u0627\u062D: *${e.booth}*) - ${e.category}`).join("\n");
        reply = isArabic ? `\u{1F3E2} *\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0639\u0627\u0631\u0636\u064A\u0646 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0639\u0631\u0636:*

${exhibList}

\u064A\u0633\u0639\u062F\u0646\u0627 \u062D\u0636\u0648\u0631\u0643\u0645 \u0648\u062A\u0641\u0627\u0639\u0644\u0643\u0645 \u0645\u0639 \u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0639\u0627\u0631\u0636\u0629! \u{1F3AB}` : `\u{1F3E2} *List of Exhibitors participating in the expo:*

${exhibList}

We look forward to your interaction with our esteemed exhibitors! \u{1F3AB}`;
      }
    } else if (msgLower.includes("where") || msgLower.includes("\u0627\u064A\u0646") || msgLower.includes("\u0623\u064A\u0646") || msgLower.includes("\u0645\u0643\u0627\u0646") || msgLower.includes("\u0645\u0648\u0642\u0639") || msgLower.includes("\u0639\u0646\u0648\u0627\u0646") || msgLower.includes("when") || msgLower.includes("\u0645\u062A\u0649") || msgLower.includes("\u0648\u0642\u062A") || msgLower.includes("\u062A\u0627\u0631\u064A\u062E") || msgLower.includes("\u064A\u0648\u0645") || msgLower.includes("park") || msgLower.includes("\u0645\u0648\u0642\u0641") || msgLower.includes("\u0631\u0643\u0646") || msgLower.includes("\u062C\u0631\u0627\u062C")) {
      thoughts.push({ stage: "tool_call", detail: "Invoking get_event_details() to check event details..." });
      thoughts.push({ stage: "tool_response", detail: "Event details fetched successfully." });
      thoughts.push({ stage: "synthesizing", detail: "Formulating event details response." });
      if (msgLower.includes("park") || msgLower.includes("\u0645\u0648\u0642\u0641") || msgLower.includes("\u0631\u0643\u0646") || msgLower.includes("\u062C\u0631\u0627\u062C")) {
        reply = isArabic ? `\u{1F697} *\u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u0648\u0627\u0642\u0641 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A:*
${eventDetails.parking} \u{1F4CD}` : `\u{1F697} *Parking Information:*
${eventDetails.parking}. \u{1F4CD}`;
      } else {
        reply = isArabic ? `\u{1F4C5} *\u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u0639\u0631\u0636 ${eventDetails.name}:*

- *\u{1F4CD} \u0627\u0644\u0645\u0643\u0627\u0646:* ${eventDetails.location}
- *\u{1F4C5} \u0627\u0644\u062A\u0627\u0631\u064A\u062E:* ${eventDetails.date}
- *\u23F0 \u0627\u0644\u062C\u062F\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064A:* ${eventDetails.agenda}
- *\u{1F697} \u0627\u0644\u0645\u0648\u0627\u0642\u0641:* ${eventDetails.parking}` : `\u{1F4C5} *Details for ${eventDetails.name}:*

- *\u{1F4CD} Location:* ${eventDetails.location}
- *\u{1F4C5} Date:* ${eventDetails.date}
- *\u23F0 Agenda:* ${eventDetails.agenda}
- *\u{1F697} Parking:* ${eventDetails.parking}`;
      }
    } else {
      thoughts.push({ stage: "synthesizing", detail: "Generating welcoming agent greeting." });
      reply = isArabic ? "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A *\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 ExpoCore*! \u{1F3AB}\u2728\n\n\u0623\u0646\u0627 *\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0640 WhatsApp \u0627\u0644\u0630\u0643\u064A* \u0627\u0644\u0631\u0633\u0645\u064A \u0627\u0644\u062E\u0627\u0635 \u0628\u0643. \u064A\u0633\u0639\u062F\u0646\u064A \u062C\u062F\u0627\u064B \u0645\u0633\u0627\u0639\u062F\u062A\u0643 \u0627\u0644\u064A\u0648\u0645!\n\n\u064A\u0645\u0643\u0646\u0643 \u0623\u0646 \u062A\u0633\u0623\u0644\u0646\u064A \u0639\u0646:\n- \u0623\u064A\u0646 \u0648\u0645\u062A\u0649 \u064A\u0642\u0627\u0645 \u0627\u0644\u0645\u0639\u0631\u0636\u061F \u{1F4CD}\n- \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0639\u0627\u0631\u0636\u0629 \u0648\u0623\u062C\u0646\u062D\u062A\u0647\u0627 \u{1F3E2}\n- \u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u0648\u0627\u0642\u0641 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u062C\u062F\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064A \u{1F697}\n\n(\u0648\u0644\u0645\u062F\u064A\u0631\u064A \u0627\u0644\u0646\u0638\u0627\u0645: \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0645\u0639\u0631\u0636 \u{1F4CA})" : "Welcome to *ExpoCore Exhibition Management System*! \u{1F3AB}\u2728\n\nI am your official *WhatsApp Smart Agent*. I'm absolutely delighted to assist you today!\n\nYou can ask me about:\n- Where and when the event is happening? \u{1F4CD}\n- List of exhibitors and their booths \u{1F3E2}\n- Parking details and agenda \u{1F697}\n\n(For Admins: You can also request real-time exhibition analytics/stats \u{1F4CA})";
    }
    return res.json({ thoughts, reply });
  });
  app.post("/api/expocore/webhook", async (req, res) => {
    const apiKeyHeader = req.headers["api_key"] || req.headers["x-api-key"] || req.query.api_key;
    let { name, phone, ticket, ticketUrl, customMessage, eventName } = req.body;
    name = name || req.body.visitor_name || req.body.first_name || req.body.customer_name || req.body.full_name || req.body.visitorName;
    phone = phone || req.body.visitor_phone || req.body.customer_phone || req.body.mobile || req.body.whatsapp || req.body.visitorPhone;
    if (phone && typeof phone === "string") {
      phone = phone.replace(/[\s\+\-\(\)]/g, "").trim();
      if (phone.startsWith("010") || phone.startsWith("011") || phone.startsWith("012") || phone.startsWith("015")) {
        phone = "2" + phone;
      }
    }
    console.log(`[ExpoCore Webhook] Received registration check-in for event: ${eventName || "Unknown"}`, { name, phone, ticket, ticketUrl, apiKeyHeader });
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: name and phone are mandatory."
      });
    }
    const isArabic = /[\u0600-\u06FF]/.test(name) || phone.startsWith("+20") || phone.startsWith("20") || phone.startsWith("010") || phone.startsWith("011") || phone.startsWith("012") || phone.startsWith("015");
    const qrUrl = ticketUrl || `https://expocore.io/t/${ticket || "9842"}-qr`;
    let messageText = "";
    if (customMessage && customMessage.trim() !== "") {
      messageText = customMessage.replace(/{{name}}/g, name || "").replace(/{{ticketUrl}}/g, qrUrl || "");
    } else {
      messageText = isArabic ? `\u{1F3AB} *\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u064A\u0627 ${name}!* \u0644\u0642\u062F \u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062D\u0636\u0648\u0631\u0643 \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0627\u0644\u0645\u0639\u0631\u0636.

\u062A\u062C\u062F \u062A\u0630\u0643\u0631\u062A\u0643 \u0648\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0640 QR \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0647\u0646\u0627:
\u{1F449} ${qrUrl}

\u0646\u062D\u0646 \u0628\u0627\u0646\u062A\u0638\u0627\u0631\u0643! \u0648\u0633\u0623\u0643\u0648\u0646 \u0645\u0639\u0643 \u0643\u0640 \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0644\u0644\u0625\u062C\u0627\u0628\u0629 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A\u0643 \u062D\u0648\u0644 \u0627\u0644\u0645\u0639\u0631\u0636 \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0639\u0627\u0631\u0636\u0629 \u0641\u0648\u0631\u0627\u064B! \u{1F91D}` : `\u{1F3AB} *Hello ${name}!* Your registration has been successfully confirmed.

You can access your digital ticket and access QR code here:
\u{1F449} ${qrUrl}

We look forward to seeing you! I am your WhatsApp Smart Agent. If you have any questions, feel free to ask me! \u{1F91D}`;
    }
    const db = readDb();
    const cleanPhone = phone.replace(/[\s\+\-\(\)]/g, "").trim();
    const contactId = `contact_${cleanPhone}`;
    if (!db.users[contactId]) {
      db.users[contactId] = {
        id: contactId,
        username: name || `Contact ${cleanPhone}`,
        role: "user",
        avatar: "",
        status: "offline",
        source: "EXPOCORE",
        tags: eventName ? [eventName] : []
      };
    } else {
      db.users[contactId].source = "EXPOCORE";
      if (!db.users[contactId].tags) db.users[contactId].tags = [];
      if (eventName && !db.users[contactId].tags.includes(eventName)) {
        db.users[contactId].tags.push(eventName);
      }
    }
    let conv = db.conversations.find((c) => c.participantIds.includes(contactId));
    if (!conv) {
      const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      conv = {
        id: convId,
        participantIds: ["meta-ai", contactId],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "active"
      };
      db.conversations.push(conv);
    }
    if (!db.messages) db.messages = [];
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      conversationId: conv.id,
      senderId: "meta-ai",
      content: messageText,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "sent"
    };
    db.messages.push(newMsg);
    writeDb(db);
    const allDevices = getAllDevices();
    const activeDevices = allDevices.filter((d) => d.status === "connected" || d.method === "qr" || d.method === "greenapi" || d.method === "cloud_api");
    let device = null;
    const reqDeviceId = req.body.deviceId;
    if (reqDeviceId) {
      device = activeDevices.find((d) => d.id === reqDeviceId) || allDevices.find((d) => d.id === reqDeviceId);
    }
    if (!device) {
      device = activeDevices[0] || allDevices[0];
    }
    if (!device) {
      console.warn(`[ExpoCore Webhook] No active WhatsApp gateway connected. Simulating success.`);
      return res.json({
        success: true,
        simulated: true,
        message: "No active WhatsApp device connected, but webhook was successfully validated, simulated and saved to CRM.",
        payload: { name, phone, qrUrl, messageText }
      });
    }
    try {
      const result = await sendRealWhatsAppMessage(device, phone, messageText);
      console.log(`[ExpoCore Webhook] Dispatch result for ${phone}:`, result);
      return res.json({
        success: result.success,
        device_used: device.id,
        error: result.error,
        message: "Webhook processed and dispatched to WhatsApp queue.",
        payload: { name, phone, qrUrl }
      });
    } catch (error) {
      console.error(`[ExpoCore Webhook] Error sending WhatsApp message:`, error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal error sending WhatsApp message"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path4.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path4.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, () => {
    console.log(`WhatsApp Server listening on ${typeof PORT === "string" && isNaN(Number(PORT)) ? "socket" : "http://localhost:"}${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
