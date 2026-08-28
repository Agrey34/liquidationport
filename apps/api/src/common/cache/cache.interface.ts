export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  keyCount: number;
}

export interface CacheSetOptions {
  /** Time to live in seconds */
  ttlSeconds?: number;
}

export interface ICacheService {
  /**
   * Retrieve an item from the cache.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set an item in the cache with optional TTL.
   */
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;

  /**
   * Delete an item from the cache by exact key.
   */
  del(key: string): Promise<boolean>;

  /**
   * Delete all items matching a prefix/pattern.
   */
  delByPattern(pattern: string): Promise<number>;

  /**
   * Single-flight stampede-protected cache lookup.
   * If key is absent, executes factory exactly once for concurrent callers and caches the result.
   */
  getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheSetOptions): Promise<T>;

  /**
   * Generate a canonical, deterministic cache key with tenant boundary.
   */
  generateKey(namespace: string, params?: Record<string, unknown>, tenantId?: string): string;

  /**
   * Retrieve current runtime cache metrics for observability.
   */
  getMetrics(): CacheMetrics;

  /**
   * Clear all items in the cache.
   */
  reset(): Promise<void>;
}

export const CACHE_SERVICE = Symbol('ICacheService');
