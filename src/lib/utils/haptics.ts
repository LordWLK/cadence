'use client';

/**
 * Trigger haptic feedback on supported devices.
 * Falls back silently if not supported.
 */
export function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (typeof window === 'undefined') return;
  if (!('vibrate' in navigator)) return;

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
  };

  try {
    navigator.vibrate(patterns[style]);
  } catch {
    // Silently ignore — some browsers throw on vibrate
  }
}

/**
 * Haptic for selection changes (mood picker, tabs)
 */
export function hapticSelect(): void {
  haptic('light');
}

/**
 * Haptic for successful actions (check-in saved)
 */
export function hapticSuccess(): void {
  haptic('medium');
}

/**
 * Haptic for errors
 */
export function hapticError(): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate([30, 50, 30]); // double buzz
  } catch {}
}
