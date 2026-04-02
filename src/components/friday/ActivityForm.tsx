'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useActivities } from '@/lib/hooks/useActivities';
import { useBacklog } from '@/lib/hooks/useBacklog';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { getWeekDays, formatDateISO, formatDate } from '@/lib/utils/dates';
import { Plus, Archive, Repeat, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

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

interface ActivityFormProps {
  weekStart: Date;
  onCreated: () => void;
  onBacklogCreated?: () => void;
}

export function ActivityForm({ weekStart, onCreated, onBacklogCreated }: ActivityFormProps) {
  const { create, loading } = useActivities();
  const backlog = useBacklog();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(ACTIVITY_CATEGORIES[0].id);
  const [plannedDate, setPlannedDate] = useState('');
  const [open, setOpen] = useState(false);
  const [savingBacklog, setSavingBacklog] = useState(false);

  // Recurrence state
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState('none');
  const [recurrenceFreq, setRecurrenceFreq] = useState('weekly');

  const days = getWeekDays(weekStart);

  const resetForm = () => {
    setTitle('');
    setPlannedDate('');
    setCategory(ACTIVITY_CATEGORIES[0].id);
    setRecurrenceEnabled(false);
    setRecurrenceDay('none');
    setRecurrenceFreq('weekly');
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !plannedDate) return;

    // Create the weekly activity
    await create({
      title: title.trim(),
      category,
      planned_date: plannedDate,
      week_start: formatDateISO(weekStart),
    });

    // If recurrence is enabled, also create a backlog item
    if (recurrenceEnabled && recurrenceDay !== 'none') {
      await backlog.create({
        title: title.trim(),
        category,
        recurrence: recurrenceDay,
        recurrence_freq: recurrenceFreq,
      });
      onBacklogCreated?.();
    }

    resetForm();
    onCreated();
  };

  const handleBacklog = async () => {
    if (!title.trim()) return;
    setSavingBacklog(true);
    await backlog.create({
      title: title.trim(),
      category,
      recurrence: recurrenceEnabled ? recurrenceDay : 'none',
      recurrence_freq: recurrenceEnabled ? recurrenceFreq : 'weekly',
    });
    setSavingBacklog(false);
    resetForm();
    onBacklogCreated?.();
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

        {/* Recurrence */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setRecurrenceEnabled(!recurrenceEnabled)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              recurrenceEnabled ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <Repeat size={13} />
            Recurrence
            <span className={`w-8 h-4 rounded-full relative transition-colors ${recurrenceEnabled ? 'bg-primary' : 'bg-border'}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${recurrenceEnabled ? 'left-4' : 'left-0.5'}`} />
            </span>
          </button>

          {recurrenceEnabled && (
            <div className="space-y-2 pl-5 border-l-2 border-primary/20">
              <div>
                <p className="text-[11px] text-text-dim mb-1">Jour de recurrence</p>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setRecurrenceDay(d.id)}
                      className={`px-1.5 py-1 rounded-lg text-[11px] transition-all ${
                        recurrenceDay === d.id
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'bg-surface text-text-muted'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-text-dim mb-1">Frequence</p>
                <div className="flex gap-1.5">
                  {FREQ_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRecurrenceFreq(f.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] transition-all ${
                        recurrenceFreq === f.id
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'bg-surface text-text-muted'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={loading || !title.trim() || !plannedDate}>
            {loading ? 'Ajout...' : 'Planifier'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex items-center gap-1.5"
            disabled={savingBacklog || !title.trim()}
            onClick={handleBacklog}
          >
            <Archive size={14} />
            {savingBacklog ? '...' : 'Backlog'}
          </Button>
          <Button type="button" variant="ghost" onClick={resetForm}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}
