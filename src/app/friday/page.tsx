'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ActivityForm } from '@/components/friday/ActivityForm';
import { useActivities } from '@/lib/hooks/useActivities';
import { useAuth } from '@/providers/AuthProvider';
import { getNextWeekStart, getWeekStart, formatDate, formatDateISO, getDayName } from '@/lib/utils/dates';
import { ACTIVITY_CATEGORIES } from '@/lib/config/constants';
import { SportFeed } from '@/components/friday/SportFeed';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CalendarPlus, Trash2, LogIn, Dumbbell, Tv, Users, Lightbulb, Coffee, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { WeeklyActivity } from '@/lib/supabase/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Tv, Users, Lightbulb, Coffee, Sparkles,
};

export default function FridayPage() {
  const { user } = useAuth();
  const { getByWeek, remove } = useActivities();
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const nextWeekStart = getNextWeekStart();
  const weekStartISO = formatDateISO(nextWeekStart);

  const loadActivities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getByWeek(weekStartISO);
    setActivities(data);
    setLoading(false);
  }, [user, getByWeek, weekStartISO]);

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

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    await remove(id);
    loadActivities();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planifier ma semaine</h1>
        <p className="text-text-muted text-sm mt-1">
          Semaine du {formatDate(nextWeekStart, 'dd MMM yyyy')}
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

      <ActivityForm weekStart={nextWeekStart} onCreated={loadActivities} />

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-alt rounded-2xl animate-pulse" />)}
        </div>
      ) : activities.length === 0 ? (
        <Card className="text-center py-8 space-y-3">
          <CalendarPlus size={32} className="text-text-dim mx-auto" />
          <p className="text-text-muted text-sm">Rien de prevu pour le moment</p>
          <p className="text-text-dim text-xs">Ajoute tes activites cool pour la semaine prochaine !</p>
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
                const cat = ACTIVITY_CATEGORIES.find(c => c.id === activity.category);
                const Icon = cat ? (ICON_MAP[cat.icon] || Sparkles) : Sparkles;
                return (
                  <Card key={activity.id} className="flex items-center gap-3">
                    <div className={`shrink-0 ${cat?.color || 'text-text-muted'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-text-dim">{cat?.label}</p>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(activity.id)}
                      className="text-text-dim hover:text-error transition-colors p-1"
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
    </div>
  );
}
