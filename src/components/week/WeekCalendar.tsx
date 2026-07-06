'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DayColumn } from './DayColumn';
import { DayDetail } from './DayDetail';
import { Button } from '@/components/ui/Button';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useActivities } from '@/lib/hooks/useActivities';
import { useActivityShares, type ActivityShareInfo } from '@/lib/hooks/useActivityShares';
import { useBacklog } from '@/lib/hooks/useBacklog';
import { useSelectedEvents } from '@/lib/hooks/useSelectedEvents';
import { useAuth } from '@/providers/AuthProvider';
import { getWeekStart, getWeekEnd, getWeekDays, formatDateISO, isToday } from '@/lib/utils/dates';
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { addWeeks, format } from 'date-fns';
import type { Checkin, WeeklyActivity, SelectedEvent } from '@/lib/supabase/types';

export function WeekCalendar() {
  const { user } = useAuth();
  const { getByDateRange: getCheckins } = useCheckins();
  const { getByDateRange: getActivities } = useActivities();
  const { getShareInfo } = useActivityShares();
  const { autoPopulateRecurring } = useBacklog();
  const { getByWeek: getEvents }       = useSelectedEvents();

  const [weekOffset, setWeekOffset]   = useState(0);
  const [checkins, setCheckins]       = useState<Checkin[]>([]);
  const [activities, setActivities]   = useState<WeeklyActivity[]>([]);
  const [events, setEvents]           = useState<SelectedEvent[]>([]);
  const [shareMap, setShareMap]       = useState<Map<string, ActivityShareInfo>>(new Map());
  const [loading, setLoading]         = useState(false); // false par défaut → colonnes visibles immédiatement
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Mémorise les semaines déjà auto-populées dans cette session pour éviter
  // d'appeler autoPopulateRecurring à chaque changement d'onglet
  const populatedWeeksRef = useRef<Set<string>>(new Set());
  // Jeton de chargement : une réponse en retard (navigation rapide entre semaines)
  // ne doit pas écraser les données de la semaine actuellement affichée.
  const loadTokenRef = useRef(0);

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
    const token = ++loadTokenRef.current;
    const isStale = () => token !== loadTokenRef.current;
    setLoading(true);

    // Auto-populer les récurrences pour la semaine visitée (une seule fois par session)
    if (!populatedWeeksRef.current.has(wsISO)) {
      populatedWeeksRef.current.add(wsISO);
      await autoPopulateRecurring(currentWeekStart, wsISO, 1);
    }

    const [c, a, e] = await Promise.all([
      getCheckins(wsISO, weISO),
      getActivities(wsISO, weISO),
      getEvents(wsISO, weISO),
    ]);
    if (isStale()) return; // une navigation plus récente a pris la main
    setCheckins(c);
    setActivities(a);
    setEvents(e);
    if (a.length > 0) {
      const info = await getShareInfo(a.map((x) => x.id));
      if (isStale()) return;
      setShareMap(info);
    } else {
      setShareMap(new Map());
    }
    setLoading(false);
  }, [user, wsISO, weISO, currentWeekStart, getCheckins, getActivities, getEvents, getShareInfo, autoPopulateRecurring]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement des données de la semaine
    loadData();
  }, [loadData]);

  const getCheckinsByDate  = (date: string) => checkins.filter(c => c.date === date);
  const getActivitiesByDate = (date: string) => activities.filter(a => a.planned_date === date);
  const getEventsByDate    = (date: string) => events.filter(e => e.event_date.startsWith(date));
  const getShareByActivityId = (id: string) => shareMap.get(id);

  return (
    <div className="space-y-3">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" aria-label="Semaine précédente" onClick={() => setWeekOffset(o => o - 1)}>
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
        <Button variant="ghost" size="sm" aria-label="Semaine suivante" onClick={() => setWeekOffset(o => o + 1)}>
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
                getShareInfo={getShareByActivityId}
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
          getShareInfo={getShareByActivityId}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
