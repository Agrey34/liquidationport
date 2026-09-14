'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';
import { createClient } from '../supabase/client';

export interface CartItem {
  id: string;
  cartItemId?: string;
  productId?: string;
  title: string;
  price: number;
  qty: number;
  img: string;
  sku?: string;
  slug?: string;
  retailer?: string;
  condition?: string;
  conditionGrade?: string;
  lotSize?: string;
  unitsCount?: number;
}

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  msrp?: number;
  img: string;
  slug?: string;
  retailer?: string;
  condition?: string;
  conditionGrade?: string;
  qty?: number;
  category?: string;
  status?: string;
}

interface StoreContextType {
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  addToCart: (item: Omit<CartItem, 'qty'> & { qty?: number }, qty?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateCartQty: (id: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  syncCart: (items: CartItem[]) => void;
  openCart: () => void;
  closeCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  wishlist: WishlistItem[];
  wishlistCount: number;
  isWishlistOpen: boolean;
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  isInWishlist: (id: string) => boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  setIsWishlistOpen: (open: boolean) => void;
  resetStore: () => void;
}

type DbCart = {
  items?: Array<{
    id: string;
    quantity: number;
    variant: {
      id: string;
      productId: string;
      sku?: string;
      price: number | string;
      condition?: string;
      product: {
        name: string;
        slug: string;
        condition?: string;
        media?: Array<{ url: string }>;
      };
    };
  }>;
};

type DbWishlistItem = {
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    condition?: string;
    media?: Array<{ url: string }>;
  };
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const mapCart = (cart: DbCart): CartItem[] =>
  (cart.items ?? []).map((item) => ({
    id: item.variant.id,
    cartItemId: item.id,
    productId: item.variant.productId,
    title: item.variant.product.name,
    price: Number(item.variant.price),
    qty: item.quantity,
    sku: item.variant.sku,
    img: item.variant.product.media?.[0]?.url ?? '',
    slug: item.variant.product.slug,
    condition: item.variant.condition ?? item.variant.product.condition,
  }));

const mapWishlist = (items: DbWishlistItem[]): WishlistItem[] =>
  items.flatMap(({ product }) =>
    product
      ? [
          {
            id: product.id,
            title: product.name,
            price: Number(product.price),
            img: product.media?.[0]?.url ?? '',
            slug: product.slug,
            condition: product.condition,
          },
        ]
      : [],
  );

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const cartFetchRef = useRef<Promise<void> | null>(null);
  const wishlistFetchRef = useRef<Promise<void> | null>(null);
  const addingItemIdsRef = useRef<Set<string>>(new Set());

  const getSession = useCallback(async () => {
    try {
      return (await createClient().auth.getSession()).data.session;
    } catch {
      return null;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (cartFetchRef.current) return cartFetchRef.current;

    const request = (async () => {
      try {
        const session = await getSession();
        const endpoint = session ? '/carts' : '/guest/cart';
        const res = await apiFetch<DbCart>(endpoint);
        if (res?.data) {
          setCart(mapCart(res.data));
        }
      } catch (err) {
        console.warn('[StoreContext] refreshCart failed:', err);
      }
    })();

    cartFetchRef.current = request;
    try {
      await request;
    } finally {
      if (cartFetchRef.current === request) cartFetchRef.current = null;
    }
  }, [getSession]);

  const refreshWishlist = useCallback(async () => {
    if (wishlistFetchRef.current) return wishlistFetchRef.current;

    const request = (async () => {
      try {
        const session = await getSession();
        const endpoint = session ? '/carts/wishlist' : '/guest/wishlist';
        const res = await apiFetch<DbWishlistItem[]>(endpoint);
        if (res?.data) {
          setWishlist(mapWishlist(res.data));
        }
      } catch (err) {
        console.warn('[StoreContext] refreshWishlist failed:', err);
      }
    })();

    wishlistFetchRef.current = request;
    try {
      await request;
    } finally {
      if (wishlistFetchRef.current === request) wishlistFetchRef.current = null;
    }
  }, [getSession]);

  // Initial load: fetch server-backed state (HttpOnly cookie sets automatically on guest)
  useEffect(() => {
    // Purge legacy localStorage cart/wishlist to prevent stale data contamination
    try {
      localStorage.removeItem('guest_cart');
      localStorage.removeItem('guest_wishlist');
    } catch {}

    Promise.all([refreshCart(), refreshWishlist()]).finally(() => {
      setIsHydrated(true);
    });
  }, [refreshCart, refreshWishlist]);

  const addToCart = useCallback(
    async (item: Omit<CartItem, 'qty'> & { qty?: number }, addedQty = 1) => {
      const quantity = item.qty ?? addedQty;
      const itemId = item.id;

      if (addingItemIdsRef.current.has(itemId)) return;
      addingItemIdsRef.current.add(itemId);

      // Instant Optimistic UI update
      setCart((old) => {
        const found = old.find((entry) => entry.id === itemId);
        return found
          ? old.map((entry) =>
              entry.id === itemId ? { ...entry, qty: entry.qty + quantity } : entry,
            )
          : [...old, { ...item, qty: quantity }];
      });
      setIsCartOpen(true);

      try {
        const session = await getSession();
        const endpoint = session ? '/carts/items' : '/guest/cart/items';
        const res = await apiFetch<DbCart>(endpoint, {
          method: 'POST',
          body: JSON.stringify({ variantId: itemId, quantity }),
        });
        if (res?.data?.items) {
          setCart(mapCart(res.data));
        }
      } catch (err) {
        await refreshCart();
        throw err;
      } finally {
        addingItemIdsRef.current.delete(itemId);
      }
    },
    [getSession, refreshCart],
  );

  const removeFromCart = useCallback(
    async (id: string) => {
      const item = cart.find((entry) => entry.id === id);
      setCart((old) => old.filter((entry) => entry.id !== id));

      if (item?.cartItemId) {
        try {
          const session = await getSession();
          const endpoint = session
            ? `/carts/items/${item.cartItemId}`
            : `/guest/cart/items/${item.cartItemId}`;
          const res = await apiFetch<DbCart>(endpoint, { method: 'DELETE' });
          if (res?.data?.items) setCart(mapCart(res.data));
        } catch {
          await refreshCart();
        }
      }
    },
    [cart, getSession, refreshCart],
  );

  const updateCartQty = useCallback(
    async (id: string, qty: number) => {
      const item = cart.find((entry) => entry.id === id);
      setCart((old) =>
        qty <= 0
          ? old.filter((entry) => entry.id !== id)
          : old.map((entry) => (entry.id === id ? { ...entry, qty } : entry)),
      );

      if (item?.cartItemId) {
        try {
          const session = await getSession();
          const endpoint = session
            ? `/carts/items/${item.cartItemId}`
            : `/guest/cart/items/${item.cartItemId}`;
          const res = await apiFetch<DbCart>(
            endpoint,
            qty <= 0
              ? { method: 'DELETE' }
              : { method: 'PATCH', body: JSON.stringify({ quantity: qty }) },
          );
          if (res?.data?.items) setCart(mapCart(res.data));
        } catch {
          await refreshCart();
        }
      }
    },
    [cart, getSession, refreshCart],
  );

  const clearCart = useCallback(async () => {
    setCart([]);
    try {
      const session = await getSession();
      if (session) {
        await Promise.all(
          cart.flatMap((item) =>
            item.cartItemId
              ? [apiFetch(`/carts/items/${item.cartItemId}`, { method: 'DELETE' })]
              : [],
          ),
        );
      } else {
        await Promise.all(
          cart.flatMap((item) =>
            item.cartItemId
              ? [apiFetch(`/guest/cart/items/${item.cartItemId}`, { method: 'DELETE' })]
              : [],
          ),
        );
      }
      await refreshCart();
    } catch {
      await refreshCart();
    }
  }, [cart, getSession, refreshCart]);

  const addToWishlist = useCallback(
    async (item: WishlistItem) => {
      setWishlist((old) =>
        old.some((entry) => entry.id === item.id) ? old : [...old, item],
      );
      setIsWishlistOpen(true);

      try {
        const session = await getSession();
        const productId = item.id;
        const endpoint = session
          ? `/carts/wishlist/items/${productId}`
          : `/guest/wishlist/items/${productId}`;
        await apiFetch(endpoint, { method: 'POST' });
        await refreshWishlist();
      } catch {
        await refreshWishlist();
      }
    },
    [getSession, refreshWishlist],
  );

  const removeFromWishlist = useCallback(
    async (id: string) => {
      setWishlist((old) => old.filter((entry) => entry.id !== id));
      try {
        const session = await getSession();
        const endpoint = session
          ? `/carts/wishlist/items/${id}`
          : `/guest/wishlist/items/${id}`;
        await apiFetch(endpoint, { method: 'DELETE' });
        await refreshWishlist();
      } catch {
        await refreshWishlist();
      }
    },
    [getSession, refreshWishlist],
  );

  const toggleWishlist = useCallback(
    async (item: WishlistItem) => {
      if (wishlist.some((entry) => entry.id === item.id)) {
        await removeFromWishlist(item.id);
      } else {
        await addToWishlist(item);
      }
    },
    [addToWishlist, removeFromWishlist, wishlist],
  );

  const resetStore = useCallback(() => {
    setCart([]);
    setWishlist([]);
    setIsCartOpen(false);
    setIsWishlistOpen(false);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartCount: cart.reduce((sum, item) => sum + item.qty, 0),
        cartSubtotal: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        isCartOpen,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        refreshCart,
        syncCart: setCart,
        openCart: () => {
          setIsWishlistOpen(false);
          setIsCartOpen(true);
        },
        closeCart: () => setIsCartOpen(false),
        setIsCartOpen,
        wishlist,
        wishlistCount: wishlist.length,
        isWishlistOpen,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist,
        isInWishlist: (id) => wishlist.some((item) => item.id === id),
        openWishlist: () => {
          setIsCartOpen(false);
          setIsWishlistOpen(true);
        },
        closeWishlist: () => setIsWishlistOpen(false),
        setIsWishlistOpen,
        resetStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}

export const useCart = useStore;
export const useWishlist = useStore;
