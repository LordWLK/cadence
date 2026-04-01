'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';

interface TeamBadgeProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

export function TeamBadge({ src, alt = '', size = 24, className = '' }: TeamBadgeProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: 'var(--color-surface-alt)',
        }}
      >
        <Shield size={size * 0.6} style={{ color: 'var(--color-text-dim)' }} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
