'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { SportPreference } from '@/lib/supabase/types';

interface SearchResult {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
}

interface TeamPickerProps {
  sport: string;
  entityType: string;
  saved: SportPreference[];
  onSearch: (query: string) => Promise<SearchResult[]>;
  onAdd: (item: SearchResult) => void;
  onRemove: (id: string) => void;
  placeholder?: string;
}

export function TeamPicker({ sport, entityType, saved, onSearch, onAdd, onRemove, placeholder }: TeamPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const r = await onSearch(query);
      setResults(r);
      setSearching(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, onSearch]);

  const savedIds = new Set(saved.map(s => s.entity_id));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Rechercher...'}
          aria-label={placeholder || 'Rechercher'}
          className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim animate-spin" />}
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {results.filter(r => !savedIds.has(r.id)).slice(0, 8).map((item) => (
            <button
              key={item.id}
              onClick={() => { onAdd(item); setQuery(''); setResults([]); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-border transition-colors text-left"
            >
              {item.imageUrl && (
                <img src={item.imageUrl} alt="" loading="lazy" className="w-6 h-6 rounded object-contain bg-white/5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.name}</p>
                {item.subtitle && <p className="text-[10px] text-text-dim truncate">{item.subtitle}</p>}
              </div>
              <Plus size={14} className="text-primary shrink-0" />
            </button>
          ))}
        </div>
      )}

      {saved.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-text-dim">Tes favoris</p>
          <div className="flex flex-wrap gap-2">
            {saved.map((pref) => (
              <span
                key={pref.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated text-sm"
              >
                {pref.entity_name}
                <button onClick={() => onRemove(pref.id)} aria-label={`Retirer ${pref.entity_name}`} className="text-text-dim hover:text-error transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
