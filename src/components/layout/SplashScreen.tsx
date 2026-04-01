'use client';

import { useState, useEffect } from 'react';
import { CadenceLogoStacked } from '@/components/ui/CadenceLogo';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 800ms
    const fadeTimer = setTimeout(() => setFadeOut(true), 800);
    // Remove completely after animation
    const removeTimer = setTimeout(() => setVisible(false), 1100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {visible && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center transition-opacity duration-300"
          style={{
            backgroundColor: 'var(--color-surface)',
            opacity: fadeOut ? 0 : 1,
            pointerEvents: fadeOut ? 'none' : 'auto',
          }}
        >
          <div className="animate-bounce-in">
            <CadenceLogoStacked className="w-36" />
          </div>
          <div className="mt-6">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
