'use client';

import { useState } from 'react';
import { MOOD_EMOJIS } from '@/lib/config/constants';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { hapticSelect, hapticSuccess, hapticError } from '@/lib/utils/haptics';
import { getTimeOfDay, getTodayISO } from '@/lib/utils/dates';
import { Check, AlertCircle } from 'lucide-react';

interface QuickCheckinProps {
  onDone?: () => void;
}

export function QuickCheckin({ onDone }: QuickCheckinProps) {
  const { create } = useCheckins();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleQuick = async (mood: number) => {
    if (saving) return;
    hapticSelect();
    setSaving(true);
    setFailed(false);
    const type = getTimeOfDay();
    const result = await create({
      type,
      mood,
      energy: 5,
      note: null,
      date: getTodayISO(),
    });
    setSaving(false);
    if (result) {
      hapticSuccess();
      setDone(true);
      setTimeout(() => { setDone(false); onDone?.(); }, 1500);
    } else {
      hapticError();
      setFailed(true);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 rounded-2xl"
           style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)' }}>
        <Check size={16} style={{ color: 'var(--color-success)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>Check-in express enregistre !</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-text-dim">Check-in express</p>
      {failed && (
        <div role="alert" className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-error)' }}>
          <AlertCircle size={13} />
          <span>Échec de l&apos;enregistrement. Réessaie.</span>
        </div>
      )}
      <div className="flex justify-between gap-1">
        {MOOD_EMOJIS.map((emoji, i) => {
          const mood = i + 1;
          return (
            <button
              key={mood}
              onClick={() => handleQuick(mood)}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xl transition-all active:scale-95 hover:scale-105"
              style={{ backgroundColor: 'var(--color-surface-elevated)' }}
              aria-label={`Check-in rapide humeur ${mood}/5`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
