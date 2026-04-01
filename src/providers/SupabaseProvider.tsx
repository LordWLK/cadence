'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useConfig } from './ConfigProvider';
import type { Database } from '@/lib/supabase/types';

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { config } = useConfig();

  const client = useMemo(() => {
    // Try env vars first
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
      return createClient<Database>(envUrl, envKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }

    // Fallback to config from localStorage
    if (!config) return null;
    return createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }, [config?.supabaseUrl, config?.supabaseAnonKey]);

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
