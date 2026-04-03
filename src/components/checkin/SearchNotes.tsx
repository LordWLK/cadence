'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, X, Sun, Moon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MOOD_EMOJIS } from '@/lib/config/constants';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Checkin } from '@/lib/supabase/types';

export function SearchNotes() {
  const { searchNotes } = useCheckins();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Checkin[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchNotes(value.trim());
      setResults(data);
      setSearched(true);
      setLoading(false);
    }, 350);
  }, [searchNotes]);

  const clear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] text-[var(--color-text)] rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher dans tes notes..."
          aria-label="Rechercher dans tes notes"
          className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl pl-10 pr-10 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] transition-colors"
        />
        {query && (
          <button
            onClick={clear}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="text-center text-sm text-[var(--color-text-muted)] py-4">
          Aucun résultat pour &ldquo;{query}&rdquo;
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wide">
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </p>
          {results.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {c.type === 'morning'
                    ? <Sun size={14} className="text-[var(--color-warning)]" />
                    : <Moon size={14} className="text-[var(--color-accent-light)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{MOOD_EMOJIS[c.mood - 1]}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {format(new Date(c.date), 'EEEE dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  {c.note && (
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                      {highlightMatch(c.note, query)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
