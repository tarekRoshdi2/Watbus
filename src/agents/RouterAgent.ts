/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

export type CustomerIntent = 'general_faq' | 'catalog_inquiry' | 'order_support' | 'human_handoff';

export interface RouteResult {
  intent: CustomerIntent;
  confidence: number;
  reasoning: string;
  suggestedAgent: 'router' | 'rag' | 'voice' | 'human';
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
        reasoning: 'Image attached (Computer Vision required), routing to RagAgent',
        suggestedAgent: 'rag'
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
        contents: `You are an AI Routing Agent for an e-commerce WhatsApp business.
Classify the following customer message into EXACTLY ONE of these categories:
- general_faq (greeting, policy, location, working hours)
- catalog_inquiry (product prices, stock, sizes, colors, recommendation)
- order_support (delivery status, returns, refunds, order tracking)
- human_handoff (asking for human agent, angry complaint, complex issue)

Return JSON ONLY in this format:
{
  "intent": "general_faq" | "catalog_inquiry" | "order_support" | "human_handoff",
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation"
}

Customer Message: "${messageText}"`
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      let suggestedAgent: 'router' | 'rag' | 'voice' | 'human' = 'rag';
      if (parsed.intent === 'human_handoff') {
        suggestedAgent = 'human';
      }

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
