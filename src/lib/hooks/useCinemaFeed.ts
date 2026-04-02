'use client';

import { useState, useCallback } from 'react';
import type { CinemaMovie, CinemaFeedResponse } from '@/lib/types/cinema';

export function useCinemaFeed() {
  const [movies, setMovies] = useState<CinemaMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [cinemaName, setCinemaName] = useState('');

  const fetchShowtimes = useCallback(async (cinemaId: string, date: string) => {
    setLoading(true);
    setMovies([]);

    // Check sessionStorage cache
    const cacheKey = `cinema-${cinemaId}-${date}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data: CinemaFeedResponse = JSON.parse(cached);
        setMovies(data.movies);
        setCinemaName(data.cinemaName);
        setLoading(false);
        return;
      } catch { /* ignore parse errors */ }
    }

    try {
      const res = await fetch(`/api/cinema/showtimes?cinemaId=${cinemaId}&date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: CinemaFeedResponse = await res.json();
      setMovies(data.movies);
      setCinemaName(data.cinemaName);

      // Cache for this session
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error('Cinema feed error:', err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { movies, loading, cinemaName, fetchShowtimes };
}
