'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CadenceLogoStacked } from '@/components/ui/CadenceLogo';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, signIn, verifyOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  if (user) return null;

  // ─── Step 1: Send OTP code ───────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const { error } = await signIn(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setStep('code');
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  };

  // ─── Step 2: Verify OTP code ─────────────────────────────────────────────
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.replace(/\D/g, '');
    if (cleaned.length < 6) return;
    setLoading(true);
    setError(null);
    const { error } = await verifyOtp(email, cleaned);
    setLoading(false);
    if (error) {
      setError('Code invalide ou expiré. Réessaie.');
      setCode('');
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
    // Success is handled by useAuth → user state change → redirect
  };

  // ─── Code entry screen ───────────────────────────────────────────────────
  if (step === 'code') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8">
        <div className="self-start">
          <Button variant="ghost" size="sm" onClick={() => { setStep('email'); setError(null); setCode(''); }}>
            <ArrowLeft size={14} /> Retour
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] flex items-center justify-center">
            <KeyRound size={24} className="text-[var(--color-primary)]" />
          </div>
        </div>

        <Card variant="elevated" className="w-full max-w-sm">
          <form onSubmit={handleVerifySubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="font-semibold text-[var(--color-text)]">Entre le code</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Un code a été envoyé à{' '}
                <span className="text-[var(--color-text)] font-medium">{email}</span>
              </p>
            </div>

            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Ton code"
              className="w-full text-center text-2xl font-bold tracking-[0.3em] bg-[var(--color-surface-input)] border border-[var(--color-border)] rounded-xl px-4 py-4 text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors"
            />

            {error && (
              <p className="text-[var(--color-error)] text-xs bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || code.length < 6}>
              {loading ? 'Vérification...' : 'Valider'}
            </Button>

            <button
              type="button"
              onClick={() => { setStep('email'); setError(null); setCode(''); }}
              className="w-full text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Pas reçu ? Renvoyer un code
            </button>
          </form>
        </Card>
      </div>
    );
  }

  // ─── Email entry screen ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8">
      <div className="self-start">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} />
            Retour
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <CadenceLogoStacked className="w-44" />
      </div>

      <Card variant="elevated" className="w-full max-w-sm">
        <form onSubmit={handleSendCode} className="space-y-5">
          <div className="text-center">
            <h2 className="font-semibold text-[var(--color-text)]">Connexion</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Un code de vérification sera envoyé à ton email
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
            {loading ? 'Envoi en cours…' : 'Recevoir un code'}
          </Button>
        </form>
      </Card>

      <p className="text-xs text-[var(--color-text-dim)] text-center">
        Pas de mot de passe · Connexion sécurisée par email
      </p>
    </div>
  );
}
