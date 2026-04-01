/**
 * Offline queue using IndexedDB.
 * Stores check-in data when offline, syncs when back online.
 */

const DB_NAME = 'cadence_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_checkins';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface PendingCheckin {
  id?: number;
  type: string;
  mood: number;
  energy: number;
  note: string | null;
  date: string;
  created_at: string;
}

export async function addToQueue(checkin: Omit<PendingCheckin, 'id' | 'created_at'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      ...checkin,
      created_at: new Date().toISOString(),
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.error('[OfflineQueue] Failed to add:', e);
  }
}

export async function getPendingItems(): Promise<PendingCheckin[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    const items = await new Promise<PendingCheckin[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return items;
  } catch {
    return [];
  }
}

export async function removeFromQueue(id: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.error('[OfflineQueue] Failed to remove:', e);
  }
}

export async function clearQueue(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.error('[OfflineQueue] Failed to clear:', e);
  }
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function onOnline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}
