import React, { useState, useEffect } from 'react';
import { Settings, Shield, CheckCircle2, XCircle, RefreshCw, Send, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { DeviceLink, OtpLog, OtpSettings } from '../types';

export default function OTPTesting({ lang }: { lang: 'ar' | 'en' }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [template, setTemplate] = useState('');
  const [defaultDeviceId, setDefaultDeviceId] = useState('');
  const [devices, setDevices] = useState<DeviceLink[]>([]);
  const [logs, setLogs] = useState<OtpLog[]>([]);
  
  // Test fields
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | ''>('');
  
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/otp-config');
      if (res.ok) {
        const data = await res.json();
        setTemplate(data.settings.template || '');
        setDefaultDeviceId(data.settings.defaultDeviceId || '');
        setLogs(data.logs || []);
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error('Error fetching OTP config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/otp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, defaultDeviceId })
      });
      if (res.ok) {
        setStatusType('success');
        setStatus(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
        // Clear message status after 3 seconds
        setTimeout(() => setStatus(''), 3000);
      } else {
        const data = await res.json();
        setStatusType('error');
        setStatus((lang === 'ar' ? 'فشل الحفظ: ' : 'Save failed: ') + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setStatusType('error');
      setStatus(lang === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) {
      setStatusType('error');
      setStatus(lang === 'ar' ? 'يرجى إدخال رقم الهاتف للاختبار' : 'Please enter a test phone number');
      return;
    }
    
    setSending(true);
    setStatusType('info');
    setStatus(lang === 'ar' ? 'جاري إرسال الرسالة التجريبية...' : 'Sending test message...');
    
    try {
      const res = await fetch('/api/admin/test-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusType('success');
        setStatus(
          lang === 'ar' 
            ? `تم إرسال الاختبار بنجاح! الرمز المُرسل: ${data.otp || 'N/A'}` 
            : `Test sent successfully! Sent OTP: ${data.otp || 'N/A'}`
        );
        // Refresh logs
        const refreshRes = await fetch('/api/admin/otp-config');
        if (refreshRes.ok) {
          const rData = await refreshRes.json();
          setLogs(rData.logs || []);
        }
      } else {
        setStatusType('error');
        setStatus((lang === 'ar' ? 'فشل الإرسال: ' : 'Send failed: ') + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setStatusType('error');
      setStatus(lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setSending(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  }).reverse(); // Show newest first

  // Generate real-time live preview of the message template
  const sampleOtp = '123456';
  const livePreview = testMessage || template.replace(/{otp}/gi, sampleOtp);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#00a884] animate-spin mb-4" />
        <p className="text-sm font-bold text-zinc-500">
          {lang === 'ar' ? 'جاري تحميل إعدادات وسجلات الـ OTP...' : 'Loading OTP settings and logs...'}
        </p>
      </div>
    );
  }

  const activeGateways = devices.filter(d => d.status === 'connected');

  return (
    <div className="space-y-6 rtl:text-right ltr:text-left">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-[#00a884]/10 to-teal-500/5 p-6 rounded-3xl border border-[#00a884]/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#00a884]/20 rounded-2xl text-[#00a884]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">
              {lang === 'ar' ? 'بوابة إدارة الـ OTP والتحقق الثنائي - ChatCore' : 'ChatCore OTP & Verification Manager'}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              {lang === 'ar' 
                ? 'تحكم في قالب رسالة التفعيل والتحقق، حدد البوابة الافتراضية للإرسال التلقائي، واختبر التوصيل بشكل حي ومباشر مع مراقبة المسجل الكامل.'
                : 'Control authorization message templates, assign default automatic sending channels, and test live delivery with a complete historic logging monitor.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* settings block */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
            <Settings className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            <h2 className="font-extrabold text-base text-zinc-800 dark:text-zinc-100">
              {lang === 'ar' ? 'إعدادات وقالب التفعيل' : 'Activation Settings & Template'}
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
                {lang === 'ar' ? 'قالب رسالة الـ OTP' : 'OTP Message Template'}
              </label>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: رمز التفعيل الخاص بك في ChatCore هو {otp}' : 'e.g., Your ChatCore activation code is {otp}'}
                rows={4}
                className="w-full text-sm p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#00a884] leading-relaxed font-sans"
              />
              <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                {lang === 'ar' 
                  ? 'استخدم {otp} في أي مكان بالرسالة ليتم استبدالها برمز التحقق تلقائياً.'
                  : 'Place {otp} anywhere inside the text to insert the dynamic code automatically.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
                {lang === 'ar' ? 'بوابة الإرسال الافتراضية لـ OTP' : 'Default Gateway for OTPs'}
              </label>
              <select
                value={defaultDeviceId}
                onChange={(e) => setDefaultDeviceId(e.target.value)}
                className="w-full text-sm p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              >
                <option value="">
                  {lang === 'ar' ? 'البوابة النشطة الأولى تلقائياً' : 'First active connected gateway (Auto)'}
                </option>
                {devices.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.phoneNumber || dev.method}) {dev.status === 'connected' ? `[${lang === 'ar' ? 'نشط' : 'Active'}]` : `[${lang === 'ar' ? 'غير متصل' : 'Offline'}]`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              <span>{lang === 'ar' ? 'حفظ إعدادات الـ OTP' : 'Save OTP Settings'}</span>
            </button>
          </form>
        </div>

        {/* testing block */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
            <Send className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            <h2 className="font-extrabold text-base text-zinc-800 dark:text-zinc-100">
              {lang === 'ar' ? 'منصة الاختبار الحي' : 'Live Testing Sandbox'}
            </h2>
          </div>

          <form onSubmit={handleTestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
                {lang === 'ar' ? 'رقم الهاتف المستهدف (مع رمز الدولة)' : 'Target Phone Number (With Country Code)'}
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="201012345678"
                className="w-full text-sm p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#00a884] font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'محتوى رسالة مخصصة (اختياري)' : 'Custom Test Message (Optional)'}
                </label>
                {testMessage && (
                  <button
                    type="button"
                    onClick={() => setTestMessage('')}
                    className="text-[10px] text-rose-500 font-bold hover:underline"
                  >
                    {lang === 'ar' ? 'مسح والرجوع للقالب الافتراضي' : 'Clear and use template'}
                  </button>
                )}
              </div>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder={lang === 'ar' ? 'اتركه فارغاً لاختبار القالب الافتراضي مع رمز تفعيل عشوائي' : 'Leave empty to test your main template with a random code'}
                rows={2}
                className="w-full text-sm p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#00a884] leading-relaxed font-sans"
              />
            </div>

            {/* Live message compiler preview */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                {lang === 'ar' ? 'معاينة الرسالة المُرسلة' : 'Outgoing Message Preview'}
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed font-sans italic">
                "{livePreview || (lang === 'ar' ? 'يرجى كتابة قالب أولاً...' : 'Please write a template...')}"
              </p>
            </div>

            {activeGateways.length === 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {lang === 'ar' 
                    ? 'تنبيه: لا يوجد أي بوابة واتساب متصلة حالياً. يجب ربط جهاز أولاً لتنجح في الإرسال.' 
                    : 'Warning: No active WhatsApp devices found. Pair a device first to transmit.'}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || activeGateways.length === 0}
              className="w-full py-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{lang === 'ar' ? 'إرسال رسالة الاختبار الآن' : 'Send Test Message Now'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Global Status Banner */}
      {status && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all
          ${statusType === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
            statusType === 'error' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
            'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}
        >
          {statusType === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> :
           statusType === 'error' ? <XCircle className="w-4 h-4 flex-shrink-0" /> :
           <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
          <span>{status}</span>
        </div>
      )}

      {/* Sent logs dashboard */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            <div>
              <h2 className="font-extrabold text-base text-zinc-800 dark:text-zinc-100">
                {lang === 'ar' ? 'مسجل إرسال الـ OTP' : 'OTP Transmission Logs'}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {lang === 'ar' ? 'سجل كامل ومحدث بكافة محاولات إرسال رموز التحقق' : 'Historic tracking registry of all OTP transmit requests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {/* Log filter buttons */}
            <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filter === 'all' ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-xs' : 'text-zinc-400'}`}
              >
                {lang === 'ar' ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setFilter('sent')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filter === 'sent' ? 'bg-white dark:bg-zinc-900 text-emerald-500 shadow-xs' : 'text-zinc-400'}`}
              >
                {lang === 'ar' ? 'تم الإرسال' : 'Sent'}
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filter === 'failed' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-400'}`}
              >
                {lang === 'ar' ? 'فشل' : 'Failed'}
              </button>
            </div>

            {/* Refresh Log */}
            <button
              onClick={fetchData}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-xl transition-all cursor-pointer"
              title={lang === 'ar' ? 'تحديث السجلات' : 'Refresh logs'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950/40 text-[11px] font-bold text-zinc-400 border-b border-zinc-150 dark:border-zinc-800">
                <th className="p-3 text-right">{lang === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                <th className="p-3 text-right">{lang === 'ar' ? 'المستلم' : 'Recipient'}</th>
                <th className="p-3 text-right">{lang === 'ar' ? 'الرمز' : 'OTP Code'}</th>
                <th className="p-3 text-right">{lang === 'ar' ? 'الرسالة' : 'Message'}</th>
                <th className="p-3 text-right">{lang === 'ar' ? 'البوابة' : 'Gateway'}</th>
                <th className="p-3 text-right">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-zinc-400">
                    {lang === 'ar' ? 'لا توجد سجلات مطابقة حالياً.' : 'No matching logs available at the moment.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.timestamp).toLocaleString(
                    lang === 'ar' ? 'ar-EG' : 'en-US',
                    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
                  );
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 text-xs transition-all"
                    >
                      <td className="p-3 text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">{date}</td>
                      <td className="p-3 text-zinc-800 dark:text-zinc-200 font-bold font-mono">+{log.phone}</td>
                      <td className="p-3"><span className="bg-zinc-100 dark:bg-zinc-800 font-bold px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-300 font-mono">{log.otp}</span></td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400 max-w-xs truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="p-3">
                        {log.deviceName ? (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 px-2 py-0.5 rounded-md font-bold">
                            {log.deviceName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        {log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'مرسل' : 'Sent'}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full cursor-help"
                            title={log.error || 'Unknown transmit error'}
                          >
                            <XCircle className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'فشل' : 'Failed'}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
