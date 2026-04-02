'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBacklog } from '@/lib/hooks/useBacklog';
import { useActivities } from '@/lib/hooks/useActivities';
import { useAuth } from '@/providers/AuthProvider';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { formatDate, formatDateISO } from '@/lib/utils/dates';
import { ChevronDown, Plus, Repeat, Pencil, Trash2, Check, X, Archive, CalendarClock, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { BacklogActivity } from '@/lib/supabase/types';

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
  { id: 'weekly', label: 'Semaine' },
  { id: 'biweekly', label: '2 sem.' },
  { id: 'monthly', label: 'Mois' },
];

const DAY_LABELS: Record<string, string> = {
  lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu',
  vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim',
};

const FREQ_LABELS: Record<string, string> = {
  weekly: '/sem', biweekly: '/2sem', monthly: '/mois',
};

interface BacklogDrawerProps {
  weekStart: Date;
  weekDays: Date[];
  weekStartISO: string;
  onPulled: () => void;
}

export function BacklogDrawer({ weekStart, weekDays, weekStartISO, onPulled }: BacklogDrawerProps) {
  const { user } = useAuth();
  const { getAll, create, update, remove, pullToWeek, getAlreadyPulled, autoPopulateRecurring } = useBacklog();
  const activities = useActivities();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<BacklogActivity[]>([]);
  const [pulledIds, setPulledIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [autoPopDone, setAutoPopDone] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editRecurrence, setEditRecurrence] = useState('none');
  const [editRecurrenceFreq, setEditRecurrenceFreq] = useState('weekly');
  const [saving, setSaving] = useState(false);

  // "Keep in backlog?" dialog
  const [keepDialog, setKeepDialog] = useState<{ item: BacklogActivity; day: string } | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>(ACTIVITY_CATEGORIES[0].id);
  const [newRecurrence, setNewRecurrence] = useState('none');
  const [newRecurrenceFreq, setNewRecurrenceFreq] = useState('weekly');

  const load = useCallback(async () => {
    if (!user) return;
    const [all, pulled] = await Promise.all([
      getAll(),
      getAlreadyPulled(weekStartISO),
    ]);
    setItems(all);
    setPulledIds(pulled);
  }, [user, getAll, getAlreadyPulled, weekStartISO]);

  useEffect(() => { load(); }, [load]);

  // Auto-populate recurring items once
  useEffect(() => {
    if (!user || autoPopDone) return;
    autoPopulateRecurring(weekStart, weekStartISO).then((added) => {
      setAutoPopDone(true);
      if (added) { load(); onPulled(); }
    });
  }, [user, autoPopDone, weekStart, weekStartISO, autoPopulateRecurring, load, onPulled]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await create({
      title: newTitle.trim(),
      category: newCategory,
      recurrence: newRecurrence,
      recurrence_freq: newRecurrence !== 'none' ? newRecurrenceFreq : 'weekly',
    });
    setNewTitle('');
    setNewCategory(ACTIVITY_CATEGORIES[0].id);
    setNewRecurrence('none');
    setNewRecurrenceFreq('weekly');
    setShowForm(false);
    load();
  };

  const handleRemove = async (id: string) => {
    await remove(id);
    load();
  };

  // ─── Edit handlers ───────────────────────────────────────────────────────

  const startEdit = (item: BacklogActivity) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditDay('');
    setEditRecurrence(item.recurrence);
    setEditRecurrenceFreq(item.recurrence_freq || 'weekly');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditCategory('');
    setEditDay('');
    setEditRecurrence('none');
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    setSaving(true);

    const item = items.find(i => i.id === editingId);

    // If a day was selected → user wants to plan it this week
    if (editDay && item) {
      setKeepDialog({ item: { ...item, title: editTitle.trim(), category: editCategory, recurrence: editRecurrence, recurrence_freq: editRecurrenceFreq }, day: editDay });
      setSaving(false);
      return;
    }

    // Just update the backlog item (no day assigned)
    await update(editingId, {
      title: editTitle.trim(),
      category: editCategory,
      recurrence: editRecurrence,
    });
    setSaving(false);
    cancelEdit();
    load();
  };

  const handleKeepInBacklog = async (keep: boolean) => {
    if (!keepDialog) return;
    const { item, day } = keepDialog;

    // Create weekly activity
    await activities.create({
      title: item.title,
      category: item.category,
      planned_date: day,
      week_start: weekStartISO,
    });

    // Update the backlog item with any edits
    await update(item.id, {
      title: item.title,
      category: item.category,
      recurrence: item.recurrence,
    });

    // If not keeping, archive it
    if (!keep) {
      await remove(item.id);
    }

    setKeepDialog(null);
    cancelEdit();
    load();
    onPulled();
  };

  if (!user) return null;

  const recurringItems = items.filter(i => i.recurrence !== 'none');
  const normalItems = items.filter(i => i.recurrence === 'none');

  return (
    <>
      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Retirer du backlog ?"
        message="L'activite sera archivee."
        confirmLabel="Archiver"
        variant="danger"
        onConfirm={() => { if (deleteTarget) handleRemove(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Keep in backlog dialog */}
      <ConfirmDialog
        open={keepDialog !== null}
        title="Garder dans le backlog ?"
        message={`"${keepDialog?.item.title}" sera ajoutee au planning. Veux-tu aussi la garder dans le backlog pour la reutiliser ?`}
        confirmLabel="Garder"
        cancelLabel="Non, retirer"
        onConfirm={() => handleKeepInBacklog(true)}
        onCancel={() => handleKeepInBacklog(false)}
      />

      {/* Collapsible section */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-medium">Backlog</span>
            {items.length > 0 && (
              <span className="text-[11px] text-[var(--color-text-dim)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <div className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
          </div>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 space-y-3">
            {/* Add button */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] rounded-xl hover:bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors"
              >
                <Plus size={14} />
                Ajouter au backlog
              </button>
            )}

            {/* Inline creation form */}
            {showForm && (
              <BacklogForm
                title={newTitle}
                category={newCategory}
                recurrence={newRecurrence}
                recurrenceFreq={newRecurrenceFreq}
                onTitleChange={setNewTitle}
                onCategoryChange={setNewCategory}
                onRecurrenceChange={setNewRecurrence}
                onRecurrenceFreqChange={setNewRecurrenceFreq}
                onSave={handleCreate}
                onCancel={() => { setShowForm(false); setNewTitle(''); setNewRecurrence('none'); }}
                saveLabel="Ajouter"
              />
            )}

            {/* Recurring items */}
            {recurringItems.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wide flex items-center gap-1">
                  <Repeat size={10} /> Recurrents
                </p>
                {recurringItems.map((item) => (
                  editingId === item.id ? (
                    <BacklogEditForm
                      key={item.id}
                      title={editTitle}
                      category={editCategory}
                      day={editDay}
                      recurrence={editRecurrence}
                      recurrenceFreq={editRecurrenceFreq}
                      weekDays={weekDays}
                      onTitleChange={setEditTitle}
                      onCategoryChange={setEditCategory}
                      onDayChange={setEditDay}
                      onRecurrenceChange={setEditRecurrence}
                      onRecurrenceFreqChange={setEditRecurrenceFreq}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                      saving={saving}
                    />
                  ) : (
                    <BacklogItemRow
                      key={item.id}
                      item={item}
                      isPulled={pulledIds.has(item.id)}
                      onEdit={() => startEdit(item)}
                      onDelete={() => setDeleteTarget(item.id)}
                    />
                  )
                ))}
              </div>
            )}

            {/* Normal items */}
            {normalItems.length > 0 && (
              <div className="space-y-1.5">
                {recurringItems.length > 0 && (
                  <p className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wide mt-2">Pour plus tard</p>
                )}
                {normalItems.map((item) => (
                  editingId === item.id ? (
                    <BacklogEditForm
                      key={item.id}
                      title={editTitle}
                      category={editCategory}
                      day={editDay}
                      recurrence={editRecurrence}
                      recurrenceFreq={editRecurrenceFreq}
                      weekDays={weekDays}
                      onTitleChange={setEditTitle}
                      onCategoryChange={setEditCategory}
                      onDayChange={setEditDay}
                      onRecurrenceChange={setEditRecurrence}
                      onRecurrenceFreqChange={setEditRecurrenceFreq}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                      saving={saving}
                    />
                  ) : (
                    <BacklogItemRow
                      key={item.id}
                      item={item}
                      isPulled={pulledIds.has(item.id)}
                      onEdit={() => startEdit(item)}
                      onDelete={() => setDeleteTarget(item.id)}
                    />
                  )
                ))}
              </div>
            )}

            {items.length === 0 && !showForm && (
              <p className="text-center text-xs text-[var(--color-text-dim)] py-3">Ton backlog est vide</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function BacklogItemRow({ item, isPulled, onEdit, onDelete }: {
  item: BacklogActivity;
  isPulled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = ACTIVITY_CATEGORIES.find(c => c.id === item.category);
  const Icon = cat ? (ICON_MAP[cat.icon] || Sparkles) : Sparkles;
  const isRecurring = item.recurrence !== 'none';

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
      isPulled ? 'bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]' : 'bg-[var(--color-surface-elevated)]'
    }`}>
      <div className={`shrink-0 ${cat?.color || 'text-[var(--color-text-muted)]'}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{item.title}</p>
      </div>
      {isRecurring && (
        <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded-full">
          <Repeat size={9} />
          {DAY_LABELS[item.recurrence]}{FREQ_LABELS[item.recurrence_freq] || ''}
        </span>
      )}
      {isPulled && (
        <span className="shrink-0 text-[10px] text-[var(--color-success)]">Planifie</span>
      )}
      <button onClick={onEdit} className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-primary)] p-1 rounded-lg transition-colors">
        <Pencil size={13} />
      </button>
      <button onClick={onDelete} className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-error)] p-1 rounded-lg transition-colors">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function BacklogForm({ title, category, recurrence, recurrenceFreq, onTitleChange, onCategoryChange, onRecurrenceChange, onRecurrenceFreqChange, onSave, onCancel, saveLabel }: {
  title: string;
  category: string;
  recurrence: string;
  recurrenceFreq: string;
  onTitleChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onRecurrenceChange: (v: string) => void;
  onRecurrenceFreqChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  return (
    <div className="p-3 bg-[var(--color-surface-elevated)] rounded-xl space-y-3">
      <input
        type="text" value={title} onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Nom de l'activite..." autoFocus
        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      />
      <div className="flex flex-wrap gap-1.5">
        {ACTIVITY_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Sparkles;
          return (
            <button key={cat.id} type="button" onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all ${
                category === cat.id ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
              }`}>
              <Icon size={12} /> {cat.label}
            </button>
          );
        })}
      </div>
      <RecurrencePicker
        recurrence={recurrence} recurrenceFreq={recurrenceFreq}
        onRecurrenceChange={onRecurrenceChange} onRecurrenceFreqChange={onRecurrenceFreqChange}
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onSave} disabled={!title.trim()}>{saveLabel}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X size={14} /></Button>
      </div>
    </div>
  );
}

function BacklogEditForm({ title, category, day, recurrence, recurrenceFreq, weekDays, onTitleChange, onCategoryChange, onDayChange, onRecurrenceChange, onRecurrenceFreqChange, onSave, onCancel, saving }: {
  title: string; category: string; day: string; recurrence: string; recurrenceFreq: string;
  weekDays: Date[];
  onTitleChange: (v: string) => void; onCategoryChange: (v: string) => void; onDayChange: (v: string) => void;
  onRecurrenceChange: (v: string) => void; onRecurrenceFreqChange: (v: string) => void;
  onSave: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div className="p-3 bg-[var(--color-surface-elevated)] rounded-xl space-y-3 ring-1 ring-[var(--color-primary)]/20">
      <input
        type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} autoFocus
        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      />
      <div className="flex flex-wrap gap-1.5">
        {ACTIVITY_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Sparkles;
          return (
            <button key={cat.id} type="button" onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all ${
                category === cat.id ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
              }`}>
              <Icon size={12} /> {cat.label}
            </button>
          );
        })}
      </div>
      {/* Day picker for this week */}
      <div>
        <p className="text-[11px] text-[var(--color-text-dim)] mb-1">Attribuer un jour cette semaine (optionnel)</p>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const iso = formatDateISO(d);
            return (
              <button key={iso} type="button" onClick={() => onDayChange(day === iso ? '' : iso)}
                className={`flex flex-col items-center p-1.5 rounded-lg text-[11px] transition-all ${
                  day === iso ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                }`}>
                <span className="font-medium">{formatDate(d, 'EEE')}</span>
                <span className="text-[10px]">{formatDate(d, 'dd')}</span>
              </button>
            );
          })}
        </div>
      </div>
      <RecurrencePicker
        recurrence={recurrence} recurrenceFreq={recurrenceFreq}
        onRecurrenceChange={onRecurrenceChange} onRecurrenceFreqChange={onRecurrenceFreqChange}
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onSave} disabled={saving || !title.trim()}>
          <Check size={14} /> {saving ? '...' : 'Enregistrer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X size={14} /></Button>
      </div>
    </div>
  );
}

function RecurrencePicker({ recurrence, recurrenceFreq, onRecurrenceChange, onRecurrenceFreqChange }: {
  recurrence: string; recurrenceFreq: string;
  onRecurrenceChange: (v: string) => void; onRecurrenceFreqChange: (v: string) => void;
}) {
  const isEnabled = recurrence !== 'none';
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
        <CalendarClock size={11} /> Recurrence
      </p>
      <div className="flex gap-1 flex-wrap">
        <button type="button" onClick={() => onRecurrenceChange('none')}
          className={`px-2 py-1 rounded-lg text-[11px] transition-all ${!isEnabled ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
          Aucune
        </button>
        {DAYS_OF_WEEK.map((d) => (
          <button key={d.id} type="button" onClick={() => onRecurrenceChange(d.id)}
            className={`px-1.5 py-1 rounded-lg text-[11px] transition-all ${recurrence === d.id ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
            {d.label}
          </button>
        ))}
      </div>
      {isEnabled && (
        <div className="flex gap-1.5">
          {FREQ_OPTIONS.map((f) => (
            <button key={f.id} type="button" onClick={() => onRecurrenceFreqChange(f.id)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-all ${recurrenceFreq === f.id ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
