'use client';

import { useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { SportPreference, SportPreferenceInsert } from '@/lib/supabase/types';

export function useSportPrefs() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getAll = useCallback(async () => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('sport_preferences')
      .select('*')
      .eq('user_id', user.id)
      .order('sport', { ascending: true });
    return (data ?? []) as SportPreference[];
  }, [supabase, user]);

  const getBySport = useCallback(async (sport: string) => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('sport_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('sport', sport);
    return (data ?? []) as SportPreference[];
  }, [supabase, user]);

  const add = useCallback(async (data: Omit<SportPreferenceInsert, 'user_id'>) => {
    if (!supabase || !user) return null;
    setLoading(true);
    const { data: pref, error } = await supabase
      .from('sport_preferences')
      .upsert({ ...data, user_id: user.id }, { onConflict: 'user_id,sport,entity_type,entity_id' })
      .select()
      .single();
    setLoading(false);
    if (error) return null;
    return pref as SportPreference;
  }, [supabase, user]);

  const remove = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('sport_preferences').delete().eq('id', id);
  }, [supabase]);

  return { getAll, getBySport, add, remove, loading };
}
