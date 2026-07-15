/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Send,
  Database,
  Cpu,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  Server,
  BellRing
} from 'lucide-react';
import { DeviceLink, Campaign } from '../types.js';
import { translations } from '../translations.js';

interface DashboardStatsProps {
  currentUser: any;
  devices: DeviceLink[];
  campaigns: Campaign[];
  onRefreshData: () => void;
  lang: 'ar' | 'en';
}

export default function DashboardStats({ currentUser, devices, campaigns, onRefreshData, lang }: DashboardStatsProps) {
  const t = translations[lang];
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const totalCampaigns = campaigns.length;
  const activeDevices = devices.filter(d => d.status === 'connected').length;
  const aiEnabledDevices = devices.filter(d => d.aiAgentEnabled).length;

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-8 overflow-y-auto h-full rtl:text-right ltr:text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
        <div className="flex items-center gap-3 rtl:self-start ltr:self-start">
          <button
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer text-zinc-500 dark:text-zinc-400 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title={t.refreshData}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="rtl:text-right ltr:text-left">
            <span className="text-[10px] font-bold text-zinc-400 block font-mono">WORKSPACE ID: #{currentUser?.id}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {lang === 'ar' 
                ? `مرحباً بك ${currentUser?.username}، إليك تقرير الأداء الموحد` 
                : `Welcome ${currentUser?.username}, here is your unified performance report`}
            </span>
          </div>
        </div>

        <div className="rtl:text-right ltr:text-left">
          <h1 className="text-2xl font-black text-zinc-800 dark:text-white flex items-center gap-2 rtl:justify-end ltr:justify-start">
            <span>{t.analyticsTitle}</span>
            <Activity className="w-6 h-6 text-[#00a884]" />
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-1">
            {t.analyticsSub}
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Gateway Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl shadow-xs rtl:text-right ltr:text-left flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Server className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {lang === 'ar' ? 'البوابات المرتبطة' : 'Connected Gateways'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1 rtl:justify-end ltr:justify-start">
              <span className="text-2xl font-black text-zinc-800 dark:text-white">
                {activeDevices} {lang === 'ar' ? 'متصل' : 'Connected'}
              </span>
              <span className="text-xs text-zinc-400 font-bold">/ {devices.length}</span>
            </div>
          </div>
        </div>

        {/* Message dispatch stats */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl shadow-xs rtl:text-right ltr:text-left flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Send className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {lang === 'ar' ? 'إجمالي الحملات' : 'Total Campaigns'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1 rtl:justify-end ltr:justify-start">
              <span className="text-2xl font-black text-zinc-800 dark:text-white">
                {totalCampaigns} {lang === 'ar' ? 'حملة' : 'Campaigns'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Agent usage card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl shadow-xs rtl:text-right ltr:text-left flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {lang === 'ar' ? 'المساعد الذكي' : 'AI Assistants'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1 rtl:justify-end ltr:justify-start">
              <span className="text-2xl font-black text-zinc-800 dark:text-white">
                {aiEnabledDevices} {lang === 'ar' ? 'نشط' : 'Active'}
              </span>
              <span className="text-xs text-zinc-400 font-bold">/ {devices.length}</span>
            </div>
          </div>
        </div>

        {/* System latency and SLA */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl shadow-xs rtl:text-right ltr:text-left flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {lang === 'ar' ? 'استقرار الخدمة' : 'SLA Health'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1 rtl:justify-end ltr:justify-start">
              <span className="text-2xl font-black text-zinc-800 dark:text-white font-mono">99.98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Dynamic Activity Area Chart (SVG custom drawing) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 rounded-3xl shadow-xs lg:col-span-2 rtl:text-right ltr:text-left">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
            <span className="text-[10px] font-bold text-zinc-400">
              {lang === 'ar' ? 'آخر 24 ساعة (خادم آمن)' : 'Last 24 Hours (Secure Server)'}
            </span>
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
              {lang === 'ar' ? 'معدل نشاط المحادثات اليومي' : 'Daily Conversation Activity'}
            </h3>
          </div>

          <div className="h-60 w-full relative pt-4">
            {/* SVG graph drawing a professional custom area */}
            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00a884" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00a884" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f4f4f5" className="dark:stroke-zinc-800/30" strokeDasharray="3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#f4f4f5" className="dark:stroke-zinc-800/30" strokeDasharray="3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#f4f4f5" className="dark:stroke-zinc-800/30" strokeDasharray="3" />
              
              {/* Smooth Area */}
              <path
                d="M 0 150 L 0 110 Q 50 80 100 100 T 200 60 T 300 40 T 400 80 T 500 45 L 500 150 Z"
                fill="url(#chartGrad)"
              />
              
              {/* Glowing Outline Line */}
              <path
                d="M 0 110 Q 50 80 100 100 T 200 60 T 300 40 T 400 80 T 500 45"
                fill="none"
                stroke="#00a884"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="200" cy="60" r="5" fill="#00a884" className="animate-ping" />
              <circle cx="200" cy="60" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="300" cy="40" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="500" cy="45" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold font-mono pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-1">
              <span>{lang === 'ar' ? '12:00 ص' : '12:00 AM'}</span>
              <span>{lang === 'ar' ? '06:00 ص' : '06:00 AM'}</span>
              <span>{lang === 'ar' ? '12:00 م' : '12:00 PM'}</span>
              <span>{lang === 'ar' ? '06:00 م' : '06:00 PM'}</span>
              <span>{lang === 'ar' ? '11:59 م' : '11:59 PM'}</span>
            </div>
          </div>
        </div>

        {/* Circular Dial: AI Assistant Success Rates */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 rounded-3xl shadow-xs text-center flex flex-col justify-between">
          <div className="rtl:text-right ltr:text-left border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-2">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
              {lang === 'ar' ? 'معدل استجابة الذكاء الاصطناعي' : 'AI Response Rate'}
            </h3>
          </div>

          <div className="flex items-center justify-center py-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f4f4f5"
                  className="dark:stroke-zinc-800"
                  strokeWidth="10"
                />
                {/* Colored Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="12.56" // 95%
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-zinc-800 dark:text-white font-mono">95%</span>
                <span className="text-[10px] font-bold text-zinc-400">
                  {lang === 'ar' ? 'معدل الاستجابة' : 'Response Rate'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/40 text-xs text-zinc-500 leading-relaxed rtl:text-right ltr:text-left flex gap-2 items-center rtl:justify-end ltr:justify-start">
            <Cpu className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              {lang === 'ar' 
                ? 'قام المساعد الذكي بالرد التلقائي وإغلاق المحادثات بنجاح.' 
                : 'AI Agent successfully responded and closed conversations.'}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics & Advanced Marketing Statistics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Conversion & Performance */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 rounded-3xl shadow-xs rtl:text-right ltr:text-left space-y-5">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 rtl:justify-end ltr:justify-start">
              <span>{lang === 'ar' ? 'أداء الحملات التسويقية والتحويل' : 'Campaign Conversion & Performance'}</span>
              <Activity className="w-4 h-4 text-[#00a884]" />
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              {lang === 'ar' 
                ? 'معدل نجاح إرسال الرسائل وتفاعل العملاء المستهدفين.' 
                : 'Success dispatch rate and prospective lead conversion.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Delivery Rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs flex-row-reverse">
                <span className="text-zinc-500 font-semibold">{lang === 'ar' ? 'معدل تسليم الرسائل' : 'Message Delivery Rate'}</span>
                <span className="font-bold text-[#00a884] font-mono">98.6%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-[#00a884] h-full rounded-full" style={{ width: '98.6%' }}></div>
              </div>
            </div>

            {/* Read / Interaction Rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs flex-row-reverse">
                <span className="text-zinc-500 font-semibold">{lang === 'ar' ? 'معدل قراءة الرسائل' : 'Message Read Rate'}</span>
                <span className="font-bold text-sky-500 font-mono">84.2%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: '84.2%' }}></div>
              </div>
            </div>

            {/* Campaign Conversion */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs flex-row-reverse">
                <span className="text-zinc-500 font-semibold">{lang === 'ar' ? 'معدل الاستجابة والتحويل' : 'Lead Conversion Rate'}</span>
                <span className="font-bold text-amber-500 font-mono">24.8%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '24.8%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-500 leading-relaxed text-right">
            {lang === 'ar' 
              ? '💡 معدل تفاعل مرتفع بنسبة 12% مقارنة بالأسبوع الماضي، وتصدرت بوابات واتساب المحتوى الترويجي.' 
              : '💡 Engagement is up by 12% compared to last week, with WhatsApp gateways outperforming other channels.'}
          </div>
        </div>

        {/* Lead Segmentation and Customer Sources */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 rounded-3xl shadow-xs rtl:text-right ltr:text-left space-y-5">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 rtl:justify-end ltr:justify-start">
              <span>{lang === 'ar' ? 'مصادر استقطاب العملاء وتصنيفهم' : 'Lead Channels & Demographics'}</span>
              <Database className="w-4 h-4 text-purple-500" />
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              {lang === 'ar' 
                ? 'القنوات الأكثر تفاعلاً لدخول العملاء الجدد في النظام.' 
                : 'Most active inbound platforms capturing client conversations.'}
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Source 1: Groups */}
            <div className="flex items-center justify-between flex-row-reverse text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lang === 'ar' ? 'مجموعات الواتساب' : 'WhatsApp Groups'}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-500 font-mono">65%</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00a884]"></span>
              </div>
            </div>

            {/* Source 2: REST API Webhooks */}
            <div className="flex items-center justify-between flex-row-reverse text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lang === 'ar' ? 'الربط البرمجي (Webhooks)' : 'REST API & Webhooks'}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-500 font-mono">22%</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              </div>
            </div>

            {/* Source 3: Chatbot Widgets */}
            <div className="flex items-center justify-between flex-row-reverse text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lang === 'ar' ? 'بوتات الدردشة التلقائية' : 'Chatbot Widgets'}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-500 font-mono">13%</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              </div>
            </div>
          </div>

          {/* Miniature bento card for sync leads status */}
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">{lang === 'ar' ? 'العملاء المتزامنون اليوم' : 'Total Synced Leads Today'}</span>
            <span className="text-xl font-black text-[#00a884] block mt-1">+142 {lang === 'ar' ? 'عميل' : 'leads'}</span>
          </div>
        </div>

        {/* Peak Hours & System Active Load */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 rounded-3xl shadow-xs rtl:text-right ltr:text-left flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 rtl:justify-end ltr:justify-start">
              <span>{lang === 'ar' ? 'أوقات ذروة تفاعل العملاء' : 'Peak Customer Activity Hours'}</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 pb-3">
              {lang === 'ar' 
                ? 'توزيع التفاعل على مدار اليوم لتحديد التوقيت الأمثل للحملات.' 
                : 'Traffic density graph showing the best hours to schedule broadcasts.'}
            </p>
          </div>

          {/* Simple and elegant custom vertical bar representation */}
          <div className="flex items-end justify-between h-28 px-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-1 gap-2">
            {/* Morning */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-t-lg h-12 w-full transition-all relative group cursor-pointer flex items-end">
                <div className="bg-[#00a884] w-full rounded-t-lg h-[40%] group-hover:h-[50%] transition-all"></div>
              </div>
              <span className="text-[9px] font-bold text-zinc-400">{lang === 'ar' ? 'صباحاً' : 'Morning'}</span>
            </div>

            {/* Afternoon */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-t-lg h-24 w-full transition-all relative group cursor-pointer flex items-end">
                <div className="bg-[#00a884] w-full rounded-t-lg h-[85%] group-hover:h-full transition-all"></div>
              </div>
              <span className="text-[9px] font-bold text-zinc-500">{lang === 'ar' ? 'ظهراً' : 'Afternoon'}</span>
            </div>

            {/* Evening */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-t-lg h-20 w-full transition-all relative group cursor-pointer flex items-end">
                <div className="bg-[#00a884] w-full rounded-t-lg h-[60%] group-hover:h-[80%] transition-all"></div>
              </div>
              <span className="text-[9px] font-bold text-zinc-400">{lang === 'ar' ? 'مساءً' : 'Evening'}</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 leading-normal pt-3 text-center">
            {lang === 'ar' 
              ? 'أفضل استجابة في الفترة بين 12:00 م إلى 04:00 م بمعدل رد 91.4%' 
              : 'Highest active response is between 12:00 PM and 04:00 PM with 91.4% response rate'}
          </p>
        </div>
      </div>
    </div>
  );
}
