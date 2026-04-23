'use client';

import { useEffect, useRef, useState } from 'react';
import { useProfile } from '@/lib/hooks/useProfile';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { User } from 'lucide-react';

/**
 * Modal automatique affichée quand l'utilisateur connecté n'a pas encore
 * renseigné de display_name. Elle se ferme dès qu'il en a saisi un.
 */
export function DisplayNameModal() {
  const { user } = useAuth();
  const { profile, update } = useProfile();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shouldShow = Boolean(user) && profile !== null && !profile?.display_name;

  useEffect(() => {
    if (shouldShow) inputRef.current?.focus();
  }, [shouldShow]);

  if (!shouldShow) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await update({ display_name: trimmed });
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="display-name-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: 'var(--color-surface-elevated)' }}
      >
        <div className="flex items-center gap-2">
          <User size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 id="display-name-title" className="font-semibold">Comment tu t'appelles ?</h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Ce nom sera visible par tes proches quand tu partages des activités.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom ou surnom"
          maxLength={40}
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          required
        />
        <Button type="submit" className="w-full" disabled={!name.trim() || saving}>
          {saving ? 'Enregistrement…' : 'Continuer'}
        </Button>
      </form>
    </div>
  );
}
