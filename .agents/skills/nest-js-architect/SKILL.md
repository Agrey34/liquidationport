---
name: nest-js-architect
description: "Architectural principles for NestJS modular monoliths, security guards, interceptors, DTO validation, transaction integrity, event-driven domain handlers, and caching."
metadata:
  author: Antigravity
  version: "1.0.0"
---

# NestJS Architect Guidelines

## 1. Modular Monorepo Architecture
- **Strict Boundary Separation**:
  - `apps/api`: Contains all core business logic, database transactions, services, and secrets.
  - `apps/web`: User interface and presentation layer only. Never import backend services or database clients directly into Next.js components.
  - `libs/shared`: TypeScript interfaces, DTO definitions, Enums (`OrderStatus`, `Roles`), and pure validation schemas.
- **Module Encapsulation**:
  - Every domain area (`auth`, `products`, `orders`, `payments`, `categories`) must reside in its own NestJS module.
  - Cross-module communication must use exported **Services** or **Domain Events**, never direct database access to foreign tables.

## 2. Security Guards & Pipeline Standards
- **Global Pipes**:
  - Enforce `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
- **Authentication & JWT Guard**:
  - Validate incoming Supabase JWT tokens via `SupabaseAuthGuard` using `SUPABASE_JWT_SECRET`.
  - Extract and populate `request.user` with authenticated identity and `app_metadata.role`.
- **Role-Based Access Control (RBAC)**:
  - Protect administrative endpoints using `@Roles('admin')` combined with `RolesGuard`.
- **Rate Limiting & Threat Mitigation**:
  - Apply `@Throttle` on sensitive endpoints (checkout, authentication, file upload).
  - Use `helmet` globally to enforce standard security headers (HSTS, CSP, X-Frame-Options).

## 3. Transactional Integrity & Critical Business Logic
- **Atomic Checkout & Inventory**:
  - Always execute order creation inside `this.prisma.$transaction(async (tx) => { ... })`.
  - **Price Snapshotting**: Calculate totals strictly on the backend and record the exact unit price in `order_items`. Never trust client-submitted totals.
  - **Stock Concurrency**: Validate available inventory inside the transaction before decrementing stock.
- **Payment Webhook Security**:
  - Verify Stripe webhook signatures (`stripe.webhooks.constructEvent`) using the raw request body before processing.
  - Ensure webhook handlers are strictly idempotent.

## 4. Response Interceptors & Error Filters
- **Consistent Response Schema**:
  - Transform all API output through `TransformInterceptor` to enforce `{ data: T, meta?: Record<string, unknown> }`.
- **Global Error Handling**:
  - Intercept uncaught errors with `HttpExceptionFilter`.
  - Log complete internal traces to the server logger while returning sanitized, user-friendly error messages to the client.

## 5. Event-Driven Decoupling
- Use `@nestjs/event-emitter` (`EventEmitter2`) for non-blocking side effects:
  - Example: `order.paid` emits domain event to trigger:
    1. `NotificationsService` (customer confirmation email)
    2. `AuditService` (system audit log entry)
    3. `RealtimeService` (live dashboard update)
- Never place asynchronous network calls (third-party emails, external webhooks) inside synchronous database transaction blocks.

## 6. Caching & Cache-Aside Patterns
- Implement caching for high-frequency read endpoints (`/products`, `/categories`).
- Use single-flight stampede protection to prevent cache stampedes on expired keys.
- Automatically invalidate cache keys on write mutations (`POST`, `PATCH`, `DELETE`) using pattern deletions (e.g. `products:*`).
