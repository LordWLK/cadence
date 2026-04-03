'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCinemaFeed } from '@/lib/hooks/useCinemaFeed';
import { useSelectedEvents } from '@/lib/hooks/useSelectedEvents';
import { MovieCard } from './MovieCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UGC_CINEMAS } from '@/lib/config/constants';
import { DayScroller } from './DayScroller';
import { Film, RefreshCw, ChevronDown } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { getRollingDays } from '@/lib/utils/dates';
import type { CinemaMovie } from '@/lib/types/cinema';

interface CinemaFeedProps {
  preferredCinemaIds: string[];
}

export function CinemaFeed({ preferredCinemaIds }: CinemaFeedProps) {
  const { movies, loading, cinemaName, fetchShowtimes } = useCinemaFeed();
  const { create, getByWeek, remove } = useSelectedEvents();
  const [selectedCinemaId, setSelectedCinemaId] = useState(preferredCinemaIds[0] || '');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [addedKeys, setAddedKeys] = useState<Map<string, string>>(new Map()); // key -> selected_event id
  const [showCinemaPicker, setShowCinemaPicker] = useState(false);

  const preferredCinemas = UGC_CINEMAS.filter(c => preferredCinemaIds.includes(c.id));
  const rollingDays = getRollingDays(14);

  // Load showtimes
  useEffect(() => {
    if (selectedCinemaId && selectedDate) {
      fetchShowtimes(selectedCinemaId, selectedDate);
    }
  }, [selectedCinemaId, selectedDate, fetchShowtimes]);

  // Load already-selected cinema events
  const loadSelected = useCallback(async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const endStr = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    const events = await getByWeek(todayStr, endStr);
    const map = new Map<string, string>();
    for (const ev of events) {
      if (ev.sport === 'cinema' && ev.source_api_id) {
        map.set(ev.source_api_id, ev.id);
      }
    }
    setAddedKeys(map);
  }, [getByWeek]);

  useEffect(() => {
    loadSelected();
  }, [loadSelected]);

  const handleToggle = async (movie: CinemaMovie, time: string) => {
    const key = `${movie.id}-${time}`;
    const existingId = addedKeys.get(key);

    if (existingId) {
      await remove(existingId);
      setAddedKeys(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    } else {
      // Create event with date + time
      const eventDate = `${selectedDate}T${time.replace('h', ':')}:00`;
      const result = await create({
        sport: 'cinema',
        event_title: `${movie.title}${cinemaName ? ` - ${cinemaName}` : ''}`,
        event_date: eventDate,
        competition: cinemaName || 'UGC',
        is_big_match: false,
        source_api_id: key,
      });
      if (result) {
        setAddedKeys(prev => new Map(prev).set(key, result.id));
      }
    }
  };

  if (preferredCinemaIds.length === 0) {
    return (
      <Card>
        <div className="text-center py-6 space-y-2">
          <Film size={28} className="text-text-dim mx-auto" />
          <p className="text-sm text-text-muted">Aucun cinéma configuré</p>
          <p className="text-xs text-text-dim">
            Ajoute tes cinémas UGC favoris dans Réglages pour voir les séances ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim uppercase tracking-wide">Séances cinéma</p>
      </div>

      {/* Cinema picker */}
      <div className="relative">
        <button
          onClick={() => setShowCinemaPicker(!showCinemaPicker)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
        >
          <span className="truncate">
            {preferredCinemas.find(c => c.id === selectedCinemaId)?.name || 'Cinema'}
          </span>
          <ChevronDown size={14} className={`shrink-0 ml-1 transition-transform ${showCinemaPicker ? 'rotate-180' : ''}`} />
        </button>
        {showCinemaPicker && (
          <div
            className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden shadow-lg"
            style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
          >
            {preferredCinemas.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCinemaId(c.id); setShowCinemaPicker(false); }}
                className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-[var(--color-surface-alt)]"
                style={c.id === selectedCinemaId ? { color: 'var(--color-primary)', fontWeight: 600 } : {}}
              >
                {c.name}
                <span className="text-text-dim ml-1">{c.city}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date picker - 14 jours glissants */}
      <DayScroller days={rollingDays} selected={selectedDate} onChange={setSelectedDate} />

      {/* Movies list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-elevated rounded-xl animate-pulse" />)}
        </div>
      ) : movies.length === 0 ? (
        <Card>
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-text-muted">Aucune séance trouvée</p>
            <p className="text-xs text-text-dim">Essaie une autre date ou un autre cinéma</p>
            <Button variant="ghost" size="sm" onClick={() => fetchShowtimes(selectedCinemaId, selectedDate)}>
              <RefreshCw size={14} /> Rafraîchir
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {movies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onToggle={handleToggle}
              addedShowtimes={new Set([...addedKeys.keys()])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
