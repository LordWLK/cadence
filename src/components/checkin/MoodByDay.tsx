'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useAuth } from '@/providers/AuthProvider';
import { MOOD_EMOJIS } from '@/lib/config/constants';
import { getDateRangeISO } from '@/lib/utils/dates';
import { getDay } from 'date-fns';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function MoodByDay() {
  const { user } = useAuth();
  const { getByDateRange } = useCheckins();
  const [dayData, setDayData] = useState<{ avg: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { startISO, endISO } = getDateRangeISO(90);
      const checkins = await getByDateRange(startISO, endISO);

      // Group by day of week (0=Monday ... 6=Sunday)
      const buckets: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
      for (const c of checkins) {
        const jsDay = getDay(new Date(c.date)); // 0=Sunday
        const idx = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0
        buckets[idx].sum += c.mood;
        buckets[idx].count++;
      }

      setDayData(buckets.map(b => ({
        avg: b.count > 0 ? b.sum / b.count : 0,
        count: b.count,
      })));
      setLoading(false);
    };
    load();
  }, [user, getByDateRange]);

  if (loading || dayData.every(d => d.count === 0)) return null;

  const maxAvg = Math.max(...dayData.filter(d => d.count > 0).map(d => d.avg));
  const minAvg = Math.min(...dayData.filter(d => d.count > 0).map(d => d.avg));
  const lowDay = dayData.findIndex(d => d.count > 0 && d.avg === minAvg);
  const highDay = dayData.findIndex(d => d.count > 0 && d.avg === maxAvg);

  // Color interpolation from red (mood 1) to green (mood 5)
  const getBarColor = (avg: number) => {
    if (avg === 0) return 'var(--color-border)';
    if (avg >= 4) return 'var(--color-mood-5)';
    if (avg >= 3.5) return 'var(--color-mood-4)';
    if (avg >= 2.5) return 'var(--color-mood-3)';
    if (avg >= 1.5) return 'var(--color-mood-2)';
    return 'var(--color-mood-1)';
  };

  return (
    <Card>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
        Tendance par jour
      </p>

      <div className="flex items-end gap-1.5" style={{ height: '100px' }}>
        {dayData.map((d, i) => {
          const height = d.count > 0 ? Math.max(20, (d.avg / 5) * 100) : 10;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-lg transition-all relative"
                style={{
                  height: `${height}%`,
                  backgroundColor: getBarColor(d.avg),
                  opacity: d.count > 0 ? 1 : 0.3,
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: i === lowDay ? 'var(--color-mood-1)' : i === highDay ? 'var(--color-mood-5)' : 'var(--color-text-dim)',
                }}
              >
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {lowDay !== highDay && dayData[lowDay].count >= 2 && (
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
          {MOOD_EMOJIS[Math.round(dayData[highDay].avg) - 1]} Meilleur jour : <strong>{DAY_LABELS[highDay]}</strong>
          {' · '}
          {MOOD_EMOJIS[Math.round(dayData[lowDay].avg) - 1]} Plus dur : <strong>{DAY_LABELS[lowDay]}</strong>
        </p>
      )}
    </Card>
  );
}
