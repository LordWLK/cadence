'use client';

import { useState, useEffect } from 'react';
import { MoodChart } from '@/components/checkin/MoodChart';
import { MoodHeatmap } from '@/components/checkin/MoodHeatmap';
import { MoodInsights } from '@/components/checkin/MoodInsights';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useAuth } from '@/providers/AuthProvider';
import { MOOD_EMOJIS } from '@/lib/config/constants';
import { SearchNotes } from '@/components/checkin/SearchNotes';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { exportCheckinsCSV, exportCheckinsJSON } from '@/lib/utils/export';
import { Sun, Moon, LogIn, Download, FileJson, Heart } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import type { Checkin } from '@/lib/supabase/types';

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { getByDateRange } = useCheckins();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const end = new Date();
      const start = subDays(end, 30);
      const data = await getByDateRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      setCheckins(data);
      setLoading(false);
    };
    load();
  }, [user, getByDateRange]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-7 h-7 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Historique</h1>
        <Card className="text-center py-8 space-y-4">
          <p className="text-[var(--color-text-muted)]">Connecte-toi pour voir ton historique</p>
          <Link href="/login"><Button><LogIn size={16} /> Se connecter</Button></Link>
        </Card>
      </div>
    );
  }

  const loadCheckins = async () => {
    setLoading(true);
    const end = new Date();
    const start = subDays(end, 30);
    const data = await getByDateRange(
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    );
    setCheckins(data);
    setLoading(false);
  };

  const grouped: Record<string, Checkin[]> = {};
  for (const c of [...checkins].reverse()) {
    if (!grouped[c.date]) grouped[c.date] = [];
    grouped[c.date].push(c);
  }

  return (
    <PullToRefresh onRefresh={loadCheckins}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historique</h1>
          <p className="text-text-muted text-sm mt-1">Ton humeur et ton energie</p>
        </div>
        {checkins.length > 0 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExport(!showExport)}
              aria-label="Exporter les donnees"
            >
              <Download size={16} />
            </Button>
            {showExport && (
              <div
                className="absolute right-0 top-10 z-20 rounded-xl shadow-lg border p-1 space-y-1 min-w-[160px]"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <button
                  onClick={() => { exportCheckinsCSV(checkins); setShowExport(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface-alt transition-colors text-left"
                >
                  <Download size={14} className="text-text-dim" />
                  Exporter en CSV
                </button>
                <button
                  onClick={() => { exportCheckinsJSON(checkins); setShowExport(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface-alt transition-colors text-left"
                >
                  <FileJson size={14} className="text-text-dim" />
                  Exporter en JSON
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <SearchNotes />

      <Card>
        <MoodChart />
      </Card>

      <Card>
        <MoodHeatmap />
      </Card>

      <MoodInsights />

      <div className="space-y-3">
        <p className="text-xs text-text-dim uppercase tracking-wide">Detail par jour</p>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-alt rounded-2xl animate-pulse" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card className="text-center py-8 space-y-3">
            <Heart size={28} className="text-text-dim mx-auto" />
            <p className="text-text-muted text-sm">Aucun check-in pour le moment</p>
            <p className="text-text-dim text-xs">Fais ton premier check-in pour commencer le suivi !</p>
            <Link href="/checkin">
              <Button variant="secondary" size="sm">
                <Heart size={14} /> Faire un check-in
              </Button>
            </Link>
          </Card>
        ) : (
          Object.entries(grouped).map(([date, dayCheckins]) => (
            <Card key={date}>
              <p className="text-xs text-text-dim mb-2">
                {format(new Date(date), 'EEEE dd MMMM', { locale: fr })}
              </p>
              <div className="space-y-2">
                {dayCheckins.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {c.type === 'morning' ? <Sun size={14} className="text-warning" /> : <Moon size={14} className="text-accent-light" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{MOOD_EMOJIS[c.mood - 1]}</span>
                        <span className="text-xs text-text-muted">Energie: {c.energy}/10</span>
                      </div>
                      {c.note && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{c.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}
