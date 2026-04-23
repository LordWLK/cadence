'use client';

import { useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { ActivityShare, Profile } from '@/lib/supabase/types';

export interface ActivityShareInfo {
  /** L'utilisateur courant a-t-il reçu cette activité d'un autre utilisateur ? */
  isReceived: boolean;
  /** Le partage correspondant (seulement si isReceived=true). */
  receivedShare?: ActivityShare;
  /** Profil de l'expéditeur (seulement si isReceived=true). */
  receivedFromProfile?: Profile;
  /** Partages émis par l'utilisateur courant pour cette activité (isOwner=true). */
  sharedWith: Array<{ share: ActivityShare; profile: Profile }>;
}

/**
 * Hook pour gérer le partage d'une activité avec un ou plusieurs contacts.
 *
 * - `setSharesForActivity(activityId, shares)` : synchronise l'ensemble des partages
 *    d'une activité (création / suppression des diffs + mise à jour de can_edit)
 * - `getSharesForActivities(activityIds)` : récupère tous les partages associés à
 *    une liste d'activités (utilisé pour afficher les avatars des destinataires)
 * - `getSharesReceived(activityIds)` : récupère mes partages reçus, avec profil émetteur
 * - `setHidden(shareId, hidden)` : masquer/afficher une activité reçue
 */
export function useActivityShares() {
  const supabase = useSupabase();
  const { user } = useAuth();

  /**
   * Synchronise les partages d'une activité avec la liste fournie.
   * `targetShares` = [{ userId, canEdit }, ...]
   * Supprime ceux qui ne sont plus dans la liste, insère les nouveaux, met à jour can_edit.
   */
  const setSharesForActivity = useCallback(
    async (activityId: string, targetShares: Array<{ userId: string; canEdit: boolean }>) => {
      if (!supabase || !user) return;

      const { data: existingRaw } = await supabase
        .from('activity_shares')
        .select('*')
        .eq('activity_id', activityId);
      const existing = (existingRaw ?? []) as ActivityShare[];

      const targetMap = new Map(targetShares.map((s) => [s.userId, s.canEdit]));
      const existingMap = new Map(existing.map((e) => [e.shared_with_user_id, e]));

      // À supprimer : présents en DB mais pas dans la cible
      const toDelete = existing.filter((e) => !targetMap.has(e.shared_with_user_id));
      if (toDelete.length > 0) {
        await supabase
          .from('activity_shares')
          .delete()
          .in('id', toDelete.map((e) => e.id));
      }

      // À insérer : dans la cible mais pas en DB
      const toInsert = targetShares
        .filter((s) => !existingMap.has(s.userId))
        .map((s) => ({
          activity_id: activityId,
          shared_by_user_id: user.id,
          shared_with_user_id: s.userId,
          can_edit: s.canEdit,
          hidden: false,
        }));
      if (toInsert.length > 0) {
        await supabase.from('activity_shares').insert(toInsert);
      }

      // À mettre à jour : présents dans les deux, mais can_edit a changé
      for (const s of targetShares) {
        const e = existingMap.get(s.userId);
        if (e && e.can_edit !== s.canEdit) {
          await supabase
            .from('activity_shares')
            .update({ can_edit: s.canEdit })
            .eq('id', e.id);
        }
      }
    },
    [supabase, user]
  );

  /**
   * Récupère tous les partages pour un ensemble d'activités (que je possède OU que j'ai reçues).
   * Retourne une map activityId -> shares[] + les profils des destinataires/émetteurs.
   */
  const getSharesForActivities = useCallback(
    async (
      activityIds: string[]
    ): Promise<{ shares: ActivityShare[]; profiles: Map<string, Profile> }> => {
      if (!supabase || !user || activityIds.length === 0) {
        return { shares: [], profiles: new Map() };
      }
      const { data: shareRows } = await supabase
        .from('activity_shares')
        .select('*')
        .in('activity_id', activityIds);
      const shares = (shareRows ?? []) as ActivityShare[];

      // Collecter tous les user_ids à résoudre (expéditeurs + destinataires)
      const userIds = Array.from(
        new Set(shares.flatMap((s) => [s.shared_by_user_id, s.shared_with_user_id]))
      );
      let profiles: Profile[] = [];
      if (userIds.length > 0) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        profiles = (profData ?? []) as Profile[];
      }
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
      return { shares, profiles: profileMap };
    },
    [supabase, user]
  );

  /** Masquer/afficher une activité reçue (seul le destinataire peut toucher `hidden`). */
  const setHidden = useCallback(
    async (shareId: string, hidden: boolean) => {
      if (!supabase || !user) return;
      await supabase
        .from('activity_shares')
        .update({ hidden })
        .eq('id', shareId)
        .eq('shared_with_user_id', user.id);
    },
    [supabase, user]
  );

  /** Supprimer un partage (seul l'émetteur). */
  const removeShare = useCallback(
    async (shareId: string) => {
      if (!supabase || !user) return;
      await supabase
        .from('activity_shares')
        .delete()
        .eq('id', shareId)
        .eq('shared_by_user_id', user.id);
    },
    [supabase, user]
  );

  /**
   * Construit un Map<activityId, ActivityShareInfo> donnant, pour chaque activité,
   * sa position dans le graphe de partage vis-à-vis de l'utilisateur courant.
   */
  const getShareInfo = useCallback(
    async (activityIds: string[]): Promise<Map<string, ActivityShareInfo>> => {
      const map = new Map<string, ActivityShareInfo>();
      if (!user || activityIds.length === 0) return map;

      const { shares, profiles } = await getSharesForActivities(activityIds);

      for (const id of activityIds) {
        const activityShares = shares.filter((s) => s.activity_id === id);
        const received = activityShares.find((s) => s.shared_with_user_id === user.id);
        const sent = activityShares.filter((s) => s.shared_by_user_id === user.id);

        map.set(id, {
          isReceived: Boolean(received),
          receivedShare: received,
          receivedFromProfile: received ? profiles.get(received.shared_by_user_id) : undefined,
          sharedWith: sent
            .map((s) => ({ share: s, profile: profiles.get(s.shared_with_user_id) }))
            .filter((x): x is { share: ActivityShare; profile: Profile } => Boolean(x.profile)),
        });
      }
      return map;
    },
    [user, getSharesForActivities]
  );

  return { setSharesForActivity, getSharesForActivities, getShareInfo, setHidden, removeShare };
}
