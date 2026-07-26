import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Crown, 
  Check, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Bot, 
  Database, 
  HelpCircle, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  Award,
  CreditCard,
  Building2,
  Lock
} from 'lucide-react';

interface MembershipPlansProps {
  currentUser: any;
  lang: 'ar' | 'en';
  onUpgradeSuccess?: (updatedUser: any) => void;
}

export default function MembershipPlans({ currentUser, lang, onUpgradeSuccess }: MembershipPlansProps) {
  const isAr = lang === 'ar';

  const [selectedPlanModal, setSelectedPlanModal] = useState<'starter' | 'pro' | 'enterprise' | null>(null);
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Account Current Plan Stats
  const currentPlanId = currentUser?.subscriptionStatus === 'active' || currentUser?.subscriptionStatus === 'enterprise' 
    ? 'enterprise' 
    : (currentUser?.subscriptionStatus === 'pro' ? 'pro' : 'starter');

  const currentUsageMsgs = currentUser?.aiMessagesUsed || 420;
  const currentLimitMsgs = currentPlanId === 'enterprise' ? 100000 : (currentPlanId === 'pro' ? 10000 : 1000);
  const usagePercentage = Math.min(100, Math.round((currentUsageMsgs / currentLimitMsgs) * 100));

  const plans = [
    {
      id: 'starter',
      nameAr: 'الباقة الأساسية',
      nameEn: 'Starter Plan',
      priceAr: '1,000 EGP',
      priceEn: '1,000 EGP / mo',
      badgeAr: 'للمبتدئين والمشاريع الصغيرة',
      badgeEn: 'Starter & Solopreneurs',
      popular: false,
      color: 'from-slate-700 to-slate-900',
      border: 'border-slate-300 dark:border-slate-800',
      btnBg: 'bg-slate-800 hover:bg-slate-900 text-white',
      featuresAr: [
        'ربط حساب واتساب واحد (1 Device Connection)',
        'استهلاك حتى 1,000 رسالة ذكاء اصطناعي شهرياً',
        'مساعد الشات الذكي (ChatCore Assistant)',
        'تفعيل أوتوماتيكي لرموز التحقق (OTP Manager)',
        'سجل المحادثات والـ CRM الأساسي',
        'دعم فني عبر البريد والتذاكر'
      ],
      featuresEn: [
        '1 WhatsApp Connected Device',
        'Up to 1,000 AI Messages per Month',
        'ChatCore AI Assistant',
        'Automated OTP Verification Manager',
        'Basic Conversation Logs & CRM',
        'Standard Email & Ticket Support'
      ]
    },
    {
      id: 'pro',
      nameAr: 'الباقة الاحترافية',
      nameEn: 'Pro Business Plan',
      priceAr: '2,000 EGP',
      priceEn: '2,000 EGP / mo',
      badgeAr: 'الأكثر اختياراً ونمواً 🔥',
      badgeEn: 'Most Popular Choice 🔥',
      popular: true,
      color: 'from-purple-600 via-indigo-600 to-blue-700',
      border: 'border-purple-500 shadow-xl ring-2 ring-purple-500/40',
      btnBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg',
      featuresAr: [
        'ربط حتى 5 أجهزة واتساب وتليجرام متعددة',
        'استهلاك 10,000 رسالة ذكاء اصطناعي شهرياً',
        'طاقم الموظفين الذكيين بالكامل (المبيعات + الحسابات + الدعم)',
        'توليد الفواتير الآلية PDF مع حساب VAT 14%',
        'مزامنة كتالوج المنتجات RAG Catalog Sync',
        'تحليل الصوت والفويس نوت وتفريغها آلياً',
        'دعم فني ذو أولوية فائقة'
      ],
      featuresEn: [
        'Connect up to 5 WhatsApp & Telegram Devices',
        '10,000 AI Messages per Month',
        'Full Specialized AI Agents Swarm',
        'Automated PDF Invoice Generation with 14% VAT',
        'RAG Catalog Sync & Knowledge Base',
        'Multimodal Voice Note Transcription & Intent Parsing',
        'Priority Technical Support'
      ]
    },
    {
      id: 'enterprise',
      nameAr: 'باقة الشركات المتقدمة',
      nameEn: 'Enterprise Headquarters',
      priceAr: '4,000 EGP',
      priceEn: '4,000 EGP / mo',
      badgeAr: 'للمنظومات والمؤسسات الكبرى VIP 👑',
      badgeEn: 'VIP Enterprise Headquarters 👑',
      popular: false,
      color: 'from-amber-600 via-emerald-600 to-teal-700',
      border: 'border-amber-500/60 dark:border-amber-500/40 shadow-2xl',
      btnBg: 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white shadow-xl',
      featuresAr: [
        'عدد غير محدود من أجهزة الواتساب والربط المباشر',
        'رسائل ذكاء اصطناعي وتوليد بلا حدود (Unlimited AI)',
        'مقر قيادة الشركة الذكي (Enterprise AI Headquarters)',
        'مزامنة لحظية كاملة مع قاعدة بيانات Supabase Cloud DB',
        'تحليل صور إيصالات التحويل (InstaPay / Vodafone Cash OCR)',
        'تخصيص كامل للهوية والنطاق (Custom Domain Support)',
        'دعم فني VIP مخصص على مدار 24/7'
      ],
      featuresEn: [
        'Unlimited Connected WhatsApp Devices',
        'Unlimited AI Messages & Generation',
        'Enterprise AI Headquarters Command Center',
        'Real-time Supabase Cloud DB Synchronization',
        'Instant Payment Receipt Vision OCR (InstaPay / Vodafone)',
        'Custom Branding & Domain Integration',
        'Dedicated 24/7 VIP Support Manager'
      ]
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setPaymentProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanModal) return;
    setIsSubmitting(true);
    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanModal);
      const res = await fetch('/api/auth/upgrade-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'admin-tarek',
          planId: selectedPlanModal,
          paymentProof
        })
      });

      const data = await res.json();
      setSuccessMessage(isAr ? `تم تقديم طلب الترقية لباقة ${selectedPlan?.nameAr} بنجاح وتفعيل المزايا!` : `Subscription upgraded to ${selectedPlan?.nameEn} successfully!`);
      
      if (onUpgradeSuccess && data.user) {
        onUpgradeSuccess(data.user);
      }
    } catch (err) {
      console.error('Failed to submit upgrade:', err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSelectedPlanModal(null);
        setSuccessMessage('');
      }, 2500);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Top Banner & Active Account Status */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 border border-purple-500/30 text-white shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? 'منظومة إدارة الاشتراكات والعضويات الذكية' : 'Smart Subscription Tiers Engine'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr ? 'خطط العضويات وباقات التشغيل - ChatCore Enterprise' : 'ChatCore Membership Plans & Enterprise Tiers'}
            </h1>
            <p className="text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              {isAr 
                ? 'اختر الباقة المناسبة لحجم أعمالك مع ربط أوتوماتيكي كامل لأجهزة الواتساب وطاقم الموظفين الذكيين ومزامنة السحابية.' 
                : 'Choose the ideal plan for your business scale with full AI Swarm automation and cloud DB sync.'}
            </p>
          </div>

          {/* Current Account Status Gauge */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[280px] space-y-3 shadow-lg shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">{isAr ? 'العضوية الحالية:' : 'Current Plan:'}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-xs uppercase shadow-sm flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                {currentPlanId.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-300">{isAr ? 'استهلاك الرسائل:' : 'AI Usage:'}</span>
                <span className="font-mono text-emerald-400">{currentUsageMsgs} / {currentLimitMsgs === 100000 ? '∞' : currentLimitMsgs}</span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${usagePercentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -6 }}
              className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border flex flex-col justify-between relative transition-all duration-300 ${plan.border} ${
                plan.popular ? 'shadow-2xl' : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>{isAr ? plan.badgeAr : plan.badgeEn}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-3 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    {isAr ? plan.badgeAr : plan.badgeEn}
                  </span>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center justify-between">
                    <span>{isAr ? plan.nameAr : plan.nameEn}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-300">
                        {isAr ? 'باقتك الحالية' : 'Active'}
                      </span>
                    )}
                  </h3>

                  <div className="pt-2">
                    <span className="text-3xl font-black font-mono text-zinc-900 dark:text-white">
                      {isAr ? plan.priceAr : plan.priceEn}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold mr-1"> / {isAr ? 'شهرياً' : 'month'}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {isAr ? 'الميزات والخصائص المشمولة:' : 'Included Features:'}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    {(isAr ? plan.featuresAr : plan.featuresEn).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  onClick={() => setSelectedPlanModal(plan.id as any)}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${plan.btnBg}`}
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>
                    {isCurrent 
                      ? (isAr ? 'تجديد / ترقية الباقة الحالية' : 'Renew / Manage Plan') 
                      : (isAr ? `اشتراك الآن في ${plan.nameAr}` : `Subscribe to ${plan.nameEn}`)}
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Upgrade Modal with Payment Proof Upload */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedPlanModal(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                  👑
                </div>
                <div>
                  <h3 className="font-black text-lg text-zinc-900 dark:text-white">
                    {isAr ? 'تأكيد الاشتراك وتفعيل الباقة' : 'Confirm Subscription & Payment'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {isAr ? 'تفعيل فوري لخدمات الذكاء الاصطناعي والموظفين' : 'Instant activation for AI features'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedPlanModal(null)} className="text-zinc-400 hover:text-zinc-600 font-bold text-xl cursor-pointer">✕</button>
            </div>

            {successMessage ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">{successMessage}</h4>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Payment Accounts Box */}
                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    {isAr ? 'بيانات وحسابات الدعم والتحويل الفوري:' : 'Instant Transfer Payment Methods:'}
                  </h4>
                  <div className="space-y-1.5 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <span>• InstaPay:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">trkroshdi@instapay</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <span>• فودافون كاش:</span>
                      <strong className="text-rose-600 dark:text-rose-400">01115822923</strong>
                    </div>
                  </div>
                </div>

                {/* Upload Payment Proof */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {isAr ? 'إرفاق إثبات الدفع وسكرين شوت التحويل:' : 'Upload Payment Receipt Screenshot:'}
                  </label>
                  <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-4 text-center hover:border-purple-500 transition-colors cursor-pointer bg-zinc-50 dark:bg-zinc-950">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                    <span className="text-xs text-zinc-500 font-bold block">
                      {paymentProof ? (isAr ? '✅ تم رفع سكرين شوت التحويل' : '✅ Receipt Uploaded') : (isAr ? 'اضغط لرفع صورة إيصال التحويل' : 'Click to select image')}
                    </span>
                  </div>
                  {paymentProof && (
                    <img src={paymentProof} alt="Proof" className="w-20 h-20 object-cover rounded-xl border border-zinc-300 mx-auto mt-2" />
                  )}
                </div>

                {/* WhatsApp Direct Submit Button */}
                <a
                  href={`https://wa.me/201115822923?text=${encodeURIComponent(`السلام عليكم، قمت بتحويل اشتراك باقة ${selectedPlanModal.toUpperCase()} لحساب ChatCore. أرجو تفعيل العضوية وتأكيد الفاتورة.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#00a884] hover:bg-[#008f70] text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isAr ? '💬 إرسال إشعار الدفع المباشر عبر الواتساب' : 'Send Payment Receipt via WhatsApp'}</span>
                </a>

                {/* Submit Upgrade Button */}
                <button
                  onClick={handleConfirmUpgrade}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{isAr ? 'جاري التكليف وتفعيل الباقة...' : 'Activating Plan...'}</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>{isAr ? 'تأكيد الترقية وتفعيل المزايا فوراً' : 'Confirm Upgrade & Activate Features'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
