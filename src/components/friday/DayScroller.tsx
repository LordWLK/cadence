'use client';

import { useRef, useEffect } from 'react';
import { formatDate, formatDateISO, isToday } from '@/lib/utils/dates';

interface DayScrollerProps {
  days: Date[];
  selected: string;
  onChange: (iso: string) => void;
}

const CHIP = 'rounded-xl transition-all active:scale-95';
const CHIP_ON = 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]';
const CHIP_OFF = 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]';

export function DayScroller({ days, selected, onChange }: DayScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to selected or today on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const targetIso = selected || formatDateISO(new Date());
    const el = scrollRef.current.querySelector(`[data-day="${targetIso}"]`) as HTMLElement;
    if (el) {
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' });
    }
  }, []);

  // Group days by week for visual separation
  let currentWeekLabel = '';

  return (
    <div className="space-y-1.5">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {days.map((day) => {
          const iso = formatDateISO(day);
          const isSelected = selected === iso;
          const today = isToday(day);
          const weekLabel = formatDate(day, "'S'II");
          const showSep = weekLabel !== currentWeekLabel && currentWeekLabel !== '';
          currentWeekLabel = weekLabel;

          return (
            <div key={iso} className="flex items-center">
              {showSep && (
                <div className="w-px h-8 bg-[var(--color-border)] mx-1 shrink-0" />
              )}
              <button
                type="button"
                data-day={iso}
                onClick={() => onChange(isSelected ? '' : iso)}
                className={`flex flex-col items-center min-w-[3rem] py-2 px-1.5 text-xs ${CHIP} ${isSelected ? CHIP_ON : CHIP_OFF} ${today && !isSelected ? 'ring-1 ring-[var(--color-border)]' : ''}`}
              >
                <span className="font-medium capitalize">{formatDate(day, 'EEE')}</span>
                <span className="text-[10px]">{formatDate(day, 'dd')}</span>
                {today && (
                  <div className="w-1 h-1 rounded-full bg-[var(--color-primary)] mt-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
