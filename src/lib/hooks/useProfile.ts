'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { Profile, ProfileUpdate } from '@/lib/supabase/types';

/**
 * Hook de gestion du profil de l'utilisateur connecté.
 * - Charge automatiquement le profil au montage
 * - Fournit des méthodes pour mettre à jour le display_name / avatar_url
 * - Permet de rechercher un profil par email (pour les demandes d'amis)
 */
export function useProfile() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user) return null;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
    return (data as Profile | null) ?? null;
  }, [supabase, user]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Omit<ProfileUpdate, 'user_id' | 'email' | 'created_at' | 'updated_at'>) => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) return null;
      setProfile(data as Profile);
      return data as Profile;
    },
    [supabase, user]
  );

  const searchByEmail = useCallback(
    async (email: string): Promise<Profile | null> => {
      if (!supabase || !user) return null;
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return null;

      // Chemin privilégié : RPC SECURITY DEFINER (permet de restreindre la lecture
      // directe des profils sans casser la recherche). Absente ? on retombe sur la
      // requête directe ci-dessous. La RPC n'étant pas dans les types générés, on cast
      // l'appel localement.
      const rpcFn = supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: Profile[] | null; error: unknown }>;
      const rpc = await rpcFn('search_profile_by_email', { p_email: trimmed });
      if (!rpc.error) {
        return (rpc.data ?? [])[0] ?? null;
      }

      // Repli : lecture directe. On échappe les jokers ilike (% et _) et
      // l'échappement lui-même, sinon une saisie comme "%" matcherait n'importe quel email.
      const escaped = trimmed.replace(/[\\%_]/g, '\\$&');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', escaped)
        .maybeSingle();
      return (data as Profile | null) ?? null;
    },
    [supabase, user]
  );

  const getByIds = useCallback(
    async (ids: string[]): Promise<Profile[]> => {
      if (!supabase || !user || ids.length === 0) return [];
      const { data } = await supabase.from('profiles').select('*').in('user_id', ids);
      return (data ?? []) as Profile[];
    },
    [supabase, user]
  );

  return { profile, loading, load, update, searchByEmail, getByIds };
}
