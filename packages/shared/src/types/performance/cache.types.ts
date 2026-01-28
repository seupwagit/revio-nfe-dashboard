/**
 * Cache Types for Input Performance Optimization
 * 
 * Defines types for intelligent caching with TTL and LRU eviction.
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  evictionStrategy: 'lru' | 'fifo' | 'lfu';
}

export interface CacheEntry<T> {
  key: string;
  data: T;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessAt: number;
  size: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  maxSize: number;
  hitRate: number;
}

export interface CacheOptions {
  ttl?: number;
  priority?: number;
}

export type CacheEvictionStrategy = 'lru' | 'fifo' | 'lfu';
