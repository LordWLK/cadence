'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '@/providers/ConfigProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Save, Trash2, Link, Key, Volleyball, Bell, BellOff, Moon as MoonIcon, Sun as SunIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import NextLink from 'next/link';
import { requestNotificationPermission, isNotificationSupported, getNotificationPermission, scheduleDailyReminders } from '@/lib/utils/notifications';

export default function SettingsPage() {
  const { config, sportConfig, updateConfig, updateSportConfig, resetConfig, isConfigured, hasEnvVars } = useConfig();
  const { theme, toggleTheme } = useTheme();

  // Supabase fields (only needed when no env vars)
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

  // Sport API key
  const [theSportsDbKey, setTheSportsDbKey] = useState('123');

  const [saved, setSaved] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && isNotificationSupported()) {
      setNotifPermission(getNotificationPermission());
    }
  }, []);

  useEffect(() => {
    if (config && !hasEnvVars) {
      setSupabaseUrl(config.supabaseUrl);
      setSupabaseAnonKey(config.supabaseAnonKey);
    }
    setTheSportsDbKey(sportConfig.theSportsDbKey || '123');
  }, [config, sportConfig, hasEnvVars]);

  const handleSave = () => {
    // Save sport config
    updateSportConfig({
      theSportsDbKey: theSportsDbKey || '123',
    });

    // If no env vars, also save Supabase config
    if (!hasEnvVars && supabaseUrl && supabaseAnonKey) {
      updateConfig({
        supabaseUrl,
        supabaseAnonKey,
        theSportsDbKey: theSportsDbKey || '123',
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const canSave = hasEnvVars || (!!supabaseUrl && !!supabaseAnonKey);

  const inputClass =
    'w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reglages</h1>
        <p className="text-text-muted text-sm mt-1">Configure tes connexions</p>
      </div>

      {/* Supabase status */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Link size={18} />
            <h2 className="font-semibold">Supabase</h2>
          </div>

          {hasEnvVars ? (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
              }}>
              <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                  Connecte via Vercel
                </p>
                <p className="text-xs text-text-muted">
                  Les credentials Supabase sont configures dans les variables d&apos;environnement. Rien a faire !
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
                }}>
                <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
                <p className="text-xs text-text-muted">
                  Pas de variables d&apos;environnement detectees. Configure manuellement ou ajoute <code className="font-mono text-text">NEXT_PUBLIC_SUPABASE_URL</code> et <code className="font-mono text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel.
                </p>
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1.5">URL du projet</label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxx.supabase.co"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1.5">Anon Key</label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJ..."
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Sport API keys */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-accent-light mb-2">
            <Key size={18} />
            <h2 className="font-semibold">APIs Sport</h2>
          </div>
          <div>
            <label className="text-sm text-text-muted block mb-1.5">
              TheSportsDB Key <span className="text-text-dim">(defaut: 123 = gratuit)</span>
            </label>
            <input
              type="text"
              value={theSportsDbKey}
              onChange={(e) => setTheSportsDbKey(e.target.value)}
              placeholder="123"
              className={inputClass}
            />
          </div>
          <p className="text-xs text-text-dim">
            Toutes les donnees sport (foot, NBA, MMA) passent par TheSportsDB.
          </p>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1" disabled={!canSave}>
          <Save size={16} />
          {saved ? 'Sauvegarde !' : 'Sauvegarder'}
        </Button>
        {!hasEnvVars && isConfigured && (
          <Button variant="danger" onClick={resetConfig}>
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {/* Theme */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <MoonIcon size={18} className="text-accent-light" /> : <SunIcon size={18} className="text-warning" />}
            <div>
              <p className="font-medium text-sm">Theme</p>
              <p className="text-xs text-text-muted">
                {theme === 'dark' ? 'Mode sombre actif' : 'Mode clair actif'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="relative w-12 h-7 rounded-full transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border-strong)',
            }}
            aria-label="Changer le theme"
          >
            <span
              className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform"
              style={{
                transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      {isNotificationSupported() && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notifPermission === 'granted' ? <Bell size={18} className="text-success" /> : <BellOff size={18} className="text-text-dim" />}
              <div>
                <p className="font-medium text-sm">Notifications</p>
                <p className="text-xs text-text-muted">
                  {notifPermission === 'granted' ? 'Rappels actifs (matin 8h, soir 21h, vendredi 18h)' :
                   notifPermission === 'denied' ? 'Bloquees dans le navigateur' : 'Rappels check-in et matchs'}
                </p>
              </div>
            </div>
            {notifPermission !== 'granted' && notifPermission !== 'denied' && (
              <Button variant="secondary" size="sm" onClick={async () => {
                const granted = await requestNotificationPermission();
                setNotifPermission(granted ? 'granted' : 'denied');
                if (granted) scheduleDailyReminders();
              }}>
                Activer
              </Button>
            )}
            {notifPermission === 'granted' && (
              <span className="text-xs text-success">Actif</span>
            )}
          </div>
        </Card>
      )}

      {/* Sport preferences */}
      {isConfigured && (
        <NextLink href="/settings/sports">
          <Card className="mt-4 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <Volleyball size={20} className="text-sport-football" />
              <div>
                <p className="font-medium">Preferences sport</p>
                <p className="text-sm text-text-muted">Equipes, combattants, competitions</p>
              </div>
            </div>
            <span className="text-text-dim">&rarr;</span>
          </Card>
        </NextLink>
      )}
    </div>
  );
}
