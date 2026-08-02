import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Thème Gazette × Brut : un bouton EST interactif, donc il est Brut —
 * bordure encre, ombre dure, il s'enfonce au tap. Seul `ghost` reste
 * éditorial (action discrète, soulignement au survol).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-[3px] font-bold disabled:opacity-40 disabled:pointer-events-none';

    const brut = 'border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] brut-press';

    const variants = {
      primary:
        `${brut} bg-[var(--color-action)] text-[#16150F]`,
      secondary:
        `${brut} bg-[var(--color-surface-elevated)] text-[var(--color-text)]`,
      ghost:
        'text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline-offset-4 hover:underline decoration-[var(--color-action)] decoration-2 transition-colors',
      danger:
        `${brut} bg-[var(--color-primary)] text-[#FBFAF5]`,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
