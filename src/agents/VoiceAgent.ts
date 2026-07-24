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
  private fallbackModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];

  constructor(customAiClient?: GoogleGenAI) {
    if (customAiClient) {
      this.ai = customAiClient;
    } else {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      }
    }
  }

  private getClient(): GoogleGenAI | null {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      }
    }
    return this.ai;
  }

  /**
   * Processes incoming voice message (STT using Gemini Audio capabilities with model fallback chain)
   */
  async processVoiceMessage(base64Audio: string, mimeType: string = 'audio/ogg', externalAiClient?: GoogleGenAI): Promise<VoiceProcessResult> {
    const client = externalAiClient || this.getClient();
    if (!client) {
      console.warn('[VoiceAgent] No Gemini API key configured for audio transcription.');
      return {
        transcription: '[رسالة صوتية لم يُتمكن من فك تشفيرها]',
        responseReply: 'عذراً، لم نتمكن من معالجة الرسالة الصوتية في الوقت الحالي. هل يمكنك كتابة طلبك؟'
      };
    }

    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '');

    // Try model fallback chain
    for (const model of this.fallbackModels) {
      try {
        console.log(`[VoiceAgent] Transcribing voice note using model "${model}"...`);
        const response = await client.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType
              }
            },
            `You are an expert Arabic Speech-to-Text (STT) AI Agent.
1. Listen carefully to the spoken voice recording.
2. Transcribe the spoken text accurately and verbatim in natural Arabic script (Egyptian/Gulf/MSA as spoken).
3. Do NOT summarize or shorten the spoken words; provide the full transcription.

Return JSON ONLY:
{
  "transcription": "الفرغ النصي الكامل والدقيق للرسالة الصوتية",
  "responseReply": "رد مختصر ولطيف بالعامية المصرية"
}`
          ]
        });

        const text = response.text || '';
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed && parsed.transcription) {
          console.log(`[VoiceAgent Success] Model "${model}" transcribed audio: "${parsed.transcription}"`);
          return {
            transcription: parsed.transcription.trim(),
            responseReply: parsed.responseReply || 'شكراً لرسالتك الصوتية! جاري مساعدتك فوراً.'
          };
        }
      } catch (err: any) {
        console.warn(`[VoiceAgent Fallback] Model "${model}" failed transcribing audio:`, err?.message || err);
      }
    }

    return {
      transcription: '[رسالة صوتية]',
      responseReply: 'شكراً لتواصلك معنا عبر الرسالة الصوتية! سيقوم أحد ممثلي الخدمة بالرد عليك قريباً.'
    };
  }

  /**
   * Synthesizes human-like voice audio (Gemini Multimodal Audio TTS capability)
   * Prebuilt voice options: 'Puck' (Male Egyptian/Arabic), 'Charon' (Deep Male), 'Kore' (Female), 'Fenrir', 'Zephyr'
   */
  async synthesizeHumanVoice(textToSpeak: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Puck', externalAiClient?: GoogleGenAI): Promise<{ audioBuffer: Buffer; mimeType: string } | null> {
    const client = externalAiClient || this.getClient();
    if (!client) return null;

    try {
      console.log(`[VoiceAgent TTS] Synthesizing human voice audio using voice "${voice}"...`);
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت موظف مبيعات وخدمة عملاء مصري متكلم بشكل إنساني طبيعي 100%. انطق الجملة التالية بصوت بشري راقي ومتصل بدون أي نبرة روبوتية: "${textToSpeak}"`,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            }
          }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            const mimeType = part.inlineData.mimeType || 'audio/mp3';
            console.log(`[VoiceAgent TTS Success] Generated ${buffer.length} bytes of human voice audio!`);
            return { audioBuffer: buffer, mimeType };
          }
        }
      }
    } catch (err: any) {
      console.error('[VoiceAgent TTS Error] Failed synthesizing human voice:', err?.message || err);
    }
    return null;
  }
}

export const voiceAgent = new VoiceAgent();
