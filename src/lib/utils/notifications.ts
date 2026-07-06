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
// Les rappels reposent sur setTimeout : ils ne se déclenchent que pendant que l'app
// est ouverte. La version précédente ne les programmait qu'une fois (au clic « Activer »)
// et jamais pour les jours suivants. On planifie désormais la PROCHAINE occurrence et on
// réarme automatiquement après chaque déclenchement. La fonction est idempotente : un
// nouvel appel (ex. au démarrage de l'app) annule les timers précédents.

let dailyTimers: Array<ReturnType<typeof setTimeout>> = [];

/** Prochaine occurrence à `hour:minute`, aujourd'hui si encore à venir, sinon demain. */
function nextDailyOccurrence(hour: number, minute: number, from: Date): Date {
  const next = new Date(from);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= from.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

/** Prochain jour donné (0=dim..6=sam) à `hour:minute`. */
function nextWeekdayOccurrence(weekday: number, hour: number, minute: number, from: Date): Date {
  const next = new Date(from);
  next.setHours(hour, minute, 0, 0);
  let addDays = (weekday - next.getDay() + 7) % 7;
  if (addDays === 0 && next.getTime() <= from.getTime()) addDays = 7;
  next.setDate(next.getDate() + addDays);
  return next;
}

function scheduleRecurring(
  computeNext: (from: Date) => Date,
  title: string,
  body: string,
  url: string
) {
  const arm = () => {
    const now = new Date();
    const target = computeNext(now);
    const delay = target.getTime() - now.getTime();
    const timer = setTimeout(() => {
      showNotification(title, { body, data: { url } });
      arm(); // réarme pour la prochaine occurrence
    }, delay);
    dailyTimers.push(timer);
  };
  arm();
}

export function cancelDailyReminders(): void {
  for (const t of dailyTimers) clearTimeout(t);
  dailyTimers = [];
}

export function scheduleDailyReminders(): void {
  if (typeof window === 'undefined') return;
  cancelDailyReminders(); // idempotent : pas de doublons de timers

  scheduleRecurring(
    (from) => nextDailyOccurrence(8, 0, from),
    'Cadence — Check-in matin',
    'Comment tu te sens ce matin ?',
    '/checkin'
  );

  scheduleRecurring(
    (from) => nextDailyOccurrence(21, 0, from),
    'Cadence — Check-in soir',
    "Qu'est-ce que t'as compris aujourd'hui ?",
    '/checkin'
  );

  // Vendredi 18h
  scheduleRecurring(
    (from) => nextWeekdayOccurrence(5, 18, 0, from),
    'Cadence — Planification',
    'Planifie tes trucs cool pour la semaine prochaine !',
    '/friday'
  );
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
