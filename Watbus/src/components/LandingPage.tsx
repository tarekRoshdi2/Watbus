/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Shield,
  Zap,
  Bot,
  BarChart3,
  Globe,
  CheckCircle2,
  Users,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Cpu,
  Star,
  Sparkles,
  Send,
  HelpCircle,
  Activity,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: (mode: 'login' | 'register' | 'demo') => void;
  lang: 'ar' | 'en';
  onChangeLang: (lang: 'ar' | 'en') => void;
}

export default function LandingPage({ onGetStarted, lang, onChangeLang }: LandingPageProps) {
  const [liveSentCount, setLiveSentCount] = useState(1284562);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-increment live counter for visual engagement
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSentCount(prev => prev + Math.floor(Math.random() * 4) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Interactive AI Sandbox Chat Simulator
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    { sender: 'user', text: lang === 'ar' ? "مرحباً، هل يمكنني تجربة ردود الذكاء الاصطناعي؟" : "Hello, can I test the AI responses?", time: "10:00" },
    { 
      sender: 'ai', 
      text: lang === 'ar' 
        ? "أهلاً بك! أنا مساعد ChatCore الذكي والمدعوم بـ Gemini AI 🤖. اضغط على أي من الأسئلة الجاهزة بالأسفل لرؤية كيف أقوم بالرد والتحليل الفوري!" 
        : "Welcome! I am ChatCore's smart agent powered by Gemini AI 🤖. Click any preset question below to see how I reply and analyze in real-time!", 
      time: "10:00" 
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const chatPresets = lang === 'ar' ? [
    { label: "🤖 كيف تعمل الردود الذكية؟", text: "كيف يعمل وكيل الذكاء الاصطناعي وكيف يتلقى الأوامر؟" },
    { label: "💳 ما هي تفاصيل باقات الأسعار؟", text: "كم سعر الاشتراك بالباقات وما هي الخيارات المتاحة؟" },
    { label: "📱 هل يمكنني ربط أكثر من رقم واتساب؟", text: "هل تدعم المنصة ربط حسابات متعددة في نفس لوحة التحكم؟" }
  ] : [
    { label: "🤖 How do smart replies work?", text: "How does the AI agent operate and receive system instructions?" },
    { label: "💳 What are the pricing plans?", text: "What are the subscription plans and available categories?" },
    { label: "📱 Can I link multiple numbers?", text: "Does the platform support multi-account gateway linking?" }
  ];

  const handleSimulateChat = (text: string) => {
    if (isAiTyping) return;
    
    const timeString = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text, time: timeString }]);
    setIsAiTyping(true);
    
    let reply = lang === 'ar' 
      ? "أهلاً بك! يسعدني خدمتك. نظام ChatCore يوفر لك اتصالاً فورياً ومستقراً مع خوادم الواتساب وأتمتة كاملة."
      : "Welcome! Happy to assist you. ChatCore provides an instant, stable connection with WhatsApp gateways and complete automation.";
    
    if (text.includes("سعر") || text.includes("الباقات") || text.includes("الاشتراك") || text.includes("pricing") || text.includes("plans") || text.includes("subscription")) {
      reply = lang === 'ar'
        ? "باقاتنا مخفضة لفترة محدودة بالجنية المصري! الباقة الأساسية بسعر 500 ج.م/شهرياً، الباقة الاحترافية Pro الأكثر مبيعاً بقيمة 750 ج.م/شهرياً، وباقة الشركات بـ 900 ج.م/شهرياً. وتوفر 20% عند الدفع السنوي!"
        : "Our plans are discounted for a limited time in EGP! The Starter plan is 500 EGP/mo, the best-seller Pro plan is 750 EGP/mo, and the Enterprise category is 900 EGP/mo. You save 20% on annual billing!";
    } else if (text.includes("الردود") || text.includes("وكيل") || text.includes("الذكاء") || text.includes("replies") || text.includes("agent") || text.includes("AI")) {
      reply = lang === 'ar'
        ? "يقوم وكيل الذكاء الاصطناعي بقراءة محتوى رسائل عملائك وفهم السياق بالكامل ثم استخدام نموذج Google Gemini للإجابة بدقة متناهية بناءً على ملفات تدريب خاصة بمنتجاتك."
        : "The AI Agent reads your customers' messages, understands context, and leverages Google Gemini model to reply with high accuracy based on your custom product training files.";
    } else if (text.includes("رقم") || text.includes("حسابات") || text.includes("متعددة") || text.includes("link") || text.includes("multiple") || text.includes("numbers")) {
      reply = lang === 'ar'
        ? "نعم، يدعم ChatCore نظام البوابات المتعددة (Multi-Device Gateway) بالكامل. يمكنك ربط عدة أرقام وإدارتها وتصفية المحادثات الخاصة بكل رقم بشكل منفصل تماماً لتجنب التشتت."
        : "Yes, ChatCore fully supports Multi-Device Gateways. You can link multiple numbers, manage them, and isolate conversation streams per phone line to avoid team clutter.";
    }

    setTimeout(() => {
      setIsAiTyping(false);
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply, time: timeString }]);
    }, 1400);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const features = [
    {
      icon: <Bot className="w-6 h-6 text-emerald-500" />,
      titleAr: "وكلاء الذكاء الاصطناعي الذكية",
      titleEn: "Gemini AI Auto-Responders",
      descAr: "تفعيل ردود ذكية ومخصصة تعمل بنموذج Gemini لمساعدة عملائك على مدار الساعة والرد على استفساراتهم فوريًا.",
      descEn: "Activate custom-trained AI agents powered by Google Gemini to support your clients 24/7 with zero delay."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#00a884]" />,
      titleAr: "ربط متعدد الحسابات (Multi-Device)",
      titleEn: "Multi-Account Gateway",
      descAr: "اربط عدة أرقام واتساب في لوحة تحكم واحدة، سواء عن طريق مسح الرمز السريع QR أو عن طريق API الربط المباشر السريع.",
      descEn: "Link multiple WhatsApp numbers in a single workspace using standard QR Web-scanning or direct gateway APIs."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      titleAr: "حملات تسويقية وذكية بالدفعات",
      titleEn: "Smart Bulk Campaigns",
      descAr: "أرسل آلاف الرسائل المخصصة لعملائك دفعة واحدة بجدولة ذكية وفترات تأخير آمنة لمنع حظر الأرقام.",
      descEn: "Broadcast thousands of personalized messages with safe intervals, dynamic variables, and smart delay queueing."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
      titleAr: "نظام CRM متكامل وإدارة العملاء",
      titleEn: "Full CRM & Chat Management",
      descAr: "تصنيف المحادثات، إضافة وسوم وملاحظات للعملاء، وتخصيص موظفين لمتابعة الصفقات والطلبات بسلاسة.",
      descEn: "Label conversations, add custom client metadata, assign tags, and track sales pipelines right from the chat."
    },
    {
      icon: <Cpu className="w-6 h-6 text-purple-500" />,
      titleAr: "واجهة مطورين فائقة السرعة Webhooks",
      titleEn: "Developer API & Webhooks",
      descAr: "أرسل رسائل برمجية، واستقبل تحديثات الرسائل فورًا في نظامك الخاص عبر الويب هوكس والربط البرمجي الاحترافي.",
      descEn: "Trigger programmatic messages and stream inbound messages directly to your server via ultra-fast webhooks."
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-600" />,
      titleAr: "أمان واستقرار على مدار الخدمة",
      titleEn: "Enterprise Security & SLA",
      descAr: "سيرفرات سحابية آمنة ومستقرة، مع نظام تشفير يحافظ على خصوصية بيانات عملائك ومحادثاتهم بالكامل.",
      descEn: "Cloud-secure environments with state-of-the-art encryption keeping your corporate files and text flows secure."
    }
  ];

  const testimonials = lang === 'ar' ? [
    {
      name: "المهندس بندر الحربي",
      role: "مدير العمليات في منصة وتين الرقمية | Wateen Platform",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      content: "نظام ChatCore شكل نقلة نوعية في خدمة عملائنا في وتين. ربطنا المنصة بالـ API وبدأت ردود Gemini AI الذكية في الإجابة الفورية على مئات الاستفسارات بدقة واحترافية متناهية."
    },
    {
      name: "د. طارق مراد",
      role: "مستشار حلول الربط والأتمتة في ExpoCore",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      content: "نعتمد بالكامل على بوابات ChatCore لإرسال حملات البث والتسويق لـ ExpoCore. نسبة استقرار الخوادم واتصال خطوط الواتساب خيالية، وهي المنصة الأكثر أماناً واستقراراً بلا منازع."
    },
    {
      name: "رائد الشمري",
      role: "مؤسس متجر جولد ستور الإلكتروني",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
      content: "إرسال الحملات التسويقية بالدفعات وبفواصل زمنية آمنة زاد من مبيعاتنا بنسبة 35٪ في الشهر الأول بدون أي حظر للأرقام. لوحة التحكم ذكية ومريحة للعين وتسهل العمل اليومي."
    },
    {
      name: "سارة العتيبي",
      role: "مديرة التسويق الرقمي | Focus Agency",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      content: "تقارير الحملات الدقيقة وتصدير بيانات العملاء إلى ملفات Excel وفر علينا ساعات من إدخال البيانات اليدوي. إمكانية إدارة المحادثات متعددة الموظفين غيرت قواعد اللعبة لوكالتنا."
    },
    {
      name: "خالد المصري",
      role: "رئيس قسم المنتجات | Aqari Real Estate",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
      content: "الربط البرمجي عن طريق Webhooks في غاية السهولة والموثوقية. تصلنا إشعارات العملاء ومستجدات العقارات فوراً في لوحة التحكم الخاصة بنا مع ربط ممتاز ودقيق."
    },
    {
      name: "د. يوسف الفهد",
      role: "مؤسس مجموعة CureClinic الطبية",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      content: "استخدمنا ChatCore لإرسال تأكيدات المواعيد وتذكير المرضى عبر الواتساب آلياً. النظام ممتاز، ولم نواجه أي تأخير في إرسال رسائل الـ OTP والتحقق الثنائي للمستخدمين."
    }
  ] : [
    {
      name: "Eng. Bandar Al-Harbi",
      role: "Operations Director | Wateen Platform",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      content: "ChatCore represents a qualitative leap for our service in Wateen. We linked the platform to the API, and Gemini AI responds instantly to hundreds of daily inquiries."
    },
    {
      name: "Dr. Tarek Mourad",
      role: "Integration & Automation Consultant | ExpoCore",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      content: "We fully rely on ChatCore gateways to broadcast campaigns for ExpoCore. The server SLA and connection stability is top-tier and highly secure."
    },
    {
      name: "Raed Al-Shammari",
      role: "Founder | Gold Store E-Commerce",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
      content: "Sending bulk campaigns with secure intervals boosted our sales by 35% in month one with zero number bans. The dashboard coordination is very clean."
    },
    {
      name: "Sarah Al-Otaibi",
      role: "Digital Marketing Manager | Focus Agency",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      content: "Precise campaign reporting and Excel exporting saved us hours of manual data entry. Multi-agent chat allocation changed the game for our agency."
    },
    {
      name: "Khaled Al-Masry",
      role: "Product Owner | Aqari Real Estate",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
      content: "Webhook integration is extremely easy and reliable. Real estate updates are streamed instantly to our control panel with excellent mapping."
    },
    {
      name: "Dr. Yusuf Al-Fahad",
      role: "Founder | CureClinic Medical Group",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      content: "We use ChatCore to automate appointment confirmations and patient reminders. Excellent system, zero delays in OTP dispatching and user logins."
    }
  ];

  const pricingPlans = lang === 'ar' ? [
    {
      name: "باقة البداية (Starter)",
      price: "1000 ج.م",
      period: "/ شهرياً",
      description: "مثالية للمشاريع الصغيرة ورواد الأعمال للبدء السريع",
      features: [
        "ربط عبر QR Code (Baileys) فقط",
        "2,500 رسالة ذكية (AI) شهرياً",
        "لوحة تحكم للمحادثات",
        "دعم فني أساسي"
      ],
      buttonText: "ابدأ الآن",
      highlighted: false
    },
    {
      name: "باقة المحترفين (Pro)",
      price: "2000 ج.م",
      period: "/ شهرياً",
      description: "للشركات النامية التي تحتاج لربط متقدم وذكاء اصطناعي أقوى",
      features: [
        "كل مزايا البداية",
        "ربط Cloud API + البوابات (Ultramsg...)",
        "7,000 رسالة ذكية (AI) شهرياً",
        "تصدير التقارير المتقدمة"
      ],
      buttonText: "الترقية الآن",
      highlighted: true
    },
    {
      name: "باقة الشركات (Enterprise)",
      price: "4000 ج.م",
      period: "/ شهرياً",
      description: "للمؤسسات الكبرى التي تتطلب أداء لا محدود",
      features: [
        "كل مزايا المحترفين",
        "ربط أجهزة وبوابات غير محدودة",
        "20,000 رسالة ذكية (AI) شهرياً",
        "مدير حساب مخصص (SLA 99.9%)"
      ],
      buttonText: "تواصل مع المبيعات",
      highlighted: false
    }
  ] : [
    {
      name: "Starter",
      price: "1000 EGP",
      period: "/ month",
      description: "Perfect for small businesses and fast deployment",
      features: [
        "QR Code Connection Only",
        "2,500 AI Messages / month",
        "Chat Dashboard",
        "Basic Support"
      ],
      buttonText: "Start Now",
      highlighted: false
    },
    {
      name: "Professional",
      price: "2000 EGP",
      period: "/ month",
      description: "For growing teams needing advanced integrations",
      features: [
        "All Starter features",
        "Cloud API & Gateways Connection",
        "7,000 AI Messages / month",
        "Advanced Exporting"
      ],
      buttonText: "Upgrade Now",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "4000 EGP",
      period: "/ month",
      description: "For large organizations with unlimited scaling",
      features: [
        "All Pro features",
        "Unlimited Gateways",
        "20,000 AI Messages / month",
        "Dedicated Account Manager"
      ],
      buttonText: "Contact Sales",
      highlighted: false
    }
  ];

  const faqs = lang === 'ar' ? [
    {
      q: "كيف تتم عملية ربط الواتساب بـ ChatCore؟",
      a: "يمكنك ربط رقمك بسهولة تامة عن طريق مسح رمز الاستجابة السريعة (QR Code) من خلال تطبيق واتساب على هاتفك (الأجهزة المرتبطة) تماماً مثل واتساب ويب. كما ندعم الربط الرسمي عبر واجهات Meta Cloud API للمؤسسات الكبرى."
    },
    {
      q: "هل يؤدي إرسال الرسائل الجماعية وحملات البث لحظر الرقم؟",
      a: "نظام ChatCore مجهز بذكاء لحماية الأرقام. نقوم بجدولة الحملات في طوابير إرسال ذكية مع فترات تأخير قابلة للتخصيص بين الرسائل (Custom Delays)، بالإضافة إلى فواصل زمنية متغيرة لتشابه السلوك البشري الطبيعي، مما يقلل احتمالية حظر الرقم بشكل كبير جداً."
    },
    {
      q: "كيف أقوم بتدريب وكيل الذكاء الاصطناعي على معلومات شركتي؟",
      a: "يمكنك إدخال تعليمات النظام المخصصة (System Prompt) وتغذية وكيل الذكاء الاصطناعي بملفات تدريب خاصة (PDF, Excel, Text) أو إدخال روابط موقعك وكتالوج منتجاتك. يتعلم المساعد الذكي معلومات المنتجات ويبدأ بالرد الدقيق بناءً عليها فقط."
    },
    {
      q: "هل يمكنني ربط ويب هوكس (Webhooks) لإرسال البيانات إلى نظامي الخاص؟",
      a: "نعم، تدعم المنصة بالكامل إرسال وتلقي البيانات برمجياً. نقوم ببث أحداث الرسائل المستلمة وحالتها فوراً إلى خادمك عبر ويب هوكس (Webhooks) فائقة السرعة، بالإضافة لتوفر واجهة API لإرسال الرسائل والصور آلياً."
    },
    {
      q: "ما هي الفروقات بين الباقة المجانية والاحترافية؟",
      a: "الباقة المجانية تتيح لك تجربة كامل خصائص النظام مع تحديد سقف إرسال بـ 500 رسالة يومياً وربط جهاز واحد. الباقة الاحترافية تفتح لك خيار ربط 3 أجهزة، وإطلاق حملات جماعية بلا حدود، وتفعيل ردود Gemini المتطورة بشكل متزامن."
    },
    {
      q: "هل يمكنني تصفية وعزل محادثات كل بوابة واتساب على حدة؟",
      a: "بالتأكيد! هذا هو لب فلسفتنا في منع الفوضى. يمكنك بضغطة زر تصفية صندوق الوارد بالكامل لعرض محادثات خط اتصال معين وعزلها تماماً، مع إدارة منفصلة لوسوم العملاء وتفضيلات الذكاء الاصطناعي."
    },
    {
      q: "هل يتم تخزين المحادثات والرسائل بشكل آمن؟",
      a: "نعم، كافة الرسائل مشفرة ومحفوظة في بيئة سحابية آمنة. نتبع سياسات صارمة لحماية الخصوصية ومزامنة قواعد البيانات بشكل لحظي لضمان استقرار الخدمة بنسبة SLA تفوق 99.99%."
    }
  ] : [
    {
      q: "How do I link WhatsApp to ChatCore?",
      a: "You can link your number by scanning the QR code from your WhatsApp mobile app (Linked Devices) just like WhatsApp Web. We also support official Meta Cloud API integrations for enterprises."
    },
    {
      q: "Does sending bulk campaigns lead to number blocking?",
      a: "ChatCore is equipped with smart ant-ban safeguards. We queue messages with customizable delay intervals and randomized padding to simulate human behavior, significantly lowering the risk of account blocks."
    },
    {
      q: "How do I train the AI agent on my corporate documents?",
      a: "You can configure system instructions and upload training material (PDFs, Excel sheets, text files) or link your website catalog. The AI agent absorbs this data and replies strictly based on it."
    },
    {
      q: "Can I connect Webhooks to stream data to my server?",
      a: "Yes, the platform fully supports API connections. Inbound events are pushed instantly to your server via ultra-fast Webhooks, and we provide developer REST endpoints to send media and texts programmatically."
    },
    {
      q: "What is the difference between Starter and Pro plans?",
      a: "The Starter plan allows you to try all tools with a limit of 1 linked device. The Pro plan enables linking up to 3 devices, unlimited marketing broadcasts, webhooks, and advanced concurrent Gemini AI agents."
    },
    {
      q: "Can I isolate chat feeds per WhatsApp line?",
      a: "Absolutely! You can filter the inbox to isolate messages for a specific device with one click, keeping customer tags and AI triggers separate to prevent operator clutter."
    },
    {
      q: "Is my messaging data stored securely?",
      a: "Yes, all data streams are encrypted and hosted in cloud-secure environments. We synchronize records in real-time to guarantee 99.99% system SLA stability."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white bg-grid-pattern relative">
      {/* Dynamic Ambient Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 glass-panel bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/40 transition-all select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#00a884] to-emerald-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.323 5.322 0 11.82 0c3.148.001 6.107 1.228 8.332 3.457s3.453 5.186 3.451 8.336c-.004 6.502-5.323 11.825-11.822 11.825-1.996-.001-3.957-.512-5.7-1.481L0 24zm6.59-4.846c1.785 1.06 3.551 1.623 5.18 1.624 5.378 0 9.754-4.373 9.757-9.753.002-2.599-1.011-5.043-2.853-6.887C16.83 2.293 14.39 1.28 11.82 1.28c-5.378 0-9.752 4.373-9.755 9.754-.001 1.83.515 3.593 1.493 5.148l-1.012 3.693 3.799-1.014z" />
              </svg>
            </div>
            <div>
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-[#00a884] to-emerald-600 bg-clip-text text-transparent">ChatCore</span>
              <span className="text-[9px] block font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-left">Gateway & Portal</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-emerald-500 transition-colors uppercase">
              {lang === 'ar' ? 'المميزات | Features' : 'Features'}
            </a>
            <a href="#stats" className="hover:text-emerald-500 transition-colors uppercase">
              {lang === 'ar' ? 'فصل الحسابات | Isolation' : 'Isolation'}
            </a>
            <a href="#pricing" className="hover:text-emerald-500 transition-colors uppercase">
              {lang === 'ar' ? 'الأسعار | Pricing' : 'Pricing'}
            </a>
            <a href="#testimonials" className="hover:text-emerald-500 transition-colors uppercase">
              {lang === 'ar' ? 'الآراء | Reviews' : 'Reviews'}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => onChangeLang(lang === 'ar' ? 'en' : 'ar')}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 px-3 py-2 rounded-xl transition-all cursor-pointer border border-amber-500/20 hover:bg-amber-500/5 flex items-center gap-1"
            >
              <span>🌐 {lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            <button
              onClick={() => onGetStarted('login')}
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              onClick={() => onGetStarted('demo')}
              className="bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'احجز ديمو مجاني' : 'Book Free Demo'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline details */}
          <div className="lg:col-span-7 text-center lg:text-right space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-600 dark:text-emerald-400 self-center lg:self-start">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="text-[11px] font-black tracking-wide">
                {lang === 'ar' 
                  ? 'المنصة المتكاملة لإدارة محادثات وحملات الواتساب بالذكاء الاصطناعي' 
                  : 'Unified platform for WhatsApp CRM campaigns & AI automations'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 dark:text-white leading-tight tracking-tight">
              {lang === 'ar' ? (
                <>أتمتة ذكية ومبيعات مضاعفة مع <span className="text-gradient-primary">ChatCore</span></>
              ) : (
                <>Smart Automation & Scaled Sales with <span className="text-gradient-primary">ChatCore</span></>
              )}
            </h1>
            <p className="text-lg font-bold text-[#00a884] dark:text-emerald-400">
              {lang === 'ar'
                ? 'لوحة واتساب CRM احترافية، بوابات ربط الأجهزة المتعددة، ومساعد تلقائي بالذكاء الاصطناعي'
                : 'Professional WhatsApp CRM, Multi-Device Gateways, and AI Auto-Responders'}
            </p>

            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {lang === 'ar'
                ? 'اربط أرقامك في ثوانٍ، أطلق حملات تسويقية مستهدفة بجدولة ذكية، وفعل الرد التلقائي المعزز بنموذج Google Gemini للرد على استفسارات عملائك على مدار الساعة وبشكل منفصل لكل خط اتصال.'
                : 'Link your numbers in seconds, dispatch targeted broadcasts with safe intervals, and activate AI auto-responders powered by Google Gemini to answer customer inquiries 24/7 separately per device.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={() => onGetStarted('register')}
                className="w-full sm:w-auto bg-[#00a884] hover:bg-[#008f6f] text-white font-extrabold px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-3 text-xs"
              >
                <span>{lang === 'ar' ? 'إنشاء حساب أعمال جديد | Register' : 'Register New Account'}</span>
                <ArrowLeft className="w-4 h-4 hidden rtl:block" />
                <ArrowRight className="w-4 h-4 rtl:hidden" />
              </button>
              <button
                onClick={() => onGetStarted('login')}
                className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 font-extrabold px-6 py-4 rounded-xl transition-all cursor-pointer text-xs"
              >
                {lang === 'ar' ? 'دخول المشتركين | Subscriber Login' : 'Subscriber Login'}
              </button>
            </div>

            {/* Micro metric numbers info */}
            <div className="pt-6 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 border-t border-zinc-200/40 dark:border-zinc-800/40">
              <div>
                <span className="text-xl font-black text-zinc-800 dark:text-white block font-mono">1.2M+</span>
                <span className="text-[10px] text-zinc-400 font-bold block">
                  {lang === 'ar' ? 'رسالة مرسلة اليوم' : 'Messages Sent Today'}
                </span>
              </div>
              <div>
                <span className="text-xl font-black text-zinc-800 dark:text-white block font-mono">99.98%</span>
                <span className="text-[10px] text-zinc-400 font-bold block">
                  {lang === 'ar' ? 'استقرار واتصال' : 'System SLA stability'}
                </span>
              </div>
              <div>
                <span className="text-xl font-black text-emerald-500 block font-mono">1.4s</span>
                <span className="text-[10px] text-zinc-400 font-bold block">
                  {lang === 'ar' ? 'متوسط زمن الاستجابة' : 'Average Latency'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Sandbox Smartphone UI */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[360px] bg-zinc-900 rounded-[48px] p-3.5 border-[6px] border-zinc-800 shadow-2xl relative"
            >
              {/* Phone Speaker & Camera notches */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20 flex items-center justify-center gap-1.5">
                <div className="w-12 h-1 bg-zinc-700 rounded-full" />
                <div className="w-2.5 h-2.5 bg-zinc-950 rounded-full" />
              </div>

              {/* Screen Area */}
              <div className="bg-zinc-950 rounded-[38px] overflow-hidden h-[540px] flex flex-col relative text-right">
                
                {/* Chat Sandbox Header */}
                <div className="bg-[#00a884] text-white pt-8 pb-3 px-4 flex items-center justify-between shadow-md relative z-10 select-none">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
                    <span className="text-[9px] font-bold tracking-wider font-mono">ChatCore AI Sandbox</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <h4 className="text-[10px] font-bold">
                        {lang === 'ar' ? 'مساعد إكسبو كور' : 'ExpoCore AI Agent'}
                      </h4>
                      <span className="text-[8px] opacity-80 block">
                        {lang === 'ar' ? 'وكيل الذكاء الاصطناعي' : 'AI Autoreply Agent'}
                      </span>
                    </div>
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">
                      🤖
                    </div>
                  </div>
                </div>

                {/* Simulated message stream window */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-95 flex flex-col">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#d9fdd3] text-zinc-800 self-end rounded-tr-none text-right'
                          : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 self-start rounded-tl-none border border-zinc-100 dark:border-zinc-800 text-right'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="text-[8px] text-zinc-400 block text-left mt-1">{msg.time}</span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isAiTyping && (
                    <div className="bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 rounded-2xl rounded-tl-none p-3 text-xs self-start flex items-center gap-1 border border-zinc-100 dark:border-zinc-800">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Sandbox preset action keys */}
                <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-2 select-none">
                  <span className="text-[8px] text-zinc-400 font-bold block mb-1">
                    {lang === 'ar' ? 'اضغط للتجربة الفورية للردود | Test AI replies:' : 'Test AI Auto-replies instantly:'}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {chatPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSimulateChat(preset.text)}
                        disabled={isAiTyping}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[9px] font-semibold text-right p-2 rounded-xl border border-zinc-700/60 hover:border-[#00a884]/40 transition-colors disabled:opacity-50 cursor-pointer truncate"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Metric Overlay Panel (prevent cluttered overhead portal mandate) */}
      <section className="max-w-7xl mx-auto px-4 pb-12 select-none">
        <div className="glass-panel border border-zinc-200/50 dark:border-zinc-800/40 p-6 rounded-3xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">
              {lang === 'ar' ? 'إجمالي الرسائل | Total Processed' : 'Total Messages Sent'}
            </span>
            <span className="text-2xl font-black text-zinc-800 dark:text-white font-mono">
              {(liveSentCount || 0).toLocaleString()}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">
              {lang === 'ar' ? 'دقة وكيل الذكاء | AI Resolution' : 'AI Resolution Rate'}
            </span>
            <span className="text-2xl font-black text-[#00a884]">98.4%</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">
              {lang === 'ar' ? 'البوابات النشطة | Active Gateways' : 'Active Gateways'}
            </span>
            <span className="text-2xl font-black text-emerald-500">4 Active</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">
              {lang === 'ar' ? 'خوادم تشغيل | Service SLA' : 'Service SLA stability'}
            </span>
            <span className="text-2xl font-black text-amber-500 font-mono">99.99%</span>
          </div>
        </div>
      </section>

      {/* Success Partners Section */}
      <section className="max-w-7xl mx-auto px-4 pb-20 select-none">
        <div className="text-center space-y-2 mb-8">
          <span className="text-[10px] font-black text-[#00a884] uppercase tracking-widest block">
            {lang === 'ar' ? 'شركاء النجاح | Success Partners' : 'Success Partners'}
          </span>
          <h3 className="text-lg font-extrabold text-zinc-700 dark:text-zinc-300">
            {lang === 'ar' ? 'الشركات والكيانات التي تثق في حلولنا البرمجية' : 'Organizations that trust our messaging solutions'}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center justify-center max-w-4xl mx-auto">
          {[
            { 
              name: lang === 'ar' ? "إكسبو كور | ExpoCore" : "ExpoCore", 
              url: "http://expocore.net/",
              logo: "🚀", 
              desc: lang === 'ar' ? "أنظمة الذكاء الاصطناعي والإدارة" : "AI & Management Systems" 
            },
            { 
              name: lang === 'ar' ? "وتين | Wateen" : "Wateen", 
              url: "https://wateen.cc/",
              logo: "❤️", 
              desc: lang === 'ar' ? "حلول رقمية مبتكرة" : "Digital Solutions" 
            },
            { 
              name: "2Next Shop", 
              url: "http://2next.shop/",
              logo: "🛍️", 
              desc: lang === 'ar' ? "أنظمة التجارة الإلكترونية" : "E-Commerce Platforms" 
            }
          ].map((partner, idx) => (
            <a
              key={idx}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel border border-zinc-200/40 dark:border-zinc-800/40 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#00a884]/50 hover:bg-[#00a884]/5 hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer shadow-sm hover:shadow-lg group"
            >
              <div className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{partner.logo}</div>
              <div>
                <span className="font-extrabold text-base text-zinc-800 dark:text-zinc-200 block group-hover:text-[#00a884] transition-colors">{partner.name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold block mt-1">{partner.desc}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-zinc-900 border-y border-zinc-200/50 dark:border-zinc-800/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-black text-[#00a884] uppercase tracking-widest">
              {lang === 'ar' ? 'بنية تحتية موثوقة | Platform Capabilities' : 'System Capabilities'}
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">
              {lang === 'ar' ? 'كل ما تحتاجه لأتمتة اتصالات الواتساب والتسويق' : 'Everything you need to automate support & marketing'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {lang === 'ar'
                ? 'تم تصميم منصة ChatCore لتمنحك فصلاً كاملاً لبيانات المحادثات لكل رقم هاتف تقوم بربطه، مع تخصيص إعدادات الحملات ومساعد الذكاء الاصطناعي لكل رقم بشكل مستقل تماماً.'
                : 'ChatCore provides isolated data streams for each linked number, letting you run separate broadcast rooms, client tags, and custom AI agents independently.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="glass-panel hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/40 hover:border-[#00a884]/30 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-4 text-right">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/30 dark:border-zinc-800/80 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-zinc-800 dark:text-white">
                      {lang === 'ar' ? feat.titleAr : feat.titleEn}
                    </h3>
                    <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono text-left">{feat.titleEn}</h4>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {lang === 'ar' ? feat.descAr : feat.descEn}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed font-sans text-left">{feat.descEn}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Account Separation Showcase */}
      <section id="stats" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-right">
            <span className="text-xs font-bold text-[#00a884] uppercase tracking-widest block">
              {lang === 'ar' ? 'فصل الحسابات الذكي | Account-Isolated Inbox' : 'Account-Isolated Inbox'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              {lang === 'ar' 
                ? 'افصل بين محادثات كل حساب واتساب على حدة بمستويات تنظيمية فائقة!' 
                : 'Isolate conversation logs per gateway with high structural safety!'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {lang === 'ar'
                ? 'نحن نعلم كيف يمكن أن تكون إدارة محادثات من أرقام متعددة مربكة. لهذا قمنا ببناء نظام ذكي يسمح لك بتصفية وعرض المحادثات الخاصة بكل بوابة أو خط واتساب بشكل منفصل وبنقرة واحدة فقط، مع إمكانية إضافة وسوم CRM مخصصة (Lead, VIP, Pending) لكل محادثة بشكل منفرد.'
                : 'Managing chats from multiple numbers can get chaotic. That is why we built a smart workspace that lets you filter and view conversations for each line individually with one click, and manage separate CRM tags (Lead, VIP, Pending).'}
            </p>

            <ul className="space-y-3 pt-4 select-none">
              {(lang === 'ar' ? [
                "فلترة المحادثات الفورية حسب البوابة أو الرقم النشط",
                "نظام ذكاء اصطناعي مستقل الإعدادات والأوامر لكل رقم هاتف",
                "صندوق وارد موحد أو منفصل بالكامل لتجنب التداخل والتشتيت",
                "تقارير وإحصائيات مفصلة لكل قناة وحملة على حدة"
              ] : [
                "Filter chat histories instantly by active WhatsApp line",
                "Independent AI prompt settings per linked gateway",
                "Completely isolated inboxes to prevent operator clutter",
                "Detailed campaigns reports and logs per channel"
              ]).map((item, idx) => (
                <li key={idx} className="flex items-center justify-end gap-3 font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                  <span>{item}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/40 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Visual demo for isolated WhatsApp Accounts */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <span className="text-[10px] font-bold text-zinc-400 font-mono">Simulated Multi-Account View</span>
                <span className="text-xs font-bold text-[#00a884] bg-[#00a884]/10 px-2.5 py-1 rounded-full">
                  {lang === 'ar' ? 'بوابة المبيعات النشطة' : 'Active Sales Line'}
                </span>
              </div>

              {/* Dynamic device filter tabs */}
              <div className="flex gap-2 pb-2 overflow-x-auto select-none">
                <button className="bg-[#00a884] text-white text-[9px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0">
                  {lang === 'ar' ? 'رقم المبيعات (Sales Line)' : 'Sales Line'}
                </button>
                <button className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0">
                  {lang === 'ar' ? 'رقم الدعم الفني (Support Line)' : 'Support Line'}
                </button>
                <button className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0">
                  {lang === 'ar' ? 'حساب التسويق (Marketing)' : 'Marketing Line'}
                </button>
              </div>

              {/* Isolated chat samples */}
              <div className="space-y-2.5">
                {[
                  { name: lang === 'ar' ? "رأفت رشدي" : "Raafat Roshdi", msg: lang === 'ar' ? "أريد معرفة تفاصيل الباقة الاحترافية من فضلك.." : "I want to know the Pro package details..", status: "Lead", time: "10:15 AM", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
                  { name: lang === 'ar' ? "عمر الفاروق" : "Omar Al-Farooq", msg: lang === 'ar' ? "تم إرسال الفاتورة، شكراً لتعاملكم الراقي." : "Invoice sent, thank you for your support.", status: "VIP", time: "09:42 AM", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
                  { name: lang === 'ar' ? "سهى أحمد" : "Soha Ahmed", msg: lang === 'ar' ? "هل يتوفر لديكم خيار الربط بالـ API؟" : "Do you offer API connection options?", status: "Potential", time: "أمس", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" }
                ].map((chat, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/40 text-right">
                    <span className="text-[9px] text-zinc-400 font-bold self-start">{chat.time}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[9px] font-bold bg-[#00a884]/10 text-[#00a884] px-1.5 py-0.5 rounded-lg">{chat.status}</span>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{chat.name}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{chat.msg}</p>
                    </div>
                    <img src={chat.avatar} alt="Client avatar" className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section id="testimonials" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center select-none">
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-black text-[#00a884] uppercase tracking-widest">
            {lang === 'ar' ? 'تجارب حقيقية | Customer Success Stories' : 'Reviews & Testimonials'}
          </h2>
          <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">
            {lang === 'ar' ? 'ماذا يقول عملاؤنا عن خدماتنا؟' : 'What our customers say about us'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="glass-panel hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/40 shadow-sm hover:shadow-lg transition-all text-right flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* 5 Stars Rating */}
                <div className={`flex gap-0.5 text-amber-400 ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <p className={`text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  "{test.content}"
                </p>
              </div>
              <div className={`flex items-center gap-3 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80 ${lang === 'ar' ? 'justify-end flex-row' : 'justify-start flex-row-reverse'}`}>
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                  <div className={`flex items-center gap-1 ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                      <span>{lang === 'ar' ? 'موثق' : 'Verified'}</span>
                      <CheckCircle2 className="w-2 h-2" />
                    </span>
                    <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{test.name}</h4>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">{test.role}</span>
                </div>
                <img
                  src={test.avatar}
                  alt={test.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section (New 400%+ ROI SaaS Tiers) */}
      <section id="pricing" className="py-24 bg-white dark:bg-zinc-950 relative overflow-hidden select-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-bold bg-[#00a884]/10 text-[#00a884] px-3 py-1.5 rounded-full mb-4 inline-block shadow-sm">
              {lang === 'ar' ? 'الباقات والأسعار' : 'Pricing & Plans'}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              {lang === 'ar' ? 'اختر الباقة المناسبة لطموحك' : 'Choose the Plan for Your Ambition'}
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-sm lg:text-base leading-relaxed">
              {lang === 'ar' 
                ? 'استثمر في ذكاء مبيعاتك مع باقات مصممة لضمان أعلى عائد استثماري بأقل تكلفة ممكنة.' 
                : 'Invest in sales intelligence with plans designed to guarantee maximum ROI.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative group rounded-3xl p-8 transition-all duration-300 ${
                  plan.highlighted 
                    ? 'bg-gradient-to-b from-[#00a884]/10 to-[#00a884]/5 border-2 border-[#00a884] shadow-2xl shadow-[#00a884]/20 scale-105 z-10' 
                    : 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-[#00a884]/50'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00a884] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-[#00a884]/30">
                    {lang === 'ar' ? 'الأكثر طلباً' : 'Most Popular'}
                  </div>
                )}
                
                <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-[#00a884]' : 'text-zinc-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className="text-xs text-zinc-500 h-10">{plan.description}</p>
                
                <div className="my-6 flex items-end gap-1">
                  <span className="text-4xl font-black text-zinc-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm font-bold text-zinc-400 mb-1">{plan.period}</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlighted ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    plan.highlighted 
                      ? 'bg-[#00a884] text-white hover:bg-[#008f6f] hover:shadow-lg shadow-[#00a884]/30' 
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-500 mb-4">{lang === 'ar' ? '💳 طرق الدفع المتاحة لعملائنا في مصر' : '💳 Available Payment Methods'}</span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"><Check className="w-4 h-4"/> InstaPay</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4"/> {lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><Check className="w-4 h-4"/> {lang === 'ar' ? 'محافظ إلكترونية (فودافون كاش، اتصالات، أورانج)' : 'E-Wallets (Vodafone Cash, etc.)'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-zinc-100/50 dark:bg-zinc-900/40 border-t border-zinc-200/50 dark:border-zinc-800/40 select-none">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-black text-[#00a884] uppercase tracking-widest block">
              {lang === 'ar' ? 'الأسئلة الشائعة | FAQ' : 'FAQ Accordion'}
            </span>
            <p className="text-3xl font-black text-zinc-900 dark:text-white">
              {lang === 'ar' ? 'نجيب على جميع استفساراتك حول المنصة' : 'We answer all your questions about ChatCore'}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-6 text-right flex items-center justify-between gap-4 font-extrabold text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <span className={`flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{faq.q}</span>
                    <span className={`w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-90 text-[#00a884]' : ''}`}>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-6 pt-0 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/40 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-[#00a884] to-emerald-800 text-white py-20 text-center relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.03] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {lang === 'ar' ? 'ابدأ رحلة الأتمتة وزيادة المبيعات اليوم' : 'Start Automating & Scaling Sales Today'}
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto leading-relaxed">
            {lang === 'ar'
              ? 'انضم إلى آلاف المتاجر والشركات التي تستخدم بواباتنا الذكية لتحقيق قفزة نوعية في خدمة العملاء والمبيعات اليومية.'
              : 'Join thousands of stores and brands utilizing our smart gateways to scale customer support and boost daily revenue.'}
          </p>
          <div className="pt-4">
            <button
              onClick={() => onGetStarted('register')}
              className="bg-white text-emerald-700 hover:bg-zinc-100 font-extrabold px-8 py-4 rounded-2xl text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'سجل حسابك وابدأ مجاناً الآن' : 'Register & Start Free Trial Now'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-600 py-8 border-t border-t-zinc-200/50 dark:border-t-zinc-800/40 text-center text-xs select-none">
        <p>
          {lang === 'ar'
            ? '© 2026 جميع الحقوق محفوظة لـ ChatCore. تم تطويره بدقة تامة لإدارة محادثات الأعمال الذكية.'
            : '© 2026 ChatCore Suite. All rights reserved. Crafted with absolute precision for professional business messaging.'}
        </p>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/971555980556?text=مرحباً،%20أود%20الاستفسار%20عن%20نظام%20ChatCore" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-50 group flex flex-col items-center`}
      >
        {/* Tooltip Bubble */}
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="mb-3 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none relative shadow-[0_10px_40px_rgba(0,0,0,0.15)] whitespace-nowrap"
        >
          {lang === 'ar' ? '🤖 تحدث مع المبيعات الذكية' : '🤖 Talk to Smart Sales'}
          {/* Arrow pointing down */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-solid border-t-white dark:border-t-zinc-800 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
        </motion.div>

        {/* WhatsApp Button */}
        <div className="relative flex items-center justify-center">
          {/* Ping effect behind */}
          <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-60 scale-110"></div>
          
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-gradient-to-tr from-[#128C7E] to-[#25D366] rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] flex items-center justify-center relative z-10 border-4 border-white dark:border-zinc-950 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white relative left-0.5 top-0.5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </motion.div>
        </div>
      </a>
    </div>
  );
}
