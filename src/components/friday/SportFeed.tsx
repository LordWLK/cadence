'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSportFeed, type SportFeedEvent } from '@/lib/hooks/useSportFeed';
import { useSelectedEvents } from '@/lib/hooks/useSelectedEvents';
import { EventCard } from './EventCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Star, Flame, RefreshCw, Wifi } from 'lucide-react';
import { addDays } from 'date-fns';

export function SportFeed() {
  const { fetchFeed, clearCache, yourMatches, bigMatches, loading } = useSportFeed();
  const { create } = useSelectedEvents();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Semaine glissante : aujourd'hui + 7 jours
  const today = useMemo(() => new Date(), []);
  const weekEnd = useMemo(() => addDays(today, 7), [today]);

  useEffect(() => {
    fetchFeed(today, weekEnd);
  }, [fetchFeed, today, weekEnd]);

  const handleAdd = async (event: SportFeedEvent) => {
    const result = await create({
      sport: event.sport,
      event_title: event.title,
      event_date: event.date,
      competition: event.competition,
      is_big_match: event.isBigMatch,
      source_api_id: event.sourceApiId,
    });
    if (result) {
      setAddedIds(prev => new Set([...prev, event.id]));
    }
  };

  const handleRefresh = () => {
    clearCache(today);
    fetchFeed(today, weekEnd);
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Wifi size={16} className="animate-pulse" />
            <span className="text-sm">Chargement des matchs...</span>
          </div>
          {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-elevated rounded-xl animate-pulse" />)}
        </div>
      </Card>
    );
  }

  if (yourMatches.length === 0 && bigMatches.length === 0) {
    return (
      <Card>
        <div className="text-center py-6 space-y-2">
          <p className="text-sm text-text-muted">Aucun match trouve pour les 7 prochains jours</p>
          <p className="text-xs text-text-dim">
            Ajoute des equipes favoris dans les reglages sport pour voir des matchs ici
          </p>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw size={14} />
            Rafraichir
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim uppercase tracking-wide">Feed sportif</p>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {yourMatches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-warning" />
            <p className="text-sm font-medium">Tes matchs</p>
          </div>
          {yourMatches.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onAdd={handleAdd}
              isAdded={addedIds.has(event.id)}
            />
          ))}
        </div>
      )}

      {bigMatches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-error" />
            <p className="text-sm font-medium">Gros matchs de la semaine</p>
          </div>
          {bigMatches.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onAdd={handleAdd}
              isAdded={addedIds.has(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
