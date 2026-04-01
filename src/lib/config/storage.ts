export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  theSportsDbKey: string; // defaults to '123' (free V1 key)
  ballDontLieKey: string;
}

const STORAGE_KEY = 'cadence_config';

export function getConfig(): AppConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function hasConfig(): boolean {
  return getConfig() !== null;
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
