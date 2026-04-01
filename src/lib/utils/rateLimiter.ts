/**
 * Simple rate limiter / throttle for API calls.
 * Queues requests and ensures a minimum delay between them.
 */

const queues = new Map<string, Promise<void>>();

const DEFAULT_MIN_DELAY = 200; // ms between requests to same API

export function createThrottle(key: string, minDelay = DEFAULT_MIN_DELAY) {
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    // Wait for previous call to this key to complete + delay
    const prev = queues.get(key) || Promise.resolve();

    const next = prev.then(async () => {
      await new Promise(resolve => setTimeout(resolve, minDelay));
    });

    queues.set(key, next);

    await prev;
    return fn();
  };
}

// Pre-configured throttles
export const throttleSportsDb = createThrottle('thesportsdb', 250);
