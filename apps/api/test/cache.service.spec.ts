import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { MemoryCacheService } from '../src/common/cache/memory-cache.service';

describe('MemoryCacheService (Production Cache Hardening)', () => {
  let cache: MemoryCacheService;

  beforeEach(() => {
    cache = new MemoryCacheService({ maxEntries: 3, defaultTtlSeconds: 1 });
  });

  afterEach(async () => {
    await cache.reset();
  });

  it('should store and retrieve values (cache hit & miss)', async () => {
    const key = 'test:key1';
    assert.strictEqual(await cache.get(key), null);

    await cache.set(key, { data: 'hello world' });
    const result = await cache.get<{ data: string }>(key);
    assert.deepStrictEqual(result, { data: 'hello world' });

    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.hits, 1);
    assert.strictEqual(metrics.misses, 1);
    assert.strictEqual(metrics.keyCount, 1);
  });

  it('should produce deterministic canonical cache keys regardless of parameter ordering', () => {
    const key1 = cache.generateKey('products:list', { page: 1, category: 'electronics', minPrice: 100 }, 'tenant-abc');
    const key2 = cache.generateKey('products:list', { minPrice: 100, category: 'electronics', page: 1 }, 'tenant-abc');

    assert.strictEqual(key1, key2);
    assert.ok(key1.includes('tenant:tenant-abc:products:list'));
  });

  it('should enforce multi-tenant isolation in cache keys', () => {
    const keyTenant1 = cache.generateKey('products:list', { page: 1 }, 'tenant-1');
    const keyTenant2 = cache.generateKey('products:list', { page: 1 }, 'tenant-2');

    assert.notStrictEqual(keyTenant1, keyTenant2);
    assert.ok(keyTenant1.includes('tenant:tenant-1'));
    assert.ok(keyTenant2.includes('tenant:tenant-2'));
  });

  it('should evict oldest entries when maxEntries is exceeded (LRU behavior)', async () => {
    await cache.set('k1', 'val1');
    await cache.set('k2', 'val2');
    await cache.set('k3', 'val3');

    // Access k1 so k2 becomes the oldest
    await cache.get('k1');

    // Adding 4th item should evict k2
    await cache.set('k4', 'val4');

    assert.strictEqual(await cache.get('k2'), null);
    assert.strictEqual(await cache.get('k1'), 'v1');
    assert.strictEqual(await cache.get('k3'), 'v3');
    assert.strictEqual(await cache.get('k4'), 'v4');

    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.evictions, 1);
  });

  it('should expire entries after TTL', async () => {
    await cache.set('expiring-key', 'data', { ttlSeconds: 0.05 }); // 50ms
    assert.strictEqual(await cache.get('expiring-key'), 'data');

    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.strictEqual(await cache.get('expiring-key'), null);
  });

  it('should prevent cache stampede using single-flight promise deduplication', async () => {
    let factoryExecutionCount = 0;
    const expensiveFactory = async () => {
      factoryExecutionCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { result: 'expensive-data' };
    };

    // Trigger 50 concurrent requests simultaneously for the same missing key
    const promises = Array.from({ length: 50 }, () =>
      cache.getOrSet('stampede-key', expensiveFactory, { ttlSeconds: 10 })
    );

    const results = await Promise.all(promises);

    assert.strictEqual(results.length, 50);
    assert.deepStrictEqual(results[0], { result: 'expensive-data' });
    // Factory MUST be executed exactly once despite 50 concurrent callers
    assert.strictEqual(factoryExecutionCount, 1);
  });

  it('should invalidate matching keys on delByPattern', async () => {
    await cache.set('products:list:1', 'p1');
    await cache.set('products:list:2', 'p2');
    await cache.set('products:detail:123', 'detail');

    const deleted = await cache.delByPattern('products:');
    assert.strictEqual(deleted, 3);
    assert.strictEqual(await cache.get('products:list:1'), null);
    assert.strictEqual(await cache.get('products:detail:123'), null);
  });
});
