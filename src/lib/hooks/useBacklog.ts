'use client';

import { useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { BacklogActivity, BacklogActivityInsert } from '@/lib/supabase/types';

export function useBacklog() {
  const supabase = useSupabase();
  const { user } = useAuth();

  const getAll = useCallback(async () => {
    if (!supabase || !user) return [];
    const { data } = await supabase
      .from('backlog_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return (data ?? []) as BacklogActivity[];
  }, [supabase, user]);

  const create = useCallback(async (data: Omit<BacklogActivityInsert, 'user_id'>) => {
    if (!supabase || !user) return null;
    const { data: item, error } = await supabase
      .from('backlog_activities')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) return null;
    return item as BacklogActivity;
  }, [supabase, user]);

  const update = useCallback(async (id: string, data: { title?: string; category?: string; recurrence?: string }) => {
    if (!supabase || !user) return null;
    const { data: item, error } = await supabase
      .from('backlog_activities')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return null;
    return item as BacklogActivity;
  }, [supabase, user]);

  const remove = useCallback(async (id: string) => {
    if (!supabase || !user) return;
    await supabase
      .from('backlog_activities')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);
  }, [supabase, user]);

  const pullToWeek = useCallback(async (
    backlog: BacklogActivity,
    plannedDate: string,
    weekStart: string,
  ) => {
    if (!supabase || !user) return null;
    // Create a weekly activity from the backlog item
    const { data: activity, error } = await supabase
      .from('weekly_activities')
      .insert({
        user_id: user.id,
        title: backlog.title,
        category: backlog.category,
        planned_date: plannedDate,
        week_start: weekStart,
        backlog_id: backlog.id,
      })
      .select()
      .single();
    if (error) return null;

    // If one-shot (no recurrence), deactivate the backlog item
    if (backlog.recurrence === 'none') {
      await supabase
        .from('backlog_activities')
        .update({ is_active: false })
        .eq('id', backlog.id);
    }

    return activity;
  }, [supabase, user]);

  const getAlreadyPulled = useCallback(async (weekStart: string): Promise<Set<string>> => {
    if (!supabase || !user) return new Set();
    const { data } = await supabase
      .from('weekly_activities')
      .select('backlog_id')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .not('backlog_id', 'is', null);
    const ids = (data ?? []).map(d => d.backlog_id).filter(Boolean) as string[];
    return new Set(ids);
  }, [supabase, user]);

  return { getAll, create, update, remove, pullToWeek, getAlreadyPulled };
}
