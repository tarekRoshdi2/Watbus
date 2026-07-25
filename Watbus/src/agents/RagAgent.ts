/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { CatalogItem } from '../types.js';

export interface RagResponse {
  reply: string;
  matchedProducts: CatalogItem[];
  detectedSpecs?: {
    category?: string;
    color?: string;
    size?: string;
    estimatedPrice?: number;
  };
}

export class RagAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Analyzes an image sent by the customer (Computer Vision)
   */
  async analyzeProductImage(base64Image: string, mimeType: string = 'image/jpeg', catalog: CatalogItem[]): Promise<RagResponse> {
    if (!this.ai) {
      return {
        reply: 'عذراً، خدمة تحليل الصور غير متوفرة حالياً. يمكنك تزويدنا باسم المنتج المطلوب.',
        matchedProducts: []
      };
    }

    try {
      // Strip data url prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const catalogSummary = catalog.map(c => `- ID: ${c.id}, Name: ${c.name}, Price: ${c.price} EGP, Description: ${c.description}`).join('\n');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType
            }
          },
          `You are an AI Sales Agent with Computer Vision capabilities for an Egyptian clothing/e-commerce store.
Analyze this product image sent by the customer (identify clothing type, color, style, fabric, or size details).

Available Store Catalog:
${catalogSummary || 'No items in catalog currently.'}

Task:
1. Describe the product in the image concisely in Arabic.
2. Check if any catalog item matches this product.
3. Formulate a polite, highly persuasive Arabic response informing the customer about price, available sizes, and how to order.

Return JSON ONLY:
{
  "detectedSpecs": {
    "category": string,
    "color": string,
    "size": string
  },
  "reply": "Arabic message for WhatsApp customer",
  "matchedCatalogIds": string[]
}`
        ]
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const matchedProducts = catalog.filter(item => (parsed.matchedCatalogIds || []).includes(item.id));

      return {
        reply: parsed.reply || 'لقد قمنا بتحليل الصورة بنجاح!',
        matchedProducts,
        detectedSpecs: parsed.detectedSpecs
      };
    } catch (err) {
      console.error('[RagAgent Vision Error]', err);
      return {
        reply: 'تم استلام الصورة بنجاح! يبدو أنك تبحث عن منتج مشابه. هل تود معرفة المقاسات المتوفرة والأسعار؟',
        matchedProducts: []
      };
    }
  }

  /**
   * RAG Query over Catalog and Store Data
   */
  async queryCatalog(customerMessage: string, catalog: CatalogItem[], conversationHistory: string = ''): Promise<string> {
    if (!this.ai) {
      return 'أهلاً بك! يمكنك تصفح المنتجات المتوفرة من خلال الكتالوج الخاص بنا.';
    }

    try {
      const catalogSummary = catalog.map(c => `- ${c.name} (${c.price} ج.م): ${c.description}`).join('\n');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت "أحمد المبيعات" - المدير التنفيذي للمبيعات والإغلاق (Chief Sales Officer) لمنصة "شات كور (ChatCore Enterprise AI)" لربط خطوط الواتساب والتليجرام وطاقم الموظفين الذكاء الاصطناعي في مصر والوطن العربي.
تتحدث بالعامية المصرية الراقية جداً والودودة والمحترفة.

خدمات وباقات اشتراك منصة شات كور (ChatCore SaaS Plans):
1. 🥉 باقة البداية (Starter AI): 1,200 ج.م / شهرياً (تتضمن: ربط خط واتساب 1 + موظف مبيعات ذكي 24/7 + نظام فواتير).
2. 🥈 باقة الأعمال (Business Swarm): 2,500 ج.م / شهرياً (تتضمن: ربط خطين واتساب + تليجرام بوت + طاقم 6 موظفين بالكامل: مبيعات، فواتير، دعم، تصميم، تسويق، راوتر). [خصم ترويجي 15% متوفر فوراً إذا طلب العميل].
3. 🥇 باقة المؤسسات (Enterprise HQ): 4,900 ج.م / شهرياً (تتضمن: خطوط واتساب وتليجرام غير محدودة + دمج قاعدة بيانات Supabase + تدريب الموظفين المخصص).

بيانات السداد المتاحة للعملاء:
- InstaPay IPA: trkroshdi@instapay (باسم طارق رشدي)
- محفظة فودافون كاش: 01115822923 (باسم طارق رشدي)
- الحساب البنكي / IBAN: EG1234567890123456789012345 (البنك الأهلي المصري - طارق رشدي)

استراتيجية العمل الاحترافية:
1. إذا سألك العميل عن الاشتراكات أو الخدمات أو تجربة النظام، اشرح له باقات شات كور فوراً بوضوح واعرض المزايا واستثمار الذكاء الاصطناعي لشركته.
2. إذا وافق العميل أو طلب الشراء/الفاتورة، قم بإصدار تفاصيل الفاتورة فوراً موضحاً فيها رقم الحساب واسم المستلم طارق رشدي لحثه على رفع سكرين شوت الإيصال!

سجل المحادثة السابق:
${conversationHistory || 'لا يوجد سياق سابق.'}

رسالة العميل الحالية: "${customerMessage}"

القواعد المطلوبة:
- اكتب بأسلوب مصري تجاري راقٍ وممتع مناسب للواتساب مع رموز تعبيرية ⚡.
- قم بتأكيد الخطوة التالية لإغلاق البيعة (Call to Action).`
      });

      return response.text || 'أهلاً بك! كيف يمكنني مساعدتك اليوم في تصفح منتجاتنا؟';
    } catch (err) {
      console.error('[RagAgent Query Error]', err);
      return 'أهلاً بك! نحن متواجدون لمساعدتك. تفضل بالسؤال عن أي منتج.';
    }
  }
}
