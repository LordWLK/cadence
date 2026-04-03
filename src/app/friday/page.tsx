'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActivityForm } from '@/components/friday/ActivityForm';
import { DayScroller } from '@/components/friday/DayScroller';
import { useActivities } from '@/lib/hooks/useActivities';
import { useAuth } from '@/providers/AuthProvider';
import { getRollingDays, getWeekStart, formatDate, formatDateISO, getDayName } from '@/lib/utils/dates';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { SportFeed } from '@/components/friday/SportFeed';
import { CinemaFeed } from '@/components/friday/CinemaFeed';
import { useCinemaPreferences } from '@/lib/hooks/useCinemaPreferences';
import { BacklogDrawer } from '@/components/friday/BacklogDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CalendarPlus, Trash2, Pencil, Check, X, LogIn, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { parseISO } from 'date-fns';
import type { WeeklyActivity } from '@/lib/supabase/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

export default function FridayPage() {
  const { user } = useAuth();
  const { getByDateRange, update, remove } = useActivities();
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [backlogKey, setBacklogKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [cinemaIds, setCinemaIds] = useState<string[]>([]);
  const cinemaPrefs = useCinemaPreferences();

  // Load cinema preferences on mount
  useEffect(() => {
    if (!user) return;
    cinemaPrefs.getAll().then(prefs => {
      setCinemaIds(prefs.map(p => p.cinema_id));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const rollingDays = getRollingDays(14);
  const startISO = formatDateISO(rollingDays[0]);
  const endISO = formatDateISO(rollingDays[rollingDays.length - 1]);

  // For backlog, use the current week start
  const currentWeekStart = getWeekStart();
  const currentWeekStartISO = formatDateISO(currentWeekStart);

  const loadActivities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getByDateRange(startISO, endISO);
    setActivities(data);
    setLoading(false);
  }, [user, getByDateRange, startISO, endISO]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Planifier</h1>
        <Card className="text-center py-8 space-y-4">
          <p className="text-text-muted">Connecte-toi pour planifier ta semaine</p>
          <Link href="/login"><Button><LogIn size={16} /> Se connecter</Button></Link>
        </Card>
      </div>
    );
  }

  const grouped: Record<string, WeeklyActivity[]> = {};
  for (const a of activities) {
    if (!grouped[a.planned_date]) grouped[a.planned_date] = [];
    grouped[a.planned_date].push(a);
  }

  const handleRemove = async (id: string) => {
    await remove(id);
    loadActivities();
  };

  const startEdit = (activity: WeeklyActivity) => {
    setEditingId(activity.id);
    setEditTitle(activity.title);
    setEditCategory(activity.category);
    setEditDate(activity.planned_date);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditCategory('');
    setEditDate('');
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editDate) return;
    setSaving(true);
    await update(editingId, {
      title: editTitle.trim(),
      category: editCategory,
      planned_date: editDate,
    });
    setSaving(false);
    cancelEdit();
    loadActivities();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planifier mes activites</h1>
        <p className="text-text-muted text-sm mt-1">
          {formatDate(rollingDays[0], 'dd MMM')} — {formatDate(rollingDays[rollingDays.length - 1], 'dd MMM yyyy')}
        </p>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer cette activite ?"
        message="L'activite sera retiree de ton planning."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) handleRemove(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ActivityForm onCreated={loadActivities} onBacklogCreated={() => setBacklogKey(k => k + 1)} />

      <BacklogDrawer
        key={backlogKey}
        weekStart={currentWeekStart}
        weekDays={rollingDays}
        weekStartISO={currentWeekStartISO}
        onPulled={loadActivities}
      />

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-alt rounded-2xl animate-pulse" />)}
        </div>
      ) : activities.length === 0 ? (
        <Card className="text-center py-8 space-y-3">
          <CalendarPlus size={32} className="text-text-dim mx-auto" />
          <p className="text-text-muted text-sm">Rien de prevu pour le moment</p>
          <p className="text-text-dim text-xs">Ajoute tes activites pour les 2 prochaines semaines !</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-text-dim uppercase tracking-wide">Activites prevues</p>
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayActivities]) => (
            <div key={date} className="space-y-2">
              <p className="text-sm font-medium text-text-muted capitalize">
                {getDayName(new Date(date))} {formatDate(date, 'dd MMM')}
              </p>
              {dayActivities.map((activity) => {
                const isEditing = editingId === activity.id;

                if (isEditing) {
                  return (
                    <Card key={activity.id} variant="elevated" className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                      />

                      <div className="grid grid-cols-3 gap-1.5">
                        {ACTIVITY_CATEGORIES.map((cat) => {
                          const Icon = ICON_MAP[cat.icon] || Sparkles;
                          const isSelected = editCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setEditCategory(cat.id)}
                              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg text-[11px] transition-all active:scale-95 ${
                                isSelected
                                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                  : 'bg-surface text-text-muted'
                              }`}
                            >
                              <Icon size={14} />
                              <span className="leading-tight text-center">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <DayScroller days={rollingDays} selected={editDate} onChange={setEditDate} />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={saveEdit}
                          disabled={saving || !editTitle.trim() || !editDate}
                        >
                          <Check size={14} />
                          {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X size={14} />
                          Annuler
                        </Button>
                      </div>
                    </Card>
                  );
                }

                const cat = ACTIVITY_CATEGORIES.find(c => c.id === activity.category);
                const Icon = cat ? (ICON_MAP[cat.icon] || Sparkles) : Sparkles;
                return (
                  <Card key={activity.id} className="group flex items-center gap-3">
                    <div className={`shrink-0 ${cat?.color || 'text-text-muted'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-text-dim">{cat?.label}</p>
                    </div>
                    <button
                      onClick={() => startEdit(activity)}
                      className="text-text-dim hover:text-primary transition-colors p-1 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(activity.id)}
                      className="text-text-dim hover:text-error transition-colors p-1 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <SportFeed />

      {cinemaIds.length > 0 && (
        <CinemaFeed preferredCinemaIds={cinemaIds} />
      )}

    </div>
  );
}
