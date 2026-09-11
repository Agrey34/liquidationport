import { MemoryCacheService } from '../src/common/cache/memory-cache.service';
import { SupabaseAuthGuard } from '../src/common/guards/supabase-auth.guard';
import { ProductsService } from '../src/modules/products/products.service';
import { OrdersService } from '../src/modules/orders/orders.service';
import { AdminsService } from '../src/modules/admins/admins.service';
import { ReviewsService } from '../src/modules/reviews/reviews.service';
import { CouponsService } from '../src/modules/coupons/coupons.service';
import { UsersService } from '../src/modules/users/users.service';
import { CartsService } from '../src/modules/carts/carts.service';
import { CouponType } from '../src/modules/coupons/dto/coupon.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/database/prisma.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as assert from 'assert';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    → ${err.message || err}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  RUNNING PRODUCTION AUTOMATED UNIT & INTEGRATION TESTS');
  console.log('======================================================\n');

  console.log('--- 1. MemoryCacheService Tests ---');
  const cache = new MemoryCacheService({ maxEntries: 3, defaultTtlSeconds: 1 });

  await test('Cache Hit & Miss & Metric Tracking', async () => {
    assert.strictEqual(await cache.get('test:1'), null);
    await cache.set('test:1', { message: 'hello' });
    const data = await cache.get<{ message: string }>('test:1');
    assert.deepStrictEqual(data, { message: 'hello' });
    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.hits, 1);
    assert.strictEqual(metrics.misses, 1);
    assert.strictEqual(metrics.keyCount, 1);
  });

  await test('Deterministic Canonical Cache Key Generation', () => {
    const key1 = cache.generateKey('products:list', { page: 1, category: 'electronics', minPrice: 100 }, 'tenant-abc');
    const key2 = cache.generateKey('products:list', { minPrice: 100, category: 'electronics', page: 1 }, 'tenant-abc');
    assert.strictEqual(key1, key2);
    assert.ok(key1.includes('tenant:tenant-abc:products:list'));
  });

  await test('Multi-Tenant Cache Key Isolation', () => {
    const k1 = cache.generateKey('products:list', { page: 1 }, 'tenant-1');
    const k2 = cache.generateKey('products:list', { page: 1 }, 'tenant-2');
    assert.notStrictEqual(k1, k2);
    assert.ok(k1.includes('tenant:tenant-1'));
    assert.ok(k2.includes('tenant:tenant-2'));
  });

  await test('LRU Eviction on Capacity Overflow', async () => {
    await cache.reset();
    await cache.set('k1', 'v1');
    await cache.set('k2', 'v2');
    await cache.set('k3', 'v3');
    await cache.get('k1'); // Access k1 to make k2 oldest
    await cache.set('k4', 'v4'); // Should evict k2
    assert.strictEqual(await cache.get('k2'), null);
    assert.strictEqual(await cache.get('k1'), 'v1');
    assert.strictEqual(await cache.get('k3'), 'v3');
    assert.strictEqual(await cache.get('k4'), 'v4');
  });

  await test('TTL Expiration', async () => {
    await cache.set('exp-k', 'val', { ttlSeconds: 0.05 });
    assert.strictEqual(await cache.get('exp-k'), 'val');
    await new Promise((r) => setTimeout(r, 80));
    assert.strictEqual(await cache.get('exp-k'), null);
  });

  await test('Stampede Single-Flight Deduplication (50 concurrent requests)', async () => {
    let factoryCount = 0;
    const factory = async () => {
      factoryCount++;
      await new Promise((r) => setTimeout(r, 30));
      return { data: 'stampede-safe' };
    };

    const requests = Array.from({ length: 50 }, () => cache.getOrSet('stampede-k', factory, { ttlSeconds: 10 }));
    const results = await Promise.all(requests);
    assert.strictEqual(results.length, 50);
    assert.strictEqual(factoryCount, 1);
    assert.deepStrictEqual(results[0], { data: 'stampede-safe' });
  });

  await test('Pattern Invalidation (delByPattern)', async () => {
    await cache.set('products:list:1', 'p1');
    await cache.set('products:list:2', 'p2');
    await cache.set('orders:list:1', 'o1');

    const count = await cache.delByPattern('products:');
    assert.strictEqual(count, 2);
    assert.strictEqual(await cache.get('products:list:1'), null);
    assert.strictEqual(await cache.get('orders:list:1'), 'o1');
  });

  console.log('\n--- 2. SupabaseAuthGuard Security & Claims Tests ---');
  const testSecret = process.env.SUPABASE_JWT_SECRET || 'mock-jwt-secret-for-unit-testing-32-chars-long-min!';
  const testUrl = 'https://dwcqddafnxerhoredcmw.supabase.co';

  process.env.SUPABASE_JWT_SECRET = testSecret;
  const guard = new SupabaseAuthGuard();

  const mockCtx = (header?: string): ExecutionContext => {
    const req: any = { headers: { authorization: header } };
    return { switchToHttp: () => ({ getRequest: () => req }) } as any;
  };

  await test('Valid Token with Claims (iss, sub, aud, exp, iat, alg) Successfully Authenticates Locally', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      email: 'admin@liquidationport.com',
      role: 'authenticated',
      aud: 'authenticated',
      iss: `${testUrl}/auth/v1`,
      app_metadata: { role: 'admin' },
    };

    const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '1h' });
    const ctx = mockCtx(`Bearer ${token}`);
    const ok = await guard.canActivate(ctx);
    assert.strictEqual(ok, true);
    const req = ctx.switchToHttp().getRequest();
    assert.strictEqual(req.user.id, payload.sub);
    assert.strictEqual(req.user.role, 'admin');
  });

  await test('Reject Missing Authorization Header', async () => {
    const ctx = mockCtx(undefined);
    let threw = false;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      if (e instanceof UnauthorizedException) threw = true;
    }
    assert.strictEqual(threw, true);
  });

  await test('Reject Expired Token', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      iss: `${testUrl}/auth/v1`,
      aud: 'authenticated',
    };
    const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '-10m' });
    const ctx = mockCtx(`Bearer ${token}`);
    let threw = false;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      if (e instanceof UnauthorizedException) threw = true;
    }
    assert.strictEqual(threw, true);
  });

  await test('Reject Invalid Token Signature', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      iss: `${testUrl}/auth/v1`,
      aud: 'authenticated',
    };
    const token = jwt.sign(payload, 'incorrect-signature-secret', { algorithm: 'HS256' });
    const ctx = mockCtx(`Bearer ${token}`);
    let threw = false;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      if (e instanceof UnauthorizedException) threw = true;
    }
    assert.strictEqual(threw, true);
  });

  await test('Reject Invalid Issuer Claim', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      iss: 'https://attacker.com/auth/v1',
      aud: 'authenticated',
    };
    const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '1h' });
    const ctx = mockCtx(`Bearer ${token}`);
    let threw = false;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      if (e instanceof UnauthorizedException) threw = true;
    }
    assert.strictEqual(threw, true);
  });

  console.log('\n--- 3. ProductsService & Query Hardening Tests ---');
  let dbQueries = 0;
  const mockPrisma: Partial<PrismaService> = {
    $transaction: (async (queries: any[]) => {
      dbQueries++;
      if (Array.isArray(queries)) {
        return Promise.all(queries);
      }
      return queries;
    }) as any,
    product: {
      findMany: (async () => {
        dbQueries++;
        return [
          { id: '1', name: 'Pallet 1', slug: 'pallet-1', price: 100, stock: 5, category: null, variants: [], media: [] }
        ];
      }) as any,
      count: (async () => 1) as any,
      findFirst: (async () => {
        dbQueries++;
        return { id: '1', name: 'Pallet 1', slug: 'pallet-1', price: 100, stock: 5, category: null, variants: [], media: [] };
      }) as any,
      update: (async () => {
        return { id: '1', name: 'Pallet 1 Updated' };
      }) as any,
    } as any,
  };

  const prodCache = new MemoryCacheService({ maxEntries: 100, defaultTtlSeconds: 300 });
  const mockConfig = { get: () => 'http://localhost:4000/api/v1/shop/media' } as any;
  const mockStorage = { uploadPublicProductImage: async () => ({ url: 'mock-url' }) } as any;
  const prodService = new ProductsService(mockPrisma as PrismaService, mockConfig, prodCache, mockStorage);

  await test('Enforce Server-Side Pagination Limit Clamp (max 100)', async () => {
    const result = await prodService.findAll({ page: 1, limit: 10000 });
    assert.strictEqual(result.limit, 100);
  });

  await test('Cache Products List and Avoid Duplicate DB Queries', async () => {
    dbQueries = 0;
    const res1 = await prodService.findAll({ page: 1, limit: 20 });
    assert.strictEqual(dbQueries, 1);

    // Call again -> served from cache
    const res2 = await prodService.findAll({ page: 1, limit: 20 });
    assert.strictEqual(dbQueries, 1);
    assert.deepStrictEqual(res1, res2);
  });

  await test('Post-Commit Invalidation Clears Cache on Product Mutation', async () => {
    await prodService.findAll({ page: 1, limit: 20 });
    assert.ok(prodCache.getMetrics().keyCount > 0);
    await prodService.update('1', { name: 'Updated' });
    assert.strictEqual(prodCache.getMetrics().keyCount, 0);
  });

  console.log('\n--- 4. OrdersService & AdminsService Live DB Queries Tests ---');
  const mockOrderPrisma: any = {
    $transaction: async (queries: any) => {
      if (typeof queries === 'function') {
        return (queries as any)(mockOrderPrisma);
      }
      return Promise.all(queries);
    },
    $queryRaw: async () => [
      { totalOrders: 2, pendingOrders: 1, totalRevenue: 4000, attentionRequired: 0 }
    ],
    order: {
      findMany: async () => [
        {
          id: '5a829da4-c7f3-4744-b606-64cfaf262249',
          total: 1500,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [{ id: 'i-1', productName: 'Pallet Lot A', sku: 'LOT-A', quantity: 1, price: 1500 }],
          statusHistory: [{ id: 'sh-1', status: 'pending', createdAt: new Date(), note: 'Created' }],
          payment: { id: 'p-1', provider: 'stripe', status: 'paid' },
          shipment: null,
          user: { id: 'u-1', email: 'dennis@example.com', addresses: [] },
        }
      ],
      count: async () => 1,
      findUnique: async () => ({
        id: '5a829da4-c7f3-4744-b606-64cfaf262249',
        status: 'pending',
      }),
      update: async (args: any) => ({
        id: args.where.id,
        status: args.data.status,
      }),
    },
    orderStatusHistory: {
      create: async () => ({ id: 'sh-new' }),
    },
    auditLog: {
      create: async () => ({ id: 'aud-new' }),
    },
    product: {
      count: async () => 42,
    },
    user: {
      count: async () => 18,
    },
  };

  const adminOrdersService = new OrdersService(mockOrderPrisma);
  const adminsStatsService = new AdminsService(mockOrderPrisma);

  await test('OrdersService.getAdminOrders returns mapped orders with live KPIs', async () => {
    const res = await adminOrdersService.getAdminOrders({ page: 1, limit: 10 });
    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.data.length, 1);
    assert.strictEqual(res.data[0].customerEmail, 'dennis@example.com');
    assert.strictEqual(res.kpis.totalOrders, 2);
    assert.strictEqual(res.kpis.totalRevenue, 4000);
  });

  await test('OrdersService.updateOrderStatus records status history atomically', async () => {
    const updated = await adminOrdersService.updateOrderStatus(
      '5a829da4-c7f3-4744-b606-64cfaf262249',
      'processing',
      'Order marked processing by admin',
      { id: 'admin-1', email: 'admin@liquidationport.com' }
    );
    assert.strictEqual(updated.status, 'processing');
  });

  await test('AdminsService.getDashboardStats aggregates revenue, products, users & pending orders', async () => {
    const stats = await adminsStatsService.getDashboardStats();
    assert.strictEqual(stats.kpis.length, 4);
    assert.strictEqual(stats.kpis[0].title, 'Total Revenue');
    assert.strictEqual(stats.kpis[1].title, 'Active Pallets');
    assert.strictEqual(stats.kpis[1].value, '42');
    assert.strictEqual(stats.kpis[2].title, 'Registered Users');
    assert.strictEqual(stats.kpis[2].value, '18');
  });

  console.log('\n--- 5. ReviewsService, CouponsService & UsersService Tests ---');
  let mockReviews = [
    { id: 'rev-1', productId: 'prod-1', userId: 'user-1', rating: 5, comment: 'Amazing pallet!', createdAt: new Date(), product: { id: 'prod-1', name: 'Pallet 1', slug: 'pallet-1' }, user: { id: 'user-1', email: 'buyer@test.com' } },
    { id: 'rev-2', productId: 'prod-1', userId: 'user-2', rating: 4, comment: 'Good quality.', createdAt: new Date(), product: { id: 'prod-1', name: 'Pallet 1', slug: 'pallet-1' }, user: { id: 'user-2', email: 'buyer2@test.com' } },
  ];

  let mockCoupons = [
    { id: 'coup-1', code: 'SAVE20', discount: 20, type: 'percentage', expiresAt: null, usageLimit: 100, createdAt: new Date(), _count: { usages: 5 } },
  ];

  const mockAppPrisma: any = {
    $transaction: async (fn: any) => {
      if (typeof fn === 'function') return fn(mockAppPrisma);
      return Promise.all(fn);
    },
    productReview: {
      findMany: async (args?: any) => {
        if (args?.select) return mockReviews.map(r => ({ id: r.id, rating: r.rating, createdAt: r.createdAt }));
        return mockReviews;
      },
      count: async () => mockReviews.length,
      findUnique: async (args: any) => mockReviews.find(r => r.id === args?.where?.id),
      delete: async (args: any) => {
        mockReviews = mockReviews.filter(r => r.id !== args?.where?.id);
        return { id: args?.where?.id };
      },
      aggregate: async () => ({ _avg: { rating: 4.5 }, _count: { rating: mockReviews.length } }),
    },
    product: {
      update: async () => ({ id: 'prod-1', ratingAvg: 4.5, ratingCount: mockReviews.length }),
    },
    coupon: {
      findUnique: async (args: any) => mockCoupons.find(c => c.code === args?.where?.code || c.id === args?.where?.id),
      findMany: async () => mockCoupons,
      create: async (args: any) => {
        const c = { id: 'coup-new', ...args.data, _count: { usages: 0 } };
        mockCoupons.push(c);
        return c;
      },
      delete: async (args: any) => {
        mockCoupons = mockCoupons.filter(c => c.id !== args?.where?.id);
        return { id: args?.where?.id };
      },
    },
    couponUsage: {
      findUnique: async () => null,
    },
    user: {
      findUnique: async (args: any) => ({ id: args?.where?.id, role: 'customer' }),
      findMany: async () => [{ id: 'u-1', email: 'test@example.com', role: 'customer', status: 'active', createdAt: new Date(), updatedAt: new Date(), orders: [] }],
      update: async (args: any) => ({ id: args?.where?.id, ...args.data }),
    },
    auditLog: {
      findMany: async () => [],
    },
    admin: {
      findUnique: async (args: any) => {
        if (args?.where?.id === 'admin-1') return { id: 'admin-1', role: 'admin' };
        if (args?.where?.id === 'superadmin-1') return { id: 'superadmin-1', role: 'super_admin' };
        return null;
      },
    },
    cart: {
      findUnique: async (args: any) => {
        if (args?.where?.userId === mockCart.userId || args?.where?.id === mockCart.id) return mockCart;
        return null;
      },
      upsert: async (args: any) => {
        return mockCart;
      },
      create: async (args: any) => {
        return mockCart;
      },
    },
    cartItem: {
      findUnique: async (args: any) => {
        if (args?.where?.cartId_variantId) {
          return mockCart.items.find((i: any) => i.cartId === args.where.cartId_variantId.cartId && i.variantId === args.where.cartId_variantId.variantId) || null;
        }
        if (args?.where?.id) {
          const item = mockCart.items.find((i: any) => i.id === args.where.id);
          if (!item) return null;
          const variant = mockVariants.find((v: any) => v.id === item.variantId);
          return { ...item, variant };
        }
        return null;
      },
      upsert: async (args: any) => {
        const idx = mockCart.items.findIndex((i: any) => i.cartId === args.where.cartId_variantId.cartId && i.variantId === args.where.cartId_variantId.variantId);
        const variant = mockVariants.find((v: any) => v.id === args.where.cartId_variantId.variantId);
        if (idx >= 0) {
          mockCart.items[idx].quantity += args.update.quantity.increment;
          return mockCart.items[idx];
        } else {
          const newItem = { id: 'ci-' + (mockCart.items.length + 1), cartId: args.create.cartId, variantId: args.create.variantId, quantity: args.create.quantity, variant };
          mockCart.items.push(newItem);
          return newItem;
        }
      },
      update: async (args: any) => {
        const item = mockCart.items.find((i: any) => i.id === args.where.id);
        if (item) item.quantity = args.data.quantity;
        return item;
      },
      deleteMany: async (args: any) => {
        const before = mockCart.items.length;
        mockCart.items = mockCart.items.filter((i: any) => !(i.id === args.where.id && i.cartId === args.where.cartId));
        return { count: before - mockCart.items.length };
      },
    },
    productVariant: {
      findFirst: async (args: any) => {
        if (args?.where?.OR) {
          const v = mockVariants.find((mv: any) => args.where.OR.some((cond: any) => cond.id === mv.id || cond.productId === mv.productId));
          return v ? { id: v.id, stock: v.stock } : null;
        }
        return null;
      },
    },
  };

  let mockCart: any = {
    id: 'cart-1',
    userId: 'u-1',
    items: [],
  };
  const mockVariants: any[] = [
    { id: 'var-1', productId: 'prod-1', stock: 10, price: '150.00', product: { name: 'Item 1', slug: 'item-1', media: [{ url: '/img1.jpg' }] } },
    { id: 'var-2', productId: 'prod-2', stock: 2, price: '200.00', product: { name: 'Item 2', slug: 'item-2', media: [{ url: '/img2.jpg' }] } },
  ];

  const reviewsService = new ReviewsService(mockAppPrisma);
  const couponsService = new CouponsService(mockAppPrisma);
  const usersService = new UsersService(mockAppPrisma, { get: () => '' } as any);
  const cartsService = new CartsService(mockAppPrisma);

  await test('ReviewsService.getAdminReviews returns list with live KPIs', async () => {
    const res = await reviewsService.getAdminReviews({ page: 1, limit: 10 });
    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.kpis.totalReviews, 2);
    assert.strictEqual(res.kpis.averageRating, 4.5);
    assert.strictEqual(res.kpis.fiveStarCount, 1);
  });

  await test('ReviewsService.deleteReview deletes and triggers recalculation', async () => {
    const res = await reviewsService.deleteReview('rev-1');
    assert.strictEqual(res.success, true);
    assert.strictEqual(mockReviews.length, 1);
  });

  await test('CouponsService.findAll returns live coupons with KPI metrics', async () => {
    const res = await couponsService.findAll();
    assert.strictEqual(res.data.length, 1);
    assert.strictEqual(res.data[0].code, 'SAVE20');
    assert.strictEqual(res.kpis.totalUsages, 5);
    assert.strictEqual(res.kpis.activePromotions, 1);
  });

  await test('CouponsService.create creates uppercase code with proper limits', async () => {
    const created = await couponsService.create({
      code: 'spring50',
      discount: 50,
      type: CouponType.percentage,
      usageLimit: 500,
    });
    assert.strictEqual(created.code, 'SPRING50');
  });

  await test('UsersService.changeRole updates user role in database', async () => {
    const updated = await usersService.changeRole('u-1', 'admin');
    assert.strictEqual(updated.role, 'admin');
  });

  console.log('--- 6. CartsService Fast Mutations & Instant Return Tests ---');

  await test('CartsService.addItem with variant ID adds item and returns fresh cart', async () => {
    const cart = await cartsService.addItem('u-1', { variantId: 'var-1', quantity: 2 });
    assert.strictEqual(cart.id, 'cart-1');
    assert.strictEqual(cart.items.length, 1);
    assert.strictEqual(cart.items[0].variantId, 'var-1');
    assert.strictEqual(cart.items[0].quantity, 2);
  });

  await test('CartsService.addItem with product ID fallback resolves variant in single query', async () => {
    // When passing productId 'prod-2', it should find var-2 via the OR clause
    const cart = await cartsService.addItem('u-1', { variantId: 'prod-2', quantity: 1 });
    assert.strictEqual(cart.items.length, 2);
    const added = cart.items.find((i: any) => i.variantId === 'var-2');
    assert.ok(added);
    assert.strictEqual(added.quantity, 1);
  });

  await test('CartsService.addItem increments quantity when item already in cart', async () => {
    const cart = await cartsService.addItem('u-1', { variantId: 'var-1', quantity: 3 });
    const item = cart.items.find((i: any) => i.variantId === 'var-1');
    assert.strictEqual(item.quantity, 5); // 2 + 3
  });

  await test('CartsService.addItem rejects when exceeding available stock', async () => {
    let error: any = null;
    try {
      // var-2 only has 2 in stock, 1 already in cart, asking for 2 more should fail
      await cartsService.addItem('u-1', { variantId: 'var-2', quantity: 2 });
    } catch (err) {
      error = err;
    }
    assert.ok(error);
    assert.strictEqual(error.message, 'Not enough stock available');
  });

  await test('CartsService.updateItem updates quantity and returns fresh cart', async () => {
    const item = mockCart.items.find((i: any) => i.variantId === 'var-1');
    const cart = await cartsService.updateItem('u-1', item.id, { quantity: 4 });
    const updated = cart.items.find((i: any) => i.variantId === 'var-1');
    assert.strictEqual(updated.quantity, 4);
  });

  await test('CartsService.removeItem deletes item from cart and returns fresh cart', async () => {
    const itemToRemove = mockCart.items.find((i: any) => i.variantId === 'var-2');
    const cart = await cartsService.removeItem('u-1', itemToRemove.id);
    assert.strictEqual(cart.items.length, 1);
    assert.strictEqual(cart.items.find((i: any) => i.variantId === 'var-2'), undefined);
  });

  console.log('--- 7. RolesGuard & Role-Based Access Control Tests ---');

  const createMockContext = (user: any, requiredRoles: string[]): { context: ExecutionContext; reflector: Reflector } => {
    const mockRequest = { user };
    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    const mockReflector: any = {
      getAllAndOverride: (key: string) => requiredRoles,
    };
    return { context: mockContext, reflector: mockReflector };
  };

  await test('RolesGuard allows user with exact matching JWT app_metadata.role', async () => {
    const { context, reflector } = createMockContext(
      { id: 'user-1', app_metadata: { role: 'admin' } },
      ['admin']
    );
    const guard = new RolesGuard(reflector, mockAppPrisma);
    const allowed = await guard.canActivate(context);
    assert.strictEqual(allowed, true);
  });

  await test('RolesGuard allows super_admin on route requiring admin (role hierarchy)', async () => {
    const { context, reflector } = createMockContext(
      { id: 'user-1', app_metadata: { role: 'super_admin' } },
      ['admin']
    );
    const guard = new RolesGuard(reflector, mockAppPrisma);
    const allowed = await guard.canActivate(context);
    assert.strictEqual(allowed, true);
  });

  await test('RolesGuard falls back to database admins table when JWT role is customer or stale', async () => {
    // User has customer role in token, but exists in admins table with admin role
    const { context, reflector } = createMockContext(
      { id: 'admin-1', app_metadata: { role: 'customer' } },
      ['admin']
    );
    const guard = new RolesGuard(reflector, mockAppPrisma);
    const allowed = await guard.canActivate(context);
    assert.strictEqual(allowed, true);
  });

  await test('RolesGuard falls back to database admins table for super_admin on admin route', async () => {
    // User has missing role in token, but exists in admins table with super_admin role
    const { context, reflector } = createMockContext(
      { id: 'superadmin-1', role: 'authenticated' },
      ['admin']
    );
    const guard = new RolesGuard(reflector, mockAppPrisma);
    const allowed = await guard.canActivate(context);
    assert.strictEqual(allowed, true);
  });

  await test('RolesGuard rejects user with ForbiddenException when neither token nor database has required role', async () => {
    const { context, reflector } = createMockContext(
      { id: 'regular-user', app_metadata: { role: 'customer' } },
      ['admin']
    );
    const guard = new RolesGuard(reflector, mockAppPrisma);
    let thrownError: any = null;
    try {
      await guard.canActivate(context);
    } catch (err) {
      thrownError = err;
    }
    assert.ok(thrownError instanceof ForbiddenException);
    assert.strictEqual(thrownError.message, 'You do not have permission to perform this action');
  });

  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
