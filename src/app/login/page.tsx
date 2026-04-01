'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CadenceLogoStacked } from '@/components/ui/CadenceLogo';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState<string | null>(null);

  if (user) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const { error } = await signIn(email);
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-4">
        <div className="w-16 h-16 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] flex items-center justify-center">
          <Check size={32} className="text-[var(--color-success)]" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Lien envoyé !</h1>
          <p className="text-[var(--color-text-muted)] text-sm max-w-xs">
            Vérifie ta boite mail{' '}
            <span className="text-[var(--color-text)] font-medium">{email}</span>{' '}
            et clique sur le lien magique.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setSent(false)}>
          Renvoyer un lien
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8">
      {/* Back */}
      <div className="self-start">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} />
            Retour
          </Button>
        </Link>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center space-y-2">
        <CadenceLogoStacked className="w-44" />
      </div>

      {/* Form */}
      <Card variant="elevated" className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-center">
            <h2 className="font-semibold text-[var(--color-text)]">Connexion</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Un lien magique sera envoyé à ton email
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full bg-[var(--color-surface-input)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-[var(--color-error)] text-xs bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading || !email}>
            {loading ? 'Envoi en cours…' : 'Envoyer le lien magique ✨'}
          </Button>
        </form>
      </Card>

      <p className="text-xs text-[var(--color-text-dim)] text-center">
        Pas de mot de passe · Connexion sécurisée par email
      </p>
    </div>
  );
}
