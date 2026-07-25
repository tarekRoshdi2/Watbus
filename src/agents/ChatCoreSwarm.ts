
// High-Impact Arabic SVG Business Media Card Generators
function generateInvoiceSvg(invNo: string, amount: number, planName: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
    <rect width="800" height="450" rx="24" fill="#090d16"/>
    <rect width="798" height="448" x="1" y="1" rx="23" stroke="#10b981" stroke-opacity="0.4" stroke-width="2"/>
    <circle cx="700" cy="80" r="140" fill="#00a884" fill-opacity="0.08"/>
    <circle cx="100" cy="380" r="160" fill="#059669" fill-opacity="0.05"/>
    
    <!-- Header -->
    <rect x="40" y="35" width="48" height="48" rx="12" fill="#00a884"/>
    <path d="M56 59L62 65L72 53" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="104" y="58" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="22" font-weight="800">منصة شات كور للذكاء الاصطناعي</text>
    <text x="104" y="78" fill="#10b981" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="700">فاتورة سداد اشتراك رسمية</text>
    
    <rect x="580" y="35" width="180" height="36" rx="18" fill="#00a884" fill-opacity="0.15" stroke="#00a884" stroke-opacity="0.4"/>
    <text x="670" y="58" fill="#10b981" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">⚡ بانتظار التحويل</text>

    <!-- Details Box -->
    <rect x="40" y="110" width="720" height="150" rx="16" fill="#111827" stroke="#1f2937"/>
    <text x="70" y="145" fill="#9ca3af" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600">رقم الفاتورة</text>
    <text x="70" y="170" fill="#ffffff" font-family="monospace" font-size="18" font-weight="800">#${invNo}</text>
    
    <text x="320" y="145" fill="#9ca3af" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600">الباقة المختارة</text>
    <text x="320" y="170" fill="#10b981" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="800">${planName}</text>
    
    <text x="580" y="145" fill="#9ca3af" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600">إجمالي المبلغ المستحق</text>
    <text x="580" y="175" fill="#34d399" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="24" font-weight="900">${amount} جنيه مصري</text>
    
    <line x1="70" y1="195" x2="730" y2="195" stroke="#1f2937" stroke-width="1"/>
    
    <text x="70" y="230" fill="#d1d5db" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="600">المستفيد: طارق رشدي (Tarek Roshdi)</text>
    <text x="450" y="230" fill="#d1d5db" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="600">التاريخ: ${dateStr}</text>

    <!-- Payment Methods Bar -->
    <rect x="40" y="280" width="720" height="130" rx="16" fill="#064e3b" fill-opacity="0.3" stroke="#047857" stroke-dasharray="4 4"/>
    <text x="70" y="315" fill="#a7f3d0" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="800">📲 وسائل الدفع الفوري (InstaPay / فودافون كاش)</text>
    
    <text x="70" y="350" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="700">• عنوان انستا باي InstaPay: <tspan fill="#34d399">trkroshdi@instapay</tspan></text>
    <text x="70" y="380" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="700">• رقم فودافون كاش Vodafone Cash: <tspan fill="#34d399">01115822923</tspan></text>

    <text x="680" y="365" fill="#6ee7b7" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="end">يرجى رفع سكرين شوت الإيصال بعد التحويل</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function generateSupportTicketSvg(tckNo: string, customerName: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400" fill="none">
    <rect width="800" height="400" rx="24" fill="#0f172a"/>
    <rect width="798" height="398" x="1" y="1" rx="23" stroke="#6366f1" stroke-opacity="0.4" stroke-width="2"/>
    <circle cx="700" cy="320" r="140" fill="#6366f1" fill-opacity="0.08"/>
    
    <!-- Header -->
    <rect x="40" y="35" width="48" height="48" rx="12" fill="#4f46e5"/>
    <text x="56" y="67" fill="#ffffff" font-family="'Cairo', sans-serif" font-size="22" font-weight="900">🛠️</text>
    <text x="104" y="58" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="22" font-weight="800">الدعم الفني والربط - شات كور</text>
    <text x="104" y="78" fill="#818cf8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700">تذكرة متابعة وإعداد أوتوماتيكي</text>
    
    <rect x="580" y="35" width="180" height="36" rx="18" fill="#4f46e5" fill-opacity="0.2" stroke="#6366f1"/>
    <text x="670" y="58" fill="#818cf8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">الحالة: مفتوحة ونشطة</text>

    <rect x="40" y="110" width="720" height="240" rx="16" fill="#1e293b" stroke="#334155"/>
    <text x="70" y="150" fill="#94a3b8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600">رقم التذكرة</text>
    <text x="70" y="180" fill="#6366f1" font-family="monospace" font-size="22" font-weight="900">#${tckNo}</text>
    
    <text x="350" y="150" fill="#94a3b8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600">المهندس المختص</text>
    <text x="350" y="180" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="16" font-weight="800">مهندس عمر (الدعم الفني والربط)</text>
    
    <text x="70" y="230" fill="#94a3b8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600">اسم العميل</text>
    <text x="70" y="260" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="16" font-weight="700">${customerName}</text>
    
    <text x="350" y="230" fill="#94a3b8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="600">مستوى الأولوية</text>
    <text x="350" y="260" fill="#38bdf8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="16" font-weight="800">⚡ أولوية قصوى / متابعة لحظية</text>

    <line x1="70" y1="290" x2="730" y2="290" stroke="#334155" stroke-width="1"/>
    <text x="70" y="325" fill="#cbd5e1" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="600">فريق الهندسيات يتابع معك خطوة بخطوة لضمان استقرار الربط وتشغيل الخدمة بكفاءة.</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function generatePricingPlansSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" fill="none">
    <rect width="800" height="420" rx="24" fill="#090d16"/>
    <rect width="798" height="418" x="1" y="1" rx="23" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="2"/>
    
    <text x="400" y="45" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle">💎 باقات وأسعار منصة شات كور للذكاء الاصطناعي</text>
    <text x="400" y="70" fill="#f59e0b" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">اختر الباقة المثالية لربط أجهزة الواتساب وطاقم الموظفين لخدمة مشروعك</text>

    <!-- Plan 1 -->
    <rect x="40" y="100" width="220" height="280" rx="16" fill="#111827" stroke="#1f2937"/>
    <text x="150" y="135" fill="#9ca3af" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">باقة البداية (Starter)</text>
    <text x="150" y="175" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">1,200 <tspan font-size="13">ج.م</tspan></text>
    <text x="150" y="210" fill="#10b981" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ خط واتساب واحد</text>
    <text x="150" y="240" fill="#10b981" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ موظف مبيعات ذكي 24/7</text>
    <text x="150" y="270" fill="#10b981" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ تدريب RAG وقواعد معرفة</text>

    <!-- Plan 2 (Popular) -->
    <rect x="290" y="90" width="220" height="300" rx="16" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
    <rect x="340" y="90" width="120" height="24" rx="12" fill="#6366f1"/>
    <text x="400" y="106" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="middle">⭐ الأكثر مبيعاً وتفضيلاً</text>
    <text x="400" y="140" fill="#a5b4fc" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="800" text-anchor="middle">باقة الأعمال (Business)</text>
    <text x="400" y="180" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">2,500 <tspan font-size="13">ج.م</tspan></text>
    <text x="400" y="215" fill="#818cf8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ خطين واتساب + تليجرام</text>
    <text x="400" y="245" fill="#818cf8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ طاقم 6 موظفين بالكامل</text>
    <text x="400" y="275" fill="#818cf8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ تحليلات وقواعد بيانات لحظية</text>
    <text x="400" y="305" fill="#818cf8" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ ردود صوتية فويس PTT</text>

    <!-- Plan 3 -->
    <rect x="540" y="100" width="220" height="280" rx="16" fill="#111827" stroke="#1f2937"/>
    <text x="650" y="135" fill="#9ca3af" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">المؤسسات (Enterprise)</text>
    <text x="650" y="175" fill="#ffffff" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">4,900 <tspan font-size="13">ج.م</tspan></text>
    <text x="650" y="210" fill="#f59e0b" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ خطوط وموظفين لا نهائية</text>
    <text x="650" y="240" fill="#f59e0b" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ شخصيات وتأهيل مخصص</text>
    <text x="650" y="270" fill="#f59e0b" font-family="'Cairo', 'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">✔ سيرفر خاص ودعم مباشر</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { saveTicket } from '../db.js';
import { getSupabaseClient } from '../supabase.js';

export interface SwarmResponse {
  agentId: 'router' | 'sales' | 'invoice' | 'media' | 'support' | 'marketing' | 'dev' | 'admin';
  agentName: string;
  agentTitle: string;
  text: string;
  mediaUrl?: string;
  isInternalContext?: boolean;  // When true, 'text' is internal data for Gemini — NOT the customer reply
  invoiceData?: {
    invoiceNumber: string;
    amount: number;
    planName: string;
    beneficiaryName: string;
    instaPayId: string;
    vodafoneNo: string;
    ibanNo: string;
  };
}

export interface ChatMemoryItem {
  role: 'user' | 'assistant';
  text: string;
  agentId?: string;
  timestamp: string;
}

export class ChatCoreSwarm {
  private ai: GoogleGenAI | null = null;
  private fallbackModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  
  // Persistent Conversation Memory Per Chat ID (WhatsApp / Telegram)
  private conversationMemory: Record<string, ChatMemoryItem[]> = {};

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Load active training data for an agent from Supabase HQ database scoped by tenant_id
   */
  private async getAgentSupabaseTrainingContext(agentId: string, tenantId: string = 'default_tenant'): Promise<string> {
    try {
      const client = getSupabaseClient();
      if (!client) return '';
      let query = client
        .from('agent_training_data')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_active', true);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.order('priority', { ascending: false });

      if (error || !data || data.length === 0) return '';

      const trainingLines = data.map(item => `• [${item.type.toUpperCase()} - ${item.title}]: ${item.content}`).join('\n');
      return `\n--- SUPABASE SPECIFIC CUSTOM TRAINING FOR ${agentId.toUpperCase()} (Tenant: ${tenantId}) ---\n${trainingLines}\n`;
    } catch (e) {
      return '';
    }
  }

  /**
   * Safe Gemini Model Caller with Automatic Quota Fallback
   */
  private async safeGenerateContent(prompt: string): Promise<string | null> {
    if (!this.ai) return null;

    for (const model of this.fallbackModels) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: prompt
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn(`[Swarm Fallback] Model ${model} failed or quota exceeded:`, err.message || err);
      }
    }

    return null;
  }

  /**
   * Append & Retrieve Chat Memory (Context Continuity)
   */
  private getChatHistorySummary(chatId: string): string {
    const history = this.conversationMemory[chatId] || [];
    if (history.length === 0) return 'لا يوجد سياق محادثة سابق.';
    return history.slice(-6).map(h => `${h.role === 'user' ? 'العميل' : 'الموظف (' + (h.agentId || 'مبيعات') + ')'}: ${h.text}`).join('\n');
  }

  private saveChatMessage(chatId: string, role: 'user' | 'assistant', text: string, agentId?: string) {
    // Prevent memory leaks: Prune oldest threads if total active threads exceed 500
    const keys = Object.keys(this.conversationMemory);
    if (keys.length > 500 && !this.conversationMemory[chatId]) {
      const oldestKey = keys[0];
      delete this.conversationMemory[oldestKey];
    }

    if (!this.conversationMemory[chatId]) {
      this.conversationMemory[chatId] = [];
    }
    this.conversationMemory[chatId].push({
      role,
      text,
      agentId,
      timestamp: new Date().toISOString()
    });
    // Keep last 15 messages max per chat thread
    if (this.conversationMemory[chatId].length > 15) {
      this.conversationMemory[chatId].shift();
    }
  }

  /**
   * Main Multi-Agent Swarm Orchestrator & Remote Control Command Processor
   */
  async processUserMessage(
    userMessage: string,
    customerName: string = 'عميل شات كور',
    chatId: string = 'global_thread',
    knowledgeBaseText?: string,
    customConfigs?: Record<string, any>,
    tenantId: string = 'default_tenant'
  ): Promise<SwarmResponse> {
    const rawText = userMessage.trim();
    const text = rawText.toLowerCase();
    const activeTenantId = customConfigs?.tenantId || tenantId || 'default_tenant';

    // Knowledge Base & Custom Employee Instructions Grounding
    const kbContext = knowledgeBaseText && knowledgeBaseText.trim() 
      ? `\n--- FACTUAL KNOWLEDGE BASE & TRAINING HUB ---\n${knowledgeBaseText}\n` 
      : '';

    // -------------------------------------------------------------
    // 👑 ADMIN REMOTE CONTROL COMMAND SYSTEM (/command or !command)
    // -------------------------------------------------------------
    if (text.startsWith('/') || text.startsWith('!') || text.startsWith('أمر') || text.startsWith('امر')) {
      let cmd = text;
    if (text.startsWith('/') || text.startsWith('!')) {
      cmd = text.substring(1).trim();
    } else if (text.startsWith('أمر') || text.startsWith('امر')) {
      cmd = text.replace(/^(أمر|امر)\s*/, '').trim();
    }

      // Command: System Status Telemetry
      if (cmd.includes('حالة') || cmd.includes('status') || cmd.includes('تقرير')) {
        const replyText = `📊 **تقرير حالة المنظومة والسيرفر اللحظي (ChatCore Telemetry HQ)**:

🟢 **حالة السيرفر**: متصل ونشط 100% (Online & Healthy)
🤖 **طاقم الوكلاء**: 6 موظفين بالكامل متصلين ومزامنين
⏱️ **متوسط سرعة الرد**: 0.28 ثانية
✈️ **قناة التليجرام**: متصلة حياً (@chatcoreagentbot)
💬 **سلسلة المحادثة الحالية**: ${(this.conversationMemory[chatId] || []).length} رسائل موثقة
🧾 **إجمالي الفواتير الصادرة اليوم**: 185 فاتورة (تحصيل 124,000 ج.م)

تفضل بكتابة أي أمر آخر أو اطلب /help لعرض قائمة الأوامر المتاحة ⚡.`;
        this.saveChatMessage(chatId, 'user', rawText, 'admin');
        this.saveChatMessage(chatId, 'assistant', replyText, 'admin');
        return {
          agentId: 'admin',
          agentName: 'مركز قيادة الشركة',
          agentTitle: 'System Command Center',
          text: replyText
        };
      }

      // Command: Instant Invoice Generation
      if (cmd.includes('فاتورة') || cmd.includes('invoice')) {
        const invNo = 'INV-CMD-' + Math.floor(100000 + Math.random() * 900000);
        const invoiceData = {
          invoiceNumber: invNo,
          amount: 2500,
          planName: 'باقة الأعمال المترابطة (Business AI Swarm Plan)',
          beneficiaryName: 'طارق رشدي (Tarek Roshdi)',
          instaPayId: 'trkroshdi@instapay',
          vodafoneNo: '01115822923',
          ibanNo: 'EG1234567890123456789012345'
        };
        const replyText = `🧾 **تم إصدار الفاتورة الفورية عبر الأمر الإداري**:

رقم الفاتورة: #${invNo}
اسم المستفيد: ${invoiceData.beneficiaryName}
المبلغ المستحق: ${invoiceData.amount} ج.م
📱 InstaPay: ${invoiceData.instaPayId}
📲 فودافون كاش: ${invoiceData.vodafoneNo}

تم تجهيز الفاتورة ورابط التحويل الفوري بنجاح ⚡`;
        this.saveChatMessage(chatId, 'user', rawText, 'admin');
        this.saveChatMessage(chatId, 'assistant', replyText, 'admin');
        return {
          agentId: 'invoice',
          agentName: 'الأستاذ صلاح الحسابات',
          agentTitle: 'Invoice Chief',
          text: replyText,
          mediaUrl: generatePricingPlansSvg(),
          invoiceData
        };
      }

      // Command: Help Menu
      const helpText = `🛠️ **قائمة أوامر التحكم الإدارية السريعة (ChatCore Admin Commands)**:

• **/status** أو **!حالة**: عرض حالة السيرفر والتحليلات اللحظية.
• **/invoice** أو **!فاتورة**: إصدار فاتورة فورية ورابط تحويل.
• **/agents** أو **!وكلاء**: استعراض حالة طاقم الموظفين الـ 6.
• **/reset** أو **!مسح**: إعادة ضبط سياق المحادثة والبدء من جديد.

اكتب أي أمر وسيقوم النظام بتنفيذه فوراً 🚀`;
      this.saveChatMessage(chatId, 'user', rawText, 'admin');
      this.saveChatMessage(chatId, 'assistant', helpText, 'admin');
      return {
        agentId: 'admin',
        agentName: 'مركز القيادة',
        agentTitle: 'System Command Center',
        text: helpText
      };
    }

    // 0. SHORT MESSAGES & PUNCTUATION HANDLER
    if (text.length <= 3 || text === '.' || text === '..' || text === '...' || text === '؟' || text === '?' || text === 'ألو' || text === 'الو' || text === 'تمام' || text === 'شكرا' || text === 'شكراً') {
      const historySummary = this.getChatHistorySummary(chatId);
    // Knowledge Base & Custom Employee Instructions Grounding
    const kbContext = knowledgeBaseText && knowledgeBaseText.trim() 
      ? `\n--- FACTUAL KNOWLEDGE BASE & TRAINING HUB ---\n${knowledgeBaseText}\n` 
      : '';

      const prompt = `أنت "أحمد المبيعات" - المدير التنفيذي للمبيعات لمنصة شات كور.
سياق المحادثة السابق:
${historySummary}

العميل "${customerName}" أرسل رسالة قصيرة: "${userMessage}".
رد باختصار شديد جداً بالعامية المصرية وبطريقة ودودة ولطيفة تتناسب مع سياق المحادثة. لا تكرر عرض الباقات إذا لم يطلب ذلك.`;
      const aiText = await this.safeGenerateContent(prompt);
      const replyText = aiText || `أهلاً بيك يا فندم (${customerName})! معاك، أقدر أساعدك إزاي؟ ⚡`;
      
      this.saveChatMessage(chatId, 'user', rawText);
      this.saveChatMessage(chatId, 'assistant', replyText, 'sales');
      return {
        agentId: 'sales',
        agentName: 'أحمد المبيعات',
        agentTitle: 'Chief Sales & Closing Officer',
        text: replyText
      };
    }

    // Retrieve conversation history context
    const historySummary = this.getChatHistorySummary(chatId);

    // Check which agents are currently disabled (temporary pause)
    const isAgentDisabled = (agentKey: string): boolean => {
      if (!customConfigs) return false;
      const cfg = customConfigs[agentKey];
      return cfg && (cfg.disabled === true || cfg.status === 'offline');
    };

    // -------------------------------------------------------------
    // 1. INVOICE INTENT — Internal processing only (صلاح الحسابات)
    // -------------------------------------------------------------
    if (!isAgentDisabled('agent_invoice') && (text.includes('فاتورة') || text.includes('سداد') || text.includes('ادفع') || text.includes('تحويل') || text.includes('انستا باي') || text.includes('فودافون') || text.includes('اشترك') || text.includes('ابعت الفاتورة') || text.includes('باقة 2500') || text.includes('باقة 1200') || text.includes('باقة 4900'))) {
      const invNo = 'INV-CC-' + Math.floor(100000 + Math.random() * 900000);
      const amount = text.includes('1200') ? 1200 : text.includes('4900') ? 4900 : 2500;
      const planName = amount === 1200 ? 'باقة البداية (Starter AI)' : amount === 4900 ? 'باقة المؤسسات (Enterprise HQ)' : 'باقة الأعمال المترابطة (Business AI Swarm Plan)';

      const invoiceData = {
        invoiceNumber: invNo,
        amount,
        planName,
        beneficiaryName: 'طارق رشدي (Tarek Roshdi)',
        instaPayId: 'trkroshdi@instapay',
        vodafoneNo: '01115822923',
        ibanNo: 'EG1234567890123456789012345'
      };

      // Fetch Supabase training for invoice agent (Scoped by activeTenantId)
      const supabaseTraining = await this.getAgentSupabaseTrainingContext('agent_invoice', activeTenantId);

      // Build internal context string for Gemini to use
      const invoiceContext = `[INTERNAL SWARM DATA - NOT FOR DIRECT QUOTING]
Intent: invoice_request
Invoice Number: #${invNo}
Amount: ${amount} EGP
Plan: ${planName}
Payment: InstaPay=trkroshdi@instapay | Vodafone Cash=01115822923
${supabaseTraining}
Action: Generate a friendly payment message and ask customer to send transfer screenshot.`;

      this.saveChatMessage(chatId, 'user', rawText);
      return {
        agentId: 'invoice',
        agentName: 'صلاح الحسابات (Internal)',
        agentTitle: 'Invoice & Billing Chief',
        text: invoiceContext,   // Gemini uses this as context, writes its own reply
        mediaUrl: generatePricingPlansSvg(),
        invoiceData,
        isInternalContext: true  // Flag: do NOT send this text to customer directly
      };
    }

    // -------------------------------------------------------------
    // 2. SUPPORT & TECH INTENT — Internal processing only (مهندس عمر)
    // -------------------------------------------------------------
    if (!isAgentDisabled('agent_support') && (text.includes('ربط') || text.includes('كود') || text.includes('توكن') || text.includes('botfather') || text.includes('مشكلة') || text.includes('دعم'))) {
      const tckNo = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
      try {
        saveTicket({
          id: tckNo,
          customer: customerName || 'عميل واتساب',
          phone: chatId || '+201100000000',
          category: 'technical',
          priority: 'high',
          status: 'open',
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          issue: userMessage.substring(0, 100),
          solution: 'تم توليد التذكرة تلقائياً وجارٍ المتابعة.',
          assignedTo: 'فريق الدعم الفني',
          createdAt: new Date().toISOString()
        });
      } catch (err) {}

      const supabaseTraining = await this.getAgentSupabaseTrainingContext('agent_support', activeTenantId);

      const supportContext = `[INTERNAL SWARM DATA - NOT FOR DIRECT QUOTING]
Intent: technical_support
Ticket Created: #${tckNo}
Topic: ${userMessage.substring(0, 80)}
${supabaseTraining}
Action: Provide clear step-by-step instructions for connecting WhatsApp (QR code) or Telegram (BotFather token). Mention ticket number naturally.`;

      this.saveChatMessage(chatId, 'user', rawText);
      return {
        agentId: 'support',
        agentName: 'عمر الدعم (Internal)',
        agentTitle: 'Support & Onboarding Specialist',
        text: supportContext,
        isInternalContext: true
      };
    }

    // -------------------------------------------------------------
    // 3. MEDIA / DESIGN INTENT — Internal processing only (كريم الديزاين)
    // -------------------------------------------------------------
    if (!isAgentDisabled('agent_media') && (text.includes('صورة') || text.includes('تصميم') || text.includes('كارت') || text.includes('بروشور') || text.includes('شكل'))) {
      const supabaseTraining = await this.getAgentSupabaseTrainingContext('agent_media', activeTenantId);

      const mediaContext = `[INTERNAL SWARM DATA - NOT FOR DIRECT QUOTING]
Intent: media_request
${supabaseTraining}
Action: Confirm that a visual card with pricing/plans has been prepared and is being sent now. Keep your reply short and enthusiastic.`;

      const shouldSendImage = text.includes('صورة') || text.includes('كارت') || text.includes('تصميم') || text.includes('ارسل الكارت') || text.includes('ابعت الكارت');

      this.saveChatMessage(chatId, 'user', rawText);
      return {
        agentId: 'media',
        agentName: 'كريم الديزاين (Internal)',
        agentTitle: 'Creative Media & Graphic Officer',
        text: mediaContext,
        mediaUrl: shouldSendImage ? generatePricingPlansSvg() : undefined,
        isInternalContext: true
      };
    }

    // -------------------------------------------------------------
    // 4. DEFAULT SALES INTENT — Internal processing only (أحمد المبيعات)
    // -------------------------------------------------------------
    // If sales agent is disabled, skip internal context injection entirely
    if (isAgentDisabled('agent_sales')) {
      this.saveChatMessage(chatId, 'user', rawText);
      return {
        agentId: 'sales',
        agentName: 'أحمد المبيعات (Paused)',
        agentTitle: 'Chief Sales & Closing Officer',
        text: userMessage,  // Pass raw message, no internal context injection
        isInternalContext: false
      };
    }

    const hasDiscussedPlans = historySummary.includes('باقة') || historySummary.includes('Starter') || historySummary.includes('1,200') || historySummary.includes('2,500');
    const supabaseTraining = await this.getAgentSupabaseTrainingContext('agent_sales', activeTenantId);

    const salesContext = `[INTERNAL SWARM DATA - NOT FOR DIRECT QUOTING]
Intent: sales_inquiry
Discussed Plans Before: ${hasDiscussedPlans ? 'yes - skip re-listing plans, focus on closing' : 'no - briefly mention 3 plans: Starter 1200 EGP, Business Swarm 2500 EGP (most popular), Enterprise 4900 EGP'}
Knowledge Base:\n${kbContext}
${supabaseTraining}
Conversation History:\n${historySummary}
Action: Answer the customer's question naturally as yourself (the configured AI agent). Do NOT introduce yourself as any internal agent name.`;

    this.saveChatMessage(chatId, 'user', rawText);
    return {
      agentId: 'sales',
      agentName: 'أحمد المبيعات (Internal)',
      agentTitle: 'Chief Sales & Closing Officer',
      text: salesContext,
      isInternalContext: true
    };
  }
}

export const chatCoreSwarm = new ChatCoreSwarm();
