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
  const hasEvening  = checkins.some(c => c.type === 'evening');
  const avgMood = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.mood, 0) / checkins.length)
    : null;

  const dayLabel = getDayShort(date).replace('.', '').slice(0, 2).toUpperCase();
  const dayNumber = formatDate(date, 'dd');

  return (
    <div
      className="flex flex-col rounded-xl p-1 min-h-[120px] transition-all"
      style={{
        backgroundColor: isToday
          ? 'color-mix(in srgb, #7c3aed 12%, white)'
          : '#e8e4db',
        outline: isToday
          ? '1.5px solid color-mix(in srgb, #7c3aed 35%, transparent)'
          : 'none',
      }}
    >
      {/* Header */}
      <div className="text-center py-1">
        <p
          className="text-[11px] font-bold leading-none"
          style={{ color: isToday ? '#7c3aed' : '#6b6355' }}
        >
          {dayLabel}
        </p>
        <p
          className="text-base font-bold leading-tight mt-0.5"
          style={{ color: isToday ? '#7c3aed' : '#1a1612' }}
        >
          {dayNumber}
        </p>
      </div>

      {/* Check-in dots */}
      <div className="flex justify-center gap-1 mb-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: hasMorning ? '#d97706' : '#d4cfc5' }}
          title="Matin"
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: hasEvening ? '#4f46e5' : '#d4cfc5' }}
          title="Soir"
        />
      </div>

      {/* Mood */}
      {avgMood && (
        <p className="text-center text-sm leading-none mb-1">
          {MOOD_EMOJIS[avgMood - 1]}
        </p>
      )}

      {/* Activities */}
      <div className="space-y-0.5 flex-1">
        {activities.slice(0, 2).map((a) => {
          const cat = ACTIVITY_CATEGORIES.find(c => c.id === a.category);
          return (
            <div
              key={a.id}
              className="text-[8px] leading-tight px-1 py-0.5 rounded truncate font-medium"
              style={{
                backgroundColor: 'white',
                color: cat?.hex ?? '#6b6355',
              }}
              title={a.title}
            >
              {a.title}
            </div>
          );
        })}
        {activities.length > 2 && (
          <p className="text-[8px] text-center" style={{ color: '#9e9080' }}>
            +{activities.length - 2}
          </p>
        )}

        {events.slice(0, 1).map((e) => (
          <EventBadge key={e.id} event={e} />
        ))}
        {events.length > 1 && (
          <p className="text-[8px] text-center" style={{ color: '#9e9080' }}>
            +{events.length - 1}
          </p>
        )}
      </div>
    </div>
  );
}
