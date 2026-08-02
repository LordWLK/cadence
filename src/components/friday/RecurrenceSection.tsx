'use client';

import { Repeat } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 'lundi', label: 'Lun' },
  { id: 'mardi', label: 'Mar' },
  { id: 'mercredi', label: 'Mer' },
  { id: 'jeudi', label: 'Jeu' },
  { id: 'vendredi', label: 'Ven' },
  { id: 'samedi', label: 'Sam' },
  { id: 'dimanche', label: 'Dim' },
];

const FREQ_OPTIONS = [
  { id: 'weekly', label: 'Chaque semaine' },
  { id: 'biweekly', label: 'Toutes les 2 sem.' },
  { id: 'monthly', label: 'Chaque mois' },
];

interface RecurrenceSectionProps {
  enabled: boolean;
  day: string;        // 'none' | 'lundi' | 'mardi' | ...
  freq: string;       // 'weekly' | 'biweekly' | 'monthly'
  onToggle: () => void;
  onDayChange: (day: string) => void;
  onFreqChange: (freq: string) => void;
  /** Compact mode for smaller forms */
  compact?: boolean;
}

export function RecurrenceSection({ enabled, day, freq, onToggle, onDayChange, onFreqChange, compact = false }: RecurrenceSectionProps) {
  const chipBase = 'rounded-[3px] brut-press';
  const chipActive = 'bg-[var(--color-action)] text-[#16150F] border-2 border-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] font-bold';
  const chipInactive = 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]';
  const chipSize = compact ? 'px-1.5 py-1 text-[11px]' : 'px-2 py-1.5 text-xs';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        aria-label="Activer la récurrence"
        className="flex items-center gap-1.5 text-xs font-medium transition-colors active:scale-95"
        style={{ color: enabled ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
      >
        <Repeat size={13} />
        Récurrence
        <span
          className="w-8 h-4 rounded-full relative transition-colors border"
          style={{
            backgroundColor: enabled ? 'var(--color-action)' : 'var(--color-border)',
            borderColor: 'var(--color-ink)',
          }}
        >
          <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${enabled ? 'left-4' : 'left-0.5'}`}
            style={{ backgroundColor: 'var(--color-ink)' }} />
        </span>
      </button>

      {enabled && (
        <div className="space-y-2 pl-5 border-l-2" style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--color-text-dim)' }}>Jour</p>
            <div className="flex gap-1 flex-wrap">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onDayChange(d.id)}
                  className={`${chipBase} ${chipSize} ${day === d.id ? chipActive : chipInactive}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--color-text-dim)' }}>Frequence</p>
            <div className="flex gap-1.5 flex-wrap">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFreqChange(f.id)}
                  className={`${chipBase} ${chipSize} ${freq === f.id ? chipActive : chipInactive}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Label helpers ──────────────────────────────────────────────────────────

export const DAY_LABELS: Record<string, string> = {
  lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu',
  vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim',
};

export const FREQ_LABELS: Record<string, string> = {
  weekly: '/sem', biweekly: '/2sem', monthly: '/mois',
};
