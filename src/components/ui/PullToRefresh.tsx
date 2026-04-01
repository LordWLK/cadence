'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const isAtTop = () => {
    return window.scrollY <= 0;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAtTop() && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0 && isAtTop()) {
      // Resistance effect
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const isReady = pullDistance >= THRESHOLD;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{
          height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? 48 : 0)}px` : '0px',
          transition: pulling.current ? 'none' : undefined,
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{
            opacity: progress,
            transform: `rotate(${progress * 180}deg)`,
            transition: pulling.current ? 'none' : 'transform 0.2s ease',
          }}
        >
          <RefreshCw
            size={18}
            className={refreshing ? 'animate-spin' : ''}
            style={{
              color: isReady || refreshing ? 'var(--color-primary)' : 'var(--color-text-dim)',
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: pullDistance > 0 && !refreshing ? `translateY(${pullDistance * 0.1}px)` : undefined,
          transition: pulling.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
