'use client';

import { MOOD_EMOJIS, MOOD_LABELS } from '@/lib/config/constants';

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
          return (
            <button
              key={mood}
              type="button"
              onClick={() => onChange(mood)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all flex-1 ${
                isSelected
                  ? `bg-mood-${mood}/20 ring-2 ring-mood-${mood} scale-110`
                  : 'bg-surface-elevated hover:bg-border'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className={`text-[10px] ${isSelected ? `text-mood-${mood}` : 'text-text-dim'}`}>
                {MOOD_LABELS[index]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
