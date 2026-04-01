'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useActivities } from '@/lib/hooks/useActivities';
import { useAuth } from '@/providers/AuthProvider';
import { Card } from '@/components/ui/Card';
import { MOOD_EMOJIS, ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { getWeekStart, getWeekEnd, formatDateISO } from '@/lib/utils/dates';
import { TrendingUp, TrendingDown, Minus, Calendar, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Checkin, WeeklyActivity } from '@/lib/supabase/types';

export function WeeklyRecap() {
  const { user } = useAuth();
  const { getByDateRange: getCheckins } = useCheckins();
  const { getByWeek } = useActivities();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [prevCheckins, setPrevCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const weekStart = useMemo(() => getWeekStart(), []);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const wsISO = useMemo(() => formatDateISO(weekStart), [weekStart]);
  const weISO = useMemo(() => formatDateISO(weekEnd), [weekEnd]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const prevStart = formatDateISO(subDays(weekStart, 7));
      const prevEnd = formatDateISO(subDays(weekStart, 1));
      const [c, a, pc] = await Promise.all([
        getCheckins(wsISO, weISO),
        getByWeek(wsISO),
        getCheckins(prevStart, prevEnd),
      ]);
      setCheckins(c);
      setActivities(a);
      setPrevCheckins(pc);
      setLoading(false);
    };
    load();
  }, [user, wsISO, weISO, getCheckins, getByWeek, weekStart]);

  const stats = useMemo(() => {
    if (checkins.length === 0) return null;

    const avgMood = checkins.reduce((s, c) => s + c.mood, 0) / checkins.length;
    const avgEnergy = checkins.reduce((s, c) => s + c.energy, 0) / checkins.length;
    const checkinDays = new Set(checkins.map(c => c.date)).size;

    // Previous week comparison
    const prevAvgMood = prevCheckins.length > 0
      ? prevCheckins.reduce((s, c) => s + c.mood, 0) / prevCheckins.length
      : null;
    const moodTrend = prevAvgMood !== null ? avgMood - prevAvgMood : 0;

    // Best day
    const byDate: Record<string, number[]> = {};
    for (const c of checkins) {
      if (!byDate[c.date]) byDate[c.date] = [];
      byDate[c.date].push(c.mood);
    }
    let bestDate = '';
    let bestMood = 0;
    for (const [date, moods] of Object.entries(byDate)) {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      if (avg > bestMood) { bestMood = avg; bestDate = date; }
    }

    // Activity categories count
    const catCounts: Record<string, number> = {};
    for (const a of activities) {
      catCounts[a.category] = (catCounts[a.category] || 0) + 1;
    }

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      checkinDays,
      totalCheckins: checkins.length,
      moodTrend,
      bestDate,
      bestMood: Math.round(bestMood * 10) / 10,
      activitiesCount: activities.length,
      catCounts,
    };
  }, [checkins, prevCheckins, activities]);

  const handleShare = async () => {
    if (!stats) return;
    const moodEmoji = MOOD_EMOJIS[Math.round(stats.avgMood) - 1] || '😐';
    const trendText = stats.moodTrend > 0.2 ? '📈' : stats.moodTrend < -0.2 ? '📉' : '➡️';

    const text = [
      `${moodEmoji} Ma semaine Cadence`,
      ``,
      `Humeur : ${stats.avgMood}/5 ${trendText}`,
      `Energie : ${stats.avgEnergy}/10`,
      `Check-ins : ${stats.totalCheckins} sur ${stats.checkinDays} jours`,
      stats.activitiesCount > 0 ? `Activites : ${stats.activitiesCount}` : '',
      ``,
      `cadence-one-chi.vercel.app`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ma semaine Cadence', text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  if (loading || !stats) return null;

  const moodEmoji = MOOD_EMOJIS[Math.round(stats.avgMood) - 1] || '😐';
  const TrendIcon = stats.moodTrend > 0.2 ? TrendingUp : stats.moodTrend < -0.2 ? TrendingDown : Minus;
  const trendColor = stats.moodTrend > 0.2 ? 'var(--color-success)' : stats.moodTrend < -0.2 ? 'var(--color-error)' : 'var(--color-text-dim)';

  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{moodEmoji}</span>
          <div className="text-left">
            <p className="text-sm font-semibold">Recap de la semaine</p>
            <p className="text-xs text-text-dim">
              {format(weekStart, 'dd MMM', { locale: fr })} — {format(weekEnd, 'dd MMM', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon size={14} />
            <span className="text-xs font-medium">{stats.avgMood}/5</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="text-lg font-bold">{stats.avgMood}</p>
              <p className="text-[10px] text-text-dim">Humeur /5</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="text-lg font-bold">{stats.avgEnergy}</p>
              <p className="text-[10px] text-text-dim">Energie /10</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="text-lg font-bold">{stats.checkinDays}<span className="text-xs font-normal text-text-dim">/7</span></p>
              <p className="text-[10px] text-text-dim">Jours</p>
            </div>
          </div>

          {/* Best day */}
          {stats.bestDate && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar size={12} />
              <span>
                Meilleur jour : <strong>{format(new Date(stats.bestDate), 'EEEE', { locale: fr })}</strong> ({stats.bestMood}/5)
              </span>
            </div>
          )}

          {/* Activities breakdown */}
          {stats.activitiesCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stats.catCounts).map(([catId, count]) => {
                const cat = ACTIVITY_CATEGORIES.find(c => c.id === catId);
                return (
                  <span
                    key={catId}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${cat?.hex || '#6b6355'}18`,
                      color: cat?.hex || 'var(--color-text-muted)',
                    }}
                  >
                    {cat?.label || catId} x{count}
                  </span>
                );
              })}
            </div>
          )}

          {/* Trend vs last week */}
          {stats.moodTrend !== 0 && (
            <p className="text-xs text-text-dim">
              {stats.moodTrend > 0.2
                ? `📈 +${stats.moodTrend.toFixed(1)} par rapport a la semaine derniere`
                : stats.moodTrend < -0.2
                  ? `📉 ${stats.moodTrend.toFixed(1)} par rapport a la semaine derniere`
                  : 'Stable par rapport a la semaine derniere'}
            </p>
          )}

          {/* Share button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            <Share2 size={12} />
            Partager
          </button>
        </div>
      )}
    </Card>
  );
}
