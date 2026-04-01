/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Supabase API — network first, fall back to cache for offline
    {
      matcher: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/'),
      handler: new NetworkFirst({
        cacheName: "supabase-api",
        plugins: [
          new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 }),
        ],
      }),
    },
    // TheSportsDB API — stale while revalidate
    {
      matcher: ({ url }) => url.hostname === 'www.thesportsdb.com',
      handler: new StaleWhileRevalidate({
        cacheName: "sportsdb-api",
        plugins: [
          new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 60 * 60 * 6 }),
        ],
      }),
    },
    // BallDontLie API
    {
      matcher: ({ url }) => url.hostname === 'api.balldontlie.io',
      handler: new StaleWhileRevalidate({
        cacheName: "balldontlie-api",
        plugins: [
          new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 6 }),
        ],
      }),
    },
    // Sport team badges / images — cache first (long-lived)
    {
      matcher: ({ url }) => url.hostname === 'www.thesportsdb.com' && url.pathname.startsWith('/images/'),
      handler: new CacheFirst({
        cacheName: "sport-images",
        plugins: [
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      }),
    },
    // Default Next.js caching from Serwist
    ...defaultCache,
  ],
});

// ─── Notification click → open/focus the app ────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.focus();
          if (url !== "/") client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

serwist.addEventListeners();
