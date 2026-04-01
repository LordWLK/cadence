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
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      // Focus first OTP input after render
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  // ─── Step 2: Verify OTP code ─────────────────────────────────────────────
  const handleVerify = async (code: string) => {
    setLoading(true);
    setError(null);
    const { error } = await verifyOtp(email, code);
    setLoading(false);
    if (error) {
      setError('Code invalide ou expiré. Réessaie.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    // Success is handled by useAuth → user state change → redirect
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      // Auto-focus next input
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  // ─── Code entry screen ───────────────────────────────────────────────────
  if (step === 'code') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8">
        <div className="self-start">
          <Button variant="ghost" size="sm" onClick={() => { setStep('email'); setError(null); setOtp(['', '', '', '', '', '']); }}>
            <ArrowLeft size={14} /> Retour
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] flex items-center justify-center">
            <KeyRound size={24} className="text-[var(--color-primary)]" />
          </div>
        </div>

        <Card variant="elevated" className="w-full max-w-sm">
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="font-semibold text-[var(--color-text)]">Entre le code</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Un code à 6 chiffres a été envoyé à{' '}
                <span className="text-[var(--color-text)] font-medium">{email}</span>
              </p>
            </div>

            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-13 text-center text-lg font-bold bg-[var(--color-surface-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors"
                />
              ))}
            </div>

            {error && (
              <p className="text-[var(--color-error)] text-xs bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}

            {loading && (
              <p className="text-[var(--color-text-muted)] text-xs text-center">
                Vérification en cours...
              </p>
            )}

            <button
              onClick={() => { setStep('email'); setError(null); }}
              className="w-full text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Pas reçu ? Renvoyer un code
            </button>
          </div>
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
