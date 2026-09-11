'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, ChevronDown, X, ShoppingCart, Heart, Package, LayoutDashboard, Settings, LogOut, Clock, AlertTriangle, User } from 'lucide-react';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import { useStorefrontConfig } from '../../../lib/hooks/useStorefrontConfig';
import { useCart, useWishlist } from '../../../lib/context/StoreContext';
import { createClient } from '../../../lib/supabase/client';
import { apiFetch } from '../../../lib/api';
import { toast } from '../../../lib/toast';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
}

export default function Navbar() {
  const router = useRouter();
  const { config } = useStorefrontConfig();
  const { isCartOpen, setIsCartOpen, cartCount, refreshCart, resetStore } = useCart();
  const { isWishlistOpen, setIsWishlistOpen, openWishlist, wishlistCount, refreshWishlist } = useWishlist();

  // --- UI Navigation State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const syncInFlightRef = useRef(false);
  const lastSyncedUserIdRef = useRef<string | null>(null);

  // --- Authentication State ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // --- Liquidation Cart Hold Expiration Timer (15-min TTL) ---
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isTimerUrgent, setIsTimerUrgent] = useState(false);


  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isAccountMenuOpen) {
        setIsAccountMenuOpen(false);
        accountTriggerRef.current?.focus(); 
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  // --- 1. Guest-to-Account Synchronization & Inventory Hold Initiation ---
  const mergeGuestDataToAccount = useCallback(async () => {
    try {
      const guestCartRaw = localStorage.getItem('guest_cart');
      const guestWishlistRaw = localStorage.getItem('guest_wishlist');

      const guestCart = guestCartRaw ? JSON.parse(guestCartRaw) : [];
      const guestWishlist = guestWishlistRaw ? JSON.parse(guestWishlistRaw) : [];

      // If user had no local items, verify if an active reservation already exists in DB
      if (guestCart.length === 0 && guestWishlist.length === 0) {
        try {
          const [res] = await Promise.all([
            apiFetch<{ hasActiveReservation: boolean; remainingSeconds: number }>('/carts/reservation'),
            refreshCart(),
            refreshWishlist(),
          ]);
          if (res?.data?.remainingSeconds > 0) {
            setSecondsRemaining(res.data.remainingSeconds);
          }
        } catch {
          // Ignored for non-active carts
        }
        return;
      }

      // Merge guest cart & wishlist into database-backed account
      const res = await apiFetch<{
        success: boolean;
        holdExpiresInSeconds: number;
        warnings?: string[];
        mergedCart?: any[];
      }>('/carts/merge-guest-session', {
        method: 'POST',
        body: JSON.stringify({
          guestCart: guestCart.map((item: any) => ({
            variantId: item.id,
            quantity: Number(item.qty || 1),
          })),
          guestProductIds: guestWishlist.map((w: any) => w.id),
        }),
      });

      if (res?.data) {
        if (res.data.holdExpiresInSeconds > 0) {
          setSecondsRemaining(res.data.holdExpiresInSeconds);
        }
        // Discard guest cache and replace all client state from the database.
        localStorage.removeItem('guest_cart');
        localStorage.removeItem('guest_wishlist');
        await Promise.all([refreshCart(), refreshWishlist()]);
        if (res.data.warnings && res.data.warnings.length > 0) {
          res.data.warnings.forEach((warn) => toast.warning(warn));
        }
      }
    } catch (err) {
      console.warn('Guest data sync notice:', err);
    }
  }, [refreshCart, refreshWishlist]);

  // --- 2. Auth listener only updates session state. Fetching is centralized below. ---
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const u = session.user;
          const firstName =
            u.user_metadata?.first_name ||
            u.user_metadata?.full_name?.split(' ')[0] ||
            u.email?.split('@')[0] ||
            'Buyer';

          setUser((current) => current?.id === u.id ? current : { id: u.id, email: u.email!, firstName });
        } else {
          setUser(null);
        }
      } finally {
        setIsAuthLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const firstName =
          u.user_metadata?.first_name ||
          u.user_metadata?.full_name?.split(' ')[0] ||
          u.email?.split('@')[0] ||
          'Buyer';
        setUser((current) => current?.id === u.id ? current : { id: u.id, email: u.email!, firstName });
      } else {
        setUser(null);
        setSecondsRemaining(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch once per authenticated identity. The ref blocks overlapping calls caused by
  // React Strict Mode's development remount or closely-spaced auth notifications.
  useEffect(() => {
    if (!user?.id) {
      lastSyncedUserIdRef.current = null;
      return;
    }
    if (syncInFlightRef.current || lastSyncedUserIdRef.current === user.id) return;

    syncInFlightRef.current = true;
    void mergeGuestDataToAccount()
      .then(() => {
        lastSyncedUserIdRef.current = user.id;
      })
      .finally(() => {
        syncInFlightRef.current = false;
      });
  }, [user?.id, mergeGuestDataToAccount]);

  // --- 3. Inventory Hold Countdown Timer ---
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;

    setIsTimerUrgent(secondsRemaining <= 180); // Switch to warning state at 3:00

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 4. Handle Logout ---
  const handleLogout = async () => {
    try {
      setIsAccountMenuOpen(false);
      setIsMobileMenuOpen(false);
      setUser(null);
      setSecondsRemaining(null);
      resetStore();

      // 1. Sign out client-side Supabase
      try {
        await supabase.auth.signOut();
      } catch {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }

      // 2. Clear server-side SSR cookies via dedicated endpoint
      await fetch('/auth/signout', { method: 'POST' }).catch(() => {});

      toast.info('You have been signed out.');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Hard refresh to storefront Home to ensure all client/server state is cleanly reset
      window.location.href = '/';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Full Catalog', href: '/products' },
    { name: 'About us', href: '/about' },
    { name: 'How it works', href: '/how-it-works' },
    { name: 'Merchandise Conditions', href: '/how-it-works/merchandise-conditions-explained' },
    { name: 'Terms and conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
  ];

  const announcement = config?.announcement;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-xs">
        
        {announcement?.enabled && (
          <div
            className="py-2 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 flex-wrap transition-colors"
            style={{
              backgroundColor: announcement.bgColor || '#111827',
              color: announcement.textColor || '#ffffff',
            }}
          >
            {announcement.badge && (
              <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {announcement.badge}
              </span>
            )}
            <span>{announcement.text}</span>
            {announcement.linkText && (
              <Link
                href={announcement.linkUrl || '/products'}
                className="underline font-bold ml-1 text-white/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
              >
                {announcement.linkText} →
              </Link>
            )}
          </div>
        )}

        {/* Main Navbar Row */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left: Mobile Drawer Trigger & Brand Logo */}
            <div className="flex items-center space-x-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center justify-center bg-gray-100 text-gray-700 h-10 w-10 rounded-full hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <Link
                href="/"
                className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <span className="text-primary text-2xl sm:text-3xl font-black tracking-tight">
                  Liquidation<span className="text-blue-600">Port</span>
                </span>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden md:flex flex-1 items-center justify-center px-8 lg:px-12">
              <button
                type="button"
                className="flex items-center mr-2 bg-transparent border-2 border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Category <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
              </button>
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="w-full max-w-2xl flex bg-[#f0f2f5] rounded-md overflow-hidden border border-transparent focus-within:border-gray-400 focus-within:bg-white transition-all"
              >
                <label htmlFor="nav-search-input" className="sr-only">
                  Search catalog
                </label>
                <input
                  id="nav-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-4 py-2 text-sm outline-none text-gray-800 placeholder-gray-500"
                  placeholder="Search pallets, manifests, lots, or retailers..."
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  aria-label="Submit search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Right: Region, Cart Hold Timer, Cart, Wishlist & Auth States */}
            <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
              {/* Country Selector */}
              <button
                type="button"
                className="hidden xl:flex items-center text-xs font-semibold text-gray-700 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
              >
                <Image src="/country-flags/usa.png" alt="USA Flag" width={18} height={18} className="mr-1.5" />
                USA <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
              </button>

              {/* AUTH STATES (GUEST VS AUTHENTICATED) */}
              {!isAuthLoading && (
                <>
                  {user ? (
                    /* ------------------------------------------------------------- */
                    /* AUTHENTICATED STATE: "Hi, [Name] ▾" Dropdown Menu             */
                    /* ------------------------------------------------------------- */
                    <div className="relative" ref={dropdownRef}>
                      <button
                        ref={accountTriggerRef}
                        type="button"
                        onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                          isAccountMenuOpen
                            ? 'bg-gray-100 border-gray-300 text-gray-900'
                            : 'border-transparent text-gray-800 hover:bg-gray-100 hover:text-primary'
                        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
                        aria-expanded={isAccountMenuOpen}
                        aria-haspopup="menu"
                        aria-label="Account options menu"
                      >
                        <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                          {user.firstName.charAt(0).toUpperCase()}
                        </span>
                        <span className="max-w-[120px] truncate">Hi, {user.firstName}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 opacity-70 ${
                            isAccountMenuOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Accessible Dropdown Card */}
                      {isAccountMenuOpen && (
                        <div
                          role="menu"
                          aria-orientation="vertical"
                          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                        >
                          <div className="px-4 py-2.5 border-b border-gray-100">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Signed in as</p>
                            <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{user.email}</p>
                          </div>

                          <div className="py-1">
                            <Link
                              href="/account"
                              role="menuitem"
                              tabIndex={0}
                              onClick={() => setIsAccountMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors focus-visible:bg-gray-100 focus-visible:outline-none"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gray-400" />
                              Dashboard
                            </Link>

                            <Link
                              href="/account/orders"
                              role="menuitem"
                              tabIndex={0}
                              onClick={() => setIsAccountMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors focus-visible:bg-gray-100 focus-visible:outline-none"
                            >
                              <Package className="w-4 h-4 text-gray-400" />
                              My Orders & Tracking
                            </Link>

                            <Link
                              href="/account/settings"
                              role="menuitem"
                              tabIndex={0}
                              onClick={() => setIsAccountMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors focus-visible:bg-gray-100 focus-visible:outline-none"
                            >
                              <Settings className="w-4 h-4 text-gray-400" />
                              Settings
                            </Link>
                          </div>

                          <div className="border-t border-gray-100 pt-1 mt-1">
                            <button
                              type="button"
                              role="menuitem"
                              tabIndex={0}
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left focus-visible:bg-rose-50 focus-visible:outline-none"
                            >
                              <LogOut className="w-4 h-4" />
                              Log Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    
                    <div className="hidden sm:flex items-center space-x-4">
                      <Link
                        href="/login"
                        className="text-sm font-bold text-gray-800 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        className="text-sm font-bold text-primary border-2 border-primary px-4 py-1.5 rounded-lg hover:bg-primary/5 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </>
              )}

              {/* Wishlist Button (Heart Icon with Dynamic Guest/User Badge) */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 text-gray-600 hover:text-primary transition-colors hover:bg-gray-100 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Saved Pallets (Wishlist)"
                aria-label={`Wishlist, ${wishlistCount} saved pallets`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-xs animate-in zoom-in-50">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Container & Persistent Low-Profile Hold Timer */}
              <div className="flex items-center gap-2">
                {/* 15-Minute Liquidation Hold Countdown Timer */}
                {user && cartCount > 0 && secondsRemaining !== null && (
                  <div
                    aria-live="polite"
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                      secondsRemaining === 0
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : isTimerUrgent
                        ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                        : 'bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                    title="Liquidation items are reserved in your cart for 15 minutes before being released."
                  >
                    <Clock className={`w-3.5 h-3.5 ${isTimerUrgent ? 'text-amber-600' : 'text-gray-500'}`} />
                    <span>
                      {secondsRemaining === 0 ? (
                        <span className="flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3 h-3" /> Hold Expired
                        </span>
                      ) : (
                        <>
                          <span className="text-[11px] font-normal text-gray-500">Items held:</span>{' '}
                          <span className="font-mono font-bold tracking-tight">{formatTimer(secondsRemaining)}</span>
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Cart Button (Shopping Cart Icon with Badge) */}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-gray-600 hover:text-primary transition-colors hover:bg-gray-100 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Shopping Cart"
                  aria-label={`Shopping cart, ${cartCount} items`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-xs animate-in zoom-in-50">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile Auth Avatar Fallback Trigger */}
              <div className="sm:hidden flex items-center">
                {!user ? (
                  <Link
                    href="/login"
                    className="text-xs font-bold text-gray-800 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                  >
                    Log in
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Open mobile user account menu"
                  >
                    {user.firstName.charAt(0).toUpperCase()}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Category / Navigation Ribbon */}
        <div className="border-t border-gray-100 hidden sm:block bg-gray-50/50">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-8 h-12 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {menuItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className={`text-sm tracking-wide transition-colors ${
                    idx === 0 ? 'font-bold text-primary' : 'font-medium text-[#4a4a4a] hover:text-primary'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="text-primary text-xl font-bold tracking-tight">Menu</span>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close menu drawer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="flex flex-col space-y-2 mt-2">
            {menuItems.map((item, idx) => (
              <li key={idx}>
                <Link
                  href={item.href}
                  className="block px-4 py-3 text-[17px] text-[#252525] hover:bg-gray-50 hover:text-primary rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {user && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My Account</p>
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
              >
                <LayoutDashboard className="w-4 h-4 text-gray-400" />
                Dashboard
              </Link>
              <Link
                href="/account/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
              >
                <Package className="w-4 h-4 text-gray-400" />
                My Orders & Tracking
              </Link>
              <Link
                href="/account/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-md mt-2 cursor-pointer"
              >
                Log Out
              </button>
            </div>
          )}
        </nav>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </>
  );
}
