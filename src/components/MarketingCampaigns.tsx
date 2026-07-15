/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  Megaphone,
  Plus,
  Play,
  Trash2,
  Loader2,
  Smartphone,
  CheckCircle,
  XCircle,
  Hourglass,
  Layers,
  Search,
  Filter,
  Users,
  MessageSquare,
  Send,
  Terminal,
  Clock,
  TrendingUp,
  Sparkles,
  Check,
  Activity,
  Info,
  Pencil,
  UploadCloud
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Campaign, DeviceLink, Conversation, User } from '../types.js';
import { translations } from '../translations.js';

interface MarketingCampaignsProps {
  currentUser: any;
  campaigns: Campaign[];
  devices: DeviceLink[];
  conversations?: (Conversation & { recipient: User })[];
  onAddCampaign: (campaignData: any) => Promise<void>;
  onUpdateCampaign: (campaignId: string, campaignData: any) => Promise<void>;
  onDeleteCampaign: (campaignId: string) => Promise<void>;
  onRunCampaign: (campaignId: string) => Promise<void>;
  lang: 'ar' | 'en';
}

export default function MarketingCampaigns({
  currentUser,
  campaigns,
  devices,
  conversations = [],
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onRunCampaign,
  lang
}: MarketingCampaignsProps) {
  const t = translations[lang];
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
  // Modal target choosing tabs: 'manual' | 'contacts'
  const [targetTab, setTargetTab] = useState<'manual' | 'contacts'>('manual');
  const [targetsRaw, setTargetsRaw] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  const [message, setMessage] = useState('');
  const [delay, setDelay] = useState(6);
  const [isAdding, setIsAdding] = useState(false);
  const [activeRunningId, setActiveRunningId] = useState<string | null>(null);
  
  // Main UI Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sending' | 'completed'>('all');
  
  // Log viewer terminal state: campaignId -> boolean
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  // EXTREME PROFESSIONALISM: State to toggle detailed recipients view per campaign
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({});
  
  // Smart Gemini AI assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<'professional' | 'creative' | 'friendly' | 'urgent'>('professional');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Call API to generate smart WhatsApp marketing copy using Gemini
  const handleGenerateAIMessage = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    setAiError('');
    try {
      const res = await fetch('/api/campaigns/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: selectedTone,
          language: lang
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setMessage(data.text);
        }
      } else {
        throw new Error('Failed to fetch AI suggestion');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(lang === 'ar' ? 'فشل الاتصال بالذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.' : 'AI generation failed. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Reset and dispatch retry for failed campaign targets
  const handleRetryFailedTargets = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        // Automatically open log console to view progressive retrying
        setExpandedLogs(prev => ({ ...prev, [campaignId]: true }));
      }
    } catch (err) {
      console.error('Failed to retry campaign failed targets:', err);
    }
  };

  // WhatsApp Anti-Block ban safety calculator
  const calculateAntiBlockScore = () => {
    let score = 0;
    const tips: string[] = [];

    // 1. Personalization check
    if (message.includes('{name}') || message.includes('{{name}}')) {
      score += 40;
    } else {
      tips.push(lang === 'ar' ? 'أضف متغير الاسم {name} لتخصيص الرسالة وتفادي تكرار النص المسبب للحظر.' : 'Add the name variable {name} to personalize outreach.');
    }

    // 2. Queue delay slider safety check
    if (delay >= 8) {
      score += 30;
    } else if (delay >= 5) {
      score += 20;
    } else {
      tips.push(lang === 'ar' ? 'زد الفاصل الزمني (أكثر من 6 ثوانٍ) لمنع خوارزميات واتساب من اعتبار الإرسال ريبوت آلي.' : 'Increase the sending delay (over 6s) to emulate organic messaging pace.');
    }

    // 3. Spiciness/Length of content
    if (message.trim().length > 40) {
      score += 20;
    } else if (message.trim().length > 15) {
      score += 10;
    } else {
      tips.push(lang === 'ar' ? 'اكتب رسالة تفصيلية؛ الرسائل فائقة القصر تبدو كرسائل سبام مكررة.' : 'Draft a rich, descriptive message. Ultra-short text is flagged easier.');
    }

    // 4. Quantity safety check
    let targetCount = 0;
    if (targetTab === 'manual') {
      targetCount = targetsRaw.split(/[\n,]/).map(t => t.trim()).filter(t => t.length > 5).length;
    } else {
      targetCount = selectedContactIds.length;
    }

    if (targetCount <= 15) {
      score += 10;
    } else if (targetCount <= 50) {
      score += 5;
    } else {
      tips.push(lang === 'ar' ? 'تجنب الدفعات الضخمة؛ ننصح بإرسال الحملة لـ 50 جهة اتصال كحد أقصى في الدفعة.' : 'Avoid mass queues. We recommend segmenting broadcasts to 50 contacts max.');
    }

    return { score, tips };
  };
  
  // Custom templates
  const templates = lang === 'ar' ? [
    { title: 'رسالة ترحيبية بالعملاء الجدد', text: 'أهلاً بك يا {name}، يسعدنا اهتمامك بمتجرنا! إليك كود خصم خاص بك 10%: WELCOME10' },
    { title: 'تنبيه عروض نهاية الأسبوع', text: 'مرحباً {name}! خصومات كبرى تصل إلى 50% تبدأ اليوم على كافة منتجاتنا. لا تفوت الفرصة!' },
    { title: 'متابعة الطلبات المعلقة', text: 'مرحباً {name}، نود تذكيرك بأن طلبك لا يزال بانتظار التأكيد. هل ترغب في إكماله الآن؟' },
    { title: 'استبيان رأي ورضا العملاء', text: 'عزيزنا {name}، رأيك يهمنا لتقديم خدمة أفضل. ما هو تقييمك لآخر تجربة تسوق لك معنا؟' }
  ] : [
    { title: 'Welcome Message for New Clients', text: 'Hello {name}, we are thrilled to have you here! Use discount code WELCOME10 for 10% off your first order.' },
    { title: 'Weekend Promo Alert', text: 'Hi {name}! Major weekend deals of up to 50% off are live now on our catalog. Don\'t miss out!' },
    { title: 'Follow-up on Pending Orders', text: 'Hi {name}, we noticed your order is pending confirmation. Would you like to complete it today?' },
    { title: 'Customer Satisfaction Survey', text: 'Dear {name}, your feedback matters! How would you rate your last shopping experience with us?' }
  ];

  // Helper to extract a number from conversation recipient username
  const cleanPhoneFromRecipient = (recipient: User) => {
    // If it is a phone number like "contact_201..." extract digits, or return username clean
    const username = recipient.username;
    const cleanDigits = username.replace(/[^\d]/g, '');
    if (cleanDigits.length >= 8) return cleanDigits;
    // Generate a pseudo safe phone based on user ID or text
    const numericPart = recipient.id.replace(/[^\d]/g, '');
    return numericPart.length >= 9 ? numericPart : `20120${Math.abs(hashString(recipient.id)) % 10000000}`;
  };

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const handleApplyTemplate = (text: string) => {
    setMessage(text);
  };

  const toggleContactSelection = (contactId: string) => {
    if (selectedContactIds.includes(contactId)) {
      setSelectedContactIds(prev => prev.filter(id => id !== contactId));
    } else {
      setSelectedContactIds(prev => [...prev, contactId]);
    }
  };

  const handleSelectAllContacts = () => {
    if (selectedContactIds.length === conversations.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(conversations.map(c => c.recipient.id));
    }
  };

  const parseManualTargets = (rawText: string) => {
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return lines.map(line => {
      // Split on common delimiters: comma, tab, semicolon, vertical line, colon
      const parts = line.split(/[,\t;|:]/).map(p => p.trim());
      if (parts.length >= 2) {
        // Simple regex to see which part is the phone number
        const phoneRegex = /^\+?[\d\s-]{6,20}$/;
        const isPart0Phone = phoneRegex.test(parts[0].replace(/[\s-]/g, ''));
        const isPart1Phone = phoneRegex.test(parts[1].replace(/[\s-]/g, ''));

        if (isPart0Phone && !isPart1Phone) {
          return {
            phone: parts[0].replace(/[^\d+]/g, ''),
            name: parts[1],
            status: 'pending' as const
          };
        } else if (isPart1Phone && !isPart0Phone) {
          return {
            phone: parts[1].replace(/[^\d+]/g, ''),
            name: parts[0],
            status: 'pending' as const
          };
        } else {
          // Fallback: assume second is phone, first is name
          return {
            phone: parts[1].replace(/[^\d+]/g, ''),
            name: parts[0],
            status: 'pending' as const
          };
        }
      } else {
        // Only one part (just phone)
        const cleanPhone = line.replace(/[^\d+]/g, '');
        return {
          phone: cleanPhone,
          name: lang === 'ar' ? 'عميل مميز' : 'Valued Customer',
          status: 'pending' as const
        };
      }
    }).filter(t => t.phone.length > 5);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          alert(lang === 'ar' ? 'ملف الإكسيل فارغ!' : 'Excel sheet is empty!');
          return;
        }

        const firstRow = jsonData[0];
        let nameColIndex = -1;
        let phoneColIndex = -1;

        if (firstRow && Array.isArray(firstRow)) {
          firstRow.forEach((val, index) => {
            const str = String(val).toLowerCase().trim();
            if (str.includes('name') || str.includes('الاسم') || str.includes('اسم') || str.includes('username') || str.includes('client')) {
              nameColIndex = index;
            }
            if (str.includes('phone') || str.includes('الرقم') || str.includes('الهاتف') || str.includes('رقم') || str.includes('mobile') || str.includes('number') || str.includes('tel')) {
              phoneColIndex = index;
            }
          });
        }

        const parsedEntries: string[] = [];
        const startRow = (nameColIndex !== -1 || phoneColIndex !== -1) ? 1 : 0;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          let nameVal = '';
          let phoneVal = '';

          if (nameColIndex !== -1 && row[nameColIndex] !== undefined) {
            nameVal = String(row[nameColIndex]).trim();
          }
          if (phoneColIndex !== -1 && row[phoneColIndex] !== undefined) {
            phoneVal = String(row[phoneColIndex]).trim();
          }

          if (nameColIndex === -1 && phoneColIndex === -1) {
            if (row.length >= 2) {
              const phoneRegex = /^\+?[\d\s-]{6,20}$/;
              const part0Str = String(row[0]).trim();
              const part1Str = String(row[1]).trim();
              const isPart0Phone = phoneRegex.test(part0Str.replace(/[\s-]/g, ''));
              const isPart1Phone = phoneRegex.test(part1Str.replace(/[\s-]/g, ''));

              if (isPart0Phone && !isPart1Phone) {
                phoneVal = part0Str;
                nameVal = part1Str;
              } else if (isPart1Phone && !isPart0Phone) {
                phoneVal = part1Str;
                nameVal = part0Str;
              } else {
                nameVal = part0Str;
                phoneVal = part1Str;
              }
            } else {
              phoneVal = String(row[0]).trim();
            }
          }

          if (phoneVal) {
            const cleanPhone = phoneVal.replace(/[^\d+]/g, '');
            if (cleanPhone.length > 5) {
              if (nameVal) {
                parsedEntries.push(`${nameVal}, ${cleanPhone}`);
              } else {
                parsedEntries.push(cleanPhone);
              }
            }
          }
        }

        if (parsedEntries.length > 0) {
          setTargetsRaw(prev => {
            const current = prev.trim();
            return current ? `${current}\n${parsedEntries.join('\n')}` : parsedEntries.join('\n');
          });
          alert(lang === 'ar' 
            ? `تم استيراد ${parsedEntries.length} جهة اتصال بنجاح من شيت الإكسيل!` 
            : `Successfully imported ${parsedEntries.length} contacts from Excel sheet!`
          );
        } else {
          alert(lang === 'ar' ? 'فشل استخراج أرقام هواتف صالحة من الملف!' : 'Failed to extract valid phone numbers from file!');
        }

      } catch (err) {
        console.error('Failed to parse Excel:', err);
        alert(lang === 'ar' ? 'حدث خطأ أثناء قراءة ملف الإكسيل.' : 'An error occurred while reading the Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleStartEditCampaign = (camp: Campaign) => {
    setEditingCampaignId(camp.id);
    setName(camp.name);
    setSelectedDeviceId(camp.deviceId || '');
    setMessage(camp.templateText);
    setDelay(camp.delay || 6);
    
    // Format targets list as lines of Name, Phone
    const formattedTargets = camp.targets.map(t => {
      if (t.name && t.name !== 'عميل مميز' && t.name !== 'Valued Customer') {
        return `${t.name}, ${t.phone}`;
      }
      return t.phone;
    }).join('\n');
    
    setTargetsRaw(formattedTargets);
    setTargetTab('manual');
    setShowAddModal(true);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    let targetsPayload: { phone: string; name: string; status: 'pending' }[] = [];

    if (targetTab === 'manual') {
      if (!targetsRaw.trim()) return;
      targetsPayload = parseManualTargets(targetsRaw);

      if (targetsPayload.length === 0) {
        alert(lang === 'ar' ? 'الرجاء إدخال أرقام هواتف صالحة!' : 'Please enter valid phone numbers!');
        return;
      }
    } else {
      if (selectedContactIds.length === 0) {
        alert(lang === 'ar' ? 'الرجاء تحديد جهة اتصال واحدة على الأقل!' : 'Please select at least one contact!');
        return;
      }

      targetsPayload = conversations
        .filter(c => selectedContactIds.includes(c.recipient.id))
        .map(c => ({
          phone: cleanPhoneFromRecipient(c.recipient),
          name: c.recipient.username || 'Client',
          status: 'pending' as const
        }));
    }

    setIsAdding(true);

    try {
      if (editingCampaignId) {
        await onUpdateCampaign(editingCampaignId, {
          name,
          deviceId: selectedDeviceId || (devices[0]?.id || 'simulation_device'),
          templateText: message,
          delay,
          targets: targetsPayload,
          status: 'draft' // Reset back to draft when they edit
        });
      } else {
        await onAddCampaign({
          name,
          deviceId: selectedDeviceId || (devices[0]?.id || 'simulation_device'),
          templateText: message,
          delay,
          targets: targetsPayload
        });
      }

      setShowAddModal(false);
      setEditingCampaignId(null);
      setName('');
      setTargetsRaw('');
      setSelectedContactIds([]);
      setMessage('');
      setSelectedDeviceId('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRunQueue = async (campaignId: string) => {
    setActiveRunningId(campaignId);
    // Auto expand logs to watch real-time flow
    setExpandedLogs(prev => ({ ...prev, [campaignId]: true }));
    try {
      await onRunCampaign(campaignId);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setActiveRunningId(null), 1000);
    }
  };

  const toggleLogs = (campaignId: string) => {
    setExpandedLogs(prev => ({ ...prev, [campaignId]: !prev[campaignId] }));
  };

  // Filtered campaigns list
  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          camp.templateText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate aggregated analytics for the bento dashboard
  const totalSentMessages = campaigns.reduce((acc, c) => acc + c.targets.filter(t => t.status === 'sent').length, 0);
  const totalFailedMessages = campaigns.reduce((acc, c) => acc + c.targets.filter(t => t.status === 'failed').length, 0);
  const totalTargetsAll = campaigns.reduce((acc, c) => acc + c.targets.length, 0);
  const successRate = totalSentMessages + totalFailedMessages > 0 
    ? Math.round((totalSentMessages / (totalSentMessages + totalFailedMessages)) * 100) 
    : 100;

  // EXTREME PROFESSIONALISM: Recharts campaign performance over time data aggregation
  const chartData = [...campaigns]
    .filter(c => c.targets.length > 0)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(camp => {
      const sentCount = camp.targets.filter(t => t.status === 'sent').length;
      const failedCount = camp.targets.filter(t => t.status === 'failed').length;
      const totalMessages = sentCount + failedCount; // Total attempted/sent messages
      return {
        name: camp.name.length > 12 ? camp.name.slice(0, 12) + '...' : camp.name,
        fullName: camp.name,
        sent: totalMessages, // 'Messages Sent' (attempted dispatches)
        success: sentCount, // 'Delivery Success'
        rate: totalMessages > 0 ? Math.round((sentCount / totalMessages) * 100) : 100,
        date: new Date(camp.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xl text-xs space-y-1 z-50">
          <p className="font-extrabold text-zinc-800 dark:text-white mb-1.5">{payload[0].payload.fullName || label}</p>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-zinc-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {lang === 'ar' ? 'المرسلة:' : 'Sent:'}
            </span>
            <span className="font-extrabold font-mono text-zinc-900 dark:text-zinc-100">{payload[0].value}</span>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-zinc-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {lang === 'ar' ? 'تم تسليمها:' : 'Delivered:'}
            </span>
            <span className="font-extrabold font-mono text-zinc-900 dark:text-zinc-100">{payload[1]?.value ?? 0}</span>
          </div>
          <div className="flex items-center gap-2 justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5 mt-1.5 text-[10px]">
            <span className="text-zinc-400">{lang === 'ar' ? 'معدل النجاح:' : 'Success Rate:'}</span>
            <span className="font-black text-emerald-500">{payload[0].payload.rate}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render a live preview text replacing placeholders like {name}
  const getLivePreviewText = () => {
    if (!message) return lang === 'ar' ? 'معاينة الرسالة تظهر هنا...' : 'Message preview appears here...';
    return message.replace(/\{name\}/g, lang === 'ar' ? 'أحمد' : 'Alex')
                  .replace(/\{phone\}/g, '+20112345678');
  };

  // Find connected devices
  const connectedDevicesCount = devices.filter(d => d.status === 'connected').length;

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8 overflow-y-auto h-full rtl:text-right ltr:text-left select-none">
      
      {/* Top Professional Gateway Health Banner */}
      {connectedDevicesCount === 0 && (
        <div className="mb-6 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-extrabold">
              {lang === 'ar' ? 'وضع المحاكاة نشط (لم يتم ربط خطوط واتساب حقيقية)' : 'Simulation Mode Active (No real WhatsApp lines linked)'}
            </p>
            <p className="opacity-85 mt-0.5 font-medium">
              {lang === 'ar' 
                ? 'الحملات ستعمل بكفاءة وسرعة فائقة عبر بوابتنا السحابية الافتراضية. لربط واتساب حقيقي وإرسال رسائل من رقمك، انتقل لعلامة "الربط".' 
                : 'Broadcast dispatches will simulate instantly via our public sandbox gateway. To route messages from your actual phone, connect a device inside the "Connect" tab.'}
            </p>
          </div>
        </div>
      )}

      {/* Page Title & Main Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 rtl:justify-start ltr:justify-start">
            <Megaphone className="w-6 h-6 text-[#00a884] animate-bounce" />
            <span>{t.broadcastTitle}</span>
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-1">
            {lang === 'ar' 
              ? 'بث الرسائل التسويقية الذكية، تتبع الأداء التدريجي، ومعاينة حية وتفاعلية لرسائل عملائك.' 
              : 'Broadcast intelligent outreach messages, track progressive speeds, and view interactive customer mock previews.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-[#00a884] to-emerald-500 hover:from-[#008f6f] hover:to-emerald-600 text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>{t.newCampaignButton}</span>
          <Plus className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Professional Bento-Grid Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Metric 1: Total Broadcast Sent */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'ar' ? 'تم تسليمه بنجاح' : 'Delivered Broadcasts'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-zinc-900 dark:text-white block">
              {totalSentMessages}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              {lang === 'ar' ? `من أصل ${totalTargetsAll} مستهدف` : `out of ${totalTargetsAll} targets`}
            </span>
          </div>
        </div>

        {/* Metric 2: Success Delivery Rate */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'ar' ? 'معدل نجاح الوصول' : 'Outreach Success Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-zinc-900 dark:text-white block">
              {successRate}%
            </span>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${successRate}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Active Campaigns */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'ar' ? 'الحملات الجارية' : 'Sending in Progress'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-zinc-900 dark:text-white block">
              {campaigns.filter(c => c.status === 'sending').length}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              {lang === 'ar' ? 'حملات تبث تدريجياً' : 'Campaigns broadcasting live'}
            </span>
          </div>
        </div>

        {/* Metric 4: SVG Interactive Graph */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-4 rounded-3xl flex flex-col justify-between md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'ar' ? 'منحنى أداء البث' : 'Delivery Performance'}
            </span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">
              {lang === 'ar' ? 'مستقر' : 'Stable'}
            </span>
          </div>
          <div className="h-12 w-full flex items-end">
            <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-500 overflow-visible" preserveAspectRatio="none">
              <path
                d="M0 25 C 15 20, 30 15, 45 28 C 60 5, 75 10, 90 2 C 100 5, 100 5, 100 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0 25 C 15 20, 30 15, 45 28 C 60 5, 75 10, 90 2 C 100 5, 100 5, 100 5 L 100 30 L 0 30 Z"
                fill="url(#sparkGradient)"
                opacity="0.15"
              />
              <defs>
                <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Campaign Performance Analytics Section (Recharts Line Chart) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 rounded-3xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00a884]" />
              <span>{lang === 'ar' ? 'منحنى أداء حملات البث والوصول' : 'Outreach & Campaign Performance Trends'}</span>
            </h3>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium">
              {lang === 'ar' 
                ? 'تحليل ذكي لمقارنة الرسائل المرسلة مقابل تسليمها بنجاح مع تقدم الوقت.' 
                : 'Intelligent line comparison tracking cumulative dispatches versus successful delivery rates.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>{lang === 'ar' ? 'الرسائل المرسلة' : 'Messages Sent'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{lang === 'ar' ? 'تسليم ناجح' : 'Delivery Success'}</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20">
              <TrendingUp className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2 animate-pulse" />
              <p className="text-xs font-extrabold text-zinc-600 dark:text-zinc-400">
                {lang === 'ar' ? 'لا توجد بيانات كافية لعرض المنحنى' : 'No Performance Data Available Yet'}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 max-w-xs font-medium">
                {lang === 'ar' 
                  ? 'قم بإنشاء حملة تسويقية جديدة وإرسالها لبدء تجميع تحليلات الوصول الحية.' 
                  : 'Launch your first campaign dispatch to automatically populate dynamic analytics lines.'}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" className="hidden dark:block" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#00a884', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={{ r: 4, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Advanced Filter and Search Bar Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-4 rounded-3xl mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Field */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'البحث عن حملة تسويقية...' : 'Search campaigns...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs outline-none focus:border-[#00a884] font-medium transition-all"
          />
        </div>

        {/* Status Tabs/Buttons Selector */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-xs px-4 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
              statusFilter === 'all' 
                ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-xs' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            {lang === 'ar' ? 'الكل' : 'All'}
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`text-xs px-4 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
              statusFilter === 'draft' 
                ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-xs' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            {lang === 'ar' ? 'مسودات' : 'Drafts'}
          </button>
          <button
            onClick={() => setStatusFilter('sending')}
            className={`text-xs px-4 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
              statusFilter === 'sending' 
                ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-xs' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            {lang === 'ar' ? 'قيد الإرسال' : 'Active'}
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`text-xs px-4 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
              statusFilter === 'completed' 
                ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-xs' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            {lang === 'ar' ? 'منتهية' : 'Completed'}
          </button>
        </div>
      </div>

      {/* Campaigns Listing Container */}
      <div className="space-y-6">
        {filteredCampaigns.map((camp) => {
          const totalTargets = camp.targets.length;
          const sentCount = camp.targets.filter(t => t.status === 'sent').length;
          const failedCount = camp.targets.filter(t => t.status === 'failed').length;
          const progressPercent = totalTargets > 0 ? Math.round((sentCount / totalTargets) * 100) : 0;
          const device = devices.find(d => d.id === camp.deviceId);
          const showLogConsole = expandedLogs[camp.id];

          return (
            <div
              key={camp.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm rtl:text-right ltr:text-left transition-all hover:border-zinc-300/60 dark:hover:border-zinc-800"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-4">
                
                {/* Left Side: Badge and Basic Metadata */}
                <div className="flex items-center gap-3">
                  {camp.status === 'completed' && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'مكتملة' : 'Completed'}</span>
                    </span>
                  )}
                  {camp.status === 'sending' && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'ar' ? 'جاري البث التدريجي...' : 'Broadcasting Live...'}</span>
                    </span>
                  )}
                  {camp.status === 'draft' && (
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                      {lang === 'ar' ? 'مسودة' : 'Draft'}
                    </span>
                  )}

                  <div className="rtl:text-right ltr:text-left">
                    <h3 className="font-extrabold text-base text-zinc-800 dark:text-white">{camp.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {lang === 'ar' 
                          ? `عبر البوابة: ${device ? device.name : 'محاكاة البوابة السريعة'}` 
                          : `Gateway: ${device ? device.name : 'Fast Simulated Portal'}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Message Date and Templates */}
                <div className="text-zinc-400 text-[10px] font-semibold font-mono flex items-center gap-1 sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(camp.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Message Content Preview Box */}
              <div className="mb-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/40">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  {lang === 'ar' ? 'نص الرسالة المرسلة:' : 'Dispatched Message Text:'}
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {camp.templateText}
                </p>
              </div>

              {/* Progress and Quantitative Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex justify-between text-xs text-zinc-400 font-bold font-mono">
                    <span>{progressPercent}%</span>
                    <span>{lang === 'ar' ? 'تقدم الإرسال الكلي' : 'Overall Sending Progress'}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#00a884] to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Quantitative Details */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold pt-1">
                    <span className="flex items-center gap-1.5 text-rose-500">
                      <XCircle className="w-4 h-4" />
                      <span>{failedCount} {lang === 'ar' ? 'فشل' : 'Failed'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                      <span>{sentCount} {lang === 'ar' ? 'نجاح' : 'Delivered'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Layers className="w-4 h-4 text-zinc-400" />
                      <span>
                        {lang === 'ar' ? `إجمالي المستهدفين ${totalTargets}` : `Total targets ${totalTargets}`}
                      </span>
                    </span>
                    {camp.delay && (
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span>
                          {lang === 'ar' ? `فاصل زمني ${camp.delay} ثوانٍ` : `Delay ${camp.delay}s`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Dispatch and Log Controls Button Grid */}
                <div className="lg:col-span-4 flex justify-start sm:justify-end gap-2 px-1 py-1">
                  
                  {/* Detailed Recipients Toggle Button */}
                  <button
                    onClick={() => setExpandedTargets(prev => ({ ...prev, [camp.id]: !prev[camp.id] }))}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all border flex items-center gap-1.5 ${
                      expandedTargets[camp.id] 
                        ? 'bg-[#00a884]/10 border-[#00a884]/30 text-[#00a884]' 
                        : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'المستهدفون' : 'Recipients'}</span>
                  </button>

                  {/* Logs Toggle Button */}
                  <button
                    onClick={() => toggleLogs(camp.id)}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all border flex items-center gap-1.5 ${
                      showLogConsole 
                        ? 'bg-zinc-900 border-zinc-800 text-emerald-400' 
                        : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'سجل الإرسال' : 'Console Log'}</span>
                  </button>

                  {/* Edit Campaign Button */}
                  <button
                    onClick={() => handleStartEditCampaign(camp)}
                    className="px-3 py-2 rounded-2xl text-xs font-bold bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                    title={lang === 'ar' ? 'تعديل الحملة السابقة وإعادة الإرسال' : 'Edit Campaign and Resend'}
                  >
                    <Pencil className="w-4 h-4 text-[#00a884]" />
                    <span>{lang === 'ar' ? 'تعديل وإعادة إرسال' : 'Edit & Resend'}</span>
                  </button>

                  {/* Run Button (Only if not completed) */}
                  {camp.status !== 'completed' && (
                    <button
                      onClick={() => handleRunQueue(camp.id)}
                      disabled={camp.status === 'sending' || activeRunningId === camp.id}
                      className="bg-gradient-to-r from-[#00a884] to-emerald-500 hover:from-[#008f6f] hover:to-emerald-600 disabled:from-zinc-200 disabled:to-zinc-200 text-white font-bold px-4 py-2 rounded-2xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 text-xs"
                    >
                      {camp.status === 'sending' || activeRunningId === camp.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{t.runLabel}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteCampaign(camp.id)}
                    className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-400 hover:text-rose-500 transition-all cursor-pointer border border-transparent hover:border-rose-100"
                    title={lang === 'ar' ? 'حذف الحملة' : 'Delete Campaign'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Monospace Interactive Execution Terminal Console */}
              <AnimatePresence>
                {showLogConsole && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="bg-zinc-950 text-emerald-400 font-mono text-[10px] p-4 rounded-2xl border border-zinc-900 shadow-inner h-48 overflow-y-auto leading-relaxed relative">
                      <div className="absolute top-2 left-3 text-[8px] uppercase tracking-widest text-zinc-500 font-bold select-none">
                        WhatsApp System Console
                      </div>
                      <div className="absolute top-2 right-3 flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 block" />
                        <span className="w-2 h-2 rounded-full bg-yellow-500 block" />
                        <span className="w-2 h-2 rounded-full bg-green-500 block" />
                      </div>
                      
                      <div className="space-y-1.5 pt-4">
                        {(camp.logs || []).map((log, lIdx) => (
                          <div key={lIdx} className="flex gap-2">
                            <span className="text-zinc-600 select-none">$&gt;</span>
                            <span className={log.includes('✔') ? 'text-emerald-300' : log.includes('❌') ? 'text-rose-400' : 'text-zinc-300'}>
                              {log}
                            </span>
                          </div>
                        ))}
                        {camp.status === 'sending' && (
                          <div className="flex items-center gap-1.5 text-zinc-500 animate-pulse">
                            <span>$&gt;</span>
                            <span>[Listening for next gateway event...]</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Detailed Recipients List & Management Panel */}
              <AnimatePresence>
                {expandedTargets[camp.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h4 className="font-extrabold text-xs text-zinc-800 dark:text-white flex items-center gap-1.5">
                            <Users className="w-4.5 h-4.5 text-[#00a884]" />
                            <span>{lang === 'ar' ? 'قائمة المستهدفين والتقرير التفصيلي' : 'Targets Direct Status Logs'}</span>
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {lang === 'ar' ? 'تتبع حالة التسليم والوصول لجميع جهات الاتصال المستهدفة.' : 'Track the direct dispatch state across your complete customer audience.'}
                          </p>
                        </div>
                        
                        {/* Retry Failed Button if there are failures */}
                        {failedCount > 0 && (
                          <button
                            onClick={() => handleRetryFailedTargets(camp.id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-rose-500/20 shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'إعادة إرسال للعملاء الفاشلين' : 'Retry Failed Delivery'}</span>
                          </button>
                        )}
                      </div>

                      {/* Breathtaking Campaign Report Dashboard */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 p-4 rounded-2xl shadow-xs text-center">
                          <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'إجمالي المستهدفين' : 'Total Targets'}</span>
                          <span className="block text-2xl font-black text-zinc-800 dark:text-white mt-1">{totalTargets}</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 p-4 rounded-2xl shadow-xs text-center">
                          <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'تسليم ناجح' : 'Successfully Delivered'}</span>
                          <span className="block text-2xl font-black text-emerald-500 mt-1">
                            {sentCount} <span className="text-xs text-zinc-400 font-bold">({totalTargets > 0 ? Math.round((sentCount / totalTargets) * 100) : 0}%)</span>
                          </span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 p-4 rounded-2xl shadow-xs text-center">
                          <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'فشل الإرسال' : 'Failed Delivery'}</span>
                          <span className="block text-2xl font-black text-rose-500 mt-1">
                            {failedCount} <span className="text-xs text-zinc-400 font-bold">({totalTargets > 0 ? Math.round((failedCount / totalTargets) * 100) : 0}%)</span>
                          </span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 p-4 rounded-2xl shadow-xs text-center">
                          <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'معدل التأخير' : 'Sending Interval'}</span>
                          <span className="block text-2xl font-black text-[#00a884] mt-1">{camp.delay || 6}s</span>
                        </div>
                      </div>

                      {/* Distribution graph bar */}
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 p-4.5 rounded-2xl mb-5">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-2">
                          <span>{lang === 'ar' ? 'مخطط التوزيع الفعلي لحالة الحملة' : 'Campaign Real-Time Distribution'}</span>
                          <span className="font-mono text-[#00a884]">{lang === 'ar' ? 'تقرير تفاعلي مخصص' : 'Interactive Report Profile'}</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-950 h-5 rounded-full overflow-hidden flex text-white font-mono font-bold text-[9px] text-center items-center shadow-inner">
                          {sentCount > 0 && (
                            <div 
                              className="bg-emerald-500 h-full flex items-center justify-center transition-all duration-500"
                              style={{ width: `${(sentCount / totalTargets) * 100}%` }}
                              title={lang === 'ar' ? 'تم تسليمه بنجاح' : 'Delivered'}
                            >
                              {Math.round((sentCount / totalTargets) * 100)}%
                            </div>
                          )}
                          {failedCount > 0 && (
                            <div 
                              className="bg-rose-500 h-full flex items-center justify-center transition-all duration-500"
                              style={{ width: `${(failedCount / totalTargets) * 100}%` }}
                              title={lang === 'ar' ? 'فشل في الإرسال' : 'Failed'}
                            >
                              {Math.round((failedCount / totalTargets) * 100)}%
                            </div>
                          )}
                          {(totalTargets - sentCount - failedCount) > 0 && (
                            <div 
                              className="bg-zinc-300 dark:bg-zinc-800 h-full flex items-center justify-center text-zinc-600 transition-all duration-500"
                              style={{ width: `${((totalTargets - sentCount - failedCount) / totalTargets) * 100}%` }}
                              title={lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
                            >
                              {Math.round(((totalTargets - sentCount - failedCount) / totalTargets) * 100)}%
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center gap-6 mt-3.5 text-[10px] font-bold">
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                            <span>{lang === 'ar' ? 'تم بنجاح' : 'Delivered'} ({sentCount})</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                            <span>{lang === 'ar' ? 'فشل' : 'Failed'} ({failedCount})</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-800 block" />
                            <span>{lang === 'ar' ? 'قيد الانتظار' : 'Pending'} ({totalTargets - sentCount - failedCount})</span>
                          </span>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2 border border-zinc-100 dark:border-zinc-900 rounded-xl p-2.5 bg-white dark:bg-zinc-900/40 shadow-inner">
                        {camp.targets.map((tgt, tIdx) => (
                          <div 
                            key={tIdx}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100/50 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/30 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center text-[10px] font-bold">
                                {tIdx + 1}
                              </span>
                              <div>
                                <p className="font-extrabold text-zinc-800 dark:text-white">{tgt.name}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">+{tgt.phone}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {tgt.status === 'sent' && (
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'تم بنجاح' : 'Delivered'}</span>
                                </span>
                              )}
                              {tgt.status === 'failed' && (
                                <div className="flex flex-col items-end">
                                  <span className="bg-rose-500/10 text-rose-500 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    <span>{lang === 'ar' ? 'فشل' : 'Failed'}</span>
                                  </span>
                                  {tgt.error && (
                                    <span className="text-[9px] text-rose-400 mt-0.5 max-w-[180px] truncate" title={tgt.error}>
                                      {tgt.error}
                                    </span>
                                  )}
                                </div>
                              )}
                              {tgt.status === 'sending' && (
                                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>{lang === 'ar' ? 'يرسل...' : 'Sending...'}</span>
                                </span>
                              )}
                              {tgt.status === 'pending' && (
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Hourglass className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-3xl text-zinc-400 p-8">
            <Megaphone className="w-14 h-14 mx-auto text-zinc-300 dark:text-zinc-700 mb-4 animate-pulse" />
            <p className="font-extrabold text-base text-zinc-700 dark:text-zinc-400">
              {lang === 'ar' ? 'لا توجد حملات مطابقة للفلاتر' : 'No campaigns match the active filters'}
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {lang === 'ar' 
                ? 'ابدأ بإنشاء أول حملة تسويقية بث مباشر لعملائك لزيادة المبيعات والوصول.' 
                : 'Click "Plan New Campaign" above to customize and initiate your first direct outreach.'}
            </p>
          </div>
        )}
      </div>

      {/* NEW INTUITIVE BROADCAST CAMPAIGN MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
                <button 
                  onClick={() => { setShowAddModal(false); setEditingCampaignId(null); }} 
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-black cursor-pointer bg-zinc-100 dark:bg-zinc-900 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                >
                  ✕
                </button>
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Megaphone className="w-5 h-5 text-[#00a884]" />
                  <span>{editingCampaignId ? (lang === 'ar' ? 'تعديل وتحديث الحملة التسويقية' : 'Edit & Update Marketing Campaign') : (lang === 'ar' ? 'تخطيط وجدولة حملة تسويقية جديدة' : 'Plan & Schedule New Campaign')}</span>
                </h3>
              </div>

              {/* Split Content Form */}
              <div className="overflow-y-auto p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Right Side: Form Configuration */}
                <form onSubmit={handleCreateCampaign} className="lg:col-span-7 space-y-5 rtl:text-right ltr:text-left">
                  
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {t.campaignName}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'ar' ? "مثال: عروض الجمعة البيضاء 2026" : "e.g. Black Friday Offers 2026"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] font-medium transition-all"
                    />
                  </div>

                  {/* Device Gateway Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'بوابة الإرسال الرقمية' : 'Sending Gateway Account'}
                    </label>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] font-bold cursor-pointer"
                    >
                      <option value="">{lang === 'ar' ? 'محاكاة البوابة العامة السريعة' : 'Simulated Fast Public Gateway'}</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.phoneNumber || d.method})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Delay Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">{delay} {lang === 'ar' ? 'ثوانٍ' : 'seconds'}</span>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {t.sendRate}
                      </label>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="60"
                      value={delay}
                      onChange={(e) => setDelay(parseInt(e.target.value))}
                      className="w-full accent-[#00a884] bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="block text-[8px] text-zinc-400">
                      {lang === 'ar' ? '* نوصي بفاصل 5-8 ثوانٍ لتجنب حظر الرقم عند إرسال كميات هائلة.' : '* We recommend 5-8s interval to avoid spam blocks on heavy lists.'}
                    </span>
                  </div>

                  {/* Target Tab Selection */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'تحديد جهات الاتصال المستهدفة' : 'Choose Target Audience'}
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
                      <button
                        type="button"
                        onClick={() => setTargetTab('manual')}
                        className={`text-[11px] py-2.5 rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          targetTab === 'manual' 
                            ? 'bg-white dark:bg-zinc-900 text-[#00a884] shadow-xs' 
                            : 'text-zinc-400'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'إدخال يدوي للأرقام' : 'Manual Input'}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setTargetTab('contacts')}
                        className={`text-[11px] py-2.5 rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          targetTab === 'contacts' 
                            ? 'bg-white dark:bg-zinc-900 text-[#00a884] shadow-xs' 
                            : 'text-zinc-400'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تحديد من جهات الاتصال' : 'Select from Contacts'}</span>
                      </button>
                    </div>

                    {/* Conditional Target UI */}
                    {targetTab === 'manual' ? (
                      <div className="space-y-4">
                        {/* Excel Upload Section */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#00a884]/5 dark:bg-[#00a884]/5 border border-[#00a884]/15 rounded-2xl">
                          <div className="rtl:text-right ltr:text-left">
                            <span className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-200">
                              {lang === 'ar' ? 'رفع شيت إكسيل (Excel/CSV)' : 'Upload Excel Sheet (Excel/CSV)'}
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">
                              {lang === 'ar' ? 'يقوم النظام باستخراج الأسماء والأرقام تلقائياً لتسهيل الإرسال.' : 'The system will parse names and phones automatically for fast scheduling.'}
                            </span>
                          </div>
                          <label className="bg-[#00a884] hover:bg-[#008f6f] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs shrink-0 select-none">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'اختر ملف الإكسيل' : 'Select Excel File'}</span>
                            <input 
                              type="file" 
                              accept=".xlsx, .xls, .csv" 
                              className="hidden" 
                              onChange={handleExcelUpload} 
                            />
                          </label>
                        </div>

                        {/* Format illustrative example */}
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 text-xs">
                          <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-[#00a884]" />
                            <span>{lang === 'ar' ? 'الطريقة الصحيحة لكتابة الاسم ورقم الهاتف:' : 'Correct Format Guide for Name & Phone Number:'}</span>
                          </span>
                          <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                            {lang === 'ar' 
                              ? 'يمكنك إدخال الأرقام مباشرةً، أو كتابة الاسم متبوعاً بفصلة (,) ثم الرقم، لتمكين تخصيص الرسالة بالاسم تلقائياً في شاشات الإرسال.' 
                              : 'You can input numbers alone, or specify Name followed by comma (,) then Phone to automatically customize messages.'}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 p-3 rounded-xl">
                              <span className="block text-[10px] font-bold text-[#00a884] mb-1">
                                {lang === 'ar' ? 'مثال الطريقة اليدوية (الاسم، الرقم):' : 'Manual Input Example (Name, Phone):'}
                              </span>
                              <pre className="font-mono text-[9px] bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 leading-tight">
                                {lang === 'ar' 
                                  ? "أحمد علي, 201012345678\nسحر محمود, 201198765432" 
                                  : "John Doe, 201012345678\nSarah Smith, 201198765432"}
                              </pre>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 p-3 rounded-xl flex flex-col justify-between">
                              <span className="block text-[10px] font-bold text-emerald-500 mb-1">
                                {lang === 'ar' ? 'أعمدة الإكسيل المدعومة:' : 'Supported Excel Columns:'}
                              </span>
                              <div className="overflow-x-auto">
                                <table className="w-full text-[9px] border-collapse text-zinc-500 dark:text-zinc-400">
                                  <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-950 font-bold border-b border-zinc-200 dark:border-zinc-800">
                                      <th className="p-0.5 text-center">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                                      <th className="p-0.5 text-center">{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800/40">
                                      <td className="p-0.5 text-center">{lang === 'ar' ? 'محمد صابر' : 'Alex Johnson'}</td>
                                      <td className="p-0.5 text-center font-mono">201244556677</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <span className="block text-[8px] text-zinc-400 mt-1">
                                {lang === 'ar' ? '* يقرأ النظام أي عمود باسم (الاسم، الهاتف) تلقائياً.' : '* The system automatically maps columns matching name/phone.'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Textarea Input */}
                        <div className="space-y-1.5">
                          <textarea
                            rows={4}
                            required={targetTab === 'manual'}
                            placeholder={lang === 'ar' ? "أدخل الأرقام هنا أو انسخها من شيت خارجي...\nأحمد علي, 201012345678" : "Enter names and numbers here...\nJohn Doe, 201012345678"}
                            value={targetsRaw}
                            onChange={(e) => setTargetsRaw(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] font-mono leading-relaxed"
                          />
                          <span className="text-[9px] text-zinc-400 block">
                            {lang === 'ar' 
                              ? '* أضف كود الدولة قبل كل رقم (مثال: 2010...) وكل رقم في سطر مستقل.' 
                              : '* Add country code prefix (e.g. 2010...) and write one phone per line.'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                        <div className="bg-zinc-100/50 dark:bg-zinc-900/50 p-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[10px] font-bold text-zinc-500">
                          <span>{selectedContactIds.length} / {conversations.length} {lang === 'ar' ? 'محدد' : 'Selected'}</span>
                          <button
                            type="button"
                            onClick={handleSelectAllContacts}
                            className="text-[#00a884] hover:underline cursor-pointer"
                          >
                            {selectedContactIds.length === conversations.length 
                              ? (lang === 'ar' ? 'إلغاء الكل' : 'Deselect All') 
                              : (lang === 'ar' ? 'تحديد الكل' : 'Select All')}
                          </button>
                        </div>
                        <div className="max-h-36 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
                          {conversations.map((c) => {
                            const isSelected = selectedContactIds.includes(c.recipient.id);
                            return (
                              <div
                                key={c.recipient.id}
                                onClick={() => toggleContactSelection(c.recipient.id)}
                                className="p-2.5 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={c.recipient.avatarUrl} 
                                    className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" 
                                    alt=""
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="text-right">
                                    <div className="font-extrabold text-zinc-700 dark:text-zinc-200">{c.recipient.username}</div>
                                    <div className="text-[9px] text-zinc-400 font-mono">+{cleanPhoneFromRecipient(c.recipient)}</div>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-[#00a884] border-[#00a884] text-white' 
                                    : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            );
                          })}
                          {conversations.length === 0 && (
                            <div className="text-center p-6 text-zinc-400 text-xs font-bold">
                              {lang === 'ar' ? 'لم يتم العثور على جهات اتصال نشطة!' : 'No active contacts found!'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gemini AI Content Writer Assistant widget */}
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 p-4.5 rounded-2xl space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>{lang === 'ar' ? 'صياغة المحتوى التسويقي بالذكاء الاصطناعي (Gemini)' : 'Gemini AI Intelligent Copilot Writer'}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                      {lang === 'ar' 
                        ? 'اكتب مسودة موجزة لفكرتك (مثال: عروض الجمعة بنصف السعر)، وسوف يقوم الذكاء الاصطناعي بصياغة رسالة احترافية لواتساب.' 
                        : 'Enter a simple campaign topic or concept, and our AI writer will craft an eye-catching WhatsApp promotional message.'}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'ar' ? 'مثال: خصم 30% على الملابس الرياضية بمناسبة العام الجديد' : 'e.g. New Year 30% discount on athletic gear'}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#00a884] font-medium"
                      />
                      <select
                        value={selectedTone}
                        onChange={(e: any) => setSelectedTone(e.target.value)}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-2 text-xs outline-none focus:border-[#00a884] font-bold cursor-pointer text-zinc-700 dark:text-zinc-200"
                      >
                        <option value="professional">{lang === 'ar' ? 'مهني' : 'Professional'}</option>
                        <option value="creative">{lang === 'ar' ? 'إبداعي' : 'Creative'}</option>
                        <option value="friendly">{lang === 'ar' ? 'ودود' : 'Friendly'}</option>
                        <option value="urgent">{lang === 'ar' ? 'عاجل' : 'Urgent'}</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={isGeneratingAI || !aiPrompt.trim()}
                      onClick={handleGenerateAIMessage}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-extrabold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{lang === 'ar' ? 'جاري صياغة النص الإبداعي...' : 'Crafting creative copy...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'توليد صياغة ذكية جذابة ✨' : 'Generate Smart Marketing Text ✨'}</span>
                        </>
                      )}
                    </button>
                    {aiError && (
                      <p className="text-[10px] text-rose-500 font-bold">{aiError}</p>
                    )}
                  </div>

                  {/* Message Input text */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {t.campaignMessage}
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder={t.campaignMessagePlaceholder}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#00a884] leading-relaxed font-medium"
                    />
                    <span className="block text-[9px] text-zinc-400">
                      {lang === 'ar' ? '* استخدم {name} ليتم استبداله تلقائياً باسم العميل لكل رسالة بشكل مخصص.' : '* Insert {name} to personalize each message with the client\'s custom name.'}
                    </span>
                  </div>

                  {/* WhatsApp Anti-Block Check */}
                  {message.trim().length > 0 && (
                    <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/80 p-4 rounded-2xl space-y-3 shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          {lang === 'ar' ? 'مؤشر الحظر وأمان الإرسال' : 'WhatsApp Ban Safety Advisor'}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                          calculateAntiBlockScore().score >= 80 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : calculateAntiBlockScore().score >= 50 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {calculateAntiBlockScore().score}% {
                            calculateAntiBlockScore().score >= 80 
                              ? (lang === 'ar' ? 'أمان ممتاز' : 'Very Safe') 
                              : calculateAntiBlockScore().score >= 50 
                              ? (lang === 'ar' ? 'أمان متوسط' : 'Moderate Risk') 
                              : (lang === 'ar' ? 'خطورة حظر عالية' : 'High Risk of Ban')
                          }
                        </span>
                      </div>
                      
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            calculateAntiBlockScore().score >= 80 
                              ? 'bg-emerald-500' 
                              : calculateAntiBlockScore().score >= 50 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${calculateAntiBlockScore().score}%` }}
                        />
                      </div>

                      {calculateAntiBlockScore().tips.length > 0 && (
                        <div className="space-y-1 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50 text-[10px] text-zinc-400 font-medium">
                          <p className="font-extrabold text-zinc-600 dark:text-zinc-300 mb-1">
                            {lang === 'ar' ? '💡 نصائح لتعزيز أمان خط واتساب الخاص بك:' : '💡 Steps to safeguard your sending lines:'}
                          </p>
                          {calculateAntiBlockScore().tips.map((tip, idx) => (
                            <div key={idx} className="flex gap-1 items-start">
                              <span className="text-[#00a884] font-bold">•</span>
                              <p className="leading-tight">{tip}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="w-full bg-gradient-to-r from-[#00a884] to-emerald-500 hover:from-[#008f6f] hover:to-emerald-600 disabled:from-zinc-100 disabled:to-zinc-100 text-white font-extrabold py-3.5 rounded-2xl transition-all cursor-pointer text-xs flex justify-center items-center gap-1.5 shadow-lg shadow-emerald-500/10 mt-3"
                  >
                    {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingCampaignId ? (lang === 'ar' ? 'تعديل وتحديث الحملة السابقة' : 'Update & Re-save Campaign') : t.scheduleCampaign}</span>
                  </button>
                </form>

                {/* Left Side: Live Preview & Template Shortcuts */}
                <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
                  
                  {/* Template Shortcuts */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'قوالب بث تسويقية سريعة التطبيق:' : 'Quick Outreach Templates:'}
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {templates.map((temp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyTemplate(temp.text)}
                          className="w-full text-right bg-zinc-50 hover:bg-[#00a884]/10 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-3 rounded-2xl transition-all cursor-pointer text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block rtl:text-right ltr:text-left shadow-xs"
                        >
                          <div className="text-zinc-800 dark:text-zinc-100 flex items-center gap-1 mb-1 font-extrabold">
                            <Sparkles className="w-3.5 h-3.5 text-[#00a884]" />
                            <span>{temp.title}</span>
                          </div>
                          <div className="truncate opacity-80">{temp.text}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* High Fidelity Phone Mockup Live Preview */}
                  <div className="space-y-2 flex-1 flex flex-col justify-end min-h-[250px]">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'المعاينة التفاعلية الفورية (شاشة هاتف)' : 'Live Interactive Phone Screen Preview'}
                    </span>
                    
                    {/* Phone Container */}
                    <div className="bg-zinc-100 dark:bg-zinc-950 border-4 border-zinc-300 dark:border-zinc-800 rounded-[30px] p-2 relative flex-1 flex flex-col overflow-hidden max-h-[280px]">
                      
                      {/* Notch Pill */}
                      <div className="w-20 h-4 bg-zinc-800 absolute top-2 left-1/2 -translate-x-1/2 rounded-full z-20 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-blue-900" />
                      </div>

                      {/* Phone Screen Mock */}
                      <div className="flex-1 rounded-[22px] bg-[#efeae2] dark:bg-zinc-900 overflow-hidden flex flex-col relative pt-4">
                        
                        {/* WhatsApp Header inside preview */}
                        <div className="bg-[#075e54] dark:bg-zinc-950 text-white p-2.5 flex items-center justify-between z-10">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-zinc-200 border border-white/20" />
                            <div className="text-right">
                              <span className="text-[10px] font-black block leading-none">Tarek Roshdi</span>
                              <span className="text-[7px] text-emerald-300 font-bold block leading-none mt-0.5">online</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                          </div>
                        </div>

                        {/* WhatsApp Chat Bubbles Screen Area */}
                        <div className="flex-1 p-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-95 flex flex-col justify-end relative">
                          <div className="absolute inset-0 bg-[#efeae2]/85 dark:bg-zinc-900/90" />
                          
                          {/* Chat bubble */}
                          <div className="bg-white dark:bg-[#128c7e] text-zinc-800 dark:text-white rounded-2xl rounded-tr-none p-3 shadow-sm max-w-[85%] self-start z-10 text-[9px] relative leading-relaxed">
                            <p>{getLivePreviewText()}</p>
                            <span className="block text-[7px] text-zinc-400 dark:text-emerald-200 mt-1.5 text-left font-mono font-bold">
                              10:45 AM ✔✔
                            </span>
                          </div>
                        </div>

                        {/* Text Area input in phone */}
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5 border-t border-zinc-200/50 dark:border-zinc-800 flex items-center gap-1">
                          <div className="bg-zinc-200 dark:bg-zinc-900 rounded-full flex-1 px-3 py-1 text-[8px] text-zinc-400">
                            Type a message
                          </div>
                          <div className="w-5 h-5 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                            <Send className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
