import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20',
      secondary: 'bg-surface-elevated text-text hover:bg-border',
      ghost: 'text-text-muted hover:text-text hover:bg-surface-elevated',
      danger: 'bg-error/10 text-error hover:bg-error/20',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
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
