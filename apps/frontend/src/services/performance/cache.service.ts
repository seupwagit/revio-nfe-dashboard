/**
 * Cache Service
 * 
 * Intelligent caching with TTL-based expiration and LRU eviction strategy.
 * Prevents unnecessary network requests by storing frequently accessed data.
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 * Properties: 12 (Cache Storage with TTL), 13 (Cache Expiration and Refresh), 14 (Cache Size Limiting with LRU Eviction)
 */

import { PERFORMANCE_CONSTANTS } from '@fiscal/shared/constants/performance';
import type {
    CacheConfig,
    CacheEntry,
    CacheMetrics,
    CacheOptions
} from '@fiscal/shared/types/performance';

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private accessOrder: string[] = []; // For LRU tracking
  private config: CacheConfig;
  private metrics: CacheMetrics;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: config?.maxSize ?? PERFORMANCE_CONSTANTS.MAX_CACHE_SIZE,
      defaultTTL: config?.defaultTTL ?? PERFORMANCE_CONSTANTS.DEFAULT_CACHE_TTL_MS,
      evictionStrategy: config?.evictionStrategy ?? 'lru'
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      currentSize: 0,
      maxSize: this.config.maxSize,
      hitRate: 0
    };

    // Periodic cleanup of expired entries
    this.startPeriodicCleanup();
  }

  /**
   * Get data from cache
   * Returns null if key doesn't exist or has expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access tracking for LRU
    this.updateAccessTracking(key, entry);
    
    this.metrics.hits++;
    this.updateHitRate();
    
    return entry.data as T;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.config.defaultTTL;
    const now = Date.now();
    
    // Handle zero TTL - should expire immediately
    if (ttl <= 0) {
      return; // Don't store entries that expire immediately
    }
    
    // Calculate data size (rough estimation)
    const dataSize = this.estimateSize(data);

    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: now,
      expiresAt: now + ttl,
      accessCount: 1,
      lastAccessAt: now,
      size: dataSize
    };

    // Clean up expired entries first
    this.cleanup();

    // Check if we need to make space
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictEntries(1);
    }

    // Remove from access order if updating existing entry
    if (this.cache.has(key)) {
      this.removeFromAccessOrder(key);
    } else {
      this.metrics.currentSize++;
    }

    this.cache.set(key, entry);
    this.addToAccessOrder(key);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.has(key);
    
    if (existed) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.metrics.currentSize--;
    }

    return existed;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.metrics.currentSize = 0;
    this.metrics.evictions = 0;
  }

  /**
   * Check if key exists in cache (and is not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get current cache size (number of entries)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get all cache keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.metrics.maxSize = this.config.maxSize;

    // If max size was reduced, evict excess entries
    if (this.cache.size > this.config.maxSize) {
      const excessCount = this.cache.size - this.config.maxSize;
      this.evictEntries(excessCount);
    }
  }

  /**
   * Force cleanup of expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Update access tracking for LRU strategy
   */
  private updateAccessTracking(key: string, entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccessAt = Date.now();

    // Move to end of access order (most recently used)
    this.removeFromAccessOrder(key);
    this.addToAccessOrder(key);
  }

  /**
   * Add key to end of access order
   */
  private addToAccessOrder(key: string): void {
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(count: number): void {
    let evicted = 0;

    // First, try to evict expired entries
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (evicted >= count) break;
      
      if (now > entry.expiresAt) {
        this.delete(key);
        evicted++;
        this.metrics.evictions++;
      }
    }

    // If we still need to evict more, use LRU strategy
    while (evicted < count && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0]; // Least recently used
      this.delete(lruKey);
      evicted++;
      this.metrics.evictions++;
    }
  }

  /**
   * Estimate size of data (rough calculation)
   */
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default size if can't stringify
    }
  }

  /**
   * Update hit rate metric
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startPeriodicCleanup(): void {
    const cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute

    // Store interval reference for testing
    (this as any)._cleanupInterval = cleanupInterval;
  }

  /**
   * Stop periodic cleanup (for testing)
   */
  stopPeriodicCleanup(): void {
    if ((this as any)._cleanupInterval) {
      clearInterval((this as any)._cleanupInterval);
      (this as any)._cleanupInterval = null;
    }
  }
}

/**
 * Singleton instance for global use
 */
export const cacheService = new CacheService();

/**
 * Cache decorator for methods
 */
export function Cached(ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      cacheService.set(cacheKey, result, { ttl });
      
      return result;
    };

    return descriptor;
  };
}