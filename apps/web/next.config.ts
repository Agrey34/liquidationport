import type { NextConfig } from "next";

/**
 * Cloudflare R2 domain — update this with your custom CDN subdomain when you
 * configure a custom domain in the Cloudflare R2 dashboard.
 * Example: media.yourdomain.com
 */
const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_DOMAIN || "pub-ecommerce-product-images.r2.dev";

/**
 * Supabase project reference — used to whitelist Supabase Storage public URLs.
 */
const SUPABASE_PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || "dwcqddafnxerhoredcmw";

const nextConfig: NextConfig = {
  images: {
    // Allow the Next.js Image component to optimize images from these hosts.
    // In development, the NestJS proxy (localhost:4000) serves R2 images.
    // In production, update R2_PUBLIC_DOMAIN to your real CDN subdomain.
    remotePatterns: [
      // ── 1. Cloudflare R2 — public product images ──────────────────────────
      {
        protocol: "https",
        hostname: R2_PUBLIC_DOMAIN,
        pathname: "/**",
      },
      // ── 2. Cloudflare R2 — if using a custom subdomain (e.g. media.liquidationport.com) ─
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      // ── 3. Supabase Storage — user avatars & public assets ────────────────
      {
        protocol: "https",
        hostname: `${SUPABASE_PROJECT_REF}.supabase.co`,
        pathname: "/storage/v1/object/public/**",
      },
      // ── 4. Local Development: NestJS proxy streams R2 images ──────────────
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/api/v1/shop/media/**",
      },
      // ── 5. Wildcard fallback for any other HTTPS domain (disable if strict mode needed) ─
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
