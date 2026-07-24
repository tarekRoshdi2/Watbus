import { readDb, writeDb } from './src/db.js';
import { backupDbToSupabase } from './src/supabase.js';

async function run() {
  const db = readDb();
  db.conversations = {};
  db.messages = [];
  writeDb(db);
  console.log('Local conversations and messages cleared.');
  await backupDbToSupabase(db);
  console.log('Cloud database (Supabase) cleared successfully!');
  process.exit(0);
}

run().catch(console.error);
