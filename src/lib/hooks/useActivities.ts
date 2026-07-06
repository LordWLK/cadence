'use client';

import { useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getWeekStart, formatDateISO } from '@/lib/utils/dates';
import { parseISO } from 'date-fns';
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

  /**
   * Récupère TOUTES les activités visibles pour l'utilisateur sur la période :
   *  - ses propres activités
   *  - les activités partagées avec lui (non masquées)
   *
   * La RLS garantit qu'il ne verra que celles autorisées. On fait donc une unique
   * requête sans filtre `user_id` pour profiter des deux policies SELECT.
   * Les activités reçues masquées sont filtrées côté client (via activity_shares.hidden).
   */
  const getByDateRange = useCallback(async (start: string, end: string) => {
    if (!supabase || !user) return [];

    // 1. Récupérer toutes les activités visibles sur la plage (RLS filtre automatiquement)
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('weekly_activities')
      .select('*')
      .gte('planned_date', start)
      .lte('planned_date', end)
      .order('planned_date', { ascending: true });
    if (activitiesError) {
      console.error('getByDateRange activities error:', activitiesError);
      return [];
    }
    const activities = (activitiesData ?? []) as WeeklyActivity[];

    if (activities.length === 0) return [];

    // 2. Récupérer les partages `hidden=true` qui concernent l'utilisateur
    //    pour exclure ces activités
    const activityIds = activities.map((a) => a.id);
    const { data: hiddenSharesData, error: hiddenError } = await supabase
      .from('activity_shares')
      .select('activity_id')
      .eq('shared_with_user_id', user.id)
      .eq('hidden', true)
      .in('activity_id', activityIds);
    if (hiddenError) {
      // On ne peut pas déterminer les activités masquées : par prudence on n'affiche
      // que MES propres activités, pour ne jamais révéler une activité reçue masquée.
      console.error('getByDateRange hidden-shares error:', hiddenError);
      return activities.filter((a) => a.user_id === user.id);
    }
    const hiddenIds = new Set((hiddenSharesData ?? []).map((s) => s.activity_id));

    return activities.filter((a) => !hiddenIds.has(a.id));
  }, [supabase, user]);

  const update = useCallback(async (id: string, data: { title?: string; category?: string; planned_date?: string }) => {
    if (!supabase || !user) return null;

    // Si la date change, on doit connaître l'état actuel : recalcul de week_start,
    // et surtout enregistrer un "skip" sur l'ancienne date si l'activité vient d'un
    // backlog récurrent — sinon l'auto-populate la recrée au jour d'origine (doublon).
    let previous: { planned_date: string; backlog_id: string | null; user_id: string } | null = null;
    if (data.planned_date) {
      const { data: prev } = await supabase
        .from('weekly_activities')
        .select('planned_date, backlog_id, user_id')
        .eq('id', id)
        .maybeSingle();
      previous = prev ?? null;
    }

    const payload: typeof data & { week_start?: string } = { ...data };
    if (data.planned_date) {
      payload.week_start = formatDateISO(getWeekStart(parseISO(data.planned_date)));
    }
    // On ne filtre PAS par user_id : la RLS autorise l'update si je suis propriétaire
    // OU destinataire d'un partage can_edit=true
    const { data: activity, error } = await supabase
      .from('weekly_activities')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;

    // Déplacement d'une occurrence récurrente m'appartenant → skip de l'ancienne date.
    if (
      previous?.backlog_id &&
      previous.user_id === user.id &&
      data.planned_date &&
      previous.planned_date !== data.planned_date
    ) {
      await supabase.from('backlog_skip_dates').upsert(
        {
          user_id: user.id,
          backlog_id: previous.backlog_id,
          skipped_date: previous.planned_date,
        },
        { onConflict: 'user_id,backlog_id,skipped_date' }
      );
    }

    return activity as WeeklyActivity;
  }, [supabase, user]);

  const remove = useCallback(async (id: string) => {
    if (!supabase || !user) return;
    // On récupère d'abord l'activité pour savoir si elle vient d'un backlog récurrent.
    // Dans ce cas on enregistre un "skip" pour que l'auto-populate ne la ressuscite pas.
    const { data: toDelete } = await supabase
      .from('weekly_activities')
      .select('backlog_id, planned_date, user_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('weekly_activities').delete().eq('id', id);
    if (error) return;

    // Skip uniquement si je suis propriétaire et que l'activité venait d'un backlog
    if (
      toDelete?.backlog_id &&
      toDelete?.planned_date &&
      toDelete?.user_id === user.id
    ) {
      await supabase.from('backlog_skip_dates').upsert(
        {
          user_id: user.id,
          backlog_id: toDelete.backlog_id,
          skipped_date: toDelete.planned_date,
        },
        { onConflict: 'user_id,backlog_id,skipped_date' }
      );
    }
  }, [supabase, user]);

  return { create, update, getByWeek, getByDateRange, remove, loading };
}
