/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

export interface VoiceProcessResult {
  transcription: string;
  responseReply: string;
  voiceAudioUrl?: string;
}

export class VoiceAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Processes incoming voice message (STT using Gemini Audio capabilities)
   */
  async processVoiceMessage(base64Audio: string, mimeType: string = 'audio/ogg'): Promise<VoiceProcessResult> {
    if (!this.ai) {
      return {
        transcription: '[رسالة صوتية]',
        responseReply: 'عذراً، لم نتمكن من معالجة الرسالة الصوتية في الوقت الحالي. هل يمكنك إرسالها كتابة؟'
      };
    }

    try {
      const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType
            }
          },
          `You are an AI Audio Processing Agent.
1. Transcribe the spoken audio message accurately into Arabic script.
2. Formulate a short, polite Arabic text reply answering the customer's request.

Return JSON ONLY:
{
  "transcription": "Text transcription of the audio",
  "responseReply": "Short polite Arabic response"
}`
        ]
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        transcription: parsed.transcription || '[تم تحويل الصوت إلى نص]',
        responseReply: parsed.responseReply || 'شكراً لرسالتك الصوتية! كيف يمكننا مساعدتك أكثر؟'
      };
    } catch (err) {
      console.error('[VoiceAgent Error]', err);
      return {
        transcription: '[رسالة صوتية]',
        responseReply: 'شكراً لتواصلك معنا عبر الرسالة الصوتية! سيقوم أحد ممثلي الخدمة بالرد عليك قريباً.'
      };
    }
  }
}
