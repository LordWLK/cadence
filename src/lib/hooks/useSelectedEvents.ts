'use client';

import { useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { SelectedEvent, SelectedEventInsert } from '@/lib/supabase/types';

export function useSelectedEvents() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (data: Omit<SelectedEventInsert, 'user_id'>) => {
    if (!supabase || !user) return null;
    setLoading(true);
    const { data: event, error } = await supabase
      .from('selected_events')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    setLoading(false);
    if (error) return null;
    return event as SelectedEvent;
  }, [supabase, user]);

  const getByWeek = useCallback(async (weekStart: string, weekEnd: string) => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('selected_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', weekStart)
      .lte('event_date', weekEnd + 'T23:59:59')
      .order('event_date', { ascending: true });
    return (data ?? []) as SelectedEvent[];
  }, [supabase, user]);

  const remove = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('selected_events').delete().eq('id', id);
  }, [supabase]);

  return { create, getByWeek, remove, loading };
}
