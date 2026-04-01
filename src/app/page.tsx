'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useConfig } from '@/providers/ConfigProvider';
import { Card } from '@/components/ui/Card';
import { WeekCalendar } from '@/components/week/WeekCalendar';
import { CadenceIcon, CadenceLogoStacked } from '@/components/ui/CadenceLogo';
import { Heart, CalendarPlus, Share, Plus, Star, Flame, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { StreakBadge } from '@/components/checkin/StreakBadge';
import { QuickCheckin } from '@/components/checkin/QuickCheckin';
import { WeeklyRecap } from '@/components/week/WeeklyRecap';

// ─── Landing page ─────────────────────────────────────────────────────────────
function LandingPage() {
  return (
    <div className="space-y-14 pb-10">

      {/* Hero */}
      <div className="flex flex-col items-center text-center space-y-5 pt-6">
        <CadenceLogoStacked className="w-48" />
        <p className="text-[var(--color-text-muted)] text-sm max-w-[260px] leading-relaxed">
          Planifie ta semaine, suis ton humeur, ne rate aucun match.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-2xl font-semibold text-sm shadow-lg shadow-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] hover:bg-[var(--color-primary-light)] transition-colors"
        >
          Commencer gratuitement <ArrowRight size={14} />
        </Link>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-dim)]">Ce que ça fait</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-3">
        {[
          {
            icon: Heart,
            color: 'text-[var(--color-primary)]',
            bg: 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]',
            title: 'Check-in quotidien',
            desc: 'Matin et soir : humeur, énergie, intention. Un graphe qui raconte ton état sur 30 jours.',
          },
          {
            icon: CalendarPlus,
            color: 'text-[var(--color-accent)]',
            bg: 'bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]',
            title: 'Planning du vendredi',
            desc: 'Chaque vendredi, planifie tes trucs cool : sport, social, projets, détente.',
          },
          {
            icon: Star,
            color: 'text-[var(--color-warning)]',
            bg: 'bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)]',
            title: 'Tes matchs auto-détectés',
            desc: 'Ajoute tes équipes et combattants favoris. Les matchs de la semaine apparaissent automatiquement.',
          },
          {
            icon: Flame,
            color: 'text-[var(--color-sport-mma)]',
            bg: 'bg-[color-mix(in_srgb,var(--color-sport-mma)_10%,transparent)]',
            title: 'Gros matchs de la semaine',
            desc: 'Derbies, clasicos, playoffs NBA, title fights UFC. Les incontournables, signalés automatiquement.',
          },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <Card key={title} variant="elevated">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--color-text)]">{title}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* iPhone Install Guide */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-dim)]">Installer sur iPhone</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)]">
          Comme une vraie app · Gratuit · 3 étapes
        </p>

        <div className="space-y-3">
          {/* Step 1 */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-xs font-bold text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] rounded-full w-5 h-5 flex items-center justify-center">1</span>
            </div>
            <div className="space-y-2 pr-6">
              <p className="font-semibold text-sm">Ouvre dans Safari</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Ce site doit être ouvert dans{' '}
                <span className="font-medium text-[var(--color-text)]">Safari</span>{' '}
                sur ton iPhone — pas dans Chrome ni l'app Instagram.
              </p>
              <div className="flex items-center gap-2 mt-2 p-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                <span className="text-lg">🧭</span>
                <span className="text-sm font-medium">Safari</span>
                <span className="ml-auto text-xs text-[var(--color-text-dim)]">Requis</span>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-xs font-bold text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] rounded-full w-5 h-5 flex items-center justify-center">2</span>
            </div>
            <div className="space-y-2 pr-6">
              <p className="font-semibold text-sm">Appuie sur Partager</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                En bas de Safari, appuie sur le bouton{' '}
                <span className="font-medium text-[var(--color-text)]">Partager</span>{' '}
                (la flèche vers le haut).
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center">
                    <Share size={17} className="text-blue-500" />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-dim)]">Partager</span>
                </div>
                <span className="text-[var(--color-text-dim)] text-lg">→</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center">
                    <Plus size={17} className="text-[var(--color-text)]" />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-dim)]">Ajouter…</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-xs font-bold text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </div>
            <div className="space-y-2 pr-6">
              <p className="font-semibold text-sm">"Sur l'écran d'accueil"</p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Sélectionne{' '}
                <span className="font-medium text-[var(--color-text)]">"Sur l'écran d'accueil"</span>
                {' '}puis <span className="font-medium text-[var(--color-text)]">Ajouter</span>.
              </p>
              <div className="flex items-center gap-2 mt-2 p-2.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                <CadenceIcon className="w-8 h-8" />
                <div>
                  <p className="text-xs font-semibold">Cadence</p>
                  <p className="text-[10px] text-[var(--color-text-dim)]">Écran d'accueil</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs text-[var(--color-success)] font-medium">
                  <Check size={12} /> Installé
                </div>
              </div>
            </div>
          </Card>
        </div>

        <p className="text-center text-xs text-[var(--color-text-dim)]">
          Compatible iPhone iOS 16.4+ · Fonctionne hors-ligne · Aucune donnée vendue
        </p>
      </div>

      {/* CTA final */}
      <div className="flex flex-col items-center gap-3 pb-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] hover:bg-[var(--color-primary-light)] transition-colors"
        >
          Configurer Cadence <ArrowRight size={15} />
        </Link>
        <p className="text-xs text-[var(--color-text-dim)]">Nécessite un compte Supabase gratuit</p>
      </div>
    </div>
  );
}

// ─── App home ─────────────────────────────────────────────────────────────────
function AppHome() {
  return (
    <div className="space-y-5 animate-stagger">
      <div className="flex items-center justify-between">
        <CadenceLogoStacked className="w-28" />
        <div className="flex gap-2">
          <Link href="/checkin">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)] text-xs font-medium hover:bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition-colors">
              <Heart size={13} />
              Check-in
            </button>
          </Link>
          <Link href="/friday">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)] text-xs font-medium hover:bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] transition-colors">
              <CalendarPlus size={13} />
              Planifier
            </button>
          </Link>
        </div>
      </div>
      <StreakBadge />
      <QuickCheckin />
      <WeeklyRecap />
      <WeekCalendar />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, isLoading } = useAuth();
  const { isConfigured }    = useConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isConfigured || !user) return <LandingPage />;
  return <AppHome />;
}
