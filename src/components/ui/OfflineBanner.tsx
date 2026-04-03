'use client';

import { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { useToast } from '@/components/ui/Toast';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const { pendingCount, syncQueue } = useCheckins();
  const { showToast } = useToast();
  const wasOffline = useRef(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const update = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);

      if (isOffline) {
        wasOffline.current = true;
      }
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!offline && wasOffline.current) {
      wasOffline.current = false;
      showToast('Connexion rétablie', 'online', 2500);

      // Auto-sync pending items
      if (pendingCount > 0) {
        setSyncing(true);
        syncQueue().then(() => {
          setSyncing(false);
          showToast(`${pendingCount} check-in${pendingCount > 1 ? 's' : ''} synchronisé${pendingCount > 1 ? 's' : ''}`, 'success');
        }).catch(() => {
          setSyncing(false);
          showToast('Erreur de synchronisation', 'error');
        });
      }
    }
  }, [offline, pendingCount, syncQueue, showToast]);

  // Show offline toast
  useEffect(() => {
    if (offline) {
      showToast('Hors-ligne — tes données seront synchronisées au retour', 'offline', 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  // Persistent banner only when offline or has pending items
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
          <span>Hors-ligne — tes check-ins seront synchronisés au retour</span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw size={14} className="animate-spin" />
          <span>Synchronisation en cours...</span>
        </>
      ) : (
        <>
          <button onClick={syncQueue} className="flex items-center gap-1.5 hover:underline" aria-label="Synchroniser les check-ins en attente">
            <RefreshCw size={14} />
            {pendingCount} check-in{pendingCount > 1 ? 's' : ''} en attente de sync
          </button>
        </>
      )}
    </div>
  );
}
