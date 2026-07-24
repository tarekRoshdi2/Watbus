import { GoogleGenAI } from '@google/genai';

export interface SupportTicketData {
  ticketId: string;
  category: 'technical' | 'billing' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  summary: string;
  suggestedSolution?: string;
}

export class SupportAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Analyzes customer issue and formats ticket / technical resolution
   */
  async handleSupportQuery(problemText: string, config?: { ticketPrefix?: string }): Promise<{ textResponse: string; ticket: SupportTicketData }> {
    const prefix = config?.ticketPrefix || 'TCK';
    const defaultTicket: SupportTicketData = {
      ticketId: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'technical',
      priority: 'medium',
      summary: problemText,
      suggestedSolution: 'سيقوم الفريق التقني بمراجعة السجلات البرمجية وموافاتك بالحل خلال 15 دقيقة.'
    };

    if (!this.ai || !problemText.trim()) {
      return {
        textResponse: `🛠️ أهلاً بك! تم تسليم طلب الدعم الفني ورقم التذكرة الخاص بك هو: *${defaultTicket.ticketId}*.\n${defaultTicket.suggestedSolution}`,
        ticket: defaultTicket
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت وكيل الدعم الفني ومسؤول التذاكر الذكي (Support Agent) لمنصة الواتساب.
قم بتحليل بلاغ أو المشكلة التقنية للعميل وأرجع JSON فقط:

{
  "category": "technical" | "billing" | "account" | "general",
  "priority": "low" | "medium" | "high" | "urgent",
  "summary": "ملخص المشكلة في سطر واحد",
  "immediateSolution": "خطوة سريعة يجربها العميل الآن",
  "ticketNote": "رسالة احترافية طمأنينة للعميل"
}

مشكلة العميل: "${problemText}"`
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const ticket: SupportTicketData = {
        ticketId: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
        category: parsed.category || 'technical',
        priority: parsed.priority || 'medium',
        summary: parsed.summary || problemText,
        suggestedSolution: parsed.immediateSolution
      };

      const reply = `🛠️ *فريق الدعم الفني الذكي*\n\n` +
        `أهلاً بك! تم تسجيل بلاغك وتم إنشاء التذكرة رقم: *${ticket.ticketId}*\n` +
        `• التصنيف: ${ticket.category}\n` +
        `• الأولوية: ${ticket.priority}\n\n` +
        (parsed.immediateSolution ? `💡 *حل مقترح سريع:* ${parsed.immediateSolution}\n\n` : '') +
        (parsed.ticketNote || 'يقوم مهندس الدعم الفني بمتابعة السيرفرات وسنوافيك بالرد فور الانتهاء.');

      return { textResponse: reply, ticket };
    } catch (err) {
      console.error('[SupportAgent Error]', err);
      return {
        textResponse: `🛠️ تم فتح تذكرة دعم فني جديدة رقم *${defaultTicket.ticketId}*. سيقوم المهندس المسؤول بمراجعتها فوراً.`,
        ticket: defaultTicket
      };
    }
  }
}
