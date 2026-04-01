'use client';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!('Notification' in window)) return null;
  return Notification.permission;
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    ...options,
  });
}

// Schedule a notification using setTimeout (works only while app is open)
export function scheduleNotification(
  title: string,
  body: string,
  atTime: Date
): ReturnType<typeof setTimeout> | null {
  const now = Date.now();
  const target = atTime.getTime();
  const delay = target - now;
  if (delay <= 0) return null;
  return setTimeout(() => {
    showNotification(title, { body });
  }, delay);
}

// Schedule daily check-in reminders for today
export function scheduleDailyReminders(): Array<ReturnType<typeof setTimeout>> {
  const timers: Array<ReturnType<typeof setTimeout>> = [];
  const today = new Date();

  // Morning reminder at 8:00
  const morning = new Date(today);
  morning.setHours(8, 0, 0, 0);
  const morningTimer = scheduleNotification(
    'Cadence - Check-in matin',
    'Comment tu te sens ce matin ?',
    morning
  );
  if (morningTimer) timers.push(morningTimer);

  // Evening reminder at 21:00
  const evening = new Date(today);
  evening.setHours(21, 0, 0, 0);
  const eveningTimer = scheduleNotification(
    'Cadence - Check-in soir',
    "Qu'est-ce que t'as compris aujourd'hui ?",
    evening
  );
  if (eveningTimer) timers.push(eveningTimer);

  // Friday planning reminder at 18:00 (only on Fridays)
  if (today.getDay() === 5) {
    const friday = new Date(today);
    friday.setHours(18, 0, 0, 0);
    const fridayTimer = scheduleNotification(
      'Cadence - Planification',
      'Planifie tes trucs cool pour la semaine prochaine !',
      friday
    );
    if (fridayTimer) timers.push(fridayTimer);
  }

  return timers;
}

// Schedule a match reminder 1 hour before
export function scheduleMatchReminder(
  eventTitle: string,
  eventDate: string
): ReturnType<typeof setTimeout> | null {
  const matchTime = new Date(eventDate);
  const reminderTime = new Date(matchTime.getTime() - 60 * 60 * 1000);
  return scheduleNotification(
    'Cadence - Match bientot !',
    `${eventTitle} commence dans 1 heure`,
    reminderTime
  );
}
