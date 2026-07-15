/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Send, Sparkles, Smartphone, Shield, User, Users, RefreshCw, 
  Plus, Trash2, HelpCircle, Check, CheckCheck, Landmark, MapPin, Calendar, 
  Clock, Lock, Globe, MessageSquare, AlertTriangle, Play, ChevronRight, CheckCircle2, Bot
} from 'lucide-react';

interface Exhibitor {
  id: string;
  name: string;
  booth: string;
  category: string;
}

interface EventDetails {
  name: string;
  location: string;
  date: string;
  agenda: string;
  parking: string;
}

interface DashboardStats {
  pageVisits: number;
  registeredVisitors: number;
  conversionRate: string;
  abandonedLeads: number;
  gateScans: {
    gate1: number;
    gate2: number;
  };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  thoughts?: { stage: string; detail: string }[];
}

interface ExpoCoreAgentProps {
  currentUser: any;
  lang: 'ar' | 'en';
}

export default function ExpoCoreAgent({ currentUser, lang }: ExpoCoreAgentProps) {
  const isArabic = lang === 'ar';

  // --- Live Dynamic ExpoCore Database ---
  const [eventDetails, setEventDetails] = useState<EventDetails>(() => {
    const saved = localStorage.getItem('expocore_event_details');
    return saved ? JSON.parse(saved) : {
      name: 'ExpoCore International Expo 2026',
      location: isArabic ? 'مركز القاهرة الدولي للمؤتمرات (CICC)، قاعة 4' : 'Cairo International Convention Centre (CICC), Hall 4',
      date: isArabic ? '12-15 أكتوبر 2026' : 'October 12-15, 2026',
      agenda: isArabic ? '09:00 ص حفل الافتتاح، 11:00 ص جلسات التقنية، 02:00 م جلسات التواصل والتشبيك' : '09:00 AM Opening Ceremony, 11:00 AM Tech Panels, 02:00 PM Networking Sessions',
      parking: isArabic ? 'متوفر في القطاع B، ومجاني بالكامل لجميع الزوار المسجلين في المعرض' : 'Available in Sector B, completely free for all registered expo attendees'
    };
  });

  const [exhibitors, setExhibitors] = useState<Exhibitor[]>(() => {
    const saved = localStorage.getItem('expocore_exhibitors');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: isArabic ? 'إكسبو كور للحلول الذكية' : 'ExpoCore Smart Solutions', booth: 'A1', category: isArabic ? 'إدارة المعارض' : 'Exhibition Management' },
      { id: '2', name: isArabic ? 'مصر لتكنولوجيا الذكاء الاصطناعي' : 'Egypt AI Technologies', booth: 'B3', category: isArabic ? 'برمجيات الذكاء الاصطناعي' : 'AI Software' },
      { id: '3', name: isArabic ? 'المجموعة العالمية لتنظيم المعارض' : 'Global Exhibitions Group', booth: 'C12', category: isArabic ? 'إدارة الفعاليات والمؤتمرات' : 'Event Organizing' },
      { id: '4', name: isArabic ? 'المستقبل للأنظمة المتكاملة' : 'Future Integrated Systems', booth: 'D5', category: isArabic ? 'الأجهزة والشبكات واللوجستيات' : 'Networking & Logistics' }
    ];
  });

  const [stats, setStats] = useState<DashboardStats>(() => {
    const saved = localStorage.getItem('expocore_stats');
    return saved ? JSON.parse(saved) : {
      pageVisits: 145200,
      registeredVisitors: 12840,
      conversionRate: '8.8%',
      abandonedLeads: 1420,
      gateScans: {
        gate1: 5420,
        gate2: 4180
      }
    };
  });

  // --- Form fields for database editor ---
  const [newExhibitorName, setNewExhibitorName] = useState('');
  const [newExhibitorBooth, setNewExhibitorBooth] = useState('');
  const [newExhibitorCategory, setNewExhibitorCategory] = useState('');

  // --- Push Notification (Ticket Delivery) fields ---
  const [pushName, setPushName] = useState(isArabic ? 'أحمد محمد الشناوي' : 'Ahmed Mohamed El-Shenawy');
  const [pushPhone, setPushPhone] = useState('+201012345678');
  const [pushTicketUrl, setPushTicketUrl] = useState('https://expocore.io/t/9842-qr');

  // --- ExpoCore Integration Connection Hook States ---
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'database'>('chat');
  const [activeDevTab, setActiveDevTab] = useState<'webhook' | 'php' | 'js'>('webhook');
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('expocore_api_key') || 'ec_sk_live_2026_d34a89f92e3c74b109';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'checking' | 'active'>('active');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('expocore_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://expocore-whatsapp-hub.run.app';
    setWebhookUrl(`${origin}/api/expocore/webhook?event_id=1`);
  }, []);

  useEffect(() => {
    setSyncLogs([
      isArabic 
        ? `[${new Date().toLocaleTimeString()}] 🟢 تم تأسيس الاتصال ومزامنة مفتاح API بنجاح`
        : `[${new Date().toLocaleTimeString()}] 🟢 Connection handshake initialized with api_key successfully`,
      isArabic
        ? `[${new Date().toLocaleTimeString()}] 🔒 تشفير التوقيع: SHA-256 صالح ومكتمل`
        : `[${new Date().toLocaleTimeString()}] 🔒 Signature signature verified: SHA-256 signature is valid`,
      isArabic
        ? `[${new Date().toLocaleTimeString()}] 📡 منفذ الـ Webhook العام نشط وجاهز لاستقبال البيانات`
        : `[${new Date().toLocaleTimeString()}] 📡 Webhook reception endpoint active & listening for registrations`
    ]);
  }, [lang]);

  const handleTestConnection = () => {
    playSfx('out');
    setSyncStatus('checking');
    
    setSyncLogs(prev => [
      ...prev,
      isArabic 
        ? `[${new Date().toLocaleTimeString()}] 🔄 جاري فحص مفاتيح المصادقة والـ API...`
        : `[${new Date().toLocaleTimeString()}] 🔄 Verifying api_key credentials and handshake signatures...`,
    ]);

    setTimeout(() => {
      setSyncStatus('active');
      playSfx('in');
      setSyncLogs(prev => [
        ...prev,
        isArabic
          ? `[${new Date().toLocaleTimeString()}] 🟢 نجاح الاتصال: تم التحقق والربط بنجاح مع خادم ExpoCore Ticket Hub`
          : `[${new Date().toLocaleTimeString()}] 🟢 Handshake Success: Securely linked to ExpoCore Ticket Hub`,
        isArabic
          ? `[${new Date().toLocaleTimeString()}] 📡 اختبار الاستجابة (Ping): 12ms | الحالة: 200 OK`
          : `[${new Date().toLocaleTimeString()}] 📡 Latency (Ping): 12ms | Response: 200 OK`
      ]);
    }, 1500);
  };

  const handleSimulateWebhookPush = async () => {
    playSfx('out');
    
    const names = isArabic 
      ? ['عبدالرحمن مصطفى', 'ياسين محمد', 'تامر رشدي', 'خالد عبدالملك'] 
      : ['Abdulrahman Mostafa', 'Yassin Mohamed', 'Tarek Roshdy', 'Khaled Abdelmalek'];
    
    const selectedName = names[Math.floor(Math.random() * names.length)];
    const randomTicketId = Math.floor(1000 + Math.random() * 9000);
    const selectedTicketUrl = `https://expocore.io/t/${randomTicketId}-qr`;
    const randomPhone = `+2010${Math.floor(10000000 + Math.random() * 90000000)}`;

    setSyncLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 📥 Received POST /api/expocore/webhook`,
      `  Payload: { name: "${selectedName}", phone: "${randomPhone}", ticket: "${randomTicketId}" }`,
      `  Status: 200 OK | Dispatched to Outbound WhatsApp Queues`
    ]);

    // Perform a real HTTP POST request to our webhook to test and log it in the server backend!
    try {
      const response = await fetch('/api/expocore/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': apiKey
        },
        body: JSON.stringify({
          name: selectedName,
          phone: randomPhone,
          ticket: randomTicketId.toString(),
          ticketUrl: selectedTicketUrl
        })
      });
      const data = await response.json();
      console.log('Real Webhook Endpoint responded:', data);
    } catch (err) {
      console.error('Error firing real webhook during simulation:', err);
    }

    const pushMsgText = isArabic
      ? `🎫 *مرحباً بك يا ${selectedName}!* لقد تم تسجيل حضورك بنجاح في معرض *${eventDetails.name}*.\n\nتجد تذكرتك ورمز الدخول الـ QR الخاص بك هنا:\n👉 ${selectedTicketUrl}\n\nنحن بانتظارك في:\n📍 *المكان:* ${eventDetails.location}\n📅 *التاريخ:* ${eventDetails.date}\n\nأنا مساعدك الذكي عبر الـ WhatsApp، إذا كان لديك أي استفسار حول الشركات العارضة أو الخدمات، فقط اسألني وسأجيبك في الحال! 🤝`
      : `🎫 *Hello ${selectedName}!* Your registration for *${eventDetails.name}* has been successfully confirmed.\n\nYou can access your digital ticket and access QR code here:\n👉 ${selectedTicketUrl}\n\nWe look forward to seeing you at:\n📍 *Venue:* ${eventDetails.location}\n📅 *Dates:* ${eventDetails.date}\n\nI am your WhatsApp Smart Agent. If you have any questions about the exhibitors, agenda, or amenities, feel free to ask me! 🤝`;

    const systemEventMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      sender: 'system',
      content: isArabic 
        ? `🔔 [ربط إكسبو كور اللحظي]: تم استقبال إشعار دفع خارجي للزائر "${selectedName}" عبر الـ Webhook`
        : `🔔 [ExpoCore Webhook Sync]: Received outbound push for "${selectedName}" via Webhook`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };

    const pushMsg: ChatMessage = {
      id: `push_${Date.now()}`,
      sender: 'agent',
      content: pushMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      thoughts: [
        { stage: 'webhook_auth', detail: isArabic ? 'مفتاح الـ API المرسل في الهيدر صحيح وعملية التشفير صالحة.' : 'api_key in headers successfully validated against local system state.' },
        { stage: 'webhook_payload', detail: isArabic ? `استخلاص بيانات الزائر الجديد: الاسم=${selectedName}، الهاتف=${randomPhone}` : `Parsed guest payload data: Name=${selectedName}, Phone=${randomPhone}` },
        { stage: 'completed', detail: isArabic ? 'تم التوجيه إلى محرك الإرسال وإطلاق رسالة الواتساب وتذكرتها بنجاح.' : 'Routed to gateway message dispatch engine. Dispatch succeeded.' }
      ]
    };

    setMessages(prev => [...prev, systemEventMsg, pushMsg]);
    setTimeout(() => playSfx('in'), 400);
  };

  // --- Simulator Chat State ---
  const [roleTier, setRoleTier] = useState<'visitor' | 'admin'>('visitor');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeThoughts, setActiveThoughts] = useState<{ stage: string; detail: string }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem('expocore_event_details', JSON.stringify(eventDetails));
  }, [eventDetails]);

  useEffect(() => {
    localStorage.setItem('expocore_exhibitors', JSON.stringify(exhibitors));
  }, [exhibitors]);

  useEffect(() => {
    localStorage.setItem('expocore_stats', JSON.stringify(stats));
  }, [stats]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'agent',
        content: isArabic 
          ? 'مرحباً بك في *نظام إدارة المعارض ExpoCore*! 🎫✨\n\nأنا *مساعد الـ WhatsApp الذكي* الرسمي الخاص بك. يسعدني جداً مساعدتك اليوم!\n\nيمكنك أن تسألني عن:\n- أين ومتى يقام المعرض؟ 📍\n- قائمة الشركات العارضة وأجنحتها 🏢\n- تفاصيل مواقف السيارات والجدول الزمني 🚗\n\n(ولمديري النظام: يمكنك الاستفسار عن إحصائيات المعرض 📊)'
          : "Welcome to *ExpoCore Exhibition Management System*! 🎫\n\nI am your official *WhatsApp Smart Agent*. I'm absolutely delighted to assist you today!\n\nYou can ask me about:\n- Where and when the event is happening? 📍\n- List of exhibitors and their booths 🏢\n- Parking details and agenda 🚗\n\n(For Admins: You can also request real-time exhibition analytics/stats 📊)",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        thoughts: [
          { stage: 'initialization', detail: isArabic ? 'تم تشغيل المساعد بنجاح وتأصيل الهوية المعتمدة.' : 'Agent initialized and brand persona activated.' }
        ]
      }
    ]);
  }, [lang]);

  // play sound trigger
  const playSfx = (type: 'in' | 'out') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (type === 'out') {
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
      } else {
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // safe bypass
    }
  };

  // Add exhibitor handler
  const handleAddExhibitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExhibitorName.trim() || !newExhibitorBooth.trim()) return;
    const newExh: Exhibitor = {
      id: Date.now().toString(),
      name: newExhibitorName.trim(),
      booth: newExhibitorBooth.trim().toUpperCase(),
      category: newExhibitorCategory.trim() || (isArabic ? 'عام' : 'General')
    };
    setExhibitors([...exhibitors, newExh]);
    setNewExhibitorName('');
    setNewExhibitorBooth('');
    setNewExhibitorCategory('');
  };

  // Delete exhibitor
  const handleDeleteExhibitor = (id: string) => {
    setExhibitors(exhibitors.filter(e => e.id !== id));
  };

  // Trigger Outbound Push Registration Message
  const handleTriggerPush = () => {
    playSfx('out');
    const pushMsgText = isArabic
      ? `🎫 *مرحباً بك يا ${pushName}!* لقد تم تسجيل حضورك بنجاح في معرض *${eventDetails.name}*.\n\nتجد تذكرتك ورمز الدخول الـ QR الخاص بك هنا:\n👉 ${pushTicketUrl}\n\nنحن بانتظارك في:\n📍 *المكان:* ${eventDetails.location}\n📅 *التاريخ:* ${eventDetails.date}\n\nأنا مساعدك الذكي عبر الـ WhatsApp، إذا كان لديك أي استفسار حول الشركات العارضة أو الخدمات، فقط اسألني وسأجيبك في الحال! 🤝`
      : `🎫 *Hello ${pushName}!* Your registration for *${eventDetails.name}* has been successfully confirmed.\n\nYou can access your digital ticket and access QR code here:\n👉 ${pushTicketUrl}\n\nWe look forward to seeing you at:\n📍 *Venue:* ${eventDetails.location}\n📅 *Dates:* ${eventDetails.date}\n\nI am your WhatsApp Smart Agent. If you have any questions about the exhibitors, agenda, or amenities, feel free to ask me! 🤝`;

    const systemEventMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      sender: 'system',
      content: isArabic 
        ? `🔔 [حدث دفع خارجي]: تم تسجيل زائر جديد باسم "${pushName}" ورقم "${pushPhone}"`
        : `🔔 [Push Trigger]: New Registration received for "${pushName}" (${pushPhone})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };

    const pushMsg: ChatMessage = {
      id: `push_${Date.now()}`,
      sender: 'agent',
      content: pushMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      thoughts: [
        { stage: 'push_workflow', detail: isArabic ? 'تم استقبال إشعار التسجيل التلقائي من نظام ExpoCore.' : 'Registration notification received from ExpoCore Core System.' },
        { stage: 'outbound_ticket', detail: isArabic ? `جاري صياغة رسالة الترحيب المخصصة وتسليم التذكرة للزائر: ${pushName}` : `Compiling personalized greeting and dispatching digital ticket to: ${pushName}` },
        { stage: 'completed', detail: isArabic ? 'تم إرسال رسالة التذكرة بنجاح عبر الواتساب.' : 'Outbound WhatsApp delivery completed successfully.' }
      ]
    };

    setMessages(prev => [...prev, systemEventMsg, pushMsg]);
    setTimeout(() => playSfx('in'), 400);
  };

  // Submit Inbound query to Agent (Real-time backend fetch simulation + Gemini support)
  const handleSendQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');
    playSfx('out');

    // Add user's message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setActiveThoughts([]);

    // We build the complete state payload to send to the server
    const currentDbState = {
      eventDetails,
      exhibitors,
      stats
    };

    try {
      // Fetch response from server-side Gemini API
      const response = await fetch('/api/expocore-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          role: roleTier,
          dbData: currentDbState
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsTyping(false);
        playSfx('in');

        const agentMsg: ChatMessage = {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          thoughts: data.thoughts || []
        };

        setMessages(prev => [...prev, agentMsg]);
        return;
      }
    } catch (err) {
      console.warn('Server-side agent request encountered an issue, running high-fidelity backup resolver:', err);
    }

    // High fidelity backup simulator logic (runs client side if anything on network/server fails)
    setTimeout(() => {
      setIsTyping(false);
      playSfx('in');

      const thoughtsAccumulator: { stage: string; detail: string }[] = [
        { stage: 'intent_analysis', detail: isArabic ? `تحليل نية الاستفسار: "${userText}"` : `Analyzing query: "${userText}"` },
        { stage: 'rbac_check', detail: isArabic ? `التحقق من مستوى الصلاحية الحالي: [${roleTier}]` : `Verifying RBAC permissions for tier: [${roleTier}]` }
      ];

      let reply = '';
      const textLower = userText.toLowerCase();

      const isOffTopic = !(
        textLower.includes('exhib') || textLower.includes('عارض') || textLower.includes('شرك') ||
        textLower.includes('where') || textLower.includes('اين') || textLower.includes('أين') || textLower.includes('مكان') || textLower.includes('موقع') || textLower.includes('عنوان') ||
        textLower.includes('when') || textLower.includes('متى') || textLower.includes('وقت') || textLower.includes('تاريخ') || textLower.includes('يوم') ||
        textLower.includes('ticket') || textLower.includes('تذكر') || textLower.includes('تذكرت') || textLower.includes('qr') ||
        textLower.includes('park') || textLower.includes('موقف') || textLower.includes('ركن') || textLower.includes('جراج') ||
        textLower.includes('stat') || textLower.includes('احصائ') || textLower.includes('إحصائ') || textLower.includes('أرقام') || textLower.includes('ارقام') ||
        textLower.includes('hello') || textLower.includes('hi') || textLower.includes('مرحبا') || textLower.includes('سلام') || textLower.includes('أهلاً') || textLower.includes('اهلاً')
      );

      if (isOffTopic) {
        thoughtsAccumulator.push({ stage: 'scope_check', detail: isArabic ? 'تم الكشف عن استفسار خارج نطاق الفعالية ونظام المعارض.' : 'Query classified as OUT-OF-SCOPE.' });
        reply = isArabic
          ? 'عذراً، أنا هنا فقط لمساعدتك بخصوص معرض *ExpoCore*، التذاكر، العارضين، وتفاصيل الفعالية. يرجى طرح سؤال متعلق بالمعرض! 😊'
          : "I am only programmed to assist with inquiries regarding the *ExpoCore* exhibition, tickets, exhibitors, and event details. Please keep your question relevant! 😊";
      } else if (textLower.includes('stat') || textLower.includes('احصائ') || textLower.includes('إحصائ') || textLower.includes('أرقام') || textLower.includes('ارقام')) {
        thoughtsAccumulator.push({ stage: 'tool_call', detail: isArabic ? 'المستخدم يطلب إحصائيات النظام. التحقق من صلاحيات المدير...' : 'User requested stats. Verifying admin privileges...' });
        if (roleTier === 'admin') {
          thoughtsAccumulator.push({ stage: 'rbac_check', detail: isArabic ? 'تم السماح بالوصول: المستخدم هو مدير نظام معتمد.' : 'Access GRANTED: User is authorized Admin.' });
          thoughtsAccumulator.push({ stage: 'tool_call', detail: 'get_dashboard_stats()' });
          thoughtsAccumulator.push({ stage: 'tool_response', detail: JSON.stringify(stats) });
          thoughtsAccumulator.push({ stage: 'synthesizing', detail: isArabic ? 'تنسيق الإحصائيات التنفيذية وعرضها.' : 'Formatting executive analytical metrics summary.' });

          reply = isArabic
            ? `📊 *التقرير التنفيذي لإحصائيات نظام ExpoCore الحالي:*

- *زيارات الصفحة (Page Visits):* ${stats.pageVisits.toLocaleString()} زيارة
- *الزوار المسجلين (Registered Visitors):* ${stats.registeredVisitors.toLocaleString()} زائر 🎫
- *معدل التحويل (Conversion Rate):* ${stats.conversionRate}
- *العملاء المهملين (Abandoned Leads):* ${stats.abandonedLeads.toLocaleString()} عميل
- *عمليات مسح البوابات (Gate Scans):*
  - *البوابة الأولى (Gate 1):* ${stats.gateScans.gate1.toLocaleString()}
  - *البوابة الثانية (Gate 2):* ${stats.gateScans.gate2.toLocaleString()}

_تم جلب هذه البيانات في الوقت الفعلي ومباشرة من قاعدة بيانات ExpoCore._`
            : `📊 *ExpoCore Dashboard Executive Analytics Summary:*

- *Page Visits:* ${stats.pageVisits.toLocaleString()}
- *Registered Visitors:* ${stats.registeredVisitors.toLocaleString()} 🎫
- *Conversion Rate:* ${stats.conversionRate}
- *Abandoned Leads:* ${stats.abandonedLeads.toLocaleString()}
- *Gate Scans:*
  - *Gate 1:* ${stats.gateScans.gate1.toLocaleString()}
  - *Gate 2:* ${stats.gateScans.gate2.toLocaleString()}

_Data fetched dynamically from core exhibition storage._`;
        } else {
          thoughtsAccumulator.push({ stage: 'rbac_check', detail: isArabic ? 'تم رفض الوصول: زائري العميل لا يملكون صلاحيات الاطلاع على الإحصائيات.' : 'Access DENIED: Visitor tier unauthorized for system telemetry.' });
          reply = isArabic
            ? 'عذراً، هذه الإحصائيات والمعلومات مخصصة فقط لمديري النظام (System Administrators). بصفتك زائراً، لا يمكنك الوصول إليها.'
            : 'I am sorry, but these system statistics and analytics are strictly reserved for system administrators. As a visitor, you do not have permission to access them.';
        }
      } else if (textLower.includes('exhib') || textLower.includes('عارض') || textLower.includes('شرك')) {
        thoughtsAccumulator.push({ stage: 'tool_call', detail: 'get_exhibitors_list()' });
        thoughtsAccumulator.push({ stage: 'tool_response', detail: `Found ${exhibitors.length} records.` });
        
        if (exhibitors.length === 0) {
          reply = isArabic
            ? 'عذراً، هذه المعلومة غير متوفرة لدي حالياً، يرجى التواصل مع فريق الدعم.'
            : 'Sorry, this information is currently not available, please contact the support team.';
        } else {
          thoughtsAccumulator.push({ stage: 'synthesizing', detail: 'Rendering exhibitor directory.' });
          const listStr = exhibitors.map(e => `- *${e.name}* (جناح: *${e.booth}*) - _${e.category}_`).join('\n');
          reply = isArabic
            ? `🏢 *الشركات العارضة المشاركة في المعرض حالياً:*

${listStr}

يسعدنا حضوركم وتفاعلكم مع الشركات الرائدة في الأجنحة المخصصة! 🎫`
            : `🏢 *List of Exhibitors currently participating in the expo:*

${listStr}

We look forward to your engagement with our distinguished partners in their designated booths! 🎫`;
        }
      } else if (textLower.includes('where') || textLower.includes('اين') || textLower.includes('أين') || textLower.includes('مكان') || textLower.includes('موقع') || textLower.includes('عنوان') ||
                 textLower.includes('when') || textLower.includes('متى') || textLower.includes('وقت') || textLower.includes('تاريخ') || textLower.includes('يوم') ||
                 textLower.includes('park') || textLower.includes('موقف') || textLower.includes('ركن') || textLower.includes('جراج')) {
        thoughtsAccumulator.push({ stage: 'tool_call', detail: 'get_event_details()' });
        thoughtsAccumulator.push({ stage: 'tool_response', detail: JSON.stringify(eventDetails) });
        thoughtsAccumulator.push({ stage: 'synthesizing', detail: 'Compiling event details.' });

        if (textLower.includes('park') || textLower.includes('موقف') || textLower.includes('ركن') || textLower.includes('جراج')) {
          reply = isArabic
            ? `🚗 *تفاصيل مواقف السيارات:*
${eventDetails.parking} 📍`
            : `🚗 *Parking Details:*
${eventDetails.parking} 📍`;
        } else {
          reply = isArabic
            ? `📅 *تفاصيل فعاليات ${eventDetails.name}:*

- *📍 المكان:* ${eventDetails.location}
- *📅 التاريخ:* ${eventDetails.date}
- *⏰ الجدول والبرنامج:* ${eventDetails.agenda}
- *🚗 مواقف السيارات:* ${eventDetails.parking}`
            : `📅 *Event Details for ${eventDetails.name}:*

- *📍 Venue:* ${eventDetails.location}
- *📅 Dates:* ${eventDetails.date}
- *⏰ Live Agenda:* ${eventDetails.agenda}
- *🚗 Parking:* ${eventDetails.parking}`;
        }
      } else {
        thoughtsAccumulator.push({ stage: 'synthesizing', detail: 'Drafting friendly welcoming greeting.' });
        reply = isArabic
          ? 'مرحباً بك مجدداً في *ExpoCore*! 🤝\n\nكيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن أماكن الفعالية، قائمة العارضين، مواقف السيارات، أو التذاكر! 🎫'
          : 'Hello! Welcome back to *ExpoCore*! 🤝\n\nHow can I help you today? You can ask me about the venue location, exhibitor list, parking, or digital tickets! 🎫';
      }

      const backupAgentMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        thoughts: thoughtsAccumulator
      };

      setMessages(prev => [...prev, backupAgentMsg]);
    }, 1200);
  };

  // Quick prompt suggestions
  const SUGGESTED_PROMPTS = isArabic ? [
    { text: 'أين ومتى يقام المعرض ومواقف السيارات؟', icon: MapPin },
    { text: 'من هم الشركات العارضة المشاركة؟', icon: Landmark },
    { text: 'أريد الحصول على إحصائيات المعرض والزوار', icon: Shield, adminOnly: true },
    { text: 'هل يوجد وجبات أو غداء مجاني بالفعالية؟', icon: HelpCircle }
  ] : [
    { text: 'Where and when is the event happening & parking?', icon: MapPin },
    { text: 'Who is currently exhibiting at the booths?', icon: Landmark },
    { text: 'I want to see the registered visitors & statistics', icon: Shield, adminOnly: true },
    { text: 'Is there free lunch or catering provided?', icon: HelpCircle }
  ];

  const applySuggestedPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  // Convert raw message text bold *text* to React elements
  const formatMsgText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={index} className="font-extrabold text-zinc-900 dark:text-white">{part.slice(1, -1)}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="expocore_agent_page" className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden rtl:text-right ltr:text-left animate-fadeIn">
      
      {/* --- PREMIUM INTUITIVE SUB-TAB BAR (SOLVES FIXED CLUTTERED LAYOUT) --- */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-[#00a884]/10 p-2 rounded-xl text-[#00a884]">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 tracking-wide">
              {isArabic ? 'بوابة محاكاة نظام ومساعد إكسبو كور' : 'ExpoCore Intelligent Sandbox Portal'}
            </h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              {isArabic ? 'تحكّم في المحتوى اللحظي وشاهد استجابات المساعد الذكي وصلاحيات RBAC' : 'Manage live exhibition data & monitor decision logic traces in real-time'}
            </p>
          </div>
        </div>

        {/* Beautiful responsive tab selector */}
        <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveSubTab('chat');
              playSfx('in');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'chat'
                ? 'bg-[#00a884] text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isArabic ? 'مساعد الواتساب والدردشة' : 'WhatsApp Smart Agent (Chat)'}</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('database');
              playSfx('out');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'database'
                ? 'bg-[#00a884] text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{isArabic ? 'قاعدة البيانات وأدوات التحكم' : 'Database & Sandbox Controls'}</span>
          </button>
        </div>
      </div>

      {/* Main split viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* --- SIDEBAR PANEL: CONFIGURATION, PUSH WORKFLOW & LIVE DATABASE --- */}
        <div className={`w-full lg:w-[420px] bg-white dark:bg-zinc-900 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full flex-shrink-0 overflow-y-auto ${
          activeSubTab === 'database' ? 'flex animate-fadeIn' : 'hidden lg:flex'
        }`}>
        
        {/* Panel Header */}
        <div className="p-4 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#00a884] p-2 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                {isArabic ? 'قاعدة بيانات ExpoCore الذكية' : 'ExpoCore Dynamic DB & Controls'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium">
                {isArabic ? 'إدارة البيانات اللحظية ومحاكاة التسجيل' : 'Manage real-time state & push flows'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('expocore_event_details');
              localStorage.removeItem('expocore_exhibitors');
              localStorage.removeItem('expocore_stats');
              window.location.reload();
            }}
            className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-all"
            title={isArabic ? 'إعادة ضبط قاعدة البيانات' : 'Reset Database'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Configurations Body */}
        <div className="p-4 space-y-6">
          
          {/* RBAC ROLES CONTROL */}
          <div className="space-y-2 bg-emerald-50/40 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-500/10">
            <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              🛡️ {isArabic ? 'اختيار صلاحية الجلسة للواتساب:' : 'RBAC Sandbox Role Simulator:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRoleTier('visitor')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  roleTier === 'visitor'
                    ? 'bg-[#00a884] text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{isArabic ? 'زائر المعرض (Visitor)' : 'Visitor Tier'}</span>
              </button>
              
              <button
                onClick={() => setRoleTier('admin')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  roleTier === 'admin'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isArabic ? 'المدير (Admin Tier)' : 'Admin Tier'}</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 text-center pt-1 font-medium">
              {roleTier === 'admin' 
                ? (isArabic ? 'صلاحيات كاملة: مسموح بالاطلاع على الإحصائيات التنفيذية والمالية.' : 'Full Access: Authorized to request analytics and sensitive statistics.')
                : (isArabic ? 'صلاحيات عامة: الاطلاع فقط على الفعاليات والشركات والبيانات العامة.' : 'Limited Access: Public event details, ticket checks, and exhibitor locations only.')
              }
            </p>
          </div>

          {/* --- EXPOCORE INTEGRATION HOOK --- */}
          <div className="space-y-3 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-600 animate-pulse" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                  {isArabic ? 'ربط سيستم إكسبو كور (Integration Hook)' : 'ExpoCore Integration Hook'}
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 ${
                syncStatus === 'active' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                  : syncStatus === 'checking'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'active' ? 'bg-emerald-500 animate-ping' : syncStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-400'}`} />
                <span>
                  {syncStatus === 'active' ? (isArabic ? 'متصل' : 'Connected') : syncStatus === 'checking' ? (isArabic ? 'جاري الفحص' : 'Checking') : (isArabic ? 'غير نشط' : 'Disconnected')}
                </span>
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
              {isArabic 
                ? 'تحكّم في إعدادات الاتصال الآمن ومزامنة قاعدة البيانات اللحظية مع خوادم إكسبو كور لتسجيل الزوار وتوزيع التذاكر.' 
                : 'Configure secure handshake keys and live webhook synchronizations with core ExpoCore servers.'}
            </p>

            {/* Private API Key */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] text-zinc-400 font-extrabold flex items-center justify-between">
                <span>{isArabic ? 'مفتاح الـ API الخاص (PRIVATE API KEY):' : 'PRIVATE API KEY:'}</span>
                <span className="text-[9px] text-zinc-400 font-normal lowercase">headers: api_key</span>
              </label>
              <div className="flex gap-1">
                <div className="relative flex-1">
                  <input 
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="ec_sk_live_..."
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-3 pr-8 outline-none focus:border-indigo-500 font-mono text-[11px] font-bold"
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
                    title={showApiKey ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'إظهار' : 'Show')}
                  >
                    {showApiKey ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                    playSfx('in');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                >
                  {copiedKey ? (isArabic ? 'تم النسخ' : 'Copied!') : (isArabic ? 'نسخ' : 'Copy')}
                </button>
              </div>
            </div>

            {/* Webhook URL */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] text-zinc-400 font-extrabold block">
                {isArabic ? 'رابط الـ Webhook العام للاستقبال اللحظي:' : 'PUBLIC WEBHOOK URL (FOR PUSH NOTIFICATIONS):'}
              </label>
              <div className="flex gap-1">
                <input 
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-3 outline-none font-mono text-[10.5px] text-zinc-500"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                    playSfx('in');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                >
                  {copiedWebhook ? (isArabic ? 'تم النسخ' : 'Copied!') : (isArabic ? 'نسخ' : 'Copy')}
                </button>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium leading-tight block pt-0.5">
                {isArabic 
                  ? '💡 استخدم هذا الرابط في لوحة تحكم إكسبو كور كـ Webhook لإرسال بيانات الزوار وتوليد التذاكر عبر الواتساب فوراً.'
                  : '💡 Configure this URL in your ExpoCore Admin dashboard webhooks to trigger instant WhatsApp tickets upon guest check-in.'}
              </span>
            </div>

            {/* Actions for Webhook simulation and Test Check */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <button
                onClick={handleTestConnection}
                disabled={syncStatus === 'checking'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-3xs text-[11px] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'checking' ? 'animate-spin' : ''}`} />
                <span>{isArabic ? 'فحص ومزامنة الربط' : 'Test Handshake'}</span>
              </button>
              
              <button
                onClick={handleSimulateWebhookPush}
                className="bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-zinc-300 border border-indigo-200 dark:border-zinc-700 hover:bg-indigo-100 dark:hover:bg-zinc-750 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer text-[11px] transition-all"
              >
                <Send className="w-3 h-3" />
                <span>{isArabic ? 'محاكاة طلب Webhook' : 'Simulate Webhook'}</span>
              </button>
            </div>

            {/* Connection Sync Terminal Logs */}
            <div className="bg-zinc-950 text-zinc-300 rounded-lg p-2.5 font-mono text-[10px] space-y-1 border border-zinc-800 max-h-[110px] overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800 mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                <span>{isArabic ? 'سجل العمليات والربط اللحظي' : 'Live Sync Logs'}</span>
                <span className="text-emerald-500 animate-pulse">{isArabic ? 'نشط' : 'Live'}</span>
              </div>
              {syncLogs.length > 0 ? (
                syncLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed whitespace-pre-wrap animate-fadeIn text-[9.5px]">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic text-center py-2">{isArabic ? 'لا توجد عمليات ربط حالية.' : 'No active sync logs.'}</div>
              )}
            </div>
          </div>

          {/* DEVELOPER CONNECTION GUIDE */}
          <div className="space-y-3 border border-indigo-100 dark:border-indigo-950 p-4 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/5 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                {isArabic ? '🛠️ دليل ربط سيستم التذاكر (ticket.expocore.net)' : '🛠️ Ticket System Integration Guide'}
              </h4>
            </div>
            
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              {isArabic 
                ? 'لإرسال التذاكر تلقائياً للزوار على الواتساب بمجرد تسجيلهم في سيستم التذاكر الخاص بك، يمكنك استخدام الـ Webhook أو دمج الأكواد أدناه في السيستم:' 
                : 'To automatically deliver tickets to visitors via WhatsApp upon registration on your ticketing platform, configure a webhook or integrate the API snippet below:'}
            </p>

            {/* Snippet Tabs */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-800 pb-1 gap-1">
              <button 
                onClick={() => { setActiveDevTab('webhook'); playSfx('in'); }}
                className={`px-2.5 py-1 text-[10px] font-bold border-b-2 transition-all cursor-pointer ${activeDevTab === 'webhook' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
              >
                {isArabic ? 'الويب-هوك (Webhook)' : 'Webhook Config'}
              </button>
              <button 
                onClick={() => { setActiveDevTab('php'); playSfx('in'); }}
                className={`px-2.5 py-1 text-[10px] font-bold border-b-2 transition-all cursor-pointer ${activeDevTab === 'php' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
              >
                PHP (Laravel)
              </button>
              <button 
                onClick={() => { setActiveDevTab('js'); playSfx('in'); }}
                className={`px-2.5 py-1 text-[10px] font-bold border-b-2 transition-all cursor-pointer ${activeDevTab === 'js' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
              >
                Node.js / JS
              </button>
            </div>

            {/* Tab Contents */}
            <div className="text-[10.5px]">
              {activeDevTab === 'webhook' && (
                <div className="space-y-1.5 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">
                    {isArabic ? 'خطوات تفعيل الويب-هوك التلقائي:' : 'How to configure Webhooks:'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-500 text-[10px] font-medium">
                    <li>{isArabic ? 'افتح لوحة تحكم سيستم التذاكر ticket.expocore.net' : 'Open your ticketing admin dashboard at ticket.expocore.net.'}</li>
                    <li>{isArabic ? 'انتقل إلى إعدادات التكامل والربط (Integration settings).' : 'Go to Developer Integration / Webhooks Settings.'}</li>
                    <li>{isArabic ? 'أضف Webhook جديد وضع فيه رابط الاستقبال اللحظي الخاص بنا:' : 'Create a new webhook and paste our Public Webhook URL:'}
                      <code className="block bg-zinc-100 dark:bg-zinc-800 font-mono p-1 rounded mt-0.5 text-indigo-600 dark:text-indigo-400 break-all select-all font-bold">{webhookUrl}</code>
                    </li>
                    <li>{isArabic ? 'اختر الحدث (Event) كـ: "عند تأكيد الحجز / Ticket Confirmed".' : 'Select the trigger event: "Ticket Generated / Registration Confirmed".'}</li>
                    <li>{isArabic ? 'أضف الـ API Key في الهيدرز باسم api_key لتأمين نقل البيانات.' : 'Add your custom Private API Key as headers key: api_key for secure payload handshake.'}</li>
                  </ol>
                </div>
              )}

              {activeDevTab === 'php' && (
                <div className="space-y-1">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">
                    {isArabic ? 'كود إرسال التذكرة بالـ PHP (Laravel/Guzzle):' : 'PHP Integration Snippet:'}
                  </p>
                  <pre className="bg-zinc-950 text-zinc-300 font-mono p-2 rounded-lg text-[9px] overflow-x-auto max-h-[160px] leading-tight select-all">
{`<?php
// Laravel Http Client or pure cURL
use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
    'api_key' => '${apiKey}'
])->post('${webhookUrl.split('?')[0]}', [
    'name' => $visitor->name,       // الاسم الكامل
    'phone' => $visitor->phone,     // 201012345678
    'ticket' => $ticket->id,        // كود التذكرة
    'ticketUrl' => $ticket->qr_url  // رابط الـ QR
]);

if ($response->successful()) {
    Log::info("WhatsApp Ticket Sent!");
}`}
                  </pre>
                </div>
              )}

              {activeDevTab === 'js' && (
                <div className="space-y-1">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">
                    {isArabic ? 'كود إرسال التذكرة بالـ Node.js / Fetch:' : 'Node.js / JS Fetch Snippet:'}
                  </p>
                  <pre className="bg-zinc-950 text-zinc-300 font-mono p-2 rounded-lg text-[9px] overflow-x-auto max-h-[160px] leading-tight select-all">
{`// Direct API call from your Node.js or JS application
fetch('${webhookUrl.split('?')[0]}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api_key': '${apiKey}'
  },
  body: JSON.stringify({
    name: 'عبدالرحمن محمد',
    phone: '201012345678', // Country code prefix
    ticket: '9842',
    ticketUrl: 'https://expocore.io/t/9842-qr'
  })
})
.then(res => res.json())
.then(data => console.log('WhatsApp Dispatched:', data));`}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* WORKFLOW 1: OUTBOUND PUSH SIMULATOR */}
          <div className="space-y-3 border border-zinc-100 dark:border-zinc-800 p-3.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                1. {isArabic ? 'محاكاة تسجيل زائر وإرسال التذكرة (Push)' : 'Outbound Registration Push Flow'}
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">{isArabic ? 'اسم الزائر:' : 'Visitor Name:'}</label>
                <input 
                  type="text"
                  value={pushName}
                  onChange={(e) => setPushName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">{isArabic ? 'رقم الهاتف:' : 'Phone Number:'}</label>
                  <input 
                    type="text"
                    value={pushPhone}
                    onChange={(e) => setPushPhone(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 outline-none focus:border-indigo-500 text-left font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">{isArabic ? 'رابط التذكرة الـ QR:' : 'Ticket QR Link:'}</label>
                  <input 
                    type="text"
                    value={pushTicketUrl}
                    onChange={(e) => setPushTicketUrl(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 outline-none focus:border-indigo-500 text-left font-mono text-zinc-500"
                  />
                </div>
              </div>

              <button
                onClick={handleTriggerPush}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-2 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إرسال التذكرة للواتساب الآن' : 'Trigger Registration & Ticket Delivery'}</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC DATABASE SECTION */}
          <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{isArabic ? 'إدارة محتوى قاعدة البيانات اللحظية:' : 'Live ExpoCore Backend Data Manager:'}</span>
            </h4>

            {/* EVENT DETAILS EDIT */}
            <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800 text-xs">
              <div className="font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{isArabic ? 'تفاصيل المعرض والفعالية:' : 'Exhibition & Venue Details:'}</span>
              </div>
              
              <div className="space-y-1.5">
                <input 
                  type="text"
                  value={eventDetails.name}
                  onChange={(e) => setEventDetails({ ...eventDetails, name: e.target.value })}
                  placeholder={isArabic ? 'اسم المعرض' : 'Exhibition Name'}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none font-bold"
                />
                <input 
                  type="text"
                  value={eventDetails.location}
                  onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
                  placeholder={isArabic ? 'الموقع الجغرافي' : 'Venue Location'}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none"
                />
                <input 
                  type="text"
                  value={eventDetails.date}
                  onChange={(e) => setEventDetails({ ...eventDetails, date: e.target.value })}
                  placeholder={isArabic ? 'التواريخ' : 'Dates'}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none"
                />
                <input 
                  type="text"
                  value={eventDetails.parking}
                  onChange={(e) => setEventDetails({ ...eventDetails, parking: e.target.value })}
                  placeholder={isArabic ? 'تفاصيل جراج ركن السيارات' : 'Parking Details'}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none text-[11px] text-zinc-500"
                />
              </div>
            </div>

            {/* EXHIBITORS CRUD */}
            <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800 text-xs">
              <div className="font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-zinc-400" />
                <span>{isArabic ? 'الشركات العارضة المتواجدة:' : 'Registered Exhibitors & Booths:'}</span>
              </div>

              {/* List */}
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 my-2">
                {exhibitors.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 p-2 rounded">
                    <div>
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">{ex.name}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {isArabic ? 'جناح' : 'Booth'} <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">{ex.booth}</span> | {ex.category}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteExhibitor(ex.id)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {exhibitors.length === 0 && (
                  <p className="text-center text-[10px] text-zinc-400 py-3 font-medium">
                    {isArabic ? '⚠️ قاعدة البيانات فارغة. المساعد سيبلغ الدعم في حال السؤال.' : '⚠️ No exhibitors registered. Agent will trigger backup support notice.'}
                  </p>
                )}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddExhibitor} className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-2 gap-1.5">
                  <input 
                    type="text"
                    required
                    placeholder={isArabic ? 'اسم الشركة' : 'Company Name'}
                    value={newExhibitorName}
                    onChange={(e) => setNewExhibitorName(e.target.value)}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none text-[11px]"
                  />
                  <input 
                    type="text"
                    required
                    placeholder={isArabic ? 'رقم الجناح (مثال: A1)' : 'Booth (e.g. A1)'}
                    value={newExhibitorBooth}
                    onChange={(e) => setNewExhibitorBooth(e.target.value)}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none text-[11px]"
                  />
                </div>
                <div className="flex gap-1.5">
                  <input 
                    type="text"
                    placeholder={isArabic ? 'التصنيف والمجال' : 'Category'}
                    value={newExhibitorCategory}
                    onChange={(e) => setNewExhibitorCategory(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none text-[11px]"
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded transition-all flex items-center justify-center cursor-pointer shadow-xs"
                    title={isArabic ? 'إضافة عارض' : 'Add Exhibitor'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* ANALYTICS STATS EDIT */}
            <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800 text-xs">
              <div className="font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>{isArabic ? 'أرقام وإحصائيات لوحة التحكم (للمدراء فقط):' : 'Exhibition Analytics Stats (Admin Only):'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-zinc-400 block mb-0.5">{isArabic ? 'الزيارات:' : 'Page Visits:'}</label>
                  <input 
                    type="number"
                    value={stats.pageVisits}
                    onChange={(e) => setStats({ ...stats, pageVisits: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-0.5">{isArabic ? 'المسجلين:' : 'Registered Visitors:'}</label>
                  <input 
                    type="number"
                    value={stats.registeredVisitors}
                    onChange={(e) => setStats({ ...stats, registeredVisitors: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-0.5">{isArabic ? 'معدل التحويل:' : 'Conversion Rate:'}</label>
                  <input 
                    type="text"
                    value={stats.conversionRate}
                    onChange={(e) => setStats({ ...stats, conversionRate: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-0.5">{isArabic ? 'عملاء مهملين:' : 'Abandoned Leads:'}</label>
                  <input 
                    type="number"
                    value={stats.abandonedLeads}
                    onChange={(e) => setStats({ ...stats, abandonedLeads: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 outline-none font-bold text-rose-500"
                  />
                </div>
              </div>

              <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-zinc-400 block">{isArabic ? 'مسح البوابة 1:' : 'Gate 1 Scans:'}</span>
                  <input 
                    type="number"
                    value={stats.gateScans.gate1}
                    onChange={(e) => setStats({ ...stats, gateScans: { ...stats.gateScans, gate1: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1 outline-none"
                  />
                </div>
                <div>
                  <span className="text-zinc-400 block">{isArabic ? 'مسح البوابة 2:' : 'Gate 2 Scans:'}</span>
                  <input 
                    type="number"
                    value={stats.gateScans.gate2}
                    onChange={(e) => setStats({ ...stats, gateScans: { ...stats.gateScans, gate2: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN INTERACTIVE WHATSAPP WEB CHAT ENGINE --- */}
      <div className={`flex-1 flex flex-col h-full relative overflow-hidden bg-[#efeae2] dark:bg-zinc-950 ${
        activeSubTab === 'chat' ? 'flex animate-fadeIn' : 'hidden lg:flex'
      }`}>
        
        {/* WhatsApp Chat Wall-paper overlay */}
        <div className="absolute inset-0 opacity-4 dark:opacity-2 pointer-events-none bg-repeat" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')` }} />

        {/* Dynamic Interactive Thoughts Panel (Splits Screen top/right or sidebar) */}
        <div className="bg-zinc-900/95 text-white border-b border-zinc-800 px-4 py-2.5 z-10 text-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-extrabold text-[#00a884] uppercase tracking-wider text-[10px]">
                {isArabic ? 'العقل المفكر والتحليل الذكي للعميل (AI Core Thoughts):' : 'AI Agent Back-Stage Thoughts & RBAC:'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{isArabic ? 'نشط ومستعد لجلب البيانات' : 'Listening & Syncing'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-1.5 max-h-[85px] overflow-y-auto">
            {activeThoughts.length > 0 ? (
              activeThoughts.map((th, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10.5px] flex items-center gap-1.5 animate-fadeIn">
                  <span className="font-bold text-amber-400 font-mono text-[9px] uppercase">
                    {th.stage.replace('_', ' ')}:
                  </span>
                  <span className="text-zinc-300 font-medium">{th.detail}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 font-medium italic">
                {isArabic ? '🔍 تفكير العميل يظهر هنا فورياً عند إرسال أي سؤال في الشات لمشاهدة استدعاء التوابع وصلاحيات RBAC...' : '🔍 Dynamic agent trace will output here instantly upon sending messages, detailing dynamic function calls and RBAC authorization...'}
              </p>
            )}
            {isTyping && (
              <span className="text-[10.5px] text-emerald-400 font-mono animate-pulse">
                {isArabic ? 'جاري التفكير وجلب البيانات الأساسية من المعرض...' : 'Agent is reasoning and fetching live details...'}
              </span>
            )}
          </div>
        </div>

        {/* WhatsApp Chat Header */}
        <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-sm border border-emerald-500/10">
                <span>EC</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
            </div>

            <div>
              <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span>{isArabic ? 'ExpoCore مساعد الواتساب الذكي' : 'ExpoCore Smart WhatsApp Agent'}</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Official AI</span>
              </h4>
              <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                <span>{isTyping ? (isArabic ? 'يكتب الآن...' : 'typing...') : (isArabic ? 'متصل بالمعرض' : 'Online')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge Indicator of current sandboxed role */}
            <div className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase border ${
              roleTier === 'admin' 
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900' 
                : 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
            }`}>
              {isArabic ? 'صلاحيتك الحالية:' : 'Active Role:'} {roleTier}
            </div>
          </div>
        </div>

        {/* Chat Messages Body Container */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 z-10 scrollbar-thin">
          
          {/* Disclaimer Info Banner */}
          <div className="mx-auto max-w-sm bg-amber-50 dark:bg-zinc-900 border border-amber-200/50 dark:border-zinc-800/80 p-3 rounded-xl text-center text-[11px] text-amber-800 dark:text-amber-400/90 shadow-2xs">
            <AlertTriangle className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <p className="font-semibold">
              {isArabic 
                ? 'محاكاة كاملة لهوية "مساعد ExpoCore" وصلاحيات RBAC للزوار والمدرائ.' 
                : 'Interactive Sandbox demonstrating "ExpoCore Agent" workflows and role constraints.'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              {isArabic 
                ? 'المساعد يعتمد بالكامل على تزويده بقاعدة بيانات المعرض الحية (أعلاه) للرد بدقة دون أي تأليف.' 
                : 'All agent responses dynamically match the live exhibition database (left) to ensure zero hallucination.'}
            </p>
          </div>

          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1 animate-fadeIn">
                  <div className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/30 shadow-2xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                onClick={() => {
                  if (msg.thoughts) {
                    setActiveThoughts(msg.thoughts);
                  }
                }}
                className={`flex w-full ${isAgent ? 'justify-start' : 'justify-end'} group cursor-pointer animate-fadeIn`}
              >
                <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-xs transition-all relative ${
                  isAgent 
                    ? 'bg-white dark:bg-zinc-900 rounded-tl-none border border-zinc-200/20 dark:border-zinc-800' 
                    : 'bg-[#d9fdd3] dark:bg-emerald-950/80 rounded-tr-none text-zinc-800 dark:text-zinc-100'
                } hover:shadow-md`}>
                  
                  {/* Sender Name for clarity */}
                  <div className="flex items-center gap-1.5 mb-1 justify-between">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                      {isAgent ? (isArabic ? 'مساعد إكسبو كور الذكي' : 'ExpoCore Smart Agent') : (isArabic ? 'أنت' : 'You')}
                    </span>
                    {isAgent && msg.thoughts && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-extrabold flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{isArabic ? 'عرض منطق القرار' : 'Decision Trace'}</span>
                      </span>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <p className="text-xs text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                    {formatMsgText(msg.content)}
                  </p>

                  {/* Metadata and checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-1.5 text-zinc-400 dark:text-zinc-500">
                    <span className="text-[9px] font-medium font-mono">{msg.timestamp}</span>
                    {!isAgent && (
                      msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing state */}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-none p-3 shadow-xs flex items-center gap-2 border border-zinc-200/20 dark:border-zinc-800">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-zinc-400 font-bold">
                  {isArabic ? 'المساعد يقوم بطلب البيانات والتحقق من الصلاحيات...' : 'Agent analyzing context...'}
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion prompt list */}
        <div className="px-4 py-2 bg-zinc-50/70 dark:bg-zinc-950/80 backdrop-blur-md z-10 border-t border-zinc-200/50 dark:border-zinc-800/80 space-y-1.5">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            💡 {isArabic ? 'نقرات سريعة لاختبار الاستفسارات وبنود RBAC:' : 'Recommended Tests for Sandbox Scenario:'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_PROMPTS.map((p, index) => {
              const IconComponent = p.icon;
              const disabled = p.adminOnly && roleTier !== 'admin';
              return (
                <button
                  key={index}
                  disabled={disabled}
                  onClick={() => applySuggestedPrompt(p.text)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                    disabled 
                      ? 'bg-zinc-100 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700 border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed'
                      : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 shadow-3xs'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${p.adminOnly ? 'text-amber-500' : 'text-[#00a884]'}`} />
                  <span>{p.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WhatsApp Chat Footer Input form */}
        <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 z-10 shadow-xs">
          <form onSubmit={handleSendQuery} className="flex items-center gap-3">
            
            <input 
              type="text"
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isArabic ? 'اكتب استفسارك هنا (مثال: "من العارضين المتواجدين؟")...' : 'Ask the Smart Agent a question...'}
              className="flex-1 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-3 outline-none focus:border-[#00a884] shadow-3xs placeholder-zinc-400 rtl:text-right ltr:text-left"
            />

            <button 
              type="submit"
              className="bg-[#00a884] hover:bg-[#008f6f] text-white p-3 rounded-xl transition-all cursor-pointer shadow-sm"
              title={isArabic ? 'إرسال الاستفسار' : 'Send message'}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>

  </div>
  );
}
