'use client';

import { useState, useEffect } from 'react';
import { DayColumn } from './DayColumn';
import { Button } from '@/components/ui/Button';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useActivities } from '@/lib/hooks/useActivities';
import { useSelectedEvents } from '@/lib/hooks/useSelectedEvents';
import { useAuth } from '@/providers/AuthProvider';
import { getWeekStart, getWeekEnd, getWeekDays, formatDate, formatDateISO, isToday } from '@/lib/utils/dates';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addWeeks } from 'date-fns';
import type { Checkin, WeeklyActivity, SelectedEvent } from '@/lib/supabase/types';

export function WeekCalendar() {
  const { user } = useAuth();
  const { getByDateRange: getCheckins } = useCheckins();
  const { getByWeek: getActivities } = useActivities();
  const { getByWeek: getEvents } = useSelectedEvents();

  const [weekOffset, setWeekOffset] = useState(0);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [events, setEvents] = useState<SelectedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const baseWeekStart = getWeekStart();
  const currentWeekStart = addWeeks(baseWeekStart, weekOffset);
  const currentWeekEnd = getWeekEnd(currentWeekStart);
  const days = getWeekDays(currentWeekStart);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const wsISO = formatDateISO(currentWeekStart);
      const weISO = formatDateISO(currentWeekEnd);
      const [c, a, e] = await Promise.all([
        getCheckins(wsISO, weISO),
        getActivities(wsISO),
        getEvents(wsISO, weISO),
      ]);
      setCheckins(c);
      setActivities(a);
      setEvents(e);
      setLoading(false);
    };
    load();
  }, [user, weekOffset, getCheckins, getActivities, getEvents, currentWeekStart, currentWeekEnd]);

  const getCheckinsByDate = (date: string) => checkins.filter(c => c.date === date);
  const getActivitiesByDate = (date: string) => activities.filter(a => a.planned_date === date);
  const getEventsByDate = (date: string) => events.filter(e => e.event_date.startsWith(date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o - 1)}>
          <ChevronLeft size={16} />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium">
            {formatDate(currentWeekStart, 'dd MMM')} - {formatDate(currentWeekEnd, 'dd MMM')}
          </p>
          {weekOffset === 0 && <p className="text-xs text-primary">Cette semaine</p>}
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-text-muted hover:text-primary transition-colors">
              Revenir a cette semaine
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o + 1)}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1.5">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-alt rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
