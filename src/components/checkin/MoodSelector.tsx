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
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all flex-1 ${
                isSelected ? 'animate-bounce-in' : 'bg-surface-elevated hover:bg-border'
              }`}
              style={isSelected ? {
                backgroundColor: `${hex}20`,
                boxShadow: `inset 0 0 0 2px ${hex}`,
              } : undefined}
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
