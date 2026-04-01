import { SPORT_COLORS } from '@/lib/config/constants';
import type { SelectedEvent } from '@/lib/supabase/types';

interface EventBadgeProps {
  event: SelectedEvent;
}

export function EventBadge({ event }: EventBadgeProps) {
  const colorClass = SPORT_COLORS[event.sport] || 'sport-football';

  return (
    <div
      className={`text-[8px] leading-tight px-1 py-0.5 rounded border-l-2 border-${colorClass} bg-${colorClass}/10 truncate`}
      title={event.event_title}
    >
      <span className={`text-${colorClass}`}>{event.event_title}</span>
    </div>
  );
}
