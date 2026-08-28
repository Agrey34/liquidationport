---
name: supabase-expert
description: "Expert guidelines for PostgreSQL database design, Row Level Security (RLS), Supabase Auth session management, Storage buckets, Realtime broadcasts, and high-performance Postgres optimizations."
metadata:
  author: Antigravity
  version: "1.0.0"
---

# Supabase Expert Guidelines

## 1. Database Architecture & Schema Standards
- **Primary Keys**: Always use UUIDs (`uuid_generate_v4()` or `gen_random_uuid()`) for all tables. Avoid serial auto-incrementing IDs for public endpoints.
- **Timestamp Integrity**: Include `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at TIMESTAMPTZ DEFAULT NOW()` across all tables.
- **Soft Deletes**: Use `deleted_at TIMESTAMPTZ NULL` on critical domain entities (`users`, `products`, `orders`). Filter soft-deleted records in global Prisma query scopes and RLS policies.
- **Indexing Strategy**:
  - Add B-tree indexes on foreign keys (`order_id`, `user_id`, `category_id`).
  - Add unique indexes on search and lookup keys (`slug`, `email`, `sku`).
  - Add GIN indexes for JSONB fields with structured filters (`manifest`, `attributes`).
  - Use partial indexes for active records (e.g. `CREATE INDEX idx_products_active ON products (slug) WHERE deleted_at IS NULL`).

## 2. Row Level Security (RLS) & Zero-Trust Policies
- **Mandatory RLS**: Enable RLS on every table in exposed schemas (`ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`).
- **Authorization Separation**:
  - Never use `raw_user_meta_data` in RLS policies or NestJS authorization guards—users can edit this payload.
  - Always check `raw_app_meta_data->>'role'` or authenticated user ID `auth.uid()`.
- **Query Optimization in Policies**:
  - Wrap `auth.uid()` in a subquery `(SELECT auth.uid())` so Postgres caches the result once per statement rather than evaluating it per row.
  - Example:
    ```sql
    CREATE POLICY "Users view own orders" ON public.orders
    FOR SELECT USING (user_id = (SELECT auth.uid()));
    ```
- **Service Role Key Security**:
  - The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. Restrict its usage strictly to NestJS backend operations and never expose it to client-side code or browser bundles.

## 3. Storage Architecture
- **Bucket Isolation**: Separate private documents (invoices, export manifests) from public assets (product media, logos).
- **Upload Validation**: Validate MIME types (`image/jpeg`, `image/png`, `image/webp`) and file size limits prior to dispatching upload streams.
- **CDN Caching**: Set appropriate `cacheControl` (e.g. `3600` for mutable assets, `31536000, immutable` for versioned media).

## 4. Realtime Subscriptions
- Configure PostgreSQL replication selectively only on required tables (`supabase_realtime` publication).
- In NestJS / Next.js, scope subscriptions to channels with specific filters (e.g. `orders:user_id=eq.${userId}`).
- Clean up active subscriptions on component unmount to prevent memory leaks and connection exhaustion.

## 5. Connection Pooling & Performance
- **Connection Modes**:
  - Direct connection (Port `5432`): For migrations and long-running transactional scripts.
  - Transaction Pooler / Supavisor (Port `6543`): For high-concurrency API instances and serverless functions.
- **Query Hygiene**:
  - Never execute unbounded `SELECT *` queries. Always specify required columns or limits.
  - Use `EXPLAIN (ANALYZE, BUFFERS)` to diagnose queries with sequential scans on large tables.
