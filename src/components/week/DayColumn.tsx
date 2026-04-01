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

  return (
    <div
      className="flex flex-col rounded-xl p-1.5 min-h-[128px] transition-all"
      style={{
        backgroundColor: isToday
          ? 'color-mix(in srgb, #7c3aed 10%, transparent)'
          : 'var(--color-surface-alt)',
        outline: isToday ? '1.5px solid color-mix(in srgb, #7c3aed 30%, transparent)' : 'none',
      }}
    >
      {/* Header: day name + date number */}
      <div className="text-center mb-1.5">
        <p
          className="text-[9px] font-semibold uppercase tracking-wide"
          style={{ color: isToday ? '#7c3aed' : 'var(--color-text-muted)' }}
        >
          {getDayShort(date)}
        </p>
        <p
          className="text-sm font-bold leading-tight"
          style={{ color: isToday ? '#7c3aed' : 'var(--color-text)' }}
        >
          {formatDate(date, 'dd')}
        </p>
      </div>

      {/* Check-in dots: matin (warning) + soir (accent) */}
      <div className="flex justify-center gap-1 mb-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: hasMorning
              ? 'var(--color-warning)'
              : 'var(--color-border)',
          }}
          title="Matin"
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: hasEvening
              ? 'var(--color-accent)'
              : 'var(--color-border)',
          }}
          title="Soir"
        />
      </div>

      {/* Mood emoji */}
      {avgMood && (
        <p className="text-center text-sm leading-none mb-1">{MOOD_EMOJIS[avgMood - 1]}</p>
      )}

      {/* Activities */}
      <div className="space-y-0.5 flex-1">
        {activities.slice(0, 2).map((a) => {
          const cat = ACTIVITY_CATEGORIES.find(c => c.id === a.category);
          return (
            <div
              key={a.id}
              className="text-[8px] leading-tight px-1 py-0.5 rounded truncate font-medium"
              style={{ backgroundColor: 'var(--color-surface-elevated)', color: cat?.hex ?? 'var(--color-text-muted)' }}
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
