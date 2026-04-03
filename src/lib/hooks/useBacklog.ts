'use client';

import { useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getWeekDays, formatDateISO } from '@/lib/utils/dates';
import { getDay } from 'date-fns';
import type { BacklogActivity, BacklogActivityInsert } from '@/lib/supabase/types';

// Map day names to date-fns getDay() values (0=sunday, 1=monday, ...)
const DAY_NAME_TO_INDEX: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
};

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

  const update = useCallback(async (id: string, data: { title?: string; category?: string; recurrence?: string; recurrence_freq?: string }) => {
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

  // Pull a backlog item to a specific day — item stays in backlog (always reusable)
  const pullToWeek = useCallback(async (
    backlog: BacklogActivity,
    plannedDate: string,
    weekStart: string,
  ) => {
    if (!supabase || !user) return null;
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

  // Auto-populate recurring backlog items into the week
  const autoPopulateRecurring = useCallback(async (weekStart: Date, weekStartISO: string) => {
    if (!supabase || !user) return false;

    // 1. Get all active backlog items with a recurring day
    const { data: recurring } = await supabase
      .from('backlog_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .neq('recurrence', 'none');

    if (!recurring || recurring.length === 0) return false;

    // 2. Get the week days
    const days = getWeekDays(weekStart);
    const dayDates = days.map(d => formatDateISO(d));

    // 3. Get already pulled items for any of these dates (not just by week_start)
    const { data: existing } = await supabase
      .from('weekly_activities')
      .select('backlog_id, planned_date')
      .eq('user_id', user.id)
      .in('planned_date', dayDates)
      .not('backlog_id', 'is', null);

    // Track which backlog_id + planned_date combos already exist
    const alreadyPulledKeys = new Set(
      (existing ?? []).map(e => `${e.backlog_id}__${e.planned_date}`)
    );

    // 4. For each recurring item, check if it needs to be added
    const toInsert: Array<{
      user_id: string;
      title: string;
      category: string;
      planned_date: string;
      week_start: string;
      backlog_id: string;
    }> = [];

    for (const item of recurring as BacklogActivity[]) {
      const dayIndex = DAY_NAME_TO_INDEX[item.recurrence];
      if (dayIndex === undefined) continue;

      // Find the matching day in the week
      const matchingDay = days.find(d => getDay(d) === dayIndex);
      if (!matchingDay) continue;

      const plannedDate = formatDateISO(matchingDay);
      const key = `${item.id}__${plannedDate}`;
      if (alreadyPulledKeys.has(key)) continue;

      toInsert.push({
        user_id: user.id,
        title: item.title,
        category: item.category,
        planned_date: plannedDate,
        week_start: weekStartISO,
        backlog_id: item.id,
      });
    }

    if (toInsert.length === 0) return false;

    await supabase.from('weekly_activities').insert(toInsert);
    return true; // Activities were added
  }, [supabase, user]);

  return { getAll, create, update, remove, pullToWeek, getAlreadyPulled, autoPopulateRecurring };
}
