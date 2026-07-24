import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface TicketModalProps {
  conversationId: string;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export default function TicketModal({ conversationId, onClose, lang }: TicketModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${conversationId}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return res.json();
    }
  });

  const createTicket = useMutation({
    mutationFn: async (newTicket: { title: string, priority: string, conversationId: string }) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', conversationId] });
      setTitle('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTicket.mutate({ title, priority, conversationId });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            {lang === 'ar' ? 'نظام التذاكر' : 'Ticketing System'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              {lang === 'ar' ? 'إنشاء تذكرة جديدة' : 'Create New Ticket'}
            </h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'وصف المشكلة...' : 'Issue description...'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
              />
              <div className="flex gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none flex-1 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="low">{lang === 'ar' ? 'منخفض' : 'Low'}</option>
                  <option value="normal">{lang === 'ar' ? 'متوسط' : 'Normal'}</option>
                  <option value="high">{lang === 'ar' ? 'عالي' : 'High'}</option>
                  <option value="urgent">{lang === 'ar' ? 'عاجل جداً' : 'Urgent'}</option>
                </select>
                <button
                  type="submit"
                  disabled={createTicket.isPending || !title.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {createTicket.isPending ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {lang === 'ar' ? 'إنشاء' : 'Create'}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {lang === 'ar' ? 'التذاكر الحالية' : 'Current Tickets'}
            </h4>
            {isLoading ? (
              <div className="text-center py-8 text-zinc-500">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : tickets?.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100 dark:border-zinc-800 border-dashed">
                {lang === 'ar' ? 'لا توجد تذاكر لهذه المحادثة' : 'No tickets for this conversation'}
              </div>
            ) : (
              tickets?.map(ticket => (
                <div key={ticket.id} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800/50 flex items-start gap-3">
                  {ticket.status === 'open' ? (
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ticket.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <span className={`px-2 py-0.5 rounded-full ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
