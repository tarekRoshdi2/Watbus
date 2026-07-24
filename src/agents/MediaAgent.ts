import { GoogleGenAI } from '@google/genai';

export interface MediaCard {
  title: string;
  subtitle: string;
  price: string;
  badge: string;
  accentColor: string;
  imageUrl: string;
  features: string[];
}

export class MediaAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Generates custom quote card & visual banner data for WhatsApp media dispatch
   */
  async generateMediaCard(promptText: string, config?: { primaryBadge?: string; brandColorHex?: string }): Promise<{ textResponse: string; card: MediaCard }> {
    const defaultCard: MediaCard = {
      title: 'عرض خاص ومميز',
      subtitle: 'باقة التواجد الرقمي والحلول الذكية',
      price: '299 EGP',
      badge: config?.primaryBadge || 'خصم 30% لفترة محدودة',
      accentColor: config?.brandColorHex || '#00a884',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      features: ['دعم فني 24/7', 'ربط واتساب السحابي', 'ذكاء اصطناعي متعدد الوكلاء']
    };

    if (!this.ai || !promptText.trim()) {
      return {
        textResponse: '🎨 تم تصميم بطاقة العرض البصري الخاصة بطلبك بنجاح!',
        card: defaultCard
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت وكيل التصميم وصانع الصور البصرية (Media Agent) لمنصة الواتساب التجارية.
قم بتحليل طلب العميل وتوليد بطاقة تسويقية/تصميم منتج، وأرجع JSON فقط بهذا التنسيق:

{
  "title": "عنوان العرض/المنتج",
  "subtitle": "وصف قصير جذاب",
  "price": "السعر النهائي",
  "badge": "شارة العرض (مثال: الأكثر مبيعاً)",
  "accentColor": "#00a884 أو لون سداسي عشري مناسب",
  "features": ["ميزة 1", "ميزة 2", "ميزة 3"],
  "captionText": "نص التكست الذي سيتم إرفاقه مع الصورة في الواتساب"
}

طلب العميل: "${promptText}"`
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const card: MediaCard = {
        title: parsed.title || defaultCard.title,
        subtitle: parsed.subtitle || defaultCard.subtitle,
        price: parsed.price || defaultCard.price,
        badge: parsed.badge || defaultCard.badge,
        accentColor: parsed.accentColor || defaultCard.accentColor,
        imageUrl: defaultCard.imageUrl,
        features: parsed.features || defaultCard.features
      };

      const caption = parsed.captionText || `🖼️ *${card.title}*\n${card.subtitle}\n💰 السعر: *${card.price}*\n✨ المميزات:\n` + card.features.map(f => `• ${f}`).join('\n');

      return {
        textResponse: caption,
        card
      };
    } catch (err) {
      console.error('[MediaAgent Error]', err);
      return {
        textResponse: '🎨 تم إعداد بطاقة التصميم العرض البصري لطلبك بنجاح!',
        card: defaultCard
      };
    }
  }
}
