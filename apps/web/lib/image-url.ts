/**
 * Robust Product Media URL Resolver
 * Resolves any Cloudflare R2, Supabase Storage, local API streaming, or external CDN image URL.
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
  const apiBase = rawApiBase.endsWith('/api/v1') ? rawApiBase.replace(/\/$/, '') : `${rawApiBase.replace(/\/$/, '')}/api/v1`;

  // 1. If it's a direct Cloudflare R2 development subdomain that returns 401 Unauthorized,
  // route it through the backend's authenticated R2 S3 streaming proxy
  if (trimmed.includes('pub-ecommerce-product-images.r2.dev') || trimmed.includes('.r2.cloudflarestorage.com')) {
    let key = '';
    if (trimmed.includes('pub-ecommerce-product-images.r2.dev/')) {
      key = trimmed.split('pub-ecommerce-product-images.r2.dev/')[1] || '';
    } else if (trimmed.includes('.r2.cloudflarestorage.com/')) {
      key = trimmed.split('.r2.cloudflarestorage.com/')[1] || '';
    }
    if (key) {
      return `${apiBase}/shop/media/${key.replace(/^\//, '')}`;
    }
  }

  // 2. If it's a relative path starting with /api/v1
  if (trimmed.startsWith('/api/v1')) {
    const origin = apiBase.replace(/\/api\/v1$/, '');
    return `${origin}${trimmed}`;
  }

  // 3. If it's a relative shop/media path
  if (trimmed.startsWith('/shop/media') || trimmed.startsWith('shop/media')) {
    return `${apiBase}/${trimmed.replace(/^\//, '')}`;
  }

  // 4. If it's an S3 key like 'products/123-image.jpg'
  if (trimmed.startsWith('products/') || trimmed.startsWith('/products/')) {
    return `${apiBase}/shop/media/${trimmed.replace(/^\//, '')}`;
  }

  // 5. If it's a full working URL (Supabase, Unsplash, custom CDN)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 6. If it's a local public asset like '/logo.png'
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `${apiBase}/shop/media/${trimmed}`;
}
