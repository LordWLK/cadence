'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { getDateRangeISO, groupByDate, formatDateISO } from '@/lib/utils/dates';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChartData {
  date: string;
  label: string;
  mood?: number;
  energy?: number;
  moodMorning?: number;
  moodEvening?: number;
}

export function MoodChart() {
  const { getByDateRange } = useCheckins();
  const [data, setData] = useState<ChartData[]>([]);
  const [range, setRange] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { startISO, endISO } = getDateRangeISO(range);
      const checkins = await getByDateRange(startISO, endISO);

      const grouped = groupByDate(checkins);

      const end = new Date();
      const chartData: ChartData[] = [];
      // Exactement `range` points (7 ou 30), du plus ancien à aujourd'hui inclus.
      for (let i = 0; i < range; i++) {
        const d = subDays(end, range - 1 - i);
        const dateStr = formatDateISO(d);
        const dayCheckins = grouped[dateStr] || [];
        const morning = dayCheckins.find(c => c.type === 'morning');
        const evening = dayCheckins.find(c => c.type === 'evening');
        const avgMood = dayCheckins.length > 0
          ? dayCheckins.reduce((sum, c) => sum + c.mood, 0) / dayCheckins.length
          : undefined;
        const avgEnergy = dayCheckins.length > 0
          ? dayCheckins.reduce((sum, c) => sum + c.energy, 0) / dayCheckins.length
          : undefined;

        chartData.push({
          date: dateStr,
          label: format(d, range === 7 ? 'EEE' : 'dd/MM', { locale: fr }),
          mood: avgMood ? Math.round(avgMood * 10) / 10 : undefined,
          energy: avgEnergy ? Math.round(avgEnergy * 10) / 10 : undefined,
          moodMorning: morning?.mood,
          moodEvening: evening?.mood,
        });
      }

      setData(chartData);
      setLoading(false);
    };
    load();
  }, [range, getByDateRange]);

  if (loading) {
    return (
      <div className="h-52 bg-surface-alt rounded-2xl animate-pulse" />
    );
  }

  if (data.every(d => d.mood === undefined)) {
    return (
      <div className="h-52 bg-surface-alt rounded-2xl flex items-center justify-center text-text-muted text-sm">
        Pas encore de donnees. Fais ton premier check-in !
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setRange(7)}
          className={`px-3 py-1 rounded-[3px] text-sm brut-press ${
            range === 7
              ? 'bg-[var(--color-action)] text-[#16150F] border-2 border-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] font-bold'
              : 'text-text-muted hover:text-text border border-[var(--color-border)]'
          }`}
        >
          7 jours
        </button>
        <button
          onClick={() => setRange(30)}
          className={`px-3 py-1 rounded-[3px] text-sm brut-press ${
            range === 30
              ? 'bg-[var(--color-action)] text-[#16150F] border-2 border-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] font-bold'
              : 'text-text-muted hover:text-text border border-[var(--color-border)]'
          }`}
        >
          30 jours
        </button>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D33A24" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#D33A24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#274690" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#274690" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-dim)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="mood"
              domain={[1, 5]}
              tick={{ fontSize: 10, fill: 'var(--color-text-dim)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="energy"
              orientation="right"
              domain={[1, 10]}
              tick={{ fontSize: 10, fill: 'var(--color-text-dim)' }}
              axisLine={false}
              tickLine={false}
              hide
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '12px',
                color: 'var(--color-text)',
              }}
              formatter={(value, name) => [
                String(value ?? ''),
                name === 'mood' ? 'Humeur' : 'Energie',
              ]}
            />
            <Area
              yAxisId="mood"
              type="monotone"
              dataKey="mood"
              stroke="#D33A24"
              fill="url(#moodGrad)"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3, fill: '#D33A24' }}
            />
            <Area
              yAxisId="energy"
              type="monotone"
              dataKey="energy"
              stroke="#274690"
              fill="url(#energyGrad)"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3, fill: '#274690' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D33A24]" />
          <span className="text-text-muted">Humeur (1-5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#274690]" />
          <span className="text-text-muted">Energie (1-10)</span>
        </div>
      </div>
    </div>
  );
}
