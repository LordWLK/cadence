'use client';

import { formatDate, getDayShort } from '@/lib/utils/dates';
import { EventBadge } from './EventBadge';
import { ACTIVITY_CATEGORIES, MOOD_EMOJIS } from '@/lib/config/constants';
import type { Checkin, WeeklyActivity, SelectedEvent } from '@/lib/supabase/types';

interface DayColumnProps {
  date: Date;
  checkins: Checkin[];
  activities: WeeklyActivity[];
  events: SelectedEvent[];
  isToday: boolean;
}

export function DayColumn({ date, checkins, activities, events, isToday }: DayColumnProps) {
  const hasMorning = checkins.some(c => c.type === 'morning');
  const hasEvening = checkins.some(c => c.type === 'evening');
  const avgMood = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.mood, 0) / checkins.length)
    : null;

  return (
    <div
      className={`flex flex-col rounded-xl p-1.5 min-h-[120px] transition-all ${
        isToday
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'bg-surface-alt'
      }`}
    >
      <div className="text-center mb-1.5">
        <p className={`text-[10px] font-medium uppercase ${isToday ? 'text-primary' : 'text-text-dim'}`}>
          {getDayShort(date)}
        </p>
        <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-text'}`}>
          {formatDate(date, 'dd')}
        </p>
      </div>

      {/* Check-in indicators */}
      <div className="flex justify-center gap-0.5 mb-1">
        <div className={`w-1.5 h-1.5 rounded-full ${hasMorning ? 'bg-warning' : 'bg-surface-elevated'}`} title="Matin" />
        <div className={`w-1.5 h-1.5 rounded-full ${hasEvening ? 'bg-accent-light' : 'bg-surface-elevated'}`} title="Soir" />
      </div>

      {/* Mood emoji */}
      {avgMood && (
        <p className="text-center text-xs mb-1">{MOOD_EMOJIS[avgMood - 1]}</p>
      )}

      {/* Activities */}
      <div className="space-y-0.5 flex-1">
        {activities.slice(0, 2).map((a) => {
          const cat = ACTIVITY_CATEGORIES.find(c => c.id === a.category);
          return (
            <div
              key={a.id}
              className="text-[8px] leading-tight px-1 py-0.5 rounded bg-surface-elevated truncate"
              title={a.title}
            >
              <span className={cat?.color}>{a.title}</span>
            </div>
          );
        })}
        {activities.length > 2 && (
          <p className="text-[8px] text-text-dim text-center">+{activities.length - 2}</p>
        )}

        {/* Sport events */}
        {events.slice(0, 1).map((e) => (
          <EventBadge key={e.id} event={e} />
        ))}
        {events.length > 1 && (
          <p className="text-[8px] text-text-dim text-center">+{events.length - 1}</p>
        )}
      </div>
    </div>
  );
}
