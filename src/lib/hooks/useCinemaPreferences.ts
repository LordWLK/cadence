'use client';

import { useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';

export interface CinemaPreference {
  id: string;
  user_id: string;
  cinema_id: string;
  cinema_name: string;
  created_at: string;
}

export function useCinemaPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getAll = useCallback(async (): Promise<CinemaPreference[]> => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('cinema_preferences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    return (data ?? []) as CinemaPreference[];
  }, [supabase, user]);

  const add = useCallback(async (cinemaId: string, cinemaName: string) => {
    if (!supabase || !user) return null;
    setLoading(true);
    const { data, error } = await supabase
      .from('cinema_preferences')
      .insert({ user_id: user.id, cinema_id: cinemaId, cinema_name: cinemaName })
      .select()
      .single();
    setLoading(false);
    if (error) return null;
    return data as CinemaPreference;
  }, [supabase, user]);

  const remove = useCallback(async (id: string) => {
    if (!supabase || !user) return;
    await supabase.from('cinema_preferences').delete().eq('id', id).eq('user_id', user.id);
  }, [supabase, user]);

  return { getAll, add, remove, loading };
}
