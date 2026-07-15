/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Image, Check, AlertCircle, ArrowRight, UserPlus, KeyRound } from 'lucide-react';
import { User } from '../../types.js';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
];

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthView({ onLoginSuccess, onBackToLanding, initialMode = 'login' }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'admin-login'>(initialMode);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(PRESET_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result as string);
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && step === 'info') {
      if (!username.trim() || !phone.trim()) {
        setError('الرجاء إدخال الاسم ورقم الواتساب');
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/send-otp', {
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
      return;
    }

    if (mode === 'register' && step === 'otp') {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to verify OTP');
        onLoginSuccess(data.user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Admin login logic
    if (mode === 'admin-login') {
      if (!email.trim() || !password.trim()) {
        setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password: password.trim() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Invalid credentials');
        onLoginSuccess(data.user);
      } catch (err: any) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Existing login logic
    if (mode === 'login') {
      if (!username.trim()) {
        setError('الرجاء إدخال اسم المستخدم لتسجيل الدخول');
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password: password.trim(), avatarUrl: selectedAvatar })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to authenticate user.');
        onLoginSuccess(data.user);
      } catch (err: any) {
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative WhatsApp theme strip */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#00a884] to-[#005e4d] shadow-md" />

      {/* Back button to public Landing Page */}
      <button
        onClick={onBackToLanding}
        className="absolute top-6 right-6 sm:right-10 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer z-20"
      >
        <span>العودة للرئيسية | Home</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 z-10 border border-zinc-100 dark:border-zinc-800/80 relative text-right mt-16 sm:mt-0"
      >
        {/* Absolute Logo branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <svg className="w-10 h-10 text-[#00a884]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.323 5.322 0 11.82 0c3.148.001 6.107 1.228 8.332 3.457s3.453 5.186 3.451 8.336c-.004 6.502-5.323 11.825-11.822 11.825-1.996-.001-3.957-.512-5.7-1.481L0 24zm6.59-4.846c1.785 1.06 3.551 1.623 5.18 1.624 5.378 0 9.754-4.373 9.757-9.753.002-2.599-1.011-5.043-2.853-6.887C16.83 2.293 14.39 1.28 11.82 1.28c-5.378 0-9.752 4.373-9.755 9.754-.001 1.83.515 3.593 1.493 5.148l-1.012 3.693 3.799-1.014z" />
            </svg>
            <h1 className="text-xl font-black text-zinc-800 dark:text-white">WABA CRM Gateway</h1>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
            {mode === 'register' ? 'إنشاء حساب أعمال جديد' : 'الدخول إلى لوحة التحكم'}
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#00a884] text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">حساب جديد</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#00a884] text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">دخول</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin-login'); setError(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'admin-login'
                ? 'bg-[#00a884] text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">أدمن</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 rounded-2xl p-4 flex gap-3 text-xs items-center mb-6 justify-end">
            <span>{error}</span>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'admin-login' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  البريد الإلكتروني للأدمن | Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  كلمة المرور | Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right"
                />
              </div>
            </div>
          ) : mode === 'register' ? (
            <div className="space-y-4">
              {step === 'info' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      الاسم الكامل / اسم الشركة | Full Name or Brand
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شركة الرواد، محمد رشدي"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      رقم الواتساب | WhatsApp Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: +966500000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      كلمة المرور | Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="******"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right"
                    />
                  </div>
                  {/* Preset Avatar Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
                      اختر الصورة الشخصية أو شعار الشركة | Profile / Brand Logo
                    </label>
                    <div className="grid grid-cols-6 gap-2.5 mb-4">
                      {PRESET_AVATARS.map((av) => {
                        const isSelected = selectedAvatar === av;
                        return (
                          <button
                            key={av}
                            type="button"
                            onClick={() => {
                              setSelectedAvatar(av);
                              setCustomAvatar('');
                            }}
                            className={`aspect-square rounded-full overflow-hidden border-2 relative cursor-pointer hover:opacity-80 transition-all ${
                              isSelected ? 'border-[#00a884] scale-110 shadow-md' : 'border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            <img src={av} alt="Preset Profile" className="w-full h-full object-cover" />
                            {isSelected && (
                              <span className="absolute inset-0 bg-[#00a884]/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white stroke-[3px]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    رمز التحقق المرسل للواتساب | WhatsApp OTP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل الرمز المكون من 6 أرقام"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right text-center tracking-widest text-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            // Login Mode Form
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  اسم الحساب أو الكود التعريفي | Nickname or Account ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Roshdi أو اسم حسابك"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  كلمة المرور | Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 transition-all text-right"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00a884] hover:bg-[#008f6f] disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md text-xs mt-8"
          >
            <span>{isLoading ? 'جاري التحقق...' : mode === 'register' ? 'إنشاء حساب الأعمال' : mode === 'admin-login' ? 'دخول كأدمن' : 'تسجيل الدخول'}</span>
            {mode === 'register' ? <UserPlus className="w-4 h-4" /> : mode === 'admin-login' ? <KeyRound className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
