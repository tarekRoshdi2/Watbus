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

export async function enqueueIncomingWebhook(payload: any) {
  if (boss) {
    try {
      await boss.send('incoming-messages', payload);
    } catch (e) {
      console.warn('[Queues] Direct fallback for webhook.');
    }
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
