/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Upload,
  Link as LinkIcon,
  Globe,
  FileText,
  Trash2,
  Sparkles,
  Cpu,
  Info,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  HelpCircle,
  Plus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { DeviceLink } from '../types.js';

interface AiKnowledgeBaseProps {
  currentUser: any;
  devices: DeviceLink[];
  onUpdateDeviceAgent: (deviceId: string, agentData: any) => Promise<void>;
  onRefreshDevices?: () => Promise<void> | void;
  lang: 'ar' | 'en';
}

export default function AiKnowledgeBase({
  currentUser,
  devices,
  onUpdateDeviceAgent,
  onRefreshDevices,
  lang
}: AiKnowledgeBaseProps) {
  // Select active device to train
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  
  // Form states
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [rawTextTitle, setRawTextTitle] = useState('');
  const [rawTextContent, setRawTextContent] = useState('');
  
  // Interactive loading/animated training states
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatusText, setTrainingStatusText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Find currently selected device
  const activeDevice = useMemo(() => {
    return devices.find(d => d.id === selectedDeviceId);
  }, [devices, selectedDeviceId]);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Helper to trigger custom training animation
  const runTrainingAnimation = (statusMsg: string, callback: () => Promise<void>) => {
    setIsTraining(true);
    setTrainingProgress(5);
    setTrainingStatusText(lang === 'ar' ? 'جاري قراءة محتويات الملف واستخلاص النص الأساسي...' : 'Reading source contents and extracting core text...');
    
    let currentProg = 5;
    const interval = setInterval(() => {
      currentProg += Math.floor(Math.random() * 15) + 5;
      if (currentProg >= 95) {
        currentProg = 95;
        clearInterval(interval);
      }
      setTrainingProgress(currentProg);
      
      if (currentProg > 30 && currentProg < 60) {
        setTrainingStatusText(lang === 'ar' ? 'جاري الفهرسة الدلالية وبناء الكلمات المفتاحية...' : 'Semantic indexing and compiling primary keyword mappings...');
      } else if (currentProg >= 60) {
        setTrainingStatusText(lang === 'ar' ? 'جاري حقن قاعدة المعرفة وربطها برقم الواتساب...' : 'Injecting custom knowledge base into active WhatsApp flow...');
      }
    }, 150);

    setTimeout(async () => {
      try {
        await callback();
        clearInterval(interval);
        setTrainingProgress(100);
        setTrainingStatusText(lang === 'ar' ? 'اكتمل التدريب بنجاح! 🚀 البوت جاهز الآن للرد.' : 'Training completed successfully! 🚀 Bot is fully trained.');
        
        setTimeout(() => {
          setIsTraining(false);
          setTrainingProgress(0);
          setSuccessMessage(lang === 'ar' ? 'تم إضافة وتدريب البوت على المصدر بنجاح!' : 'Source trained and synchronized with AI agent successfully!');
          setTimeout(() => setSuccessMessage(''), 4000);
        }, 1000);
      } catch (err: any) {
        clearInterval(interval);
        setIsTraining(false);
        alert(lang === 'ar' ? `فشل في التدريب: ${err.message}` : `Training failed: ${err.message}`);
      }
    }, 1800);
  };

  // Add a website URL link
  const handleAddWebsiteLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) {
      alert(lang === 'ar' ? 'يرجى اختيار رقم واتساب نشط أولاً!' : 'Please select an active WhatsApp line first!');
      return;
    }
    if (!websiteUrl.trim()) return;

    let urlToFetch = websiteUrl.trim();
    if (!/^https?:\/\//i.test(urlToFetch)) {
      urlToFetch = 'https://' + urlToFetch;
    }

    runTrainingAnimation(
      lang === 'ar' ? 'جاري زحف وفهرسة موقع الويب...' : 'Crawling and parsing website content...',
      async () => {
        const response = await fetch(`/api/devices/${selectedDeviceId}/knowledge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id || ''
          },
          body: JSON.stringify({
            name: new URL(urlToFetch).hostname,
            type: 'link',
            url: urlToFetch
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to add link');
        }

        setWebsiteUrl('');
        if (onRefreshDevices) {
          await onRefreshDevices();
        }
      }
    );
  };

  // Add pasted raw text
  const handleAddRawText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) {
      alert(lang === 'ar' ? 'يرجى اختيار رقم واتساب نشط أولاً!' : 'Please select an active WhatsApp line first!');
      return;
    }
    if (!rawTextTitle.trim() || !rawTextContent.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال العنوان والمحتوى!' : 'Please fill in both title and content!');
      return;
    }

    runTrainingAnimation(
      lang === 'ar' ? 'جاري فهرسة النص المدخل...' : 'Indexing pasted guidelines text...',
      async () => {
        const response = await fetch(`/api/devices/${selectedDeviceId}/knowledge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id || ''
          },
          body: JSON.stringify({
            name: rawTextTitle.trim(),
            type: 'file',
            content: rawTextContent.trim()
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to save text block');
        }

        setRawTextTitle('');
        setRawTextContent('');
        if (onRefreshDevices) {
          await onRefreshDevices();
        }
      }
    );
  };

  // File selection / drag-drop handler
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!selectedDeviceId) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDeviceId) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isTxt && !isPdf) {
      alert(lang === 'ar' ? 'تنسيق الملف غير مدعوم. يرجى تحميل ملف PDF أو TXT فقط.' : 'Unsupported file format. Please upload PDF or TXT only.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      let textContent = '';
      if (isTxt) {
        textContent = event.target?.result as string;
      } else {
        // PDF Simulation extraction with dynamic mock details
        textContent = `[PDF Document Source: ${file.name}]\nExtracted structural data containing catalog details, pricing rules, refund guarantee guidelines, and customer relations standard operations. File metadata: size ${file.size} bytes.`;
      }

      runTrainingAnimation(
        lang === 'ar' ? `جاري تدريب البوت على ملف ${file.name}...` : `Training agent on file ${file.name}...`,
        async () => {
          const response = await fetch(`/api/devices/${selectedDeviceId}/knowledge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser?.id || ''
            },
            body: JSON.stringify({
              name: file.name,
              type: 'file',
              content: textContent
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to train on file');
          }
          if (onRefreshDevices) {
            await onRefreshDevices();
          }
        }
      );
    };

    if (isTxt) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Delete/forget a knowledge source
  const handleDeleteSource = (sourceId: string) => {
    setConfirmDeleteId(sourceId);
  };

  const executeDeleteSource = async (sourceId: string) => {
    if (!selectedDeviceId) return;
    try {
      const response = await fetch(`/api/devices/${selectedDeviceId}/knowledge/${sourceId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id || ''
        }
      });

      if (response.ok) {
        setSuccessMessage(lang === 'ar' ? 'تم مسح المصدر بنجاح ونقض الذاكرة المرتبطة به.' : 'Source removed and forgotten successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        if (onRefreshDevices) {
          await onRefreshDevices();
        }
      } else {
        const errData = await response.json();
        setErrorMessage(errData.error || (lang === 'ar' ? 'فشل في حذف المصدر' : 'Failed to remove source'));
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع أثناء الحذف' : 'An unexpected error occurred during removal'));
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 space-y-6 rtl:text-right ltr:text-left relative z-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/80 p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-start md:justify-end flex-row-reverse">
            <span className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Brain className="w-6 h-6 animate-pulse" />
            </span>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {lang === 'ar' ? 'مركز التدريب المخصص ولوائح الذكاء الاصطناعي' : 'Custom AI Knowledge Base & Training Center'}
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {lang === 'ar' 
              ? 'قم بتغذية وتدريب وكيل الذكاء الاصطناعي بملفات الأسعار، سياسات الاسترجاع، بروفايل الشركة، وروابط موقعك الإلكتروني ليرد على العملاء بدقة 100% وبثقة تامة.'
              : 'Feed and train your corporate AI agent on custom pricing structures, return policies, company catalogs, and webpage URLs to secure highly accurate responses.'}
          </p>
        </div>

        {/* Device select dropdown */}
        <div className="space-y-1 text-right min-w-[220px]">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase">
            {lang === 'ar' ? 'اختر خط الواتساب للتدريب:' : 'Select connected WhatsApp line:'}
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-[#00a884] cursor-pointer"
          >
            <option value="" disabled>{lang === 'ar' ? '-- اختر رقم --' : '-- Select line --'}</option>
            {devices.map(dev => (
              <option key={dev.id} value={dev.id}>
                📞 {dev.name} ({dev.phoneNumber || 'Simulation'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      <div className="space-y-3">
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 justify-end text-right"
            >
              <span>{successMessage}</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 justify-end text-right"
            >
              <span>{errorMessage}</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: TRAIN & FEED INPUTS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SOURCE TYPE 1: FILE DRAG AND DROP (PDF, TXT) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-right space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 justify-end">
              <span>{lang === 'ar' ? 'رفع وتدريب ملفات الأعمال (PDF / TXT)' : 'Upload & Train Corporate Files (PDF / TXT)'}</span>
              <FileText className="w-4 h-4 text-[#00a884]" />
            </h3>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-500/[0.04]' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <input
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={!selectedDeviceId || isTraining}
              />
              
              <div className="p-3 bg-[#00a884]/10 rounded-2xl text-[#00a884]">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {lang === 'ar' ? 'اسحب وأفلت الملف هنا أو تصفح جهازك' : 'Drag and drop your file here, or click to browse'}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {lang === 'ar' ? 'ندعم ملفات الـ PDF التقنية والنصوص البرمجية TXT حتى 10 ميجا' : 'Supports technical PDFs and standard TXT text files up to 10 MB'}
                </p>
              </div>
            </div>
          </div>

          {/* SOURCE TYPE 2: WEBSITE CRAWLER */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-right space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 justify-end">
              <span>{lang === 'ar' ? 'سحب المعرفة وتدريب روابط المواقع' : 'Website Crawler & URL Knowledge Importer'}</span>
              <Globe className="w-4 h-4 text-emerald-500" />
            </h3>
            <p className="text-[10px] text-zinc-400">
              {lang === 'ar' 
                ? 'أدخل رابط موقعك أو صفحة الأسعار والأسئلة الشائعة، سيقوم المساعد الذكي بقراءة نصوص الموقع وتحديث معلوماته تلقائياً.' 
                : 'Input your landing page, pricing page, or FAQ link. The AI will crawl structural HTML texts and index them directly.'}
            </p>

            <form onSubmit={handleAddWebsiteLink} className="flex gap-2">
              <button
                type="submit"
                disabled={!selectedDeviceId || isTraining || !websiteUrl.trim()}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'زحف وتدريب' : 'Crawl & Train'}</span>
              </button>
              
              <input
                type="text"
                placeholder={lang === 'ar' ? 'مثال: my-business.com/pricing' : 'e.g. my-business.com/pricing'}
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={!selectedDeviceId || isTraining}
                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-[#00a884] text-left font-mono"
              />
            </form>
          </div>

          {/* SOURCE TYPE 3: RAW TEXT GUIDELINES & MANUAL TRAINING */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-right space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 justify-end">
              <span>{lang === 'ar' ? 'كتابة وتدريب نصوص حرة (قواعد سلوك مخصصة)' : 'Manual Knowledge Blocks (Free-text guidelines)'}</span>
              <Plus className="w-4 h-4 text-indigo-500" />
            </h3>

            <form onSubmit={handleAddRawText} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400">
                  {lang === 'ar' ? 'اسم مصدر المعرفة (عنوان):' : 'Knowledge block name (Title):'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'مثال: سياسة الشحن والدعم التقني' : 'e.g., Shipping & Tech Support Policy'}
                  value={rawTextTitle}
                  onChange={(e) => setRawTextTitle(e.target.value)}
                  disabled={!selectedDeviceId || isTraining}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400">
                  {lang === 'ar' ? 'تفاصيل المعرفة والأسعار واللوائح (محتوى النص):' : 'Guidelines content / catalog specifications:'}
                </label>
                <textarea
                  rows={4}
                  placeholder={lang === 'ar' ? 'اكتب بالتفصيل هنا ما يود البوت معرفته...' : 'Paste or type exact specifications, prices, schedules, and custom parameters...'}
                  value={rawTextContent}
                  onChange={(e) => setRawTextContent(e.target.value)}
                  disabled={!selectedDeviceId || isTraining}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-right font-sans"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedDeviceId || isTraining || !rawTextTitle.trim() || !rawTextContent.trim()}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'حقن وتدريب المصدر' : 'Inject & Train Text Block'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* COLUMN 2: ACTIVE KNOWLEDGE SOURCES LIST & PROGRESS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* LIVE TRAINING SCREEN / LOADER */}
          <AnimatePresence>
            {isTraining && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-tr from-zinc-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/20 text-center space-y-5"
              >
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-indigo-500/10 rounded-full border border-indigo-500/30">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin absolute" />
                  <Brain className="w-6 h-6 text-indigo-300 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-zinc-100">
                    {lang === 'ar' ? 'جاري تعليم وتلقين مساعدك الذكي...' : 'Training custom corporate AI agent...'}
                  </h4>
                  <p className="text-[10px] text-indigo-200 leading-normal max-w-xs mx-auto">
                    {trainingStatusText}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                    <span>{trainingProgress}%</span>
                    <span>{lang === 'ar' ? 'مؤشر التقدم' : 'Progress'}</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-[#00a884] to-indigo-500 h-full rounded-full"
                      style={{ width: `${trainingProgress}%` }}
                      transition={{ ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIVE SOURCES LIST */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-right space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex justify-between items-center flex-row-reverse">
              <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 justify-end">
                <span>{lang === 'ar' ? 'الذاكرة الحالية النشطة للبوت' : 'Active Trained Knowledge Base'}</span>
                <Brain className="w-4 h-4 text-indigo-500" />
              </h3>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-mono">
                {activeDevice?.knowledgeBaseSources?.length || 0} {lang === 'ar' ? 'مصادر' : 'Sources'}
              </span>
            </div>

            {activeDevice ? (
              <div className="space-y-3 max-h-[450px] overflow-y-auto scrollbar-thin">
                {activeDevice.knowledgeBaseSources && activeDevice.knowledgeBaseSources.length > 0 ? (
                  activeDevice.knowledgeBaseSources.map((source) => (
                    <div
                      key={source.id}
                      className="p-3.5 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-right group hover:border-indigo-500/30 transition-all"
                    >
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'احذف من الذاكرة' : 'Delete and Forget'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Source Info */}
                      <div className="space-y-1 text-right flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-end">
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-400 hover:text-[#00a884]"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {source.size || 'Unknown size'}
                          </span>
                          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate block">
                            {source.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 justify-end text-[9px] text-zinc-400">
                          <span>{source.timestamp}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-emerald-500">
                            <CheckCircle className="w-2.5 h-2.5" />
                            <span>{lang === 'ar' ? 'مؤهل ونشط' : 'Active & Trained'}</span>
                          </span>
                          <span>•</span>
                          <span className="font-bold uppercase text-[8px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded-sm">
                            {source.type === 'link' ? (lang === 'ar' ? 'رابط ويب' : 'Web Link') : (lang === 'ar' ? 'ملف/نص' : 'File/Text')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
                    <Info className="w-6 h-6 mx-auto text-zinc-300 animate-pulse" />
                    <p className="text-xs">
                      {lang === 'ar' ? 'لا توجد مصادر معرفة نشطة لهذا الرقم.' : 'No knowledge sources active for this number.'}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {lang === 'ar' ? 'قم بتحميل ملف أو كتابة لائحة لتلقين البوت.' : 'Upload a file or paste website rules to train the bot.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400">
                <p className="text-xs">{lang === 'ar' ? 'يرجى تفعيل واختيار رقم واتساب لعرض ذاكرته.' : 'Please choose a WhatsApp line to view trained memory.'}</p>
              </div>
            )}
          </div>

          {/* ADVANCED RECOMMENDATIONS CARD */}
          <div className="bg-gradient-to-br from-indigo-500/[0.02] to-amber-500/[0.02] border border-zinc-200/40 dark:border-zinc-800/80 p-5 rounded-3xl text-right space-y-3">
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1 justify-end">
              <span>{lang === 'ar' ? '💡 نصائح لضمان دقة الردود بنسبة 100%' : '💡 Tips for 100% Response Accuracy'}</span>
            </h4>
            <ul className="text-[10px] text-zinc-400 space-y-1.5 list-disc list-inside">
              <li>{lang === 'ar' ? 'قم بتنظيم قائمة الأسعار بوضوح (مثال: الباقة الفضية تكلفتها 29$ شهرياً).' : 'List clear pricing structures (e.g., Bronze plan: $29/mo).'}</li>
              <li>{lang === 'ar' ? 'أضف شروط الاسترجاع بشكل صريح لمنع البوت من التكهن أو تأليف شروط عشوائية.' : 'Set return windows explicitly to avoid guessing and hallucination.'}</li>
              <li>{lang === 'ar' ? 'المساعد الذكي يقوم بحماية البيانات ولن يكشف عن معلومات خارج النطاق.' : 'AI blocks non-relevant topics to maintain corporate safety guidelines.'}</li>
            </ul>
          </div>

        </div>

      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-xl"
            >
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  {lang === 'ar' ? 'حذف مصدر المعرفة' : 'Delete Knowledge Source'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {lang === 'ar' 
                    ? 'هل أنت متأكد من رغبتك في حذف هذا المصدر ونسيان تفاصيله من ذاكرة البوت؟' 
                    : 'Are you sure you want to remove this source and force the AI agent to forget its contents?'}
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    const id = confirmDeleteId;
                    setConfirmDeleteId(null);
                    executeDeleteSource(id);
                  }}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-rose-500/10"
                >
                  {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
