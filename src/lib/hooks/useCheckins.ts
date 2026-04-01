'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { addToQueue, getPendingItems, removeFromQueue, isOnline, onOnline } from '@/lib/utils/offlineQueue';
import type { Checkin, CheckinInsert } from '@/lib/supabase/types';

export function useCheckins() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Sync offline queue when back online
  const syncQueue = useCallback(async () => {
    if (!supabase || !user) return;
    const pending = await getPendingItems();
    if (pending.length === 0) return;

    let synced = 0;
    for (const item of pending) {
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
      if (!err && item.id) {
        await removeFromQueue(item.id);
        synced++;
      }
    }
    if (synced > 0) {
      console.log(`[OfflineQueue] Synced ${synced} check-in(s)`);
    }
    const remaining = await getPendingItems();
    setPendingCount(remaining.length);
  }, [supabase, user]);

  // Listen for online events
  useEffect(() => {
    const cleanup = onOnline(() => { syncQueue(); });
    // Also try to sync on mount
    if (isOnline()) syncQueue();
    return cleanup;
  }, [syncQueue]);

  const create = useCallback(async (data: Omit<CheckinInsert, 'user_id'>) => {
    if (!user) return null;

    // Offline fallback
    if (!supabase || !isOnline()) {
      await addToQueue({
        type: data.type ?? 'morning',
        mood: data.mood,
        energy: data.energy,
        note: data.note ?? null,
        date: data.date ?? new Date().toISOString().split('T')[0],
      });
      const count = (await getPendingItems()).length;
      setPendingCount(count);
      // Return fake checkin so UI shows success
      return {
        id: `offline-${Date.now()}`,
        user_id: user.id,
        type: data.type ?? 'morning',
        mood: data.mood,
        energy: data.energy,
        note: data.note ?? null,
        date: data.date ?? new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
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

  return { create, getToday, getByDateRange, searchNotes, loading, error, pendingCount, syncQueue };
}
