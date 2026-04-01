'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type AppConfig, getConfig, setConfig as saveConfig, clearConfig } from '@/lib/config/storage';

interface ConfigContextValue {
  config: AppConfig | null;
  isConfigured: boolean;
  updateConfig: (config: AppConfig) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConfigState(getConfig());
    setMounted(true);
  }, []);

  const updateConfig = useCallback((newConfig: AppConfig) => {
    saveConfig(newConfig);
    setConfigState(newConfig);
  }, []);

  const resetConfig = useCallback(() => {
    clearConfig();
    setConfigState(null);
  }, []);

  if (!mounted) return null;

  return (
    <ConfigContext.Provider value={{ config, isConfigured: config !== null, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
