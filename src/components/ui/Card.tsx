import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'sport';
  sportColor?: 'football' | 'basketball' | 'mma';
}

const SPORT_BORDERS: Record<string, string> = {
  football:   'border-l-[var(--color-sport-football)]',
  basketball: 'border-l-[var(--color-sport-basketball)]',
  mma:        'border-l-[var(--color-sport-mma)]',
};

export function Card({
  variant = 'default',
  sportColor,
  className = '',
  children,
  ...props
}: CardProps) {
  // Éditorial : une carte se lit, elle ne se touche pas → filet fin, pas d'ombre,
  // coins quasi carrés. Le Brut est réservé aux contrôles À L'INTÉRIEUR des cartes.
  const base = 'rounded-[4px] p-4 transition-all';

  const variants = {
    default:  'bg-[var(--color-surface-elevated)] border border-[var(--color-border)]',
    elevated: 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] border-t-2 border-t-[var(--color-ink)]',
    sport:    `bg-[var(--color-surface-elevated)] border border-[var(--color-border)] border-l-4`,
  };

  const sportBorder = sportColor ? SPORT_BORDERS[sportColor] : '';

  return (
    <div
      className={`${base} ${variants[variant]} ${sportBorder} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
