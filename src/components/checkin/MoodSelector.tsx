'use client';

import { MOOD_EMOJIS, MOOD_LABELS, MOOD_HEX } from '@/lib/config/constants';
import { hapticSelect } from '@/lib/utils/haptics';

interface MoodSelectorProps {
  value: number;
  onChange: (mood: number) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-text-muted">Comment tu te sens ?</label>
      <div className="flex justify-between gap-2">
        {MOOD_EMOJIS.map((emoji, index) => {
          const mood = index + 1;
          const isSelected = value === mood;
          const hex = MOOD_HEX[index];
          return (
            <button
              key={mood}
              type="button"
              onClick={() => { hapticSelect(); onChange(mood); }}
              aria-label={`Humeur : ${MOOD_LABELS[index]}`}
              className={`flex flex-col items-center gap-1 p-3 rounded-[3px] brut-press flex-1 ${
                isSelected
                  ? 'animate-bounce-in border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)]'
                  : 'bg-surface-elevated border border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
              }`}
              style={isSelected ? { backgroundColor: `${hex}26` } : undefined}
            >
              <span className="text-2xl">{emoji}</span>
              <span
                className={`text-[10px] ${!isSelected ? 'text-text-dim' : ''}`}
                style={isSelected ? { color: hex } : undefined}
              >
                {MOOD_LABELS[index]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
