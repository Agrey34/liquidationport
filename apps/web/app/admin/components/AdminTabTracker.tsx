'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const IGNORED_PATHS = [
  '/admin-login',
  '/admin-signup',
  '/admin-login/forgot-password',
  '/admin-login/reset-password',
  '/admin-login/verify',
  '/admin/unauthorized',
];

export default function AdminTabTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    // Check if the current route is a valid admin route to remember
    const isIgnored = IGNORED_PATHS.some((ignored) => pathname.startsWith(ignored));
    const isAdminRoute = pathname.startsWith('/admin') && !isIgnored;

    if (isAdminRoute) {
      const search = searchParams?.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;

      try {
        // 1. Store in localStorage for instant client-side retrieval on login
        localStorage.setItem('admin_last_tab', fullPath);

        // 2. Store in cookie for server-side middleware and actions access
        document.cookie = `admin_last_tab=${encodeURIComponent(fullPath)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (err) {
        console.warn('Unable to persist admin tab state:', err);
      }
    }
  }, [pathname, searchParams]);

  return null;
}
