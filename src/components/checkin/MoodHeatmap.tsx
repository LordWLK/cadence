'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useAuth } from '@/providers/AuthProvider';
import { MOOD_HEX } from '@/lib/config/constants';
import { subDays, format, startOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Checkin } from '@/lib/supabase/types';

export function MoodHeatmap() {
  const { user } = useAuth();
  const { getByDateRange } = useCheckins();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const end = new Date();
      const start = subDays(end, 90);
      const data = await getByDateRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      setCheckins(data);
      setLoading(false);
    };
    load();
  }, [user, getByDateRange]);

  const { grid, months } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 90);
    // Align to week start (Monday)
    const gridStart = startOfWeek(start, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridStart, end });

    // Group checkins by date
    const byDate: Record<string, Checkin[]> = {};
    for (const c of checkins) {
      if (!byDate[c.date]) byDate[c.date] = [];
      byDate[c.date].push(c);
    }

    // Build grid: array of weeks, each week has 7 days
    const weeks: Array<Array<{ date: string; mood: number | null; isInRange: boolean }>> = [];
    let currentWeek: Array<{ date: string; mood: number | null; isInRange: boolean }> = [];

    for (const day of days) {
      const iso = format(day, 'yyyy-MM-dd');
      const dayCheckins = byDate[iso] || [];
      const avgMood = dayCheckins.length > 0
        ? Math.round(dayCheckins.reduce((s, c) => s + c.mood, 0) / dayCheckins.length)
        : null;
      const isInRange = day >= start && day <= end;

      currentWeek.push({ date: iso, mood: avgMood, isInRange });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Extract month labels
    const monthLabels: Array<{ label: string; col: number }> = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      const firstDay = new Date(weeks[w][0].date);
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: format(firstDay, 'MMM', { locale: fr }),
          col: w,
        });
        lastMonth = month;
      }
    }

    return { grid: weeks, months: monthLabels };
  }, [checkins]);

  if (loading) {
    return <div className="h-28 bg-surface-alt rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim uppercase tracking-wide">90 derniers jours</p>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-text-dim">Triste</span>
          {MOOD_HEX.map((hex, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: hex }}
            />
          ))}
          <span className="text-[9px] text-text-dim">Super</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] pl-5 text-[9px] text-text-dim">
        {months.map((m, i) => (
          <span
            key={i}
            style={{ marginLeft: i === 0 ? `${m.col * 13}px` : undefined }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-[3px] overflow-x-auto">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] shrink-0 text-[9px] text-text-dim pt-0.5">
          <span className="h-[10px]">L</span>
          <span className="h-[10px]"></span>
          <span className="h-[10px]">M</span>
          <span className="h-[10px]"></span>
          <span className="h-[10px]">V</span>
          <span className="h-[10px]"></span>
          <span className="h-[10px]">D</span>
        </div>

        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const bgColor = !day.isInRange
                ? 'transparent'
                : day.mood !== null
                  ? MOOD_HEX[day.mood - 1]
                  : 'var(--color-border)';
              return (
                <div
                  key={day.date}
                  className="w-[10px] h-[10px] rounded-sm transition-colors"
                  style={{ backgroundColor: bgColor }}
                  title={day.mood !== null
                    ? `${day.date}: humeur ${day.mood}/5`
                    : `${day.date}: pas de check-in`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
