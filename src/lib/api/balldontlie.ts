import { getConfig } from '@/lib/config/storage';

const BASE_URL = 'https://api.balldontlie.io/v1';

function getHeaders(): HeadersInit {
  const key = getConfig()?.ballDontLieKey;
  if (!key) return {};
  return { Authorization: key };
}

export interface BdlTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

export interface BdlGame {
  id: number;
  date: string;
  home_team: BdlTeam;
  visitor_team: BdlTeam;
  home_team_score: number;
  visitor_team_score: number;
  season: number;
  status: string;
  time: string;
  postseason: boolean;
}

export async function getNbaTeams(): Promise<BdlTeam[]> {
  try {
    const res = await fetch(`${BASE_URL}/teams`, { headers: getHeaders() });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getNbaGames(dates: string[]): Promise<BdlGame[]> {
  if (dates.length === 0) return [];
  try {
    const params = dates.map(d => `dates[]=${d}`).join('&');
    const res = await fetch(`${BASE_URL}/games?${params}&per_page=100`, { headers: getHeaders() });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getNbaStandings(season: number): Promise<Array<{
  team: BdlTeam;
  conference_rank: number;
  wins: number;
  losses: number;
}>> {
  try {
    const res = await fetch(`${BASE_URL}/standings?season=${season}`, { headers: getHeaders() });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}
