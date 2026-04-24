'use client';

import { useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getWeekDays, formatDateISO } from '@/lib/utils/dates';
import { getDay } from 'date-fns';
import type { BacklogActivity, BacklogActivityInsert, BacklogShare } from '@/lib/supabase/types';

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

  /**
   * Copie les partages par défaut d'un backlog vers les activity_shares d'une activité créée.
   * Aucun effet si le backlog n'a pas de partages configurés.
   */
  const copyBacklogSharesToActivity = useCallback(
    async (backlogId: string, activityId: string) => {
      if (!supabase || !user) return;
      const { data: shareRows } = await supabase
        .from('backlog_shares')
        .select('*')
        .eq('backlog_id', backlogId);
      const shares = (shareRows ?? []) as BacklogShare[];
      if (shares.length === 0) return;
      await supabase.from('activity_shares').insert(
        shares.map((s) => ({
          activity_id: activityId,
          shared_by_user_id: user.id,
          shared_with_user_id: s.shared_with_user_id,
          can_edit: s.can_edit,
          hidden: false,
        }))
      );
    },
    [supabase, user]
  );

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
    // Propager les partages par défaut du backlog vers la nouvelle activité
    if (activity?.id) {
      await copyBacklogSharesToActivity(backlog.id, activity.id);
    }
    return activity;
  }, [supabase, user, copyBacklogSharesToActivity]);

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

    // 3a. Already pulled items for these dates (any backlog)
    const { data: existing } = await supabase
      .from('weekly_activities')
      .select('backlog_id, planned_date')
      .eq('user_id', user.id)
      .in('planned_date', dayDates)
      .not('backlog_id', 'is', null);

    const alreadyPulledKeys = new Set(
      (existing ?? []).map(e => `${e.backlog_id}__${e.planned_date}`)
    );

    // 3b. Dates volontairement skippées par l'utilisateur (suppression manuelle)
    const { data: skips } = await supabase
      .from('backlog_skip_dates')
      .select('backlog_id, skipped_date')
      .eq('user_id', user.id)
      .in('skipped_date', dayDates);

    const skippedKeys = new Set(
      (skips ?? []).map(s => `${s.backlog_id}__${s.skipped_date}`)
    );

    // 4. Pour chaque item récurrent, décider s'il faut l'ajouter
    const toInsert: Array<{
      user_id: string;
      title: string;
      category: string;
      planned_date: string;
      week_start: string;
      backlog_id: string;
    }> = [];

    // On dédoublonne côté client aussi (au cas où deux appels concurrents se croisent,
    // la contrainte unique partielle en DB garantit la protection finale)
    const plannedKeys = new Set<string>();

    for (const item of recurring as BacklogActivity[]) {
      const dayIndex = DAY_NAME_TO_INDEX[item.recurrence];
      if (dayIndex === undefined) continue;

      const matchingDay = days.find(d => getDay(d) === dayIndex);
      if (!matchingDay) continue;

      const plannedDate = formatDateISO(matchingDay);
      const key = `${item.id}__${plannedDate}`;

      if (alreadyPulledKeys.has(key)) continue;  // déjà en base
      if (skippedKeys.has(key)) continue;         // l'utilisateur a volontairement supprimé
      if (plannedKeys.has(key)) continue;         // déjà dans ce batch
      plannedKeys.add(key);

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

    // Insert en récupérant les ids pour pouvoir propager les partages.
    // L'index unique partiel en DB empêche les doublons même en cas d'appel concurrent.
    // Si on tombe sur un conflit, on l'ignore silencieusement (un autre onglet a gagné la course).
    const { data: inserted, error: insertError } = await supabase
      .from('weekly_activities')
      .insert(toInsert)
      .select('id, backlog_id');

    if (insertError) {
      // 23505 = unique_violation (PostgreSQL)
      if (insertError.code === '23505') return false;
      console.error('autoPopulateRecurring insert error:', insertError);
      return false;
    }

    // Copier les partages backlog → activity pour chaque item inséré qui a un backlog partagé
    if (inserted && inserted.length > 0) {
      const backlogIds = inserted.map((r) => r.backlog_id).filter(Boolean) as string[];
      const { data: shareRows } = await supabase
        .from('backlog_shares')
        .select('*')
        .in('backlog_id', backlogIds);
      const shares = (shareRows ?? []) as BacklogShare[];

      if (shares.length > 0) {
        const sharesByBacklog = new Map<string, BacklogShare[]>();
        for (const s of shares) {
          const arr = sharesByBacklog.get(s.backlog_id) ?? [];
          arr.push(s);
          sharesByBacklog.set(s.backlog_id, arr);
        }

        const activityShares = inserted.flatMap((row) => {
          if (!row.backlog_id) return [];
          const rowShares = sharesByBacklog.get(row.backlog_id) ?? [];
          return rowShares.map((s) => ({
            activity_id: row.id,
            shared_by_user_id: user.id,
            shared_with_user_id: s.shared_with_user_id,
            can_edit: s.can_edit,
            hidden: false,
          }));
        });

        if (activityShares.length > 0) {
          await supabase.from('activity_shares').insert(activityShares);
        }
      }
    }
    return true; // Activities were added
  }, [supabase, user]);

  return { getAll, create, update, remove, pullToWeek, getAlreadyPulled, autoPopulateRecurring };
}
