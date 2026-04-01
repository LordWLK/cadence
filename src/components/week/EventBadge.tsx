import { SPORT_HEX } from '@/lib/config/constants';
import type { SelectedEvent } from '@/lib/supabase/types';

interface EventBadgeProps {
  event: SelectedEvent;
}

export function EventBadge({ event }: EventBadgeProps) {
  const hex = SPORT_HEX[event.sport] || '#16a34a';

  return (
    <div
      className="text-[8px] leading-tight px-1 py-0.5 rounded truncate"
      style={{
        borderLeft: `2px solid ${hex}`,
        backgroundColor: `${hex}18`,
        color: hex,
      }}
      title={event.event_title}
    >
      {event.event_title}
    </div>
  );
}
