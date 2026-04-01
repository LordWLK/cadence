'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBacklog } from '@/lib/hooks/useBacklog';
import { useAuth } from '@/providers/AuthProvider';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { formatDate, formatDateISO } from '@/lib/utils/dates';
import { ChevronUp, ChevronDown, Plus, Repeat, Trash2, Check, X, Archive, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { BacklogActivity } from '@/lib/supabase/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Une fois',
  weekly: 'Hebdo',
  monthly: 'Mensuel',
};

const RECURRENCE_OPTIONS: { id: string; label: string }[] = [
  { id: 'none', label: 'Une fois' },
  { id: 'weekly', label: 'Hebdo' },
  { id: 'monthly', label: 'Mensuel' },
];

interface BacklogDrawerProps {
  weekStart: Date;
  weekDays: Date[];
  weekStartISO: string;
  onPulled: () => void;
}

export function BacklogDrawer({ weekStart, weekDays, weekStartISO, onPulled }: BacklogDrawerProps) {
  const { user } = useAuth();
  const { getAll, create, remove, pullToWeek, getAlreadyPulled } = useBacklog();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<BacklogActivity[]>([]);
  const [pulledIds, setPulledIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [dayPickerId, setDayPickerId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>(ACTIVITY_CATEGORIES[0].id);
  const [newRecurrence, setNewRecurrence] = useState('none');

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

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await create({ title: newTitle.trim(), category: newCategory, recurrence: newRecurrence });
    setNewTitle('');
    setNewCategory(ACTIVITY_CATEGORIES[0].id);
    setNewRecurrence('none');
    setShowForm(false);
    load();
  };

  const handlePull = async (item: BacklogActivity, date: string) => {
    await pullToWeek(item, date, weekStartISO);
    setDayPickerId(null);
    load();
    onPulled();
  };

  const handleRemove = async (id: string) => {
    await remove(id);
    load();
  };

  if (!user) return null;

  return (
    <>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Retirer du backlog ?"
        message="L'activite sera archivee."
        confirmLabel="Archiver"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) handleRemove(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed left-0 right-0 bottom-16 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-2xl shadow-lg transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'
        }`}
        style={{ maxHeight: '60vh' }}
      >
        {/* Handle / collapsed bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 h-12"
        >
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-medium text-[var(--color-text)]">
              Backlog
            </span>
            {items.length > 0 && (
              <span className="text-xs text-[var(--color-text-dim)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          {isOpen ? <ChevronDown size={18} className="text-[var(--color-text-muted)]" /> : <ChevronUp size={18} className="text-[var(--color-text-muted)]" />}
        </button>

        {/* Expanded content */}
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(60vh - 48px)' }}>
          {/* Add button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 text-xs font-medium text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] rounded-xl hover:bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors"
            >
              <Plus size={14} />
              Ajouter au backlog
            </button>
          )}

          {/* Inline creation form */}
          {showForm && (
            <div className="mb-3 p-3 bg-[var(--color-surface-elevated)] rounded-xl space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nom de l'activite..."
                autoFocus
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />

              {/* Category chips */}
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_CATEGORIES.map((cat) => {
                  const Icon = ICON_MAP[cat.icon] || Sparkles;
                  const isSelected = newCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all ${
                        isSelected
                          ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      <Icon size={12} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Recurrence */}
              <div className="flex gap-1.5">
                {RECURRENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewRecurrence(opt.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                      newRecurrence === opt.id
                        ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {opt.id !== 'none' && <Repeat size={10} />}
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleCreate} disabled={!newTitle.trim()}>
                  Ajouter
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setNewTitle(''); }}>
                  <X size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Backlog items list */}
          {items.length === 0 && !showForm ? (
            <p className="text-center text-xs text-[var(--color-text-dim)] py-4">
              Ton backlog est vide. Ajoute des activites pour plus tard !
            </p>
          ) : (
            <div className="space-y-1.5">
              {items.map((item) => {
                const cat = ACTIVITY_CATEGORIES.find(c => c.id === item.category);
                const Icon = cat ? (ICON_MAP[cat.icon] || Sparkles) : Sparkles;
                const isPulled = pulledIds.has(item.id);
                const showDayPicker = dayPickerId === item.id;

                return (
                  <div key={item.id}>
                    <div
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                        isPulled
                          ? 'bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] opacity-60'
                          : 'bg-[var(--color-surface-elevated)]'
                      }`}
                    >
                      <div className={`shrink-0 ${cat?.color || 'text-[var(--color-text-muted)]'}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isPulled ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
                          {item.title}
                        </p>
                      </div>
                      {item.recurrence !== 'none' && (
                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded-full">
                          <Repeat size={9} />
                          {RECURRENCE_LABELS[item.recurrence]}
                        </span>
                      )}
                      {isPulled ? (
                        <Check size={14} className="shrink-0 text-[var(--color-success)]" />
                      ) : (
                        <button
                          onClick={() => setDayPickerId(showDayPicker ? null : item.id)}
                          className="shrink-0 text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] p-1 rounded-lg transition-colors"
                          title="Ajouter a la semaine"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(item.id)}
                        className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-error)] p-1 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Inline day picker */}
                    {showDayPicker && (
                      <div className="mt-1 ml-7 grid grid-cols-7 gap-1 p-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                        {weekDays.map((day) => {
                          const iso = formatDateISO(day);
                          return (
                            <button
                              key={iso}
                              onClick={() => handlePull(item, iso)}
                              className="flex flex-col items-center p-1.5 rounded-lg text-[11px] text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              <span className="font-medium">{formatDate(day, 'EEE')}</span>
                              <span className="text-[10px]">{formatDate(day, 'dd')}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
