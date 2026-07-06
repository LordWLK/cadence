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
    // On charge d'abord les préférences pour que la clé de cache en dépende :
    // sinon, ajouter/retirer une équipe favorite laissait le feen figé (cache
    // uniquement keyé sur la semaine) pour toute la session.
    setLoading(true);
    setError(null);

    let prefs;
    try {
      prefs = await getAll();
    } catch {
      setError('Impossible de charger les matchs');
      setLoading(false);
      return;
    }

    const prefsSignature = prefs
      .map((p) => `${p.sport}:${p.entity_type}:${p.entity_id}`)
      .sort()
      .join('|');
    const cacheKey = `${CACHE_KEY_PREFIX}${format(weekStart, 'yyyy-MM-dd')}__${prefsSignature}`;

    // Cache (validation de forme : un ancien format ne doit pas faire planter le rendu)
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.yourMatches) && Array.isArray(parsed?.bigMatches)) {
          setYourMatches(parsed.yourMatches);
          setBigMatches(parsed.bigMatches);
          setLoading(false);
          return;
        }
      } catch { /* cache corrompu → on refetch */ }
      sessionStorage.removeItem(cacheKey);
    }

    try {
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
    // La clé inclut désormais la signature des préférences : on purge toutes les
    // entrées de cache de cette semaine, quelle que soit la signature.
    const weekPrefix = `${CACHE_KEY_PREFIX}${format(weekStart, 'yyyy-MM-dd')}`;
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(weekPrefix)) sessionStorage.removeItem(key);
    }
  }, []);

  return { fetchFeed, clearCache, yourMatches, bigMatches, loading, error };
}

/**
 * TheSportsDB renvoie des horaires en UTC. Le timestamp (ou la date+heure reconstruite)
 * n'a pas toujours de marqueur de fuseau ; sans lui, parseISO l'interprète en heure locale
 * et l'heure affichée est décalée (-1h/-2h en France). On rend donc l'UTC explicite.
 */
function toUtcIso(event: SportsDbEvent): string {
  const base = event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}`;
  // Déjà un fuseau explicite (Z ou ±hh:mm) ?
  if (/(?:z|[+-]\d{2}:?\d{2})$/i.test(base)) return base;
  return `${base}Z`;
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
    date: toUtcIso(event),
    isBigMatch: isBig,
    isFavorite: isFavorite,
    sourceApiId: event.idEvent,
  };
}
