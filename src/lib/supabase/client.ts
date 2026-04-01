import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '@/lib/config/storage';
import type { Database } from './types';

let client: SupabaseClient<Database> | null = null;
let lastUrl: string | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const config = getConfig();
  if (!config) return null;

  if (client && lastUrl === config.supabaseUrl) return client;

  client = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  lastUrl = config.supabaseUrl;
  return client;
}
