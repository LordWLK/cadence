'use client';

interface EnergySliderProps {
  value: number;
  onChange: (energy: number) => void;
}

export function EnergySlider({ value, onChange }: EnergySliderProps) {
  const getColor = (v: number) => {
    if (v <= 3) return 'text-error';
    if (v <= 6) return 'text-warning';
    return 'text-success';
  };

  const percent = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-text-muted">Niveau d&apos;energie</label>
        <span className={`text-lg font-bold ${getColor(value)}`}>{value}/10</span>
      </div>
      <div className="relative py-2">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="energy-slider w-full"
          style={{ '--slider-percent': `${percent}%` } as React.CSSProperties}
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
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--color-primary) 0%,
            var(--color-primary) var(--slider-percent),
            var(--color-border, #d4d4d4) var(--slider-percent),
            var(--color-border, #d4d4d4) 100%
          );
          outline: none;
          cursor: pointer;
          margin: 0;
        }

        .energy-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid white;
          box-shadow: 0 0 0 1px var(--color-border, #d4d4d4);
          cursor: pointer;
          margin-top: 0;
          transition: transform 0.15s ease;
        }

        .energy-slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }

        .energy-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid white;
          box-shadow: 0 0 0 1px var(--color-border, #d4d4d4);
          cursor: pointer;
        }

        .energy-slider::-moz-range-track {
          height: 4px;
          border-radius: 999px;
          background: var(--color-border, #d4d4d4);
        }

        .energy-slider::-moz-range-progress {
          height: 4px;
          border-radius: 999px;
          background: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
