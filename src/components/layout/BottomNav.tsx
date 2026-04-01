'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Heart, CalendarPlus, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',                icon: Calendar,     label: 'Semaine',   exact: true  },
  { href: '/checkin',         icon: Heart,        label: 'Check-in',  exact: true  },
  { href: '/friday',          icon: CalendarPlus, label: 'Planifier', exact: true  },
  { href: '/checkin/history', icon: BarChart3,    label: 'Historique',exact: true  },
  { href: '/settings',        icon: Settings,     label: 'Réglages',  exact: false }, // match /settings/*
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface-elevated)]/95 backdrop-blur-lg border-t border-[var(--color-border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[56px] ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
