'use client';

interface EnergySliderProps {
  value: number;
  onChange: (energy: number) => void;
}

export function EnergySlider({ value, onChange }: EnergySliderProps) {
  const getColor = (v: number) => {
    if (v <= 3) return { text: 'text-error', hex: 'var(--color-error)' };
    if (v <= 6) return { text: 'text-warning', hex: 'var(--color-warning)' };
    return { text: 'text-success', hex: 'var(--color-success)' };
  };

  const color = getColor(value);
  const percent = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-text-muted">Niveau d&apos;energie</label>
        <span className={`text-lg font-bold ${color.text}`}>{value}/10</span>
      </div>
      <div className="relative py-2">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="energy-slider w-full"
          style={{
            '--slider-color': color.hex,
            '--slider-percent': `${percent}%`,
          } as React.CSSProperties}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-dim">
        <span>Epuise</span>
        <span>Plein d&apos;energie</span>
      </div>

      <style jsx>{`
        .energy-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--slider-color) 0%,
            var(--slider-color) var(--slider-percent),
            var(--color-surface-alt, #e5e5e5) var(--slider-percent),
            var(--color-surface-alt, #e5e5e5) 100%
          );
          outline: none;
          cursor: pointer;
        }

        .energy-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--slider-color);
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .energy-slider::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }

        .energy-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--slider-color);
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }

        .energy-slider::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: var(--color-surface-alt, #e5e5e5);
        }

        .energy-slider::-moz-range-progress {
          height: 6px;
          border-radius: 999px;
          background: var(--slider-color);
        }
      `}</style>
    </div>
  );
}
