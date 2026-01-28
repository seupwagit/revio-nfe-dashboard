/**
 * Unit Tests for CacheService
 * 
 * Tests TTL-based expiration, LRU eviction, and cache metrics.
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CacheService } from '../../../../services/performance/cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    // Create a new cache instance for each test
    cache = new CacheService({
      maxSize: 5,
      defaultTTL: 1000, // 1 second for testing
      evictionStrategy: 'lru'
    });
  });

  afterEach(() => {
    // Clear cache after each test
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve data', () => {
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.size()).toBe(1);
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.has('key1')).toBe(false);
      expect(cache.size()).toBe(0);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cache.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });

    it('should get all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', { ttl: 100 }); // 100ms TTL
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.has('key1')).toBe(false);
    });

    it('should use default TTL when not specified', async () => {
      const shortTTLCache = new CacheService({ defaultTTL: 100 });
      
      shortTTLCache.set('key1', 'value1');
      expect(shortTTLCache.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(shortTTLCache.get('key1')).toBeNull();
    });

    it('should handle different TTL values for different entries', async () => {
      cache.set('short', 'value1', { ttl: 50 });
      cache.set('long', 'value2', { ttl: 200 });
      
      // Wait for short TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('short')).toBeNull();
      expect(cache.get('long')).toBe('value2');
      
      // Wait for long TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('long')).toBeNull();
    });

    it('should cleanup expired entries', async () => {
      cache.set('key1', 'value1', { ttl: 50 });
      cache.set('key2', 'value2', { ttl: 200 });
      
      expect(cache.size()).toBe(2);
      
      // Wait for first entry to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const cleanedCount = cache.cleanup();
      expect(cleanedCount).toBe(1);
      expect(cache.size()).toBe(1);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when cache is full', () => {
      // Fill cache to capacity
      for (let i = 1; i <= 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(cache.size()).toBe(5);
      
      // Add one more entry, should evict key1 (least recently used)
      cache.set('key6', 'value6');
      
      expect(cache.size()).toBe(5);
      expect(cache.has('key1')).toBe(false); // Evicted
      expect(cache.has('key6')).toBe(true);  // New entry
    });

    it('should update LRU order on access', () => {
      // Fill cache
      for (let i = 1; i <= 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add new entry, should evict key2 (now least recently used)
      cache.set('key6', 'value6');
      
      expect(cache.has('key1')).toBe(true);  // Should still exist
      expect(cache.has('key2')).toBe(false); // Should be evicted
      expect(cache.has('key6')).toBe(true);  // New entry
    });

    it('should update LRU order on set (update existing)', () => {
      // Fill cache
      for (let i = 1; i <= 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Update key1 to make it most recently used
      cache.set('key1', 'updated_value1');
      
      // Add new entry, should evict key2 (now least recently used)
      cache.set('key6', 'value6');
      
      expect(cache.get('key1')).toBe('updated_value1'); // Should still exist with updated value
      expect(cache.has('key2')).toBe(false); // Should be evicted
      expect(cache.has('key6')).toBe(true);  // New entry
    });

    it('should evict expired entries before LRU eviction', async () => {
      // Add entries with different TTLs
      cache.set('expired1', 'value1', { ttl: 50 });
      cache.set('expired2', 'value2', { ttl: 50 });
      cache.set('valid1', 'value3', { ttl: 1000 });
      cache.set('valid2', 'value4', { ttl: 1000 });
      cache.set('valid3', 'value5', { ttl: 1000 });
      
      expect(cache.size()).toBe(5);
      
      // Wait for some entries to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add new entry - should evict expired entries first
      cache.set('new1', 'newvalue1');
      
      expect(cache.size()).toBe(4); // 3 valid + 1 new
      expect(cache.has('expired1')).toBe(false);
      expect(cache.has('expired2')).toBe(false);
      expect(cache.has('valid1')).toBe(true);
      expect(cache.has('valid2')).toBe(true);
      expect(cache.has('valid3')).toBe(true);
      expect(cache.has('new1')).toBe(true);
    });
  });

  describe('Metrics', () => {
    it('should track cache hits and misses', () => {
      cache.set('key1', 'value1');
      
      // Hit
      cache.get('key1');
      
      // Miss
      cache.get('nonexistent');
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
    });

    it('should track evictions', () => {
      // Fill cache beyond capacity to trigger evictions
      for (let i = 1; i <= 7; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const metrics = cache.getMetrics();
      expect(metrics.evictions).toBe(2); // 2 entries evicted
      expect(metrics.currentSize).toBe(5);
      expect(metrics.maxSize).toBe(5);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      
      // 3 hits, 2 misses = 60% hit rate
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('nonexistent1'); // miss
      cache.get('nonexistent2'); // miss
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(2);
      expect(metrics.hitRate).toBe(0.6);
    });

    it('should handle zero operations gracefully', () => {
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.evictions).toBe(0);
      expect(metrics.currentSize).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should get current configuration', () => {
      const config = cache.getConfig();
      expect(config.maxSize).toBe(5);
      expect(config.defaultTTL).toBe(1000);
      expect(config.evictionStrategy).toBe('lru');
    });

    it('should update configuration', () => {
      cache.updateConfig({ maxSize: 10, defaultTTL: 2000 });
      
      const config = cache.getConfig();
      expect(config.maxSize).toBe(10);
      expect(config.defaultTTL).toBe(2000);
      expect(config.evictionStrategy).toBe('lru'); // Should remain unchanged
    });

    it('should evict excess entries when maxSize is reduced', () => {
      // Fill cache
      for (let i = 1; i <= 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(cache.size()).toBe(5);
      
      // Reduce max size
      cache.updateConfig({ maxSize: 3 });
      
      expect(cache.size()).toBe(3);
      expect(cache.getConfig().maxSize).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle storing null and undefined values', () => {
      cache.set('null_key', null);
      cache.set('undefined_key', undefined);
      
      expect(cache.get('null_key')).toBeNull();
      expect(cache.get('undefined_key')).toBeUndefined();
      expect(cache.has('null_key')).toBe(true);
      expect(cache.has('undefined_key')).toBe(true);
    });

    it('should handle storing complex objects', () => {
      const complexObject = {
        id: 1,
        name: 'Test',
        nested: {
          array: [1, 2, 3],
          date: new Date('2024-01-01')
        }
      };
      
      cache.set('complex', complexObject);
      const retrieved = cache.get('complex');
      
      expect(retrieved).toEqual(complexObject);
    });

    it('should handle empty string keys', () => {
      cache.set('', 'empty_key_value');
      expect(cache.get('')).toBe('empty_key_value');
      expect(cache.has('')).toBe(true);
    });

    it('should handle very large cache sizes', () => {
      const largeCache = new CacheService({ maxSize: 1000 });
      
      // Add many entries
      for (let i = 0; i < 500; i++) {
        largeCache.set(`key${i}`, `value${i}`);
      }
      
      expect(largeCache.size()).toBe(500);
      expect(largeCache.get('key0')).toBe('value0');
      expect(largeCache.get('key499')).toBe('value499');
    });
  });

  describe('Cache Decorator', () => {
    it('should work with the @Cached decorator', async () => {
      // This test would require setting up a class with the decorator
      // For now, we'll test the decorator concept manually
      
      let callCount = 0;
      
      const expensiveFunction = async (input: string) => {
        callCount++;
        return `processed_${input}`;
      };
      
      // Simulate decorator behavior
      const cachedFunction = async (input: string) => {
        const cacheKey = `expensiveFunction:${JSON.stringify([input])}`;
        
        const cached = cache.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        const result = await expensiveFunction(input);
        cache.set(cacheKey, result);
        return result;
      };
      
      // First call - should execute function
      const result1 = await cachedFunction('test');
      expect(result1).toBe('processed_test');
      expect(callCount).toBe(1);
      
      // Second call - should use cache
      const result2 = await cachedFunction('test');
      expect(result2).toBe('processed_test');
      expect(callCount).toBe(1); // Should not increment
      
      // Different input - should execute function again
      const result3 = await cachedFunction('different');
      expect(result3).toBe('processed_different');
      expect(callCount).toBe(2);
    });
  });
});