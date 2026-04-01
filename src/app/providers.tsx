'use client';

import { ConfigProvider } from '@/providers/ConfigProvider';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ConfigGate } from '@/components/layout/ConfigGate';
import { BottomNav } from '@/components/layout/BottomNav';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <ConfigGate>
        <SupabaseProvider>
          <AuthProvider>
            <main className="max-w-lg mx-auto px-4 pt-6">
              {children}
            </main>
            <BottomNav />
          </AuthProvider>
        </SupabaseProvider>
      </ConfigGate>
    </ConfigProvider>
  );
}
