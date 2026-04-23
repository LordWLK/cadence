'use client';

import { useState } from 'react';
import { Share2, Pencil, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useContacts } from '@/lib/hooks/useContacts';

export interface ShareTarget {
  userId: string;
  canEdit: boolean;
}

interface ShareSelectorProps {
  value: ShareTarget[];
  onChange: (next: ShareTarget[]) => void;
  compact?: boolean;
}

/**
 * Sélecteur de contacts avec qui partager une activité.
 * - Cases à cocher pour chaque contact accepté
 * - Pour chaque sélectionné, toggle "lecture seule" / "peut modifier"
 * - Rien de visible si l'utilisateur n'a pas encore de contacts
 */
export function ShareSelector({ value, onChange, compact = false }: ShareSelectorProps) {
  const { accepted, loading } = useContacts();
  const [expanded, setExpanded] = useState(!compact);

  // Ne rien afficher si pas de contacts ET pas en train de charger
  if (!loading && accepted.length === 0) return null;

  const toggleContact = (userId: string) => {
    const existing = value.find((s) => s.userId === userId);
    if (existing) {
      onChange(value.filter((s) => s.userId !== userId));
    } else {
      onChange([...value, { userId, canEdit: false }]);
    }
  };

  const toggleCanEdit = (userId: string) => {
    onChange(value.map((s) => (s.userId === userId ? { ...s, canEdit: !s.canEdit } : s)));
  };

  const selectedCount = value.length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm py-1"
      >
        <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <Share2 size={14} />
          Partager avec
          {selectedCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 18%, transparent)',
                color: 'var(--color-primary)',
              }}
            >
              {selectedCount}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {loading && accepted.length === 0 && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-dim)' }}>
              Chargement…
            </p>
          )}
          {accepted.map((c) => {
            const selected = value.find((s) => s.userId === c.profile.user_id);
            const isOn = Boolean(selected);
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: isOn
                    ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                    : 'var(--color-surface)',
                  border: '1px solid ' + (isOn ? 'color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'var(--color-border)'),
                }}
              >
                <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggleContact(c.profile.user_id)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isOn ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                      border: '1px solid ' + (isOn ? 'var(--color-primary)' : 'var(--color-border-strong)'),
                    }}
                  >
                    {isOn && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <Avatar profile={c.profile} nickname={c.nickname} size={24} />
                  <span className="text-xs truncate">
                    {c.nickname || c.profile.display_name || c.profile.email}
                  </span>
                </label>

                {isOn && (
                  <button
                    type="button"
                    onClick={() => toggleCanEdit(c.profile.user_id)}
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: selected!.canEdit
                        ? 'color-mix(in srgb, var(--color-warning) 15%, transparent)'
                        : 'var(--color-surface-elevated)',
                      color: selected!.canEdit ? 'var(--color-warning)' : 'var(--color-text-muted)',
                    }}
                    title={selected!.canEdit ? 'Peut modifier' : 'Lecture seule (cliquer pour permettre la modification)'}
                  >
                    {selected!.canEdit ? (
                      <>
                        <Pencil size={10} />
                        Modif.
                      </>
                    ) : (
                      <>
                        <Eye size={10} />
                        Lecture
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
