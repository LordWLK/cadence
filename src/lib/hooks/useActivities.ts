'use client';

import { useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { WeeklyActivity, WeeklyActivityInsert } from '@/lib/supabase/types';

export function useActivities() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (data: Omit<WeeklyActivityInsert, 'user_id'>) => {
    if (!supabase || !user) return null;
    setLoading(true);
    const { data: activity, error } = await supabase
      .from('weekly_activities')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    setLoading(false);
    if (error) return null;
    return activity as WeeklyActivity;
  }, [supabase, user]);

  const getByWeek = useCallback(async (weekStart: string) => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('weekly_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .order('planned_date', { ascending: true });
    return (data ?? []) as WeeklyActivity[];
  }, [supabase, user]);

  const getByDateRange = useCallback(async (start: string, end: string) => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('weekly_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('planned_date', start)
      .lte('planned_date', end)
      .order('planned_date', { ascending: true });
    return (data ?? []) as WeeklyActivity[];
  }, [supabase, user]);

  const update = useCallback(async (id: string, data: { title?: string; category?: string; planned_date?: string }) => {
    if (!supabase || !user) return null;
    const { data: activity, error } = await supabase
      .from('weekly_activities')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return null;
    return activity as WeeklyActivity;
  }, [supabase, user]);

  const remove = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('weekly_activities').delete().eq('id', id);
  }, [supabase]);

  return { create, update, getByWeek, getByDateRange, remove, loading };
}
