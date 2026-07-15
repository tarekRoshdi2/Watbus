import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns the lazily-initialized Supabase Client, or null if credentials are missing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    return supabaseClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
}

/**
 * Check if Supabase connection is fully configured.
 */
export function isSupabaseConfigured(): boolean {
  return !!getSupabaseClient();
}

/**
 * Verifies if the required tables exist and are accessible in Supabase.
 */
export async function checkSupabaseTablesExist(): Promise<{
  whatsapp_sessions: boolean;
  crm_backups: boolean;
  allExist: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { whatsapp_sessions: false, crm_backups: false, allExist: false };
  }

  try {
    // Quick test query to check table presence
    const { error: wsError } = await client.from('whatsapp_sessions').select('id').limit(1);
    const { error: dbError } = await client.from('crm_backups').select('id').limit(1);

    const wsExists = !wsError || !wsError.message.includes('Could not find the table');
    const dbExists = !dbError || !dbError.message.includes('Could not find the table');

    return {
      whatsapp_sessions: wsExists,
      crm_backups: dbExists,
      allExist: wsExists && dbExists,
      error: wsError?.message || dbError?.message || undefined
    };
  } catch (err: any) {
    return { whatsapp_sessions: false, crm_backups: false, allExist: false, error: err.message || String(err) };
  }
}

/**
 * Backs up all WhatsApp session files for a specific deviceId to Supabase using batch upsert.
 */
export async function backupSessionToSupabase(deviceId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const sessionDir = path.join(process.cwd(), 'whatsapp-sessions', deviceId);
  if (!fs.existsSync(sessionDir)) {
    return false;
  }

  try {
    const files = fs.readdirSync(sessionDir);
    const upsertData: any[] = [];

    for (const fileName of files) {
      const filePath = path.join(sessionDir, fileName);
      try {
        const stat = fs.statSync(filePath);
        
        // We only sync files (Baileys stores credentials & prekeys in flat JSON files)
        if (stat.isFile()) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const id = `${deviceId}/${fileName}`;
          upsertData.push({
            id,
            device_id: deviceId,
            file_path: fileName,
            file_content: fileContent,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          continue; // Skip file if it disappeared during reading
        }
        console.error(`[Supabase Backup] Unexpected error reading file ${fileName}:`, err);
      }
    }

    if (upsertData.length > 0) {
      console.log(`[Supabase Backup] Device ${deviceId}: Attempting to backup ${upsertData.length} session files.`);
      const { error } = await client
        .from('whatsapp_sessions')
        .upsert(upsertData, { onConflict: 'id' });

      if (error) {
        console.error(`[Supabase Backup] Error upserting session files batch for device ${deviceId}:`, error.message);
        console.error(`[Supabase Backup] Error details for ${deviceId}:`, JSON.stringify(error, null, 2));
        if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
          console.warn(`👉 [ACTION REQUIRED] Table 'whatsapp_sessions' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
        }
        return false;
      }
      console.log(`[Supabase Backup] Device ${deviceId}: Backed up ${upsertData.length} session files in a single batch successfully.`);
    } else {
        console.log(`[Supabase Backup] Device ${deviceId}: No session files to backup.`);
    }
    return true;
  } catch (err) {
    console.error(`[Supabase Backup] Failed to back up session folder for device ${deviceId}:`, err);
    return false;
  }
}

/**
 * Restores all WhatsApp session files for a specific deviceId from Supabase to the local directory.
 */
export async function restoreSessionFromSupabase(deviceId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const sessionDir = path.join(process.cwd(), 'whatsapp-sessions', deviceId);
  
  try {
    // Query all files stored in Supabase for this device
    const { data, error } = await client
      .from('whatsapp_sessions')
      .select('file_path, file_content')
      .eq('device_id', deviceId);

    if (error) {
      console.error(`[Supabase Restore] Error fetching session files for device ${deviceId}:`, error.message);
      console.error(`[Supabase Restore] Error details for ${deviceId}:`, JSON.stringify(error, null, 2));
      if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
        console.warn(`👉 [ACTION REQUIRED] Table 'whatsapp_sessions' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
      }
      return false;
    }

    if (!data || data.length === 0) {
      console.log(`[Supabase Restore] No backed up session files found in Supabase for device ${deviceId}.`);
      return false;
    }

    console.log(`[Supabase Restore] Device ${deviceId}: Found ${data.length} session files in Supabase.`);

    // Ensure local folder exists
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    let restoredCount = 0;
    for (const record of data) {
      const destPath = path.join(sessionDir, record.file_path);
      fs.writeFileSync(destPath, record.file_content, 'utf-8');
      restoredCount++;
    }

    console.log(`[Supabase Restore] Device ${deviceId}: Restored ${restoredCount} session files locally.`);
    return true;
  } catch (err) {
    console.error(`[Supabase Restore] Failed to restore session folder for device ${deviceId}:`, err);
    return false;
  }
}

/**
 * Deletes session files for a specific deviceId from Supabase.
 */
export async function deleteSessionFromSupabase(deviceId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    const { error } = await client
      .from('whatsapp_sessions')
      .delete()
      .eq('device_id', deviceId);

    if (error) {
      console.error(`[Supabase Delete] Error deleting session files from Supabase for device ${deviceId}:`, error.message);
      if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
        console.warn(`👉 [ACTION REQUIRED] Table 'whatsapp_sessions' is missing in Supabase. Please create the table first.`);
      }
      return false;
    }

    console.log(`[Supabase Delete] Deleted session backup in Supabase for device ${deviceId}.`);
    return true;
  } catch (err) {
    console.error(`[Supabase Delete] Failed to delete session from Supabase:`, err);
    return false;
  }
}

/**
 * Backs up the local CRM JSON Database to Supabase.
 */
export async function backupDbToSupabase(dbData: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    const { error } = await client
      .from('crm_backups')
      .upsert({
        id: 'db-store',
        data: dbData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase DB Backup] Error backing up central database:', error.message);
      if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
        console.warn(`👉 [ACTION REQUIRED] Table 'crm_backups' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
      }
      return false;
    }

    console.log('[Supabase DB Backup] Central database backup to Supabase completed successfully.');
    return true;
  } catch (err) {
    console.error('[Supabase DB Backup] Failed to back up central database:', err);
    return false;
  }
}

/**
 * Restores the central CRM database from Supabase.
 * Returns the parsed database object or null if not configured or not found.
 */
export async function restoreDbFromSupabase(): Promise<any | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from('crm_backups')
      .select('data')
      .eq('id', 'db-store')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Supabase DB Restore] No previous central database backup found in Supabase.');
      } else {
        console.error('[Supabase DB Restore] Error fetching central database:', error.message);
        if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
          console.warn(`👉 [ACTION REQUIRED] Table 'crm_backups' is missing in Supabase. Please open WhatsApp Settings in the web UI, copy the SQL script, and run it in the Supabase SQL Editor to create it!`);
        }
      }
      return null;
    }

    if (data && data.data) {
      console.log('[Supabase DB Restore] Successfully fetched central database backup from Supabase.');
      return data.data;
    }

    return null;
  } catch (err) {
    console.error('[Supabase DB Restore] Failed to restore database from Supabase:', err);
    return null;
  }
}

/**
 * Authenticates a user against Supabase.
 */
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  // Assuming a 'users' table exists in Supabase
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

/**
 * Creates a new user in Supabase.
 */
export async function createUser(user: User & { password?: string }): Promise<{ success: boolean; error?: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  const { error } = await client
    .from('users')
    .insert([{
      id: user.id,
      username: user.username,
      password_hash: (user as any).password, // Map password to password_hash
      subscription_status: user.subscriptionStatus, // Changed to snake_case
      created_at: new Date().toISOString() // Added created_at
    }]);

  if (error) {
    console.error('[Supabase] Create user error:', JSON.stringify(error, null, 2));
    return { success: false, error };
  }

  return { success: true };
}

export async function getUserByUsername(username: string): Promise<any | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  if (error || !data) {
    return null;
  }
  return data;
}

export async function updateUser(user: User & { password?: string }): Promise<{ success: boolean; error?: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  const updateData: any = {
    subscription_status: user.subscriptionStatus,
    updated_at: new Date().toISOString()
  };
  if ((user as any).password) {
    updateData.password_hash = (user as any).password;
  }
  const { error } = await client
    .from('users')
    .update(updateData)
    .eq('username', user.username);

  if (error) {
    console.error('[Supabase] Update user error:', JSON.stringify(error, null, 2));
    return { success: false, error };
  }
  return { success: true };
}
