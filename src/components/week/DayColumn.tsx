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
  isSelected?: boolean;
  onClick?: () => void;
}

export function DayColumn({ date, checkins, activities, events, isToday, isSelected, onClick }: DayColumnProps) {
  const hasMorning = checkins.some(c => c.type === 'morning');
  const hasEvening  = checkins.some(c => c.type === 'evening');
  const avgMood = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.mood, 0) / checkins.length)
    : null;

  const dayLabel = getDayShort(date).replace('.', '').slice(0, 2).toUpperCase();
  const dayNumber = formatDate(date, 'dd');

  return (
    <div
      onClick={onClick}
      className="flex flex-col rounded-xl p-1 min-h-[120px] transition-all cursor-pointer active:scale-[0.97]"
      style={{
        backgroundColor: isSelected
          ? 'color-mix(in srgb, var(--color-primary) 18%, var(--color-surface))'
          : isToday
            ? 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))'
            : 'var(--color-surface-alt)',
        outline: isSelected
          ? '2px solid var(--color-primary)'
          : isToday
            ? '1.5px solid color-mix(in srgb, var(--color-primary) 35%, transparent)'
            : 'none',
      }}
    >
      {/* Header */}
      <div className="text-center py-1">
        <p
          className="text-[11px] font-bold leading-none"
          style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          {dayLabel}
        </p>
        <p
          className="text-base font-bold leading-tight mt-0.5"
          style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}
        >
          {dayNumber}
        </p>
      </div>

      {/* Check-in dots */}
      <div className="flex justify-center gap-1 mb-1" role="group" aria-label="Check-ins du jour">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: hasMorning ? '#d97706' : 'var(--color-border)' }}
          title={hasMorning ? 'Check-in matin fait' : 'Pas de check-in matin'}
          aria-label={hasMorning ? 'Check-in matin fait' : 'Pas de check-in matin'}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: hasEvening ? '#4f46e5' : 'var(--color-border)' }}
          title={hasEvening ? 'Check-in soir fait' : 'Pas de check-in soir'}
          aria-label={hasEvening ? 'Check-in soir fait' : 'Pas de check-in soir'}
        />
      </div>

      {/* Mood */}
      {avgMood !== null && avgMood >= 1 && avgMood <= 5 && (
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
                backgroundColor: 'var(--color-surface-elevated)',
                color: cat?.hex ?? 'var(--color-text-muted)',
              }}
              title={a.title}
            >
              {a.title}
            </div>
          );
        })}
        {activities.length > 2 && (
          <p className="text-[8px] text-center" style={{ color: 'var(--color-text-dim)' }}>
            +{activities.length - 2}
          </p>
        )}

        {events.slice(0, 1).map((e) => (
          <EventBadge key={e.id} event={e} />
        ))}
        {events.length > 1 && (
          <p className="text-[8px] text-center" style={{ color: 'var(--color-text-dim)' }}>
            +{events.length - 1}
          </p>
        )}
      </div>
    </div>
  );
}
