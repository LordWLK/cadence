'use client';

import { ConfigProvider } from '@/providers/ConfigProvider';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ConfigGate } from '@/components/layout/ConfigGate';
import { BottomNav } from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Onboarding } from '@/components/layout/Onboarding';
import { PageTransition } from '@/components/layout/PageTransition';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { SessionFromUrl } from '@/components/auth/SessionFromUrl';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SplashScreen>
      <Onboarding>
        <ConfigProvider>
          <ConfigGate>
            <SupabaseProvider>
              <AuthProvider>
                <ToastProvider>
                  <SessionFromUrl />
                  <main className="max-w-lg mx-auto px-4 pt-6 pb-28">
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </main>
                  <BottomNav />
                </ToastProvider>
              </AuthProvider>
            </SupabaseProvider>
          </ConfigGate>
        </ConfigProvider>
      </Onboarding>
      </SplashScreen>
    </ErrorBoundary>
  );
}
