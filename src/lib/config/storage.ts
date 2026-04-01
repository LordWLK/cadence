export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  theSportsDbKey: string; // defaults to '123' (free V1 key)
  ballDontLieKey: string;
}

/** Sport-only config stored in localStorage */
export interface SportConfig {
  theSportsDbKey: string;
  ballDontLieKey: string;
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

// ─── Sport config (localStorage) ────────────────────────────────────────────
export function getSportConfig(): SportConfig {
  if (typeof window === 'undefined') return { theSportsDbKey: '123', ballDontLieKey: '' };
  const raw = localStorage.getItem(SPORT_STORAGE_KEY);
  if (!raw) {
    // Migration: try reading from old config
    const oldConfig = getConfig();
    if (oldConfig) {
      return {
        theSportsDbKey: oldConfig.theSportsDbKey || '123',
        ballDontLieKey: oldConfig.ballDontLieKey || '',
      };
    }
    return { theSportsDbKey: '123', ballDontLieKey: '' };
  }
  try { return JSON.parse(raw); } catch { return { theSportsDbKey: '123', ballDontLieKey: '' }; }
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
      ballDontLieKey: sport.ballDontLieKey,
    };
  }

  // Fallback: legacy localStorage config
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
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
