/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

export type CustomerIntent = 
  | 'general_faq' 
  | 'catalog_inquiry' 
  | 'order_support' 
  | 'invoice_request' 
  | 'media_request' 
  | 'support_request' 
  | 'human_handoff';

export interface RouteResult {
  intent: CustomerIntent;
  confidence: number;
  reasoning: string;
  suggestedAgent: 'router' | 'rag' | 'voice' | 'human' | 'invoice' | 'media' | 'support';
}

export class RouterAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Classifies the customer message and returns routing decision
   */
  async classifyIntent(messageText: string, hasImage: boolean = false, hasAudio: boolean = false): Promise<RouteResult> {
    if (hasAudio) {
      return {
        intent: 'general_faq',
        confidence: 0.95,
        reasoning: 'Voice message received, routing to VoiceAgent',
        suggestedAgent: 'voice'
      };
    }

    if (hasImage) {
      return {
        intent: 'catalog_inquiry',
        confidence: 0.95,
        reasoning: 'Image attached, routing to RagAgent',
        suggestedAgent: 'rag'
      };
    }

    // Quick regex triggers for instant high-confidence routing
    const lower = messageText.toLowerCase();
    if (lower.includes('فاتورة') || lower.includes('فاتوره') || lower.includes('عرض سعر') || lower.includes('سعر الطلب') || lower.includes('رابط الدفع') || lower.includes('invoice')) {
      return {
        intent: 'invoice_request',
        confidence: 0.98,
        reasoning: 'Invoice keywords detected',
        suggestedAgent: 'invoice'
      };
    }
    if (lower.includes('صورة') || lower.includes('صوره') || lower.includes('تصميم') || lower.includes('ارسم') || lower.includes('صورة المنتج') || lower.includes('شكل العرض') || lower.includes('banner')) {
      return {
        intent: 'media_request',
        confidence: 0.98,
        reasoning: 'Media design keywords detected',
        suggestedAgent: 'media'
      };
    }
    if (lower.includes('مشكلة') || lower.includes('عطل') || lower.includes('تذكرة') || lower.includes('تذكره') || lower.includes('دعم فني') || lower.includes('تتبع المشكلة') || lower.includes('ticket')) {
      return {
        intent: 'support_request',
        confidence: 0.98,
        reasoning: 'Technical support keywords detected',
        suggestedAgent: 'support'
      };
    }

    if (!this.ai || !messageText.trim()) {
      return {
        intent: 'general_faq',
        confidence: 0.5,
        reasoning: 'Fallback classification',
        suggestedAgent: 'rag'
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an AI Routing Agent for an enterprise WhatsApp multi-agent system.
Classify the customer message into EXACTLY ONE category:
- general_faq (greeting, policy, location, working hours)
- catalog_inquiry (product prices, stock, sizes, colors, recommendation)
- order_support (delivery status, returns, refunds, order tracking)
- invoice_request (requesting bill, pricing breakdown, invoice PDF, payment link)
- media_request (requesting visual photo, design card, offer banner, image mockup)
- support_request (reporting technical issue, system bug, ticket creation)
- human_handoff (asking for human agent, complaint escalation)

Return JSON ONLY:
{
  "intent": "general_faq" | "catalog_inquiry" | "order_support" | "invoice_request" | "media_request" | "support_request" | "human_handoff",
  "confidence": number,
  "reasoning": "explanation"
}

Customer Message: "${messageText}"`
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      let suggestedAgent: 'router' | 'rag' | 'voice' | 'human' | 'invoice' | 'media' | 'support' = 'rag';
      if (parsed.intent === 'human_handoff') suggestedAgent = 'human';
      else if (parsed.intent === 'invoice_request') suggestedAgent = 'invoice';
      else if (parsed.intent === 'media_request') suggestedAgent = 'media';
      else if (parsed.intent === 'support_request') suggestedAgent = 'support';

      return {
        intent: parsed.intent || 'general_faq',
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'Classified by Gemini AI',
        suggestedAgent
      };
    } catch (err) {
      console.error('[RouterAgent Error]', err);
      return {
        intent: 'catalog_inquiry',
        confidence: 0.6,
        reasoning: 'Classification fallback due to error',
        suggestedAgent: 'rag'
      };
    }
  }
}
