/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, UserPlus, LogOut, Check, CheckCheck, Smartphone, Sparkles, Filter, Users } from 'lucide-react';
import { User, Conversation, DeviceLink } from '../types.js';
import { translations } from '../translations.js';

interface SidebarProps {
  currentUser: User;
  conversations: (Conversation & { recipient: User })[];
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  latestMessages: Record<string, { content: string; timestamp: string; senderId: string; status: string }>;
  statuses: any[];
  onSelectConversation: (convId: string) => void;
  onAddNewContact: (username: string, deviceId: string) => void;
  devices: DeviceLink[];
  lang: 'ar' | 'en';
}

export default function Sidebar({
  currentUser,
  conversations,
  activeConversationId,
  unreadCounts,
  latestMessages,
  statuses,
  onSelectConversation,
  onAddNewContact,
  devices,
  lang
}: SidebarProps) {
  const t = translations[lang];
  const [searchText, setSearchText] = useState<string>('');
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>('');
  const [addError, setAddError] = useState<string>('');
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>('All');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');

  // CRM Label definitions with customized styling and bilingual labels
  const LABELS = [
    { name: 'All', displayName: t.allLabels, color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    { name: 'New', displayName: t.newLabel, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' },
    { name: 'Lead', displayName: t.leadLabel, color: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/30' },
    { name: 'Pending', displayName: t.pendingLabel, color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30' },
    { name: 'Completed', displayName: t.completedLabel, color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30' },
    { name: 'VIP', displayName: t.vipLabel, color: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30' }
  ];

  // Check if contact has any active stories
  const contactHasStatus = (userId: string) => {
    return statuses.some((s) => s.userId === userId);
  };

  // Check if current user hasn't viewed those stories
  const contactHasUnviewedStatus = (userId: string) => {
    const userStories = statuses.filter((s) => s.userId === userId);
    if (userStories.length === 0) return false;
    return userStories.some((s) => !s.viewers.includes(currentUser.id));
  };

  const filteredConversations = conversations
    .filter((c) => {
      const matchesSearch = c.recipient.username.toLowerCase().includes(searchText.toLowerCase());
      const matchesLabel = selectedLabelFilter === 'All' || c.label === selectedLabelFilter;
      const matchesDevice = selectedDeviceId === 'all' || c.deviceId === selectedDeviceId;
      return matchesSearch && matchesLabel && matchesDevice;
    })
    .sort((a, b) => {
      const timeA = latestMessages[a.id]?.timestamp || a.updatedAt || a.createdAt;
      const timeB = latestMessages[b.id]?.timestamp || b.updatedAt || b.createdAt;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newContactName.trim()) return;
    if (newContactName.trim().toLowerCase() === currentUser.username.toLowerCase()) {
      setAddError(t.youCantAddYourself);
      return;
    }
    let deviceToUse = selectedDeviceId;
    if (deviceToUse === 'all') {
      if (devices.length === 1) {
        deviceToUse = devices[0].id;
      } else if (devices.length === 0) {
        setAddError(lang === 'ar' ? 'لا يوجد أجهزة متصلة لبدء المحادثة.' : 'No devices connected to start a chat.');
        return;
      } else {
        setAddError(lang === 'ar' ? 'يرجى تحديد خط واتساب من القائمة بالأعلى لبدء محادثة جديدة.' : 'Please select a specific WhatsApp line from the top menu to start a new chat.');
        return;
      }
    }

    onAddNewContact(newContactName.trim(), deviceToUse);
    setNewContactName('');
    setShowAddContact(false);
  };

  return (
    <div className={`w-full md:w-[360px] ${activeConversationId ? 'hidden md:flex' : 'flex'} flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full z-10 rtl:text-right ltr:text-left`}>
      
      {/* Search Header and contact trigger */}
      <div className="bg-zinc-100 dark:bg-zinc-950 p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
        <button
          onClick={() => setShowAddContact(!showAddContact)}
          className="bg-[#00a884] hover:bg-[#008f6f] text-white p-2 rounded-xl transition-all cursor-pointer shadow-xs"
          title={t.newChat}
        >
          <UserPlus className="w-4 h-4" />
        </button>

        <div className="rtl:text-right ltr:text-left">
          <h2 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">{t.unifiedInbox}</h2>
          <p className="text-[10px] text-zinc-400 font-medium">{t.unifiedInboxSub}</p>
        </div>
      </div>

      {/* HORIZONTAL ACCOUNTS / DEVICE SLIDER (CRITICAL USER MANDATE FOR ISOLATED INBOXES) */}
      <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3.5 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
          <Smartphone className="w-3.5 h-3.5 text-[#00a884]" />
          <span>{t.selectActiveLine}</span>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {/* Default Option: ALL */}
          <button
            onClick={() => setSelectedDeviceId('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedDeviceId === 'all'
                ? 'bg-[#00a884] text-white shadow-md'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.allLines}</span>
          </button>

          {/* Individual Device Buttons */}
          {devices.map((dev) => {
            const isSelected = selectedDeviceId === dev.id;
            const isOnline = dev.status === 'connected';

            return (
              <button
                key={dev.id}
                onClick={() => setSelectedDeviceId(dev.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#00a884] text-white border-emerald-500 shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {/* Live green dot */}
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                <span>{dev.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add New Chat/Friend Panel */}
      {showAddContact && (
        <form onSubmit={handleCreateContact} className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 rtl:text-right ltr:text-left">
              {t.quickDemoLabel}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder={t.quickDemoPlaceholder}
                value={newContactName}
                onChange={(e) => {
                  setNewContactName(e.target.value);
                  setAddError('');
                }}
                className="flex-1 bg-white dark:bg-zinc-900 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-500 rtl:text-right ltr:text-left"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                {t.openButton}
              </button>
            </div>
            {addError && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{addError}</span>}
          </div>
        </form>
      )}

      {/* Chat List Search Field */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-zinc-700 dark:text-zinc-300 outline-none placeholder-zinc-400 rtl:text-right ltr:text-left"
          />
        </div>
      </div>

      {/* Quick Filter Badges Scroll Bar */}
      <div className="px-3 pb-2.5 pt-1.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {LABELS.map((lbl) => {
          const isSelected = selectedLabelFilter === lbl.name;
          return (
            <button
              key={lbl.name}
              onClick={() => setSelectedLabelFilter(lbl.name)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-white dark:bg-emerald-600 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {lbl.displayName}
            </button>
          );
        })}
      </div>

      {/* Scrollable Conversation Stack */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
        {filteredConversations.map((c) => {
          const isActive = c.id === activeConversationId;
          const unread = unreadCounts[c.id] || 0;
          const lastMsg = latestMessages[c.id];
          const hasStatus = contactHasStatus(c.recipient.id);
          const hasUnviewedStatus = contactHasUnviewedStatus(c.recipient.id);
          const deviceAssigned = devices.find(d => d.id === c.deviceId);

          return (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors select-none ${
                isActive ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
              }`}
            >
              {/* Profile image with status story ring indicator */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-11 h-11 rounded-full p-[2px] ${
                    hasUnviewedStatus
                      ? 'border-2 border-emerald-500'
                      : hasStatus
                      ? 'border-2 border-zinc-300 dark:border-zinc-700'
                      : 'border-transparent'
                  }`}
                >
                  <img
                    src={c.recipient.avatarUrl}
                    alt={c.recipient.username}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover bg-zinc-100"
                  />
                </div>
                {/* Online Indicator Bubble */}
                {c.recipient.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                )}
              </div>

              {/* Chat details */}
              <div className="flex-1 min-w-0 rtl:text-right ltr:text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  
                  <div className="flex items-center gap-1.5 min-w-0 max-w-[70%]">
                    {c.label && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                        {LABELS.find(l => l.name === c.label)?.displayName || c.label}
                      </span>
                    )}
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm truncate">
                      {c.recipient.username}
                    </span>
                  </div>
                </div>

                {deviceAssigned && selectedDeviceId === 'all' && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <Smartphone className="w-2.5 h-2.5 text-zinc-400" />
                    <span className="text-[10px] text-zinc-500 font-medium truncate">
                      {deviceAssigned.name || deviceAssigned.phoneNumber || deviceAssigned.id}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {/* Unread badge or checkmark status */}
                  {unread > 0 ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-extrabold rounded-full px-2 py-0.5 flex items-center justify-center min-w-5">
                      {unread}
                    </span>
                  ) : lastMsg && lastMsg.senderId === currentUser.id ? (
                    lastMsg.status === 'read' ? (
                      <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                    ) : (
                      <Check className="w-4 h-4 text-zinc-400" />
                    )
                  ) : (
                    <div />
                  )}

                  {/* Message body snippet */}
                  <span className="text-xs text-zinc-400 truncate max-w-[80%]">
                    {lastMsg ? lastMsg.content : t.noMessagesYet}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center py-12 text-zinc-400 text-xs">
            {t.noChatsMatch}
          </div>
        )}
      </div>
    </div>
  );
}
