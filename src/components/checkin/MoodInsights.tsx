'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useActivities } from '@/lib/hooks/useActivities';
import { useAuth } from '@/providers/AuthProvider';
import { ACTIVITY_CATEGORIES, MOOD_EMOJIS } from '@/lib/config/constants';
import { TrendingUp, TrendingDown, Activity, Dumbbell, Users, Lightbulb, Coffee, Tv, Sparkles } from 'lucide-react';
import { subDays, format } from 'date-fns';
import type { Checkin } from '@/lib/supabase/types';
import type { WeeklyActivity } from '@/lib/supabase/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Tv, Users, Lightbulb, Coffee, Sparkles,
};

interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  text: string;
  detail: string;
}

export function MoodInsights() {
  const { user } = useAuth();
  const { getByDateRange } = useCheckins();
  const { getByDateRange: getActivitiesByRange } = useActivities();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const end = new Date();
      const start = subDays(end, 30);
      const startISO = format(start, 'yyyy-MM-dd');
      const endISO = format(end, 'yyyy-MM-dd');
      const [c, a] = await Promise.all([
        getByDateRange(startISO, endISO),
        getActivitiesByRange(startISO, endISO),
      ]);
      setCheckins(c);
      setActivities(a);
      setLoading(false);
    };
    load();
  }, [user, getByDateRange, getActivitiesByRange]);

  const insights = useMemo(() => {
    if (checkins.length < 5) return []; // Need enough data

    const result: Insight[] = [];

    // Average mood by date
    const moodByDate: Record<string, number> = {};
    const checkinsByDate: Record<string, Checkin[]> = {};
    for (const c of checkins) {
      if (!checkinsByDate[c.date]) checkinsByDate[c.date] = [];
      checkinsByDate[c.date].push(c);
    }
    for (const [date, dayCheckins] of Object.entries(checkinsByDate)) {
      moodByDate[date] = dayCheckins.reduce((s, c) => s + c.mood, 0) / dayCheckins.length;
    }

    // Activities by date
    const activityDateSet: Record<string, Set<string>> = {};
    for (const a of activities) {
      if (!activityDateSet[a.planned_date]) activityDateSet[a.planned_date] = new Set();
      activityDateSet[a.planned_date].add(a.category);
    }

    // Compare mood on days WITH activity category vs WITHOUT
    for (const cat of ACTIVITY_CATEGORIES) {
      const daysWithCat: number[] = [];
      const daysWithoutCat: number[] = [];

      for (const [date, mood] of Object.entries(moodByDate)) {
        if (activityDateSet[date]?.has(cat.id)) {
          daysWithCat.push(mood);
        } else {
          daysWithoutCat.push(mood);
        }
      }

      if (daysWithCat.length >= 2 && daysWithoutCat.length >= 2) {
        const avgWith = daysWithCat.reduce((a, b) => a + b, 0) / daysWithCat.length;
        const avgWithout = daysWithoutCat.reduce((a, b) => a + b, 0) / daysWithoutCat.length;
        const diff = avgWith - avgWithout;
        const IconComp = ICON_MAP[cat.icon] || Activity;

        if (diff >= 0.5) {
          result.push({
            type: 'positive',
            icon: IconComp,
            text: `${cat.label} te rend plus heureux`,
            detail: `${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)} les autres jours`,
          });
        } else if (diff <= -0.5) {
          result.push({
            type: 'negative',
            icon: IconComp,
            text: `${cat.label} : humeur plus basse`,
            detail: `${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)} les autres jours`,
          });
        }
      }
    }

    // Morning vs evening mood comparison
    const mornings = checkins.filter(c => c.type === 'morning');
    const evenings = checkins.filter(c => c.type === 'evening');
    if (mornings.length >= 3 && evenings.length >= 3) {
      const avgMorning = mornings.reduce((s, c) => s + c.mood, 0) / mornings.length;
      const avgEvening = evenings.reduce((s, c) => s + c.mood, 0) / evenings.length;
      const diff = avgEvening - avgMorning;
      if (Math.abs(diff) >= 0.3) {
        result.push({
          type: diff > 0 ? 'positive' : 'negative',
          icon: diff > 0 ? TrendingUp : TrendingDown,
          text: diff > 0
            ? 'Ton humeur augmente dans la journee'
            : 'Ton humeur baisse dans la journee',
          detail: `Matin ${avgMorning.toFixed(1)} → Soir ${avgEvening.toFixed(1)}`,
        });
      }
    }

    // Average energy insight
    if (checkins.length >= 5) {
      const avgEnergy = checkins.reduce((s, c) => s + c.energy, 0) / checkins.length;
      const avgMood = checkins.reduce((s, c) => s + c.mood, 0) / checkins.length;
      result.push({
        type: 'neutral',
        icon: Activity,
        text: `Moyenne : ${MOOD_EMOJIS[Math.round(avgMood) - 1]} humeur, ${avgEnergy.toFixed(0)}/10 energie`,
        detail: `Sur ${checkins.length} check-ins ce mois`,
      });
    }

    return result;
  }, [checkins, activities]);

  if (loading || insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-dim uppercase tracking-wide">Insights</p>
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        const color = insight.type === 'positive' ? 'var(--color-success)'
          : insight.type === 'negative' ? 'var(--color-error)'
          : 'var(--color-text-muted)';

        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface-elevated)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-medium">{insight.text}</p>
              <p className="text-xs text-text-dim">{insight.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
