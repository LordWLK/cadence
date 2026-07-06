'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseProvider';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase non configuré' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // No emailRedirectTo — we want a 6-digit code, not a magic link
    });
    return { error: error?.message ?? null };
  }, [supabase]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { error: 'Supabase non configuré' };
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error?.message ?? null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    // Purge le cache d'API Supabase du service worker : sinon les données personnelles
    // du compte précédent restent servies hors-ligne après un changement de compte.
    if (typeof caches !== 'undefined') {
      try {
        await caches.delete('supabase-api');
      } catch { /* pas de service worker / cache absent */ }
    }
  }, [supabase]);

  // Supabase émet un nouvel objet Session (donc un nouveau `session.user`) à chaque
  // TOKEN_REFRESHED (~toutes les heures). Sans stabilisation, tous les hooks de données
  // dépendant de `user` se relanceraient (refetch storm + flash de skeletons).
  // On mémoïse `user` sur son id : tant que l'identité ne change pas, la référence reste
  // stable même si l'objet Session est remplacé.
  const userId = session?.user?.id ?? null;
  const user = useMemo<User | null>(() => session?.user ?? null, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({ session, user, isLoading, signIn, verifyOtp, signOut }),
    [session, user, isLoading, signIn, verifyOtp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
