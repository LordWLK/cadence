'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Heart, CalendarPlus, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Calendar, label: 'Semaine' },
  { href: '/checkin', icon: Heart, label: 'Check-in' },
  { href: '/friday', icon: CalendarPlus, label: 'Planifier' },
  { href: '/checkin/history', icon: BarChart3, label: 'Historique' },
  { href: '/settings', icon: Settings, label: 'Reglages' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-alt/90 backdrop-blur-lg border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
