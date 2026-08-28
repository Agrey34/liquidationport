import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { ProductsService } from '../src/modules/products/products.service';
import { PrismaService } from '../src/database/prisma.service';
import { MemoryCacheService } from '../src/common/cache/memory-cache.service';
import { SortByEnum } from '../src/modules/products/dto/product-query.dto';

describe('ProductsService (Production Hardening)', () => {
  let service: ProductsService;
  let prisma: Partial<PrismaService>;
  let cache: MemoryCacheService;
  let transactionCallCount = 0;
  let findFirstCallCount = 0;

  beforeEach(() => {
    cache = new MemoryCacheService({ maxEntries: 100, defaultTtlSeconds: 300 });
    transactionCallCount = 0;
    findFirstCallCount = 0;

    prisma = {
      $transaction: (async (promises: any[]) => {
        transactionCallCount++;
        return [
          [
            { id: '1', name: 'Pallet A', slug: 'pallet-a', price: 500, stock: 10, category: null, variants: [], media: [] },
            { id: '2', name: 'Pallet B', slug: 'pallet-b', price: 800, stock: 5, category: null, variants: [], media: [] },
          ],
          2,
        ];
      }) as any,
      product: {
        findMany: (async () => []) as any,
        count: (async () => 2) as any,
        findFirst: (async () => {
          findFirstCallCount++;
          return {
            id: '5a829da4-c7f3-4744-b606-64cfaf262249',
            name: 'Amazon Electronics Pallet',
            slug: 'amazon-electronics-pallet',
            price: 1200,
            stock: 4,
            category: { name: 'Electronics' },
            variants: [],
            media: [],
          };
        }) as any,
        create: (async () => ({
          id: 'new-id',
          name: 'Target Pallet',
          slug: 'target-pallet',
          price: 600,
          stock: 3,
        })) as any,
        update: (async () => ({
          id: '5a829da4-c7f3-4744-b606-64cfaf262249',
          name: 'Amazon Electronics Pallet Updated',
          slug: 'amazon-electronics-pallet',
          price: 1300,
          stock: 4,
        })) as any,
      } as any,
    };

    service = new ProductsService(prisma as PrismaService, cache);
  });

  afterEach(async () => {
    await cache.reset();
  });

  it('should clamp pagination limits to a maximum of 100 records', async () => {
    const result = await service.findAll({ page: 1, limit: 10000 });
    assert.strictEqual(result.limit, 100);
  });

  it('should cache findAll responses and avoid duplicate DB transactions on subsequent calls', async () => {
    const query = { page: 1, limit: 10, sortBy: SortByEnum.PRICE_ASC };

    // First call: executes DB query
    const res1 = await service.findAll(query);
    assert.strictEqual(transactionCallCount, 1);

    // Second call: served from cache
    const res2 = await service.findAll(query);
    assert.strictEqual(transactionCallCount, 1);
    assert.deepStrictEqual(res2, res1);

    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.hits, 1);
  });

  it('should cache findOneBySlug queries and return cached instance', async () => {
    const slug = 'amazon-electronics-pallet';

    // First call: DB query
    const item1 = await service.findOneBySlug(slug);
    assert.strictEqual(findFirstCallCount, 1);

    // Second call: Cache hit
    const item2 = await service.findOneBySlug(slug);
    assert.strictEqual(findFirstCallCount, 1);
    assert.deepStrictEqual(item2, item1);

    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.hits, 1);
  });

  it('should invalidate product cache strictly after successful update', async () => {
    // Populate cache
    await service.findAll({ page: 1, limit: 10 });
    assert.ok(cache.getMetrics().keyCount > 0);

    // Update product
    await service.update('5a829da4-c7f3-4744-b606-64cfaf262249', { name: 'Updated Name' });

    // Cache should be purged
    assert.strictEqual(cache.getMetrics().keyCount, 0);
  });
});
