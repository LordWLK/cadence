'use client';

import { usePathname } from 'next/navigation';
import { useRef, useEffect, useState, type ReactNode } from 'react';

// Nav order for determining slide direction
const NAV_ORDER = ['/', '/checkin', '/friday', '/checkin/history', '/settings'];

function getNavIndex(path: string): number {
  // Exact match first
  const exact = NAV_ORDER.indexOf(path);
  if (exact !== -1) return exact;
  // Prefix match for sub-routes (e.g., /settings/sports)
  for (let i = NAV_ORDER.length - 1; i >= 0; i--) {
    if (path.startsWith(NAV_ORDER[i] + '/')) return i;
  }
  return -1;
}

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (prevPath.current === pathname) return;

    const prevIndex = getNavIndex(prevPath.current);
    const currIndex = getNavIndex(pathname);

    if (prevIndex !== -1 && currIndex !== -1 && prevIndex !== currIndex) {
      setAnimClass(currIndex > prevIndex ? 'page-slide-left' : 'page-slide-right');
    } else {
      setAnimClass('page-fade');
    }

    prevPath.current = pathname;

    const timer = setTimeout(() => setAnimClass(''), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div key={pathname} className={animClass}>
      {children}
    </div>
  );
}
