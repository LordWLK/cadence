'use client';

import { useConfig } from '@/providers/ConfigProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Pages accessible sans configuration Supabase
const PUBLIC_PATHS = ['/', '/login', '/settings'];

export function ConfigGate({ children }: { children: React.ReactNode }) {
  const { isConfigured } = useConfig();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isConfigured && !isPublic) {
      router.replace('/settings');
    }
  }, [isConfigured, isPublic, router]);

  if (!isConfigured && !isPublic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <div className="w-6 h-6 rounded-full bg-primary animate-pulse" />
          </div>
          <p className="text-text-muted">Redirection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
