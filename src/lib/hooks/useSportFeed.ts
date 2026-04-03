'use client';

import { useState, useCallback } from 'react';
import { useSportPrefs } from './useSportPrefs';
import { getNextEventsByTeam, getNextEventsByLeague, type SportsDbEvent } from '@/lib/api/thesportsdb';
import { isFootballBigMatch, isNbaBigMatch, isMmaBigMatch } from '@/lib/api/big-match';
import { format } from 'date-fns';

export interface SportFeedEvent {
  id: string;
  sport: 'football' | 'basketball' | 'mma';
  title: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  date: string; // ISO timestamp
  isBigMatch: boolean;
  isFavorite: boolean;
  sourceApiId: string;
}

const CACHE_KEY_PREFIX = 'cadence_sport_feed_';

export function useSportFeed() {
  const { getAll } = useSportPrefs();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yourMatches, setYourMatches] = useState<SportFeedEvent[]>([]);
  const [bigMatches, setBigMatches] = useState<SportFeedEvent[]>([]);

  const fetchFeed = useCallback(async (weekStart: Date, weekEnd: Date) => {
    // Check cache
    const cacheKey = CACHE_KEY_PREFIX + format(weekStart, 'yyyy-MM-dd');
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { yourMatches: ym, bigMatches: bm } = JSON.parse(cached);
        setYourMatches(ym);
        setBigMatches(bm);
        return;
      } catch { /* ignore cache errors */ }
    }

    setLoading(true);
    setError(null);

    try {
      const prefs = await getAll();
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      const allEvents: SportFeedEvent[] = [];
      const favoriteTeamIds = new Set<string>();
      const favoriteCompetitionIds = new Set<string>();
      const seenEventIds = new Set<string>();

      // Separate prefs by type
      for (const p of prefs) {
        if (p.entity_type === 'competition') {
          favoriteCompetitionIds.add(p.entity_id);
        } else {
          favoriteTeamIds.add(p.entity_id);
        }
      }

      // All sports use TheSportsDB now
      const footballPrefs = prefs.filter(p => p.sport === 'football');
      const nbaPrefs = prefs.filter(p => p.sport === 'basketball');
      const mmaPrefs = prefs.filter(p => p.sport === 'mma');

      // Fetch events for favorite teams (football + mma + nba franchises)
      const teamFetches = [...footballPrefs, ...mmaPrefs, ...nbaPrefs]
        .filter(p => p.entity_type !== 'competition')
        .map(async (pref) => {
          const events = await getNextEventsByTeam(pref.entity_id);
          return events
            .filter(e => e.dateEvent >= weekStartStr && e.dateEvent <= weekEndStr)
            .map(e => eventFromSportsDb(e, pref.sport as 'football' | 'mma' | 'basketball', true));
        });

      // Fetch events for followed competitions (football leagues + nba league + mma)
      const leagueFetches = [...footballPrefs, ...mmaPrefs, ...nbaPrefs]
        .filter(p => p.entity_type === 'competition')
        .map(async (pref) => {
          const events = await getNextEventsByLeague(pref.entity_id);
          return events
            .filter(e => e.dateEvent >= weekStartStr && e.dateEvent <= weekEndStr)
            .map(e => {
              const isFav = favoriteTeamIds.has(e.idHomeTeam) || favoriteTeamIds.has(e.idAwayTeam);
              const sport = pref.sport as 'football' | 'mma' | 'basketball';
              let isBig = false;
              if (sport === 'football') isBig = isFootballBigMatch(e);
              else if (sport === 'mma') isBig = isMmaBigMatch(e);
              else if (sport === 'basketball') isBig = isNbaBigMatch(e);
              return eventFromSportsDb(e, sport, isFav, isBig);
            });
        });

      const teamResults = await Promise.all(teamFetches);
      const leagueResults = await Promise.all(leagueFetches);

      for (const events of [...teamResults, ...leagueResults]) {
        for (const e of events) {
          if (!seenEventIds.has(e.sourceApiId)) {
            seenEventIds.add(e.sourceApiId);
            allEvents.push(e);
          }
        }
      }

      // Sort by date
      allEvents.sort((a, b) => a.date.localeCompare(b.date));

      const yours = allEvents.filter(e => e.isFavorite);
      const bigs = allEvents.filter(e => !e.isFavorite && e.isBigMatch);

      setYourMatches(yours);
      setBigMatches(bigs);

      // Cache
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ yourMatches: yours, bigMatches: bigs }));
      } catch { /* storage full */ }
    } catch (err) {
      console.error('Sport feed error:', err);
      setError('Impossible de charger les matchs');
    } finally {
      setLoading(false);
    }
  }, [getAll]);

  const clearCache = useCallback((weekStart: Date) => {
    sessionStorage.removeItem(CACHE_KEY_PREFIX + format(weekStart, 'yyyy-MM-dd'));
  }, []);

  return { fetchFeed, clearCache, yourMatches, bigMatches, loading, error };
}

function eventFromSportsDb(
  event: SportsDbEvent,
  sport: 'football' | 'mma' | 'basketball',
  isFavorite: boolean,
  overrideBigMatch?: boolean
): SportFeedEvent {
  let isBig = overrideBigMatch;
  if (isBig === undefined) {
    if (sport === 'football') isBig = isFootballBigMatch(event);
    else if (sport === 'mma') isBig = isMmaBigMatch(event);
    else isBig = isNbaBigMatch(event);
  }
  return {
    id: `sdb_${event.idEvent}`,
    sport,
    title: event.strEvent,
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    competition: event.strLeague,
    date: event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}`,
    isBigMatch: isBig,
    isFavorite: isFavorite,
    sourceApiId: event.idEvent,
  };
}
