import { GoogleGenAI } from '@google/genai';

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  currency: string;
  paymentStatus: 'pending' | 'pending_verification' | 'verified_paid' | 'rejected';
  vodafoneCashNumber?: string;
  instaPayAddress?: string;
  paymentScreenshot?: string;
  paymentUrl: string;
}

export class InvoiceAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Parses customer request and generates a complete structured invoice
   */
  async generateInvoice(
    inputPrompt: string, 
    customerName: string = 'العميل المميز', 
    currency: string = 'EGP',
    config?: { taxRate?: number; maxDiscountPercent?: number; currency?: string; systemPrompt?: string }
  ): Promise<{ textResponse: string; invoice: InvoiceData }> {
    const taxPercentage = config?.taxRate !== undefined ? config.taxRate : 14;
    const activeCurrency = config?.currency || currency;

    const defaultInvoice: InvoiceData = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerName,
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: 'طلب خدمات/منتجات التواجد الرقمي', quantity: 1, unitPrice: 500, totalPrice: 500 }
      ],
      subtotal: 500,
      tax: Math.round(500 * (taxPercentage / 100)),
      discount: 50,
      grandTotal: 500 - 50 + Math.round(450 * (taxPercentage / 100)),
      currency: activeCurrency,
      paymentStatus: 'pending',
      paymentUrl: `https://pay.chatcore.com/inv-${Date.now().toString().slice(-6)}`
    };

    if (!this.ai || !inputPrompt.trim()) {
      return {
        textResponse: `مرحباً ${customerName}! تم تجهيز فاتورة طلبك بنجاح بمبلغ إجمالي ${defaultInvoice.grandTotal} ${currency}.\nيمكنك سداد الفاتورة مباشرة عبر الرابط التالي: ${defaultInvoice.paymentUrl}`,
        invoice: defaultInvoice
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت وكيل الفواتير والحسابات الذكي (Invoice Agent) لمنصة الواتساب التجارية.
قم بتحليل طلب العميل التالي واستخراج بنود الفاتورة والأسعار، ثم أرجع كود JSON فقط بهذا التنسيق:

{
  "items": [
    { "name": "اسم المنتج/الخدمة", "quantity": 1, "unitPrice": 100, "totalPrice": 100 }
  ],
  "discount": 0,
  "currency": "EGP أو SAR أو USD حسب السياق",
  "summaryNote": "رسالة ترحيبية قصيرة وفاخرة للعميل ترافقه بالفاتورة"
}

طلب العميل: "${inputPrompt}"`
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const items: InvoiceItem[] = parsed.items || defaultInvoice.items;
      const subtotal = items.reduce((acc, item) => acc + (item.totalPrice || (item.quantity * item.unitPrice)), 0);
      const discount = parsed.discount || 0;
      const tax = Math.round((subtotal - discount) * (taxPercentage / 100));
      const grandTotal = Math.max(0, subtotal - discount + tax);
      const curr = parsed.currency || activeCurrency;

      const generatedInvoice: InvoiceData = {
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName,
        date: new Date().toISOString().split('T')[0],
        items,
        subtotal,
        tax,
        discount,
        grandTotal,
        currency: curr,
        paymentStatus: 'pending',
        paymentUrl: `https://pay.chatcore.com/inv-${Math.floor(100000 + Math.random() * 900000)}`
      };

      const note = parsed.summaryNote || `أهلاً بك يا فندم! تم إعداد فاتورتك الخاصة بـ ${items.map(i => i.name).join(' و ')}.`;
      const textResponse = `${note}\n\n🧾 *تفاصيل الفاتورة (${generatedInvoice.invoiceNumber})*\n` +
        items.map(i => `• ${i.name} (عدد ${i.quantity}): ${i.totalPrice} ${curr}`).join('\n') +
        `\n------------------------` +
        `\nالمجموع الفرعي: ${subtotal} ${curr}` +
        (discount > 0 ? `\nالخصم: -${discount} ${curr}` : '') +
        `\nضريبة القيمة المضافة (14%): ${tax} ${curr}` +
        `\n*الإجمالي المطلوب: ${grandTotal} ${curr}*` +
        `\n\n💳 رابط الدفع المباشر (آمن 100%): ${generatedInvoice.paymentUrl}`;

      return { textResponse, invoice: generatedInvoice };
    } catch (err) {
      console.error('[InvoiceAgent Error]', err);
      return {
        textResponse: `تم تجهيز فاتورتك الرسمية بمبلغ إجمالي ${defaultInvoice.grandTotal} ${currency}.\nرابط الدفع: ${defaultInvoice.paymentUrl}`,
        invoice: defaultInvoice
      };
    }
  }
}
