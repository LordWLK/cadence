/**
 * PWA App Badge API
 * Shows a badge on the PWA icon (supported on some platforms)
 */

export async function setBadge(count: number): Promise<void> {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await (navigator as unknown as { setAppBadge: (n: number) => Promise<void> }).setAppBadge(count);
      } else {
        await (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    }
  } catch {
    // Not supported or permission denied — silent fail
  }
}

export async function clearBadge(): Promise<void> {
  await setBadge(0);
}
