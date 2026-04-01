'use client';

// ─── Permission ──────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return Notification.permission;
}

// ─── Show notification (via Service Worker if available) ─────────────────────
export async function showNotification(title: string, options?: NotificationOptions & { data?: Record<string, string> }): Promise<void> {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  const fullOptions: NotificationOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    ...options,
  };

  // Prefer Service Worker (works when PWA is in background on iOS 16.4+)
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, fullOptions);
      return;
    }
  } catch {
    // fallback below
  }

  // Fallback: Notification API (only when tab is active)
  new Notification(title, fullOptions);
}

// ─── Schedule (setTimeout — works while app is open) ─────────────────────────
export function scheduleNotification(
  title: string,
  body: string,
  atTime: Date,
  url?: string
): ReturnType<typeof setTimeout> | null {
  const delay = atTime.getTime() - Date.now();
  if (delay <= 0) return null;
  return setTimeout(() => {
    showNotification(title, { body, data: url ? { url } : undefined });
  }, delay);
}

// ─── Daily reminders ─────────────────────────────────────────────────────────
export function scheduleDailyReminders(): Array<ReturnType<typeof setTimeout>> {
  const timers: Array<ReturnType<typeof setTimeout>> = [];
  const today = new Date();

  // Morning 8:00
  const morning = new Date(today);
  morning.setHours(8, 0, 0, 0);
  const m = scheduleNotification(
    'Cadence — Check-in matin',
    'Comment tu te sens ce matin ?',
    morning,
    '/checkin'
  );
  if (m) timers.push(m);

  // Evening 21:00
  const evening = new Date(today);
  evening.setHours(21, 0, 0, 0);
  const e = scheduleNotification(
    'Cadence — Check-in soir',
    "Qu'est-ce que t'as compris aujourd'hui ?",
    evening,
    '/checkin'
  );
  if (e) timers.push(e);

  // Friday 18:00
  if (today.getDay() === 5) {
    const friday = new Date(today);
    friday.setHours(18, 0, 0, 0);
    const f = scheduleNotification(
      'Cadence — Planification',
      'Planifie tes trucs cool pour la semaine prochaine !',
      friday,
      '/friday'
    );
    if (f) timers.push(f);
  }

  return timers;
}

// ─── Match reminder (1h before) ─────────────────────────────────────────────
export function scheduleMatchReminder(
  eventTitle: string,
  eventDate: string
): ReturnType<typeof setTimeout> | null {
  const matchTime = new Date(eventDate);
  const reminderTime = new Date(matchTime.getTime() - 60 * 60 * 1000);
  return scheduleNotification(
    'Cadence — Match bientot !',
    `${eventTitle} commence dans 1 heure`,
    reminderTime,
    '/'
  );
}
