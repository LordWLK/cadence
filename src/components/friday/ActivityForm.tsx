'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useActivities } from '@/lib/hooks/useActivities';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { getNextWeekStart, getWeekDays, getDayName, formatDateISO, formatDate } from '@/lib/utils/dates';
import { Plus, Dumbbell, Tv, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Tv, Users, Lightbulb, Coffee, Sparkles,
};

interface ActivityFormProps {
  weekStart: Date;
  onCreated: () => void;
}

export function ActivityForm({ weekStart, onCreated }: ActivityFormProps) {
  const { create, loading } = useActivities();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(ACTIVITY_CATEGORIES[0].id);
  const [plannedDate, setPlannedDate] = useState('');
  const [open, setOpen] = useState(false);

  const days = getWeekDays(weekStart);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !plannedDate) return;
    await create({
      title: title.trim(),
      category,
      planned_date: plannedDate,
      week_start: formatDateISO(weekStart),
    });
    setTitle('');
    setPlannedDate('');
    setOpen(false);
    onCreated();
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        <Plus size={16} />
        Ajouter une activite
      </Button>
    );
  }

  return (
    <Card variant="elevated">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-text-muted block mb-1.5">Activite</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Foot avec les potes, Film Netflix..."
            autoFocus
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted block mb-1.5">Categorie</label>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Sparkles;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                      : 'bg-surface text-text-muted hover:bg-surface-elevated'
                  }`}
                >
                  <Icon size={16} />
                  <span className="leading-tight text-center">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-muted block mb-1.5">Jour</label>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = formatDateISO(day);
              const isSelected = plannedDate === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setPlannedDate(iso)}
                  className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                      : 'bg-surface text-text-muted hover:bg-surface-elevated'
                  }`}
                >
                  <span className="font-medium">{formatDate(day, 'EEE')}</span>
                  <span className="text-[10px]">{formatDate(day, 'dd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={loading || !title.trim() || !plannedDate}>
            {loading ? 'Ajout...' : 'Ajouter'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}
