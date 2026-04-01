'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Button } from '@/components/ui/Button';
import { CadenceLogoStacked } from '@/components/ui/CadenceLogo';
import { Check, ExternalLink, Loader2 } from 'lucide-react';

export default function AuthVerifyPage() {
  const supabase = useSupabase();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!supabase) {
      setStatus('error');
      setErrorMsg('Supabase non configuré');
      return;
    }

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      // We have tokens from server-side exchange — set the session
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setStatus('error');
          setErrorMsg(error.message);
        } else {
          setStatus('success');
          // Clear the hash to avoid token leakage
          window.history.replaceState(null, '', '/auth/verify');
          // If we're in the PWA (standalone), redirect home
          if (isPwa()) {
            window.location.href = '/';
          }
        }
      });
    } else {
      // Fallback: let Supabase detect the session from the URL
      // This handles the case where code exchange failed server-side
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setStatus('success');
          if (isPwa()) {
            window.location.href = '/';
          }
        } else {
          setStatus('error');
          setErrorMsg('Impossible de vérifier la connexion. Réessaie depuis l\'app.');
        }
      });
    }
  }, [supabase]);

  const isPwa = () => {
    return window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
  };

  // Build URL with tokens so the PWA standalone context can pick them up
  const [pwaUrl, setPwaUrl] = useState('/');
  useEffect(() => {
    if (status !== 'success' || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const params = new URLSearchParams({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        setPwaUrl(`/?auth=#${params.toString()}`);
      }
    });
  }, [status, supabase]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 px-4">
        <CadenceLogoStacked className="w-32 opacity-50" />
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Connexion en cours...</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 px-4">
        <CadenceLogoStacked className="w-32" />
        <div className="text-center space-y-2">
          <p className="text-[var(--color-error)] text-sm font-medium">Erreur de connexion</p>
          <p className="text-[var(--color-text-muted)] text-xs">{errorMsg}</p>
        </div>
        <a href="/login">
          <Button>Réessayer</Button>
        </a>
      </div>
    );
  }

  // Success state — shown when opened in Safari (not the PWA)
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 px-4">
      <CadenceLogoStacked className="w-32" />
      <div className="w-14 h-14 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] flex items-center justify-center">
        <Check size={28} className="text-[var(--color-success)]" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-lg font-bold">Connexion réussie !</h1>
        <p className="text-[var(--color-text-muted)] text-sm max-w-xs">
          Tu peux maintenant ouvrir Cadence depuis ton écran d&apos;accueil.
          La session sera automatiquement synchronisée.
        </p>
      </div>
      <a href={pwaUrl} className="w-full max-w-xs">
        <Button className="w-full gap-2" size="lg">
          <ExternalLink size={16} />
          Ouvrir Cadence
        </Button>
      </a>
    </div>
  );
}
