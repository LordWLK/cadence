interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'football' | 'basketball' | 'mma' | 'primary';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-surface-elevated text-text-muted',
    football: 'bg-sport-football/15 text-sport-football',
    basketball: 'bg-sport-basketball/15 text-sport-basketball',
    mma: 'bg-sport-mma/15 text-sport-mma',
    primary: 'bg-primary/15 text-primary',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
