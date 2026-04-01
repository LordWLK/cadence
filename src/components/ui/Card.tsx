import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'sport';
  sportColor?: string;
}

export function Card({ variant = 'default', sportColor, className = '', children, ...props }: CardProps) {
  const base = 'rounded-2xl p-4 transition-all';
  const variants = {
    default: 'bg-surface-alt border border-border',
    elevated: 'bg-surface-elevated border border-border shadow-lg',
    sport: `bg-surface-alt border-l-4`,
  };

  const sportBorder = sportColor ? `border-l-${sportColor}` : '';

  return (
    <div className={`${base} ${variants[variant]} ${sportBorder} ${className}`} {...props}>
      {children}
    </div>
  );
}
