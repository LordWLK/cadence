'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useActivities } from '@/lib/hooks/useActivities';
import { useSelectedEvents } from '@/lib/hooks/useSelectedEvents';
import { useAuth } from '@/providers/AuthProvider';
import { MOOD_EMOJIS } from '@/lib/config/constants';
import { Sun, Moon, Heart, CalendarPlus, Tv, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import type { Checkin, WeeklyActivity, SelectedEvent } from '@/lib/supabase/types';

export function DaySummary() {
  const { user } = useAuth();
  const { getToday } = useCheckins();
  const { getByDateRange: getActivities } = useActivities();
  const { getByWeek: getEvents } = useSelectedEvents();

  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [events, setEvents] = useState<SelectedEvent[]>([]);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    if (!user) return;
    getToday().then(setCheckins);
    getActivities(today, today).then(setActivities);
    getEvents(today, today).then(setEvents);
  }, [user, today, getToday, getActivities, getEvents]);

  if (!user) return null;

  const hasMorning = checkins.some(c => c.type === 'morning');
  const hasEvening = checkins.some(c => c.type === 'evening');
  const hour = new Date().getHours();
  const needsMorning = !hasMorning && hour < 14;
  const needsEvening = !hasEvening && hour >= 14;
  const allDone = hasMorning && (hour < 14 || hasEvening);

  const isEmpty = checkins.length === 0 && activities.length === 0 && events.length === 0;
  if (isEmpty && allDone) return null;

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-dim)' }}>
            {format(new Date(), 'EEEE dd MMMM', { locale: fr })}
          </p>
          {allDone && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}>
              <CheckCircle size={12} /> Tout fait
            </span>
          )}
        </div>

        {/* Check-in status */}
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              backgroundColor: hasMorning
                ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                : needsMorning
                  ? 'color-mix(in srgb, var(--color-warning) 10%, transparent)'
                  : 'var(--color-surface-alt)',
              color: hasMorning
                ? 'var(--color-success)'
                : needsMorning
                  ? 'var(--color-warning)'
                  : 'var(--color-text-dim)',
            }}
          >
            <Sun size={13} />
            {hasMorning ? (
              <span>{MOOD_EMOJIS[(checkins.find(c => c.type === 'morning')?.mood ?? 3) - 1]} Matin fait</span>
            ) : needsMorning ? (
              <Link href="/checkin" className="hover:underline">Matin en attente</Link>
            ) : (
              <span>Matin —</span>
            )}
          </div>
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              backgroundColor: hasEvening
                ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                : needsEvening
                  ? 'color-mix(in srgb, var(--color-warning) 10%, transparent)'
                  : 'var(--color-surface-alt)',
              color: hasEvening
                ? 'var(--color-success)'
                : needsEvening
                  ? 'var(--color-warning)'
                  : 'var(--color-text-dim)',
            }}
          >
            <Moon size={13} />
            {hasEvening ? (
              <span>{MOOD_EMOJIS[(checkins.find(c => c.type === 'evening')?.mood ?? 3) - 1]} Soir fait</span>
            ) : needsEvening ? (
              <Link href="/checkin" className="hover:underline">Soir en attente</Link>
            ) : (
              <span>Soir —</span>
            )}
          </div>
        </div>

        {/* Today's activities */}
        {activities.length > 0 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <CalendarPlus size={13} style={{ color: 'var(--color-accent)' }} />
            <span>{activities.length} activite{activities.length > 1 ? 's' : ''} prevue{activities.length > 1 ? 's' : ''}</span>
            <span className="text-text-dim">·</span>
            <span className="truncate">{activities.map(a => a.title).join(', ')}</span>
          </div>
        )}

        {/* Today's matches */}
        {events.length > 0 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Tv size={13} style={{ color: 'var(--color-sport-basketball)' }} />
            <span>{events.length} match{events.length > 1 ? 's' : ''} ce soir</span>
            <span className="text-text-dim">·</span>
            <span className="truncate">{events.map(e => e.event_title).join(', ')}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
