'use client';

import { useState, useEffect } from 'react';
import { Heart, CalendarPlus, Star, ArrowRight, X } from 'lucide-react';
import { CadenceLogoStacked } from '@/components/ui/CadenceLogo';

const SLIDES = [
  {
    icon: Heart,
    color: 'var(--color-primary)',
    title: 'Suis ton humeur',
    desc: 'Check-in matin et soir : note ton humeur, ton energie, tes pensees. Visualise tes tendances sur 30 jours.',
  },
  {
    icon: CalendarPlus,
    color: '#4f46e5',
    title: 'Planifie ta semaine',
    desc: 'Chaque vendredi, organise ta semaine : sport, social, projets perso. Tout au meme endroit.',
  },
  {
    icon: Star,
    color: '#d97706',
    title: 'Ne rate aucun match',
    desc: 'Ajoute tes equipes et combattants favoris. Les matchs de la semaine apparaissent automatiquement.',
  },
];

const STORAGE_KEY = 'cadence_onboarding_done';

export function Onboarding({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setShow(true);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const next = () => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection('next');
      setCurrentSlide((s) => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (currentSlide > 0) {
      setDirection('prev');
      setCurrentSlide((s) => s - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStart(null);
  };

  if (!show) return <>{children}</>;

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-surface)] flex flex-col items-center justify-center px-6">
      {/* Skip */}
      <button
        onClick={finish}
        className="absolute top-4 right-4 p-2 text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors"
        aria-label="Passer l'introduction"
      >
        <X size={20} />
      </button>

      {/* Content */}
      <div
        className="flex flex-col items-center text-center max-w-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        key={currentSlide}
        style={{ animation: `${direction === 'next' ? 'slide-in-right' : 'slide-in-left'} 0.3s ease-out` }}
      >
        <CadenceLogoStacked className="w-32 mb-8 opacity-40" />

        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ backgroundColor: `${slide.color}15` }}
        >
          <Icon size={36} style={{ color: slide.color }} />
        </div>

        <h2 className="text-xl font-bold text-[var(--color-text)] mb-3">{slide.title}</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{slide.desc}</p>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > currentSlide ? 'next' : 'prev'); setCurrentSlide(i); }}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              backgroundColor: i === currentSlide ? 'var(--color-primary)' : 'var(--color-border)',
              width: i === currentSlide ? '24px' : '8px',
            }}
            aria-label={`Ecran ${i + 1}`}
          />
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={next}
        className="mt-8 flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold text-sm text-white transition-colors"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {currentSlide === SLIDES.length - 1 ? "C'est parti !" : 'Suivant'}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
