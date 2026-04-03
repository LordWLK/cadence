'use client';

import { Card } from '@/components/ui/Card';
import { EventBadge } from './EventBadge';
import { ACTIVITY_CATEGORIES, MOOD_EMOJIS, MOOD_LABELS, SPORT_HEX } from '@/lib/config/constants';
import { formatDate, getDayName } from '@/lib/utils/dates';
import { X, Sun, Moon, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles, Zap } from 'lucide-react';
import type { Checkin, WeeklyActivity, SelectedEvent } from '@/lib/supabase/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

interface DayDetailProps {
  date: Date;
  checkins: Checkin[];
  activities: WeeklyActivity[];
  events: SelectedEvent[];
  onClose: () => void;
}

export function DayDetail({ date, checkins, activities, events, onClose }: DayDetailProps) {
  const morning = checkins.find(c => c.type === 'morning');
  const evening = checkins.find(c => c.type === 'evening');

  return (
    <Card variant="elevated" className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold capitalize" style={{ color: 'var(--color-text)' }}>
            {getDayName(date)} {formatDate(date, 'dd MMMM')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-dim)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Check-ins */}
      {(morning || evening) && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Check-ins
          </p>
          {morning && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'color-mix(in srgb, #d97706 8%, transparent)' }}
            >
              <Sun size={14} style={{ color: '#d97706' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: '#d97706' }}>Matin</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm">{MOOD_EMOJIS[morning.mood - 1]}</span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {MOOD_LABELS[morning.mood - 1]}
                  </span>
                  <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    <Zap size={10} /> {morning.energy}/10
                  </span>
                </div>
                {morning.note && (
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                    {morning.note}
                  </p>
                )}
              </div>
            </div>
          )}
          {evening && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'color-mix(in srgb, #4f46e5 8%, transparent)' }}
            >
              <Moon size={14} style={{ color: '#4f46e5' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: '#4f46e5' }}>Soir</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm">{MOOD_EMOJIS[evening.mood - 1]}</span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {MOOD_LABELS[evening.mood - 1]}
                  </span>
                  <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    <Zap size={10} /> {evening.energy}/10
                  </span>
                </div>
                {evening.note && (
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                    {evening.note}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activités */}
      {activities.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Activités ({activities.length})
          </p>
          {activities.map(a => {
            const cat = ACTIVITY_CATEGORIES.find(c => c.id === a.category);
            const Icon = cat ? (ICON_MAP[cat.icon] || Sparkles) : Sparkles;
            return (
              <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <Icon size={14} style={{ color: cat?.hex || 'var(--color-text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.title}</p>
                  <p className="text-[11px]" style={{ color: cat?.hex || 'var(--color-text-dim)' }}>{cat?.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Événements */}
      {events.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-dim)' }}>
            Événements ({events.length})
          </p>
          {events.map(e => {
            const hex = SPORT_HEX[e.sport] || 'var(--color-primary)';
            return (
              <div
                key={e.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: `${hex}10`,
                  borderLeft: `3px solid ${hex}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: hex }}>{e.event_title}</p>
                  {e.competition && (
                    <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>{e.competition}</p>
                  )}
                </div>
                {e.event_date.includes('T') && (
                  <span className="text-[11px] font-medium" style={{ color: hex }}>
                    {e.event_date.split('T')[1]?.slice(0, 5)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rien */}
      {!morning && !evening && activities.length === 0 && events.length === 0 && (
        <p className="text-xs text-center py-3" style={{ color: 'var(--color-text-dim)' }}>
          Rien de prévu pour cette journée
        </p>
      )}
    </Card>
  );
}
