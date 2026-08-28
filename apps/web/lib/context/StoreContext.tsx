'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
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
  // Cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  addToCart: (item: Omit<CartItem, 'qty'> & { qty?: number }, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setIsCartOpen: (open: boolean) => void;

  // Wishlist
  wishlist: WishlistItem[];
  wishlistCount: number;
  isWishlistOpen: boolean;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  setIsWishlistOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'lp_cart_v1';
const WISHLIST_STORAGE_KEY = 'lp_wishlist_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (e) {
      console.warn('Failed to load cart/wishlist from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync Cart to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart, isHydrated]);

  // Sync Wishlist to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlist, isHydrated]);

  // Cart Handlers
  const addToCart = useCallback((item: Omit<CartItem, 'qty'> & { qty?: number }, addedQty: number = 1) => {
    const quantityToAdd = item.qty || addedQty || 1;
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === item.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + quantityToAdd,
        };
        return updated;
      } else {
        return [...prev, { ...item, qty: quantityToAdd }];
      }
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateCartQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty } : item))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const openCart = useCallback(() => {
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Wishlist Handlers
  const addToWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsWishlistOpen(true);
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isInWishlist = useCallback(
    (id: string) => wishlist.some((item) => item.id === id),
    [wishlist]
  );

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const openWishlist = useCallback(() => {
    setIsCartOpen(false);
    setIsWishlistOpen(true);
  }, []);

  const closeWishlist = useCallback(() => setIsWishlistOpen(false), []);

  const cartCount = cart.reduce((total, item) => total + (item.qty || 1), 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  const wishlistCount = wishlist.length;

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        openCart,
        closeCart,
        setIsCartOpen,
        wishlist,
        wishlistCount,
        isWishlistOpen,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        openWishlist,
        closeWishlist,
        setIsWishlistOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export const useCart = useStore;
export const useWishlist = useStore;
