'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActivityForm } from '@/components/friday/ActivityForm';
import { DayScroller } from '@/components/friday/DayScroller';
import { useActivities } from '@/lib/hooks/useActivities';
import { useActivityShares, type ActivityShareInfo } from '@/lib/hooks/useActivityShares';
import { ShareSelector, type ShareTarget } from '@/components/friday/ShareSelector';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { getRollingDays, getWeekStart, formatDate, formatDateISO, getDayName } from '@/lib/utils/dates';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { SportFeed } from '@/components/friday/SportFeed';
import { CinemaFeed } from '@/components/friday/CinemaFeed';
import { useCinemaPreferences } from '@/lib/hooks/useCinemaPreferences';
import { BacklogDrawer } from '@/components/friday/BacklogDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { CalendarPlus, Trash2, Pencil, Check, X, LogIn, Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles, EyeOff, Eye } from 'lucide-react';
import Link from 'next/link';
import type { WeeklyActivity } from '@/lib/supabase/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Briefcase, Users, Lightbulb, Coffee, Sparkles,
};

export default function FridayPage() {
  const { user } = useAuth();
  const { getByDateRange, update, remove } = useActivities();
  const { getShareInfo, setSharesForActivity, setHidden } = useActivityShares();
  const { showToast } = useToast();
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [shareMap, setShareMap] = useState<Map<string, ActivityShareInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editShares, setEditShares] = useState<ShareTarget[]>([]);
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
    if (data.length > 0) {
      const infoMap = await getShareInfo(data.map((a) => a.id));
      setShareMap(infoMap);
    } else {
      setShareMap(new Map());
    }
    setLoading(false);
  }, [user, getByDateRange, getShareInfo, startISO, endISO]);

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
    // Initialise les partages avec ceux déjà enregistrés pour cette activité
    const info = shareMap.get(activity.id);
    setEditShares(
      (info?.sharedWith ?? []).map((s) => ({
        userId: s.profile.user_id,
        canEdit: s.share.can_edit,
      }))
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditCategory('');
    setEditDate('');
    setEditShares([]);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editDate) return;
    setSaving(true);
    const info = shareMap.get(editingId);
    const isOwner = info ? !info.isReceived : true;
    await update(editingId, {
      title: editTitle.trim(),
      category: editCategory,
      planned_date: editDate,
    });
    // Seul le propriétaire peut gérer les partages
    if (isOwner) {
      await setSharesForActivity(editingId, editShares);
    }
    setSaving(false);
    cancelEdit();
    loadActivities();
  };

  const hideReceived = async (shareId: string) => {
    await setHidden(shareId, true);
    showToast('Activité masquée', 'info');
    loadActivities();
  };

  return (
    <PullToRefresh onRefresh={loadActivities}>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planifier mes activités</h1>
        <p className="text-text-muted text-sm mt-1">
          {formatDate(rollingDays[0], 'dd MMM')} — {formatDate(rollingDays[rollingDays.length - 1], 'dd MMM yyyy')}
        </p>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer cette activité ?"
        message="L'activité sera retirée de ton planning."
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
          <p className="text-text-muted text-sm">Rien de prévu pour le moment</p>
          <p className="text-text-dim text-xs">Ajoute tes activités pour les 2 prochaines semaines !</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-text-dim uppercase tracking-wide">Activités prévues</p>
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayActivities]) => (
            <div key={date} className="space-y-2">
              <p className="text-sm font-medium text-text-muted capitalize">
                {getDayName(new Date(date))} {formatDate(date, 'dd MMM')}
              </p>
              {dayActivities.map((activity) => {
                const isEditing = editingId === activity.id;
                const info = shareMap.get(activity.id);
                const isReceived = info?.isReceived ?? false;
                const isOwner = !isReceived;
                const canEditActivity = isOwner || (info?.receivedShare?.can_edit ?? false);

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

                      {/* Gestion du partage seulement si je suis propriétaire */}
                      {isOwner && (
                        <ShareSelector value={editShares} onChange={setEditShares} compact />
                      )}

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
                  <Card
                    key={activity.id}
                    className="group flex items-center gap-3"
                    style={isReceived ? {
                      borderStyle: 'dashed',
                      borderColor: 'color-mix(in srgb, var(--color-primary) 35%, var(--color-border))',
                    } : undefined}
                  >
                    <div className={`shrink-0 ${cat?.color || 'text-text-muted'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-text-dim truncate">{cat?.label}</p>
                        {/* Badge reçu */}
                        {isReceived && info?.receivedFromProfile && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                                  color: 'var(--color-primary)',
                                }}>
                            <Avatar profile={info.receivedFromProfile} size={12} />
                            <span>de {info.receivedFromProfile.display_name || info.receivedFromProfile.email}</span>
                            {info.receivedShare?.can_edit ? <Pencil size={8} /> : <Eye size={8} />}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Avatars des destinataires (si je suis proprio et que c'est partagé) */}
                    {isOwner && info && info.sharedWith.length > 0 && (
                      <div className="flex -space-x-1.5 shrink-0" title={`Partagé avec ${info.sharedWith.length} personne(s)`}>
                        {info.sharedWith.slice(0, 3).map(({ profile, share }) => (
                          <Avatar
                            key={share.id}
                            profile={profile}
                            size={20}
                            className="ring-2"
                            title={`${profile.display_name || profile.email}${share.can_edit ? ' (peut modifier)' : ' (lecture seule)'}`}
                          />
                        ))}
                        {info.sharedWith.length > 3 && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ring-2"
                               style={{
                                 backgroundColor: 'var(--color-surface-elevated)',
                                 color: 'var(--color-text-muted)',
                               }}>
                            +{info.sharedWith.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    {canEditActivity && (
                      <button
                        onClick={() => startEdit(activity)}
                        className="text-text-dim hover:text-primary transition-colors p-1 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {isOwner ? (
                      <button
                        onClick={() => setDeleteTarget(activity.id)}
                        className="text-text-dim hover:text-error transition-colors p-1 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      info?.receivedShare && (
                        <button
                          onClick={() => hideReceived(info.receivedShare!.id)}
                          className="text-text-dim hover:text-text transition-colors p-1 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Masquer"
                          title="Masquer cette activité partagée"
                        >
                          <EyeOff size={14} />
                        </button>
                      )
                    )}
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
    </PullToRefresh>
  );
}
