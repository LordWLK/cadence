export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  theSportsDbKey: string; // defaults to '123' (free V1 key)
}

/** Sport-only config stored in localStorage */
export interface SportConfig {
  theSportsDbKey: string;
}

const STORAGE_KEY = 'cadence_config';
const SPORT_STORAGE_KEY = 'cadence_sport_config';

// ─── Environment variables (Vercel) ─────────────────────────────────────────
function getEnvSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) return { url, key };
  return null;
}

export function hasEnvSupabase(): boolean {
  return getEnvSupabase() !== null;
}

// ─── Legacy config (old localStorage format) ────────────────────────────────
function getLegacyConfig(): AppConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ─── Sport config (localStorage) ────────────────────────────────────────────
export function getSportConfig(): SportConfig {
  if (typeof window === 'undefined') return { theSportsDbKey: '123' };
  const raw = localStorage.getItem(SPORT_STORAGE_KEY);
  if (!raw) {
    // Migration: try reading from old legacy config (no circular call)
    const legacy = getLegacyConfig();
    if (legacy) {
      return { theSportsDbKey: legacy.theSportsDbKey || '123' };
    }
    return { theSportsDbKey: '123' };
  }
  try { return JSON.parse(raw); } catch { return { theSportsDbKey: '123' }; }
}

export function setSportConfig(config: SportConfig): void {
  localStorage.setItem(SPORT_STORAGE_KEY, JSON.stringify(config));
}

// ─── Full config (combines env + localStorage) ──────────────────────────────
export function getConfig(): AppConfig | null {
  if (typeof window === 'undefined') return null;

  const env = getEnvSupabase();
  const sport = getSportConfig();

  // If env vars available, use them
  if (env) {
    return {
      supabaseUrl: env.url,
      supabaseAnonKey: env.key,
      theSportsDbKey: sport.theSportsDbKey,
    };
  }

  // Fallback: legacy localStorage config
  return getLegacyConfig();
}

export function setConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function hasConfig(): boolean {
  // Configured if env vars present OR localStorage has full config
  if (hasEnvSupabase()) return true;
  return getConfig() !== null;
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SPORT_STORAGE_KEY);
}
