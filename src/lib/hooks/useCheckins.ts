'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { addToQueue, getPendingItems, removeFromQueue, isOnline, onOnline } from '@/lib/utils/offlineQueue';
import { setBadge, clearBadge } from '@/lib/utils/pwaBadge';
import { getTodayISO } from '@/lib/utils/dates';
import type { Checkin, CheckinInsert } from '@/lib/supabase/types';

// Verrou de synchronisation partagé entre toutes les instances de useCheckins.
// useCheckins est monté simultanément par plusieurs composants (home, page check-in,
// rappel) ; sans ce verrou, chaque instance rejoue la file offline en parallèle et
// insère les mêmes check-ins en double (aucune contrainte UNIQUE côté DB).
let syncInFlight = false;

export function useCheckins() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Sync offline queue when back online
  const syncQueue = useCallback(async () => {
    if (!supabase || !user) return;
    // Empêche deux instances (ou deux déclenchements online/mount) de rejouer
    // la file en parallèle et de créer des doublons.
    if (syncInFlight) return;
    syncInFlight = true;
    try {
      const pending = await getPendingItems();
      if (pending.length === 0) return;

      let synced = 0;
      for (const item of pending) {
        // On retire l'item de la file AVANT l'insert : si une autre passe de sync
        // démarre malgré tout, elle ne verra plus cet item.
        if (item.id) await removeFromQueue(item.id);
        const { error: err } = await supabase
          .from('checkins')
          .insert({
            user_id: user.id,
            type: item.type,
            mood: item.mood,
            energy: item.energy,
            note: item.note,
            date: item.date,
          });
        if (err) {
          // Échec de l'insert → on remet l'item en file pour ne pas le perdre
          // (en conservant son created_at d'origine).
          try {
            await addToQueue({
              type: item.type,
              mood: item.mood,
              energy: item.energy,
              note: item.note,
              date: item.date,
              created_at: item.created_at,
            });
          } catch (e) {
            console.error('[useCheckins] re-queue failed:', e);
          }
        } else {
          synced++;
        }
      }
      if (synced > 0) {
        console.log(`[OfflineQueue] Synced ${synced} check-in(s)`);
      }
      const remaining = await getPendingItems();
      setPendingCount(remaining.length);
      if (remaining.length === 0) clearBadge();
    } finally {
      syncInFlight = false;
    }
  }, [supabase, user]);

  // Listen for online events
  useEffect(() => {
    let active = true;
    // Initialise le compteur depuis IndexedDB (sinon bannière/badge à 0 après
    // relance de l'app hors-ligne avec des check-ins en attente).
    getPendingItems().then((items) => {
      if (!active) return;
      setPendingCount(items.length);
      if (items.length > 0) setBadge(items.length);
    });
    const cleanup = onOnline(() => { syncQueue(); });
    // Also try to sync on mount
    if (isOnline()) syncQueue();
    return () => { active = false; cleanup(); };
  }, [syncQueue]);

  const create = useCallback(async (data: Omit<CheckinInsert, 'user_id'>) => {
    if (!user) return null;

    // Offline fallback
    if (!supabase || !isOnline()) {
      const offlineDate = data.date ?? getTodayISO();
      const createdAt = new Date().toISOString();
      try {
        await addToQueue({
          type: data.type ?? 'morning',
          mood: data.mood,
          energy: data.energy,
          note: data.note ?? null,
          date: offlineDate,
          created_at: createdAt,
        });
      } catch (e) {
        // La mise en file a échoué → on ne prétend PAS que c'est enregistré.
        console.error('[useCheckins] addToQueue failed:', e);
        setError("Impossible d'enregistrer le check-in hors-ligne.");
        return null;
      }
      const count = (await getPendingItems()).length;
      setPendingCount(count);
      setBadge(count);
      // Return fake checkin so UI shows success
      return {
        id: `offline-${Date.now()}`,
        user_id: user.id,
        type: data.type ?? 'morning',
        mood: data.mood,
        energy: data.energy,
        note: data.note ?? null,
        date: offlineDate,
        created_at: createdAt,
      } as Checkin;
    }

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
    const today = getTodayISO();
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

  const searchNotes = useCallback(async (query: string) => {
    if (!supabase || !user || !query.trim()) return [];
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .not('note', 'is', null)
      .ilike('note', `%${query}%`)
      .order('date', { ascending: false })
      .limit(20);
    return (data ?? []) as Checkin[];
  }, [supabase, user]);

  const deleteCheckin = useCallback(async (id: string) => {
    if (!supabase || !user) return false;
    const { error: err } = await supabase
      .from('checkins')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (err) { setError(err.message); return false; }
    return true;
  }, [supabase, user]);

  const updateCheckin = useCallback(async (id: string, data: { mood?: number; energy?: number; note?: string | null }) => {
    if (!supabase || !user) return false;
    const { error: err } = await supabase
      .from('checkins')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id);
    if (err) { setError(err.message); return false; }
    return true;
  }, [supabase, user]);

  return { create, getToday, getByDateRange, searchNotes, deleteCheckin, updateCheckin, loading, error, pendingCount, syncQueue };
}
