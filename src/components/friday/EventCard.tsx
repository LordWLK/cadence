'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SPORT_COLORS } from '@/lib/config/constants';
import { Plus, Check, Star, Flame } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SportFeedEvent } from '@/lib/hooks/useSportFeed';

interface EventCardProps {
  event: SportFeedEvent;
  onAdd: (event: SportFeedEvent) => void;
  isAdded: boolean;
}

export function EventCard({ event, onAdd, isAdded }: EventCardProps) {
  const colorClass = SPORT_COLORS[event.sport] || 'sport-football';
  const sportLabel = event.sport === 'football' ? 'Football' : event.sport === 'basketball' ? 'NBA' : 'MMA';

  let dateStr = '';
  try {
    const d = parseISO(event.date);
    dateStr = format(d, "EEEE dd MMM 'a' HH:mm", { locale: fr });
  } catch {
    dateStr = event.date;
  }

  return (
    <div className={`bg-surface-alt rounded-2xl border-l-4 border-${colorClass} p-3 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant={event.sport === 'football' ? 'football' : event.sport === 'basketball' ? 'basketball' : 'mma'}>
              {sportLabel}
            </Badge>
            {event.isFavorite && (
              <Star size={12} className="text-warning fill-warning" />
            )}
            {event.isBigMatch && (
              <Flame size={12} className="text-error fill-error" />
            )}
          </div>
          <p className="text-sm font-medium">{event.title}</p>
          <p className="text-xs text-text-muted">{event.competition}</p>
          <p className="text-xs text-text-dim capitalize">{dateStr}</p>
        </div>
        <button
          onClick={() => !isAdded && onAdd(event)}
          disabled={isAdded}
          className={`shrink-0 p-2 rounded-xl transition-all ${
            isAdded
              ? 'bg-success/10 text-success'
              : `bg-${colorClass}/10 text-${colorClass} hover:bg-${colorClass}/20`
          }`}
        >
          {isAdded ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>
    </div>
  );
}
