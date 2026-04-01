'use client';

import { useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { Checkin, CheckinInsert } from '@/lib/supabase/types';

export function useCheckins() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Omit<CheckinInsert, 'user_id'>) => {
    if (!supabase || !user) return null;
    setLoading(true);
    setError(null);
    const { data: checkin, error: err } = await supabase
      .from('checkins')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    setLoading(false);
    if (err) { setError(err.message); return null; }
    return checkin as Checkin;
  }, [supabase, user]);

  const getToday = useCallback(async () => {
    if (!supabase || !user) return [];
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true });
    return (data ?? []) as Checkin[];
  }, [supabase, user]);

  const getByDateRange = useCallback(async (start: string, end: string) => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
    return (data ?? []) as Checkin[];
  }, [supabase, user]);

  return { create, getToday, getByDateRange, loading, error };
}
