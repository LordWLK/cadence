'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TeamPicker } from '@/components/settings/TeamPicker';
import { useSportPrefs } from '@/lib/hooks/useSportPrefs';
import { useAuth } from '@/providers/AuthProvider';
import { searchTeams, searchPlayers } from '@/lib/api/thesportsdb';
import { getNbaTeams, type BdlTeam } from '@/lib/api/balldontlie';
import { FOOTBALL_LEAGUES, SPORT_HEX } from '@/lib/config/constants';
import { ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';
import type { SportPreference } from '@/lib/supabase/types';

type Tab = 'football' | 'basketball' | 'mma';

export default function SportsSettingsPage() {
  const { user } = useAuth();
  const { getAll, add, remove } = useSportPrefs();
  const [prefs, setPrefs] = useState<SportPreference[]>([]);
  const [tab, setTab] = useState<Tab>('football');
  const [nbaTeams, setNbaTeams] = useState<BdlTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getAll();
    setPrefs(data);
    setLoading(false);
  }, [user, getAll]);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  useEffect(() => {
    if (tab === 'basketball' && nbaTeams.length === 0) {
      getNbaTeams().then(setNbaTeams);
    }
  }, [tab, nbaTeams.length]);

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Preferences sport</h1>
        <Card className="text-center py-8 space-y-4">
          <p className="text-text-muted">Connecte-toi d'abord</p>
          <Link href="/login"><Button><LogIn size={16} /> Se connecter</Button></Link>
        </Card>
      </div>
    );
  }

  const sportPrefs = (sport: string) => prefs.filter(p => p.sport === sport);

  const handleAdd = async (sport: Tab, entityType: string, entityId: string, entityName: string) => {
    await add({ sport, entity_type: entityType as SportPreference['entity_type'], entity_id: entityId, entity_name: entityName });
    loadPrefs();
  };

  const handleRemove = async (id: string) => {
    await remove(id);
    loadPrefs();
  };

  const tabs: { id: Tab; label: string; hex: string }[] = [
    { id: 'football', label: 'Football', hex: SPORT_HEX.football },
    { id: 'basketball', label: 'NBA', hex: SPORT_HEX.basketball },
    { id: 'mma', label: 'MMA/UFC', hex: SPORT_HEX.mma },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="sm" aria-label="Retour"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Preferences sport</h1>
          <p className="text-text-muted text-sm">Tes equipes et combattants favoris</p>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === t.id
              ? { backgroundColor: `${t.hex}20`, color: t.hex, boxShadow: `inset 0 0 0 1px ${t.hex}50` }
              : { backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }
            }
          >
            {t.label}
            {sportPrefs(t.id).length > 0 && (
              <span className="ml-1 text-xs opacity-60">({sportPrefs(t.id).length})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-surface-alt rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {tab === 'football' && (
            <div className="space-y-4">
              <Card>
                <p className="text-sm font-medium mb-3">Clubs favoris</p>
                <TeamPicker
                  sport="football"
                  entityType="club"
                  saved={sportPrefs('football').filter(p => p.entity_type === 'club')}
                  onSearch={async (q) => {
                    const teams = await searchTeams(q);
                    return teams
                      .filter(t => t.strSport === 'Soccer')
                      .map(t => ({ id: t.idTeam, name: t.strTeam, subtitle: t.strLeague, imageUrl: t.strTeamBadge ? t.strTeamBadge + '/tiny' : undefined }));
                  }}
                  onAdd={(item) => handleAdd('football', 'club', item.id, item.name)}
                  onRemove={handleRemove}
                  placeholder="Rechercher un club..."
                />
              </Card>

              <Card>
                <p className="text-sm font-medium mb-3">Competitions suivies</p>
                <div className="space-y-1">
                  {Object.entries(FOOTBALL_LEAGUES).map(([key, league]) => {
                    const isFollowed = sportPrefs('football').some(p => p.entity_type === 'competition' && p.entity_id === league.id);
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (isFollowed) {
                            const pref = sportPrefs('football').find(p => p.entity_type === 'competition' && p.entity_id === league.id);
                            if (pref) handleRemove(pref.id);
                          } else {
                            handleAdd('football', 'competition', league.id, league.name);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          isFollowed ? 'bg-sport-football/10 text-sport-football' : 'bg-surface-elevated text-text-muted hover:bg-border'
                        }`}
                      >
                        <span className="text-sm">{league.name}</span>
                        {isFollowed && <Badge variant="football">Suivi</Badge>}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {tab === 'basketball' && (
            <Card>
              <p className="text-sm font-medium mb-3">Franchises NBA favorites</p>
              {nbaTeams.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">
                  Configure ta cle BallDontLie dans les reglages pour voir les equipes NBA
                </p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {nbaTeams.map((team) => {
                    const isFollowed = sportPrefs('basketball').some(p => p.entity_id === String(team.id));
                    return (
                      <button
                        key={team.id}
                        onClick={() => {
                          if (isFollowed) {
                            const pref = sportPrefs('basketball').find(p => p.entity_id === String(team.id));
                            if (pref) handleRemove(pref.id);
                          } else {
                            handleAdd('basketball', 'franchise', String(team.id), team.full_name);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          isFollowed ? 'bg-sport-basketball/10 text-sport-basketball' : 'bg-surface-elevated text-text-muted hover:bg-border'
                        }`}
                      >
                        <div>
                          <span className="text-sm">{team.full_name}</span>
                          <span className="text-xs text-text-dim ml-2">{team.conference}</span>
                        </div>
                        {isFollowed && <Badge variant="basketball">Suivi</Badge>}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {tab === 'mma' && (
            <Card>
              <p className="text-sm font-medium mb-3">Combattants favoris</p>
              <TeamPicker
                sport="mma"
                entityType="fighter"
                saved={sportPrefs('mma').filter(p => p.entity_type === 'fighter')}
                onSearch={async (q) => {
                  const players = await searchPlayers(q);
                  return players
                    .filter(p => p.strSport === 'Fighting' || p.strSport === 'MMA')
                    .map(p => ({ id: p.idPlayer, name: p.strPlayer, subtitle: p.strTeam || p.strNationality, imageUrl: p.strThumb ? p.strThumb + '/tiny' : undefined }));
                }}
                onAdd={(item) => handleAdd('mma', 'fighter', item.id, item.name)}
                onRemove={handleRemove}
                placeholder="Rechercher un combattant..."
              />
              <div className="mt-4">
                <p className="text-sm font-medium mb-3">Competitions UFC suivies</p>
                <TeamPicker
                  sport="mma"
                  entityType="competition"
                  saved={sportPrefs('mma').filter(p => p.entity_type === 'competition')}
                  onSearch={async (q) => {
                    const teams = await searchTeams(q);
                    return teams
                      .filter(t => t.strSport === 'Fighting' || t.strLeague?.toLowerCase().includes('ufc'))
                      .map(t => ({ id: t.idTeam, name: t.strTeam, subtitle: t.strLeague }));
                  }}
                  onAdd={(item) => handleAdd('mma', 'competition', item.id, item.name)}
                  onRemove={handleRemove}
                  placeholder="Rechercher une competition UFC..."
                />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
