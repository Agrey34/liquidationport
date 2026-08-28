import { cache } from 'react';
import { apiFetch } from './api';

/**
 * Data fetching layer for Server Components.
 * 
 * Uses React's `cache` to deduplicate requests within the same render pass.
 * Uses Next.js 15 `"use cache"` directive to aggressively cache public data 
 * across requests (acting like the old force-cache / unstable_cache).
 */

// 1. Fully Cached Public Data (Across Requests)
// 'use cache' enables Next.js 15+ persistent caching for this function's output.
// React's `cache` ensures we only call it once per render pass even if multiple components request it.
export const getCategories = cache(async () => {
  'use cache';
  return apiFetch('/categories');
});

export const getProducts = cache(async (searchParams?: Record<string, string>) => {
  'use cache';
  const query = searchParams ? new URLSearchParams(searchParams).toString() : '';
  const endpoint = query ? `/products?${query}` : '/products';
  return apiFetch(endpoint);
});

export const getProductById = cache(async (id: string) => {
  'use cache';
  return apiFetch(`/products/${id}`);
});

// 2. Request-Scoped Cached Data (Per User / Private)
// We DO NOT use `"use cache"` here because this data is specific to the user.
// We DO use React's `cache` so that if multiple components need the user profile 
// during the same render pass, the API is only hit once.
export const getUserProfile = cache(async (token: string) => {
  return apiFetch('/users/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
});
