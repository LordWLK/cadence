'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBacklog } from '@/lib/hooks/useBacklog';
import { useAuth } from '@/providers/AuthProvider';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { formatDate, formatDateISO } from '@/lib/utils/dates';
import { RecurrenceSection, DAY_LABELS, FREQ_LABELS } from './RecurrenceSection';
import { ChevronDown, Plus, Repeat, Pencil, Trash2, Check, X, Archive, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { BacklogActivity } from '@/lib/supabase/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

// Shared chip classes
const CHIP = 'rounded-lg transition-all active:scale-95';
const CHIP_ON = 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]';
const CHIP_OFF = 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]';

interface BacklogDrawerProps {
  weekStart: Date;
  weekDays: Date[];
  weekStartISO: string;
  onPulled: () => void;
}

export function BacklogDrawer({ weekStart, weekDays, weekStartISO, onPulled }: BacklogDrawerProps) {
  const { user } = useAuth();
  const { getAll, create, update, remove, pullToWeek, getAlreadyPulled, autoPopulateRecurring } = useBacklog();
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
  const [editRecEnabled, setEditRecEnabled] = useState(false);
  const [editRecDay, setEditRecDay] = useState('lundi');
  const [editRecFreq, setEditRecFreq] = useState('weekly');
  const [saving, setSaving] = useState(false);

  // "Keep in backlog?" dialog
  const [keepDialog, setKeepDialog] = useState<{ item: BacklogActivity; day: string } | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>(ACTIVITY_CATEGORIES[0].id);
  const [newRecEnabled, setNewRecEnabled] = useState(false);
  const [newRecDay, setNewRecDay] = useState('lundi');
  const [newRecFreq, setNewRecFreq] = useState('weekly');

  const load = useCallback(async () => {
    if (!user) return;
    const [all, pulled] = await Promise.all([getAll(), getAlreadyPulled(weekStartISO)]);
    setItems(all);
    setPulledIds(pulled);
  }, [user, getAll, getAlreadyPulled, weekStartISO]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user || autoPopDone) return;
    autoPopulateRecurring(weekStart, weekStartISO).then((added) => {
      setAutoPopDone(true);
      if (added) { load(); onPulled(); }
    });
  }, [user, autoPopDone, weekStart, weekStartISO, autoPopulateRecurring, load, onPulled]);

  // ─── Create ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await create({
      title: newTitle.trim(),
      category: newCategory,
      recurrence: newRecEnabled ? newRecDay : 'none',
      recurrence_freq: newRecEnabled ? newRecFreq : 'weekly',
    });
    setNewTitle(''); setNewCategory(ACTIVITY_CATEGORIES[0].id);
    setNewRecEnabled(false); setNewRecDay('lundi'); setNewRecFreq('weekly');
    setShowForm(false);
    load();
  };

  // ─── Edit ────────────────────────────────────────────────────────────────

  const startEdit = (item: BacklogActivity) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditDay('');
    setEditRecEnabled(item.recurrence !== 'none');
    setEditRecDay(item.recurrence !== 'none' ? item.recurrence : 'lundi');
    setEditRecFreq(item.recurrence_freq || 'weekly');
  };

  const cancelEdit = () => {
    setEditingId(null); setEditTitle(''); setEditCategory(''); setEditDay('');
    setEditRecEnabled(false);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    setSaving(true);
    const item = items.find(i => i.id === editingId);

    // If a day was selected → user wants to plan it
    if (editDay && item) {
      const updatedItem = {
        ...item,
        title: editTitle.trim(),
        category: editCategory,
        recurrence: editRecEnabled ? editRecDay : 'none',
        recurrence_freq: editRecEnabled ? editRecFreq : 'weekly',
      };
      setKeepDialog({ item: updatedItem, day: editDay });
      setSaving(false);
      return;
    }

    // Just update the backlog item
    await update(editingId, {
      title: editTitle.trim(),
      category: editCategory,
      recurrence: editRecEnabled ? editRecDay : 'none',
      recurrence_freq: editRecEnabled ? editRecFreq : 'weekly',
    });
    setSaving(false);
    cancelEdit();
    load();
  };

  const handleKeepInBacklog = async (keep: boolean) => {
    if (!keepDialog) return;
    const { item, day } = keepDialog;

    // 1. First, save any edits to the backlog item
    const updatedBacklog = await update(item.id, {
      title: item.title,
      category: item.category,
      recurrence: item.recurrence,
      recurrence_freq: item.recurrence_freq,
    });

    // 2. Pull the (now updated) backlog item into the week
    const backlogForPull = updatedBacklog || item;
    await pullToWeek(backlogForPull as BacklogActivity, day, weekStartISO);

    // 3. If user doesn't want to keep it, remove from backlog
    if (!keep) await remove(item.id);

    setKeepDialog(null);
    cancelEdit();
    load();
    onPulled();
  };

  const handleRemove = async (id: string) => { await remove(id); load(); };

  if (!user) return null;

  const recurringItems = items.filter(i => i.recurrence !== 'none');
  const normalItems = items.filter(i => i.recurrence === 'none');

  return (
    <>
      <ConfirmDialog open={deleteTarget !== null} title="Retirer du backlog ?" message="L'activite sera archivee." confirmLabel="Archiver" variant="danger"
        onConfirm={() => { if (deleteTarget) handleRemove(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />

      <ConfirmDialog open={keepDialog !== null} title="Garder dans le backlog ?"
        message={`"${keepDialog?.item.title}" sera ajoutee au planning. Veux-tu aussi la garder dans le backlog pour la reutiliser ?`}
        confirmLabel="Garder" cancelLabel="Non, retirer"
        onConfirm={() => handleKeepInBacklog(true)} onCancel={() => handleKeepInBacklog(false)} />

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {/* Header */}
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3 active:bg-[var(--color-surface-elevated)] transition-colors">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-medium">Backlog</span>
            {items.length > 0 && (
              <span className="text-[11px] text-[var(--color-text-dim)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 rounded-full">{items.length}</span>
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
              <button onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] rounded-xl active:bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition-colors">
                <Plus size={14} /> Ajouter au backlog
              </button>
            )}

            {/* Create form */}
            {showForm && (
              <div className="p-3 bg-[var(--color-surface-elevated)] rounded-xl space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-text-muted)] block mb-1.5">Activite</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Foot avec les potes, Film Netflix..." autoFocus
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-muted)] block mb-1.5">Categorie</label>
                  <CategoryChips selected={newCategory} onChange={setNewCategory} />
                </div>
                <RecurrenceSection enabled={newRecEnabled} day={newRecDay} freq={newRecFreq}
                  onToggle={() => setNewRecEnabled(!newRecEnabled)} onDayChange={setNewRecDay} onFreqChange={setNewRecFreq} />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleCreate} disabled={!newTitle.trim()}>Ajouter</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setNewTitle(''); setNewRecEnabled(false); }}><X size={14} /> Annuler</Button>
                </div>
              </div>
            )}

            {/* Recurring */}
            {recurringItems.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wide flex items-center gap-1"><Repeat size={10} /> Recurrents</p>
                {recurringItems.map((item) => editingId === item.id
                  ? <EditForm key={item.id} {...{ editTitle, editCategory, editDay, editRecEnabled, editRecDay, editRecFreq, weekDays, saving, setEditTitle, setEditCategory, setEditDay, setEditRecEnabled, setEditRecDay, setEditRecFreq, saveEdit, cancelEdit }} />
                  : <ItemRow key={item.id} item={item} isPulled={pulledIds.has(item.id)} onEdit={() => startEdit(item)} onDelete={() => setDeleteTarget(item.id)} />
                )}
              </div>
            )}

            {/* Normal */}
            {normalItems.length > 0 && (
              <div className="space-y-1.5">
                {recurringItems.length > 0 && <p className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wide mt-2">Pour plus tard</p>}
                {normalItems.map((item) => editingId === item.id
                  ? <EditForm key={item.id} {...{ editTitle, editCategory, editDay, editRecEnabled, editRecDay, editRecFreq, weekDays, saving, setEditTitle, setEditCategory, setEditDay, setEditRecEnabled, setEditRecDay, setEditRecFreq, saveEdit, cancelEdit }} />
                  : <ItemRow key={item.id} item={item} isPulled={pulledIds.has(item.id)} onEdit={() => startEdit(item)} onDelete={() => setDeleteTarget(item.id)} />
                )}
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

// ─── Shared sub-components ─────────────────────────────────────────────────

function CategoryChips({ selected, onChange }: { selected: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ACTIVITY_CATEGORIES.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || Sparkles;
        const isSelected = selected === cat.id;
        return (
          <button key={cat.id} type="button" onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center gap-1 p-2.5 text-xs ${CHIP} ${isSelected ? CHIP_ON : CHIP_OFF}`}>
            <Icon size={16} />
            <span className="leading-tight text-center">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ItemRow({ item, isPulled, onEdit, onDelete }: {
  item: BacklogActivity; isPulled: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const cat = ACTIVITY_CATEGORIES.find(c => c.id === item.category);
  const Icon = cat ? (ICON_MAP[cat.icon] || Sparkles) : Sparkles;
  const isRecurring = item.recurrence !== 'none';

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
      isPulled ? 'bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]' : 'bg-[var(--color-surface-elevated)]'
    }`}>
      <div className={`shrink-0 ${cat?.color || 'text-[var(--color-text-muted)]'}`}><Icon size={15} /></div>
      <div className="flex-1 min-w-0"><p className="text-sm truncate">{item.title}</p></div>
      {isRecurring && (
        <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded-full">
          <Repeat size={9} /> {DAY_LABELS[item.recurrence]}{FREQ_LABELS[item.recurrence_freq] || ''}
        </span>
      )}
      {isPulled && <span className="shrink-0 text-[10px] text-[var(--color-success)]">Planifie</span>}
      <button onClick={onEdit} className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-primary)] active:scale-90 p-1 rounded-lg transition-all"><Pencil size={13} /></button>
      <button onClick={onDelete} className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-error)] active:scale-90 p-1 rounded-lg transition-all"><Trash2 size={13} /></button>
    </div>
  );
}

function EditForm({ editTitle, editCategory, editDay, editRecEnabled, editRecDay, editRecFreq, weekDays, saving, setEditTitle, setEditCategory, setEditDay, setEditRecEnabled, setEditRecDay, setEditRecFreq, saveEdit, cancelEdit }: {
  editTitle: string; editCategory: string; editDay: string; editRecEnabled: boolean; editRecDay: string; editRecFreq: string;
  weekDays: Date[]; saving: boolean;
  setEditTitle: (v: string) => void; setEditCategory: (v: string) => void; setEditDay: (v: string) => void;
  setEditRecEnabled: (v: boolean) => void; setEditRecDay: (v: string) => void; setEditRecFreq: (v: string) => void;
  saveEdit: () => void; cancelEdit: () => void;
}) {
  return (
    <div className="p-3 bg-[var(--color-surface-elevated)] rounded-xl space-y-4 ring-1 ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
      <div>
        <label className="text-sm text-[var(--color-text-muted)] block mb-1.5">Activite</label>
        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] transition-colors" />
      </div>
      <div>
        <label className="text-sm text-[var(--color-text-muted)] block mb-1.5">Categorie</label>
        <CategoryChips selected={editCategory} onChange={setEditCategory} />
      </div>
      <div>
        <label className="text-sm text-[var(--color-text-muted)] block mb-1.5">Jour</label>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const iso = formatDateISO(d);
            return (
              <button key={iso} type="button" onClick={() => setEditDay(editDay === iso ? '' : iso)}
                className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all active:scale-95 ${
                  editDay === iso ? CHIP_ON : CHIP_OFF
                }`}>
                <span className="font-medium">{formatDate(d, 'EEE')}</span>
                <span className="text-[10px]">{formatDate(d, 'dd')}</span>
              </button>
            );
          })}
        </div>
      </div>
      <RecurrenceSection enabled={editRecEnabled} day={editRecDay} freq={editRecFreq}
        onToggle={() => setEditRecEnabled(!editRecEnabled)} onDayChange={setEditRecDay} onFreqChange={setEditRecFreq} />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={saveEdit} disabled={saving || !editTitle.trim()}>
          <Check size={14} /> {saving ? '...' : 'Enregistrer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancelEdit}><X size={14} /> Annuler</Button>
      </div>
    </div>
  );
}
