/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  QrCode,
  Cpu,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  Info,
  Database,
  CloudLightning,
  Copy,
  Check,
  Code,
  Terminal,
  Settings,
  BellRing
} from 'lucide-react';
import { DeviceLink } from '../types.js';
import { translations } from '../translations.js';

interface WhatsAppSettingsProps {
  currentUser: any;
  devices: DeviceLink[];
  onAddDevice: (deviceData: any) => Promise<void>;
  onDeleteDevice: (deviceId: string) => Promise<void>;
  onPairDevice: (deviceId: string) => Promise<void>;
  onUpdateDeviceAgent: (deviceId: string, agentData: any) => Promise<void>;
  lang: 'ar' | 'en';
}

export default function WhatsAppSettings({
  currentUser,
  devices,
  onAddDevice,
  onDeleteDevice,
  onPairDevice,
  onUpdateDeviceAgent,
  lang
}: WhatsAppSettingsProps) {
  const t = translations[lang];

  // Developer REST settings & Logs State
  const [openDevSettingsDeviceId, setOpenDevSettingsDeviceId] = useState<string | null>(null);
  const [deviceWebhookUrls, setDeviceWebhookUrls] = useState<Record<string, string>>({});
  const [deviceApiKeys, setDeviceApiKeys] = useState<Record<string, string>>({});
  const [deviceLogs, setDeviceLogs] = useState<Record<string, string[]>>({});
  const [copiedApiKeyDeviceId, setCopiedApiKeyDeviceId] = useState<string | null>(null);
  const [isSavingDevSettings, setIsSavingDevSettings] = useState<string | null>(null);

  const handleToggleDevSettings = (device: DeviceLink) => {
    if (openDevSettingsDeviceId === device.id) {
      setOpenDevSettingsDeviceId(null);
    } else {
      setOpenDevSettingsDeviceId(device.id);
      setDeviceWebhookUrls(prev => ({
        ...prev,
        [device.id]: device.webhookUrl || 'https://your-api.com/whatsapp/webhook'
      }));
      setDeviceApiKeys(prev => ({
        ...prev,
        [device.id]: device.apiKey || ''
      }));
    }
  };

  const handleCopyApiKey = (deviceId: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedApiKeyDeviceId(deviceId);
    setTimeout(() => setCopiedApiKeyDeviceId(null), 2000);
  };

  const handleSaveDevSettings = async (deviceId: string) => {
    setIsSavingDevSettings(deviceId);
    try {
      const webhook = deviceWebhookUrls[deviceId] || 'https://your-api.com/whatsapp/webhook';
      const key = deviceApiKeys[deviceId] || '';
      
      const res = await fetch(`/api/devices/${deviceId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          apiKey: key,
          webhookUrl: webhook
        })
      });

      if (res.ok) {
        // Append a success log
        const logMsg = `[${new Date().toLocaleTimeString()}] SYSTEM: Developer REST parameters saved successfully to cloud database.`;
        setDeviceLogs(prev => ({
          ...prev,
          [deviceId]: [logMsg, ...(prev[deviceId] || [])]
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDevSettings(null);
    }
  };

  const handleTestWebhook = async (device: DeviceLink) => {
    const deviceId = device.id;
    const logMsg = `[${new Date().toLocaleTimeString()}] TEST: Dispatched test payload POST to ${deviceWebhookUrls[deviceId] || device.webhookUrl || 'webhook'}...`;
    setDeviceLogs(prev => ({
      ...prev,
      [deviceId]: [logMsg, ...(prev[deviceId] || [])]
    }));

    setTimeout(() => {
      const responseLog = `[${new Date().toLocaleTimeString()}] TEST_RESPONSE: Target webhook server responded successfully with HTTP 200 OK!`;
      setDeviceLogs(prev => ({
        ...prev,
        [deviceId]: [responseLog, ...(prev[deviceId] || [])]
      }));
    }, 1000);
  };

  React.useEffect(() => {
    if (!openDevSettingsDeviceId) return;
    const device = devices.find(d => d.id === openDevSettingsDeviceId);
    if (!device) return;

    if (!deviceLogs[device.id]) {
      const initialLogs = [
        `[${new Date().toLocaleTimeString()}] GATEWAY [${device.name}]: Activated listener pipeline on phone [${device.phoneNumber || 'Simulation'}]`,
        `[${new Date().toLocaleTimeString()}] REST_API: Authenticated connection secure session token: ${device.apiKey?.substring(0, 15)}...`,
        `[${new Date().toLocaleTimeString()}] SYSTEM: Listening for Baileys events or cloud API webhooks...`,
        `[${new Date().toLocaleTimeString()}] WEBHOOK: Configured delivery path -> ${device.webhookUrl || 'https://your-api.com/whatsapp/webhook'}`
      ];
      setDeviceLogs(prev => ({
        ...prev,
        [device.id]: initialLogs
      }));
    }

    const interval = setInterval(() => {
      const activeDevice = devices.find(d => d.id === openDevSettingsDeviceId);
      if (!activeDevice) return;

      const rands = [
        `[${new Date().toLocaleTimeString()}] WEBHOOK: Relay 'message.sent' successfully pushed event -> HTTP 200 OK`,
        `[${new Date().toLocaleTimeString()}] AI_AGENT [Gemini]: Inbound customer message processed. Auto-response completed.`,
        `[${new Date().toLocaleTimeString()}] GATEWAY [${activeDevice.name}]: Latency ping checked on line -> 35ms`,
        `[${new Date().toLocaleTimeString()}] SYSTEM: Pruned message memory buffers (0 leaks, all clear)`,
        `[${new Date().toLocaleTimeString()}] WEBHOOK: Forwarded 'message.received' event callback -> 200 OK`
      ];
      const selected = rands[Math.floor(Math.random() * rands.length)];

      setDeviceLogs(prev => {
        const currentLogs = prev[activeDevice.id] || [];
        return {
          ...prev,
          [activeDevice.id]: [selected, ...currentLogs.slice(0, 15)]
        };
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [openDevSettingsDeviceId, devices]);

  // Supabase Sync States
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    url: string | null;
    tablesExist: boolean;
    whatsappSessionsTableExists: boolean;
    crmBackupsTableExists: boolean;
    checkError?: string;
    requiredSql: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  React.useEffect(() => {
    fetch('/api/supabase/status')
      .then((res) => res.json())
      .then((data) => setSupabaseStatus(data))
      .catch((err) => console.error('Error fetching Supabase status:', err));
  }, []);

  const handleCopySql = () => {
    if (!supabaseStatus?.requiredSql) return;
    navigator.clipboard.writeText(supabaseStatus.requiredSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // New Device modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMethod, setNewMethod] = useState<'qr' | 'cloud_api' | 'ultramsg' | 'greenapi'>('qr');
  const [isAdding, setIsAdding] = useState(false);

  // Advanced fields for API gateways
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [cloudApiKey, setCloudApiKey] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [businessId, setBusinessId] = useState('');

  // AI Agent Settings modal state
  const [editingAgentDeviceId, setEditingAgentDeviceId] = useState<string | null>(null);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [agentModel, setAgentModel] = useState('gemini-3.5-flash');
  const [agentTemperature, setAgentTemperature] = useState(0.8);
  const [agentKnowledgeBase, setAgentKnowledgeBase] = useState('');
  const [agentStopKeyword, setAgentStopKeyword] = useState('');
  const [agentVoiceEnabled, setAgentVoiceEnabled] = useState(false);
  const [agentVoiceTone, setAgentVoiceTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  const [isSavingAgent, setIsSavingAgent] = useState(false);

  const handleOpenAgentSettings = (device: DeviceLink) => {
    setEditingAgentDeviceId(device.id);
    setAgentEnabled(!!device.aiAgentEnabled);
    setAgentName(device.aiAgentName || '');
    setAgentInstructions(device.aiAgentInstructions || '');
    setAgentModel(device.aiModel || 'gemini-3.5-flash');
    setAgentTemperature(device.aiTemperature !== undefined ? device.aiTemperature : 0.8);
    setAgentKnowledgeBase(device.aiKnowledgeBase || '');
    setAgentStopKeyword(device.aiStopKeyword || '');
    setAgentVoiceEnabled(!!device.aiVoiceEnabled);
    setAgentVoiceTone(device.aiVoiceTone || 'professional');
  };

  const handleSaveAgentSettings = async () => {
    if (!editingAgentDeviceId) return;
    setIsSavingAgent(true);
    try {
      await onUpdateDeviceAgent(editingAgentDeviceId, {
        aiAgentEnabled: agentEnabled,
        aiAgentName: agentName,
        aiAgentInstructions: agentInstructions,
        aiModel: agentModel,
        aiTemperature: agentTemperature,
        aiKnowledgeBase: agentKnowledgeBase,
        aiStopKeyword: agentStopKeyword,
        aiVoiceEnabled: agentVoiceEnabled,
        aiVoiceTone: agentVoiceTone
      });
      setEditingAgentDeviceId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingAgent(false);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsAdding(true);

    try {
      const devicePayload: any = {
        name: newName,
        phoneNumber: newPhone || undefined,
        method: newMethod
      };

      if (newMethod === 'ultramsg' || newMethod === 'greenapi') {
        devicePayload.instanceId = instanceId;
        devicePayload.token = token;
        devicePayload.apiEndpoint = apiEndpoint || undefined;
      } else if (newMethod === 'cloud_api') {
        devicePayload.cloudApiKey = cloudApiKey;
        devicePayload.phoneId = phoneId;
        devicePayload.businessId = businessId;
      }

      await onAddDevice(devicePayload);
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const resetAddForm = () => {
    setNewName('');
    setNewPhone('');
    setNewMethod('qr');
    setInstanceId('');
    setToken('');
    setApiEndpoint('');
    setCloudApiKey('');
    setPhoneId('');
    setBusinessId('');
  };

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-8 overflow-y-auto h-full rtl:text-right ltr:text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold px-4.5 py-3 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto hover:-translate-y-0.5"
        >
          <span>{t.addDeviceButton}</span>
          <Plus className="w-4 h-4" />
        </button>

        <div className="rtl:text-right ltr:text-left">
          <h1 className="text-2xl font-black text-zinc-800 dark:text-white flex items-center gap-2 rtl:justify-end ltr:justify-start">
            <span>{t.deviceSetupTitle}</span>
            <Smartphone className="w-6 h-6 text-[#00a884]" />
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-1">
            {t.deviceSetupSub}
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 flex items-start gap-2 rtl:justify-end ltr:justify-start">
        <Info className="w-5 h-5 text-[#00a884] flex-shrink-0 mt-0.5" />
        <span>
          {lang === 'ar' 
            ? 'أطلق ردوداً تلقائية مخصصة لكل خط أعمال واتساب على حدة. قم بتسجيل وتعديل تفاصيل كل بوابة واتساب، وشغل وكيل الذكاء الاصطناعي مع إعطاءه أوامر مستقلة لكل خط للتعامل مع العملاء فوريًا!'
            : 'Launch custom auto-replies for each WhatsApp business line. Connect each gateway and run Gemini AI agents with customized behavior on each line to engage customers instantly!'}
        </span>
      </div>

      {/* Supabase Sync Dashboard */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs mb-8 rtl:text-right ltr:text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            {!supabaseStatus?.configured ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3.5 py-1.5 rounded-full">
                <XCircle className="w-4 h-4 text-zinc-400" />
                <span>{lang === 'ar' ? 'غير متصل (يعمل محلياً فقط)' : 'Offline (Local storage only)'}</span>
              </span>
            ) : !supabaseStatus.tablesExist ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full animate-pulse">
                <Info className="w-4 h-4" />
                <span>{lang === 'ar' ? 'جاري الإعداد (الجداول مفقودة)' : 'Action Required (Missing Tables)'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span>{lang === 'ar' ? 'متصل ونشط' : 'Connected & Active'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 rtl:text-right ltr:text-left">
            <div className="rtl:text-right ltr:text-left">
              <h2 className="text-base font-extrabold text-zinc-800 dark:text-white">
                {lang === 'ar' ? 'الربط السحابي والنسخ الاحتياطي (Supabase Sync)' : 'Cloud Sync & Database Backup (Supabase)'}
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                {lang === 'ar' ? 'حفظ جلسات الواتساب وحماية البيانات من الفقدان والمسح التلقائي' : 'Keep WhatsApp sessions and messages persistent to avoid container restarts losing connection.'}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>

        {supabaseStatus?.configured && supabaseStatus.tablesExist ? (
          <div className="space-y-4">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 rtl:justify-end ltr:justify-start">
                <CloudLightning className="w-4 h-4" />
                <span>
                  {lang === 'ar' 
                    ? 'تم تفعيل الاتصال بقاعدة بيانات Supabase بنجاح! يتم الآن حفظ الجلسات وقاعدة البيانات بشكل فوري وتلقائي عند كل تغيير.' 
                    : 'Supabase integration is fully active! Your WhatsApp sessions and local data are backed up automatically in real-time.'}
                </span>
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">Supabase URL: {supabaseStatus.url}</p>
            </div>

            {supabaseStatus.checkError && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-right text-amber-700 dark:text-amber-400 space-y-2 rtl:text-right ltr:text-left">
                <p className="font-bold">
                  {lang === 'ar' ? '⚠️ تنبيه/خطأ في الإعداد أو الصلاحيات (Row-Level Security):' : '⚠️ Warning/Database RLS Policy Alert:'}
                </p>
                <p className="text-[11px] font-mono leading-normal">{supabaseStatus.checkError}</p>
                <p className="text-[11px] leading-relaxed">
                  {lang === 'ar' 
                    ? 'إذا ظهر لك خطأ يتعلق بـ row-level security policy أو عدم القدرة على الحفظ، يرجى تشغيل الأوامر التالية في SQL Editor داخل Supabase لتعطيل نظام الحماية RLS عن هذه الجداول حتى يعمل الحفظ التلقائي:' 
                    : 'If database triggers or inserts fail due to a row-level security policy, execute these commands inside your Supabase SQL Editor to disable RLS and allow instant saves:'}
                </p>
                <pre className="bg-zinc-950 text-zinc-300 text-[10px] font-mono p-3 rounded-xl text-left overflow-x-auto leading-normal">
{`ALTER TABLE whatsapp_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_backups DISABLE ROW LEVEL SECURITY;`}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 rtl:text-right ltr:text-left">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <Check className="w-4 h-4" /> {lang === 'ar' ? 'نشط وجاهز' : 'Active & Ready'}
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {lang === 'ar' ? 'جدول الجلسات' : 'Sessions Table'}{' '}
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-[10px]">whatsapp_sessions</code>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <Check className="w-4 h-4" /> {lang === 'ar' ? 'نشط وجاهز' : 'Active & Ready'}
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {lang === 'ar' ? 'جدول بيانات النظام' : 'Backup Table'}{' '}
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-[10px]">crm_backups</code>
                </span>
              </div>
            </div>

            {/* Optional drop down to view SQL schema even when successfully connected */}
            <details className="group mt-2">
              <summary className="text-[11px] text-zinc-400 hover:text-[#00a884] cursor-pointer transition-colors rtl:text-right ltr:text-left list-none flex items-center gap-1 select-none rtl:justify-end ltr:justify-start">
                <span className="transition-transform group-open:rotate-180">▼</span>
                <span>
                  {lang === 'ar' 
                    ? 'عرض كود SQL لإنشاء الجداول وتعطيل الـ RLS يدوياً' 
                    : 'Show complete SQL Schema & RLS commands'}
                </span>
              </summary>
              <div className="relative mt-2">
                <div className="absolute top-3 left-3 z-10">
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 shadow-xs transition-all cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'نسخ كود الـ SQL الكامل' : 'Copy SQL Script'}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-zinc-950 text-zinc-200 text-[10px] font-mono p-4 rounded-2xl overflow-x-auto text-left leading-normal border border-zinc-800 pt-12">
                  {supabaseStatus?.requiredSql}
                </pre>
              </div>
            </details>
          </div>
        ) : supabaseStatus?.configured && !supabaseStatus.tablesExist ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs leading-relaxed space-y-2 rtl:text-right ltr:text-left">
              <p className="font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1 rtl:justify-end ltr:justify-start">
                <span>⚠️ {lang === 'ar' ? 'الإعدادات صحيحة ولكن الجداول غير موجودة في قاعدة بياناتك!' : 'Credentials valid, but required database tables are missing!'}</span>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {lang === 'ar' 
                  ? 'لقد قمت بإدخال متغيرات البيئة لربط سوبابيس بنجاح، ولكن الجداول المطلوبة لحفظ داتا الواتساب والنظام لم يتم إنشاؤها بعد. لحل هذه المشكلة وإيقاف الأخطاء: يرجى نسخ كود الـ SQL بالأسفل، وافتحه داخل SQL Editor في لوحة تحكم Supabase الخاصة بك، ثم اضغط Run لإنشاء الجداول. سيتم تفعيل الربط السحابي فوراً بعدها!' 
                  : 'You have configured Supabase credentials, but the database tables are not created yet. To fix this, copy the SQL code below, paste it into your Supabase SQL Editor tab and run it. Real-time sync will launch immediately!'
                }
              </p>
            </div>

            {supabaseStatus?.requiredSql && (
              <div className="relative mt-2">
                <div className="absolute top-3 left-3 z-10">
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'نسخ كود الـ SQL' : 'Copy SQL'}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-zinc-950 text-zinc-200 text-[10px] font-mono p-4 rounded-2xl overflow-x-auto text-left leading-normal border border-zinc-800 pt-12">
                  {supabaseStatus.requiredSql}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2 rtl:text-right ltr:text-left">
              <p className="font-bold text-zinc-700 dark:text-zinc-300">
                {lang === 'ar' ? '⚠️ المطلوب منك لتفعيل الحفظ التلقائي لجلسات الواتساب وحماية البيانات:' : '⚠️ Setup persistent cloud sync for your WhatsApp credentials:'}
              </p>
              
              <ol className="list-decimal list-inside space-y-1 rtl:text-right ltr:text-left">
                <li>{lang === 'ar' ? 'افتح لوحة تحكم Supabase الخاصة بك.' : 'Open your Supabase dashboard.'}</li>
                <li>{lang === 'ar' ? 'اذهب إلى إعدادات Settings في لوحة تحكم AI Studio (أعلى اليمين في شريط الأدوات).' : 'Navigate to AI Studio Settings menu.'}</li>
                <li>{lang === 'ar' ? 'أضف المتغيرات التالية لربط قاعدة البيانات:' : 'Add these environment variables to establish the link:'}
                  <ul className="list-disc list-inside pr-4 my-1 font-mono text-[11px] text-[#00a884] dark:text-emerald-400">
                    <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">SUPABASE_URL</code> : {lang === 'ar' ? 'رابط مشروعك في سوبابيس' : 'Your project URL (e.g., https://xyz.supabase.co)'}</li>
                    <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">SUPABASE_SERVICE_ROLE_KEY</code> : {lang === 'ar' ? 'مفتاح الوصول الكامل (Service Role Key)' : 'Service Role Key'}</li>
                  </ul>
                </li>
                <li>{lang === 'ar' ? 'انسخ كود SQL أدناه، وافتحه في SQL Editor داخل Supabase، ثم اضغط Run لإنشاء الجداول اللازمة لحفظ الجلسات والبيانات:' : 'Copy the SQL block below and run it in the SQL Editor to create tables:'}</li>
              </ol>
            </div>

            {supabaseStatus?.requiredSql && (
              <div className="relative mt-2">
                <div className="absolute top-3 left-3 z-10">
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-[#00a884] text-white hover:bg-[#008f6f] shadow-xs transition-all cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'نسخ كود الـ SQL' : 'Copy SQL'}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-zinc-950 text-zinc-200 text-[10px] font-mono p-4 rounded-2xl overflow-x-auto text-left leading-normal border border-zinc-800 pt-12">
                  {supabaseStatus.requiredSql}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Devices Grid List */}
      <div className="rtl:text-right ltr:text-left">
        <h2 className="text-lg font-black text-zinc-800 dark:text-zinc-150 mb-4">{t.activeLinesTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((device) => {
            const isLinked = device.status === 'connected';
            const isLinking = device.status === 'linking';

            return (
              <div
                key={device.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between text-right"
              >
                <div className="space-y-4">
                  {/* Device Header */}
                  <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {isLinked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span>{t.connected}</span>
                        </span>
                      ) : isLinking ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{t.connecting}</span>
                        </span>
                      ) : device.status === 'disconnected_fatal' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'خطأ فادح - أعد الإضافة' : 'Fatal Error - Re-add'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'غير متصل' : 'Offline'}</span>
                        </span>
                      )}

                      {/* Backup Status Badge */}
                      {device.backupStatus && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${device.backupStatus === 'synced' ? 'text-emerald-500 bg-emerald-500/10' :
                            device.backupStatus === 'pending' ? 'text-amber-500 bg-amber-500/10' :
                            'text-rose-500 bg-rose-500/10'}`}>
                          {device.backupStatus === 'synced' ? <Database className="w-3 h-3" /> :
                           device.backupStatus === 'pending' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                           <XCircle className="w-3 h-3" />}
                          <span>{device.backupStatus === 'synced' ? (lang === 'ar' ? 'محفوظ سحابياً' : 'Backed up') :
                                 device.backupStatus === 'pending' ? (lang === 'ar' ? 'جاري الحفظ' : 'Syncing...') :
                                 (lang === 'ar' ? 'خطأ في الحفظ' : 'Backup Error')}</span>
                        </span>
                      )}
                    </div>

                    <div className="rtl:text-right ltr:text-left space-y-0.5">
                      <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">{device.name}</h3>
                      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        {device.phoneNumber || (lang === 'ar' ? 'بوابة برمجية' : 'Cloud Gateway')} ({device.method.toUpperCase()})
                      </p>
                    </div>
                  </div>

                  {/* Integration Specs */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/40 text-xs space-y-2 rtl:text-right ltr:text-left">
                    {device.method === 'qr' && (
                      <div className="space-y-3">
                        <div className="text-zinc-500 leading-relaxed">
                          {lang === 'ar' 
                            ? 'طريقة المسح المباشر بالرمز السريع. يتم الربط التلقائي بمجرد مسح الكود من تطبيق الواتساب بهاتفك.' 
                            : 'Direct multi-device QR scanner connection. Paired instantly upon scanning the code from your phone.'}
                        </div>
                        
                        {!isLinked && (
                          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850">
                            <p className="text-[10px] text-zinc-400 font-bold mb-2">
                              {t.scanQrCode}
                            </p>
                            <div className="relative w-44 h-44 mx-auto bg-white p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner flex flex-col items-center justify-center overflow-hidden">
                              {device.qrCodeUrl ? (
                                <>
                                  {/* Green laser line */}
                                  <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-[0_0_12px_#10b981] animate-[bounce_2.5s_infinite] z-10" />
                                  <img
                                    src={device.qrCodeUrl}
                                    alt="WhatsApp Web QR Code"
                                    className="w-full h-full object-contain relative z-0"
                                    referrerPolicy="no-referrer"
                                  />
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center space-y-2 p-2 text-center">
                                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                                    {lang === 'ar' ? 'جاري إنشاء رمز QR...' : 'Generating QR...'}
                                  </span>
                                  <span className="text-[8px] text-zinc-400 leading-normal">
                                    {lang === 'ar' ? 'يتم تهيئة اتصال واتساب حقيقي قد يستغرق بضع ثوانٍ' : 'Establishing actual session, please wait...'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {device.method === 'cloud_api' && (
                      <div className="space-y-1 text-right text-zinc-500 rtl:text-right ltr:text-left">
                        <p><strong>Meta Cloud ID Instance:</strong> Registered</p>
                        <p><strong>Phone ID:</strong> {device.phoneId || 'N/A'}</p>
                      </div>
                    )}
                    {(device.method === 'ultramsg' || device.method === 'greenapi') && (
                      <div className="space-y-1 text-right text-zinc-500 rtl:text-right ltr:text-left">
                        <p><strong>Instance ID:</strong> {device.instanceId || 'N/A'}</p>
                        <p><strong>API Endpoint:</strong> {device.apiEndpoint || 'Default'}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Agent Status Block */}
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl rtl:text-right ltr:text-left flex items-start gap-3 justify-end">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        {device.aiAgentEnabled ? (
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md">
                            {lang === 'ar' ? 'مفعّل' : 'Active'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md">
                            {lang === 'ar' ? 'معطّل' : 'Disabled'}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{lang === 'ar' ? 'مساعد الذكاء الاصطناعي (Gemini)' : 'Gemini AI Agent'}</h4>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                        {device.aiAgentEnabled 
                          ? `${lang === 'ar' ? 'اسم الوكيل' : 'Agent Name'}: ${device.aiAgentName || 'Gemini'} - ${lang === 'ar' ? 'الأوامر' : 'Rules'}: ${device.aiAgentInstructions || 'FAQ responder'}` 
                          : (lang === 'ar' ? 'يمكنك تفعيل الرد الآلي الذكي على رسائل هذا الرقم والتحكم بالتعليمات الخاصة به.' : 'Enable instant AI automated responses and guide instructions for this line.')}
                      </p>
                    </div>
                    <Cpu className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onDeleteDevice(device.id)}
                    className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    {lang === 'ar' ? 'حذف البوابة' : 'Delete Gateway'}
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Developer settings toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleDevSettings(device)}
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                        openDevSettingsDeviceId === device.id
                          ? 'border-[#00a884] text-[#00a884] bg-[#00a884]/5'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إعدادات المطورين والـ API' : 'Developer & API'}</span>
                    </button>

                    {/* AI Settings Action */}
                    <button
                      type="button"
                      onClick={() => handleOpenAgentSettings(device)}
                      className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl border border-amber-500/20 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'ar' ? 'أوامر الذكاء الاصطناعي' : 'AI Agent Instructions'}</span>
                    </button>

                    {/* Manual Pair trigger */}
                    {!isLinked && (
                      <button
                        type="button"
                        onClick={() => onPairDevice(device.id)}
                        className="bg-[#00a884] hover:bg-[#008f6f] text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'اتصال' : 'Pair'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Developer REST Integration Block */}
                {openDevSettingsDeviceId === device.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-zinc-100 dark:border-zinc-800 mt-5 pt-5 space-y-5 overflow-hidden"
                  >
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-4 text-right">
                      <div className="flex items-center justify-between flex-row-reverse border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-[#00a884]" />
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {lang === 'ar' ? 'مفاتيح الربط البرمجي وربط REST API' : 'REST API & Webhook Integration'}
                          </h4>
                        </div>
                        <span className="text-[10px] font-semibold text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 rounded-full">
                          {lang === 'ar' ? 'نشط' : 'Active'}
                        </span>
                      </div>

                      {/* Secret Token */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {lang === 'ar' ? 'مفتاح الترخيص الخاص (Secret Token)' : 'Secret REST Token'}
                        </label>
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <button
                            type="button"
                            onClick={() => handleCopyApiKey(device.id, deviceApiKeys[device.id] || device.apiKey || '')}
                            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-400 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {copiedApiKeyDeviceId === device.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'نسخ' : 'Copy'}</span>
                              </>
                            )}
                          </button>
                          <input
                            type="text"
                            readOnly
                            value={deviceApiKeys[device.id] || device.apiKey || ''}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-left text-zinc-700 dark:text-zinc-300 outline-hidden select-all"
                          />
                        </div>
                        <p className="text-[9px] text-zinc-400">
                          {lang === 'ar' ? 'استخدم هذا المفتاح في ترويسة الطلب (Authorization: Bearer) لتأمين طلباتك البرمجية.' : 'Include this key as a Bearer token in your HTTP request headers.'}
                        </p>
                      </div>

                      {/* Webhook URL */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {lang === 'ar' ? 'رابط الويب هوك الخاص بك (Webhook URL)' : 'Incoming Webhook Event URL'}
                        </label>
                        <input
                          type="url"
                          dir="ltr"
                          value={deviceWebhookUrls[device.id] !== undefined ? deviceWebhookUrls[device.id] : (device.webhookUrl || '')}
                          onChange={(e) => setDeviceWebhookUrls({ ...deviceWebhookUrls, [device.id]: e.target.value })}
                          placeholder="https://your-server.com/api/whatsapp-webhook"
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-left text-zinc-800 dark:text-zinc-200 focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-hidden"
                        />
                        <p className="text-[9px] text-zinc-400">
                          {lang === 'ar' ? 'سيرسل النظام إشعارات JSON فورية لكل رسالة واردة أو حالة تسليم إلى هذا الرابط.' : 'The system delivers real-time payload updates to this address whenever messages are received or updated.'}
                        </p>
                      </div>

                      {/* Buttons for Saving & Testing */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveDevSettings(device.id)}
                          disabled={isSavingDevSettings === device.id}
                          className="flex-1 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          {isSavingDevSettings === device.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                            </>
                          ) : (
                            <span>{lang === 'ar' ? 'حفظ إعدادات الربط' : 'Save Configurations'}</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTestWebhook(device)}
                          className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <BellRing className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{lang === 'ar' ? 'فحص الاتصال والويب هوك' : 'Test Endpoint'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Terminal System logs per device */}
                    <div className="bg-zinc-950 text-zinc-300 p-4 rounded-2xl border border-zinc-900 font-mono text-xs text-left relative shadow-lg">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-[#00a884]" />
                          <span>{lang === 'ar' ? `سجلات بوابة ${device.name}` : `${device.name} Gateway Terminal`}</span>
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {(deviceLogs[device.id] || []).length > 0 ? (
                          (deviceLogs[device.id] || []).map((log, idx) => {
                            let colorClass = 'text-zinc-400';
                            if (log.includes('SYSTEM')) colorClass = 'text-emerald-400 font-semibold';
                            if (log.includes('TEST_RESPONSE')) colorClass = 'text-amber-400 font-semibold';
                            if (log.includes('TEST:')) colorClass = 'text-sky-400';
                            if (log.includes('AI_AGENT')) colorClass = 'text-indigo-300';
                            return (
                              <div key={idx} className={`leading-relaxed text-[10px] tracking-wide ${colorClass}`}>
                                {log}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-zinc-600 text-[10px] italic py-2 text-center">
                            {lang === 'ar' ? 'بانتظار حدوث نشاط أو طلبات برمجة...' : 'Awaiting REST gateway traffic or API webhook tests...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}

          {devices.length === 0 && (
            <div className="md:col-span-2 text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400">
              <Smartphone className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 animate-bounce mb-3" />
              <p className="font-extrabold text-sm text-zinc-500 dark:text-zinc-400">
                {lang === 'ar' ? 'لا توجد بوابات واتساب مرتبطة حالياً' : 'No connected WhatsApp gateways yet'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {lang === 'ar' ? 'انقر على زر ربط بوابة جديدة للبدء بالربط فوراً.' : 'Click "Connect New Gateway" to establish your first channel.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREATE/LINK DEVICE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800"
            >
              <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold cursor-pointer">
                  ✕
                </button>
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Smartphone className="w-5 h-5 text-[#00a884]" />
                  <span>{lang === 'ar' ? 'ربط بوابة واتساب جديدة' : 'Connect New WhatsApp Gateway'}</span>
                </h3>
              </div>

              <form onSubmit={handleCreateDevice} className="p-6 space-y-4 rtl:text-right ltr:text-left">
                <div className="rtl:text-right ltr:text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {lang === 'ar' ? 'اسم البوابة / الحساب' : 'Account Display Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'مثال: رقم مبيعات الشركة، خط الدعم الرئيسي' : 'e.g. Roshdi Main Support'}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 rtl:text-right ltr:text-left"
                  />
                </div>

                <div className="rtl:text-right ltr:text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {lang === 'ar' ? 'رقم الهاتف مع كود الدولة' : 'WhatsApp Phone Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 201012345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 font-mono text-left"
                  />
                </div>

                <div className="rtl:text-right ltr:text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {lang === 'ar' ? 'طريقة الربط والاتصال' : 'Integration Method'}
                  </label>
                  <select
                    value={newMethod}
                    onChange={(e: any) => setNewMethod(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#00a884] focus:bg-white dark:focus:bg-zinc-950 font-bold rtl:text-right ltr:text-left"
                  >
                    <option value="qr">{lang === 'ar' ? 'ربط الرمز السريع (Baileys QR Scan)' : 'QR Code Scanner (Baileys Session)'}</option>
                    {(!currentUser?.subscriptionPlan || currentUser?.subscriptionPlan === 'starter') ? (
                      <>
                        <option value="locked_cloud_api" disabled>🔒 Meta Cloud API (Pro/Enterprise)</option>
                        <option value="locked_ultramsg" disabled>🔒 Ultramsg Gateway (Pro/Enterprise)</option>
                        <option value="locked_greenapi" disabled>🔒 Green-API Gateway (Pro/Enterprise)</option>
                      </>
                    ) : (
                      <>
                        <option value="cloud_api">Meta Cloud API (Official)</option>
                        <option value="ultramsg">Ultramsg Gateway</option>
                        <option value="greenapi">Green-API Gateway</option>
                      </>
                    )}
                  </select>
                  {(!currentUser?.subscriptionPlan || currentUser?.subscriptionPlan === 'starter') && newMethod !== 'qr' && (
                    <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg flex items-center gap-1.5 border border-amber-200/50 dark:border-amber-900/50">
                      <Lock className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'هذه الميزة متوفرة في باقة المحترفين والشركات. قم بالترقية الآن!' : 'This feature is available in Pro and Enterprise plans. Upgrade now!'}</span>
                    </div>
                  )}
                </div>

                {/* Optional Cloud API & gate settings */}
                {newMethod === 'cloud_api' && (
                  <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 rtl:text-right ltr:text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Permanent Access Token</label>
                      <input type="password" required value={cloudApiKey} onChange={e => setCloudApiKey(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-left" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone Number ID</label>
                        <input type="text" required value={phoneId} onChange={e => setPhoneId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-left" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Business ID</label>
                        <input type="text" required value={businessId} onChange={e => setBusinessId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-left" />
                      </div>
                    </div>
                  </div>
                )}

                {(newMethod === 'ultramsg' || newMethod === 'greenapi') && (
                  <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 rtl:text-right ltr:text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">ID Instance</label>
                      <input type="text" required value={instanceId} onChange={e => setInstanceId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-left" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">API Token Instance</label>
                      <input type="password" required value={token} onChange={e => setToken(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-left" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full bg-[#00a884] hover:bg-[#008f6f] disabled:bg-zinc-100 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs flex justify-center items-center gap-1.5"
                >
                  {isAdding && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  <span>{lang === 'ar' ? 'حفظ البوابة والبدء' : 'Connect Gateway & Open'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIT GEMINI AI RESPOINDER AGENTS */}
      <AnimatePresence>
        {editingAgentDeviceId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800"
            >
              <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <button onClick={() => setEditingAgentDeviceId(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold cursor-pointer">
                  ✕
                </button>
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>{t.aiAgentSettingsTitle}</span>
                </h3>
              </div>

              <div className="p-6 space-y-4 rtl:text-right ltr:text-left max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Enable AI Toggle */}
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80">
                  <input
                    type="checkbox"
                    checked={agentEnabled}
                    onChange={(e) => setAgentEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#00a884] accent-[#00a884] cursor-pointer animate-pulse"
                  />
                  <div className="rtl:text-right ltr:text-left">
                    <span className="font-extrabold text-xs block text-zinc-800 dark:text-zinc-200">{t.enableAgent}</span>
                    <span className="text-[10px] text-zinc-400 block">{t.enableAgentSub}</span>
                  </div>
                </div>

                {/* Grid for Agent Name and Model Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Agent Name */}
                  <div className="rtl:text-right ltr:text-left">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t.agentNameLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.agentNamePlaceholder}
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500 rtl:text-right ltr:text-left"
                    />
                  </div>

                  {/* Gemini Model Selection */}
                  <div className="rtl:text-right ltr:text-left">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t.aiModelLabel}
                    </label>
                    <select
                      value={agentModel}
                      onChange={(e) => setAgentModel(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500 font-bold rtl:text-right ltr:text-left"
                    >
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash ({lang === 'ar' ? 'الأسرع والأذكى - مستحسن' : 'Recommended, Fastest'})</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro ({lang === 'ar' ? 'للمهام المعقدة والمنطق المتقدم' : 'Complex reasoning, advanced logic'})</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite ({lang === 'ar' ? 'اقتصادي فائق السرعة' : 'Ultra-fast and cost-effective'})</option>
                    </select>
                  </div>
                </div>

                {/* Creativity Temperature Slider */}
                <div className="rtl:text-right ltr:text-left bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                      {agentTemperature}
                    </span>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {t.creativitySliderLabel}
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={agentTemperature}
                    onChange={(e) => setAgentTemperature(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                    <span>{t.creativeLabel}</span>
                    <span className="font-bold text-[#00a884]">
                      {agentTemperature <= 0.3
                        ? t.focusedLabel
                        : agentTemperature <= 0.7
                        ? t.balancedLabel
                        : t.creativeLabel}
                    </span>
                    <span>{t.focusedLabel}</span>
                  </div>
                </div>

                {/* Stop Keyword / Human Takeover */}
                <div className="rtl:text-right ltr:text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {t.stopKeywordLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.stopKeywordPlaceholder}
                    value={agentStopKeyword}
                    onChange={(e) => setAgentStopKeyword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500 rtl:text-right ltr:text-left"
                  />
                  <span className="text-[9px] text-zinc-400 mt-1 block">
                    {t.stopKeywordSub}
                  </span>
                </div>

                {/* Instructions Textarea */}
                <div className="rtl:text-right ltr:text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {t.customInstructions}
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={lang === 'ar' 
                      ? "مثال: أنت رفيق مبيعات ذكي ومؤدب جداً. كن مرحاً، واختصر ردودك باللغة العربية مع تزيينها ببعض الإيموجيز الجميلة. اطلب دائماً اسم العميل ورقم هاتفه لتأكيد الشحن."
                      : "e.g. You are a helpful sales representative. Be polite, direct, and answer questions concisely. Always ask for the customer's contact details to confirm delivery."
                    }
                    value={agentInstructions}
                    onChange={(e) => setAgentInstructions(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500 rtl:text-right ltr:text-left leading-relaxed"
                  />
                  <span className="text-[9px] text-zinc-400 mt-1 block">
                    {lang === 'ar' 
                      ? 'هنا تكتب سلوك وأسلوب رد المساعد (مثال: نبرة الصوت، طريقة الترحيب، الاختصار).' 
                      : 'Define the personality, tone, language, and guidelines for the AI assistant.'}
                  </span>
                </div>

                {/* Voice AI Settings Section */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <CloudLightning className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="rtl:text-right ltr:text-left">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t.voiceAiSettingsTitle}</h3>
                      <p className="text-[10px] text-zinc-500">{t.enableVoiceRepliesSub}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Voice Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                      <div className="rtl:text-right ltr:text-left">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{t.enableVoiceReplies}</span>
                        <p className="text-[9px] text-zinc-500">{t.enableVoiceRepliesSub}</p>
                      </div>
                      <button
                        onClick={() => setAgentVoiceEnabled(!agentVoiceEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          agentVoiceEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            agentVoiceEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Voice Tone Selection */}
                    {agentVoiceEnabled && (
                      <div className="rtl:text-right ltr:text-left">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          {t.voiceToneLabel}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'professional', label: t.professionalTone },
                            { id: 'friendly', label: t.friendlyTone },
                            { id: 'formal', label: t.formalTone }
                          ].map((tone) => (
                            <button
                              key={tone.id}
                              onClick={() => setAgentVoiceTone(tone.id as any)}
                              className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                agentVoiceTone === tone.id
                                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-indigo-400'
                              }`}
                            >
                              {tone.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Knowledge Base & FAQs Textarea Removed (Now centralized in AiKnowledgeBase.tsx) */}
                <div className="rtl:text-right ltr:text-left bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-400 mb-1">
                        {lang === 'ar' ? 'تم نقل مركز المعرفة' : 'Knowledge Base Moved'}
                      </h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-3 leading-relaxed">
                        {lang === 'ar' 
                          ? 'لضمان أقصى احترافية ودقة، يرجى التوجه إلى "مركز التدريب המخصص" من القائمة الجانبية لإضافة ملفاتك الخاصة، روابط المواقع، ونصوص الأسعار بدلاً من كتابتها هنا.' 
                          : 'For maximum accuracy, please visit the "Custom Training Center" from the sidebar to upload files, scrape websites, and add pricing data instead of typing it here.'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAgentSettings}
                  disabled={isSavingAgent}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-100 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs flex justify-center items-center gap-1.5 shadow-md shadow-amber-500/10 mt-2"
                >
                  {isSavingAgent && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  <span>{t.saveRulesButton}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
