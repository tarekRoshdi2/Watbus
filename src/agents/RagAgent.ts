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
        contents: `You are a Smart E-commerce Sales Agent (RagAgent) for a WhatsApp store in Egypt.
Answer the customer query in natural Egyptian/Arabic business tone using ONLY the following store catalog and context.

Store Catalog:
${catalogSummary || 'لا توجد منتجات مسجلة حالياً.'}

Recent Conversation History:
${conversationHistory || 'لا يوجد سياق سابق.'}

Customer Query: "${customerMessage}"

Rules:
- Be polite, helpful, and concise (ideal for WhatsApp).
- Include product names, prices in EGP, and call to action to buy.
- If item is not found, offer to assist or ask for image.`
      });

      return response.text || 'أهلاً بك! كيف يمكنني مساعدتك اليوم في تصفح منتجاتنا؟';
    } catch (err) {
      console.error('[RagAgent Query Error]', err);
      return 'أهلاً بك! نحن متواجدون لمساعدتك. تفضل بالسؤال عن أي منتج.';
    }
  }
}
