/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Star
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: (mode: 'login' | 'register' | 'demo') => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [liveSentCount, setLiveSentCount] = useState(1284562);

  // Auto-increment live counter for visual engagement
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSentCount(prev => prev + Math.floor(Math.random() * 4) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
      descAr: "اربط عدة أرقام واتساب في لوحة تحكم واحدة، سواء عن طريق مسح الرمز السريع QR أو عن طريق Meta Cloud API والـ API الأخرى.",
      descEn: "Link multiple WhatsApp numbers in a single workspace using standard QR Web-scanning, Meta Cloud API, or gateways."
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
      titleAr: "أمان واستقرار على مدار الساعة",
      titleEn: "Enterprise Security & SLA",
      descAr: "سيرفرات سحابية آمنة ومستقرة، مع نظام تشفير يحافظ على خصوصية بيانات عملائك ومحادثاتهم بالكامل.",
      descEn: "Cloud-secure environments with state-of-the-art encryption keeping your corporate files and text flows secure."
    }
  ];

  const testimonials = [
    {
      name: "أحمد الرويلي",
      role: "مدير شركة الرواد للتسويق",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      content: "أفضل منصة استخدمتها لإدارة حملات الواتساب لشركتنا. ميزة ربط عدة أرقام وفصل المحادثات لكل رقم سهلت علينا خدمة العملاء بشكل مذهل!"
    },
    {
      name: "Sara Johnson",
      role: "E-commerce Operations Director",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      content: "The API was set up in 5 minutes. Having Gemini auto-respond to customer inquiries at 3 AM saved us thousands of dollars in hiring nocturnal support staff."
    },
    {
      name: "محمد الشافعي",
      role: "مؤسس متجر جولد ستور",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
      content: "الرد التلقائي بالذكاء الاصطناعي مع إمكانية إطلاق حملات ترويجية مستهدفة زادت من مبيعاتنا بنسبة 35٪ في الشهر الأول فقط!"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Decorative top green light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10 text-[#00a884] drop-shadow-sm animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.323 5.322 0 11.82 0c3.148.001 6.107 1.228 8.332 3.457s3.453 5.186 3.451 8.336c-.004 6.502-5.323 11.825-11.822 11.825-1.996-.001-3.957-.512-5.7-1.481L0 24zm6.59-4.846c1.785 1.06 3.551 1.623 5.18 1.624 5.378 0 9.754-4.373 9.757-9.753.002-2.599-1.011-5.043-2.853-6.887C16.83 2.293 14.39 1.28 11.82 1.28c-5.378 0-9.752 4.373-9.755 9.754-.001 1.83.515 3.593 1.493 5.148l-1.012 3.693 3.799-1.014z" />
            </svg>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-[#00a884] to-emerald-600 bg-clip-text text-transparent">WABA CRM</span>
              <span className="text-[10px] block font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-left">Gateway & Portal</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-emerald-500 transition-colors">المميزات | Features</a>
            <a href="#stats" className="hover:text-emerald-500 transition-colors">إحصائيات | Stats</a>
            <a href="#pricing" className="hover:text-emerald-500 transition-colors">الأسعار | Pricing</a>
            <a href="#testimonials" className="hover:text-emerald-500 transition-colors">الآراء | Reviews</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onGetStarted('login')}
              className="text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => onGetStarted('demo')}
              className="bg-[#00a884] hover:bg-[#008f6f] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              احجز الان نسخة ديمو
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-4xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
            <Globe className="w-4 h-4 text-[#00a884] animate-spin" />
            <span className="text-xs font-bold text-[#00a884]">
              منصة واتساب بريميوم المتكاملة والمصممة للشركات والمتاجر
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 dark:text-white leading-tight sm:leading-none tracking-tight">
            نظام <span className="text-[#00a884]">الواتساب CRM</span> والربط الذكي المتكامل
          </h1>
          <p className="text-xl font-bold text-[#00a884] dark:text-emerald-400">
            Professional WhatsApp Gateways, Multi-Device CRM, and AI Auto-Responders
          </p>

          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            اربط أرقامك، أرسل حملات تسويقية ذكية لعملائك، وفعل الرد التلقائي بالذكاء الاصطناعي مع Gemini. كل ذلك في لوحة تحكم واحدة احترافية مفصلة بالكامل ومصممة لنمو مبيعاتك.
          </p>

          {/* Live Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={() => onGetStarted('register')}
              className="w-full sm:w-auto bg-[#00a884] hover:bg-[#008f6f] text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-3 text-base"
            >
              <span>إنشاء حساب جديد (واتساب + OTP) | Register (WhatsApp + OTP)</span>
              <ArrowLeft className="w-5 h-5 hidden rtl:block" />
              <ArrowRight className="w-5 h-5 rtl:hidden" />
            </button>
            <button
              onClick={() => onGetStarted('login')}
              className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-extrabold px-8 py-4 rounded-2xl transition-all cursor-pointer text-base"
            >
              دخول المشتركين | Subscriber Login
            </button>
            <button
              onClick={() => onGetStarted('login')}
              className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-extrabold px-8 py-4 rounded-2xl transition-all cursor-pointer text-base"
            >
              تسجيل الدخول | Sign In
            </button>
          </div>
        </motion.div>

        {/* Dashboard Mockup Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 p-2 sm:p-4 relative"
        >
          {/* Top window dots */}
          <div className="flex items-center gap-2 mb-3 px-4">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 ml-4">waba-crm-portal://portal.v2</span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800/80 relative">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
              alt="Premium dashboard concept"
              className="w-full h-[350px] sm:h-[480px] object-cover opacity-90"
            />
            
            {/* Absolute interactive banner */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-transparent flex flex-col justify-end p-6 sm:p-10 text-right text-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl w-full mx-auto bg-zinc-900/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-zinc-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block">البوابات النشطة | Active Gateways</span>
                  <span className="text-2xl font-black text-emerald-500">4 Active</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block">إجمالي الرسائل | Messages Sent</span>
                  <span className="text-2xl font-black text-white font-mono">{(liveSentCount || 0).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block">معدل رد الذكاء الاصطناعي | AI Response</span>
                  <span className="text-2xl font-black text-[#00a884]">98.4%</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block">حالة الخوادم | Servers SLA</span>
                  <span className="text-2xl font-black text-amber-400">99.99% Live</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-zinc-900 border-y border-zinc-200/50 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#00a884] uppercase tracking-widest">مزايا لا محدودة | Platform Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">كل ما تحتاجه لإدارة اتصالات الواتساب والتسويق</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              تم بناء نظامنا ليفصل بين المحادثات تماماً ويعطيك تحكمًا في الحملات وإعدادات الربط والردود التلقائية لتتحكم في كل رقم واتساب بشكل مستقل بالكامل.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="bg-zinc-50 dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/40 hover:border-[#00a884]/30 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/30 dark:border-zinc-800/80 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <div className="space-y-1 text-right">
                    <h3 className="font-extrabold text-base text-zinc-800 dark:text-white">{feat.titleAr}</h3>
                    <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-mono text-left">{feat.titleEn}</h4>
                  </div>
                  <div className="space-y-2 pt-2 text-right">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{feat.descAr}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed font-sans text-left">{feat.descEn}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Separation & Account Grouping Showcase */}
      <section id="stats" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-right">
            <span className="text-xs font-bold text-[#00a884] uppercase tracking-widest block">فصل الحسابات الذكي | Account-Isolated Inbox</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              افصل بين محادثات كل حساب واتساب على حدة بمستويات تنظيمية فائقة!
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              نحن نعلم كيف يمكن أن تكون إدارة محادثات من أرقام متعددة مربكة. لهذا قمنا ببناء نظام ذكي يسمح لك بتصفية وعرض المحادثات الخاصة بكل بوابة أو خط واتساب بشكل منفصل وبنقرة واحدة فقط، مع إمكانية إضافة وسوم CRM مخصصة (Lead, VIP, Pending) لكل محادثة بشكل منفرد.
            </p>

            <ul className="space-y-3 pt-4">
              {[
                "فلترة المحادثات الفورية حسب البوابة أو الرقم النشط",
                "نظام ذكاء اصطناعي مستقل الإعدادات والأوامر لكل رقم هاتف",
                "صندوق وارد موحد أو منفصل بالكامل لتجنب التداخل والتشتيت",
                "تقارير وإحصائيات مفصلة لكل قناة وحملة على حدة"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center justify-end gap-3 font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                  <span>{item}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            
            {/* Visual demo for isolated WhatsApp Accounts */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <span className="text-[10px] font-bold text-zinc-400 font-mono">Simulated Multi-Account View</span>
                <span className="text-xs font-bold text-[#00a884] bg-[#00a884]/10 px-2.5 py-1 rounded-full">بوابة المبيعات النشطة</span>
              </div>

              {/* Dynamic device filter tabs */}
              <div className="flex gap-2 pb-2 overflow-x-auto">
                <button className="bg-[#00a884] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">رقم المبيعات (Sales Line)</button>
                <button className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 text-[10px] font-bold px-3 py-1.5 rounded-lg">رقم الدعم الفني (Support Line)</button>
                <button className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 text-[10px] font-bold px-3 py-1.5 rounded-lg">حساب التسويق (Marketing)</button>
              </div>

              {/* Isolated chat samples */}
              <div className="space-y-2.5">
                {[
                  { name: "رأفت رشدي", msg: "أريد معرفة تفاصيل الباقة الاحترافية من فضلك..", status: "Lead", time: "10:15 AM", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
                  { name: "عمر الفاروق", msg: "تم إرسال الفاتورة، شكراً لتعاملكم الراقي.", status: "VIP", time: "09:42 AM", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
                  { name: "سهى أحمد", msg: "هل يتوفر لديكم خيار الربط بالـ API؟", status: "Potential", time: "أمس", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" }
                ].map((chat, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/40 text-right">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-zinc-100/50 dark:bg-zinc-900/40 border-t border-zinc-200/50 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-[#00a884] uppercase tracking-widest">خطط الأسعار المرنة | Fair & Flexible Pricing</h2>
            <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">باقات مصممة لتناسب مختلف أحجام الشركات</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ابدأ بنظام التجربة المجانية بدون الحاجة لبطاقة ائتمان وقم بالترقية متى رغبت في التوسع.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan 1 */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200/40 dark:border-zinc-800/40 text-right flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-800 dark:text-white">الباقة التجريبية (Demo)</h3>
                  <span className="text-xs text-zinc-400 font-bold block">مخصصة للاختبار والتقييم الفوري</span>
                </div>
                <div className="text-3xl font-black text-[#00a884]">
                  $0 <span className="text-xs font-bold text-zinc-400">/ للأبد</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex justify-end items-center gap-2"><span>ربط بوابة واتساب واحدة (QR)</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>إرسال وتلقي حتى 500 رسالة يومياً</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>ردود تلقائية بالذكاء الاصطناعي (Gemini)</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2 text-zinc-300 dark:text-zinc-600"><span> Meta Cloud API الربط بـ</span><CheckCircle2 className="w-4 h-4 text-zinc-300 dark:text-zinc-700" /></li>
                </ul>
              </div>
              <button
                onClick={() => onGetStarted('register')}
                className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-[#00a884] hover:text-white text-zinc-700 dark:text-zinc-200 text-xs font-extrabold py-3.5 rounded-xl transition-all cursor-pointer mt-8"
              >
                جرب الآن مجاناً
              </button>
            </div>

            {/* Plan 2 */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-2 border-[#00a884] text-right flex flex-col justify-between relative shadow-lg">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00a884] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                الأكثر مبيعاً | Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-800 dark:text-white">الباقة الاحترافية (Pro)</h3>
                  <span className="text-xs text-[#00a884] font-bold block">مثالية للمتاجر والشركات المتوسطة</span>
                </div>
                <div className="text-3xl font-black text-[#00a884]">
                  $29 <span className="text-xs font-bold text-zinc-400">/ شهرياً</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex justify-end items-center gap-2"><span>ربط حتى 3 بوابات واتساب (QR & API)</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>إرسال حملات غير محدودة للعملاء</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>وكيل ذكاء اصطناعي متطور مستقل لكل رقم</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>لوحة CRM متكاملة لإدارة المحادثات والوسوم</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>ربط ويب هوكس وتصدير التقارير</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                </ul>
              </div>
              <button
                onClick={() => onGetStarted('register')}
                className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-extrabold py-3.5 rounded-xl transition-all cursor-pointer mt-8 shadow-md"
              >
                اشترك الآن مجاناً
              </button>
            </div>

            {/* Plan 3 */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200/40 dark:border-zinc-800/40 text-right flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-800 dark:text-white">باقة الشركات (Enterprise)</h3>
                  <span className="text-xs text-zinc-400 font-bold block">مخصصة للعلامات التجارية الكبرى</span>
                </div>
                <div className="text-3xl font-black text-[#00a884]">
                  $79 <span className="text-xs font-bold text-zinc-400">/ شهرياً</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex justify-end items-center gap-2"><span>ربط بوابات وأرقام غير محدودة</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>حملات جماعية فورية بدون قيود</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>تدريب وكلاء الذكاء الاصطناعي على ملفات مخصصة</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>خوادم مخصصة ومستقلة وفائقة الأمان</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                  <li className="flex justify-end items-center gap-2"><span>دعم فني مخصص ومستشار ربط خاص عبر الهاتف</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></li>
                </ul>
              </div>
              <button
                onClick={() => onGetStarted('register')}
                className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-extrabold py-3.5 rounded-xl transition-all cursor-pointer mt-8"
              >
                تواصل مع المبيعات
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold text-[#00a884] uppercase tracking-widest">تجارب حقيقية | Customer Success Stories</h2>
          <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">ماذا يقول عملاؤنا عن خدماتنا؟</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-lg text-right flex flex-col justify-between"
            >
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                "{test.content}"
              </p>
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-zinc-50 dark:border-zinc-800">
                <div className="text-right">
                  <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{test.name}</h4>
                  <span className="text-[10px] text-zinc-400 block">{test.role}</span>
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

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-[#00a884] to-emerald-800 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.03] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            ابدأ رحلة الأتمتة وزيادة المبيعات اليوم
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto leading-relaxed">
            انضم إلى آلاف المتاجر والشركات التي تستخدم بواباتنا الذكية لتحقيق قفزة نوعية في خدمة العملاء والمبيعات اليومية.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onGetStarted('register')}
              className="bg-white text-emerald-700 hover:bg-zinc-100 font-extrabold px-8 py-4 rounded-2xl text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              سجل حسابك وابدأ مجاناً الآن
            </button>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-600 py-8 border-t border-zinc-200/50 dark:border-zinc-800/80 text-center text-xs">
        <p>© 2026 WABA CRM Suite. All rights reserved. Crafted with absolute precision for professional business messaging.</p>
      </footer>
    </div>
  );
}
