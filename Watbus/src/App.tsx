/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { User, Conversation, Message, StatusStory, WsEvent, DeviceLink, Campaign, Folder } from './types.js';
import AuthView from './components/auth/AuthView.js';
import DemoRegistration from './components/demo/DemoRegistration.js';
import Sidebar from './components/Sidebar.js';
import ChatArea from './components/ChatArea.js';
import StatusFeed from './components/StatusFeed.js';
import MediaLightbox from './components/MediaLightbox.js';
import LandingPage from './components/LandingPage.js';
import DashboardStats from './components/DashboardStats.js';
import GroupManager from './components/GroupManager.js';
import WhatsAppSettings from './components/WhatsAppSettings.js';
import MarketingCampaigns from './components/MarketingCampaigns.js';
import AdminPage from './components/AdminPage.js';
import ClientsPage from './components/ClientsPage.js';
import CustomerFeedback from './components/CustomerFeedback.js';
import AiKnowledgeBase from './components/AiKnowledgeBase.js';
import ExpoCoreAgent from './components/ExpoCoreAgent.js';
import CustomerFlowBuilder from './components/CustomerFlowBuilder.js';
import AgentsDashboard from './components/AgentsDashboard.js';
import { Menu, X, LayoutDashboard, MessageSquare, Smartphone, Megaphone, LogOut, Loader2, Languages, Shield, Users, Group, Star, Brain, Bot, Workflow, CreditCard, Sparkles, Camera, Upload, Save, Check, Ticket } from 'lucide-react';
import { translations } from './translations.js';

// Subtle synthesizer chime for incoming message alerts
function playIncomingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (err) {
    console.warn('Audio feedback failed or was blocked:', err);
  }
}

// Subtle tone for outgoing message clicks
function playOutgoingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (err) {
    console.warn('Audio feedback failed or was blocked:', err);
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register' | 'demo'>('landing');
  const [activeAgentsTab, setActiveAgentsTab] = useState<'roster' | 'payments' | 'playground'>('roster');
  const [viewMode, setViewMode] = useState<'dashboard' | 'admin' | 'clients' | 'chat' | 'whatsapp_settings' | 'marketing' | 'group_manager' | 'feedback' | 'knowledge_base' | 'expocore_agent' | 'customer_flow' | 'agents_dashboard'>('dashboard');

  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('system_lang');
    return (saved as 'ar' | 'en') || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('system_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang];
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [conversations, setConversations] = useState<(Conversation & { recipient: User })[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [statuses, setStatuses] = useState<StatusStory[]>([]);
  const [typingStates, setTypingStates] = useState<Record<string, boolean>>({});
  const [devices, setDevices] = useState<DeviceLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);
  const [profileUsername, setProfileUsername] = useState<string>(currentUser?.username || '');
  const [profileEmail, setProfileEmail] = useState<string>(currentUser?.email || '');
  const [profilePassword, setProfilePassword] = useState<string>('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string>(currentUser?.avatarUrl || '');
  const [profileSavedToast, setProfileSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setProfileUsername(currentUser.username);
      setProfileEmail(currentUser.email || '');
      setProfileAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser, showProfileSettings]);

  // Expanded Image Lightbox State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Connection & WebSocket Refs
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initialize profile sessions from localStorage to survive refreshes
  useEffect(() => {
    const saved = localStorage.getItem('whatsapp_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User;
        setCurrentUser(parsed);
        setViewMode('dashboard');

        // Ensure user is registered on the server (especially on backend restart/rebuild)
        fetch('/api/auth/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        }).then(res => {
          if (res.ok) {
            console.log('User session successfully ensured on server');
            fetchConversationsAndStatuses();
          } else if (res.status === 403) {
            res.json().then(data => {
              alert(data.error || 'لقد انتهت فترة صلاحية النسخة التجريبية (7 أيام). يرجى الترقية للاستمرار.');
              handleLogout();
            });
          }
        }).catch(err => {
          console.warn('Error ensuring user session on server:', err);
        });
      } catch (err) {
        console.error('Failed to parse saved user', err);
      }
    }
  }, []);

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Sync session details when currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('whatsapp_user', JSON.stringify(currentUser));
      fetchConversationsAndStatuses();
      connectWebSocket();
    } else {
      localStorage.removeItem('whatsapp_user');
      closeWebSocket();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    }
  }, [currentUser]);

  // Fetch initial business suite metadata
  const fetchBusinessData = async () => {
    if (!currentUser) return;
    try {
      const [devRes, campRes, folderRes] = await Promise.all([
        fetch('/api/devices', {
          headers: { 'x-user-id': currentUser.id }
        }),
        fetch('/api/campaigns', {
          headers: { 'x-user-id': currentUser.id }
        }),
        fetch('/api/folders', {
          headers: { 'x-user-id': currentUser.id }
        })
      ]);
      if (devRes.ok) {
        const data = await devRes.json();
        setDevices(data.devices);
      }
      if (campRes.ok) {
        const data = await campRes.json();
        setCampaigns(data.campaigns);
      }
      if (folderRes.ok) {
        const data = await folderRes.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.warn('Error loading business metadata:', err);
    }
  };

  // Fetch initial chats, users, and statuses
  const fetchConversationsAndStatuses = async () => {
    if (!currentUser) return;
    try {
      fetchBusinessData();
      const [convRes, statusRes] = await Promise.all([
        fetch(`/api/users/${currentUser.id}/conversations`),
        fetch('/api/statuses')
      ]);

      if (convRes.ok) {
        const data = await convRes.json();
        setConversations((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data.conversations)) return prev;
          return data.conversations;
        });
        
        // Fetch message logs for each active conversation
        data.conversations.forEach(async (c: Conversation) => {
          const msgRes = await fetch(`/api/conversations/${c.id}/messages`);
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages((prev) => {
              const current = prev[c.id] || [];
              const uniqueMessages = Array.from(new Map(msgData.messages.map((m: Message) => [m.id, m])).values()) as Message[];
              if (current.length === uniqueMessages.length && JSON.stringify(current) === JSON.stringify(uniqueMessages)) {
                return prev;
              }
              return { ...prev, [c.id]: uniqueMessages };
            });
          }
        });
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatuses((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data.statuses)) return prev;
          return data.statuses;
        });
      }
    } catch (err) {
      console.warn('Error seeding active directories:', err);
    }
  };

  // Background polling as a robust backup fallback
  useEffect(() => {
    if (!currentUser) return;

    const pollInterval = setInterval(() => {
      fetchConversationsAndStatuses();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentUser]);

  // Hostinger WebSockets bypass: Poll devices rapidly if any device is linking
  useEffect(() => {
    if (!currentUser) return;
    const linkingDeviceExists = devices.some(d => d.status === 'linking');
    if (linkingDeviceExists) {
      const qrPoll = setInterval(() => {
        fetchBusinessData(); // Fetches /api/devices and updates devices state with QR code
      }, 2000);
      return () => clearInterval(qrPoll);
    }
  }, [currentUser, devices]);

  // Connect WebSocket Connection
  const connectWebSocket = () => {
    if (!currentUser) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to real-time WebSocket on:', socketUrl);
    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket successfully opened. Sending auth...');
      ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
      
      // Keep-alive heartbeat: ping every 25 seconds to maintain active connection
      const pingInterval = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
      (ws as any).pingInterval = pingInterval;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          return; // Quietly consume heartbeat response
        }
        console.log('WS Event received:', data.type, data);

        switch (data.type) {
          case 'presence': {
            setConversations((prev) =>
              prev.map((c) =>
                c.recipient.id === data.userId
                  ? { ...c, recipient: { ...c.recipient, isOnline: data.isOnline, lastSeenAt: data.lastSeenAt } }
                  : c
              )
            );
            break;
          }

          case 'typing': {
            const { senderId, isTyping } = data;
            setTypingStates((prev) => ({ ...prev, [senderId]: isTyping }));
            break;
          }

          case 'message:new': {
            const { message } = data;
            const convId = message.conversationId;

            setConversations((prev) => {
              const exists = prev.some((c) => c.id === convId);
              if (!exists) {
                setTimeout(() => {
                  fetchConversationsAndStatuses();
                }, 400);
              }
              return prev;
            });

            // Append messages
            setMessages((prev) => {
              const current = prev[convId] || [];
              if (current.some((m) => m.id === message.id)) return prev;
              const next = [...current, message];
              
              if (message.senderId !== currentUser.id) {
                playIncomingSound();
              }
              return { ...prev, [convId]: next };
            });

            // Dispatch global event for CRM/Analytics page to update instantly
            window.dispatchEvent(new CustomEvent('whatsapp:message', { detail: message }));
            break;
          }

          case 'agent:activity': {
            window.dispatchEvent(new CustomEvent('ws-agent-activity', { detail: data }));
            break;
          }

          case 'message:status':
          case 'message:receipt': {
            const { messageId, conversationId, status } = data;
            setMessages((prev) => {
              const current = prev[conversationId] || [];
              const updated = current.map((m) => (m.id === messageId ? { ...m, status } : m));
              return { ...prev, [conversationId]: updated };
            });

            // Dispatch status event for CRM/Analytics page to update status indicators
            window.dispatchEvent(new CustomEvent('whatsapp:message_status', { detail: { messageId, conversationId, status } }));
            break;
          }

          case 'device:status': {
            const { deviceId, status, phoneNumber } = data;
            setDevices((prev) =>
              prev.map((d) => (d.id === deviceId ? { ...d, status, phoneNumber: phoneNumber || d.phoneNumber } : d))
            );
            break;
          }

          case 'device:update': {
            const { device } = data;
            setDevices((prev) =>
              prev.map((d) => (d.id === device.id ? device : d))
            );
            break;
          }

          case 'campaign:status':
          case 'campaign:update': {
            const { campaign } = data;
            setCampaigns((prev) => {
              const exists = prev.some((c) => c.id === campaign.id);
              if (!exists) {
                return [...prev, campaign];
              }
              return prev.map((c) => (c.id === campaign.id ? campaign : c));
            });
            break;
          }

          case 'conversation:ai_paused_update': {
            const { conversationId, aiPaused } = data;
            setConversations((prev) =>
              prev.map((c) => (c.id === conversationId ? { ...c, aiPaused } : c))
            );
            break;
          }

          case 'conversation:label_update': {
            const { conversationId, label } = data;
            setConversations((prev) =>
              prev.map((c) => (c.id === conversationId ? { ...c, label } : c))
            );
            break;
          }

          case 'conversation:update': {
            const { conversation } = data;
            setConversations((prev) =>
              prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c))
            );
            break;
          }

          case 'flow:stage_alert': {
            const { contactName, contactPhone, stageName } = data;
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(lang === 'ar' ? `انتقال العميل: ${contactName}` : `Customer Transition: ${contactName}`, {
                body: lang === 'ar' 
                  ? `دخل العميل +${contactPhone} في مرحلة: "${stageName}"` 
                  : `Customer +${contactPhone} has transitioned into stage: "${stageName}"`,
                icon: '/favicon.ico'
              });
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse incoming WS text frame:', err);
      }
    };

    ws.onclose = () => {
      console.warn('WebSocket stream collapsed. Scheduling reconnect...');
      if ((ws as any).pingInterval) {
        clearInterval((ws as any).pingInterval);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    ws.onerror = () => {
      console.warn('WebSocket connection state interrupted. The system will auto-reconnect and use persistent HTTP polling fallback.');
    };
  };

  const closeWebSocket = () => {
    if (socketRef.current) {
      if ((socketRef.current as any).pingInterval) {
        clearInterval((socketRef.current as any).pingInterval);
      }
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setViewMode('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('whatsapp_user');
    setCurrentUser(null);
    setAuthMode('landing');
    setConversations([]);
    setActiveConversationId(null);
    setMessages({});
    setDevices([]);
    setCampaigns([]);
  };

  const handleAddNewContact = async (username: string, deviceId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetUsername: username, deviceId })
      });
      if (res.ok) {
        const data = await res.json();
        // Insert new conversation immediately to state
        setConversations((prev) => {
          if (prev.some((c) => c.id === data.conversation.id)) return prev;
          return [data.conversation, ...prev];
        });
        setActiveConversationId(data.conversation.id);
        setViewMode('chat');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to initialize conversation');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'audio' | 'document', mediaData?: string) => {
    if (!currentUser || !activeConversationId) return;

    playOutgoingSound();

    const tempMessageId = `msg_temp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempMessageId,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      recipientId: '',
      content: content,
      type: type,
      mediaUrl: mediaData,
      status: 'sent',
      timestamp: new Date().toISOString()
    };

    // Optimistic message append
    setMessages((prev) => {
      const list = prev[activeConversationId] || [];
      return { ...prev, [activeConversationId]: [...list, tempMsg] };
    });

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          content: content,
          type: type,
          mediaData: mediaData
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Replace temp optimistic message with real message
        setMessages((prev) => {
          const list = prev[activeConversationId] || [];
          return {
            ...prev,
            [activeConversationId]: list.map((m) => (m.id === tempMessageId ? data.message : m))
          };
        });
      } else {
        throw new Error('Failed to deliver message via gateway');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const list = prev[activeConversationId] || [];
        return {
          ...prev,
          [activeConversationId]: list.map((m) => (m.id === tempMessageId ? { ...m, status: 'sent' } : m))
        };
      });
    }
  };

  const handleSendTyping = (isTyping: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && activeConversationId) {
      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (activeConv) {
        socketRef.current.send(
          JSON.stringify({
            type: 'typing',
            recipientId: activeConv.recipient.id,
            isTyping
          })
        );
      }
    }
  };

  const handleMarkRead = async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}/read`, { method: 'POST' });
      // Clear client side counts
      setMessages((prev) => {
        const current = prev[convId] || [];
        const updated = current.map((m) => (m.senderId !== currentUser?.id ? { ...m, status: 'read' as const } : m));
        return { ...prev, [convId]: updated };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStatus = async (statusData: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...statusData })
      });
      if (res.ok) {
        const data = await res.json();
        setStatuses((prev) => [data.status, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewStatus = async (storyId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/statuses/${storyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setStatuses((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, viewers: [...s.viewers, currentUser.id] } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp Account Handlers
  const handleAddDevice = async (deviceData: any) => {
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify(deviceData)
      });
      if (res.ok) {
        const data = await res.json();
        setDevices((prev) => {
          if (prev.some((d) => d.id === data.device.id)) return prev;
          return [...prev, data.device];
        });
      }
    } catch (err) {
      console.error('Failed to link device:', err);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id || ''
        }
      });
      if (res.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      }
    } catch (err) {
      console.error('Failed to delete device:', err);
    }
  };

  const handlePairDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/pair`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser?.id || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? data.device : d))
        );
      }
    } catch (err) {
      console.error('Failed to manually pair device:', err);
    }
  };

  const handleUpdateDeviceAgent = async (
    deviceId: string,
    agentData: any
  ) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify(agentData)
      });
      if (res.ok) {
        const data = await res.json();
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? data.device : d))
        );
      }
    } catch (err) {
      console.error('Failed to update device AI agent settings:', err);
    }
  };

  // Campaigns Handlers
  const handleAddCampaign = async (campaignData: any) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify(campaignData)
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns((prev) => {
          if (prev.some((c) => c.id === data.campaign.id)) return prev;
          return [...prev, data.campaign];
        });
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id || ''
        }
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      }
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    }
  };

  const handleRunCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/run`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser?.id || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? data.campaign : c))
        );
      }
    } catch (err) {
      console.error('Failed to run campaign queue:', err);
    }
  };

  const handleUpdateCampaign = async (campaignId: string, campaignData: any) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify(campaignData)
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? data.campaign : c))
        );
      }
    } catch (err) {
      console.error('Failed to update campaign:', err);
    }
  };

  const handleUpdateConversationLabel = async (convId: string, label?: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, label } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update conversation label:', err);
    }
  };

  const handleToggleAiPaused = async (convId: string, aiPaused: boolean) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/toggle-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiPaused })
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, aiPaused } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle AI status:', err);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id || ''
        }
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        setMessages(prev => {
          const updated = { ...prev };
          delete updated[convId];
          return updated;
        });
        setActiveConversationId(null);
      } else {
        alert(lang === 'ar' ? 'فشل حذف المحادثة' : 'Failed to delete conversation');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting conversation');
    }
  };

  const handleUpdateVoiceSettings = (convId: string, enabled: boolean, accent: string, voiceName: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              voiceSettings: {
                enabled,
                accent,
                voiceName
              }
            }
          : c
      )
    );
  };

  // Folder Action Handlers
  const handleCreateFolder = async (name: string, color?: string) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser?.id || '' },
        body: JSON.stringify({ name, color })
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(prev => [...prev, data.folder]);
      }
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || '' }
      });
      if (res.ok) {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        setConversations(prev => prev.map(c => c.folderId === folderId ? { ...c, folderId: undefined } : c));
        if (selectedFolderId === folderId) setSelectedFolderId(null);
      }
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  const handleMoveToFolder = async (convId: string, folderId: string | undefined) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderId || null })
      });
      if (res.ok) {
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, folderId } : c));
      }
    } catch (err) {
      console.error('Failed to move conversation to folder:', err);
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('whatsapp_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  // Calculate unread tallies per conversation
  const unreadCounts: Record<string, number> = {};
  const latestMessages: Record<string, { content: string; timestamp: string; senderId: string; status: string }> = {};

  Object.entries(messages as Record<string, Message[]>).forEach(([convId, msgList]) => {
    if (currentUser) {
      const unread = msgList.filter((m) => m.senderId !== currentUser.id && m.status !== 'read').length;
      unreadCounts[convId] = unread;
    }

    if (msgList.length > 0) {
      const sorted = [...msgList].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const last = sorted[sorted.length - 1];
      latestMessages[convId] = {
        content: last.type === 'image' ? '📷 Photo' : last.type === 'audio' ? '🎤 Voice Message' : last.content,
        timestamp: last.timestamp,
        senderId: last.senderId,
        status: last.status
      };
    }
  });

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  // If user is not logged in, render the beautiful public portal sequence
  if (!currentUser) {
    if (authMode === 'landing') {
      return <LandingPage onGetStarted={(mode) => setAuthMode(mode)} lang={lang} onChangeLang={setLang} />;
    }
    if (authMode === 'demo') {
      return <DemoRegistration 
        onBackToLanding={() => setAuthMode('landing')} 
        onLoginRequested={() => setAuthMode('login')} 
      />;
    }
    return (
      <AuthView
        initialMode={authMode as 'login' | 'register'}
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setAuthMode('landing')}
      />
    );
  }

  // If user is pending admin approval
  if (currentUser.isActive === false && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-4 text-zinc-800 dark:text-white">في انتظار موافقة الإدارة</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            مرحباً بك {currentUser.username}! حسابك قيد المراجعة حالياً من قبل الإدارة للتحقق من بيانات الدفع. سيتم تفعيل حسابك في أقرب وقت.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('chatcore_user_id');
              setCurrentUser(null);
              setAuthMode('landing');
            }} 
            className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-3 rounded-2xl font-bold transition-all"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-sans">
      
      {/* MOBILE & TABLET TOP HEADER BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 text-zinc-300 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#00a884] to-emerald-400 rounded-xl flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white tracking-wide">ChatCore HQ</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-amber-400 font-bold cursor-pointer"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          <img
            src={currentUser.avatarUrl}
            alt="Avatar"
            onClick={() => setShowProfileSettings(true)}
            className="w-8 h-8 rounded-full border border-zinc-700 cursor-pointer"
          />
        </div>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER BACKDROP & MENU */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          
          <div className="relative w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 flex flex-col h-full z-10 py-5 px-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-tr from-[#00a884] to-emerald-400 rounded-xl flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">ChatCore HQ</h3>
                  <p className="text-[10px] text-zinc-400">{t.mobileMenuTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Drawer Grouped Nav */}
            <div className="flex flex-col gap-6 flex-1">
              {/* Group 1: Management */}
              <div>
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 px-2">
                  {t.sidebarCategoryManagement}
                </h4>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { setViewMode('dashboard'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'dashboard' ? 'bg-[#00a884]/20 text-[#00a884] font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t.dashboardTab}</span>
                  </button>

                  <button
                    onClick={() => { setViewMode('chat'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'chat' ? 'bg-[#00a884]/20 text-[#00a884] font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t.chatTab}</span>
                  </button>

                  <button
                    onClick={() => { setViewMode('clients'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'clients' ? 'bg-[#00a884]/20 text-[#00a884] font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Users className="w-4 h-4" />
                    <span>{t.humanEmployees}</span>
                  </button>
                </div>
              </div>

              {/* Group 2: AI & Swarm */}
              <div>
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2 px-2">
                  {t.sidebarCategoryAgents}
                </h4>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { setViewMode('agents_dashboard'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'agents_dashboard' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>{t.aiEmployees}</span>
                  </button>

                  <button
                    onClick={() => { setViewMode('knowledge_base'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'knowledge_base' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span>مركز التدريب المخصص</span>
                  </button>

                  <button
                    onClick={() => { setViewMode('customer_flow'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'customer_flow' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Workflow className="w-4 h-4 text-amber-400" />
                    <span>رحلة العميل المخصصة</span>
                  </button>

                  <button
                    onClick={() => { setActiveAgentsTab('playground'); setViewMode('agents_dashboard'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'agents_dashboard' && activeAgentsTab === 'playground' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>التطبيق العملي (Playground)</span>
                  </button>
                </div>
              </div>

              {/* Group 3: Channels & Marketing */}
              <div>
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 px-2">
                  {t.sidebarCategoryChannels}
                </h4>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { setViewMode('whatsapp_settings'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'whatsapp_settings' ? 'bg-[#00a884]/20 text-[#00a884] font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{t.connectTab}</span>
                  </button>

                  <button
                    onClick={() => { setViewMode('marketing'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'marketing' ? 'bg-[#00a884]/20 text-[#00a884] font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>{t.campaignsTab}</span>
                  </button>

                  <button
                    onClick={() => { setViewMode('group_manager'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'group_manager' ? 'bg-[#00a884]/20 text-[#00a884] font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <Group className="w-4 h-4" />
                    <span>سحب أعضاء الجروبات</span>
                  </button>

                  <button
                    onClick={() => { setActiveAgentsTab('payments'); setViewMode('agents_dashboard'); setIsMobileDrawerOpen(false); }}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer " + (viewMode === 'agents_dashboard' && activeAgentsTab === 'payments' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-900')}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>طرق المحافظ و InstaPay</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logout Footer */}
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs text-rose-400 bg-rose-500/10 font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM QUICK NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around z-40 px-2 select-none">
        <button
          onClick={() => setViewMode('chat')}
          className={"flex flex-col items-center gap-1 p-1 cursor-pointer " + (viewMode === 'chat' ? 'text-[#00a884]' : 'text-zinc-400')}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-bold">{t.chatTab}</span>
        </button>

        <button
          onClick={() => setViewMode('agents_dashboard')}
          className={"flex flex-col items-center gap-1 p-1 cursor-pointer " + (viewMode === 'agents_dashboard' ? 'text-indigo-400' : 'text-zinc-400')}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[9px] font-bold">{t.aiEmployees}</span>
        </button>

        <button
          onClick={() => setViewMode('whatsapp_settings')}
          className={"flex flex-col items-center gap-1 p-1 cursor-pointer " + (viewMode === 'whatsapp_settings' ? 'text-[#00a884]' : 'text-zinc-400')}
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-[9px] font-bold">{t.connectTab}</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-1 p-1 text-zinc-400 hover:text-white cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold">القائمة</span>
        </button>
      </div>

      {/* 1. DESKTOP CATEGORIZED GROUPED SIDEBAR */}
      <div className="hidden md:flex w-[230px] bg-zinc-950 border-r border-zinc-900/60 flex-col items-center justify-between py-5 px-3 flex-shrink-0 z-30 select-none overflow-y-auto">
        <div className="flex flex-col gap-5 w-full">
          {/* Main Brand Logo Badge */}
          <div className="flex items-center gap-3 px-2 pb-3 border-b border-zinc-900/80">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#00a884] to-emerald-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/10 flex-shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-extrabold text-sm text-white tracking-wide truncate">ChatCore HQ</h2>
              <p className="text-[10px] text-zinc-400 truncate">Enterprise AI Swarm</p>
            </div>
          </div>

          {/* Categorized Nav Groups */}
          <div className="flex flex-col gap-5 w-full">
            
            {/* GROUP 1: Management & CRM */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between px-2.5 py-1">
                <span className="text-[10px] font-extrabold text-emerald-400/90 uppercase tracking-wider">
                  {t.sidebarCategoryManagement}
                </span>
              </div>

              <button
                onClick={() => setViewMode('dashboard')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'dashboard' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.dashboardTab}</span>
              </button>

              <button
                onClick={() => setViewMode('chat')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'chat' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.chatTab}</span>
              </button>

              <button
                onClick={() => setViewMode('clients')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'clients' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.humanEmployees}</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setViewMode('admin')}
                  className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'admin' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{t.adminTab}</span>
                </button>
              )}
            </div>

            {/* GROUP 2: AI Employees & Swarm */}
            <div className="flex flex-col gap-1 w-full pt-2 border-t border-zinc-900/60">
              <div className="flex items-center justify-between px-2.5 py-1">
                <span className="text-[10px] font-extrabold text-indigo-400/90 uppercase tracking-wider">
                  {t.sidebarCategoryAgents}
                </span>
              </div>

              <button
                onClick={() => setViewMode('agents_dashboard')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'agents_dashboard' && activeAgentsTab !== 'playground' && activeAgentsTab !== 'payments' ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Bot className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="truncate">{t.aiEmployees}</span>
              </button>

              <button
                onClick={() => setViewMode('knowledge_base')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'knowledge_base' ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Brain className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="truncate">مركز التدريب المخصص</span>
              </button>

              <button
                onClick={() => setViewMode('customer_flow')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'customer_flow' ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Workflow className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">رحلة العميل المخصصة</span>
              </button>

              <button
                onClick={() => {
                  setActiveAgentsTab('playground');
                  setViewMode('agents_dashboard');
                }}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'agents_dashboard' && activeAgentsTab === 'playground' ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">التطبيق العملي</span>
              </button>
            </div>

            {/* GROUP 3: Channels & Marketing */}
            <div className="flex flex-col gap-1 w-full pt-2 border-t border-zinc-900/60">
              <div className="flex items-center justify-between px-2.5 py-1">
                <span className="text-[10px] font-extrabold text-amber-400/90 uppercase tracking-wider">
                  {t.sidebarCategoryChannels}
                </span>
              </div>

              <button
                onClick={() => setViewMode('whatsapp_settings')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'whatsapp_settings' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Smartphone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.connectTab}</span>
              </button>

              <button
                onClick={() => setViewMode('marketing')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'marketing' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Megaphone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.campaignsTab}</span>
              </button>

              <button
                onClick={() => setViewMode('group_manager')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'group_manager' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Group className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">سحب أعضاء الجروبات</span>
              </button>

              <button
                onClick={() => {
                  setActiveAgentsTab('payments');
                  setViewMode('agents_dashboard');
                }}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'agents_dashboard' && activeAgentsTab === 'payments' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <CreditCard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">طرق المحافظ و InstaPay</span>
              </button>

              <button
                onClick={() => setViewMode('feedback')}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer " + (viewMode === 'feedback' ? 'bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/30' : 'text-zinc-400 hover:text-white hover:bg-white/5')}
              >
                <Star className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">التحليلات الذكية</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Account Controls */}
        <div className="flex items-center justify-between w-full pt-4 border-t border-zinc-900/60 px-1">
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatarUrl}
              alt="Avatar"
              onClick={() => setShowProfileSettings(true)}
              className="w-8 h-8 rounded-full border border-zinc-800 cursor-pointer hover:ring-2 hover:ring-[#00a884]"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate max-w-[100px]">{currentUser.username}</span>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold">{currentUser.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="p-1.5 text-amber-400 hover:bg-white/5 rounded-lg text-[10px] font-bold cursor-pointer"
              title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Settings Overlay Panel */}
      {showProfileSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileSettings(false)}>
          <div
            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-[#00a884] to-emerald-600 text-white px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-lg">{lang === 'ar' ? '⚙️ إعدادات الحساب' : '⚙️ Account Settings'}</h2>
                <button onClick={() => setShowProfileSettings(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer text-xl font-bold">✕</button>
              </div>
              <p className="text-emerald-100 text-xs mt-1">{lang === 'ar' ? 'إدارة بياناتك الشخصية وخطتك' : 'Manage your personal details and plan'}</p>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Avatar Upload Header */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <img src={profileAvatarUrl || currentUser.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/40 shadow-xl group-hover:opacity-80 transition-opacity" />
                  <label htmlFor="profile-avatar-file" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold gap-1">
                    <Camera className="w-5 h-5" />
                    <span>{lang === 'ar' ? 'تغيير' : 'Edit'}</span>
                  </label>
                  <input
                    type="file"
                    id="profile-avatar-file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (reader.result) setProfileAvatarUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label htmlFor="profile-avatar-file" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-emerald-500/30 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'رفع صورة جديدة من الجهاز' : 'Upload Image File'}</span>
                  </label>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">{lang === 'ar' ? 'الاسم' : 'Display Name'}</label>
                <input
                  type="text"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-zinc-800 dark:text-zinc-200"
                  placeholder="email@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">{lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder={lang === 'ar' ? 'اتركه فارغاً إن لم تريد التغيير' : 'Leave blank to keep current'}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              {/* Prominent Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateProfile({
                      username: profileUsername,
                      email: profileEmail,
                      avatarUrl: profileAvatarUrl,
                      ...(profilePassword.trim() ? { password: profilePassword.trim() } : {})
                    });
                    setProfileSavedToast(true);
                    setTimeout(() => {
                      setProfileSavedToast(false);
                      setShowProfileSettings(false);
                    }, 1200);
                  }}
                  className="w-full bg-gradient-to-r from-[#00a884] to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {profileSavedToast ? (
                    <>
                      <Check className="w-5 h-5 text-white animate-bounce" />
                      <span>{lang === 'ar' ? 'تم حفظ التعديلات بنجاح! ✨' : 'Changes Saved Successfully! ✨'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Subscription Info */}
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                <h4 className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">{lang === 'ar' ? '📊 خطة الاشتراك' : '📊 Subscription Plan'}</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{lang === 'ar' ? 'الخطة' : 'Plan'}</p>
                    <p className="text-sm font-black text-emerald-500 mt-0.5">{currentUser.subscriptionPlan?.toUpperCase() || 'STARTER'}</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{lang === 'ar' ? 'الحالة' : 'Status'}</p>
                    <p className={`text-sm font-black mt-0.5 ${currentUser.subscriptionStatus === 'active' ? 'text-emerald-500' : currentUser.subscriptionStatus === 'trial' ? 'text-amber-500' : 'text-zinc-400'}`}>
                      {currentUser.subscriptionStatus === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : currentUser.subscriptionStatus === 'trial' ? (lang === 'ar' ? 'تجريبي' : 'Trial') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{lang === 'ar' ? 'رسائل AI' : 'AI Messages'}</p>
                    <p className="text-sm font-black text-indigo-500 mt-0.5">{currentUser.aiMessagesUsed} / {currentUser.aiMessagesLimit}</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{lang === 'ar' ? 'التكلفة' : 'Cost'}</p>
                    <p className="text-sm font-black text-fuchsia-500 mt-0.5">${currentUser.costInDollars?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC WORKSPACE ROUTER RENDERING BLOCKS */}
      <div className="flex-1 flex h-full overflow-hidden">
        
        {/* VIEW 1: CRM INBOX CHAT (RENDERS SIDEBAR + CHAT AREA) */}
        {viewMode === 'chat' && (
          <>
            {/* Sidebar Inbox Feed with Horizontal Account Selectors */}
            <Sidebar
              currentUser={currentUser}
              conversations={conversations}
              activeConversationId={activeConversationId}
              unreadCounts={unreadCounts}
              latestMessages={latestMessages}
              statuses={statuses}
              onSelectConversation={(convId) => {
                setActiveConversationId(convId);
                handleMarkRead(convId);
              }}
              onAddNewContact={handleAddNewContact}
              devices={devices}
              lang={lang}
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
            />

            {/* Right Chat Column */}
            <div className={`flex-1 ${activeConversationId ? 'flex' : 'hidden md:flex'} flex-col h-full relative overflow-hidden`}>
              {/* Status updates feed layer - only show on chat welcome screen */}
              {!activeConversationId && (
                <StatusFeed
                  currentUser={currentUser}
                  statuses={statuses}
                  onAddStatus={handleAddStatus}
                  onViewStatus={handleViewStatus}
                />
              )}

              {activeConv ? (
                <ChatArea
                  currentUser={currentUser}
                  activeContact={activeConv.recipient}
                  activeConversation={activeConv}
                  messages={messages[activeConversationId || ''] || []}
                  isTyping={typingStates[activeConv.recipient.id] || false}
                  onSendMessage={handleSendMessage}
                  onSendTyping={handleSendTyping}
                  onMarkRead={() => handleMarkRead(activeConversationId!)}
                  onUpdateLabel={handleUpdateConversationLabel}
                  onToggleAi={handleToggleAiPaused}
                  onUpdateVoiceSettings={handleUpdateVoiceSettings}
                  onDeleteConversation={handleDeleteConversation}
                  onBackToList={() => setActiveConversationId(null)}
                  lang={lang}
                  folders={folders}
                  onMoveToFolder={handleMoveToFolder}
                />
              ) : (
                /* High-quality introduction screen mimicking WhatsApp Web */
                <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-8 text-center relative">
                  <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.03] dark:opacity-[0.015] pointer-events-none" />
                  <div className="max-w-md space-y-6 z-10 flex flex-col items-center">
                    <svg
                      className="w-24 h-24 text-zinc-300 dark:text-zinc-800 animate-pulse"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.627 0-12 5.373-12 12 0 2.22.602 4.298 1.644 6.09l-1.644 6.01 6.136-1.611c1.737.962 3.731 1.511 5.864 1.511 6.627 0 12-5.373 12-12s-5.373-12-12-12zm0 21.818c-1.879 0-3.642-.494-5.176-1.353l-.371-.213-3.619.951.968-3.542-.234-.373c-.931-1.488-1.425-3.21-1.424-4.992.003-5.049 4.108-9.152 9.162-9.152 2.449.001 4.75 1.055 6.48 2.784 1.728 1.729 2.68 4.027 2.678 6.479-.004 5.05-4.11 9.153-9.164 9.153zm4.981-6.814c-.273-.137-1.617-.798-1.868-.889-.25-.092-.432-.137-.614.137-.182.273-.706.889-.865 1.071-.159.182-.319.205-.592.069-.273-.137-1.15-.424-2.19-1.353-.809-.722-1.356-1.614-1.515-1.887-.159-.273-.017-.42.12-.556.123-.122.273-.319.41-.479.137-.159.182-.273.273-.456.091-.182.046-.341-.023-.479-.069-.137-.614-1.481-.842-2.028-.222-.533-.445-.461-.614-.469-.159-.008-.341-.01-.523-.01s-.479.069-.729.341c-.25.273-.956.934-.956 2.279s.979 2.643 1.116 2.825c.137.182 1.927 2.943 4.669 4.125.653.282 1.162.451 1.558.577.656.208 1.253.179 1.724.109.525-.078 1.617-.661 1.845-1.3s.228-1.185.159-1.3c-.068-.112-.25-.181-.523-.318z" />
                    </svg>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-zinc-700 dark:text-zinc-200">{t.welcomeTitle}</h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed max-w-sm mx-auto">
                        {t.welcomeSub}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 w-full max-w-xs mx-auto">
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-center gap-1.5 uppercase font-mono">
                        ● {t.endpointActive}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: PREMIUM ANALYTICS & WEBHOOKS SYSTEM */}
        {viewMode === 'dashboard' && (
          <DashboardStats
            currentUser={currentUser}
            devices={devices}
            campaigns={campaigns}
            conversations={conversations}
            messages={messages}
            onRefreshData={fetchBusinessData}
            lang={lang}
          />
        )}

        {/* VIEW 2.1: ADMIN PANEL */}
        {viewMode === 'admin' && (
          <AdminPage
            currentUser={currentUser}
            lang={lang}
          />
        )}

        {/* VIEW 2.2: CLIENTS PANEL */}
        {viewMode === 'clients' && (
          <ClientsPage
            currentUser={currentUser}
            lang={lang}
          />
        )}

        {/* VIEW 3: WHATSAPP SETUP AND CONFIGURATIONS (INTEGRATIONS + AI CUSTOM INSTRUCTIONS) */}
        {viewMode === 'whatsapp_settings' && (
          <WhatsAppSettings
            currentUser={currentUser}
            devices={devices}
            onAddDevice={handleAddDevice}
            onDeleteDevice={handleDeleteDevice}
            onPairDevice={handlePairDevice}
            onUpdateDeviceAgent={handleUpdateDeviceAgent}
            lang={lang}
          />
        )}

        {/* VIEW 4: BROADCAST CAMPAIGNS MARKETING AND TEMPLATES */}
        {viewMode === 'marketing' && (
          <MarketingCampaigns
            currentUser={currentUser}
            campaigns={campaigns}
            devices={devices}
            conversations={conversations}
            onAddCampaign={handleAddCampaign}
            onUpdateCampaign={handleUpdateCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onRunCampaign={handleRunCampaign}
            lang={lang}
          />
        )}

        {/* VIEW 5: GROUP MANAGER */}
        {viewMode === 'group_manager' && (
          <GroupManager
            currentUser={currentUser}
            devices={devices}
            lang={lang}
          />
        )}

        {/* VIEW 6: CUSTOMER FEEDBACK & SMART AI ANALYTICS */}
        {viewMode === 'feedback' && (
          <CustomerFeedback
            currentUser={currentUser}
            devices={devices}
            lang={lang}
          />
        )}

        {/* VIEW 7: CUSTOM AI KNOWLEDGE BASE / TRAINING CENTER */}
        {viewMode === 'knowledge_base' && (
          <AiKnowledgeBase
            currentUser={currentUser}
            devices={devices}
            onUpdateDeviceAgent={handleUpdateDeviceAgent}
            onRefreshDevices={fetchBusinessData}
            lang={lang}
          />
        )}

        {/* VIEW 8: EXPOCORE WHATSAPP SMART AGENT */}
        {viewMode === 'expocore_agent' && currentUser?.role === 'admin' && (
          <ExpoCoreAgent
            currentUser={currentUser}
            lang={lang}
          />
        )}

        {/* VIEW 9: CUSTOM CUSTOMER JOURNEY PIPELINE BUILDER */}
        {viewMode === 'customer_flow' && (
          <CustomerFlowBuilder
            currentUser={currentUser}
            devices={devices}
            lang={lang}
            onUpdateDeviceAgent={handleUpdateDeviceAgent}
          />
        )}


        {/* VIEW 10: AI AGENTS DASHBOARD */}
        {viewMode === 'agents_dashboard' && (
          <AgentsDashboard lang={lang} initialTab={activeAgentsTab} />
        )}
      </div>

      {/* Expanded Image Viewer Portal */}
      <MediaLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
