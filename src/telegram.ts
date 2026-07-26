import TelegramBot from 'node-telegram-bot-api';
import { readDb, writeDb } from './db.js';
import { chatCoreSwarm } from './agents/ChatCoreSwarm.js';

let bot: TelegramBot | null = null;
let currentToken: string | null = null;

export async function initTelegramBot() {
  try {
    const db = await readDb();
    const settings = db.paymentSettings;
    if (!settings || !settings.telegramBotEnabled || !settings.telegramBotToken) {
      console.log('[Telegram] Bot is disabled or token is missing in settings.');
      if (bot) {
        bot.stopPolling();
        bot = null;
        currentToken = null;
      }
      return;
    }

    const token = settings.telegramBotToken;
    if (bot && currentToken === token) {
      // Already running with the same token
      return;
    }

    if (bot) {
      bot.stopPolling();
    }

    console.log(`[Telegram] Starting bot with token: ${token.substring(0, 5)}...`);
    bot = new TelegramBot(token, { polling: true });
    currentToken = token;

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id.toString();
      const text = msg.text || '';
      const customerName = msg.from?.first_name || 'عميل تليجرام';

      if (!text) return;

      console.log(`[Telegram] Received message from ${customerName} (${chatId}): ${text}`);
      
      try {
        const response = await chatCoreSwarm.processUserMessage(text, customerName, chatId);
        
        if (response.mediaUrl) {
          await bot!.sendPhoto(chatId, response.mediaUrl, { caption: response.text });
        } else {
          try {
            await bot!.sendMessage(chatId, response.text, { parse_mode: 'Markdown' });
          } catch (mErr) {
            // Fallback to plain text if Telegram Markdown parsing fails
            await bot!.sendMessage(chatId, response.text);
          }
        }
      } catch (err: any) {
        console.error('[Telegram] Error processing message:', err);
        await bot!.sendMessage(chatId, 'عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة لاحقاً.').catch(() => {});
      }
    });

    bot.on('polling_error', (error) => {
      const code = (error as any)?.code;
      if (code === 'ETELEGRAM' || (error as any)?.message?.includes('409 Conflict')) {
        // Suppress continuous polling conflict errors
        return;
      }
      console.error(`[Telegram] Polling warning: ${code || 'Error'} - ${error.message}`);
    });

    console.log('[Telegram] Bot started successfully and is polling for messages.');
  } catch (err) {
    console.error('[Telegram] Failed to initialize bot:', err);
  }
}

export async function testTelegramBot(token: string) {
  try {
    const testBot = new TelegramBot(token, { polling: false });
    const me = await testBot.getMe();
    return me;
  } catch (err) {
    throw err;
  }
}
