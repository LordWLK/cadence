'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { useCinemaPreferences, type CinemaPreference } from '@/lib/hooks/useCinemaPreferences';
import { UGC_CINEMAS } from '@/lib/config/constants';
import { ArrowLeft, LogIn, Film, Search, X, Check, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function CinemaSettingsPage() {
  const { user } = useAuth();
  const { getAll, add, remove, loading } = useCinemaPreferences();
  const [prefs, setPrefs] = useState<CinemaPreference[]>([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [search, setSearch] = useState('');

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    setLoadingPrefs(true);
    const data = await getAll();
    setPrefs(data);
    setLoadingPrefs(false);
  }, [user, getAll]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Cinemas favoris</h1>
        <Card className="text-center py-8 space-y-4">
          <p className="text-text-muted">Connecte-toi d'abord</p>
          <Link href="/login"><Button><LogIn size={16} /> Se connecter</Button></Link>
        </Card>
      </div>
    );
  }

  const savedIds = new Set(prefs.map(p => p.cinema_id));

  const handleToggle = async (cinema: { id: string; name: string }) => {
    if (savedIds.has(cinema.id)) {
      const pref = prefs.find(p => p.cinema_id === cinema.id);
      if (pref) {
        await remove(pref.id);
        loadPrefs();
      }
    } else {
      await add(cinema.id, cinema.name);
      loadPrefs();
    }
  };

  // Group cinemas by city
  const cities = [...new Set(UGC_CINEMAS.map(c => c.city))];

  const filtered = search.trim()
    ? UGC_CINEMAS.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
      )
    : UGC_CINEMAS;

  const filteredCities = [...new Set(filtered.map(c => c.city))];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="sm" aria-label="Retour"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Cinemas UGC</h1>
          <p className="text-text-muted text-sm">
            {prefs.length > 0
              ? `${prefs.length} cinema${prefs.length > 1 ? 's' : ''} selectionne${prefs.length > 1 ? 's' : ''}`
              : 'Choisis tes cinemas favoris'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un cinema ou une ville..."
          className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Selected cinemas summary */}
      {prefs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prefs.map(p => (
            <button
              key={p.id}
              onClick={() => handleToggle({ id: p.cinema_id, name: p.cinema_name })}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
              style={{
                backgroundColor: 'color-mix(in srgb, #7c3aed 15%, transparent)',
                color: '#7c3aed',
              }}
            >
              {p.cinema_name}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      {/* Cinema list by city */}
      {loadingPrefs ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-alt rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCities.map(city => {
            const cityCinemas = filtered.filter(c => c.city === city);
            return (
              <div key={city}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin size={12} className="text-text-dim" />
                  <p className="text-xs text-text-dim uppercase tracking-wide font-medium">{city}</p>
                </div>
                <div className="space-y-1">
                  {cityCinemas.map(cinema => {
                    const isSelected = savedIds.has(cinema.id);
                    return (
                      <button
                        key={cinema.id}
                        onClick={() => handleToggle(cinema)}
                        disabled={loading}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                        style={isSelected
                          ? {
                              backgroundColor: 'color-mix(in srgb, #7c3aed 12%, transparent)',
                              color: '#7c3aed',
                              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, #7c3aed 30%, transparent)',
                            }
                          : {
                              backgroundColor: 'var(--color-surface-elevated)',
                              color: 'var(--color-text-muted)',
                            }
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Film size={16} className={isSelected ? '' : 'opacity-40'} />
                          <span className="font-medium text-left">{cinema.name.replace('UGC ', '')}</span>
                        </div>
                        {isSelected && <Check size={16} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="text-center py-6">
          <p className="text-sm text-text-muted">Aucun cinema trouve</p>
        </Card>
      )}
    </div>
  );
}
