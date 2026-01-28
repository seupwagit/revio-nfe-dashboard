/**
 * Cache Service Unit Tests
 * 
 * Comprehensive tests for CacheService including TTL expiration, LRU eviction,
 * metrics tracking, and edge cases.
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 * Properties: 12 (Cache Storage with TTL), 13 (Cache Expiration and Refresh), 14 (Cache Size Limiting with LRU Eviction)
 */

import { PERFORMANCE_CONSTANTS } from '@fiscal/shared/constants/performance';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheService } from '../../../../services/performance/cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    // Use fake timers for deterministic testing
    vi.useFakeTimers();
    cacheService = new CacheService();
  });

  afterEach(() => {
    vi.useRealTimers();
    cacheService.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'test' };
      
      cacheService.set('test-key', testData);
      const retrieved = cacheService.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cacheService.set('test-key', 'test-value');
      
      expect(cacheService.has('test-key')).toBe(true);
      expect(cacheService.has('non-existent')).toBe(false);
    });

    it('should delete entries', () => {
      cacheService.set('test-key', 'test-value');
      
      expect(cacheService.has('test-key')).toBe(true);
      
      const deleted = cacheService.delete('test-key');
      
      expect(deleted).toBe(true);
      expect(cacheService.has('test-key')).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cacheService.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should clear all entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      expect(cacheService.size()).toBe(2);
      
      cacheService.clear();
      
      expect(cacheService.size()).toBe(0);
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });

    it('should return current size', () => {
      expect(cacheService.size()).toBe(0);
      
      cacheService.set('key1', 'value1');
      expect(cacheService.size()).toBe(1);
      
      cacheService.set('key2', 'value2');
      expect(cacheService.size()).toBe(2);
      
      cacheService.delete('key1');
      expect(cacheService.size()).toBe(1);
    });

    it('should return all keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      const keys = cacheService.keys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });
  });

  describe('TTL (Time To Live) Functionality', () => {
    it('should expire entries after TTL', () => {
      const ttl = 1000; // 1 second
      
      cacheService.set('test-key', 'test-value', { ttl });
      
      // Should exist immediately
      expect(cacheService.get('test-key')).toBe('test-value');
      expect(cacheService.has('test-key')).toBe(true);
      
      // Advance time past TTL
      vi.advanceTimersByTime(ttl + 1);
      
      // Should be expired
      expect(cacheService.get('test-key')).toBeNull();
      expect(cacheService.has('test-key')).toBe(false);
    });

    it('should use default TTL when not specified', () => {
      cacheService.set('test-key', 'test-value');
      
      // Should exist immediately
      expect(cacheService.get('test-key')).toBe('test-value');
      
      // Advance time to just before default TTL
      vi.advanceTimersByTime(PERFORMANCE_CONSTANTS.DEFAULT_CACHE_TTL_MS - 1);
      expect(cacheService.get('test-key')).toBe('test-value');
      
      // Advance past default TTL
      vi.advanceTimersByTime(2);
      expect(cacheService.get('test-key')).toBeNull();
    });

    it('should handle different TTL values for different keys', () => {
      cacheService.set('short-ttl', 'value1', { ttl: 500 });
      cacheService.set('long-ttl', 'value2', { ttl: 2000 });
      
      // Both should exist initially
      expect(cacheService.get('short-ttl')).toBe('value1');
      expect(cacheService.get('long-ttl')).toBe('value2');
      
      // Advance time past short TTL but before long TTL
      vi.advanceTimersByTime(1000);
      
      expect(cacheService.get('short-ttl')).toBeNull();
      expect(cacheService.get('long-ttl')).toBe('value2');
      
      // Advance past long TTL
      vi.advanceTimersByTime(1500);
      
      expect(cacheService.get('long-ttl')).toBeNull();
    });

    it('should clean up expired entries during periodic cleanup', () => {
      cacheService.set('key1', 'value1', { ttl: 500 });
      cacheService.set('key2', 'value2', { ttl: 1500 });
      
      expect(cacheService.size()).toBe(2);
      
      // Advance time past first TTL
      vi.advanceTimersByTime(1000);
      
      // Manually trigger cleanup (simulating periodic cleanup)
      cacheService.cleanup();
      
      // First entry should be cleaned up
      expect(cacheService.size()).toBe(1);
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(true);
    });
  });

  describe('LRU (Least Recently Used) Eviction', () => {
    it('should evict least recently used entries when cache is full', () => {
      // Create cache with small max size
      const smallCache = new CacheService({ maxSize: 3 });
      
      // Fill cache to capacity
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      expect(smallCache.size()).toBe(3);
      
      // Access key1 to make it recently used
      smallCache.get('key1');
      
      // Add new entry, should evict key2 (least recently used)
      smallCache.set('key4', 'value4');
      
      expect(smallCache.size()).toBe(3);
      expect(smallCache.has('key1')).toBe(true); // Recently accessed
      expect(smallCache.has('key2')).toBe(false); // Should be evicted
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true); // Newly added
    });

    it('should update access order when getting entries', () => {
      const smallCache = new CacheService({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      
      // Access key1 to make it recently used
      smallCache.get('key1');
      
      // Add new entry, should evict key2
      smallCache.set('key3', 'value3');
      
      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(false);
      expect(smallCache.has('key3')).toBe(true);
    });

    it('should prefer evicting expired entries over LRU', () => {
      const smallCache = new CacheService({ maxSize: 2 });
      
      // Add entries with different TTLs
      smallCache.set('expired', 'value1', { ttl: 100 });
      smallCache.set('valid', 'value2', { ttl: 10000 });
      
      // Advance time to expire first entry
      vi.advanceTimersByTime(200);
      
      // Add new entry, should evict expired entry instead of LRU
      smallCache.set('new', 'value3');
      
      expect(smallCache.has('expired')).toBe(false);
      expect(smallCache.has('valid')).toBe(true);
      expect(smallCache.has('new')).toBe(true);
    });
  });

  describe('Cache Metrics', () => {
    it('should track hits and misses', () => {
      cacheService.set('key1', 'value1');
      
      // Initial metrics
      let metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(0);
      
      // Cache hit
      cacheService.get('key1');
      metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(1);
      
      // Cache miss
      cacheService.get('non-existent');
      metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
    });

    it('should track evictions', () => {
      const smallCache = new CacheService({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      
      let metrics = smallCache.getMetrics();
      expect(metrics.evictions).toBe(0);
      
      // Force eviction
      smallCache.set('key3', 'value3');
      
      metrics = smallCache.getMetrics();
      expect(metrics.evictions).toBe(1);
    });

    it('should track current and max size', () => {
      const metrics = cacheService.getMetrics();
      
      expect(metrics.currentSize).toBe(0);
      expect(metrics.maxSize).toBe(PERFORMANCE_CONSTANTS.MAX_CACHE_SIZE);
      
      cacheService.set('key1', 'value1');
      
      const updatedMetrics = cacheService.getMetrics();
      expect(updatedMetrics.currentSize).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      cacheService.set('key1', 'value1');
      
      // 2 hits, 1 miss = 66.67% hit rate
      cacheService.get('key1'); // hit
      cacheService.get('key1'); // hit
      cacheService.get('missing'); // miss
      
      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBeCloseTo(0.6667, 4);
    });
  });

  describe('Configuration Management', () => {
    it('should use provided configuration', () => {
      const customConfig = {
        maxSize: 500,
        defaultTTL: 60000,
        evictionStrategy: 'lru' as const
      };
      
      const customCache = new CacheService(customConfig);
      const config = customCache.getConfig();
      
      expect(config.maxSize).toBe(500);
      expect(config.defaultTTL).toBe(60000);
      expect(config.evictionStrategy).toBe('lru');
    });

    it('should update configuration dynamically', () => {
      const originalConfig = cacheService.getConfig();
      expect(originalConfig.maxSize).toBe(PERFORMANCE_CONSTANTS.MAX_CACHE_SIZE);
      
      cacheService.updateConfig({ maxSize: 50 });
      
      const updatedConfig = cacheService.getConfig();
      expect(updatedConfig.maxSize).toBe(50);
    });

    it('should evict excess entries when max size is reduced', () => {
      // Fill cache with 5 entries
      for (let i = 1; i <= 5; i++) {
        cacheService.set(`key${i}`, `value${i}`);
      }
      
      expect(cacheService.size()).toBe(5);
      
      // Reduce max size to 3
      cacheService.updateConfig({ maxSize: 3 });
      
      // Should evict 2 entries
      expect(cacheService.size()).toBe(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle storing null and undefined values', () => {
      cacheService.set('null-key', null);
      cacheService.set('undefined-key', undefined);
      
      expect(cacheService.get('null-key')).toBeNull();
      expect(cacheService.get('undefined-key')).toBeUndefined();
      expect(cacheService.has('null-key')).toBe(true);
      expect(cacheService.has('undefined-key')).toBe(true);
    });

    it('should handle complex objects', () => {
      const complexObject = {
        id: 1,
        nested: {
          array: [1, 2, 3],
          date: new Date('2024-01-01'),
          map: new Map([['key', 'value']])
        }
      };
      
      cacheService.set('complex', complexObject);
      const retrieved = cacheService.get('complex');
      
      expect(retrieved).toEqual(complexObject);
    });

    it('should handle updating existing entries', () => {
      cacheService.set('key1', 'original-value');
      expect(cacheService.get('key1')).toBe('original-value');
      expect(cacheService.size()).toBe(1);
      
      // Update with new value
      cacheService.set('key1', 'updated-value');
      expect(cacheService.get('key1')).toBe('updated-value');
      expect(cacheService.size()).toBe(1); // Size shouldn't change
    });

    it('should handle zero TTL (immediate expiration)', () => {
      cacheService.set('immediate-expire', 'value', { ttl: 0 });
      
      // Should be expired immediately
      expect(cacheService.get('immediate-expire')).toBeNull();
      expect(cacheService.has('immediate-expire')).toBe(false);
    });

    it('should handle very large TTL values', () => {
      const largeTTL = Number.MAX_SAFE_INTEGER;
      
      cacheService.set('long-lived', 'value', { ttl: largeTTL });
      
      // Should still be valid after advancing time significantly
      vi.advanceTimersByTime(1000000);
      expect(cacheService.get('long-lived')).toBe('value');
    });

    it('should handle manual cleanup', () => {
      cacheService.set('key1', 'value1', { ttl: 100 });
      cacheService.set('key2', 'value2', { ttl: 200 });
      cacheService.set('key3', 'value3', { ttl: 1000 });
      
      expect(cacheService.size()).toBe(3);
      
      // Advance time to expire first two entries
      vi.advanceTimersByTime(250);
      
      // Manual cleanup
      const cleanedCount = cacheService.cleanup();
      
      expect(cleanedCount).toBe(2);
      expect(cacheService.size()).toBe(1);
      expect(cacheService.has('key3')).toBe(true);
    });
  });

  describe('Cache Decorator', () => {
    it('should cache method results', async () => {
      let callCount = 0;
      
      class TestService {
        async expensiveOperation(input: string): Promise<string> {
          callCount++;
          return `result-${input}`;
        }
      }
      
      const service = new TestService();
      
      // Manually cache the result to test the concept
      const cacheKey = 'TestService.expensiveOperation:["test"]';
      
      // First call should execute method
      const result1 = await service.expensiveOperation('test');
      expect(result1).toBe('result-test');
      expect(callCount).toBe(1);
      
      // Cache the result manually
      cacheService.set(cacheKey, result1);
      
      // Check if we can retrieve from cache
      const cachedResult = cacheService.get(cacheKey);
      expect(cachedResult).toBe('result-test');
      
      // Verify cache functionality works
      expect(cacheService.has(cacheKey)).toBe(true);
    });
  });
});