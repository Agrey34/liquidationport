/**
 * Robust Product Media URL Resolver
 * Resolves any Cloudflare R2, Supabase Storage, local API streaming, Render proxy, or external CDN image URL.
 */

export const DEFAULT_PRODUCT_FALLBACK =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop';

/**
 * Returns a fully accessible URL for any image in the application.
 */
export function getMediaUrl(url?: string | null, fallback: string = DEFAULT_PRODUCT_FALLBACK): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const trimmed = url.trim();
  const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const apiBase = rawApiBase.endsWith('/api/v1')
    ? rawApiBase.replace(/\/$/, '')
    : `${rawApiBase.replace(/\/$/, '')}/api/v1`;
  const apiOrigin = apiBase.replace(/\/api\/v1$/, '');

  // 1. If the URL contains localhost:4000 or 127.0.0.1:4000 (from legacy DB records or dev backend)
  // in production, rewrite it to use the live apiBase / apiOrigin
  if (trimmed.includes('localhost:4000') || trimmed.includes('127.0.0.1:4000')) {
    if (trimmed.includes('/api/v1/shop/media/')) {
      const key = trimmed.split('/api/v1/shop/media/')[1];
      return `${apiBase}/shop/media/${key.replace(/^\//, '')}`;
    }
    if (trimmed.includes('/shop/media/')) {
      const key = trimmed.split('/shop/media/')[1];
      return `${apiBase}/shop/media/${key.replace(/^\//, '')}`;
    }
    const path = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):4000/, '');
    return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // 2. If it's a Cloudflare R2 development subdomain or direct S3 endpoint (which returns 401 Unauthorized without auth),
  // route it through the backend's authenticated R2 streaming proxy
  if (trimmed.includes('pub-ecommerce-product-images.r2.dev') || trimmed.includes('.r2.cloudflarestorage.com')) {
    let key = '';
    if (trimmed.includes('.r2.dev/')) {
      key = trimmed.split('.r2.dev/')[1] || '';
    } else if (trimmed.includes('.r2.cloudflarestorage.com/')) {
      const parts = trimmed.split('.r2.cloudflarestorage.com/');
      key = parts[1] || '';
      if (key.startsWith('ecommerce-product-images/')) {
        key = key.replace('ecommerce-product-images/', '');
      }
    }
    if (key) {
      return `${apiBase}/shop/media/${key.replace(/^\//, '')}`;
    }
  }

  // 3. If it's a relative path starting with /api/v1
  if (trimmed.startsWith('/api/v1')) {
    return `${apiOrigin}${trimmed}`;
  }

  // 4. If it's a relative shop/media path
  if (trimmed.startsWith('/shop/media') || trimmed.startsWith('shop/media')) {
    const clean = trimmed.replace(/^\/?shop\/media\/?/, '');
    return `${apiBase}/shop/media/${clean}`;
  }

  // 5. If it's an S3 key like 'products/123-image.jpg' or 'categories/...' or 'marketing/...'
  if (
    trimmed.startsWith('products/') ||
    trimmed.startsWith('/products/') ||
    trimmed.startsWith('categories/') ||
    trimmed.startsWith('/categories/') ||
    trimmed.startsWith('marketing/') ||
    trimmed.startsWith('/marketing/')
  ) {
    return `${apiBase}/shop/media/${trimmed.replace(/^\//, '')}`;
  }

  // 6. If it's an absolute working URL (e.g. Supabase Storage, Unsplash, custom CDN domain)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 7. If it's a local public asset like '/logo.png'
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `${apiBase}/shop/media/${trimmed}`;
}

