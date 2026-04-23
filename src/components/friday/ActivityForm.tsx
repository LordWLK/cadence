'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useActivities } from '@/lib/hooks/useActivities';
import { useBacklog } from '@/lib/hooks/useBacklog';
import { useActivityShares } from '@/lib/hooks/useActivityShares';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { getRollingDays, formatDateISO, getWeekStart } from '@/lib/utils/dates';
import { RecurrenceSection } from './RecurrenceSection';
import { DayScroller } from './DayScroller';
import { ShareSelector, type ShareTarget } from './ShareSelector';
import { Plus, Archive, X, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';
import { parseISO } from 'date-fns';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

interface ActivityFormProps {
  onCreated: () => void;
  onBacklogCreated?: () => void;
}

export function ActivityForm({ onCreated, onBacklogCreated }: ActivityFormProps) {
  const { create, loading } = useActivities();
  const backlog = useBacklog();
  const { setSharesForActivity } = useActivityShares();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(ACTIVITY_CATEGORIES[0].id);
  const [plannedDate, setPlannedDate] = useState('');
  const [open, setOpen] = useState(false);
  const [savingBacklog, setSavingBacklog] = useState(false);
  const [shares, setShares] = useState<ShareTarget[]>([]);

  // Recurrence
  const [recEnabled, setRecEnabled] = useState(false);
  const [recDay, setRecDay] = useState('lundi');
  const [recFreq, setRecFreq] = useState('weekly');

  const rollingDays = getRollingDays(14);

  const resetForm = () => {
    setTitle('');
    setPlannedDate('');
    setCategory(ACTIVITY_CATEGORIES[0].id);
    setRecEnabled(false);
    setRecDay('lundi');
    setRecFreq('weekly');
    setShares([]);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !plannedDate) return;

    // Compute week_start from the selected date
    const weekStart = getWeekStart(parseISO(plannedDate));

    const created = await create({
      title: title.trim(),
      category,
      planned_date: plannedDate,
      week_start: formatDateISO(weekStart),
    });

    // Partages éventuels (appliqués après création pour avoir l'id)
    if (created && shares.length > 0) {
      await setSharesForActivity(created.id, shares);
    }

    // If recurrence is on, also create a backlog item
    if (recEnabled) {
      await backlog.create({
        title: title.trim(),
        category,
        recurrence: recDay,
        recurrence_freq: recFreq,
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
      recurrence: recEnabled ? recDay : 'none',
      recurrence_freq: recEnabled ? recFreq : 'weekly',
    });
    setSavingBacklog(false);
    resetForm();
    onBacklogCreated?.();
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        <Plus size={16} />
        Ajouter une activité
      </Button>
    );
  }

  const chipBase = 'rounded-xl transition-all active:scale-95';
  const chipActive = 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]';
  const chipInactive = 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]';

  return (
    <Card variant="elevated">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-text-muted block mb-1.5">Activité</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Foot avec les potes, Film Netflix..."
            aria-label="Nom de l'activité"
            autoFocus
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted block mb-1.5">Catégorie</label>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Sparkles;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 ${chipBase} text-xs ${isSelected ? chipActive : chipInactive}`}
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
          <DayScroller days={rollingDays} selected={plannedDate} onChange={setPlannedDate} />
        </div>

        <RecurrenceSection
          enabled={recEnabled}
          day={recDay}
          freq={recFreq}
          onToggle={() => setRecEnabled(!recEnabled)}
          onDayChange={setRecDay}
          onFreqChange={setRecFreq}
        />

        <ShareSelector value={shares} onChange={setShares} compact />

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={loading || !title.trim() || !plannedDate}>
            {loading ? 'Ajout...' : 'Planifier'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={savingBacklog || !title.trim()}
            onClick={handleBacklog}
          >
            <Archive size={14} />
            {savingBacklog ? '...' : 'Backlog'}
          </Button>
          <Button type="button" variant="ghost" onClick={resetForm}>
            <X size={14} /> Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}
