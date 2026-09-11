'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Package, Heart, Settings, LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { useStore } from '@/lib/context/StoreContext';

const ACCOUNT_LINKS = [
  { name: 'Dashboard', href: '/account', icon: User, exact: true },
  { name: 'Order History', href: '/account/orders', icon: Package, exact: false },
  { name: 'Saved Pallets', href: '/account/wishlist', icon: Heart, exact: true },
  { name: 'Account Settings', href: '/account/settings', icon: Settings, exact: true },
];

interface UserProfile {
  fullName: string;
  initials: string;
  buyerType: string;
  email: string;
}

export default function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  const { resetStore } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login?next=/account');
          return;
        }

        // Fetch user dashboard profile from backend
        try {
          const res = await apiFetch<{ profile: UserProfile }>('/users/dashboard');
          if (isMounted && res?.data?.profile) {
            setProfile(res.data.profile);
            setIsLoading(false);
            return;
          }
        } catch {
          // Fallback to Supabase metadata if API endpoint is unavailable
        }

        if (isMounted && session.user) {
          const meta = session.user.user_metadata || {};
          const first = meta.first_name || meta.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Buyer';
          const last = meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || '';
          const fullName = [first, last].filter(Boolean).join(' ');
          const firstInitial = first.trim()[0]?.toUpperCase() || 'U';
          const lastInitial = last.trim()[0]?.toUpperCase() || '';
          const initials = `${firstInitial}${lastInitial}` || firstInitial;

          setProfile({
            fullName,
            initials,
            buyerType: meta.buyer_type || 'Retail Buyer',
            email: session.user.email || '',
          });
        }
      } catch (err) {
        console.error('Failed to load user profile in account layout:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    try {
      resetStore();
      try {
        await supabase.auth.signOut();
      } catch {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
      await fetch('/auth/signout', { method: 'POST' }).catch(() => {});
    } catch (err) {
      console.error('Account layout logout error:', err);
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-2">
            {/* User Profile Card */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 mb-4 shadow-xs">
              {isLoading ? (
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-24" />
                    <div className="h-3 bg-neutral-100 rounded w-16" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-full flex items-center justify-center text-lg shrink-0 select-none shadow-2xs">
                    {profile?.initials || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-neutral-900 leading-tight truncate">
                      {profile?.fullName || 'Valued Buyer'}
                    </h2>
                    <p className="text-xs font-semibold text-neutral-500 truncate">
                      {profile?.buyerType || 'Retail Buyer'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="bg-white border border-neutral-200 rounded-3xl p-3 shadow-xs flex flex-col gap-1">
              {ACCOUNT_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = link.exact 
                  ? pathname === link.href 
                  : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive 
                        ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10' 
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {link.name}
                  </Link>
                );
              })}
              
              <div className="h-px bg-neutral-100 my-2 mx-4" />
              
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="w-4 h-4 shrink-0" /> Log Out
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
