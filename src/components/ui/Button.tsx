import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] shadow-md shadow-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]',
      secondary:
        'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-alt)]',
      ghost:
        'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]',
      danger:
        'bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_18%,transparent)]',
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
