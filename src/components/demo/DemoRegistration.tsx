import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Smartphone, User, KeyRound, Loader2 } from 'lucide-react';

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
        setError('الرجاء إدخال الاسم ورقم الواتساب');
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
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!otp.trim()) {
        setError('الرجاء إدخال رمز التحقق');
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
        alert('تم حجز النسخة الديمو بنجاح! يمكنك الآن تسجيل الدخول.');
        onLoginRequested();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
      >
        <button
          onClick={onBackToLanding}
          className="text-zinc-400 hover:text-zinc-600 mb-6 flex items-center gap-1 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> العودة للرئيسية
        </button>

        <h2 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-6">حجز نسخة ديمو</h2>
        
        {error && <p className="text-rose-500 text-xs font-bold text-center mb-4 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'info' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">الاسم</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#00a884] outline-none transition-all text-sm"
                    placeholder="اسمك الكريم"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">رقم الواتساب</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#00a884] outline-none transition-all text-sm"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">رمز التحقق (OTP)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#00a884] outline-none transition-all text-sm"
                  placeholder="xxxxxx"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 'info' ? 'إرسال رمز التحقق' : 'تفعيل النسخة الديمو')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
