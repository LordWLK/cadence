'use client';

import { useState } from 'react';
import { Plus, Check, Clock, ChevronDown, Film } from 'lucide-react';
import type { CinemaMovie } from '@/lib/types/cinema';

interface MovieCardProps {
  movie: CinemaMovie;
  onToggle: (movie: CinemaMovie, showtime: string) => void;
  addedShowtimes: Set<string>; // set of "movieId-time" keys
}

export function MovieCard({ movie, onToggle, addedShowtimes }: MovieCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface-alt)',
        borderLeft: '4px solid var(--color-primary)',
      }}
    >
      <div className="p-3">
        <div className="flex gap-3">
          {/* Poster */}
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-14 h-20 rounded-lg object-cover shrink-0"
              style={{ border: '1px solid var(--color-border)' }}
            />
          ) : (
            <div
              className="w-14 h-20 rounded-lg shrink-0 flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
            >
              <Film size={20} className="text-text-dim" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">{movie.title}</p>
            {movie.director && (
              <p className="text-xs text-text-muted mt-0.5">{movie.director}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {movie.duration && (
                <span className="flex items-center gap-0.5 text-[10px] text-text-dim">
                  <Clock size={9} /> {movie.duration}
                </span>
              )}
              {movie.genres.slice(0, 2).map(g => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-elevated)] text-text-dim">
                  {g}
                </span>
              ))}
              {movie.label && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] font-medium">
                  {movie.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Showtimes */}
        {movie.showtimes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {movie.showtimes.map((st) => {
              const key = `${movie.id}-${st.time}`;
              const isAdded = addedShowtimes.has(key);
              return (
                <button
                  key={key}
                  onClick={() => onToggle(movie, st.time)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all active:scale-95"
                  style={isAdded
                    ? { backgroundColor: '#16a34a18', color: '#16a34a' }
                    : { backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }
                  }
                >
                  {isAdded ? <Check size={12} strokeWidth={2.5} /> : <Plus size={12} />}
                  <span className="font-medium">{st.time}</span>
                  {st.version && st.version !== 'VF' && (
                    <span className="text-[10px] opacity-70">{st.version}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Expand synopsis */}
        {movie.synopsis && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-[11px] text-text-dim"
          >
            <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Moins' : 'Synopsis'}
          </button>
        )}
        {expanded && movie.synopsis && (
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{movie.synopsis}</p>
        )}
      </div>
    </div>
  );
}
