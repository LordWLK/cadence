import {
  TOP_FOOTBALL_TEAMS,
  KNOWN_DERBIES,
  CL_KNOCKOUT_KEYWORDS,
  MMA_BIG_MATCH_KEYWORDS,
  NBA_BIG_MATCH_KEYWORDS,
} from '@/lib/config/constants';
import type { SportsDbEvent } from './thesportsdb';

export function isFootballBigMatch(event: SportsDbEvent): boolean {
  const leagueTopTeams = TOP_FOOTBALL_TEAMS[event.idLeague];

  // Check if both teams are top teams in their league
  if (leagueTopTeams) {
    const homeIsTop = leagueTopTeams.includes(event.idHomeTeam);
    const awayIsTop = leagueTopTeams.includes(event.idAwayTeam);
    if (homeIsTop && awayIsTop) return true;
  }

  // Check known derbies
  const isDerby = KNOWN_DERBIES.some(
    ([a, b]) =>
      (event.idHomeTeam === a && event.idAwayTeam === b) ||
      (event.idHomeTeam === b && event.idAwayTeam === a)
  );
  if (isDerby) return true;

  // Champions League knockout stages
  if (event.idLeague === '4480') {
    const desc = (event.strDescriptionEN || event.strEvent || '').toLowerCase();
    if (CL_KNOCKOUT_KEYWORDS.some(kw => desc.includes(kw))) return true;
    // Any CL match between top teams from different leagues
    const allTopTeams = Object.values(TOP_FOOTBALL_TEAMS).flat();
    if (allTopTeams.includes(event.idHomeTeam) && allTopTeams.includes(event.idAwayTeam)) return true;
  }

  return false;
}

export function isNbaBigMatch(event: SportsDbEvent): boolean {
  const text = (
    (event.strDescriptionEN || '') + ' ' +
    (event.strEvent || '') + ' ' +
    (event.strLeague || '')
  ).toLowerCase();
  // Playoff/finals keywords
  if (NBA_BIG_MATCH_KEYWORDS.some(kw => text.includes(kw))) return true;
  return false;
}

export function isMmaBigMatch(event: SportsDbEvent): boolean {
  const text = (
    (event.strDescriptionEN || '') + ' ' +
    (event.strEvent || '')
  ).toLowerCase();
  return MMA_BIG_MATCH_KEYWORDS.some(kw => text.includes(kw));
}
