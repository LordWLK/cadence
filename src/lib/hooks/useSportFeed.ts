'use client';

import { useState, useCallback } from 'react';
import { useSportPrefs } from './useSportPrefs';
import { getNextEventsByTeam, getNextEventsByLeague, type SportsDbEvent } from '@/lib/api/thesportsdb';
import { getNbaGames, getNbaStandings, type BdlGame } from '@/lib/api/balldontlie';
import { isFootballBigMatch, isNbaBigMatch, isMmaBigMatch } from '@/lib/api/big-match';
import { NBA_SEASON } from '@/lib/config/constants';
import { eachDayOfInterval, format } from 'date-fns';

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

    // Football & MMA: fetch from TheSportsDB
    const footballPrefs = prefs.filter(p => p.sport === 'football');
    const mmaPrefs = prefs.filter(p => p.sport === 'mma');

    // Fetch events for favorite teams
    const teamFetches = [...footballPrefs, ...mmaPrefs]
      .filter(p => p.entity_type !== 'competition')
      .map(async (pref) => {
        const events = await getNextEventsByTeam(pref.entity_id);
        return events
          .filter(e => e.dateEvent >= weekStartStr && e.dateEvent <= weekEndStr)
          .map(e => eventFromSportsDb(e, pref.sport as 'football' | 'mma', true));
      });

    // Fetch events for followed competitions
    const leagueFetches = [...footballPrefs, ...mmaPrefs]
      .filter(p => p.entity_type === 'competition')
      .map(async (pref) => {
        const events = await getNextEventsByLeague(pref.entity_id);
        return events
          .filter(e => e.dateEvent >= weekStartStr && e.dateEvent <= weekEndStr)
          .map(e => {
            const isFav = favoriteTeamIds.has(e.idHomeTeam) || favoriteTeamIds.has(e.idAwayTeam);
            const isBig = pref.sport === 'football' ? isFootballBigMatch(e) : isMmaBigMatch(e);
            return eventFromSportsDb(e, pref.sport as 'football' | 'mma', isFav, isBig);
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

    // NBA: fetch from BallDontLie
    const nbaPrefs = prefs.filter(p => p.sport === 'basketball');
    if (nbaPrefs.length > 0) {
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const dateStrs = days.map(d => format(d, 'yyyy-MM-dd'));
      const nbaFavoriteIds = new Set(nbaPrefs.filter(p => p.entity_type === 'franchise').map(p => Number(p.entity_id)));

      try {
        const [games, standings] = await Promise.all([
          getNbaGames(dateStrs),
          getNbaStandings(NBA_SEASON),
        ]);

        const topTeamIds = new Set<number>();
        if (standings.length > 0) {
          const eastTop = standings.filter(s => s.team.conference === 'East').slice(0, 6);
          const westTop = standings.filter(s => s.team.conference === 'West').slice(0, 6);
          for (const s of [...eastTop, ...westTop]) {
            topTeamIds.add(s.team.id);
          }
        }

        for (const game of games) {
          const isFav = nbaFavoriteIds.has(game.home_team.id) || nbaFavoriteIds.has(game.visitor_team.id);
          const isBig = isNbaBigMatch(game, topTeamIds);
          const eventId = `nba_${game.id}`;
          if (!seenEventIds.has(eventId)) {
            seenEventIds.add(eventId);
            allEvents.push({
              id: eventId,
              sport: 'basketball',
              title: `${game.visitor_team.full_name} @ ${game.home_team.full_name}`,
              homeTeam: game.home_team.full_name,
              awayTeam: game.visitor_team.full_name,
              competition: game.postseason ? 'NBA Playoffs' : 'NBA',
              date: game.date,
              isBigMatch: isBig,
              isFavorite: isFav,
              sourceApiId: eventId,
            });
          }
        }
      } catch {
        // NBA API might fail if no key
      }
    }

    // Sort by date
    allEvents.sort((a, b) => a.date.localeCompare(b.date));

    const yours = allEvents.filter(e => e.isFavorite);
    const bigs = allEvents.filter(e => !e.isFavorite && e.isBigMatch);

    setYourMatches(yours);
    setBigMatches(bigs);
    setLoading(false);

    // Cache
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ yourMatches: yours, bigMatches: bigs }));
    } catch { /* storage full */ }
  }, [getAll]);

  const clearCache = useCallback((weekStart: Date) => {
    sessionStorage.removeItem(CACHE_KEY_PREFIX + format(weekStart, 'yyyy-MM-dd'));
  }, []);

  return { fetchFeed, clearCache, yourMatches, bigMatches, loading };
}

function eventFromSportsDb(
  event: SportsDbEvent,
  sport: 'football' | 'mma',
  isFavorite: boolean,
  overrideBigMatch?: boolean
): SportFeedEvent {
  const isBig = overrideBigMatch ?? (sport === 'football' ? isFootballBigMatch(event) : isMmaBigMatch(event));
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
