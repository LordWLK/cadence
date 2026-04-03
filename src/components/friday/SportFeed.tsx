'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSportFeed, type SportFeedEvent } from '@/lib/hooks/useSportFeed';
import { useSelectedEvents } from '@/lib/hooks/useSelectedEvents';
import { EventCard } from './EventCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Star, Flame, RefreshCw, Wifi } from 'lucide-react';
import { addDays } from 'date-fns';

export function SportFeed() {
  const { fetchFeed, clearCache, yourMatches, bigMatches, loading } = useSportFeed();
  const { create, getByWeek, remove } = useSelectedEvents();
  // Map: event sourceApiId -> selected_events row id (for removal)
  const [selectedMap, setSelectedMap] = useState<Map<string, string>>(new Map());

  const today = useMemo(() => new Date(), []);
  const weekEnd = useMemo(() => addDays(today, 7), [today]);

  const todayISO = useMemo(() => today.toISOString().split('T')[0], [today]);
  const weekEndISO = useMemo(() => weekEnd.toISOString().split('T')[0], [weekEnd]);

  // Load already-selected events from DB
  const loadSelected = useCallback(async () => {
    const events = await getByWeek(todayISO, weekEndISO);
    const map = new Map<string, string>();
    for (const ev of events) {
      if (ev.source_api_id) {
        map.set(ev.source_api_id, ev.id);
      }
    }
    setSelectedMap(map);
  }, [getByWeek, todayISO, weekEndISO]);

  useEffect(() => {
    loadSelected();
  }, [loadSelected]);

  useEffect(() => {
    fetchFeed(today, weekEnd);
  }, [fetchFeed, today, weekEnd]);

  const handleToggle = async (event: SportFeedEvent) => {
    const existingId = selectedMap.get(event.sourceApiId);

    if (existingId) {
      // Already selected → remove
      await remove(existingId);
      setSelectedMap(prev => {
        const next = new Map(prev);
        next.delete(event.sourceApiId);
        return next;
      });
    } else {
      // Not selected → add
      const result = await create({
        sport: event.sport,
        event_title: event.title,
        event_date: event.date,
        competition: event.competition,
        is_big_match: event.isBigMatch,
        source_api_id: event.sourceApiId,
      });
      if (result) {
        setSelectedMap(prev => new Map(prev).set(event.sourceApiId, result.id));
      }
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
          <p className="text-sm text-text-muted">Aucun match trouvé pour les 7 prochains jours</p>
          <p className="text-xs text-text-dim">
            Ajoute des equipes favoris dans les réglages sport pour voir des matchs ici
          </p>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw size={14} />
            Rafraîchir
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
              onToggle={handleToggle}
              isAdded={selectedMap.has(event.sourceApiId)}
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
              onToggle={handleToggle}
              isAdded={selectedMap.has(event.sourceApiId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
