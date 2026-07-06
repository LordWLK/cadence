'use client';

import { useState, useCallback, useRef } from 'react';
import type { CinemaMovie, CinemaFeedResponse } from '@/lib/types/cinema';

export function useCinemaFeed() {
  const [movies, setMovies] = useState<CinemaMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cinemaName, setCinemaName] = useState('');
  // Jeton de requête : seule la dernière requête lancée a le droit d'écrire l'état,
  // sinon une réponse lente pour une date précédente écrase la date sélectionnée.
  const requestRef = useRef(0);

  const fetchShowtimes = useCallback(async (cinemaId: string, date: string) => {
    const reqId = ++requestRef.current;
    const isStale = () => reqId !== requestRef.current;
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
        // On accepte le cache seulement s'il y a au moins une séance. Un cache vide
        // n'est pas mémorisé (voir plus bas) : on ne devrait donc pas en trouver ici.
        if (hasAnyShowtime) {
          if (isStale()) return;
          setMovies(data.movies);
          setCinemaName(data.cinemaName);
          setLoading(false);
          return;
        }
        // Sinon → cache suspect, on supprime et re-fetch
        sessionStorage.removeItem(cacheKey);
      } catch { sessionStorage.removeItem(cacheKey); /* cache corrompu */ }
    }

    try {
      const res = await fetch(`/api/cinema/showtimes?cinemaId=${encodeURIComponent(cinemaId)}&date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: CinemaFeedResponse = await res.json();
      if (isStale()) return; // une requête plus récente a pris la main
      setMovies(data.movies);
      setCinemaName(data.cinemaName);

      // On ne met en cache que des données réellement utiles (au moins une séance),
      // pour ne jamais figer un feed vide/cassé pour la session.
      const hasAnyShowtime = data.movies.some((m) => m.showtimes && m.showtimes.length > 0);
      if (hasAnyShowtime) {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err) {
      if (isStale()) return;
      console.error('Cinema feed error:', err);
      setError('Impossible de charger les séances');
      setMovies([]);
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, []);

  return { movies, loading, error, cinemaName, fetchShowtimes };
}
