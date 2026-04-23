'use client';

import { useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { BacklogShare, Profile } from '@/lib/supabase/types';

export interface BacklogShareInfo {
  /** Partages émis par le propriétaire pour ce backlog. */
  sharedWith: Array<{ share: BacklogShare; profile: Profile }>;
}

/**
 * Hook pour gérer le partage d'un item de backlog.
 *
 * Quand un backlog est tiré dans la semaine (pullToWeek ou autoPopulateRecurring),
 * ces partages sont recopiés en tant que `activity_shares` sur l'activité créée.
 */
export function useBacklogShares() {
  const supabase = useSupabase();
  const { user } = useAuth();

  /** Lire les partages d'un seul backlog (pour initialiser un formulaire d'édition). */
  const getForBacklog = useCallback(
    async (backlogId: string): Promise<BacklogShare[]> => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from('backlog_shares')
        .select('*')
        .eq('backlog_id', backlogId);
      return (data ?? []) as BacklogShare[];
    },
    [supabase, user]
  );

  /**
   * Synchronise les partages d'un backlog avec la liste fournie.
   * Supprime ceux absents, ajoute les nouveaux, met à jour can_edit.
   */
  const setSharesForBacklog = useCallback(
    async (backlogId: string, targetShares: Array<{ userId: string; canEdit: boolean }>) => {
      if (!supabase || !user) return;

      const { data: existingRaw } = await supabase
        .from('backlog_shares')
        .select('*')
        .eq('backlog_id', backlogId);
      const existing = (existingRaw ?? []) as BacklogShare[];

      const targetMap = new Map(targetShares.map((s) => [s.userId, s.canEdit]));
      const existingMap = new Map(existing.map((e) => [e.shared_with_user_id, e]));

      const toDelete = existing.filter((e) => !targetMap.has(e.shared_with_user_id));
      if (toDelete.length > 0) {
        await supabase
          .from('backlog_shares')
          .delete()
          .in('id', toDelete.map((e) => e.id));
      }

      const toInsert = targetShares
        .filter((s) => !existingMap.has(s.userId))
        .map((s) => ({
          backlog_id: backlogId,
          shared_by_user_id: user.id,
          shared_with_user_id: s.userId,
          can_edit: s.canEdit,
        }));
      if (toInsert.length > 0) {
        await supabase.from('backlog_shares').insert(toInsert);
      }

      for (const s of targetShares) {
        const e = existingMap.get(s.userId);
        if (e && e.can_edit !== s.canEdit) {
          await supabase.from('backlog_shares').update({ can_edit: s.canEdit }).eq('id', e.id);
        }
      }
    },
    [supabase, user]
  );

  /**
   * Récupère les infos de partage (avec profils) pour un ensemble de backlogs.
   * Utilisé pour afficher les avatars des destinataires dans la liste.
   */
  const getShareInfoForBacklogs = useCallback(
    async (backlogIds: string[]): Promise<Map<string, BacklogShareInfo>> => {
      const map = new Map<string, BacklogShareInfo>();
      if (!supabase || !user || backlogIds.length === 0) return map;

      const { data: shareRows } = await supabase
        .from('backlog_shares')
        .select('*')
        .in('backlog_id', backlogIds);
      const shares = (shareRows ?? []) as BacklogShare[];

      const userIds = Array.from(new Set(shares.map((s) => s.shared_with_user_id)));
      let profiles: Profile[] = [];
      if (userIds.length > 0) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        profiles = (profData ?? []) as Profile[];
      }
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      for (const id of backlogIds) {
        const relevant = shares.filter((s) => s.backlog_id === id);
        map.set(id, {
          sharedWith: relevant
            .map((s) => ({ share: s, profile: profileMap.get(s.shared_with_user_id) }))
            .filter((x): x is { share: BacklogShare; profile: Profile } => Boolean(x.profile)),
        });
      }
      return map;
    },
    [supabase, user]
  );

  return { getForBacklog, setSharesForBacklog, getShareInfoForBacklogs };
}
