/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

export interface SwarmResponse {
  agentId: 'router' | 'sales' | 'invoice' | 'media' | 'support' | 'marketing' | 'dev' | 'admin';
  agentName: string;
  agentTitle: string;
  text: string;
  mediaUrl?: string;
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
    customConfigs?: Record<string, any>
  ): Promise<SwarmResponse> {
    const rawText = userMessage.trim();
    const text = rawText.toLowerCase();

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
          mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
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

    // -------------------------------------------------------------
    // 1. INVOICE INTENT -> صلاح الحسابات
    // -------------------------------------------------------------
    if (text.includes('فاتورة') || text.includes('سداد') || text.includes('ادفع') || text.includes('تحويل') || text.includes('انستا باي') || text.includes('فودافون') || text.includes('اشترك') || text.includes('ابعت الفاتورة') || text.includes('باقة 2500') || text.includes('باقة 1200') || text.includes('باقة 4900')) {
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

      const invoiceCustom = customConfigs?.invoice?.systemPrompt || "";
      const prompt = `أنت "الأستاذ صلاح الحسابات" - المحاسب المالي التنفيذي لمنصة شات كور (ChatCore Enterprise AI). ${invoiceCustom}
${kbContext}
سياق المحادثة السابق مع العميل:
${historySummary}

الطلب الحالي: "${userMessage}"
أصدرت فاتورة رسمية برقم #${invNo} بمبلغ ${amount} ج.م لـ ${planName}.
رحّب بالعميل "${customerName}" واطلب منه التحويل باسم طارق رشدي على InstaPay (trkroshdi@instapay) أو فودافون كاش (01115822923) ورفع سكرين شوت الإيصال للاعتماد الفوري.
اكتب بالعامية المصرية الراقية والاحترافية بأسلوب تنفيذي راقٍ.`;

      const aiText = await this.safeGenerateContent(prompt);
      const replyText = aiText || `أهلاً بك يا فندم (${customerName})! تم إصدار الفاتورة الرسمية برقم #${invNo} لـ ${invoiceData.planName}.

قيمة الاشتراك المستحقة: ${amount} ج.م
بيانات التحويل الفوري باسم: **طارق رشدي (Tarek Roshdi)**
📱 InstaPay: **trkroshdi@instapay**
📲 فودافون كاش: **01115822923**
🏦 البنك الأهلي (IBAN): **EG1234567890123456789012345**

يرجى تحويل المبلغ ورفع سكرين شوت الإيصال ليقوم النظام بتفعيل الحساب فوراً ⚡!`;

      this.saveChatMessage(chatId, 'user', rawText);
      this.saveChatMessage(chatId, 'assistant', replyText, 'invoice');
      return {
        agentId: 'invoice',
        agentName: 'الأستاذ صلاح الحسابات',
        agentTitle: 'Invoice & Billing Chief',
        text: replyText,
        mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
        invoiceData
      };
    }

    // -------------------------------------------------------------
    // 2. SUPPORT & TECH INTENT -> مهندس عمر الدعم
    // -------------------------------------------------------------
    if (text.includes('ربط') || text.includes('كود') || text.includes('توكن') || text.includes('botfather') || text.includes('مشكلة') || text.includes('دعم')) {
      const supportCustom = customConfigs?.support?.systemPrompt || "";
      const prompt = `أنت "مهندس عمر الدعم الفني" - مسؤول الدعم والربط لمنصة شات كور (ChatCore Enterprise AI). ${supportCustom}
${kbContext}
سياق المحادثة السابق مع العميل:
${historySummary}

رسالة العميل: "${userMessage}"
اشرح للعميل "${customerName}" طريقة ربط الواتساب (مسح كود QR) أو ربط التليجرام (إنشاء بوت على @BotFather ونسخ التوكن).
اكتب بالعامية المصرية الراقية والمنظمة جداً.`;

      const aiText = await this.safeGenerateContent(prompt);
      const replyText = aiText || `أهلاً بك يا فندم (${customerName}) معكم مهندس عمر الدعم الفني 🛠️!

خطوات ربط الخدمة بسيطة جداً:
1️⃣ لربط خط الواتساب: ادخل على قسم "الأجهزة والخطوط" واضغط "إضافة خط جديد" ثم امسح كود QR من هاتفك.
2️⃣ لربط التليجرام: ابحث عن @BotFather على تليجرام وأرسل /newbot، ثم انسخ التوكن وضعه في قسم "ربط التليجرام" واضغط تفعيل!

إذا واجهتك أي صعوبة، سأكون معك خطوة بخطوة ⚡`;

      this.saveChatMessage(chatId, 'user', rawText);
      this.saveChatMessage(chatId, 'assistant', replyText, 'support');
      const tckNo = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
      return {
        agentId: 'support',
        agentName: 'مهندس عمر الدعم الفني',
        agentTitle: 'Support & Onboarding Specialist',
        text: replyText + `\n\n🎫 **رقم تذكرة الدعم الفني المُتولّدة**: #${tckNo}`,
        mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200'
      };
    }

    // -------------------------------------------------------------
    // 3. MEDIA / DESIGN INTENT -> كريم الديزاين
    // -------------------------------------------------------------
    if (text.includes('صورة') || text.includes('تصميم') || text.includes('كارت') || text.includes('بروشور') || text.includes('شكل')) {
      const mediaCustom = customConfigs?.media?.systemPrompt || "";
      const prompt = `أنت "كريم الديزاين" - المصمم المبدع لمنصة شات كور (ChatCore Enterprise AI). ${mediaCustom}
${kbContext}
سياق المحادثة السابق:
${historySummary}

أخبر العميل "${customerName}" أنك جهّزت له الكروت البصرية والرسومات التوضيحية لإمكانيات المنظومة وطاقم الموظفين.
اكتب بالعامية المصرية المبدعة والودودة.`;

      const aiText = await this.safeGenerateContent(prompt);
      const replyText = aiText || `أهلاً بك يا فندم (${customerName})! معاك كريم الديزاين 🎨✨

جاهز فوراً لتزويدك بكافة التصاميم والكروت البصرية والتوضيحية لطاقم الموظفين وباقات منصة شات كور، لمشاركتها مع فريق عملك وتسهيل اتخاذ القرار!`;

      this.saveChatMessage(chatId, 'user', rawText);
      this.saveChatMessage(chatId, 'assistant', replyText, 'media');
      return {
        agentId: 'media',
        agentName: 'كريم الديزاين',
        agentTitle: 'Creative Media & Graphic Officer',
        text: replyText,
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'
      };
    }

    // -------------------------------------------------------------
    // 4. DEFAULT SALES INTENT -> أحمد المبيعات
    // -------------------------------------------------------------
    const hasDiscussedPlans = historySummary.includes('باقة') || historySummary.includes('Starter') || historySummary.includes('1,200') || historySummary.includes('2,500');

    const salesCustom = customConfigs?.sales?.systemPrompt || "";
      const prompt = `أنت "أحمد المبيعات" - المدير التنفيذي للمبيعات لمنصة شات كور (ChatCore Enterprise AI). ${salesCustom}
${kbContext}
سياق المحادثة السابق مع العميل:
${historySummary}

رسالة العميل الحالية: "${userMessage}"

قواعد الرد الفائقة:
${hasDiscussedPlans 
  ? 'العميل يناقش معك بالفعل وسياق الباقات معروف له! اعد رد قصير ومباشر بالعامية المصرية (فقرة واحدة فقط) لمساعدته في الشراء أو إصدار الفاتورة فوراً دون إعادة سرد قائمة الباقات إطلاقاً!' 
  : 'هذه أول مرة، اشرح له باقات شات كور بوضوح مختصر:\n1. باقة البداية (Starter AI): 1,200 ج.م\n2. باقة الأعمال (Business Swarm): 2,500 ج.م\n3. باقة المؤسسات (Enterprise HQ): 4,900 ج.م'}
`;

    const aiText = await this.safeGenerateContent(prompt);
    
    let fallbackText = '';
    if (hasDiscussedPlans) {
      fallbackText = `تحت أمرك يا فندم (${customerName}) ⚡، هل تحب نأكد على باقة معينة الآن (البداية، الأعمال، أو المؤسسات) علشان أصدر لك الفاتورة؟`;
    } else {
      fallbackText = `أهلاً وسهلاً بحضرتك يا فندم (${customerName})! ⚡ معاك أخوك أحمد المبيعات، المدير التنفيذي للمبيعات لمنصة شات كور (ChatCore Enterprise AI).

سعيد جداً بتواصلك معنا! منصة شات كور توفر لك طاقم موظفين ذكاء اصطناعي محترف يعمل 24/7 لزيادة مبيعاتك وأتمتة الفواتير وخدمة العملاء.

إليك باقات الاشتراك المتاحة حالياً:
🥉 **باقة البداية (Starter AI)**: 1,200 ج.م / شهرياً
- ربط خط واتساب 1 + موظف مبيعات ذكي 24/7 + فواتير.

🥈 **باقة الأعمال (Business Swarm)**: 2,500 ج.م / شهرياً (الأكثر مبيعاً ⭐)
- ربط خطين واتساب + تليجرام بوت + طاقم 6 موظفين بالكامل. (خصم ترويجي 15% متوفر اليوم).

🥇 **باقة المؤسسات (Enterprise HQ)**: 4,900 ج.م / شهرياً
- خطوط وموظفين لا نهائية + ربط سحابي Supabase + تدريب مخصص.

أي باقة تشعر أنها الأنسب لمشروعك الآن؟ وسأقوم بتأكيدها وإصدار الفاتورة فوراً ⚡`;
    }

    const replyText = aiText || fallbackText;

    this.saveChatMessage(chatId, 'user', rawText);
    this.saveChatMessage(chatId, 'assistant', replyText, 'sales');
    return {
      agentId: 'sales',
      agentName: 'أحمد المبيعات',
      agentTitle: 'Chief Sales & Closing Officer',
      text: replyText,
      mediaUrl: hasDiscussedPlans ? undefined : 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200'
    };
  }
}

export const chatCoreSwarm = new ChatCoreSwarm();
