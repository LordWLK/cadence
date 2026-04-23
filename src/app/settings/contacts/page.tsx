'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, UserPlus, Check, X, LogIn, Clock, Users, Inbox } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/lib/hooks/useProfile';
import { useContacts } from '@/lib/hooks/useContacts';
import { useToast } from '@/components/ui/Toast';
import type { ContactWithProfile } from '@/lib/supabase/types';

export default function ContactsSettingsPage() {
  const { user } = useAuth();
  const { searchByEmail } = useProfile();
  const {
    accepted,
    outgoingPending,
    incomingPending,
    loading,
    sendRequest,
    accept,
    remove,
  } = useContacts();
  const { showToast } = useToast();

  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);

  if (!user) {
    return (
      <div className="space-y-6">
        <BackLink />
        <h1 className="text-2xl font-bold">Mes proches</h1>
        <Card className="text-center py-8 space-y-4">
          <p style={{ color: 'var(--color-text-muted)' }}>Connecte-toi pour gérer tes contacts</p>
          <Link href="/login"><Button><LogIn size={16} /> Se connecter</Button></Link>
        </Card>
      </div>
    );
  }

  const handleSearchAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed === user.email?.toLowerCase()) {
      showToast("Tu ne peux pas t'ajouter toi-même", 'error');
      return;
    }
    setSearching(true);
    const foundProfile = await searchByEmail(trimmed);
    if (!foundProfile) {
      showToast('Aucun utilisateur trouvé avec cet email', 'error');
      setSearching(false);
      return;
    }
    const result = await sendRequest(foundProfile.user_id);
    if (result.ok) {
      showToast(`Demande envoyée à ${foundProfile.display_name || foundProfile.email}`, 'success');
      setSearchEmail('');
    } else {
      showToast(result.error || 'Erreur', 'error');
    }
    setSearching(false);
  };

  return (
    <div className="space-y-6">
      <BackLink />

      <div>
        <h1 className="text-2xl font-bold">Mes proches</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Partage tes activités avec tes amis et ta famille
        </p>
      </div>

      {/* Recherche + ajout */}
      <Card>
        <form onSubmit={handleSearchAndSend} className="space-y-3">
          <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
            <UserPlus size={18} />
            <h2 className="font-semibold text-sm">Ajouter un proche</h2>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-dim)' }}
              />
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="email@cadence.app"
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <Button type="submit" disabled={!searchEmail.trim() || searching}>
              {searching ? '…' : 'Envoyer'}
            </Button>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            La personne doit déjà avoir un compte Cadence.
          </p>
        </form>
      </Card>

      {/* Demandes reçues */}
      {incomingPending.length > 0 && (
        <Section title="Demandes reçues" count={incomingPending.length} icon={<Inbox size={16} />}>
          {incomingPending.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              actions={
                <>
                  <button
                    onClick={async () => {
                      await accept(c.id);
                      showToast('Demande acceptée', 'success');
                    }}
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
                      color: 'var(--color-success)',
                    }}
                    aria-label="Accepter"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      await remove(c.id);
                      showToast('Demande refusée', 'info');
                    }}
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
                      color: 'var(--color-error)',
                    }}
                    aria-label="Refuser"
                  >
                    <X size={16} />
                  </button>
                </>
              }
            />
          ))}
        </Section>
      )}

      {/* Demandes en attente (émises) */}
      {outgoingPending.length > 0 && (
        <Section title="En attente" count={outgoingPending.length} icon={<Clock size={16} />}>
          {outgoingPending.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              badge="En attente"
              actions={
                <button
                  onClick={async () => {
                    await remove(c.id);
                    showToast('Demande annulée', 'info');
                  }}
                  className="p-2 rounded-lg"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label="Annuler la demande"
                >
                  <X size={16} />
                </button>
              }
            />
          ))}
        </Section>
      )}

      {/* Contacts acceptés */}
      <Section
        title="Mes contacts"
        count={accepted.length}
        icon={<Users size={16} />}
      >
        {loading && accepted.length === 0 ? (
          <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-muted)' }}>
            Chargement…
          </p>
        ) : accepted.length === 0 ? (
          <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-muted)' }}>
            Aucun contact pour l&apos;instant. Ajoute un proche pour commencer à partager des activités.
          </p>
        ) : (
          accepted.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              actions={
                <button
                  onClick={async () => {
                    if (confirm(`Retirer ${c.profile.display_name || c.profile.email} de tes contacts ?`)) {
                      await remove(c.id);
                      showToast('Contact retiré', 'info');
                    }
                  }}
                  className="p-2 rounded-lg"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label="Retirer"
                >
                  <X size={16} />
                </button>
              }
            />
          ))
        )}
      </Section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/settings"
      className="inline-flex items-center gap-1.5 text-sm"
      style={{ color: 'var(--color-text-muted)' }}
    >
      <ArrowLeft size={14} />
      Réglages
    </Link>
  );
}

function Section({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
        {typeof count === 'number' && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-surface-alt)',
              color: 'var(--color-text-muted)',
            }}
          >
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ContactRow({
  contact,
  actions,
  badge,
}: {
  contact: ContactWithProfile;
  actions?: React.ReactNode;
  badge?: string;
}) {
  const { profile, nickname } = contact;
  const name = nickname || profile.display_name || profile.email;
  const secondary = profile.display_name && !nickname ? profile.email : nickname ? profile.display_name || profile.email : null;

  return (
    <Card className="flex items-center gap-3 !p-3">
      <Avatar profile={profile} nickname={nickname} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {secondary && (
          <p className="text-xs truncate" style={{ color: 'var(--color-text-dim)' }}>
            {secondary}
          </p>
        )}
        {badge && (
          <span
            className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
              color: 'var(--color-warning)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">{actions}</div>
    </Card>
  );
}
