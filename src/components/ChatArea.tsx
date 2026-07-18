/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  Search,
  Check,
  CheckCheck,
  Phone,
  Video,
  Play,
  Pause,
  Image,
  Square,
  Volume2,
  Zap,
  Download,
  Trash2,
  ChevronRight,
  Sparkles,
  FileText,
  X,
  Activity,
  VolumeX,
  PhoneOff,
  Loader2
} from 'lucide-react';
import { User, Message, Conversation } from '../types.js';
import { translations } from '../translations.js';

// Generates a beautiful 100% compliant WAV chime (C5 -> E5 -> G5) to avoid playback errors in sandbox/iframe
function generateSimulatedVoiceWav(): string {
  const sampleRate = 8000;
  const duration = 1.2; 
  const numSamples = Math.floor(sampleRate * duration);
  const bufferSize = 44 + numSamples;
  const buffer = new Uint8Array(bufferSize);

  // RIFF identifier
  buffer[0] = 0x52; // 'R'
  buffer[1] = 0x49; // 'I'
  buffer[2] = 0x46; // 'F'
  buffer[3] = 0x46; // 'F'

  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;

  // WAVE identifier
  buffer[8] = 0x57;  // 'W'
  buffer[9] = 0x41;  // 'A'
  buffer[10] = 0x56; // 'V'
  buffer[11] = 0x45; // 'E'

  // fmt chunk
  buffer[12] = 0x66; // 'f'
  buffer[13] = 0x6d; // 'm'
  buffer[14] = 0x74; // 't'
  buffer[15] = 0x20; // ' '

  buffer[16] = 16;
  buffer[17] = 0;
  buffer[18] = 0;
  buffer[19] = 0;

  buffer[20] = 1;
  buffer[21] = 0;

  buffer[22] = 1;
  buffer[23] = 0;

  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;

  buffer[28] = sampleRate & 0xff;
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;

  buffer[32] = 1;
  buffer[33] = 0;

  buffer[34] = 8;
  buffer[35] = 0;

  // data chunk
  buffer[36] = 0x64; // 'd'
  buffer[37] = 0x61; // 'a'
  buffer[38] = 0x74; // 't'
  buffer[39] = 0x61; // 'a'

  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  // Generate a beautiful, warm, soft dual-tone beep melody
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let value = 128;
    if (t < 0.3) {
      value = 128 + Math.floor(40 * Math.sin(2 * Math.PI * 523.25 * t)); // C5 note
    } else if (t >= 0.4 && t < 0.7) {
      value = 128 + Math.floor(40 * Math.sin(2 * Math.PI * 659.25 * t)); // E5 note
    } else if (t >= 0.8 && t < 1.1) {
      value = 128 + Math.floor(40 * Math.sin(2 * Math.PI * 783.99 * t)); // G5 note
    }
    buffer[44 + i] = value;
  }

  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + window.btoa(binary);
}

interface ChatAreaProps {
  currentUser: User;
  activeContact: User;
  activeConversation?: Conversation;
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (content: string, type: 'text' | 'image' | 'audio', mediaUrl?: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onMarkRead: () => void;
  onUpdateLabel?: (convId: string, label?: string) => void;
  onToggleAi?: (convId: string, aiPaused: boolean) => void;
  onUpdateVoiceSettings?: (convId: string, enabled: boolean, accent: string, voiceName: string) => void;
  onDeleteConversation?: (convId: string) => void;
  onBackToList?: () => void;
  lang: 'ar' | 'en';
}

// Visual sound waves for simulated recording
const SOUND_WAVE_BARS = [4, 10, 6, 12, 18, 14, 8, 20, 16, 10, 6, 14, 24, 18, 8, 12, 6, 10, 4];

// Quick emoji options
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '💡'];

// Quick canned responses for CRM
const QUICK_REPLIES = {
  ar: [
    { shortcut: '/welcome', title: 'ترحيب بالعميل', text: 'أهلاً بك يا فندم! كيف يمكنني مساعدتك اليوم بخصوص خدماتنا؟' },
    { shortcut: '/pricing', title: 'الأسعار والخدمات', text: 'يسعدنا تقديم باقاتنا المميزة! تبدأ أسعار الاشتراكات من 29$ شهرياً وتتضمن الدعم الفني الكامل.' },
    { shortcut: '/location', title: 'العنوان وساعات العمل', text: 'مقرنا الرئيسي في القاهرة الجديدة، ونعمل يومياً من الساعة 9 صباحاً وحتى 8 مساءً عدا الجمعة.' },
    { shortcut: '/support', title: 'الدعم الفني', text: 'تم تسجيل طلب الدعم الخاص بك يا فندم. سيقوم أحد مهندسينا بالتواصل معك خلال دقائق.' },
    { shortcut: '/done', title: 'إنهاء المحادثة', text: 'سعدنا جداً بخدمتك اليوم! لا تتردد في التواصل معنا في أي وقت إذا كان لديك استفسارات أخرى.' }
  ],
  en: [
    { shortcut: '/welcome', title: 'Welcome Customer', text: 'Welcome! How can I assist you today regarding our services?' },
    { shortcut: '/pricing', title: 'Pricing & Services', text: 'We are pleased to offer our premium packages! Subscriptions start at $29/month, including full support.' },
    { shortcut: '/location', title: 'Address & Working Hours', text: 'Our headquarters is in New Cairo. We operate daily from 9 AM to 8 PM, except Fridays.' },
    { shortcut: '/support', title: 'Technical Support', text: 'Your support ticket has been registered. One of our engineers will contact you shortly.' },
    { shortcut: '/done', title: 'End Conversation', text: 'It was a pleasure serving you today! Feel free to reach out anytime if you have more questions.' }
  ]
};

export default function ChatArea({
  currentUser,
  activeContact,
  activeConversation,
  messages,
  isTyping,
  onSendMessage,
  onSendTyping,
  onMarkRead,
  onUpdateLabel,
  onToggleAi,
  onUpdateVoiceSettings,
  onDeleteConversation,
  onBackToList,
  lang
}: ChatAreaProps) {
  const t = translations[lang];
  const crmLabelsList = [
    { name: 'None', displayName: lang === 'ar' ? 'بلا تصنيف' : 'Unlabeled', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
    { name: 'New', displayName: t.newLabel, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { name: 'Lead', displayName: t.leadLabel, color: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400' },
    { name: 'Pending', displayName: t.pendingLabel, color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' },
    { name: 'Completed', displayName: t.completedLabel, color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { name: 'VIP', displayName: t.vipLabel, color: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400' }
  ];
  const [inputText, setInputText] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [showQuickReplies, setShowQuickReplies] = useState<boolean>(false);
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // Voice interaction configuration states
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [voiceAccent, setVoiceAccent] = useState<string>('msa');
  const [voiceName, setVoiceName] = useState<string>('Zephyr');

  // Real-Time Call Simulation States
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'active' | 'ended'>('calling');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callTranscript, setCallTranscript] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [callInputText, setCallInputText] = useState<string>('');
  const [isCallMuted, setIsCallMuted] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isCallResponding, setIsCallResponding] = useState<boolean>(false);
  
  // Administrative Report Drawer States
  const [showReportDrawer, setShowReportDrawer] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [currentAdminReport, setCurrentAdminReport] = useState<{ content: string; updatedAt: string } | null>(null);

  // Active call timers & refs
  const callTimerRef = useRef<number | null>(null);
  const callRingingTimerRef = useRef<number | null>(null);
  const callAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync settings and admin report with active conversation
  useEffect(() => {
    if (activeConversation) {
      setVoiceEnabled(activeConversation.voiceSettings?.enabled ?? false);
      setVoiceAccent(activeConversation.voiceSettings?.accent ?? 'msa');
      setVoiceName(activeConversation.voiceSettings?.voiceName ?? 'Zephyr');
      setCurrentAdminReport(activeConversation.adminReport || null);
    } else {
      setCurrentAdminReport(null);
    }
  }, [activeConversation?.id, activeConversation?.voiceSettings, activeConversation?.adminReport]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (callRingingTimerRef.current) clearTimeout(callRingingTimerRef.current);
      if (callAudioRef.current) {
        callAudioRef.current.pause();
      }
    };
  }, []);

  // Helper to save settings to the server
  const handleSaveVoiceSettings = async (enabled: boolean, accent: string, voice: string) => {
    if (!activeConversation) return;
    
    // Optimistically update the UI states
    setVoiceEnabled(enabled);
    setVoiceAccent(accent);
    setVoiceName(voice);
    if (onUpdateVoiceSettings) {
      onUpdateVoiceSettings(activeConversation.id, enabled, accent, voice);
    }

    try {
      await fetch(`/api/conversations/${activeConversation.id}/voice-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, accent, voiceName: voice })
      });
    } catch (err) {
      console.error('Failed to save AI Voice Settings:', err);
    }
  };

  // Export full transcript as a clean text file
  const handleExportChat = () => {
    if (messages.length === 0 || !activeContact) return;
    const header = `========================================\nسجل محادثة واتساب: ${activeContact.username}\nتاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n========================================\n\n`;
    const transcript = messages
      .map((msg) => {
        const time = new Date(msg.timestamp).toLocaleString('ar-EG');
        const sender = msg.senderId === currentUser.id ? 'أنت' : (activeContact?.username || 'Unknown');
        const body = msg.type === 'image' ? '[📷 صورة / ميديا]' : msg.type === 'audio' ? '[🎤 رسالة صوتية]' : msg.content;
        return `[${time}] ${sender}: ${body}`;
      })
      .join('\n\n');
      
    const element = document.createElement('a');
    const file = new Blob([header + transcript], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `chat_${activeContact.username}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Voice Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // Audio Playback references
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({}); // msgId -> percentage (0-100)
  const activeAudiosRef = useRef<Record<string, HTMLAudioElement>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const prevIsTypingRef = useRef<boolean>(isTyping);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Instantly scroll to bottom when active contact or conversation changes
  useEffect(() => {
    scrollToBottom('auto');
    prevMessagesLengthRef.current = messages.length;
    // Multi-stage scroll to ensure container layout finishes rendering before scrolling
    const timer1 = setTimeout(() => scrollToBottom('auto'), 50);
    const timer2 = setTimeout(() => scrollToBottom('auto'), 250);
    onMarkRead();
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeContact.id, activeConversation?.id]);

  // Smooth scroll to bottom upon new messages or typing changes
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    const typingStarted = isTyping && !prevIsTypingRef.current;
    prevIsTypingRef.current = isTyping;

    // Check if the user is already scrolled near the bottom (within 150px)
    let isNearBottom = false;
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    }

    // Only auto-scroll down if it is a brand new message, or if the user started typing and is already near the bottom
    if (isNewMessage || (typingStarted && isNearBottom)) {
      scrollToBottom('smooth');
      const timer = setTimeout(() => scrollToBottom('smooth'), 100);
      return () => clearTimeout(timer);
    }
    onMarkRead();
  }, [messages, isTyping]);

  // Handle typing triggers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    onSendTyping(true);

    // Auto-open quick replies if typing a slash prefix
    if (val.startsWith('/')) {
      setShowQuickReplies(true);
    } else {
      setShowQuickReplies(false);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = window.setTimeout(() => {
      onSendTyping(false);
    }, 1500);
  };

  // Submit Text Message
  const handleSendText = async () => {
    if (!inputText.trim()) return;
    
    if (isInternalNote && activeConversation) {
      try {
        await fetch('/api/messages/internal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            convId: activeConversation.id,
            senderId: currentUser.id,
            content: inputText
          })
        });
        setInputText('');
        onSendTyping(false);
        setIsInternalNote(false);
      } catch (err) {
        console.error('Failed to send internal note', err);
      }
    } else {
      onSendMessage(inputText, 'text');
      setInputText('');
      onSendTyping(false);
      setShowQuickReplies(false);
    }
  };

  const handleSummarizeChat = async () => {
    if (!activeConversation) return;
    setIsSummarizing(true);
    try {
      await fetch(`/api/conversations/${activeConversation.id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      });
    } catch (err) {
      console.error('Failed to summarize chat:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendText();
    }
  };

  // Image Attach Handler
  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage('Sent a photo', 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    setShowAttachMenu(false);
  };

  // Micro-recording & Voice Note simulation fallbacks
  const startRecording = async () => {
    setIsRecording(true);
    setRecordDuration(0);
    audioChunksRef.current = [];

    // Trigger recording duration tick
    recordingTimerRef.current = window.setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);

    try {
      // Check for native recorder
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
          const reader = new FileReader();
          reader.onloadend = () => {
            onSendMessage('Voice Message', 'audio', reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
          
          // Stop stream tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
      }
    } catch (err) {
      console.warn('Microphone block or error in sandbox. Using high-fidelity animated fallback voice note simulation.', err);
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // High-Fidelity Audio Base64 simulation (A beautiful pre-composed WAV dual-tone chime so that users in iframes can always play back and test)
      const mockAudioBase64 = generateSimulatedVoiceWav();
      setTimeout(() => {
        onSendMessage('Simulated Voice Note', 'audio', mockAudioBase64);
      }, 500);
    }
  };

  // Real-Time Call Simulated Actions
  const handleStartCall = () => {
    setShowCallModal(true);
    setCallStatus('calling');
    setCallDuration(0);
    setCallTranscript([{ sender: 'ai', text: lang === 'ar' ? 'جاري رنين الاتصال...' : 'Calling...' }]);
    setIsCallResponding(false);
    setIsAiSpeaking(false);

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (callRingingTimerRef.current) clearTimeout(callRingingTimerRef.current);

    // After 1.8 seconds transition to active
    callRingingTimerRef.current = window.setTimeout(async () => {
      setCallStatus('active');
      setCallTranscript([{ sender: 'ai', text: lang === 'ar' ? 'مكالمة نشطة الآن مع الوكيل الذكي' : 'Live conversation with AI Agent' }]);
      
      // Start duration ticker
      callTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Trigger initial AI greeting call response
      try {
        setIsCallResponding(true);
        const greetingText = lang === 'ar' 
          ? 'مرحباً بك! أنا الوكيل الذكي لشركتك. كيف يمكنني خدمتك اليوم بالصوت والصورة؟' 
          : 'Hello! I am your AI agent. How can I assist you today?';
        
        const res = await fetch('/api/calls/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            convId: activeConversation?.id,
            text: greetingText,
            accent: voiceAccent,
            voiceName: voiceName
          })
        });
        const data = await res.json();
        setIsCallResponding(false);

        if (data.success) {
          setCallTranscript((prev) => [...prev, { sender: 'ai', text: data.text }]);
          if (data.audio) {
            setIsAiSpeaking(true);
            if (callAudioRef.current) callAudioRef.current.pause();
            const aud = new Audio(data.audio);
            callAudioRef.current = aud;
            aud.play().catch((e) => console.log('Audio autoplay blocked, visual feedback playing.'));
            aud.onended = () => {
              setIsAiSpeaking(false);
            };
          } else {
            // Visual feedback fallback speaking
            setIsAiSpeaking(true);
            setTimeout(() => setIsAiSpeaking(false), 4000);
          }
        }
      } catch (err) {
        console.error('Greeting call err:', err);
        setIsCallResponding(false);
      }
    }, 1800);
  };

  const handleSendCallMessage = async (textToSay: string) => {
    if (!textToSay.trim()) return;
    setCallTranscript((prev) => [...prev, { sender: 'user', text: textToSay }]);
    setCallInputText('');
    setIsCallResponding(true);
    setIsAiSpeaking(false);

    try {
      const res = await fetch('/api/calls/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convId: activeConversation?.id,
          text: textToSay,
          accent: voiceAccent,
          voiceName: voiceName
        })
      });
      const data = await res.json();
      setIsCallResponding(false);

      if (data.success) {
        setCallTranscript((prev) => [...prev, { sender: 'ai', text: data.text }]);
        if (data.audio) {
          setIsAiSpeaking(true);
          if (callAudioRef.current) callAudioRef.current.pause();
          const aud = new Audio(data.audio);
          callAudioRef.current = aud;
          aud.play().catch((e) => console.log('Audio play blocked.'));
          aud.onended = () => {
            setIsAiSpeaking(false);
          };
        } else {
          setIsAiSpeaking(true);
          setTimeout(() => setIsAiSpeaking(false), 4000);
        }
      }
    } catch (err) {
      console.error('Call response error:', err);
      setIsCallResponding(false);
    }
  };

  const handleEndCall = async () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (callRingingTimerRef.current) clearTimeout(callRingingTimerRef.current);
    if (callAudioRef.current) {
      callAudioRef.current.pause();
    }
    
    setCallStatus('ended');
    setShowCallModal(false);

    // Auto trigger Administrative Audit Report [ADMIN_REPORT] immediately upon call end
    if (activeConversation) {
      setIsGeneratingReport(true);
      setShowReportDrawer(true);
      try {
        const transcriptText = callTranscript
          .map((line) => `${line.sender === 'user' ? 'العميل' : 'الوكيل الذكي'}: ${line.text}`)
          .join('\n');

        const res = await fetch(`/api/conversations/${activeConversation.id}/generate-admin-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCall: true, callTranscript: transcriptText })
        });
        const data = await res.json();
        if (data.success) {
          setCurrentAdminReport(data.adminReport);
        }
      } catch (err) {
        console.error('Failed to trigger call admin report:', err);
      } finally {
        setIsGeneratingReport(false);
      }
    }
  };

  const handleGenerateManualReport = async () => {
    if (!activeConversation) return;
    setIsGeneratingReport(true);
    setShowReportDrawer(true);
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/generate-admin-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCall: false })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentAdminReport(data.adminReport);
      }
    } catch (err) {
      console.error('Failed to trigger manual admin report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle playing voice notes with active progresses
  const playAudio = (msgId: string, url: string) => {
    // If playing, pause current
    if (playingAudioId === msgId) {
      const active = activeAudiosRef.current[msgId];
      if (active) {
        active.pause();
        setPlayingAudioId(null);
      }
      return;
    }

    // Stop all other audios
    Object.keys(activeAudiosRef.current).forEach((id) => {
      activeAudiosRef.current[id].pause();
    });

    let audio = activeAudiosRef.current[msgId];
    if (!audio) {
      audio = new Audio(url);
      activeAudiosRef.current[msgId] = audio;

      audio.ontimeupdate = () => {
        const percent = (audio.currentTime / (audio.duration || 1)) * 100;
        setAudioProgress((prev) => ({ ...prev, [msgId]: percent }));
      };

      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress((prev) => ({ ...prev, [msgId]: 0 }));
      };
    }

    audio.play()
      .then(() => {
        setPlayingAudioId(msgId);
      })
      .catch((err) => {
        console.error('Playback block/error:', err);
        // Playback simulation if file is block
        setPlayingAudioId(msgId);
        let progress = 0;
        const sim = setInterval(() => {
          progress += 5;
          setAudioProgress((prev) => ({ ...prev, [msgId]: progress }));
          if (progress >= 100) {
            clearInterval(sim);
            setPlayingAudioId(null);
            setAudioProgress((prev) => ({ ...prev, [msgId]: 0 }));
          }
        }, 150);
      });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Dynamic Background Panel */}
      <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] dark:opacity-[0.03] pointer-events-none" />

      {/* Chat Header */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2.5 md:gap-4">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title={lang === 'ar' ? 'العودة للقائمة' : 'Back to list'}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <img
            src={activeContact.avatarUrl}
            alt={activeContact.username}
            referrerPolicy="no-referrer"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
          />
          <div className="rtl:text-right ltr:text-left">
            <h2 className="font-semibold text-sm md:text-base text-zinc-800 dark:text-zinc-100">{activeContact.username}</h2>
            <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs mt-0.5 flex-wrap">
              {isTyping ? (
                <span className="text-emerald-500 font-medium animate-pulse">{lang === 'ar' ? 'جاري الكتابة...' : 'typing...'}</span>
              ) : activeContact.isOnline ? (
                <span className="text-emerald-500 font-medium">{lang === 'ar' ? 'نشط الآن' : 'online'}</span>
              ) : (
                <span className="text-zinc-400">
                  {lang === 'ar' ? 'متصل مؤخراً' : 'last seen'}
                </span>
              )}

              {/* CRM Label Dropdown Selector */}
              {activeConversation && onUpdateLabel && (
                <div className="flex items-center gap-1 bg-zinc-200/50 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-full border border-zinc-200/40 dark:border-zinc-700/50">
                  <span className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{lang === 'ar' ? 'تصنيف:' : 'Label:'}</span>
                  <select
                     value={activeConversation.label || 'None'}
                     onChange={(e) => {
                       const val = e.target.value;
                       onUpdateLabel(activeConversation.id, val === 'None' ? undefined : val);
                     }}
                     className="text-[9px] md:text-[10px] font-bold bg-transparent text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                  >
                    {crmLabelsList.map((lbl) => (
                      <option key={lbl.name} value={lbl.name} className="bg-white dark:bg-zinc-900">
                        {lbl.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* AI Responder Toggle */}
              {activeConversation && onToggleAi && (
                <button
                  onClick={() => onToggleAi(activeConversation.id, !activeConversation.aiPaused)}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] md:text-[10px] font-bold transition-all shadow-xs cursor-pointer ${
                    activeConversation.aiPaused
                      ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30 hover:bg-red-100/50'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 hover:bg-emerald-100/50'
                  }`}
                  title={
                    activeConversation.aiPaused
                      ? (lang === 'ar' ? 'الرد الآلي معطل (تدخل بشري نشط). اضغط للتفعيل.' : 'AI auto-reply disabled (Human takeover active). Click to activate.')
                      : (lang === 'ar' ? 'الرد الآلي نشط. اضغط للتعطيل لبدء تدخل بشري.' : 'AI auto-reply is active. Click to pause for human takeover.')
                  }
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeConversation.aiPaused ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>
                    {activeConversation.aiPaused
                      ? (lang === 'ar' ? '🤖 الرد الآلي: متوقف' : '🤖 AI: Paused')
                      : (lang === 'ar' ? '🤖 الرد الآلي: نشط' : '🤖 AI: Active')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2 md:gap-4.5 text-zinc-500 dark:text-zinc-400">
          {activeConversation && onDeleteConversation && (
            <button 
              onClick={() => {
                const confirmDel = window.confirm(lang === 'ar' ? '⚠️ هل أنت متأكد تماماً من رغبتك في حذف هذه المحادثة بالكامل ومسح جميع رسائلها نهائياً؟' : '⚠️ Are you sure you want to delete this conversation and purge all its messages permanently?');
                if (confirmDel) {
                  onDeleteConversation(activeConversation.id);
                }
              }}
              className="p-1 hover:text-red-500 transition-colors cursor-pointer" 
              title={lang === 'ar' ? 'حذف المحادثة نهائياً' : 'Delete Chat Permanently'}
            >
              <Trash2 className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </button>
          )}
          <button 
            onClick={handleExportChat}
            className="p-1 hover:text-emerald-500 transition-colors cursor-pointer" 
            title={lang === 'ar' ? 'تصدير سجل المحادثة' : 'Export Chat Logs'}
          >
            <Download className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={() => setShowReportDrawer(!showReportDrawer)}
            className={`p-1 transition-colors cursor-pointer ${showReportDrawer ? 'text-emerald-500' : 'hover:text-emerald-500'}`} 
            title={lang === 'ar' ? 'التقرير الرقابي للمحادثة' : 'Administrative Audit Report'}
          >
            <FileText className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={handleStartCall}
            className="p-1 hover:text-emerald-500 transition-colors cursor-pointer" 
            title={lang === 'ar' ? 'بدء مكالمة صوتية تفاعلية' : 'Start interactive voice call'}
          >
            <Phone className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button className="hidden sm:block p-1 hover:text-emerald-500 transition-colors cursor-pointer" title="Search conversation messages">
            <Search className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button className="p-1 hover:text-emerald-500 transition-colors cursor-pointer" title="More settings">
            <MoreVertical className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Voice settings bar - visible when chatting with Meta AI */}
      {activeContact.id === 'meta-ai' && activeConversation && (
        <div className="bg-white dark:bg-[#1f2c34] border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-10 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newEnabled = !voiceEnabled;
                setVoiceEnabled(newEnabled);
                handleSaveVoiceSettings(newEnabled, voiceAccent, voiceName);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border transition-all cursor-pointer ${
                voiceEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/45 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${voiceEnabled ? 'animate-pulse text-emerald-500' : ''}`} />
              <span>{lang === 'ar' ? 'الرد الصوتي التلقائي' : 'Auto Voice Reply'}</span>
              <span className={`w-2 h-2 rounded-full ml-1 ${voiceEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
            </button>
            <span className="text-zinc-400 font-mono hidden sm:inline">|</span>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            {/* AI Summarize Chat Button */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={handleSummarizeChat}
                disabled={isSummarizing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {lang === 'ar' ? 'تلخيص ذكي' : 'Summarize'}
              </button>
            )}

            {/* Accent selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">{lang === 'ar' ? 'اللهجة واللغة:' : 'Accent & Lang:'}</span>
              <select
                value={voiceAccent}
                onChange={(e) => {
                  const val = e.target.value;
                  setVoiceAccent(val);
                  handleSaveVoiceSettings(voiceEnabled, val, voiceName);
                }}
                className="bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg px-2 py-1 font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="eg">🇪🇬 {lang === 'ar' ? 'العامية المصرية' : 'Egyptian Arabic'}</option>
                <option value="sa">🇸🇦 {lang === 'ar' ? 'اللهجة السعودية' : 'Saudi Arabic'}</option>
                <option value="lb">🇱🇧 {lang === 'ar' ? 'العامية اللبنانية' : 'Levantine Arabic'}</option>
                <option value="msa">🇸🇾 {lang === 'ar' ? 'العربية الفصحى' : 'Modern Standard Arabic'}</option>
                <option value="en_us">🇺🇸 {lang === 'ar' ? 'الإنجليزية (أمريكا)' : 'English (US)'}</option>
                <option value="en_uk">🇬🇧 {lang === 'ar' ? 'الإنجليزية (بريطانيا)' : 'English (UK)'}</option>
              </select>
            </div>

            {/* Voice Style selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">{lang === 'ar' ? 'شخصية الصوت:' : 'Voice Style:'}</span>
              <select
                value={voiceName}
                onChange={(e) => {
                  const val = e.target.value;
                  setVoiceName(val);
                  handleSaveVoiceSettings(voiceEnabled, voiceAccent, val);
                }}
                className="bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg px-2 py-1 font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Zephyr">✨ Zephyr ({lang === 'ar' ? 'تفاعلية ذكية' : 'Bright Female'})</option>
                <option value="Kore">🌸 Kore ({lang === 'ar' ? 'وقورة وهادئة' : 'Warm Female'})</option>
                <option value="Puck">⚡ Puck ({lang === 'ar' ? 'مبتهج وسريع' : 'Cheerful Male'})</option>
                <option value="Charon">🪐 Charon ({lang === 'ar' ? 'صوت عميق ومطمئن' : 'Calm Male'})</option>
                <option value="Fenrir">🐾 Fenrir ({lang === 'ar' ? 'مهني واحترافي' : 'Professional Male'})</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3 z-10 custom-scrollbar"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative transition-all duration-150 ${
                  msg.isInternalNote
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700/50'
                    : isMe
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-zinc-900 dark:text-[#e9edef] rounded-tr-none'
                    : 'bg-white dark:bg-[#202c33] text-zinc-800 dark:text-[#e9edef] rounded-tl-none border-none'
                }`}
              >
                {/* Image Media Message */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden border border-black/10 max-h-[250px] flex justify-center bg-zinc-950">
                    <img
                      src={msg.mediaUrl}
                      alt="Shared Media Attachment"
                      referrerPolicy="no-referrer"
                      className="max-h-[250px] object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => window.dispatchEvent(new CustomEvent('expand-image', { detail: msg.mediaUrl }))}
                    />
                  </div>
                )}

                {/* Voice Note Media Message */}
                {msg.type === 'audio' && msg.mediaUrl && (
                  <div className="flex flex-col gap-1.5 min-w-[220px]">
                    <div className="flex items-center gap-3 py-1">
                      <button
                        onClick={() => playAudio(msg.id, msg.mediaUrl || '')}
                        className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                          isMe
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        {/* Interactive Progress Line */}
                        <div className={`h-1 rounded-full w-full relative ${isMe ? 'bg-white/30' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-75 ${isMe ? 'bg-white' : 'bg-emerald-500'}`}
                            style={{ width: `${audioProgress[msg.id] || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1 text-[10px] opacity-75">
                          <span className="flex items-center gap-1 font-semibold">
                            <Volume2 className="w-3 h-3 text-emerald-500 animate-pulse" />
                            {lang === 'ar' ? 'رسالة صوتية' : 'Voice Message'}
                          </span>
                          <span>{msg.content && msg.content !== 'Voice Message' && msg.content !== 'Simulated Voice Note' ? `${Math.round(msg.content.length / 15) || 2}s` : '3s'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Render transcribed text / translation if present in content */}
                    {msg.content && msg.content !== 'Voice Message' && msg.content !== 'Simulated Voice Note' && (() => {
                      const isArabic = /[\u0600-\u06FF]/.test(msg.content);
                      return (
                        <div className="border-t border-black/5 dark:border-white/5 pt-1.5 mt-0.5">
                          <p 
                            className={`text-[12px] leading-relaxed font-normal whitespace-pre-wrap opacity-95 ${isArabic ? 'text-right' : 'text-left'}`}
                            dir={isArabic ? 'rtl' : 'ltr'}
                          >
                            {msg.content}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Text Content */}
                {msg.type === 'text' && (() => {
                  const isArabic = /[\u0600-\u06FF]/.test(msg.content);
                  return (
                    <p 
                      className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isArabic ? 'text-right' : 'text-left'}`}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    >
                      {msg.content}
                    </p>
                  );
                })()}

                {/* Timestamp & Status Icon Indicators */}
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-70">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {isMe && (
                    <span className="text-white/90">
                      {msg.status === 'sent' && <Check className="w-3.5 h-3.5" />}
                      {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5" />}
                      {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-blue-400 dark:text-blue-300" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-3 z-10 shadow-md relative">
        {/* Human Takeover Warning Banner */}
        {activeConversation?.aiPaused && (
          <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center justify-between text-[11px] md:text-xs text-red-700 dark:text-red-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>
                {lang === 'ar'
                  ? 'تم إيقاف الرد الآلي مؤقتاً لتمكين التدخل البشري والرد اليدوي.'
                  : 'AI auto-reply is paused for this conversation to allow manual human reply.'}
              </span>
            </div>
            {onToggleAi && (
              <button
                onClick={() => onToggleAi(activeConversation.id, false)}
                className="font-bold underline hover:text-red-800 dark:hover:text-red-300 cursor-pointer"
              >
                {lang === 'ar' ? 'تشغيل الرد الآلي' : 'Resume AI'}
              </button>
            )}
          </div>
        )}

        {/* Quick Canned replies panel */}
        {showQuickReplies && (
          <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 shadow-lg p-2.5 max-h-48 overflow-y-auto z-20 divide-y divide-zinc-100 dark:divide-zinc-800/50">
            <div className="px-3 pb-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center justify-between select-none">
              <span>{lang === 'ar' ? 'الردود السريعة (اختر ردّاً لتعبئته في صندوق الإدخال)' : 'Quick Replies (select one to fill the input)'}</span>
              <span>{lang === 'ar' ? 'اكتب الرمز المذكور أو انقر مباشرة' : 'Type shortcut or click directly'}</span>
            </div>
            {QUICK_REPLIES[lang].map((qr) => (
              <button
                key={qr.shortcut}
                onClick={() => {
                  setInputText(qr.text);
                  setShowQuickReplies(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 flex items-center justify-between transition-colors cursor-pointer text-sm"
              >
                <div className="flex flex-col items-start text-right">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-xs">{qr.title}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[200px] sm:max-w-md">{qr.text}</span>
                </div>
                <span className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded">
                  {qr.shortcut}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Emoji selection panel */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-6 bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700 rounded-xl p-2.5 flex gap-2 z-30">
            {EMOJIS.map((em) => (
              <button
                key={em}
                onClick={() => {
                  setInputText((t) => t + em);
                  setShowEmojiPicker(false);
                }}
                className="text-xl hover:scale-125 transition-transform cursor-pointer"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Attachment Sub Menu */}
        {showAttachMenu && (
          <div className="absolute bottom-16 left-16 bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700 rounded-xl py-1.5 w-40 z-30 flex flex-col">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageAttach}
              className="hidden"
              id="file-photo-attach"
            />
            <label
              htmlFor="file-photo-attach"
              className="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 cursor-pointer"
            >
              <Image className="w-4 h-4 text-sky-500" />
              {lang === 'ar' ? 'مشاركة صورة' : 'Share Photo'}
            </label>
          </div>
        )}

        {isRecording ? (
          /* Recording Active Bar View */
          <div className="flex items-center justify-between w-full bg-emerald-50 dark:bg-zinc-800 rounded-xl px-4 py-2.5 border border-emerald-100 dark:border-zinc-700">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              <span className="text-sm font-semibold">{t.audioRecording}</span>
              <span className="font-mono text-sm">{formatDuration(recordDuration)}</span>
            </div>

            {/* Dynamic Soundwaves Animation */}
            <div className="flex items-center gap-0.5 h-6">
              {SOUND_WAVE_BARS.map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] bg-emerald-500 dark:bg-emerald-400 rounded-full"
                  style={{
                    height: `${h}px`,
                    animation: `bounce 0.8s ease-in-out ${i * 0.05}s infinite alternate`
                  }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={stopRecording}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer shadow-sm"
              >
                {lang === 'ar' ? 'تم / إرسال' : 'Done / Send'}
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar View */
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachMenu(false);
                  setShowQuickReplies(false);
                }}
                className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                title={lang === 'ar' ? 'اختر رمز تعبيري' : 'Select emoji'}
              >
                <Smile className="w-5.5 h-5.5" />
              </button>
              <button
                onClick={() => {
                  setShowQuickReplies(!showQuickReplies);
                  setShowEmojiPicker(false);
                  setShowAttachMenu(false);
                }}
                className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                  showQuickReplies 
                    ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' 
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
                title={lang === 'ar' ? 'الردود السريعة' : 'Quick replies'}
              >
                <Zap className="w-5.5 h-5.5" />
              </button>
              <button
                onClick={() => {
                  setShowAttachMenu(!showAttachMenu);
                  setShowEmojiPicker(false);
                  setShowQuickReplies(false);
                }}
                className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                title={lang === 'ar' ? 'إرفاق ملف صورة' : 'Attach photo file'}
              >
                <Paperclip className="w-5.5 h-5.5" />
              </button>
              <button
                onClick={() => {
                  setIsInternalNote(!isInternalNote);
                  setShowAttachMenu(false);
                  setShowEmojiPicker(false);
                  setShowQuickReplies(false);
                }}
                className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                  isInternalNote 
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' 
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
                title={lang === 'ar' ? 'ملاحظة داخلية' : 'Internal Note'}
              >
                <FileText className="w-5.5 h-5.5" />
              </button>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={isInternalNote ? (lang === 'ar' ? 'اكتب ملاحظة داخلية (لن يراها العميل)...' : 'Type an internal note...') : t.messagePlaceholder}
              className={`flex-1 text-zinc-800 dark:text-zinc-200 border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors rtl:text-right ltr:text-left ${
                isInternalNote 
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 focus:border-amber-500 placeholder-amber-400' 
                  : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:bg-white'
              }`}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />

            {inputText.trim() ? (
              <button
                onClick={handleSendText}
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-full shadow-sm cursor-pointer transition-transform hover:scale-105"
                title={lang === 'ar' ? 'إرسال الرسالة' : 'Send message'}
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500 dark:hover:bg-emerald-600 text-zinc-600 dark:text-zinc-300 hover:text-white p-2.5 rounded-full cursor-pointer transition-all"
                title={lang === 'ar' ? 'تسجيل رسالة صوتية' : 'Record voice note'}
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Real-Time Call Simulation Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-zinc-950 border border-zinc-800 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
            {/* Top Bar with Status and Brand */}
            <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${callStatus === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${callStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  {callStatus === 'calling' ? 'جاري الاتصال...' : 'مكالمة نشطة (بيئة تجريبية)'}
                </span>
              </div>
              <div className="text-zinc-500 text-xs font-mono">
                {callStatus === 'active' && `00:${callDuration < 10 ? '0' : ''}${callDuration}`}
              </div>
            </div>

            {/* Profile / Avatar Center Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
              {/* Background visual light beams */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative mb-4">
                {/* Avatar with pulsing halo */}
                <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-500/20 ${isAiSpeaking ? 'animate-pulse ring-4 ring-emerald-500/30' : ''}`}>
                  WA
                </div>
                {/* Micro-indicator */}
                <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-zinc-800 p-1.5 rounded-full text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
              </div>

              <h3 className="font-bold text-lg text-white">الوكيل الذكي (WhatsApp Call Service)</h3>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <span>الصوت: {voiceName}</span>
                <span>•</span>
                <span>اللهجة: {voiceAccent.toUpperCase()}</span>
              </p>

              {/* Ticking waves */}
              {callStatus === 'active' && (
                <div className="flex items-center gap-1 h-8 my-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="w-[4px] bg-emerald-500 rounded-full"
                      style={{
                        height: isAiSpeaking ? `${Math.floor(Math.random() * 28) + 8}px` : '4px',
                        transition: 'height 0.15s ease-in-out',
                        animation: isAiSpeaking ? `bounce 0.6s ease-in-out ${i * 0.08}s infinite alternate` : 'none'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Call Transcript box (Simulating live streaming conversation) */}
              <div className="w-full bg-zinc-900/50 border border-zinc-850 rounded-xl p-3 h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2 mt-2 text-right">
                {callTranscript.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-xs max-w-[85%] ${
                      t.sender === 'user'
                        ? 'bg-emerald-600/20 text-emerald-100 mr-auto border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-200 ml-auto border border-zinc-700/50'
                    }`}
                  >
                    <span className="font-bold block mb-0.5 opacity-70 text-[10px]">
                      {t.sender === 'user' ? 'أنت (العميل)' : 'المساعد الذكي'}
                    </span>
                    <p className="leading-relaxed">{t.text}</p>
                  </div>
                ))}
                {isCallResponding && (
                  <div className="flex items-center gap-2 text-zinc-500 text-xs py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>الوكيل يستمع ويفكر...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Microphone Speech / Text Input for Call Modal */}
            {callStatus === 'active' && (
              <div className="p-3 bg-zinc-900/40 border-t border-zinc-850">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={callInputText}
                    onChange={(e) => setCallInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendCallMessage(callInputText);
                      }
                    }}
                    disabled={isCallResponding}
                    placeholder="تحدث أو اكتب شيئاً ليرد الوكيل فوراً بالصوت..."
                    className="flex-1 bg-zinc-900 text-zinc-100 text-xs border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendCallMessage(callInputText)}
                    disabled={isCallResponding || !callInputText.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    تحدث
                  </button>
                </div>
              </div>
            )}

            {/* Control Panel Action Buttons */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-850 flex items-center justify-around">
              <button
                onClick={() => setIsCallMuted(!isCallMuted)}
                className={`p-3 rounded-full transition-colors cursor-pointer ${isCallMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'}`}
                title={isCallMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
              >
                {isCallMuted ? <VolumeX className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={handleEndCall}
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-all hover:scale-105 shadow-lg shadow-red-600/30 cursor-pointer"
                title="إنهاء المكالمة"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 p-3 rounded-full cursor-pointer"
                title="مكبر الصوت"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Administrative Audit Report Drawer */}
      {showReportDrawer && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-transform duration-300 animate-slide-in" dir="rtl">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">التقرير الرقابي للمشرف</h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">خاص بنظام الإدارة [ADMIN_REPORT]</p>
              </div>
            </div>
            <button
              onClick={() => setShowReportDrawer(false)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Report Body */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
            {/* Context/Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>توجيه إداري رقابي:</strong> يتم توليد هذا التقرير تلقائياً بعد انتهاء المكالمة الصوتية التفاعلية أو عند انتهاء دورة الرسائل الصوتية، ويُرسل فقط لقناة المشرف الإداري ولا يُعرض نهائياً للمستفيد الأخير.
            </div>

            {/* Interactive Generate Button */}
            <button
              onClick={handleGenerateManualReport}
              disabled={isGeneratingReport || !activeConversation}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري توليد التقرير الرقابي من تاريخ المحادثة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تحليل وتوليد تقرير المحادثة الآن</span>
                </>
              )}
            </button>

            {currentAdminReport ? (
              <div className="flex flex-col gap-3.5">
                {/* Meta details */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
                  <span>تم التحديث: {new Date(currentAdminReport.updatedAt).toLocaleTimeString()}</span>
                  <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400">مكتمل</span>
                </div>

                {/* Styled Section Parsers */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-4 flex flex-col gap-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  
                  {/* Parsing sections manually to offer a stunning visual dashboard layout */}
                  {currentAdminReport.content.includes('ملخص المحادثة:') && (
                    <div className="border-b border-zinc-200/50 dark:border-zinc-800/40 pb-3">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1 flex items-center gap-1.5 text-xs">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        ملخص المحادثة:
                      </span>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {currentAdminReport.content.split('ملخص المحادثة:')[1]?.split('نية العميل')[0]?.trim()}
                      </p>
                    </div>
                  )}

                  {currentAdminReport.content.includes('نية العميل') && (
                    <div className="border-b border-zinc-200/50 dark:border-zinc-800/40 pb-3 flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        نية العميل (User Intent):
                      </span>
                      <span className="font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg text-[11px]">
                        {currentAdminReport.content.split('نية العميل (User Intent):')[1]?.split('الحالة المزاجية')[0]?.trim() || 
                         currentAdminReport.content.split('نية العميل:')[1]?.split('الحالة المزاجية')[0]?.trim() || 'استفسار'}
                      </span>
                    </div>
                  )}

                  {currentAdminReport.content.includes('الحالة المزاجية') && (
                    <div className="border-b border-zinc-200/50 dark:border-zinc-800/40 pb-3 flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        الحالة المزاجية (Sentiment):
                      </span>
                      <span className={`font-semibold px-2.5 py-1 rounded-lg text-[11px] ${
                        currentAdminReport.content.includes('غاضب') 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {currentAdminReport.content.split('الحالة المزاجية (Sentiment):')[1]?.split('الإجراء الذي تم اتخاذه')[0]?.trim() ||
                         currentAdminReport.content.split('الحالة المزاجية:')[1]?.split('الإجراء الذي تم اتخاذه')[0]?.trim() || 'محايد'}
                      </span>
                    </div>
                  )}

                  {currentAdminReport.content.includes('الإجراء الذي تم اتخاذه') && (
                    <div className="border-b border-zinc-200/50 dark:border-zinc-800/40 pb-3">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        الإجراء الذي تم اتخاذه (Action Taken):
                      </span>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {currentAdminReport.content.split('الإجراء الذي تم اتخاذه (Action Taken):')[1]?.split('النقاط المفتوحة')[0]?.trim() ||
                         currentAdminReport.content.split('الإجراء الذي تم اتخاذه:')[1]?.split('النقاط المفتوحة')[0]?.trim()}
                      </p>
                    </div>
                  )}

                  {currentAdminReport.content.includes('النقاط المفتوحة') && (
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                        النقاط المفتوحة / التوصيات (Recommendations):
                      </span>
                      <p className="text-zinc-600 dark:text-zinc-400 bg-rose-50/20 dark:bg-rose-950/10 p-2.5 rounded-lg border border-rose-200/20">
                        {currentAdminReport.content.split('النقاط المفتوحة / التوصيات (Pending Items / Recommendations):')[1]?.trim() ||
                         currentAdminReport.content.split('النقاط المفتوحة / التوصيات:')[1]?.trim()}
                      </p>
                    </div>
                  )}

                </div>

                {/* Raw View Toggle */}
                <details className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                  <summary className="cursor-pointer hover:text-zinc-300 select-none pb-1 font-semibold">عرض التقرير الخام (Markdown Raw Source)</summary>
                  <pre className="bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded-lg overflow-x-auto text-[10px] font-mono leading-relaxed max-h-64 select-all whitespace-pre-wrap text-right text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-850">
                    {currentAdminReport.content}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-zinc-500">
                <FileText className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-xs font-semibold">لا يوجد تقرير رقابي إداري توليدي حالياً لهذه المحادثة</p>
                <p className="text-[10px] opacity-70 mt-1 max-w-[200px]">انقر فوق الزر أعلاه لتشغيل نموذج الذكاء الاصطناعي وصياغة التقرير الإداري باللغة العربية المهنية.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Soundwaves and Custom Scrollbar Styling injection */}
      <style>{`
        @keyframes bounce {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.3); }
        }
        /* Custom scrollbar for Messages Scroll Area */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 9999px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
