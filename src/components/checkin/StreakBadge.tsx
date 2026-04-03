'use client';

import { useState, useEffect } from 'react';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useAuth } from '@/providers/AuthProvider';
import { calculateStreak } from '@/lib/utils/streak';
import { Flame, TrendingUp } from 'lucide-react';
import { getDateRangeISO } from '@/lib/utils/dates';

export function StreakBadge() {
  const { user } = useAuth();
  const { getByDateRange } = useCheckins();
  const [streak, setStreak] = useState({ current: 0, longest: 0, todayDone: false });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { startISO, endISO } = getDateRangeISO(365);
      const checkins = await getByDateRange(startISO, endISO);
      setStreak(calculateStreak(checkins));
    };
    load();
  }, [user, getByDateRange]);

  if (streak.current === 0 && !streak.todayDone) {
    return null; // Don't show if no streak
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ backgroundColor: 'var(--color-surface-elevated)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: streak.current >= 7
            ? 'color-mix(in srgb, #ef4444 15%, transparent)'
            : 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        }}
      >
        <Flame
          size={20}
          style={{
            color: streak.current >= 7 ? '#ef4444' : 'var(--color-warning)',
          }}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold">{streak.current}</span>
          <span className="text-xs text-text-muted">
            {streak.current === 1 ? 'jour' : 'jours'}
          </span>
        </div>
        <p className="text-[10px] text-text-dim">
          {streak.todayDone ? 'Continue demain !' : "Fais ton check-in pour garder le streak !"}
        </p>
      </div>
      {streak.longest > streak.current && (
        <div className="text-right">
          <div className="flex items-center gap-1 text-text-dim">
            <TrendingUp size={12} />
            <span className="text-xs font-medium">{streak.longest}</span>
          </div>
          <p className="text-[9px] text-text-dim">record</p>
        </div>
      )}
    </div>
  );
}
