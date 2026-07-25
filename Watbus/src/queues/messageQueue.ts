import { PgBoss } from 'pg-boss';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

export let boss: PgBoss | null = null;

export async function initializeQueues() {
  if (!dbUrl) {
    console.warn('[Queues] DATABASE_URL not found. pg-boss disabled.');
    return;
  }
  
  try {
    // Initialize pg-boss with max: 2 connection pool size for Supabase session mode compatibility
    boss = new PgBoss({
      connectionString: dbUrl,
      max: 2,
      ssl: { rejectUnauthorized: false }
    });
    
    boss.on('error', error => {
      const msg = error?.message || String(error);
      if (
        msg.includes('ENOTFOUND') || 
        msg.includes('timeout') || 
        msg.includes('terminated') || 
        msg.includes('EMAXCONNSESSION') ||
        msg.includes('max clients')
      ) {
        return; // Gracefully suppress Supabase connection pool limit warnings
      }
      console.error('[pg-boss] Suppressed Error:', msg);
    });

    await boss.start();
    console.log('[Queues] pg-boss Queues initialized via PostgreSQL (Pool Max: 2) successfully.');
  } catch (err: any) {
    console.warn('[Queues] PgBoss start bypassed due to Supabase pool limit. Using direct execution:', err?.message || err);
    boss = null;
  }
}

let directWebhookProcessor: ((payload: any) => Promise<void>) | null = null;

export function setDirectWebhookProcessor(processor: (payload: any) => Promise<void>) {
  directWebhookProcessor = processor;
}

export async function enqueueIncomingWebhook(payload: any) {
  if (boss) {
    try {
      await boss.send('incoming-messages', payload);
      return;
    } catch (e) {
      console.warn('[Queues] Direct fallback for webhook due to boss send error.');
    }
  }
  
  // Direct Fallback if boss is disabled or fails
  if (directWebhookProcessor) {
    console.log('[Queues Fallback] Executing Meta Webhook processing directly (pg-boss inactive)...');
    directWebhookProcessor(payload).catch(err => {
      console.error('[Queues Fallback Error] Failed processing Meta Webhook directly:', err);
    });
  }
}

export async function enqueueOutgoingMessage(payload: any) {
  if (boss) {
    try {
      await boss.send('outgoing-messages', payload);
    } catch (e) {
      console.warn('[Queues] Direct fallback for outgoing message.');
    }
  }
}
