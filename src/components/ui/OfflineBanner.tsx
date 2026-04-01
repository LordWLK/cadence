'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useCheckins } from '@/lib/hooks/useCheckins';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const { pendingCount, syncQueue } = useCheckins();

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline && pendingCount === 0) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium animate-fade-in"
      style={{
        backgroundColor: offline
          ? 'color-mix(in srgb, var(--color-warning) 12%, transparent)'
          : 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
        color: offline ? 'var(--color-warning)' : 'var(--color-primary)',
      }}
    >
      {offline ? (
        <>
          <WifiOff size={14} />
          <span>Hors-ligne — tes check-ins seront synchros au retour</span>
        </>
      ) : (
        <>
          <button onClick={syncQueue} className="flex items-center gap-1.5 hover:underline">
            <RefreshCw size={14} />
            {pendingCount} check-in{pendingCount > 1 ? 's' : ''} en attente de sync
          </button>
        </>
      )}
    </div>
  );
}
