import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Smartphone, User, KeyRound, Loader2, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DemoRegistrationProps {
  onBackToLanding: () => void;
  onLoginRequested: () => void;
}

export default function DemoRegistration({ onBackToLanding, onLoginRequested }: DemoRegistrationProps) {
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'info') {
      if (!username.trim() || !phone.trim()) {
        setError('الرجاء إدخال الاسم ورقم الواتساب الفعال');
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/api/demo-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), phone: phone.trim() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
        setStep('otp');
      } catch (err: any) {
        setError(err.message || 'فشل إرسال رمز التحقق. يرجى التأكد من الرقم.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!otp.trim()) {
        setError('الرجاء إدخال رمز التحقق (OTP) المستلم');
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/api/demo-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to verify OTP');
        setStep('info'); // Reset state
        alert('تم حجز وتفعيل النسخة الديمو بنجاح! يمكنك الآن تسجيل الدخول باستخدام حسابك التجريبي.');
        onLoginRequested();
      } catch (err: any) {
        setError(err.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 bg-grid-pattern relative overflow-hidden">
      {/* Aesthetic Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/40 shadow-2xl relative z-10 text-right select-none"
      >
        {/* Back Link */}
        <button
          onClick={onBackToLanding}
          className="text-zinc-400 hover:text-emerald-500 transition-colors mb-6 flex items-center gap-1.5 text-xs font-bold self-start cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> العودة للرئيسية
        </button>

        {/* Brand Logo Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#00a884] to-emerald-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.323 5.322 0 11.82 0c3.148.001 6.107 1.228 8.332 3.457s3.453 5.186 3.451 8.336c-.004 6.502-5.323 11.825-11.822 11.825-1.996-.001-3.957-.512-5.7-1.481L0 24zm6.59-4.846c1.785 1.06 3.551 1.623 5.18 1.624 5.378 0 9.754-4.373 9.757-9.753.002-2.599-1.011-5.043-2.853-6.887C16.83 2.293 14.39 1.28 11.82 1.28c-5.378 0-9.752 4.373-9.755 9.754-.001 1.83.515 3.593 1.493 5.148l-1.012 3.693 3.799-1.014z" />
              </svg>
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-[#00a884] to-emerald-600 bg-clip-text text-transparent">ChatCore</h1>
          </div>
          <h2 className="text-base font-extrabold text-zinc-800 dark:text-zinc-100">تفعيل نسخة ديمو تجريبية</h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 max-w-xs mx-auto leading-relaxed">
            {step === 'info' 
              ? 'احصل على خادم تجريبي مؤقت لتجربة بوابات الواتساب وحملات البث ووكلاء الذكاء الاصطناعي مجاناً.'
              : `أرسلنا رمز التفعيل إلى رقمك: ${phone}. يرجى مراجعة رسائل الواتساب الخاصة بك.`
            }
          </p>
        </div>
        
        {/* Error Alert Box */}
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-600 dark:text-rose-400 text-xs font-bold text-center mb-5 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl"
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 'info' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 mr-1">الاسم الكريم</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all text-xs font-medium text-right"
                    placeholder="اكتب اسمك هنا..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 mr-1">رقم الواتساب الفعال</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all text-xs font-medium text-left dir-ltr"
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block mt-1.5 mr-1 leading-normal">
                  ⚠️ تأكد من كتابة رقم الواتساب بشكل صحيح مع مفتاح الدولة لتلقي رمز التحقق OTP فوراً.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 mr-1">رمز التحقق المستلم (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all text-xs font-bold tracking-widest text-center"
                    placeholder="xxxxxx"
                  />
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl mt-3 flex items-start gap-2 text-right">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-bold leading-normal">
                    تنبيه: سيتم تفعيل حساب ديمو تجريبي مؤقت صالح للاختبار والتقييم لمدة 48 ساعة فقط من تاريخ التفعيل.
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-extrabold py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-500/10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{step === 'info' ? 'إرسال رمز التحقق عبر واتساب' : 'تأكيد الرمز وتفعيل النسخة'}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
