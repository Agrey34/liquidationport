'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { StorefrontConfig, DEFAULT_STOREFRONT_CONFIG } from '../types/storefront';

export function useStorefrontConfig() {
  const [config, setConfig] = useState<StorefrontConfig>(DEFAULT_STOREFRONT_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        setLoading(true);
        const res = await apiFetch<{ key: string; value: string | null }>('/settings/storefront_config');
        const payload = res.data as unknown as { key?: string; value?: string | null };

        if (payload?.value && isMounted) {
          try {
            const parsed = JSON.parse(payload.value);
            setConfig({
              ...DEFAULT_STOREFRONT_CONFIG,
              ...parsed,
              announcement: { ...DEFAULT_STOREFRONT_CONFIG.announcement, ...(parsed.announcement || {}) },
              hero: { ...DEFAULT_STOREFRONT_CONFIG.hero, ...(parsed.hero || {}) },
              brands: { ...DEFAULT_STOREFRONT_CONFIG.brands, ...(parsed.brands || {}) },
              benefits: { ...DEFAULT_STOREFRONT_CONFIG.benefits, ...(parsed.benefits || {}) },
              promoBanner: { ...DEFAULT_STOREFRONT_CONFIG.promoBanner, ...(parsed.promoBanner || {}) },
            });
          } catch (jsonErr) {
            console.warn('Invalid storefront_config JSON, falling back to defaults:', jsonErr);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch storefront settings');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  return { config, loading, error, setConfig };
}
