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
  private fallbackModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

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
  async processVoiceMessage(
    base64Audio: string, 
    mimeType: string = 'audio/ogg', 
    externalAiClient?: GoogleGenAI,
    geminiCaller?: (params: { model: string; contents: any; config?: any }) => Promise<any>
  ): Promise<VoiceProcessResult> {
    let cleanBase64 = base64Audio;
    if (base64Audio.includes(',')) {
      cleanBase64 = base64Audio.split(',')[1];
    }
    // Clean MIME type to remove parameters like codecs=opus which cause Gemini 400 Bad Request
    let cleanMime = mimeType.split(';')[0].trim().toLowerCase();
    if (!cleanMime || cleanMime.includes('opus') || cleanMime === 'audio/ptt') {
      cleanMime = 'audio/ogg';
    }

    const promptContent = [
      {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: cleanMime
            }
          },
          {
            text: `أنت خبير تفريغ ونطق الرسائل الصوتية بالعامية المصرية والعربية.
استمع إلى التسجيل الصوتي جيداً واكتب النص المنطوق بالكامل بدقة عالية وبدون تلخيص أو تعليقات إضافية.`
          }
        ]
      }
    ];

    // If geminiCaller helper is provided (with Multi-Key rotation & retry), use it first!
    if (geminiCaller) {
      try {
        console.log(`[VoiceAgent] Transcribing voice note via geminiCaller (with Multi-Key Rotation)...`);
        const response = await geminiCaller({
          model: 'gemini-2.0-flash',
          contents: promptContent
        });
        const rawOutput = response?.text || '';
        let transcriptionText = rawOutput.trim().replace(/^"|"$/g, '');
        if (transcriptionText && transcriptionText.length > 1 && !transcriptionText.includes('Error')) {
          console.log(`[VoiceAgent geminiCaller Success] Transcribed audio: "${transcriptionText}"`);
          return {
            transcription: transcriptionText,
            responseReply: `فهمت من رسالتك الصوتية: "${transcriptionText}".`
          };
        }
      } catch (gErr: any) {
        console.warn('[VoiceAgent geminiCaller Warning]', gErr?.message || gErr);
      }
    }

    const client = externalAiClient || this.getClient();
    if (!client) {
      console.warn('[VoiceAgent] No Gemini API key configured for audio transcription.');
      return {
        transcription: '[رسالة صوتية لم يُتمكن من فك تشفيرها]',
        responseReply: 'عذراً، لم نتمكن من معالجة الرسالة الصوتية في الوقت الحالي. هل يمكنك كتابة طلبك؟'
      };
    }

    const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-exp'];

    // Try model fallback chain
    for (const model of modelsToTry) {
      try {
        console.log(`[VoiceAgent] Transcribing voice note using model "${model}" with mime "${cleanMime}"...`);
        const response = await client.models.generateContent({
          model,
          contents: promptContent
        });

        const rawOutput = response.text || '';
        let transcriptionText = rawOutput.trim();

        if (transcriptionText.includes('{') && transcriptionText.includes('}')) {
          try {
            const cleanJson = transcriptionText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && (parsed.transcription || parsed.text)) {
              transcriptionText = (parsed.transcription || parsed.text).trim();
            }
          } catch (jsonErr) {}
        }

        // Clean markdown quotes if any
        transcriptionText = transcriptionText.replace(/^"|"$/g, '').trim();

        if (transcriptionText && transcriptionText.length > 1 && !transcriptionText.includes('Error')) {
          console.log(`[VoiceAgent Success] Model "${model}" transcribed audio: "${transcriptionText}"`);
          return {
            transcription: transcriptionText,
            responseReply: `فهمت من رسالتك الصوتية: "${transcriptionText}". جاري تنفيذ طلبك فوراً!`
          };
        }
      } catch (err: any) {
        console.warn(`[VoiceAgent Fallback] Model "${model}" failed transcribing audio:`, err?.message || err);
      }
    }

    return {
      transcription: '[رسالة صوتية]',
      responseReply: 'أهلاً بك! استلمت رسالتك الصوتية وجارِ معالجتها بواسطة المساعد الذكي.'
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
        model: 'gemini-2.0-flash',
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
