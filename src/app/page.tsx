'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useConfig } from '@/providers/ConfigProvider';
import { Card } from '@/components/ui/Card';
import { WeekCalendar } from '@/components/week/WeekCalendar';
import { Heart, CalendarPlus, Share, MoreHorizontal, Plus, Star, Flame, Check } from 'lucide-react';
import Link from 'next/link';
import { isToday, isFriday } from '@/lib/utils/dates';

// Landing page for visitors not yet configured
function LandingPage() {
  return (
    <div className="space-y-12 pb-8">
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto ring-1 ring-primary/30">
          <span className="text-4xl font-black text-primary">C</span>
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight">Cadence</h1>
          <p className="text-text-muted mt-2 max-w-xs mx-auto leading-relaxed">
            Planifie ta semaine, suis ton humeur, ne rate aucun match.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary-light transition-colors"
        >
          Commencer gratuitement
        </Link>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <p className="text-xs text-text-dim uppercase tracking-widest text-center">Ce que ca fait</p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: Heart, color: 'text-primary', title: 'Check-in quotidien', desc: 'Matin et soir : humeur, energie, intention. Un graphe qui raconte ton etat sur 30 jours.' },
            { icon: CalendarPlus, color: 'text-accent-light', title: 'Planning du vendredi', desc: 'Chaque vendredi, planifie tes trucs cool : sport, social, projets, detente.' },
            { icon: Star, color: 'text-warning', title: 'Tes matchs auto-detectes', desc: 'Ajoute tes equipes et combattants favoris. Les matchs de la semaine apparaissent automatiquement.' },
            { icon: Flame, color: 'text-sport-mma', title: 'Gros matchs de la semaine', desc: 'Derbies, clasicos, playoffs NBA, title fights UFC. Les incontournables, signales automatiquement.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <Card key={title}>
              <div className="flex items-start gap-3">
                <Icon size={20} className={`${color} mt-0.5 shrink-0`} />
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* iPhone Install Guide */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <p className="text-xs text-text-dim uppercase tracking-widest">Installer sur iPhone</p>
          <h2 className="text-xl font-bold">Comme une vraie app</h2>
          <p className="text-sm text-text-muted">Aucun App Store. Gratuit. 3 etapes.</p>
        </div>

        <div className="space-y-3">
          {/* Step 1 */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm pr-8">Ouvre dans Safari</p>
              <p className="text-xs text-text-muted">
                Ce site doit etre ouvert dans <span className="text-text font-medium">Safari</span> sur ton iPhone.
                Pas dans Chrome ni l'app Instagram.
              </p>
              <div className="flex items-center gap-2 mt-2 p-2 bg-surface rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-sm">🧭</span>
                </div>
                <span className="text-sm font-medium">Safari</span>
                <span className="ml-auto text-xs text-text-dim">Navigateur requis</span>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm pr-8">Appuie sur Partager</p>
              <p className="text-xs text-text-muted">
                En bas de Safari, appuie sur le bouton <span className="text-text font-medium">Partager</span> (la fleche vers le haut).
              </p>
              <div className="flex items-center justify-center gap-3 mt-2 p-3 bg-surface rounded-xl">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
                    <Share size={18} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] text-text-muted">Partager</span>
                </div>
                <span className="text-text-dim">→</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
                    <Plus size={18} className="text-text" />
                  </div>
                  <span className="text-[10px] text-text-muted">Ajouter...</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm pr-8">"Sur l'ecran d'accueil"</p>
              <p className="text-xs text-text-muted">
                Dans le menu, selectionne <span className="text-text font-medium">"Sur l'ecran d'accueil"</span> puis <span className="text-text font-medium">Ajouter</span>.
              </p>
              <div className="flex items-center gap-2 mt-2 p-2 bg-surface rounded-xl">
                <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-black text-primary">C</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Cadence</p>
                  <p className="text-[10px] text-text-dim">Ecran d'accueil</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs text-success font-medium">
                  <Check size={12} />
                  Installe
                </div>
              </div>
            </div>
          </Card>
        </div>

        <p className="text-center text-xs text-text-dim">
          Compatible iPhone iOS 16.4+ · Fonctionne hors-ligne · Aucune donnee vendue
        </p>
      </div>

      {/* CTA bottom */}
      <div className="text-center space-y-3 pb-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/25 hover:bg-primary-light transition-colors"
        >
          Configurer Cadence →
        </Link>
        <p className="text-xs text-text-dim">Necessite un compte Supabase gratuit</p>
      </div>
    </div>
  );
}

// App home for logged-in users
function AppHome() {
  const now = new Date();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ma semaine</h1>
      </div>
      <div className="flex gap-2">
        <Link href="/checkin" className="flex-1">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer py-3">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-primary" />
              <span className="text-sm font-medium">Check-in</span>
            </div>
          </Card>
        </Link>
        <Link href="/friday" className="flex-1">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer py-3">
            <div className="flex items-center gap-2">
              <CalendarPlus size={16} className="text-accent-light" />
              <span className="text-sm font-medium">Planifier</span>
            </div>
          </Card>
        </Link>
      </div>
      <WeekCalendar />
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const { isConfigured } = useConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Not configured = show landing page (public, no Supabase needed)
  if (!isConfigured) return <LandingPage />;

  // Configured but not logged in = show landing with login CTA
  if (!user) return <LandingPage />;

  // Logged in = show the actual app
  return <AppHome />;
}
