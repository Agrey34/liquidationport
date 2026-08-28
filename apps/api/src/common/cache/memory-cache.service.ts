import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { ICacheService, CacheMetrics, CacheSetOptions } from './cache.interface';

export const MEMORY_CACHE_OPTIONS = 'MEMORY_CACHE_OPTIONS';

export interface MemoryCacheOptions {
  maxEntries?: number;
  defaultTtlSeconds?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null; // null means no expiration
}

@Injectable()
export class MemoryCacheService implements ICacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlightPromises = new Map<string, Promise<unknown>>();
  private readonly maxEntries: number;
  private readonly defaultTtlSeconds: number;

  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(
    @Optional()
    @Inject(MEMORY_CACHE_OPTIONS)
    options?: MemoryCacheOptions,
  ) {
    this.maxEntries = options?.maxEntries ?? 2000;
    this.defaultTtlSeconds = options?.defaultTtlSeconds ?? 300; // 5 minutes default
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // Refresh LRU order on access
    this.store.delete(key);
    this.store.set(key, entry);

    this.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const ttl = options?.ttlSeconds ?? this.defaultTtlSeconds;
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;

    // Enforce max capacity with LRU eviction
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOldest();
    }

    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (this.store.delete(key)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheSetOptions): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if an in-flight promise already exists for this exact key (Stampede Protection)
    const existingPromise = this.inFlightPromises.get(key);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    // Create a new single-flight promise
    const promise = (async () => {
      try {
        const freshValue = await factory();
        await this.set(key, freshValue, options);
        return freshValue;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, promise);
    return promise;
  }

  generateKey(namespace: string, params?: Record<string, unknown>, tenantId = 'default'): string {
    const tenantPrefix = `tenant:${tenantId}`;
    if (!params || Object.keys(params).length === 0) {
      return `${tenantPrefix}:${namespace}:all`;
    }

    const canonicalParams = this.canonicalizeObject(params);
    return `${tenantPrefix}:${namespace}:${JSON.stringify(canonicalParams)}`;
  }

  getMetrics(): CacheMetrics {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      keyCount: this.store.size,
    };
  }

  async reset(): Promise<void> {
    this.store.clear();
    this.inFlightPromises.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  private evictOldest(): void {
    const firstKey = this.store.keys().next().value;
    if (firstKey) {
      this.store.delete(firstKey);
      this.evictions++;
    }
  }

  private canonicalizeObject(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.canonicalizeObject(item));
    }

    const sortedObj: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();

    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key];
      if (val !== undefined) {
        sortedObj[key] = this.canonicalizeObject(val);
      }
    }

    return sortedObj;
  }
}
