'use client';

import { useState, useEffect } from 'react';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useAuth } from '@/providers/AuthProvider';
import { calculateStreak } from '@/lib/utils/streak';
import { Flame, TrendingUp } from 'lucide-react';
import { getDateRangeISO } from '@/lib/utils/dates';
import Link from 'next/link';

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

  // Bloc « héros » du thème : jaune Brut (il est cliquable → mène à l'historique),
  // gros chiffre en serif display façon gazette.
  return (
    <Link
      href="/checkin/history"
      className="flex items-center gap-3 px-4 py-3 rounded-[3px] brut-press border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)]"
      style={{ backgroundColor: 'var(--color-action)', color: '#16150F' }}
    >
      <Flame size={22} strokeWidth={2.25} />
      <div className="flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold leading-none">{streak.current}</span>
          <span className="text-xs font-bold uppercase tracking-wide">
            {streak.current === 1 ? 'jour de série' : 'jours de série'}
          </span>
        </div>
        <p className="text-[10px] font-medium opacity-70 mt-0.5">
          {streak.todayDone ? 'Continue demain !' : 'Fais ton check-in pour garder la série !'}
        </p>
      </div>
      {streak.longest > streak.current && (
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <TrendingUp size={12} />
            <span className="font-display text-sm font-bold">{streak.longest}</span>
          </div>
          <p className="text-[9px] font-medium opacity-70">record</p>
        </div>
      )}
    </Link>
  );
}
