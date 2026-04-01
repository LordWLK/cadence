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

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-text-muted">Niveau d'energie</label>
        <span className={`text-lg font-bold ${getColor(value)}`}>{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-text-dim">
        <span>Epuise</span>
        <span>Plein d'energie</span>
      </div>
    </div>
  );
}
