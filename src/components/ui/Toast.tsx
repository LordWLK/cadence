'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, WifiOff, Wifi, X } from 'lucide-react';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'offline' | 'online';
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastData['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: ToastData['type'] = 'info', duration = 3000) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pt-3 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: number) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setExiting(true), toast.duration || 3000);
    const removeTimer = setTimeout(() => onRemove(toast.id), (toast.duration || 3000) + 300);
    return () => { clearTimeout(hideTimer); clearTimeout(removeTimer); };
  }, [toast, onRemove]);

  const icons: Record<ToastData['type'], typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    info: CheckCircle,
    offline: WifiOff,
    online: Wifi,
  };

  const colors: Record<ToastData['type'], string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-primary)',
    offline: 'var(--color-warning)',
    online: 'var(--color-success)',
  };

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  return (
    <div
      className="pointer-events-auto w-full max-w-sm flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface-elevated) 92%, transparent)',
        border: `1px solid color-mix(in srgb, ${color} 25%, var(--color-border))`,
        animation: exiting ? 'toast-out 0.3s ease-in forwards' : 'toast-in 0.3s ease-out forwards',
      }}
    >
      <Icon size={16} style={{ color, flexShrink: 0 }} />
      <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text)' }}>
        {toast.message}
      </span>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300); }}
        className="p-0.5 rounded-lg transition-colors shrink-0"
        style={{ color: 'var(--color-text-dim)' }}
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
