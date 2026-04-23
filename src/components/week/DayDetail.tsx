'use client';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EventBadge } from './EventBadge';
import { ACTIVITY_CATEGORIES, MOOD_EMOJIS, MOOD_LABELS, SPORT_HEX } from '@/lib/config/constants';
import { formatDate, getDayName } from '@/lib/utils/dates';
import { X, Sun, Moon, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles, Zap, Eye, Pencil } from 'lucide-react';
import type { Checkin, WeeklyActivity, SelectedEvent } from '@/lib/supabase/types';
import type { ActivityShareInfo } from '@/lib/hooks/useActivityShares';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

interface DayDetailProps {
  date: Date;
  checkins: Checkin[];
  activities: WeeklyActivity[];
  events: SelectedEvent[];
  getShareInfo?: (activityId: string) => ActivityShareInfo | undefined;
  onClose: () => void;
}

export function DayDetail({ date, checkins, activities, events, getShareInfo, onClose }: DayDetailProps) {
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
            const info = getShareInfo?.(a.id);
            const isReceived = info?.isReceived ?? false;
            const isShared = info && info.sharedWith.length > 0;
            return (
              <div
                key={a.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  border: isReceived
                    ? '1px dashed color-mix(in srgb, var(--color-primary) 45%, transparent)'
                    : isShared
                      ? '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)'
                      : 'none',
                }}
              >
                <Icon size={14} style={{ color: cat?.hex || 'var(--color-text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[11px] truncate" style={{ color: cat?.hex || 'var(--color-text-dim)' }}>{cat?.label}</p>
                    {isReceived && info?.receivedFromProfile && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: 'var(--color-primary)' }}>
                        <Avatar profile={info.receivedFromProfile} size={12} />
                        <span>{info.receivedFromProfile.display_name || info.receivedFromProfile.email}</span>
                        {info.receivedShare?.can_edit ? <Pencil size={8} /> : <Eye size={8} />}
                      </span>
                    )}
                  </div>
                </div>
                {/* Avatars destinataires (si je suis proprio) */}
                {!isReceived && isShared && info && (
                  <div className="flex -space-x-1.5 shrink-0" title={`Partagé avec ${info.sharedWith.length}`}>
                    {info.sharedWith.slice(0, 3).map(({ profile, share }) => (
                      <Avatar
                        key={share.id}
                        profile={profile}
                        size={16}
                        className="ring-1"
                        title={profile.display_name || profile.email}
                      />
                    ))}
                    {info.sharedWith.length > 3 && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ring-1"
                           style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
                        +{info.sharedWith.length - 3}
                      </div>
                    )}
                  </div>
                )}
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
