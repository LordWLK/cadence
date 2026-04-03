'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DayColumn } from './DayColumn';
import { DayDetail } from './DayDetail';
import { Button } from '@/components/ui/Button';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useActivities } from '@/lib/hooks/useActivities';
import { useSelectedEvents } from '@/lib/hooks/useSelectedEvents';
import { useAuth } from '@/providers/AuthProvider';
import { getWeekStart, getWeekEnd, getWeekDays, formatDate, formatDateISO, isToday } from '@/lib/utils/dates';
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { addWeeks, format } from 'date-fns';
import type { Checkin, WeeklyActivity, SelectedEvent } from '@/lib/supabase/types';

export function WeekCalendar() {
  const { user } = useAuth();
  const { getByDateRange: getCheckins } = useCheckins();
  const { getByWeek: getActivities }   = useActivities();
  const { getByWeek: getEvents }       = useSelectedEvents();

  const [weekOffset, setWeekOffset]   = useState(0);
  const [checkins, setCheckins]       = useState<Checkin[]>([]);
  const [activities, setActivities]   = useState<WeeklyActivity[]>([]);
  const [events, setEvents]           = useState<SelectedEvent[]>([]);
  const [loading, setLoading]         = useState(false); // false par défaut → colonnes visibles immédiatement
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Memoize dates pour éviter les re-runs infinis de useEffect
  const currentWeekStart = useMemo(
    () => addWeeks(getWeekStart(), weekOffset),
    [weekOffset]
  );
  const currentWeekEnd = useMemo(
    () => getWeekEnd(currentWeekStart),
    [currentWeekStart]
  );
  const days = useMemo(
    () => getWeekDays(currentWeekStart),
    [currentWeekStart]
  );

  const wsISO = useMemo(() => formatDateISO(currentWeekStart), [currentWeekStart]);
  const weISO = useMemo(() => formatDateISO(currentWeekEnd),   [currentWeekEnd]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [c, a, e] = await Promise.all([
      getCheckins(wsISO, weISO),
      getActivities(wsISO),
      getEvents(wsISO, weISO),
    ]);
    setCheckins(c);
    setActivities(a);
    setEvents(e);
    setLoading(false);
  }, [user, wsISO, weISO, getCheckins, getActivities, getEvents]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCheckinsByDate  = (date: string) => checkins.filter(c => c.date === date);
  const getActivitiesByDate = (date: string) => activities.filter(a => a.planned_date === date);
  const getEventsByDate    = (date: string) => events.filter(e => e.event_date.startsWith(date));

  return (
    <div className="space-y-3">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o - 1)}>
          <ChevronLeft size={16} />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {format(currentWeekStart, 'dd MMM')} – {format(currentWeekEnd, 'dd MMM')}
          </p>
          {weekOffset === 0 && (
            <p className="text-xs" style={{ color: 'var(--color-primary)' }}>Cette semaine</p>
          )}
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg transition-colors"
              style={{
                color: 'var(--color-primary)',
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              }}
            >
              <CalendarCheck size={12} />
              Aujourd&apos;hui
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o + 1)}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Grille jours — toujours visible, indicateur de chargement léger */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 rounded-xl z-10 pointer-events-none"
               style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 60%, transparent)' }} />
        )}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateISO = formatDateISO(day);
            return (
              <DayColumn
                key={dateISO}
                date={day}
                checkins={getCheckinsByDate(dateISO)}
                activities={getActivitiesByDate(dateISO)}
                events={getEventsByDate(dateISO)}
                isToday={isToday(day)}
                isSelected={selectedDay === dateISO}
                onClick={() => setSelectedDay(prev => prev === dateISO ? null : dateISO)}
              />
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <DayDetail
          date={new Date(selectedDay + 'T00:00:00')}
          checkins={getCheckinsByDate(selectedDay)}
          activities={getActivitiesByDate(selectedDay)}
          events={getEventsByDate(selectedDay)}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
