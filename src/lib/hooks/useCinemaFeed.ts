'use client';

import { useState, useCallback } from 'react';
import type { CinemaMovie, CinemaFeedResponse } from '@/lib/types/cinema';

export function useCinemaFeed() {
  const [movies, setMovies] = useState<CinemaMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cinemaName, setCinemaName] = useState('');

  const fetchShowtimes = useCallback(async (cinemaId: string, date: string) => {
    setLoading(true);
    setError(null);
    setMovies([]);

    // Check sessionStorage cache — mais seulement si les données semblent valides
    // (au moins une séance dans au moins un film). Sinon on considère le cache stale.
    const cacheKey = `cinema-${cinemaId}-${date}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data: CinemaFeedResponse = JSON.parse(cached);
        const hasAnyShowtime = data.movies.some((m) => m.showtimes && m.showtimes.length > 0);
        // On accepte le cache si : il y a au moins une séance, OU si la liste de films est vide
        // (cas légitime : cinéma fermé ce jour-là)
        if (hasAnyShowtime || data.movies.length === 0) {
          setMovies(data.movies);
          setCinemaName(data.cinemaName);
          setLoading(false);
          return;
        }
        // Sinon (films sans séances) → cache suspect, on supprime et re-fetch
        sessionStorage.removeItem(cacheKey);
      } catch { sessionStorage.removeItem(cacheKey); /* cache corrompu */ }
    }

    try {
      const res = await fetch(`/api/cinema/showtimes?cinemaId=${cinemaId}&date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: CinemaFeedResponse = await res.json();
      setMovies(data.movies);
      setCinemaName(data.cinemaName);

      // Cache uniquement si les données sont valides (évite de mémoriser du broken)
      const hasAnyShowtime = data.movies.some((m) => m.showtimes && m.showtimes.length > 0);
      if (hasAnyShowtime || data.movies.length === 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Cinema feed error:', err);
      setError('Impossible de charger les séances');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { movies, loading, error, cinemaName, fetchShowtimes };
}
