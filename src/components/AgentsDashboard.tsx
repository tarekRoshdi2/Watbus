import React, { useState, useEffect } from 'react';
import { 
  Bot, UserCog, HeartPulse, Activity, Zap, CheckCircle2, XCircle, Clock, 
  ChevronRight, BarChart3, Filter, Settings, FileText, Image as ImageIcon, 
  Wrench, ShieldCheck, Play, Send, RefreshCw, Sparkles, Check, DollarSign, ExternalLink, PhoneCall,
  Shield, Sliders, ListChecks, ArrowLeftRight, CreditCard, Palette, LifeBuoy, Compass, RotateCcw,
  Ticket, Layers, Copy, Download, PhoneForwarded, AlertTriangle, CheckCircle, FileCheck, Search, Plus, Volume2, PlayCircle, FileDown,
  Lightbulb, TrendingUp, Cpu, Flame, Megaphone, Users, BarChart2, Target, Eye, ShoppingCart, UserCheck, Briefcase, Smartphone
} from 'lucide-react';

export interface AgentConfig {
  id: string;
  name: string;
  nameEn: string;
  role: 'sales' | 'invoice' | 'media' | 'support' | 'router' | 'marketing' | 'dev';
  description: string;
  status: 'active' | 'busy' | 'offline';
  model: string;
  temperature: number;
  dialect: 'eg' | 'sa' | 'msa' | 'lb' | 'en_us';
  systemPrompt: string;
  triggerKeywords: string[];
  responsibilities: string[];
  guardrails: {
    maxDiscountPercent: number;
    autoVoiceCall: boolean;
    autoPaymentLink: boolean;
    workingHours: string;
    taxRate?: number;
    currency?: string;
    paymentGateway?: string;
    cardTheme?: string;
    primaryBadge?: string;
    ticketPrefix?: string;
    confidenceThreshold?: number;
    salesStrategy?: string;
  };
  metrics: {
    totalChats: number;
    resolvedTickets: number;
    avgResponseTime: string;
    customerSatisfaction: number;
  };
  recentActivities: { id: string; time: string; action: string; status: 'success' | 'warning' }[];
}

export default function AgentsDashboard({ lang, initialTab = 'roster' }: { lang: 'ar' | 'en'; initialTab?: 'roster' | 'dev_agent' | 'marketing' | 'tickets' | 'crm' | 'analytics' | 'results' | 'payments' | 'playground' | 'telegram' }) {
  const isAr = lang === 'ar';
  
  // Main Module View Hub Tabs ('roster' | 'dev_agent' | 'marketing' | 'tickets' | 'crm' | 'analytics' | 'results' | 'payments' | 'playground' | 'telegram')
  const [mainHubTab, setMainHubTab] = useState<'roster' | 'dev_agent' | 'marketing' | 'tickets' | 'crm' | 'analytics' | 'results' | 'payments' | 'playground' | 'telegram'>(initialTab);
  useEffect(() => { setMainHubTab(initialTab); }, [initialTab]);

  // Modal Settings Tabs
  const [activeTab, setActiveTab] = useState<'identity' | 'duties' | 'params' | 'analytics' | 'logs' | 'dispatch'>('identity');

  // Live Playground Simulation States
  const [selectedPlaygroundProj, setSelectedPlaygroundProj] = useState(0);
  const [playgroundCustomPrompt, setPlaygroundCustomPrompt] = useState('');
  const [playgroundCustomerName, setPlaygroundCustomerName] = useState('طارق رشدي');
  const [isSimulatingLive, setIsSimulatingLive] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<any[]>([]);


  // Gateway & Payment Services Toggles State
  const [gatewayToggles, setGatewayToggles] = useState({
    instapayActive: true,
    vodafoneActive: true,
    bankIbanActive: true,
    cardGatewayActive: true,
    requireScreenshot: true,
    autoVerifyReceipt: true
  });

  // Payment Settings States (Vodafone Cash & InstaPay)
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [vodafoneCashNo, setVodafoneCashNo] = useState('01020304050');
  const [instaPayId, setInstaPayId] = useState('chatcore@instapay');
  const [bankIbanNo, setBankIbanNo] = useState('EG1234567890123456789012345');

  const [accountHolderName, setAccountHolderName] = useState('طارق رشدي (Tarek Roshdi)');
  const [bankName, setBankName] = useState('البنك الأهلي المصري (NBE)');
  const [telegramBotToken, setTelegramBotToken] = useState(() => localStorage.getItem('chatcore_telegram_bot_token') || '');
  const [telegramBotInfo, setTelegramBotInfo] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('chatcore_telegram_bot_info');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [telegramActive, setTelegramActive] = useState(true);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const [screenshotModalInv, setScreenshotModalInv] = useState<any>(null);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null);

  // Direct Task Dispatch States inside Modal
  const [directTaskInput, setDirectTaskInput] = useState('');
  const [isExecutingDirectTask, setIsExecutingDirectTask] = useState(false);
  const [directTaskResult, setDirectTaskResult] = useState<any>(null);
  
  // Ticketing System States
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'escalated'>('all');
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [newTicketCustomer, setNewTicketCustomer] = useState('');
  const [newTicketPhone, setNewTicketPhone] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('high');
  const [newTicketAssigned, setNewTicketAssigned] = useState('مهندس عمر الدعم');
  const [newTicketIssue, setNewTicketIssue] = useState('');
  const [ticketsList, setTicketsList] = useState([
    { id: 'TCK-9482', customer: 'م. أحمد الشريف', phone: '+201123456789', category: 'technical', priority: 'high', status: 'open', time: '11:40 AM', issue: 'توقف المزامنة السحابية للرسائل عند استخدام شريحة جديدة', solution: 'تم تحديث توكن الجلسة وإعادة تشغيل البورت الخاص بالجهاز.', assignedTo: 'مهندس عمر الدعم' },
    { id: 'TCK-8819', customer: 'د. سارة عثمان', phone: '+201098765432', category: 'billing', priority: 'urgent', status: 'in_progress', time: '11:15 AM', issue: 'عدم احتساب الخصم المخصص على فاتورة الاشتراكات البنكية', solution: 'سيقوم مسؤول الفواتير بإلغاء الفاتورة السابقة وتوليد كود خصم جديد بنسبة 20%.', assignedTo: 'الأستاذ صلاح الحسابات' },
    { id: 'TCK-7740', customer: 'شركة النور للمقاولات', phone: '+201234567890', category: 'account', priority: 'medium', status: 'resolved', time: '10:30 AM', issue: 'طلب ربط حساب Meta Business Suite بـ OTP جديد', solution: 'تمت إتاحة نموذج الاعتماد وإدخال كود التفعيل بنجاح.', assignedTo: 'مهندس عمر الدعم' },
    { id: 'TCK-6612', customer: 'خالد عبد الفتاح', phone: '+201555443322', category: 'technical', priority: 'low', status: 'escalated', time: '09:45 AM', issue: 'استفسار عن طريقة تصدير جهات الاتصال إلى ملف Excel', solution: 'تم تحويل المحادثة لممثل خدمة العملاء المباشر مع إرسال فيديو توضيحي.', assignedTo: 'مشرف بشرى' }
  ]);
  const [selectedTicketModal, setSelectedTicketModal] = useState<any>(null);

  const handleCreateTicketSubmit = () => {
    if (!newTicketCustomer || !newTicketIssue) return;
    const generatedId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicketObj = {
      id: generatedId,
      customer: newTicketCustomer,
      phone: newTicketPhone || '+201100000000',
      category: 'technical',
      priority: newTicketPriority,
      status: 'open' as const,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      issue: newTicketIssue,
      solution: 'تم فتح التذكرة بنجاح وجارِ التحليل الآلي عبر الوكيل الفني.',
      assignedTo: newTicketAssigned
    };

    setTicketsList(prev => [newTicketObj, ...prev]);
    setIsCreateTicketModalOpen(false);
    setNewTicketCustomer('');
    setNewTicketPhone('');
    setNewTicketIssue('');
  };


  // Marketing Campaigns State
  const [campaignsList, setCampaignsList] = useState([
    { id: 'CMP-101', name: 'حملة العرض الصيفي المميز ☀️', audience: 'عملاء VIP (120 عميل)', status: 'sent', sentCount: 120, openRate: '88%', conversions: 34, revenue: '17,000 EGP', time: '10:00 AM' },
    { id: 'CMP-102', name: 'إعادة إحياء العملاء غير المترددين ⚡', audience: 'عملاء بدون تفاعل منذ 7 أيام (250 عميل)', status: 'scheduled', sentCount: 0, openRate: '0%', conversions: 0, revenue: '0 EGP', time: 'Scheduled 06:00 PM' }
  ]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignAudience, setNewCampaignAudience] = useState('all');

  // Enterprise CRM Customer State
  const [crmCustomers, setCrmCustomers] = useState([
    { id: 'CUST-01', name: 'م. أحمد الشريف', phone: '+201123456789', ltv: '3,500 EGP', segment: 'VIP Enterprise', chats: 14, invoices: 3, status: 'Active Buyer', agent: 'أحمد المبيعات' },
    { id: 'CUST-02', name: 'د. سارة عثمان', phone: '+201098765432', ltv: '1,200 EGP', segment: 'Pro User', chats: 8, invoices: 1, status: 'Pending Invoice', agent: 'الأستاذ صلاح' },
    { id: 'CUST-03', name: 'شركة النور للمقاولات', phone: '+201234567890', ltv: '8,900 EGP', segment: 'VIP Corporate', chats: 32, invoices: 6, status: 'Active Buyer', agent: 'كريم الديزاين' },
    { id: 'CUST-04', name: 'خالد عبد الفتاح', phone: '+201555443322', ltv: '450 EGP', segment: 'Standard Lead', chats: 4, invoices: 0, status: 'Lead Inquiry', agent: 'مهندس عمر الدعم' }
  ]);

  // Results Artifacts Gallery States
  const [resultSubTab, setResultSubTab] = useState<'invoices' | 'media' | 'calls'>('invoices');
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);


  const projectTemplates = [
    { name: '👗 متجر ملابس وأزياء أونلاين', customer: 'سارة الأحمدي', prompt: 'عايزة اعرف سعر باقة الفستان السواريه وطريقة الشراء بخصم 15%' },
    { name: '🏢 شركة استثمار وتطوير عقاري', customer: 'م. خالد فاروق', prompt: 'محتاج استشارة عن أسعار الشقق الفندقية في العاصمة وإتاحة خطة سداد' },
    { name: '💻 منصة اشتراكات برمجيات SaaS', customer: 'طارق رشدي', prompt: 'عمل فاتورة باقة السحابة الاحترافية بـ 1500 جنيه بخصم 10%' },
    { name: '🩺 عيادة طبية ومجمع استشارات', customer: 'د. منيرة حسن', prompt: 'حجز موعد استشارة جلدية ومتابعة وتأكيد التحويل فوراً' },
    { name: '🎓 أكاديمية تدريب وكورسات', customer: 'عمر شريف', prompt: 'عايز اشترك في كورس الذكاء الاصطناعي واعرف الحسابات المتاحة' },
    { name: '🍕 سلسلة مطاعم ووجبات سريعة', customer: 'أحمد زكي', prompt: 'طلب عرض وجبات الشركات 20 وجبة مع استخراج كرت تصميم العرض' },
    { name: '🚗 شركة تأجير سيارات ولوجستيات', customer: 'محمود الباز', prompt: 'تأجير سيارة مرسيدس لمدة 3 أيام واستخراج فاتورة تحصيل' },
    { name: '⚖️ مكتب استشارات قانونية وضرائب', customer: 'أشرف عبد المحسن', prompt: 'فتح تذكرة استشارة ضرائب 14% عاجلة وتخصيص مستشار قانوني' },
    { name: '✈️ شركة سياحة ورحلات خارجية', customer: 'نورهان جمال', prompt: 'حجز رحلة تركيا 5 أيام وتصميم بنر ترويجي للرحلة' },
    { name: '🛋️ متجر أثاث وتصميم داخلي', customer: 'إبراهيم علي', prompt: 'استفسار عن أسعار الركنة المودرن وتطبيق الخصم واستخراج الفاتورة' }
  ];

  const sampleInvoices = [
    { id: 'INV-94820', customer: 'د. طارق مصطفى', phone: '+201234567890', date: '2026-07-22', items: [{ name: 'اشتراك باقة المحترفين', qty: 1, price: 500 }], subtotal: 500, discount: 50, tax: 63, total: 513, currency: 'EGP', payUrl: 'https://pay.chatcore.com/inv-94820', status: 'paid' },
    { id: 'INV-88319', customer: 'شركة الأمل للتجارة', phone: '+201122334455', date: '2026-07-22', items: [{ name: 'ربط السيرفر السحابي + 2 سكريبت ذكاء اصطناعي', qty: 1, price: 1200 }], subtotal: 1200, discount: 200, tax: 140, total: 1140, currency: 'EGP', payUrl: 'https://pay.chatcore.com/inv-88319', status: 'pending' },
    { id: 'INV-77102', customer: 'م. خالد فاروق', phone: '+201009988776', date: '2026-07-21', items: [{ name: 'خدمات استشارية ومبيعات', qty: 1, price: 800 }], subtotal: 800, discount: 0, tax: 112, total: 912, currency: 'EGP', payUrl: 'https://pay.chatcore.com/inv-77102', status: 'paid' }
  ];

  const sampleMediaCards = [
    { id: 'MED-01', title: 'عرض الصيف الفاخر ☀️', subtitle: 'باقة الواتساب الذكية + 5 وكلاء ذكاء اصطناعي', price: '499 EGP', badge: 'خصم 30% لفترة محدودة ⚡', color: '#00a884', features: ['دعم فني 24/7', 'توليد فواتير آلي', 'مكالمات صوتية للذكاء الاصطناعي'] },
    { id: 'MED-02', title: 'باقة المؤسسات والشركات 🏢', subtitle: 'ربط ميتا الرسمي + بوابة سديد للدفع', price: '1,200 EGP', badge: 'الأكثر مبيعاً 🔥', color: '#8b5cf6', features: ['سيرفر خاص مخصص', 'تخصيص كامل للشخصيات', 'ربط الداتابيز المباشر'] }
  ];

  const sampleVoiceCalls = [
    { id: 'CALL-901', customer: 'د. طارق مصطفى', phone: '+201234567890', time: '10:55 AM', duration: '01:24', status: 'completed', agent: 'أحمد المبيعات', summary: 'تم شرح مميزات الباقة الاحترافية وتأكيد رغبة العميل بالاشتراك.' },
    { id: 'CALL-882', customer: 'م. حسام السيد', phone: '+201099887766', time: '09:30 AM', duration: '00:45', status: 'completed', agent: 'أحمد المبيعات', summary: 'تم الإجابة على استفسار ربط بوابة الدفع وكيفية إصدار الفواتير.' }
  ];

  // Development Agent Recommendations State
  const [recommendationsSummary, setRecommendationsSummary] = useState<string>('🚀 تقرير وكيل تطوير المنظومة (د. ياسر): المنظومة تعمل بكفاءة 98%، وتم تحليل الأداء وتقديم 4 توصيات لزيادة أرباح وسرعة المنظومة.');
  const [recommendationsList, setRecommendationsList] = useState([
    {
      id: 'SUG-101',
      title: 'تفعيل سكريبت الخصم المشجع للعملاء المترددين',
      category: 'sales',
      description: 'توجيه موظف المبيعات (أحمد) لعرض كود خصم 10% تلقائياً عندما يتجاوز تردد العميل 3 أسئلة متتالية عن السعر.',
      expectedImpact: '+22% زيادة في نسبة إغلاق المبيعات',
      difficulty: 'سهل ⚡',
      status: 'pending',
      agentId: 'agent_sales'
    },
    {
      id: 'SUG-102',
      title: 'تفعيل رابط السداد السريع في الفاتورة الأولى تلقائياً',
      category: 'performance',
      description: 'إلزام مسؤول الفواتير (الأستاذ صلاح) بإرفاق رابط الدفع ببنود الفاتورة فور استخراجها لتقليل وقت التحصيل.',
      expectedImpact: 'تقليل وقت السداد بنسبة 40%',
      difficulty: 'سهل ⚡',
      status: 'pending',
      agentId: 'agent_invoice'
    },
    {
      id: 'SUG-103',
      title: 'إطلاق كروت عرض زمردية فاخرة لباقة المنتجات الأكثر مبيعاً',
      category: 'media',
      description: 'توجيه صانع التصاميم (كريم) لتفعيل ثيم الزجاج الزمردي وتلقائياً إرفاق شارة "الأكثر مبيعاً 🔥".',
      expectedImpact: '+35% تفاعل على رسائل الواتساب المصورة',
      difficulty: 'متوسط 🛠️',
      status: 'pending',
      agentId: 'agent_media'
    },
    {
      id: 'SUG-104',
      title: 'الأتمتة التلقائية لتذاكر الدعم المعقدة مع الإخطار الفوري للمشرف',
      category: 'support',
      description: 'عند اكتشاف بلاغ تقني بدرجة أولوية عالية Urgent، يتم فتح التذكرة وإعادة توجيه الإشعار لـ WhatsApp المشرف.',
      expectedImpact: 'استجابة للأعطال الحرجة في أقل من 2 دقيقة',
      difficulty: 'متقدم 🧠',
      status: 'pending',
      agentId: 'agent_support'
    }
  ]);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleApplyRecommendation = (recId: string) => {
    setRecommendationsList(prev => prev.map(r => r.id === recId ? { ...r, status: 'applied' } : r));
    alert(isAr ? 'تم تطبيق التوصية وتحديث إعدادات المنظومة فوراً! ✨' : 'Recommendation applied successfully!');
  };

  const handleRunDevAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/agents/generate-recommendations', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditTime: Date.now() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.textSummary) {
          setRecommendationsSummary(data.textSummary);
        }
        if (data && data.suggestions) {
          setRecommendationsList(data.suggestions.map((s: any) => ({ ...s, status: 'pending' })));
        }
      } else {
        const { DevelopmentAgent } = await import('../agents/DevelopmentAgent');
        const devAgent = new DevelopmentAgent();
        const data = await devAgent.generateSystemRecommendations();
        setRecommendationsSummary(data.textSummary);
        setRecommendationsList(data.suggestions.map((s: any) => ({ ...s, status: 'pending' })));
      }
    } catch (err) {
      console.error('[Dev Audit Error]', err);
      try {
        const { DevelopmentAgent } = await import('../agents/DevelopmentAgent');
        const devAgent = new DevelopmentAgent();
        const data = await devAgent.generateSystemRecommendations();
        setRecommendationsSummary(data.textSummary);
        setRecommendationsList(data.suggestions.map((s: any) => ({ ...s, status: 'pending' })));
      } catch (e) {
        console.error('[Dev Audit Fallback Error]', e);
      }
    } finally {
      setIsAuditing(false);
    }
  };

  // Playground States
  const [playgroundAgentId, setPlaygroundAgentId] = useState<string>('agent_invoice');
  const [playgroundInput, setPlaygroundInput] = useState<string>('عمل فاتورة بـ 2 سكريبت ذكاء اصطناعي بخصم 100 جنيه');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playgroundOutput, setPlaygroundOutput] = useState<any>(null);

  const handleRunPlayground = async () => {
    if (!playgroundInput.trim()) return;
    setIsPlaying(true);
    setPlaygroundOutput(null);

    try {
      if (playgroundAgentId === 'agent_invoice') {
        const activeInvoiceAgent = agents.find(a => a.id === 'agent_invoice');
        const res = await fetch('/api/agents/generate-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            promptText: playgroundInput, 
            customerName: isAr ? 'أحمد علي' : 'Ahmed Ali',
            currency: activeInvoiceAgent?.guardrails?.currency || 'EGP'
          })
        });
        const data = await res.json();
        setPlaygroundOutput(data);
      } else if (playgroundAgentId === 'agent_media') {
        const res = await fetch('/api/agents/generate-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptText: playgroundInput })
        });
        const data = await res.json();
        setPlaygroundOutput(data);
      } else {
        const res = await fetch('/api/agents/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageText: playgroundInput, customerName: 'اختبار المنظومة' })
        });
        const data = await res.json();
        setPlaygroundOutput(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlaying(false);
    }
  };

  const defaultAgents: AgentConfig[] = [
    {
      id: 'agent_sales',
      name: isAr ? 'أحمد المبيعات (Sales Specialist)' : 'Sales & Booking Agent',
      nameEn: 'Sales Agent',
      role: 'sales',
      description: isAr ? 'المسؤول الأول عن استقبال العملاء المهتمين، تقديم العروض، إقناع العملاء، وتفعيل المكالمات الصوتية عند الجدية.' : 'Handles catalog inquiries, pricing recommendations, negotiation, and closing sales.',
      status: 'active',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      dialect: 'eg',
      systemPrompt: isAr 
        ? 'أنت "أحمد" موظف المبيعات والإغلاق الاحترافي لمنصة الواتساب. تتحدث بالعامية المصرية الحيوية والودودة. دورك الأساسي هو شرح مميزات الباقات والخدمات، الاستجابة لاستفسارات الأسعار، معالجة اعتراضات السعر بذكاء، ومحاولة إغلاق الصفقة (Sales Closing).' 
        : 'You are Ahmed, the elite Sales & Closing Agent. Engage warmly in Egyptian Arabic, pitch value propositions, handle price objections, apply max allowed discount, and trigger AI WhatsApp voice call when high intent is detected.',
      triggerKeywords: ['سعر', 'كام', 'اشتراك', 'عروض', 'خصم', 'اشتري', 'باقة', 'اتصل', 'تفاصيل'],
      responsibilities: [
        isAr ? 'استقبال ورعاية العملاء المهتمين وشرح مميزات الخدمات' : 'Instant response to catalog & pricing inquiries',
        isAr ? 'استخدام استراتيجيات إغلاق المبيعات (Sales Closing Tactics)' : 'Sales closing & objection handling',
        isAr ? 'تقديم خصومات ترويجية حصرية في حدود النسبة المسموحة' : 'Custom promotional discounts up to max allowed %',
        isAr ? 'إجراء وتفعيل المكالمات الصوتية التفاعلية عبر الواتساب' : 'Initiating interactive WhatsApp AI voice calls'
      ],
      guardrails: {
        maxDiscountPercent: 15,
        autoVoiceCall: true,
        autoPaymentLink: true,
        workingHours: '24/7 (على مدار الساعة)',
        salesStrategy: 'consultative'
      },
      metrics: { totalChats: 320, resolvedTickets: 24, avgResponseTime: '0.4s', customerSatisfaction: 98 },
      recentActivities: [
        { id: '1', time: '11:45 AM', action: isAr ? 'إتمام عملية بيع باقة احترافية (500 EGP)' : 'Closed Pro Sale (500 EGP)', status: 'success' },
        { id: '2', time: '11:30 AM', action: isAr ? 'إجراء مكالمة واتساب صوتية تفاعلية للعميل' : 'Initiated WhatsApp voice call with client', status: 'success' }
      ]
    },
    {
      id: 'agent_invoice',
      name: isAr ? 'الأستاذ صلاح الحسابات (Invoice Chief)' : 'Invoice & Billing Agent',
      nameEn: 'Invoice Agent',
      role: 'invoice',
      description: isAr ? 'المحاسب المالي المختص بتفنيذ البنود، حساب ضريبة القيمة المضافة 14%، وتوليد روابط سداد رسمية ومباشرة.' : 'Generates itemized invoices, calculates 14% VAT tax/discounts, creates secure instant payment links.',
      status: 'active',
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      dialect: 'msa',
      systemPrompt: isAr 
        ? 'أنت "الأستاذ صلاح" المحاسب المالي المعرف بالدقة والرصانة. تتحدث بالعربية الفصيحة البسيطة والمحاسبية. مهمتك تفنيد بنود الطلب، حساب المجموع الفرعي، تطبيق الخصم المستحق، حساب ضريبة القيمة المضافة 14%، وإصدار فاتورة رسمية برقم فريد مع رابط دفع آمن 100%.' 
        : 'You are Mr. Salah, the certified Accounting & Billing Officer. Extract line items, apply accurate 14% VAT, compute grand totals, and output clean structured invoices with payment links.',
      triggerKeywords: ['فاتورة', 'فاتوره', 'عرض سعر', 'رابط الدفع', 'حساب الطلب', 'ادفع كام', 'كوبون', 'حساب'],
      responsibilities: [
        isAr ? 'تفنيد بنود الفاتورة وحساب المجموع بدقة دقيقة 100%' : '100% precise itemization & price calculation',
        isAr ? 'حساب وتطبيق ضريبة القيمة المضافة (14% VAT)' : 'Automated 14% VAT computation',
        isAr ? 'توليد روابط دفع سريعة وآمنة ومباشرة عبر بوابة سديد' : 'Generating instant secure payment links',
        isAr ? 'إصدار وتجهيز فواتير PDF قابلة للطباعة والرصد' : 'Generating printable PDF invoices'
      ],
      guardrails: {
        maxDiscountPercent: 20,
        autoVoiceCall: false,
        autoPaymentLink: true,
        workingHours: '24/7 (على مدار الساعة)',
        taxRate: 14,
        currency: 'EGP',
        paymentGateway: 'ChatCore Pay'
      },
      metrics: { totalChats: 185, resolvedTickets: 0, avgResponseTime: '0.3s', customerSatisfaction: 99 },
      recentActivities: [
        { id: '3', time: '11:50 AM', action: isAr ? 'توليد فاتورة رسمية رقم #INV-94820' : 'Generated Invoice #INV-94820', status: 'success' },
        { id: '4', time: '11:20 AM', action: isAr ? 'إرسال رابط دفع سديد مباشر للعميل' : 'Dispatched payment link', status: 'success' }
      ]
    },
    {
      id: 'agent_media',
      name: isAr ? 'كريم الديزاين (Creative Media Agent)' : 'Design & Media Agent',
      nameEn: 'Media Agent',
      role: 'media',
      description: isAr ? 'المصمم المبدع المختص بصناعة كروت المنتجات البصرية، عروض الخصومات، والشارات الجذابة لإرسالها بالواتساب.' : 'Generates visual product offer cards, promotional quote banners, and graphics for WhatsApp.',
      status: 'active',
      model: 'gemini-2.5-flash',
      temperature: 0.8,
      dialect: 'eg',
      systemPrompt: isAr 
        ? 'أنت "كريم" المصمم المبدع وصانع البصريات. تتحدث بأسلوب شبابي ترويجي ممتع ومفعم بالألوان✨. دورك تصميم بطاقة ترويجية جذابة للعرض مع شارات مثل "خصم حصري" أو "الأكثر مبيعاً" وكتابة كابشن تسويقي يرافق الصورة على الواتساب.' 
        : 'You are Kareem, the Creative Design Agent. Design eye-catching product offer cards with custom badges, features bullets, and vivid marketing captions for WhatsApp media dispatch.',
      triggerKeywords: ['صورة', 'تصميم', 'ارسم', 'صورة المنتج', 'بنر', 'كارت', 'بوستر', 'شكل'],
      responsibilities: [
        isAr ? 'تصميم كروت عروض منتجات بصرية جذابة بدقة عالية' : 'Designing high-converting product offer cards',
        isAr ? 'إضافة شارات ترويجية حصرية (خصم 30% لفترة محدودة)' : 'Adding promotional badges & discount callouts',
        isAr ? 'صياغة نصوص تسويقية بصرية سريعة الانتشار' : 'Crafting viral visual marketing copy',
        isAr ? 'تخصيص الألوان والسمة البصرية حسب الهوية' : 'Customizing visual themes & brand colors'
      ],
      guardrails: {
        maxDiscountPercent: 25,
        autoVoiceCall: false,
        autoPaymentLink: false,
        workingHours: '24/7 (على مدار الساعة)',
        cardTheme: 'vibrant_emerald',
        primaryBadge: 'خصم 30% لفترة محدودة ⚡'
      },
      metrics: { totalChats: 140, resolvedTickets: 0, avgResponseTime: '0.7s', customerSatisfaction: 97 },
      recentActivities: [
        { id: '5', time: '11:38 AM', action: isAr ? 'تصميم كارت عرض بكتالوج المنتجات مع شارة الخصم' : 'Designed product offer card with discount badge', status: 'success' }
      ]
    },
    {
      id: 'agent_support',
      name: isAr ? 'مهندس عمر الدعم الفني (Support Agent)' : 'Support & Ticketing Agent',
      nameEn: 'Support Agent',
      role: 'support',
      description: isAr ? 'المسؤول التقني الصبور عن استقبال الأعطال، فتح تذاكر بالداتابيز #TCK-XXXX، وتقديم خطوات الحل فوراً.' : 'Handles technical issues, logs database tickets, prioritizes severity, and provides step-by-step guidance.',
      status: 'busy',
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      dialect: 'msa',
      systemPrompt: isAr 
        ? 'أنت "مهندس عمر" مسؤول الدعم الفني. تتحدث بأسلوب صبور وطمأنينة عالية🛠️. تقوم بتشخيص المشكلة التقنية فوراً، إعطاء تذكرة رسمية برقم فريد #TCK-XXXXXX، إرشاد العميل بخطوات سريعة للحل، وتصعيد الحالات المعقدة للمشرف البشري.' 
        : 'You are Eng. Omar, the Lead Support Officer. Reassure users encountering issues, diagnose root causes, issue unique ticket #TCK-XXXXXX, provide troubleshooting steps, or escalate to human operator.',
      triggerKeywords: ['مشكلة', 'عطل', 'تذكرة', 'دعم فني', 'مش شغال', 'خطأ', 'توقف', 'بطيء', 'ساعدني'],
      responsibilities: [
        isAr ? 'تشخيص واستقبال بلاغات الأعطال التقنية فوراً' : 'Instant technical fault diagnosis & triage',
        isAr ? 'إنشاء وتتبع تذاكر الدعم الفني برقم فريد (#TCK-XXXX)' : 'Logging & tracking unique DB support tickets',
        isAr ? 'تقديم خطوات استكشاف الأخطاء وإصلاحها بوضوح' : 'Step-by-step technical troubleshooting',
        isAr ? 'تحويل البلاغات المعقدة إلى العنصر البشري فوراً' : 'Seamless escalation to human technical team'
      ],
      guardrails: {
        maxDiscountPercent: 0,
        autoVoiceCall: true,
        autoPaymentLink: false,
        workingHours: '24/7 (على مدار الساعة)',
        ticketPrefix: 'TCK'
      },
      metrics: { totalChats: 210, resolvedTickets: 168, avgResponseTime: '0.5s', customerSatisfaction: 95 },
      recentActivities: [
        { id: '6', time: '11:10 AM', action: isAr ? 'فتح تذكرة دعم فني جديدة #TCK-3819 ومعالجة مشكلة الربط' : 'Created ticket #TCK-3819 & resolved sync', status: 'success' }
      ]
    },
    {
      id: 'agent_marketing',
      name: isAr ? 'مارينا التسويق والحملات (Marketing & Campaigns Agent)' : 'Marketing & Bulk Campaign Agent',
      nameEn: 'Marketing Agent',
      role: 'marketing',
      description: isAr ? 'خبيرة التسويق وإطلاق الحملات المباشرة، جدولة المراسلات، وتقسيم العملاء لزيادة مبيعات الشركة.' : 'Specialist in launching target WhatsApp marketing campaigns, audience segmentation, and open rate analytics.',
      status: 'active',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      dialect: 'eg',
      systemPrompt: isAr 
        ? 'أنت "مارينا" خبيرة التسويق وإطلاق الحملات المستهدفة على الواتساب. مهمتك جدولة المراسلات المباشرة، صياغة محتوى ترويجي جذاب، وتقسيم شرائح العملاء لتحقيق أعلى معدل فتح (Open Rate).' 
        : 'You are Marina, Chief Marketing Officer. Craft target WhatsApp broadcasts, segment audiences, and drive sales retention.',
      triggerKeywords: ['تسويق', 'حملة', 'إعلان', 'ارسل للكل', 'جدولة', 'عروض الموسم'],
      responsibilities: [
        isAr ? 'إعادة استهداف العملاء المترددين بحملات واتساب المباشرة' : 'Launching direct targeted WhatsApp bulk campaigns',
        isAr ? 'تقسيم العملاء إلى شرائح (VIP / الجدد / غير التفاعليين)' : 'Audience segmentation & RFM analysis',
        isAr ? 'قياس نسبة الفتح (Open Rate) ومعدل الاستجابة' : 'Tracking campaign open rates & ROI metrics',
        isAr ? 'صياغة نصوص ترويجية قصيرة ومحفزة للشراء' : 'Crafting high-converting promo broadcast copy'
      ],
      guardrails: {
        maxDiscountPercent: 20,
        autoVoiceCall: false,
        autoPaymentLink: true,
        workingHours: '24/7 (على مدار الساعة)'
      },
      metrics: { totalChats: 450, resolvedTickets: 0, avgResponseTime: '0.3s', customerSatisfaction: 96 },
      recentActivities: [
        { id: '9', time: '10:00 AM', action: isAr ? 'إطلاق حملة العرض الصيفي لـ 120 عميل VIP بنجاح' : 'Launched Summer Campaign to 120 VIPs', status: 'success' }
      ]
    },
    {
      id: 'agent_router',
      name: isAr ? 'الكابتن المشرف العام (Master Router)' : 'Master Router Agent',
      nameEn: 'Router Agent',
      role: 'router',
      description: isAr ? 'العقل الفائق المنظم للمنظومة الذي يحلل نية العميل بسرعة 0.2 ثانية ويوجه المحادثة للموظف المختص.' : 'Master Orchestrator analyzing customer intent and routing conversations to specialized agents.',
      status: 'active',
      model: 'gemini-2.5-flash',
      temperature: 0.1,
      dialect: 'msa',
      systemPrompt: isAr 
        ? 'أنت المشرف العام والموجه الذكي الفائق. مهمتك تحليل رسالة العميل وتصنيفها فوراً إلى: (فاتورة، تصميم صورة، مبيعات، دعم فني، مكالمة صوتية) وتحويلها للموظف المناسب بلحظية ودون أي تأخير.' 
        : 'You are the Master Router. Classify customer intent instantly into: invoice_request, media_request, sales_inquiry, support_request, or voice_call, delegating smoothly to the ideal sub-agent.',
      triggerKeywords: ['توجيه', 'مشرف', 'تحويل', 'مين معايا', 'مساعدة'],
      responsibilities: [
        isAr ? 'تحليل نية وسياق رسائل العملاء في أسرع من 0.2 ثانية' : '0.2s ultra-fast intent & sentiment classification',
        isAr ? 'توجيه المحادثة الذكي للموظف المتخصص (مبيعات/فواتير/صور/دعم)' : 'Intelligent routing to specialized sub-agents',
        isAr ? 'مراقبة مستوى جودة الردود والتنسيق بين الموظفين' : 'Quality monitoring & cross-agent coordination',
        isAr ? 'الكشف عن حالات الغضب والتحويل الفوري للبشر' : 'Sentiment detection & human escalation'
      ],
      guardrails: {
        maxDiscountPercent: 0,
        autoVoiceCall: true,
        autoPaymentLink: false,
        workingHours: '24/7 (على مدار الساعة)',
        confidenceThreshold: 85
      },
      metrics: { totalChats: 850, resolvedTickets: 0, avgResponseTime: '0.2s', customerSatisfaction: 99 },
      recentActivities: [
        { id: '7', time: '11:25 AM', action: isAr ? 'توجيه محادثة تلقائياً لمسؤول الفواتير والحسابات' : 'Routed chat to Invoice Agent', status: 'success' }
      ]
    },
    {
      id: 'agent_dev',
      name: isAr ? 'د. ياسر التطوير (System Growth Agent)' : 'System Growth Agent',
      nameEn: 'Development Agent',
      role: 'router',
      description: isAr ? 'خبير تطوير المنظومة المختص بتحليل كفاءة الردود، الكشف عن فرص النمو، وتقديم التوصيات البرمجية والتسويقية.' : 'System Evolution Consultant analyzing metrics, identifying sales bottlenecks, and recommending optimizations.',
      status: 'active',
      model: 'gemini-2.5-flash',
      temperature: 0.5,
      dialect: 'msa',
      systemPrompt: isAr ? 'أنت "د. ياسر" خبير ومستشار تطوير المنظومة. مهمتك تحليل أداء كافة الموظفين وتقديم توصيات لرفع كفاءة المنظومة.' : 'You are Dr. Yasser, Lead System Growth Officer. Analyze sub-agent performance and provide growth optimizations.',
      triggerKeywords: ['تطوير', 'تحديث', 'تحسين', 'تقرير الأداء', 'فرص النمو'],
      responsibilities: [
        isAr ? 'التحليل الاستراتيجي المستمر لسرعة وكفاءة ردود الوكلاء' : 'Continuous strategic audit of response speed & quality',
        isAr ? 'توليد توصيات نمو المبيعات وزيادة معدل التحويل' : 'Generating conversion rate optimization proposals',
        isAr ? 'تطبيق التحديثات البرمجية وضوابط الموظفين بنقرة واحدة' : 'One-click automated deployment of optimizations',
        isAr ? 'مراقبة رضا العملاء وتحديد نقاط الضعف في المحادثات' : 'Customer satisfaction & bottleneck monitoring'
      ],
      guardrails: {
        maxDiscountPercent: 0,
        autoVoiceCall: false,
        autoPaymentLink: false,
        workingHours: '24/7 (على مدار الساعة)'
      },
      metrics: { totalChats: 1200, resolvedTickets: 0, avgResponseTime: '0.1s', customerSatisfaction: 99 },
      recentActivities: [
        { id: '8', time: '11:55 AM', action: isAr ? 'إعادة تحليل أداء السيرفر وتوليد 4 توصيات لزيادة المبيعات' : 'Generated 4 growth recommendations', status: 'success' }
      ]
    }
  ];

  const [agents, setAgents] = useState<AgentConfig[]>(defaultAgents);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<AgentConfig | null>(null);




  useEffect(() => {
    fetch('/api/payment-settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.settings) {
          setVodafoneCashNo(data.settings.vodafoneCashNumber || '01020304050');
          setInstaPayId(data.settings.instaPayAddress || 'chatcore@instapay');
          setBankIbanNo(data.settings.bankAccountIban || 'EG1234567890123456789012345');
          setAccountHolderName(data.settings.accountHolderName || 'طارق رشدي (Tarek Roshdi)');
          setBankName(data.settings.bankName || 'البنك الأهلي المصري (NBE)');
          setTelegramBotToken(data.settings.telegramBotToken || '');
          if (data.settings.telegramBotInfo) {
            setTelegramBotInfo(data.settings.telegramBotInfo);
          } else if (data.settings.telegramBotToken) {
            // Auto fetch in background
            fetch('/api/telegram/test-bot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: data.settings.telegramBotToken })
            }).then(r => r.json()).then(d => {
              if (d.success && d.bot) setTelegramBotInfo(d.bot);
            }).catch(() => {});
          }
        }
      })
      .catch(err => console.log('Payment settings fallback', err));
  }, []);

  // Load Saved Agent Configs on Mount
  useEffect(() => {
    fetch('/api/agents/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.configs && Object.keys(data.configs).length > 0) {
          setAgents(prev => prev.map(a => data.configs[a.id] ? { ...a, ...data.configs[a.id] } : a));
        }
      })
      .catch(err => console.log('Using local default configs', err));
  }, []);


  const handleExecuteModalTask = async (customPrompt?: string) => {
    const promptToRun = customPrompt || directTaskInput;
    if (!promptToRun || !editingConfig) return;
    setIsExecutingDirectTask(true);
    setDirectTaskResult(null);

    try {
      let resData: any = null;
      if (editingConfig.role === 'invoice') {
        const res = await fetch('/api/agents/generate-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptText: promptToRun, customerName: 'عميل تكليف فوري', currency: editingConfig.guardrails?.currency || 'EGP' })
        });
        resData = await res.json();
      } else if (editingConfig.role === 'media') {
        const res = await fetch('/api/agents/generate-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptText: promptToRun })
        });
        resData = await res.json();
      } else if ((editingConfig.role as string) === 'dev' || (editingConfig.role as string) === 'dev') {
        const res = await fetch('/api/agents/generate-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptText: promptToRun })
        });
        resData = await res.json();
      } else {
        const res = await fetch('/api/agents/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageText: promptToRun, customerName: 'تكليف إداري مباشر' })
        });
        resData = await res.json();
      }

      setDirectTaskResult(resData);

      // Append to agent's live audit log
      const newActivity: { id: string; time: string; action: string; status: 'success' | 'warning' } = {
        id: String(Date.now()),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        action: `تكليف مباشر من الأدمن: "${promptToRun}"`,
        status: 'success'
      };

      const updatedActivities = [newActivity, ...(editingConfig.recentActivities || [])];
      setEditingConfig({ ...editingConfig, recentActivities: updatedActivities });
      setAgents(prev => prev.map(a => a.id === editingConfig.id ? { ...a, recentActivities: updatedActivities } : a));

    } catch (err: any) {
      setDirectTaskResult({ error: err.message || 'حدث خطأ أثناء تنفيذ المهمة' });
    } finally {
      setIsExecutingDirectTask(false);
    }
  };

  const handleOpenConfig = (agent: AgentConfig) => {
    setSelectedAgent(agent);
    setEditingConfig(JSON.parse(JSON.stringify(agent)));
    setActiveTab('identity');
    setDirectTaskInput('');
    setDirectTaskResult(null);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    try {
      await fetch('/api/agents/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: editingConfig.id,
          config: editingConfig
        })
      });
      setAgents(prev => prev.map(a => a.id === editingConfig.id ? editingConfig : a));
      setSelectedAgent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyPreset = (role: string) => {
    if (!editingConfig) return;
    const defaultMatch = defaultAgents.find(a => a.role === role);
    if (defaultMatch) {
      setEditingConfig({
        ...editingConfig,
        name: defaultMatch.name,
        systemPrompt: defaultMatch.systemPrompt,
        responsibilities: [...defaultMatch.responsibilities],
        triggerKeywords: [...defaultMatch.triggerKeywords],
        guardrails: { ...defaultMatch.guardrails }
      });
    }
  };

  const handleResetAllToEnterprise = async () => {
    if (!window.confirm(isAr ? 'هل أنت تأكد من استعادة النموذج القياسي الذهب لجميع الموظفين؟' : 'Reset all agents to Gold Presets?')) return;
    setAgents(defaultAgents);
    for (const ag of defaultAgents) {
      await fetch('/api/agents/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: ag.id, config: ag })
      });
    }
    alert(isAr ? 'تم ضبط واحترافية جميع الموظفين بنجاح!' : 'All agents reset to Enterprise Presets!');
  };

  const handleCreateCampaign = () => {
    if (!newCampaignName.trim()) return;
    const newCamp = {
      id: `CMP-${103 + campaignsList.length}`,
      name: newCampaignName,
      audience: newCampaignAudience === 'vip' ? 'عملاء VIP (120 عميل)' : newCampaignAudience === 'inactive' ? 'عملاء خاملون (250 عميل)' : 'جميع العملاء (1,695 عميل)',
      status: 'sent',
      sentCount: newCampaignAudience === 'vip' ? 120 : newCampaignAudience === 'inactive' ? 250 : 1695,
      openRate: '92%',
      conversions: 18,
      revenue: '9,000 EGP',
      time: 'الآن (Now)'
    };
    setCampaignsList([newCamp, ...campaignsList]);
    setNewCampaignName('');
    alert(isAr ? 'تم إطلاق حملة الواتساب بنجاح وتوجيه مارينا التسويق للبدء! 🚀' : 'Campaign launched successfully!');
  };

  const filteredTickets = ticketsList.filter(t => {
    const matchesFilter = ticketFilter === 'all' || t.status === ticketFilter;
    const matchesSearch = t.id.toLowerCase().includes(ticketSearch.toLowerCase()) || 
                          t.customer.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                          t.issue.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 bg-[#f0f2f5] dark:bg-zinc-950 flex flex-col h-screen overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-500" />
            {isAr ? 'مركز قيادة الشركة وإدارة الموظفين الذكي (Enterprise AI Headquarters)' : 'AI Enterprise Headquarters'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isAr ? 'التحكم الإجمالي بالمقر الرئيسي للشركة: طاقم الموظفين، الحملات، التذاكر، دليل العملاء CRM، والتقارير التنفيذية' : 'Full enterprise suite: Agents roster, campaigns, tickets, CRM directory, and executive analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAllToEnterprise}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isAr ? 'إعادة ضبط النماذج القياسية' : 'Reset Enterprise Presets'}
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            {isAr ? '7 أقسام متكاملة 100%' : '7 Departments Active'}
          </span>
        </div>
      </header>

      {/* Main Module Hub Switcher Navigation Bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-2 flex items-center gap-2 text-xs font-bold shrink-0 overflow-x-auto">
        <button
          onClick={() => setMainHubTab('roster')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'roster' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <UserCog className="w-4 h-4" />
          {isAr ? '👥 طاقم الموظفين (AI Roster)' : 'AI Staff Roster'}
        </button>

        <button
          onClick={() => setMainHubTab('dev_agent')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer relative whitespace-nowrap ${
            mainHubTab === 'dev_agent' 
              ? 'bg-purple-600 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          {isAr ? '💡 وكيل التطوير والتحسين (Evolution Hub)' : 'AI Evolution Hub'}
        </button>

        <button
          onClick={() => setMainHubTab('marketing')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'marketing' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4 text-pink-400" />
          {isAr ? '📢 الحملات والتسويق (Campaigns)' : 'Marketing Campaigns'}
        </button>

        <button
          onClick={() => setMainHubTab('tickets')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'tickets' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4" />
          {isAr ? '🎫 نظام التذاكر (Tickets)' : 'Support Tickets'}
        </button>

        <button
          onClick={() => setMainHubTab('crm')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'crm' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          {isAr ? '💼 سجل العملاء (Enterprise CRM)' : 'Customer Directory CRM'}
        </button>

        <button
          onClick={() => setMainHubTab('analytics')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'analytics' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          {isAr ? '📊 الأرباح والأداء (Executive Analytics)' : 'Executive Analytics'}
        </button>

        <button
          onClick={() => setMainHubTab('telegram')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'telegram' 
              ? 'bg-sky-500 text-white shadow-xs font-bold' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4 text-sky-400" />
          {isAr ? '✈️ ربط وتكامل التليجرام' : 'Telegram Bot Integration'}
        </button>

        <button
          onClick={() => setMainHubTab('payments')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'payments' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          {isAr ? '💳 طرق المحافظ و InstaPay' : 'Payment Methods & Gateways'}
        </button>

        <button
          onClick={() => setMainHubTab('playground')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'playground' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
          {isAr ? '🧪 التطبيق العملي واختبار المنظومة' : 'Live Interactive Playground'}
        </button>

        <button
          onClick={() => setMainHubTab('results')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            mainHubTab === 'results' 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          {isAr ? '📦 معرض نتائج ومخرجات الوكلاء' : 'AI Artifacts Gallery'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* VIEW 1: AI EMPLOYEES ROSTER */}
          {mainHubTab === 'roster' && (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{isAr ? 'إجمالي مهام الموظفين' : 'Total Agent Tasks'}</h3>
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">1,695</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {isAr ? '100% كفاءة وتخصيص استجابة' : '100% automated response rate'}
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{isAr ? 'الفواتير الصادرة آلياً' : 'Automated Invoices'}</h3>
                    <DollarSign className="w-5 h-5 text-sky-500" />
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">185</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{isAr ? 'فاتورة مع روابط سداد سريعة' : 'Invoices generated with payment links'}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{isAr ? 'التصاميم والكروت البصرية' : 'Design Cards Generated'}</h3>
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">140</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{isAr ? 'بطاقة عرض بصرية تم إرسالها' : 'Visual cards sent via WhatsApp'}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{isAr ? 'متوسط سرعة الإنجاز' : 'Avg Execution Speed'}</h3>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">0.3s</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{isAr ? 'استجابة فائقة السرعة والدقة' : 'Ultra-fast execution'}</p>
                </div>
              </div>

              {/* AI Employees Roster Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <UserCog className="w-5 h-5 text-emerald-500" />
                      {isAr ? 'طاقم الموظفين الذكي وتوزيع الأدوار (AI Staff Roster)' : 'AI Agents Roster'}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {isAr ? 'لكل موظف شخصية ودور وظيفي وضوابط فنية مخصصة بالكامل تضمن الاحترافية العالية' : 'Every agent has a distinct personality, job scope, and technical guardrails'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agents.map((agent) => (
                    <div key={agent.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs flex flex-col hover:border-emerald-500/50 transition-all">
                      
                      {/* Header */}
                      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/60">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${
                              agent.role === 'sales' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400' :
                              agent.role === 'invoice' ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400' :
                              agent.role === 'media' ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400' :
                              agent.role === 'marketing' ? 'bg-pink-100 text-pink-600 dark:bg-pink-950/80 dark:text-pink-400' :
                              agent.role === 'support' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400' :
                              'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400'
                            }`}>
                              {agent.role === 'sales' && <Bot className="w-6 h-6" />}
                              {agent.role === 'invoice' && <FileText className="w-6 h-6" />}
                              {agent.role === 'media' && <ImageIcon className="w-6 h-6" />}
                              {agent.role === 'marketing' && <Megaphone className="w-6 h-6" />}
                              {agent.role === 'support' && <Wrench className="w-6 h-6" />}
                              {agent.role === 'router' && <Sparkles className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{agent.name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded font-mono">{agent.model}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 rounded font-bold">
                                  {agent.dialect === 'eg' ? 'عامية مصرية 🇪🇬' : agent.dialect === 'sa' ? 'خليجية 🇸🇦' : 'فصحى 🌐'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[36px]">
                          {agent.description}
                        </p>
                      </div>

                      {/* Detailed Responsibilities */}
                      <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2 border-b border-zinc-100 dark:border-zinc-800 flex-1">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                          <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                          {isAr ? 'المهام والمسؤوليات الرئيسية بالكامل:' : 'Key Job Responsibilities:'}
                        </span>
                        <ul className="space-y-1">
                          {agent.responsibilities.map((resp, idx) => (
                            <li key={idx} className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 leading-snug">
                              <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="p-4 bg-white dark:bg-zinc-900 mt-auto flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenConfig(agent)}
                          className="flex-1 py-2 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          {isAr ? 'التحكم التفصيلي والإعدادات' : 'Granular Control & Settings'}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              {/* INTERACTIVE AI AGENT PLAYGROUND CONSOLE */}
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 rounded-2xl border border-zinc-800 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">مركز اختبار وتجربة الموظفين الأذكياء الأحياء (Live Agent Playground)</h3>
                      <p className="text-xs text-zinc-400">اختر أي موظف واكتب رسالة العميل لاختبار الاستجابة وتوليد المخرجات فوراً</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    محاكي السيرفر الحي
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1.5">اختر الموظف لاختبار الرد:</label>
                    <select
                      value={playgroundAgentId}
                      onChange={e => setPlaygroundAgentId(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500 font-sans"
                    >
                      {agents.map(ag => (
                        <option key={ag.id} value={ag.id}>{ag.name} ({ag.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-zinc-300 mb-1.5">رسالة العميل التجريبية:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={playgroundInput}
                        onChange={e => setPlaygroundInput(e.target.value)}
                        placeholder="اكتب هنا ما يقوله العميل..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500 font-sans"
                      />
                      <button
                        onClick={handleRunPlayground}
                        disabled={isPlaying}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        {isPlaying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isPlaying ? 'جاري التوليد...' : 'اختبار الرد'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Output Console Result */}
                {playgroundOutput && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 animate-fade-in text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-2">
                      <span className="text-emerald-400 font-bold">✨ نتيجة رد الذكاء الاصطناعي (Agent Output Log):</span>
                      <span>استجابة في 0.28s</span>
                    </div>
                    <pre className="text-zinc-300 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {typeof playgroundOutput === 'string' 
                        ? playgroundOutput 
                        : JSON.stringify(playgroundOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              </div>
            </>
          )}

          {/* VIEW 2: SYSTEM AI EVOLUTION & RECOMMENDATIONS HUB (وكيل تطوير المنظومة) */}
          {mainHubTab === 'dev_agent' && (
            <div className="space-y-6">
              {/* Development Agent Banner Header */}
              <div className="bg-gradient-to-br from-purple-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-purple-500/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
                    <Lightbulb className="w-7 h-7 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white">{isAr ? 'د. ياسر (وكيل تطوير وتحديث المنظومة)' : 'Dr. Yasser (System Growth Agent)'}</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-bold border border-purple-400/30">مستشار التطوير AI</span>
                    </div>
                    <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">{recommendationsSummary}</p>
                  </div>
                </div>

                <button
                  onClick={handleRunDevAudit}
                  disabled={isAuditing}
                  className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {isAr ? 'جاري الفحص واستخراج التوصيات...' : 'Analyzing Metrics...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      {isAr ? 'إعادة فحص وتحليل المنظومة الآن' : 'Run Fresh AI System Audit'}
                    </>
                  )}
                </button>
              </div>

              {/* Recommendations List Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    {isAr ? 'توصيات وفرص تطوير المنظومة المتاحة للتطبيق:' : 'Actionable Growth Recommendations:'}
                  </h3>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{recommendationsList.length} توصيات مكتشفة</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendationsList.map((rec) => (
                    <div key={rec.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-500/50 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-500" />
                            #{rec.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                              {rec.expectedImpact}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px]">
                              {rec.difficulty}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{rec.title}</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{rec.description}</p>
                      </div>

                      <div className="pt-2">
                        {rec.status === 'applied' ? (
                          <div className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            {isAr ? 'تم تطبيق التوصية وتحديث المنظومة ✨' : 'Applied Successfully'}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyRecommendation(rec.id)}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                            {isAr ? 'تطبيق التوصية فوراً بنقرة واحدة' : 'Apply Recommendation Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: MARKETING & WHATSAPP BULK CAMPAIGNS HUB (قسم الحملات والتسويق - مارينا) */}
          {mainHubTab === 'marketing' && (
            <div className="space-y-6">
              {/* Campaign Creation Card */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">إطلاق حملة تسويقية جديدة عبر الواتساب (Launch Bulk Campaign)</h3>
                    <p className="text-xs text-zinc-500">توجيه "مارينا التسويق" لإرسال رسالة ترويجية جماعية مستهدفة لشرائح العملاء</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">اسم الحملة التسويقية:</label>
                    <input
                      type="text"
                      value={newCampaignName}
                      onChange={e => setNewCampaignName(e.target.value)}
                      placeholder="مثال: خصم نهاية الأسبوع 20%..."
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-2.5 outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">الشريحة المستهدفة (Audience Segment):</label>
                    <select
                      value={newCampaignAudience}
                      onChange={e => setNewCampaignAudience(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-2.5 outline-none"
                    >
                      <option value="all">جميع العملاء في القاعدة (1,695 عميل)</option>
                      <option value="vip">عملاء VIP المميزون فقط (120 عميل)</option>
                      <option value="inactive">العملاء غير التفاعليين منذ 7 أيام (250 عميل)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleCreateCampaign}
                      className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      إطلاق وإرسال الحملة الآن 🚀
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Campaigns Table */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-pink-500" />
                  سجل الحملات التسويقية السابقة والنتائج (#Campaign History)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-3">رقم الحملة</th>
                        <th className="p-3">اسم الحملة</th>
                        <th className="p-3">الجمهور المستهدف</th>
                        <th className="p-3">المستلمين</th>
                        <th className="p-3">نسبة الفتح (Open Rate)</th>
                        <th className="p-3">عدد المبيعات</th>
                        <th className="p-3">الإيراد المحقق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {campaignsList.map((c, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                          <td className="p-3 font-mono font-bold text-pink-600 dark:text-pink-400">{c.id}</td>
                          <td className="p-3 font-bold text-zinc-900 dark:text-white">{c.name}</td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-300">{c.audience}</td>
                          <td className="p-3 font-mono">{c.sentCount}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{c.openRate}</td>
                          <td className="p-3 font-bold">{c.conversions} مبيعات</td>
                          <td className="p-3 font-bold text-sky-600 dark:text-sky-400">{c.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: SUPPORT TICKETS HUB (نظام التذاكر للدعم الفني) */}
          {mainHubTab === 'tickets' && (
            <div className="space-y-6">
              {/* Top Ticketing KPI Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">{isAr ? 'إجمالي التذاكر' : 'Total Tickets'}</span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">42</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs">
                  <span className="text-xs text-amber-700 dark:text-amber-400 block mb-1 font-bold">{isAr ? 'تذاكر مفتوحة' : 'Open'}</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">12</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-sky-200 dark:border-sky-900/30 bg-sky-50/20 dark:bg-sky-950/20 shadow-xs">
                  <span className="text-xs text-sky-700 dark:text-sky-400 block mb-1 font-bold">{isAr ? 'قيد المعالجة' : 'In Progress'}</span>
                  <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">8</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1 font-bold">{isAr ? 'تم الحل بنجاح' : 'Resolved'}</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">19</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-purple-200 dark:border-purple-900/30 bg-purple-50/20 dark:bg-purple-950/20 shadow-xs">
                  <span className="text-xs text-purple-700 dark:text-purple-400 block mb-1 font-bold">{isAr ? 'محولة للبشر' : 'Escalated to Human'}</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
              </div>

              {/* Ticketing Table Header Controls */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-emerald-500" />
                      {isAr ? 'قائمة وتتبع تذاكر الدعم الفني (#TCK Logs)' : 'Support Tickets Log'}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {isAr ? 'يتم إنشاء التذاكر تلقائياً عبر "مهندس عمر الدعم" أو يدوياً عبر هذا القسم' : 'Logged automatically by Support Agent or created manually'}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg text-xs font-bold">
                    <button onClick={() => setTicketFilter('all')} className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${ticketFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs' : 'text-zinc-500'}`}>الجميع ({ticketsList.length})</button>
                    <button onClick={() => setTicketFilter('open')} className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${ticketFilter === 'open' ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-xs' : 'text-zinc-500'}`}>مفتوحة</button>
                    <button onClick={() => setTicketFilter('in_progress')} className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${ticketFilter === 'in_progress' ? 'bg-white dark:bg-zinc-900 text-sky-600 shadow-xs' : 'text-zinc-500'}`}>جارِ المتابعة</button>
                    <button onClick={() => setTicketFilter('resolved')} className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${ticketFilter === 'resolved' ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs' : 'text-zinc-500'}`}>تم الحل</button>
                    <button onClick={() => setTicketFilter('escalated')} className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${ticketFilter === 'escalated' ? 'bg-white dark:bg-zinc-900 text-purple-600 shadow-xs' : 'text-zinc-500'}`}>محولة للبشر</button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute ltr:left-3 rtl:right-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)}
                    placeholder={isAr ? 'بحث برقم التذكرة #TCK، اسم العميل، أو موضوع البلاغ...' : 'Search ticket...'}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg ltr:pl-9 rtl:pr-9 py-2 text-xs outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                {/* Tickets Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-3">رقم التذكرة</th>
                        <th className="p-3">اسم العميل</th>
                        <th className="p-3">الأهمية</th>
                        <th className="p-3">موضوع البلاغ / المشكلة</th>
                        <th className="p-3">المسؤول عن الحل</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {filteredTickets.map((t, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.id}</td>
                          <td className="p-3 font-medium text-zinc-900 dark:text-white">
                            {t.customer}
                            <span className="block text-[10px] text-zinc-400 font-mono">{t.phone}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              t.priority === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                              t.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                              'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="p-3 max-w-[280px] truncate text-zinc-700 dark:text-zinc-300 font-medium">{t.issue}</td>
                          <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">{t.assignedTo}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                              t.status === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                              t.status === 'in_progress' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400' :
                              'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                            }`}>
                              {t.status === 'resolved' ? 'تم الحل بنجاح' : t.status === 'open' ? 'مفتوحة جديدة' : t.status === 'in_progress' ? 'جارِ المعالجة' : 'تحويل للمشرف'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedTicketModal(t)}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              عرض الحل والتعديل
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: ENTERPRISE CUSTOMER CRM DIRECTORY (سجل العملاء والتفاعلات) */}
          {mainHubTab === 'crm' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white">دليل قاعدة بيانات العملاء والتفاعلات (Enterprise CRM Directory)</h3>
                      <p className="text-xs text-zinc-500">سجل شامل بقيمة كل عميل (LTV)، رصيد المحادثات والفواتير، والموظف المباشر المخصص له</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    1,695 عميل مسجل
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-3">رقم العميل</th>
                        <th className="p-3">اسم العميل ورقم الواتساب</th>
                        <th className="p-3">القيمة التراكمية (LTV)</th>
                        <th className="p-3">شريحة العميل</th>
                        <th className="p-3">عدد المحادثات</th>
                        <th className="p-3">حالة العميل الحالية</th>
                        <th className="p-3">الموظف المسؤول عنه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {crmCustomers.map((c, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.id}</td>
                          <td className="p-3 font-bold text-zinc-900 dark:text-white">
                            {c.name}
                            <span className="block text-[10px] text-zinc-400 font-mono">{c.phone}</span>
                          </td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{c.ltv}</td>
                          <td className="p-3 font-semibold text-purple-600 dark:text-purple-400">{c.segment}</td>
                          <td className="p-3 font-mono">{c.chats} محادثة</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{c.agent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: EXECUTIVE BI & FINANCIAL ANALYTICS (الأرباح وتقارير الأداء) */}
          {mainHubTab === 'analytics' && (
            <div className="space-y-6">
              {/* Financial KPI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-900 to-zinc-900 text-white p-5 rounded-2xl border border-emerald-500/40 shadow-lg">
                  <span className="text-xs text-emerald-300 block mb-1 font-bold">إجمالي أرباح الشهر (Gross Revenue)</span>
                  <span className="text-3xl font-extrabold text-white">48,500 EGP</span>
                  <span className="text-xs text-emerald-400 block mt-2 font-semibold">↑ +28% مقارنة بالشهر السابق</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <span className="text-xs text-zinc-500 block mb-1">معدل تحويل المبيعات (Conversion Rate)</span>
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">68.4%</span>
                  <span className="text-xs text-emerald-600 block mt-2 font-semibold">ممتاز - أعلى من المتوسط</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <span className="text-xs text-zinc-500 block mb-1">متوسط قيمة الفاتورة (AOV)</span>
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">615 EGP</span>
                  <span className="text-xs text-sky-600 block mt-2 font-semibold">شاملة 14% VAT</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <span className="text-xs text-zinc-500 block mb-1">كفاءة الموظفين الإجمالية</span>
                  <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">98.5%</span>
                  <span className="text-xs text-purple-500 block mt-2 font-semibold">دون تدخل بشري</span>
                </div>
              </div>

              {/* Conversion Funnel Visualization */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  قمع تحويل العملاء الإجمالي (Sales & Conversion Funnel)
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>إجمالي محادثات العملاء المستقبلة (Incoming Leads)</span>
                      <span>1,695 (100%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>تقديم العروض والأسعار (Ahmed Sales Pitch)</span>
                      <span>1,150 (67.8%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full w-[67.8%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>استخراج الفواتير ورابط الدفع (Salah Billing)</span>
                      <span>385 (22.7%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full w-[22.7%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>إتمام السداد والدفع الفعلي (Closed Paid Orders)</span>
                      <span>310 (18.2%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full w-[18.2%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          
          {/* VIEW 10: TELEGRAM BOT INTEGRATION HUB */}
          {mainHubTab === 'telegram' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center justify-center font-bold text-xl shrink-0">
                      ✈️
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        إعدادات ورصد تليجرام بوت (Telegram Bot API Control & Telemetry)
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        التحكم الكامل في تشغيل وإيقاف البوت، وإرسال الردود، والربط المباشر مع طاقم الوكلاء الـ 6
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs ${telegramActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${telegramActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {telegramActive ? 'متصل ونشط حياً (Online 🟢)' : 'متوقف ومغلق مؤقتاً (Offline 🔴)'}
                    </span>
                  </div>
                </div>

                {/* Telemetry Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                    <span className="text-[11px] text-zinc-400 block font-semibold">حالة الاتصال بالسيرفر</span>
                    <span className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {telegramBotInfo ? `@${telegramBotInfo.username}` : 'جاهز للربط'}
                    </span>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                    <span className="text-[11px] text-zinc-400 block font-semibold">إجمالي الرسائل المستلمة</span>
                    <span className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">148 رسالة</span>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                    <span className="text-[11px] text-zinc-400 block font-semibold">إجمالي الردود الصادرة</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">148 رد موظف</span>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                    <span className="text-[11px] text-zinc-400 block font-semibold">متوسط سرعة الاستجابة</span>
                    <span className="text-lg font-bold font-mono text-purple-500">0.28s (فائق السرعة)</span>
                  </div>
                </div>

                {/* Main Settings Card */}
                <div className="bg-gradient-to-br from-sky-950 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-sky-500/40 text-white space-y-5 shadow-xl">
                  
                  {/* ON / OFF Switch Header */}
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-4">
                    <div>
                      <h3 className="font-bold text-sm text-sky-300 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-sky-400" />
                        حالة تشغيل البوت واستقبال رسائل العملاء (Online / Offline Toggle)
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        تحكم في تفعيل استقبال وتوجيه الرسائل لطاقم الوكلاء الـ 6 أو إيقافه مؤقتاً
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const newActive = !telegramActive;
                        setTelegramActive(newActive);
                        alert(newActive ? '🟢 تم تشغيل واستئناف بوت التليجرام واستقبال الرسائل!' : '🔴 تم إيقاف بوت التليجرام مؤقتاً!');
                      }}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-2 ${telegramActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                    >
                      {telegramActive ? 'تشغيل البوت (ONLINE 🟢)' : 'إيقاف مؤقت (OFFLINE 🔴)'}
                    </button>
                  </div>

                  {/* Token Input & Test Button */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold mb-1 text-zinc-300">توكن بوت التليجرام (Telegram Bot Token):</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={telegramBotToken}
                          onChange={e => {
                            const val = e.target.value;
                            setTelegramBotToken(val);
                            localStorage.setItem('chatcore_telegram_bot_token', val);
                          }}
                          placeholder="مثال: 7192849102:AAHd82ks91k..."
                          className="flex-1 bg-zinc-900 border border-sky-500/40 rounded-xl p-3 outline-none text-white font-mono text-xs focus:border-sky-400"
                        />
                        <button
                          onClick={async () => {
                            if (!telegramBotToken) return;
                            setIsTestingTelegram(true);
                            try {
                              const res = await fetch('/api/telegram/test-bot', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: telegramBotToken })
                              });
                              const data = await res.json();
                              if (data.success && data.bot) {
                                setTelegramBotInfo(data.bot);
                                localStorage.setItem('chatcore_telegram_bot_info', JSON.stringify(data.bot));
                                localStorage.setItem('chatcore_telegram_bot_token', telegramBotToken);
                            if (telegramBotInfo) localStorage.setItem('chatcore_telegram_bot_info', JSON.stringify(telegramBotInfo));
                                setTelegramActive(true);
                                alert(`✅ تم ربط واعتماذ البوت @${data.bot.username} بنجاح!`);
                              } else {
                                alert('⚠️ التوكن غير صحيح، يرجى التأكد من BotFather');
                              }
                            } catch (err) {
                              alert('حدث خطأ أثناء اختبار البوت');
                            } finally {
                              setIsTestingTelegram(false);
                            }
                          }}
                          disabled={isTestingTelegram || !telegramBotToken}
                          className="px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg"
                        >
                          {isTestingTelegram ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          ربط واختبار البوت الآن 🚀
                        </button>
                      </div>
                    </div>

                    {/* Action Bar: Permanent Save Settings */}
                    <div className="pt-3 flex justify-end border-t border-sky-500/20">
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/payment-settings', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                vodafoneCashNumber: vodafoneCashNo,
                                instaPayAddress: instaPayId,
                                bankAccountIban: bankIbanNo,
                                accountHolderName,
                                bankName,
                                telegramBotToken,
                                telegramBotEnabled: telegramActive,
                                transferNotes: ''
                              })
                            });
                            alert('💾 تم حفظ وترسيخ إعدادات وحالة تليجرام في السيرفر وقاعدة البيانات بنجاح!');
                          } catch (err) {
                            alert('حدث خطأ أثناء الحفظ');
                          }
                        }}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xl"
                      >
                        <CheckCircle className="w-4 h-4" />
                        💾 حفظ وتأكيد بيانات البوت والتشغيل الدائم
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW 8: PAYMENT METHODS & WALLETS CENTER */}
          {mainHubTab === 'payments' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-500" />
                      إدارة وسائل الدفع والمحافظ الإلكترونية (InstaPay & E-Wallets)
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      التحكم الكامل في أرقام المحافظ وعناوين إنستا باي المعروضة للعملاء ومتابعة الإيصالات اليدوية
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPaymentSettingsOpen(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Settings className="w-4 h-4" />
                    تحديث بيانات المحافظ و InstaPay
                  </button>
                </div>

                
                {/* Gateway Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-2xl border transition-all text-white space-y-3 shadow-xl ${gatewayToggles.instapayActive ? 'bg-gradient-to-br from-emerald-950/90 to-zinc-900 border-emerald-500/40' : 'bg-zinc-800/40 border-zinc-700 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-bold block">حساب إنستا باي الرسمي (InstaPay IPA)</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gatewayToggles.instapayActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300'}`}>
                        {gatewayToggles.instapayActive ? 'مفعل 🟢' : 'معطل 🔴'}
                      </span>
                    </div>
                    <span className="text-2xl font-mono font-extrabold text-white block">{instaPayId}</span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      معتمد للتحويلات الفورية 24/7 دون عمولة. يظهر تلقائياً للعملاء في رسائل الفواتير الشات.
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border transition-all text-white space-y-3 shadow-xl ${gatewayToggles.vodafoneActive ? 'bg-gradient-to-br from-rose-950/90 to-zinc-900 border-rose-500/40' : 'bg-zinc-800/40 border-zinc-700 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-300 font-bold block">رقم محفظة فودافون كاش (Vodafone Cash)</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gatewayToggles.vodafoneActive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-zinc-700 text-zinc-400'}`}>
                        {gatewayToggles.vodafoneActive ? 'مفعل 🟢' : 'معطل 🔴'}
                      </span>
                    </div>
                    <span className="text-2xl font-mono font-extrabold text-white block">{vodafoneCashNo}</span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      معتمد للاستلام الفوري من جميع المحافظ الذكية (فودافون، أورانج، اتصالات، وي).
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border transition-all text-white space-y-3 shadow-xl ${gatewayToggles.bankIbanActive ? 'bg-gradient-to-br from-sky-950/90 to-zinc-900 border-sky-500/40' : 'bg-zinc-800/40 border-zinc-700 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-sky-300 font-bold block">الحساب البنكي / رقم IBAN</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gatewayToggles.bankIbanActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-zinc-700 text-zinc-400'}`}>
                        {gatewayToggles.bankIbanActive ? 'مفعل 🟢' : 'معطل 🔴'}
                      </span>
                    </div>
                    <span className="text-base font-mono font-extrabold text-white block truncate">{bankIbanNo}</span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      مخصص للتحويلات البنكية المباشرة من البنوك المصرية والعربية والمؤسسات الكبرى.
                    </p>
                  </div>
                </div>

                
                {/* SERVICES & GATEWAYS ACTIVATION & TOGGLE CONTROL MATRIX */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-500" />
                    ماتريكس تفعيل وإيقاف وسائل الدفع والتكامل الذكي (Gateways & Integration Toggles)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block">استقبال تحويلات InstaPay IPA</span>
                        <span className="text-[10px] text-zinc-400">إظهار حساب InstaPay آلياً في فواتير الشات</span>
                      </div>
                      <button
                        onClick={() => setGatewayToggles(prev => ({ ...prev, instapayActive: !prev.instapayActive }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${gatewayToggles.instapayActive ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
                      >
                        {gatewayToggles.instapayActive ? 'تشغيل ON' : 'إيقاف OFF'}
                      </button>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block">استقبال محافظ فودافون كاش</span>
                        <span className="text-[10px] text-zinc-400">إظهار رقم المحفظة في الفواتير الصادرة</span>
                      </div>
                      <button
                        onClick={() => setGatewayToggles(prev => ({ ...prev, vodafoneActive: !prev.vodafoneActive }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${gatewayToggles.vodafoneActive ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
                      >
                        {gatewayToggles.vodafoneActive ? 'تشغيل ON' : 'إيقاف OFF'}
                      </button>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block">التحويل البنكي المباشر (IBAN)</span>
                        <span className="text-[10px] text-zinc-400">إظهار رقم الحساب البنكي للفواتير الكبيرة</span>
                      </div>
                      <button
                        onClick={() => setGatewayToggles(prev => ({ ...prev, bankIbanActive: !prev.bankIbanActive }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${gatewayToggles.bankIbanActive ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
                      >
                        {gatewayToggles.bankIbanActive ? 'تشغيل ON' : 'إيقاف OFF'}
                      </button>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block">إلزام رفع سكرين شوت الإيصال</span>
                        <span className="text-[10px] text-zinc-400">طالب العميل برفع صورة التحويل للاعتماد</span>
                      </div>
                      <button
                        onClick={() => setGatewayToggles(prev => ({ ...prev, requireScreenshot: !prev.requireScreenshot }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${gatewayToggles.requireScreenshot ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
                      >
                        {gatewayToggles.requireScreenshot ? 'تشغيل ON' : 'إيقاف OFF'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 9: LIVE INTERACTIVE PLAYGROUND */}
          {mainHubTab === 'playground' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    التطبيق العملي واختبار المنظومة المباشر (Live Multi-Agent Playground)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    اختر أي سيناريو من 10 مشاريع حقيقية أو اكتب طلب عميل مخصص لاختبار التسلسل التلقائي بين الوكلاء حياً على الشاشة
                  </p>
                </div>

                {/* Templates Selector */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {projectTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedPlaygroundProj(idx);
                        setPlaygroundCustomerName(tmpl.customer);
                        setPlaygroundCustomPrompt(tmpl.prompt);
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer text-xs font-bold space-y-1 ${
                        selectedPlaygroundProj === idx 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="block truncate font-bold">{tmpl.name}</span>
                      <span className="block text-[10px] text-zinc-400 font-normal">{tmpl.customer}</span>
                    </button>
                  ))}
                </div>

                {/* Simulation Input Box */}
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold">
                    <div>
                      <label className="block mb-1">اسم العميل في التجربة:</label>
                      <input
                        type="text"
                        value={playgroundCustomerName}
                        onChange={e => setPlaygroundCustomerName(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">طلب العميل المباشر:</label>
                      <input
                        type="text"
                        value={playgroundCustomPrompt}
                        onChange={e => setPlaygroundCustomPrompt(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={async () => {
                        setIsSimulatingLive(true);
                        setSimulationLogs([]);
                        try {
                          const res1 = await fetch('/api/agents/dispatch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin-tarek' },
                            body: JSON.stringify({ messageText: playgroundCustomPrompt, customerName: playgroundCustomerName })
                          });
                          const data1 = await res1.json();

                          const res2 = await fetch('/api/agents/generate-invoice', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin-tarek' },
                            body: JSON.stringify({ promptText: playgroundCustomPrompt, customerName: playgroundCustomerName })
                          });
                          const data2 = await res2.json();

                          setSimulationLogs([
                            { type: 'dispatch', agent: data1.suggestedAgent, response: data1.finalResponse },
                            { type: 'invoice', inv: data2.invoice }
                          ]);
                        } catch (err: any) {
                          console.error(err);
                        } finally {
                          setIsSimulatingLive(false);
                        }
                      }}
                      disabled={isSimulatingLive || !playgroundCustomPrompt}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      {isSimulatingLive ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      تشغيل التجربة العملية واختبار الرحلة كاملة 🚀
                    </button>
                  </div>
                </div>

                {/* Simulation Output Display */}
                {simulationLogs.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-fade-in">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      نتائج ومخرجات التجربة العملية المباشرة:
                    </h3>

                    {simulationLogs.map((log, i) => (
                      <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs space-y-2">
                        {log.type === 'dispatch' && (
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                              🤖 استجابة الوكيل الذكي: ({log.agent})
                            </span>
                            <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                              {log.response}
                            </p>
                          </div>
                        )}
                        {log.type === 'invoice' && log.inv && (
                          <div className="bg-white dark:bg-zinc-950 border-2 border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl text-zinc-900 dark:text-white">
                            {/* Invoice Header */}
                            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                              <div>
                                <h4 className="font-black text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                  <FileText className="w-5 h-5" />
                                  ChatCore Enterprise AI - فاتورة رسمية معتمدة
                                </h4>
                                <p className="text-[11px] text-zinc-400">الرقم الضريبي: 729-482-109 | سجل تجاري: 481920</p>
                              </div>
                              <div className="text-left">
                                <span className="font-mono font-bold text-base block text-emerald-500">#{log.inv.invoiceNumber}</span>
                                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded text-[10px] font-bold uppercase inline-block mt-1">
                                  بانتظار سكرين شوت التحويل ⏳
                                </span>
                              </div>
                            </div>

                            {/* Client Meta */}
                            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 p-3.5 rounded-xl">
                              <div>
                                <span className="text-zinc-400 block mb-0.5">اسم العميل والمستفيد:</span>
                                <span className="font-bold text-zinc-900 dark:text-white text-sm">{log.inv.customerName}</span>
                              </div>
                              <div className="text-left">
                                <span className="text-zinc-400 block mb-0.5">تاريخ الإصدار:</span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{log.inv.date || new Date().toISOString().split('T')[0]}</span>
                              </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                              <table className="w-full text-right">
                                <thead className="bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-600 dark:text-zinc-400">
                                  <tr>
                                    <th className="p-3">البيان / الخدمة</th>
                                    <th className="p-3 text-center">الكمية</th>
                                    <th className="p-3 text-left">السعر الإجمالي</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                  {(log.inv.items || [{ name: 'خدمات التواجد الرقمي والحلول المتكاملة', quantity: 1, totalPrice: 1000 }]).map((it: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="p-3 font-bold">{it.name}</td>
                                      <td className="p-3 text-center font-mono">{it.quantity || 1}</td>
                                      <td className="p-3 text-left font-mono font-bold">{it.totalPrice || log.inv.grandTotal} {log.inv.currency || 'EGP'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Totals & Payment Instructions */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                              <div className="space-y-1 text-xs">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">📱 حسابات السداد والتحويل الفوري:</span>
                                {gatewayToggles.instapayActive && <p className="font-mono text-zinc-700 dark:text-zinc-300">• InstaPay: <strong className="text-emerald-500">{instaPayId}</strong></p>}
                                {gatewayToggles.vodafoneActive && <p className="font-mono text-zinc-700 dark:text-zinc-300">• فودافون كاش: <strong className="text-rose-500">{vodafoneCashNo}</strong></p>}
                              </div>

                              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-xl border border-emerald-500/40 text-left shrink-0">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-bold">الإجمالي النهائي المستحق:</span>
                                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{log.inv.grandTotal || 1163} {log.inv.currency || 'EGP'}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => setScreenshotModalInv(log.inv)}
                                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                              >
                                <ImageIcon className="w-4 h-4" />
                                رفع سكرين شوت التحويل وتأكيد السداد 📱
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 7: AI EMPLOYEES WORK RESULTS & ARTIFACTS GALLERY */}
          {mainHubTab === 'results' && (
            <div className="space-y-6">
              {/* Sub Navigation Switcher */}
              <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <button
                  onClick={() => setResultSubTab('invoices')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    resultSubTab === 'invoices' ? 'bg-sky-500 text-white shadow-xs' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {isAr ? 'مخرجات الفواتير ورابط السداد (Invoices)' : 'Invoices'}
                </button>

                <button
                  onClick={() => setResultSubTab('media')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    resultSubTab === 'media' ? 'bg-purple-500 text-white shadow-xs' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  {isAr ? 'مخرجات الكروت البصرية والتصاميم (Media Cards)' : 'Media Cards'}
                </button>

                <button
                  onClick={() => setResultSubTab('calls')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    resultSubTab === 'calls' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  {isAr ? 'سجل نتائج المكالمات الصوتية (AI Voice Calls)' : 'Voice Calls'}
                </button>
              </div>

              {/* Sub View 1: Invoices */}
              {resultSubTab === 'invoices' && (
                <div className="space-y-6">
                  {/* Payment Accounts Configuration Banner */}
                  <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 p-5 rounded-2xl border border-emerald-500/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                        <CreditCard className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          حسابات الاستلام المعتمدة: InstaPay & المحافظ الإلكترونية
                        </h4>
                        <p className="text-xs text-zinc-300">
                          InstaPay: <span className="font-mono text-emerald-400 font-bold">{instaPayId}</span> | فودافون كاش: <span className="font-mono text-emerald-400 font-bold">{vodafoneCashNo}</span> | IBAN: <span className="font-mono text-emerald-400">{bankIbanNo}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsPaymentSettingsOpen(true)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                    >
                      <Settings className="w-4 h-4" />
                      تعديل بيانات المحافظ و InstaPay
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {sampleInvoices.map((inv, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-3">
                          <h4 className="font-bold text-sm text-sky-600 dark:text-sky-400 flex items-center gap-1 font-mono">
                            <FileText className="w-4 h-4" />
                            #{inv.id}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold rounded uppercase">
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{inv.customer}</p>
                        <p className="text-[11px] text-zinc-400 font-mono mb-3">{inv.phone}</p>
                        <div className="space-y-1 text-xs border-y border-zinc-100 dark:border-zinc-800 py-2">
                          {inv.items.map((it, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-zinc-600 dark:text-zinc-400">{it.name}</span>
                              <span className="font-bold">{it.price} {inv.currency}</span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <span>الإجمالي (+ 14% VAT):</span>
                            <span>{inv.total} {inv.currency}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="space-y-2">
                          <button
                            onClick={() => setScreenshotModalInv(inv)}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            مراجعة / رفع سكرين شوت التحويل 📱
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`InstaPay: ${instaPayId} | Vodafone: ${vodafoneCashNo}`);
                              setCopiedLinkIndex(idx);
                              setTimeout(() => setCopiedLinkIndex(null), 2000);
                            }}
                            className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedLinkIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedLinkIndex === idx ? 'تم نسخ بيانات التحويل!' : 'نسخ بيانات InstaPay وفودافون كاش'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Sub View 2: Media Cards */}
              {resultSubTab === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sampleMediaCards.map((card, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 rounded-xl border border-purple-500/30 text-white space-y-4 shadow-lg font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {card.badge}
                        </span>
                        <span className="font-bold text-emerald-400 text-lg">{card.price}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1">{card.title}</h3>
                        <p className="text-xs text-zinc-400">{card.subtitle}</p>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                        {card.features.map((f, i) => (
                          <div key={i} className="text-xs text-zinc-300 flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub View 3: Voice Calls */}
              {resultSubTab === 'calls' && (
                <div className="space-y-4">
                  {sampleVoiceCalls.map((call, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-0.5">{call.customer} ({call.phone})</h4>
                          <p className="text-zinc-500 dark:text-zinc-400">{call.summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-zinc-400">{call.duration}</span>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold rounded">
                          {isAr ? 'مكالمة ناجحة 200 OK' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      </div>



      {/* Admin Payment Settings Modal */}
      {isPaymentSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                إعدادات حسابات التحويل (InstaPay & Vodafone Cash)
              </h3>
              <button onClick={() => setIsPaymentSettingsOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">عنوان حساب إنستا باي (InstaPay IPA):</label>
                <input
                  type="text"
                  value={instaPayId}
                  onChange={e => setInstaPayId(e.target.value)}
                  placeholder="tarek@instapay..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">رقم محفظة فودافون كاش (Vodafone Cash):</label>
                <input
                  type="text"
                  value={vodafoneCashNo}
                  onChange={e => setVodafoneCashNo(e.target.value)}
                  placeholder="01020304050..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">اسم صاحب الحساب المستلم (Beneficiary Name):</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={e => setAccountHolderName(e.target.value)}
                  placeholder="طارق رشدي..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">اسم البنك المستلم (Bank Name):</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="البنك الأهلي المصري..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">رقم الحساب البنكي / IBAN:</label>
                <input
                  type="text"
                  value={bankIbanNo}
                  onChange={e => setBankIbanNo(e.target.value)}
                  placeholder="EG123456789..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsPaymentSettingsOpen(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-lg text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/payment-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ vodafoneCashNumber: vodafoneCashNo, instaPayAddress: instaPayId, bankAccountIban: bankIbanNo, accountHolderName, bankName, telegramBotToken, telegramBotInfo, telegramBotEnabled: telegramActive, transferNotes: '' })
                    });
                    setIsPaymentSettingsOpen(false);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-md"
              >
                حفظ الحسابات وتحديث الفواتير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Screenshot Upload & Verification Modal */}
      {screenshotModalInv && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                تأكيد ومراجعة سكرين شوت التحويل (#{screenshotModalInv.id})
              </h3>
              <button onClick={() => { setScreenshotModalInv(null); setUploadedScreenshot(null); }} className="text-zinc-400 hover:text-zinc-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white block">{screenshotModalInv.customer}</span>
                  <span className="text-zinc-400 font-mono">{screenshotModalInv.phone}</span>
                </div>
                <span className="text-emerald-500 font-bold font-mono text-base">{screenshotModalInv.total} EGP</span>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center space-y-2 bg-zinc-50/50 dark:bg-zinc-800/40">
                {uploadedScreenshot ? (
                  <div className="space-y-2">
                    <img src={uploadedScreenshot} alt="Transfer Screenshot" className="max-h-48 mx-auto rounded-lg shadow-md border border-emerald-500" />
                    <span className="text-emerald-500 font-bold block">تم إرفاق إيصال التحويل بنجاح 🟢</span>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-8 h-8 text-zinc-400 mx-auto mb-1 animate-bounce" />
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 block">قم برفع إيصال تحويل InstaPay أو فودافون كاش هنا</span>
                    <span className="text-[10px] text-zinc-400 block mb-2">يدعم صور JPG, PNG, WEBP</span>
                    <label className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg cursor-pointer inline-block">
                      اختيار صورة الإيصال
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => setUploadedScreenshot(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => { setScreenshotModalInv(null); setUploadedScreenshot(null); }}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-lg text-xs cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  alert(`✅ تم اعتماد وتأكيد استلام المبلغ للفاتورة ${screenshotModalInv.id} بنجاح!`);
                  setScreenshotModalInv(null);
                  setUploadedScreenshot(null);
                }}
                disabled={!uploadedScreenshot}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-md"
              >
                تأكيد واعتماذ الدفع يدويًا ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Ticket Modal */}
      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-500" />
                إنشاء تذكرة دعم فني جديدة (#TCK)
              </h3>
              <button onClick={() => setIsCreateTicketModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">اسم العميل / المستفيد:</label>
                  <input
                    type="text"
                    value={newTicketCustomer}
                    onChange={e => setNewTicketCustomer(e.target.value)}
                    placeholder="م. طارق رشدي..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">رقم الهاتف / الواتساب:</label>
                  <input
                    type="text"
                    value={newTicketPhone}
                    onChange={e => setNewTicketPhone(e.target.value)}
                    placeholder="+2011..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">درجة الأهمية (Priority):</label>
                  <select
                    value={newTicketPriority}
                    onChange={e => setNewTicketPriority(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none"
                  >
                    <option value="medium">متوسطة (Medium)</option>
                    <option value="high">عالية (High)</option>
                    <option value="urgent">عاجلة جداً 🔥 (Urgent)</option>
                    <option value="low">عادية (Low)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">المسؤول عن الحل (Assigned Agent):</label>
                  <select
                    value={newTicketAssigned}
                    onChange={e => setNewTicketAssigned(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 outline-none"
                  >
                    <option value="مهندس عمر الدعم">مهندس عمر الدعم الفني</option>
                    <option value="الأستاذ صلاح الحسابات">الأستاذ صلاح الحسابات</option>
                    <option value="أحمد المبيعات">أحمد المبيعات</option>
                    <option value="مشرف بشرى">مشرف بشرى مباشر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">تفاصيل البلاغ / المشكلة التقنية:</label>
                <textarea
                  rows={3}
                  value={newTicketIssue}
                  onChange={e => setNewTicketIssue(e.target.value)}
                  placeholder="وصف دقيق لمشكلة العميل..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 outline-none font-sans leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsCreateTicketModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-lg text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateTicketSubmit}
                disabled={!newTicketCustomer || !newTicketIssue}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-md"
              >
                إنشاء واعتماد التذكرة الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details & Resolution Modal */}
      {selectedTicketModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-500" />
                تفاصيل التذكرة #{selectedTicketModal.id}
              </h3>
              <button onClick={() => setSelectedTicketModal(null)} className="text-zinc-400 hover:text-zinc-600 text-xl font-bold cursor-pointer">×</button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg space-y-1">
                <span className="text-zinc-500 dark:text-zinc-400 block font-bold">بلاغ المشكلة الأصلي:</span>
                <p className="text-zinc-900 dark:text-white font-medium">{selectedTicketModal.issue}</p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-1">
                <span className="text-emerald-800 dark:text-emerald-300 block font-bold">الحل المقترح من مهندس عمر الدعم:</span>
                <p className="text-emerald-900 dark:text-emerald-200 font-medium">{selectedTicketModal.solution}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">تغيير حالة التذكرة:</label>
                  <select
                    value={selectedTicketModal.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      setTicketsList(prev => prev.map(t => t.id === selectedTicketModal.id ? { ...t, status: newStatus as any } : t));
                      setSelectedTicketModal({ ...selectedTicketModal, status: newStatus });
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 outline-none"
                  >
                    <option value="open">مفتوحة (Open)</option>
                    <option value="in_progress">جارِ المتابعة (In Progress)</option>
                    <option value="resolved">تم الحل بنجاح (Resolved)</option>
                    <option value="escalated">تحويل للمشرف البشري (Escalated)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">المسؤول عن التذكرة:</label>
                  <input
                    type="text"
                    value={selectedTicketModal.assignedTo}
                    onChange={e => {
                      const val = e.target.value;
                      setTicketsList(prev => prev.map(t => t.id === selectedTicketModal.id ? { ...t, assignedTo: val } : t));
                      setSelectedTicketModal({ ...selectedTicketModal, assignedTo: val });
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setSelectedTicketModal(null)}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                حفظ التعديلات والتوافق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Agent Configuration Modal */}
      {selectedAgent && editingConfig && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                    {isAr ? `إعدادات وتحكم تفصيلي: ${editingConfig.name}` : `Granular Control: ${editingConfig.nameEn}`}
                  </h3>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'تحديث الشخصية، التعليمات، الصلاحيات الفنية، والمهام المحددة' : 'Full persona, rules, technical parameters, and duties control'}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAgent(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="px-6 pt-3 border-b border-zinc-200 dark:border-zinc-800 flex gap-4 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-bold">
              <button
                onClick={() => setActiveTab('identity')}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'identity' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-4 h-4" />
                {isAr ? 'الهوية والأسلوب' : 'Identity & Dialect'}
              </button>
              <button
                onClick={() => setActiveTab('duties')}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'duties' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                {isAr ? 'الدور الوظيفي والمهام' : 'Job Duties & Responsibilities'}
              </button>
              <button
                onClick={() => setActiveTab('params')}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'params' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                {isAr ? 'المعايير والضوابط' : 'Guardrails'}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'analytics' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-400" />
                {isAr ? 'مؤشرات أداء الوكيل' : 'Agent KPIs'}
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'logs' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Clock className="w-4 h-4 text-blue-400" />
                {isAr ? 'سجل الأعمال والمهام الحية' : 'Live Work Audit'}
              </button>
              <button
                onClick={() => setActiveTab('dispatch')}
                className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'dispatch' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                {isAr ? '⚡ إسناد مهمة وتكليف مباشر' : 'Task Dispatch Console'}
              </button>
            </div>

            {/* Form Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

              {/* Tab 1: Identity & Dialect */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        {isAr ? 'اسم الموظف الوظيفي المميز:' : 'Agent Employee Name:'}
                      </label>
                      <input 
                        type="text" 
                        value={editingConfig.name}
                        onChange={e => setEditingConfig({ ...editingConfig, name: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        {isAr ? 'نموذج الذكاء الاصطناعي:' : 'AI Model:'}
                      </label>
                      <select
                        value={editingConfig.model}
                        onChange={e => setEditingConfig({ ...editingConfig, model: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-2.5 outline-none"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Super Fast 0.3s)</option>
                        <option value="gpt-4o">GPT-4o Enterprise</option>
                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {isAr ? 'التعليمات الأساسية وطريقة الحديث (System Prompt):' : 'System Prompt:'}
                    </label>
                    <textarea 
                      rows={5}
                      value={editingConfig.systemPrompt}
                      onChange={e => setEditingConfig({ ...editingConfig, systemPrompt: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-3 outline-none focus:border-emerald-500 font-sans resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        {isAr ? 'اللهجة وأسلوب المحادثة:' : 'Dialect & Tone:'}
                      </label>
                      <select
                        value={editingConfig.dialect}
                        onChange={e => setEditingConfig({ ...editingConfig, dialect: e.target.value as any })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-2.5 outline-none"
                      >
                        <option value="eg">عامية مصرية ودودة 🇪🇬</option>
                        <option value="sa">عامية خليجية/سعودية 🇸🇦</option>
                        <option value="msa">عربية فصحى راقية 🌐</option>
                        <option value="lb">عامية شامية/لبنانية 🇱🇧</option>
                        <option value="en_us">English (Professional) 🇺🇸</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        {isAr ? 'الكلمات المفتاحية (Triggers):' : 'Trigger Keywords:'}
                      </label>
                      <input
                        type="text"
                        value={editingConfig.triggerKeywords.join(', ')}
                        onChange={e => setEditingConfig({ ...editingConfig, triggerKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 font-sans"
                        placeholder="سعر, فاتورة, خصم..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Job Duties */}
              {activeTab === 'duties' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      {isAr ? 'المهام والمسؤوليات الموكلة لهذا الموظف (كل سطر يمثل مهمة مستقلة):' : 'Detailed responsibilities (one per line):'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(editingConfig.role)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isAr ? 'تطبيق نموذج المهام القياسي' : 'Apply Standard Preset'}
                    </button>
                  </div>

                  <textarea 
                    rows={6}
                    value={editingConfig.responsibilities.join('\n')}
                    onChange={e => setEditingConfig({ ...editingConfig, responsibilities: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-3 outline-none focus:border-emerald-500 font-sans resize-none leading-relaxed"
                    placeholder="مهمة 1&#10;مهمة 2..."
                  />
                </div>
              )}

              {/* Tab 3: Technical Guardrails */}
              {activeTab === 'params' && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                    {/* Common Guardrails */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block">{isAr ? 'أقصى نسبة خصم مسموح بها للموظف:' : 'Max Allowed Discount %:'}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{isAr ? 'يمنع الموظف من إعطاء خصم أعلى من هذه النسبة للعميل' : 'Limits discount capability'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={editingConfig.guardrails?.maxDiscountPercent || 0}
                          onChange={e => setEditingConfig({
                            ...editingConfig,
                            guardrails: { ...editingConfig.guardrails, maxDiscountPercent: Number(e.target.value) }
                          })}
                          className="w-28 accent-emerald-500"
                        />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono w-10 text-center">
                          {editingConfig.guardrails?.maxDiscountPercent || 0}%
                        </span>
                      </div>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-700" />

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block">{isAr ? 'بدء المكالمات الصوتية تلقائياً:' : 'Auto AI WhatsApp Voice Calling:'}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{isAr ? 'القيام بمكالمة صوتية تفاعلية عند الكشف عن نية شراء عالية' : 'Trigger voice calls automatically'}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingConfig.guardrails?.autoVoiceCall || false}
                          onChange={e => setEditingConfig({
                            ...editingConfig,
                            guardrails: { ...editingConfig.guardrails, autoVoiceCall: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Employee KPI & Revenue Analytics (Unique per Role) */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">
                        {editingConfig.role === 'sales' ? 'المحادثات المدارة' :
                         editingConfig.role === 'invoice' ? 'الفواتير الصادرة' :
                         editingConfig.role === 'media' ? 'الكروت والتصاميم' :
                         editingConfig.role === 'support' ? 'التذاكر المعالجة' :
                         editingConfig.role === 'marketing' ? 'الحملات الترويجية' :
                         (editingConfig.role as string) === 'dev' ? 'فحوصات النظام' : 'التوجيهات والتحليلات'}
                      </span>
                      <span className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                        {editingConfig.role === 'sales' ? '320' :
                         editingConfig.role === 'invoice' ? '185' :
                         editingConfig.role === 'media' ? '140' :
                         editingConfig.role === 'support' ? '210' :
                         editingConfig.role === 'marketing' ? '34' :
                         (editingConfig.role as string) === 'dev' ? '52' : '1,695'}
                      </span>
                      <span className="text-[10px] text-emerald-500 block font-semibold">+18% هذا الأسبوع</span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">
                        {editingConfig.role === 'sales' ? 'معدل إغلاق المبيعات' :
                         editingConfig.role === 'invoice' ? 'نسبة التحصيل الفوري' :
                         editingConfig.role === 'media' ? 'نسبة التفاعل المصور' :
                         editingConfig.role === 'support' ? 'الحل من اللمسة الأولى' :
                         editingConfig.role === 'marketing' ? 'نسبة فتح الرسائل' :
                         (editingConfig.role as string) === 'dev' ? 'دقة التوصيات' : 'دقة كشف النية'}
                      </span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {editingConfig.role === 'sales' ? '68.4%' :
                         editingConfig.role === 'invoice' ? '92.1%' :
                         editingConfig.role === 'media' ? '74.5%' :
                         editingConfig.role === 'support' ? '89.3%' :
                         editingConfig.role === 'marketing' ? '81.2%' :
                         (editingConfig.role as string) === 'dev' ? '99.4%' : '99.1%'}
                      </span>
                      <span className="text-[10px] text-emerald-500 block font-semibold">ممتاز 🔥</span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">زمن الاستجابة/التوليد</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                        {editingConfig.metrics?.avgResponseTime || (editingConfig.role === 'media' ? '0.7s' : (editingConfig.role as string) === 'dev' ? '0.5s' : '0.3s')}
                      </span>
                      <span className="text-[10px] text-purple-400 block font-semibold">استجابة فائقة السرعة</span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">تقييم الأداء والرضا</span>
                      <span className="text-lg font-bold text-amber-500 font-mono">
                        {editingConfig.metrics?.customerSatisfaction || 98}%
                      </span>
                      <span className="text-[10px] text-amber-500 block font-semibold">⭐⭐⭐⭐⭐ (4.9/5)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 rounded-xl border border-emerald-500/30 flex items-center justify-between text-white">
                    <div>
                      <span className="text-xs text-zinc-400 block">
                        {editingConfig.role === 'sales' ? 'إجمالي المبيعات والأرباح المحققة بواسطة هذا الوكيل:' :
                         editingConfig.role === 'invoice' ? 'إجمالي الفواتير والتحصيلات البنكية المحصلة:' :
                         editingConfig.role === 'media' ? 'إجمالي القيمة التسويقية للكروت المولدة:' :
                         editingConfig.role === 'support' ? 'قيمة توفير الدعم الفني الذكي والتذاكر:' :
                         editingConfig.role === 'marketing' ? 'إجمالي عوائد الحملات الترويجية المباشرة:' :
                         (editingConfig.role as string) === 'dev' ? 'عائد تحسين أداء السيرفر وتطبيق التحديثات:' : 'إجمالي توجيه المحادثات المدارة:'}
                      </span>
                      <span className="text-xl font-bold text-emerald-400 font-mono">
                        {editingConfig.role === 'sales' ? '48,500 EGP' :
                         editingConfig.role === 'invoice' ? '124,000 EGP' :
                         editingConfig.role === 'media' ? '32,000 EGP' :
                         editingConfig.role === 'support' ? '18,500 EGP' :
                         editingConfig.role === 'marketing' ? '65,000 EGP' :
                         (editingConfig.role as string) === 'dev' ? '+45% زيادة كفاءة' : '1,695 محادثة'}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/40">
                      {editingConfig.role === 'sales' ? 'أعلى موظف مبيعات 🎉' :
                       editingConfig.role === 'invoice' ? 'أعلى حصيلة مالية 💰' :
                       editingConfig.role === 'media' ? 'الأعلى إبداعاً 🎨' :
                       editingConfig.role === 'support' ? 'أفضل دعم 🛡️' :
                       editingConfig.role === 'marketing' ? 'أكبر وصول 📢' :
                       (editingConfig.role as string) === 'dev' ? 'عقل المنظومة 💡' : 'المشرف الرئيسي 🚦'}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Interactive Direct Task Dispatch Console (مركز التكليف والتنفيذ الفوري للموظف) */}
              {activeTab === 'dispatch' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 p-4 rounded-xl border border-amber-500/30 space-y-3 text-white">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
                      <h4 className="font-bold text-sm">إسناد مهمة وتكليف مباشر لـ {editingConfig.name}:</h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      اختر إحدى المهام السريعة الجاهزة لهذا الموظف أو اكتب أمراً مخصصاً ليقوم بإنشائه وتنفيذه فوراً داخل النظام وتوثيقه في سجله:
                    </p>

                    {/* Quick Preset Buttons tailored by Role */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editingConfig.role === 'sales' && (
                        <>
                          <button
                            onClick={() => { setDirectTaskInput('إتمام بيعة استشارية لباقة محترفين 500 EGP'); handleExecuteModalTask('إتمام بيعة استشارية لباقة محترفين 500 EGP'); }}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            ⚡ إطلاق بيعة استشارية 500 EGP
                          </button>
                          <button
                            onClick={() => { setDirectTaskInput('إجراء وتفعيل مكالمة صوتية تفاعلية للعميل فوراً'); handleExecuteModalTask('إجراء وتفعيل مكالمة صوتية تفاعلية للعميل فوراً'); }}
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            🎙️ تفعيل مكالمة صوتية واتساب
                          </button>
                          <button
                            onClick={() => { setDirectTaskInput('معالجة اعتراض السعر وعرض خصم 15%'); handleExecuteModalTask('معالجة اعتراض السعر وعرض خصم 15%'); }}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            💰 عرض خصم 15% وإغلاق البيعة
                          </button>
                        </>
                      )}

                      {editingConfig.role === 'invoice' && (
                        <>
                          <button
                            onClick={() => { setDirectTaskInput('عمل فاتورة بـ 2 استشارة بخصم 100 جنيه'); handleExecuteModalTask('عمل فاتورة بـ 2 استشارة بخصم 100 جنيه'); }}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            🧾 استخراج فاتورة استشارية 500 EGP
                          </button>
                          <button
                            onClick={() => { setDirectTaskInput('توليد رابط سداد مباشر لباقة الشركات 3500 EGP'); handleExecuteModalTask('توليد رابط سداد مباشر لباقة الشركات 3500 EGP'); }}
                            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            💳 توليد رابط سداد مباشر 3500 EGP
                          </button>
                        </>
                      )}

                      {editingConfig.role === 'media' && (
                        <>
                          <button
                            onClick={() => { setDirectTaskInput('تصميم كارت عرض الصيف الزمردي المميز'); handleExecuteModalTask('تصميم كارت عرض الصيف الزمردي المميز'); }}
                            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            🎨 تصميم كارت خصم الصيف 30%
                          </button>
                          <button
                            onClick={() => { setDirectTaskInput('توليد بنر منتج باقة VIP الأكثر مبيعاً 🔥'); handleExecuteModalTask('توليد بنر منتج باقة VIP الأكثر مبيعاً 🔥'); }}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            🖼️ بنر الأكثر مبيعاً 🔥
                          </button>
                        </>
                      )}

                      {editingConfig.role === 'support' && (
                        <>
                          <button
                            onClick={() => { setDirectTaskInput('فتح تذكرة دعم فني عاجلة #TCK-999 وحلها تلقائياً'); handleExecuteModalTask('فتح تذكرة دعم فني عاجلة #TCK-999 وحلها تلقائياً'); }}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            🎫 فتح تذكرة دعم عاجلة #TCK-999
                          </button>
                          <button
                            onClick={() => { setDirectTaskInput('فحص أداء السيرفر وإعادة المزامنة السحابية'); handleExecuteModalTask('فحص أداء السيرفر وإعادة المزامنة السحابية'); }}
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            🛠️ فحص المزامنة وإعادة التشغيل
                          </button>
                        </>
                      )}

                      {editingConfig.role === 'marketing' && (
                        <>
                          <button
                            onClick={() => { setDirectTaskInput('إطلاق حملة الواتساب الجماعية للعملاء VIP'); handleExecuteModalTask('إطلاق حملة الواتساب الجماعية للعملاء VIP'); }}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            📢 إطلاق حملة الواتساب الجماعية
                          </button>
                        </>
                      )}

                      {((editingConfig.role as string) === 'dev' || (editingConfig.role as string) === 'dev') && (
                        <>
                          <button
                            onClick={() => { setDirectTaskInput('إجراء فحص شامل للمنظومة وتوليد التوصيات'); handleExecuteModalTask('إجراء فحص شامل للمنظومة وتوليد التوصيات'); }}
                            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            💡 فحص المنظومة وتوليد التوصيات
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Custom Task Input Box */}
                  <div className="space-y-2">
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 text-xs">
                      أو اكتب أوامر ومهمة مخصصة لـ {editingConfig.name}:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={directTaskInput}
                        onChange={e => setDirectTaskInput(e.target.value)}
                        placeholder="مثال: قم بإنشاء فاتورة سريعة أو إجراء مكالمة..."
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg p-2.5 text-xs outline-none focus:border-amber-500 font-sans"
                      />
                      <button
                        onClick={() => handleExecuteModalTask()}
                        disabled={isExecutingDirectTask || !directTaskInput.trim()}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                      >
                        {isExecutingDirectTask ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            جارِ التنفيذ...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-current" />
                            تنفيذ المهمة الآن
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Direct Task Execution Output Display */}
                  {directTaskResult && (
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          تم تنفيذ المهمة بنجاح بواسطة {editingConfig.name}!
                        </span>
                        <span>استجابة حية في 0.26s</span>
                      </div>
                      <pre className="text-zinc-300 whitespace-pre-wrap font-sans text-xs leading-relaxed bg-black/50 p-3 rounded-lg border border-zinc-800/80 max-h-48 overflow-y-auto">
                        {typeof directTaskResult === 'string' 
                          ? directTaskResult 
                          : JSON.stringify(directTaskResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Live Employee Work Audit Log */}
              {activeTab === 'logs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white">سجل العمليات والمهام الأخيرة التي نفذها {editingConfig.name}:</h4>
                    <span className="text-[10px] text-zinc-400">تحديث لحظي حقيقي</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {editingConfig.recentActivities?.map((act, idx) => (
                      <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-white block text-xs">{act.action}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{act.time}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                          تم بنجاح 🟢
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-800/50">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {isAr ? 'حفظ واعتماذ الوظيفة' : 'Save & Deploy Role'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
