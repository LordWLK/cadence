'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  type AppConfig,
  type SportConfig,
  getConfig,
  setConfig as saveConfig,
  clearConfig,
  getSportConfig,
  setSportConfig as saveSportConfig,
  hasEnvSupabase,
} from '@/lib/config/storage';

interface ConfigContextValue {
  config: AppConfig | null;
  sportConfig: SportConfig;
  isConfigured: boolean;
  hasEnvVars: boolean;
  updateConfig: (config: AppConfig) => void;
  updateSportConfig: (config: SportConfig) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig | null>(null);
  const [sportConfig, setSportConfigState] = useState<SportConfig>({ theSportsDbKey: '123', ballDontLieKey: '' });
  const [mounted, setMounted] = useState(false);
  const hasEnvVars = hasEnvSupabase();

  useEffect(() => {
    setConfigState(getConfig());
    setSportConfigState(getSportConfig());
    setMounted(true);
  }, []);

  const updateConfig = useCallback((newConfig: AppConfig) => {
    saveConfig(newConfig);
    setConfigState(newConfig);
  }, []);

  const updateSportConfig = useCallback((newSport: SportConfig) => {
    saveSportConfig(newSport);
    setSportConfigState(newSport);
    // Also update full config state
    setConfigState(getConfig());
  }, []);

  const resetConfig = useCallback(() => {
    clearConfig();
    setConfigState(getConfig()); // Will still return env-based config if env vars exist
    setSportConfigState({ theSportsDbKey: '123', ballDontLieKey: '' });
  }, []);

  if (!mounted) return null;

  const isConfigured = config !== null;

  return (
    <ConfigContext.Provider value={{ config, sportConfig, isConfigured, hasEnvVars, updateConfig, updateSportConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
