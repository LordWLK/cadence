'use client';

import { useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';

/**
 * Captures auth tokens from URL hash and sets the Supabase session.
 * This handles the PWA flow on iOS where Safari and the standalone app
 * don't share cookies — tokens are passed via the URL.
 */
export function SessionFromUrl() {
  const supabase = useSupabase();

  useEffect(() => {
    if (!supabase) return;

    // Check for tokens in hash (from /auth/verify redirect)
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(() => {
        // Clean the URL to avoid token leakage
        window.history.replaceState(null, '', window.location.pathname);
      });
    }
  }, [supabase]);

  return null;
}
