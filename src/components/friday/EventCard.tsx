'use client';

import { Badge } from '@/components/ui/Badge';
import { SPORT_HEX } from '@/lib/config/constants';
import { Plus, Check, Star, Flame } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SportFeedEvent } from '@/lib/hooks/useSportFeed';

interface EventCardProps {
  event: SportFeedEvent;
  onToggle: (event: SportFeedEvent) => void;
  isAdded: boolean;
}

export function EventCard({ event, onToggle, isAdded }: EventCardProps) {
  const hex = SPORT_HEX[event.sport] || '#16a34a';
  const sportLabel = event.sport === 'football' ? 'Football' : event.sport === 'basketball' ? 'NBA' : 'MMA';

  let dateStr = '';
  try {
    const d = parseISO(event.date);
    dateStr = format(d, "EEEE dd MMM 'a' HH:mm", { locale: fr });
  } catch {
    dateStr = event.date;
  }

  return (
    <div
      className="rounded-2xl p-3 space-y-2"
      style={{
        backgroundColor: 'var(--color-surface-alt)',
        borderLeft: `4px solid ${hex}`,
      }}
    >
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
          onClick={() => onToggle(event)}
          aria-label={isAdded ? 'Retirer de ma semaine' : 'Ajouter a ma semaine'}
          className="shrink-0 p-2 rounded-xl transition-all active:scale-90"
          style={isAdded
            ? { backgroundColor: '#16a34a18', color: '#16a34a' }
            : { backgroundColor: `${hex}18`, color: hex }
          }
        >
          {isAdded ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} />}
        </button>
      </div>
    </div>
  );
}
