---
name: nextjs-pro
description: "Next.js App Router performance, React Server Components (RSC), SSR optimizations, caching architectures, route handlers, image optimization, and SEO standards."
metadata:
  author: Antigravity
  version: "1.0.0"
---

# Next.js Pro Guidelines

## 1. App Router Architecture & Component Composition
- **Route Organization**:
  - `(shop)`: Public storefront and e-commerce experience (SEO optimized, server-rendered).
  - `(admin)`: Protected back-office operations and inventory management.
  - `(customer-auth)`: Authentication workflows (login, registration, password recovery).
- **Server vs. Client Boundaries**:
  - Keep components as **React Server Components (RSC)** by default to eliminate client bundle overhead.
  - Push `'use client'` to the leaf nodes of the component tree (e.g. interactive buttons, cart drawers, filter bars).
  - Pass server-fetched data as props to client components or utilize React Server Actions.

## 2. Data Fetching & Caching Strategy
- **Centralized Fetch Utility**:
  - Route backend calls through a resilient API client (`apiFetch`) that handles authentication headers, auto-retry on 401s, and session refresh.
- **Granular Revalidation**:
  - Use Next.js tag-based revalidation (`revalidateTag('products')`) or time-based ISR (`next: { revalidate: 60 }`) for catalog pages.
  - Use dynamic rendering (`export const dynamic = 'force-dynamic'`) on authenticated user pages (`/account`, `/checkout`).

## 3. Image Optimization & Core Web Vitals (CWV)
- **Largest Contentful Paint (LCP)**:
  - Add `priority` and `loading="eager"` to hero images and primary product gallery views above the fold.
- **Cumulative Layout Shift (CLS)**:
  - Always provide explicit aspect ratios or `fill` with parent container aspect ratios (e.g. `aspect-[4/3]`) to reserve layout space during rendering.
  - Define responsive `sizes` attribute (e.g. `sizes="(max-width: 768px) 100vw, 50vw"`).
- **Domain Configuration**:
  - Register external asset domains and remote patterns in `next.config.ts`.

## 4. Metadata & SEO Excellence
- **Dynamic Metadata**:
  - Implement `generateMetadata` for dynamic routes (`/products/[slug]`, `/categories/[slug]`).
  - Include descriptive titles, OpenGraph previews (`og:image`, `og:title`), Twitter card metadata, and canonical URLs.
- **Structured Data (JSON-LD)**:
  - Embed schema.org structured data (`Product`, `Offer`, `BreadcrumbList`) for rich search engine results.

## 5. Client State & User Experience
- **Suspense & Streaming**:
  - Wrap asynchronous sections in `<Suspense fallback={<Skeleton />}>` and utilize route-level `loading.tsx` for immediate feedback.
- **Link Pre-fetching**:
  - Next.js `<Link>` components prefetch routes in the viewport by default. Ensure backend query handlers are fast and cached to support instantaneous transitions.
- **Hydration Safety**:
  - Prevent hydration mismatches by ensuring timestamps and browser-specific values (`localStorage`, `window`) are accessed only inside `useEffect` or client-only hooks.
