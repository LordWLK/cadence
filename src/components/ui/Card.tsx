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
  const base = 'rounded-2xl p-4 transition-all';

  const variants = {
    default:  'bg-[var(--color-surface-elevated)] border border-[var(--color-border)]',
    elevated: 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm shadow-black/5',
    sport:    `bg-[var(--color-surface-elevated)] border border-[var(--color-border)] border-l-4 shadow-sm`,
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
