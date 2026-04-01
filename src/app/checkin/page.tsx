'use client';

import { useState, useEffect } from 'react';
import { CheckinForm } from '@/components/checkin/CheckinForm';
import { Card } from '@/components/ui/Card';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useAuth } from '@/providers/AuthProvider';
import { MOOD_EMOJIS } from '@/lib/config/constants';
import { Sun, Moon, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { Checkin } from '@/lib/supabase/types';

export default function CheckinPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { getToday } = useCheckins();
  const [todayCheckins, setTodayCheckins] = useState<Checkin[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      getToday().then(setTodayCheckins);
    }
  }, [user, getToday, refreshKey]);

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
        <h1 className="text-2xl font-bold">Check-in</h1>
        <Card className="text-center py-8 space-y-4">
          <p className="text-[var(--color-text-muted)]">Connecte-toi pour enregistrer tes check-ins</p>
          <Link href="/login">
            <Button><LogIn size={16} /> Se connecter</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const hasMorning = todayCheckins.some(c => c.type === 'morning');
  const hasEvening = todayCheckins.some(c => c.type === 'evening');

  return (
    <div className="space-y-6 animate-stagger">
      <div>
        <h1 className="text-2xl font-bold">Check-in</h1>
        <p className="text-text-muted text-sm mt-1">Comment tu te sens ?</p>
      </div>

      {todayCheckins.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-dim uppercase tracking-wide">Aujourd'hui</p>
          <div className="flex gap-2">
            {todayCheckins.map((c) => (
              <Card key={c.id} className="flex-1">
                <div className="flex items-center gap-2">
                  {c.type === 'morning' ? <Sun size={14} className="text-warning" /> : <Moon size={14} className="text-accent-light" />}
                  <span className="text-xs text-text-muted">{c.type === 'morning' ? 'Matin' : 'Soir'}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl">{MOOD_EMOJIS[c.mood - 1]}</span>
                  <span className="text-sm text-text-muted">Energie: {c.energy}/10</span>
                </div>
                {c.note && <p className="text-xs text-text-muted mt-1 line-clamp-2">{c.note}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!hasMorning || !hasEvening) && (
        <CheckinForm onSuccess={() => setRefreshKey(k => k + 1)} />
      )}

      {hasMorning && hasEvening && (
        <Card className="text-center py-6 space-y-2">
          <p className="text-2xl">✅</p>
          <p className="font-medium">Check-ins du jour termines !</p>
          <p className="text-sm text-text-muted">Reviens demain pour continuer ton suivi.</p>
        </Card>
      )}
    </div>
  );
}
