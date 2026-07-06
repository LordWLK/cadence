import { throttleSportsDb } from '@/lib/utils/rateLimiter';

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

function getApiKey(): string {
  return '123';
}

function apiUrl(endpoint: string): string {
  return `${BASE_URL}/${getApiKey()}/${endpoint}`;
}

/**
 * fetch + parse JSON avec timeout et vérification du statut HTTP.
 * LÈVE une erreur en cas de réseau KO / statut non-2xx / timeout, afin que l'appelant
 * puisse distinguer « aucun événement » d'un « échec de chargement » (et éviter de
 * mettre en cache un feed vide pour toute la session).
 */
async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`TheSportsDB HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export interface SportsDbTeam {
  idTeam: string;
  strTeam: string;
  strTeamBadge: string;
  strLeague: string;
  idLeague: string;
  strSport: string;
  strCountry: string;
}

export interface SportsDbEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strLeague: string;
  idLeague: string;
  strTimestamp: string;
  dateEvent: string;
  strTime: string;
  strSport: string;
  strThumb: string | null;
  strDescriptionEN: string | null;
}

export async function searchTeams(query: string): Promise<SportsDbTeam[]> {
  if (!query.trim()) return [];
  return throttleSportsDb(async () => {
    try {
      const data = await fetchJson(apiUrl(`searchteams.php?t=${encodeURIComponent(query)}`));
      return (data.teams as SportsDbTeam[]) || [];
    } catch {
      return [];
    }
  });
}

export async function getNextEventsByTeam(teamId: string): Promise<SportsDbEvent[]> {
  // Laisse remonter l'erreur : useSportFeed distingue ainsi un échec réseau
  // (à ne pas mettre en cache) d'une absence réelle de matchs.
  return throttleSportsDb(async () => {
    const data = await fetchJson(apiUrl(`eventsnext.php?id=${encodeURIComponent(teamId)}`));
    return (data.events as SportsDbEvent[]) || [];
  });
}

export async function getNextEventsByLeague(leagueId: string): Promise<SportsDbEvent[]> {
  return throttleSportsDb(async () => {
    const data = await fetchJson(apiUrl(`eventsnextleague.php?id=${encodeURIComponent(leagueId)}`));
    return (data.events as SportsDbEvent[]) || [];
  });
}

export async function searchPlayers(query: string): Promise<Array<{
  idPlayer: string;
  strPlayer: string;
  strTeam: string;
  strSport: string;
  strNationality: string;
  strThumb: string | null;
}>> {
  if (!query.trim()) return [];
  return throttleSportsDb(async () => {
    try {
      const data = await fetchJson(apiUrl(`searchplayers.php?p=${encodeURIComponent(query)}`));
      return (data.player as Array<{ idPlayer: string; strPlayer: string; strTeam: string; strSport: string; strNationality: string; strThumb: string | null }>) || [];
    } catch {
      return [];
    }
  });
}

/** Get all teams in a league (e.g., NBA league ID = 4387) */
export async function getTeamsByLeague(leagueId: string): Promise<SportsDbTeam[]> {
  return throttleSportsDb(async () => {
    try {
      const data = await fetchJson(apiUrl(`lookup_all_teams.php?id=${encodeURIComponent(leagueId)}`));
      return (data.teams as SportsDbTeam[]) || [];
    } catch {
      return [];
    }
  });
}

// NBA league ID on TheSportsDB
export const NBA_LEAGUE_ID = '4387';
