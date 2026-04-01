import { getConfig } from '@/lib/config/storage';

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

function getApiKey(): string {
  return '123';
}

function apiUrl(endpoint: string): string {
  return `${BASE_URL}/${getApiKey()}/${endpoint}`;
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
  try {
    const res = await fetch(apiUrl(`searchteams.php?t=${encodeURIComponent(query)}`));
    const data = await res.json();
    return data.teams || [];
  } catch {
    return [];
  }
}

export async function getNextEventsByTeam(teamId: string): Promise<SportsDbEvent[]> {
  try {
    const res = await fetch(apiUrl(`eventsnext.php?id=${teamId}`));
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export async function getNextEventsByLeague(leagueId: string): Promise<SportsDbEvent[]> {
  try {
    const res = await fetch(apiUrl(`eventsnextleague.php?id=${leagueId}`));
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
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
  try {
    const res = await fetch(apiUrl(`searchplayers.php?p=${encodeURIComponent(query)}`));
    const data = await res.json();
    return data.player || [];
  } catch {
    return [];
  }
}

/** Get all teams in a league (e.g., NBA league ID = 4387) */
export async function getTeamsByLeague(leagueId: string): Promise<SportsDbTeam[]> {
  try {
    const res = await fetch(apiUrl(`lookup_all_teams.php?id=${leagueId}`));
    const data = await res.json();
    return data.teams || [];
  } catch {
    return [];
  }
}

// NBA league ID on TheSportsDB
export const NBA_LEAGUE_ID = '4387';
