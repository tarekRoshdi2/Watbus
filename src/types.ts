/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  role: 'admin' | 'user';
  avatarUrl: string;
  statusText: string;
  isOnline: boolean;
  lastSeenAt: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionPlan?: 'starter' | 'pro' | 'enterprise';
  totalTokensUsed: number;
  costInDollars: number;
  aiMessagesUsed: number;   // Number of AI messages sent this month
  aiMessagesLimit: number;  // Maximum AI messages allowed by their plan
  trialExpiresAt?: string;
  usageLimit?: number;
  phoneNumber?: string;
  isActive?: boolean;
  requestedPlan?: 'starter' | 'pro' | 'enterprise';
  paymentProofUrl?: string;
  quickReplies?: string[];
}

export interface Conversation {
  id: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  label?: string; // CRM labels like 'Lead', 'VIP', 'Pending', etc.
  deviceId?: string; // The ID of the WhatsApp device/account this conversation belongs to
  aiPaused?: boolean; // Explicit field to pause/mute the AI Agent for human takeover
  voiceSettings?: {
    enabled: boolean;
    accent: string;       // 'eg' | 'sa' | 'lb' | 'msa' | 'en_us' | 'en_uk'
    voiceName: string;    // 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'
  };
  adminReport?: {
    content: string;
    updatedAt: string;
  };
}

export type MessageType = 'text' | 'image' | 'audio';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: MessageType;
  mediaUrl?: string; // Base64 or local URL
  status: MessageStatus;
  timestamp: string;
  isInternalNote?: boolean;
}

export interface StatusStory {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  type: 'text' | 'image';
  content: string; // text or image source
  bgColor?: string; // Background color for text status
  createdAt: string;
  viewers: string[]; // List of user IDs who viewed this
}

export interface DeviceLink {
  id: string;
  name: string;
  status: 'disconnected' | 'linking' | 'connecting' | 'connected' | 'disconnected_fatal';
  method: 'qr' | 'cloud_api' | 'ultramsg' | 'greenapi';
  ownerId?: string; // Tenant/User owner of this WhatsApp device link
  gatewayType?: 'simulation' | 'ultramsg' | 'greenapi' | 'meta_cloud';
  instanceId?: string;
  token?: string;
  apiEndpoint?: string;
  phoneNumber?: string;
  cloudApiKey?: string;
  phoneId?: string;
  businessId?: string;
  qrCodeUrl?: string;
  linkedAt?: string;
  aiAgentEnabled?: boolean;
  aiAgentName?: string;
  aiAgentInstructions?: string;
  aiModel?: string;
  aiTemperature?: number;
  aiKnowledgeBase?: string;
  aiStopKeyword?: string;
  aiVoiceEnabled?: boolean;
  aiVoiceTone?: 'professional' | 'friendly' | 'formal';
  backupStatus?: 'synced' | 'pending' | 'error';
  apiKey?: string;
  webhookUrl?: string;
  knowledgeBaseSources?: Array<{
    id: string;
    name: string;
    type: 'file' | 'link';
    content: string;
    size?: string;
    url?: string;
    timestamp: string;
  }>;
}

export interface Campaign {
  id: string;
  name: string;
  templateText: string;
  ownerId?: string; // Tenant/User owner of this broadcast campaign
  mediaUrl?: string;
  targets: { phone: string; name: string; status: 'pending' | 'sending' | 'sent' | 'failed'; error?: string }[];
  status: 'draft' | 'sending' | 'completed' | 'paused';
  progress: number; // 0 to 100
  createdAt: string;
  completedAt?: string;
  logs: string[];
  deviceId?: string;
  delay?: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface DemoLead {
  id: string;
  username: string;
  phone: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  number: string;
}

export interface OtpLog {
  id: string;
  phone: string;
  otp: string;
  message: string;
  status: 'sent' | 'failed';
  error?: string;
  deviceId?: string;
  deviceName?: string;
  timestamp: string;
}

export interface OtpSettings {
  template: string;
  defaultDeviceId?: string;
}

// WebSocket Event Structure
export type WsEvent =
  | { type: 'auth'; userId: string }
  | { type: 'presence'; userId: string; isOnline: boolean; lastSeenAt: string }
  | { type: 'typing'; senderId: string; recipientId: string; isTyping: boolean }
  | { type: 'message:send'; message: Omit<Message, 'status' | 'timestamp'> }
  | { type: 'message:new'; message: Message }
  | { type: 'message:receipt'; messageId: string; status: MessageStatus; conversationId: string }
  | { type: 'status:new'; statusStory: StatusStory }
  | { type: 'status:view'; statusId: string; viewerId: string }
  | { type: 'campaign:update'; campaign: Campaign }
  | { type: 'device:update'; device: DeviceLink };
