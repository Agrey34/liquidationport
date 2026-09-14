'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * AdminTabTracker — UI Preference Only
 *
 * Tracks the admin's last visited sub-page for UX convenience (e.g., returning
 * to the same page after a session timeout rather than always landing on /admin).
 *
 * SECURITY NOTE:
 * - This data is stored in localStorage and a cookie as a pure UX enhancement.
 * - It MUST NOT be used to make authentication or authorization decisions.
 * - Login pages should always redirect to /admin by default. The server action
 *   validates any redirectTo param independently.
 * - An attacker manipulating this value cannot gain elevated access — they would
 *   simply navigate to a different admin sub-page after a valid login.
 */

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

    const isIgnored = IGNORED_PATHS.some((ignored) => pathname.startsWith(ignored));
    const isAdminRoute = pathname.startsWith('/admin') && !isIgnored;

    if (isAdminRoute) {
      const search = searchParams?.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;

      try {
        // Store last visited admin path as a UI preference only (not security-relevant)
        localStorage.setItem('admin_last_tab', fullPath);
        // Also persist in a short-lived cookie for possible server-side use (layout)
        document.cookie = `admin_last_tab=${encodeURIComponent(fullPath)}; path=/; max-age=2592000; SameSite=Lax; Secure`;
      } catch {
        // Ignore — this is a UX enhancement, not critical functionality
      }
    }
  }, [pathname, searchParams]);

  return null;
}
