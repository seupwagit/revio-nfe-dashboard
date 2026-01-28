/**
 * Request Deduplicator Unit Tests
 * 
 * Comprehensive tests for RequestDeduplicator including Promise sharing,
 * error propagation, metrics tracking, and advanced features.
 * 
 * Validates: Requirements 3.3
 * Properties: 6 (Request Deduplication)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestDeduplicator } from '../../../../services/performance/request-deduplicator.service';

describe('RequestDeduplicator', () => {
  let deduplicator: RequestDeduplicator;

  beforeEach(() => {
    deduplicator = new RequestDeduplicator();
  });

  describe('Basic Deduplication', () => {
    it('should execute request function for new key', async () => {
      let callCount = 0;
      const requestFn = vi.fn(async () => {
        callCount++;
        return `result-${callCount}`;
      });

      const result = await deduplicator.deduplicate('test-key', requestFn);

      expect(result).toBe('result-1');
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(callCount).toBe(1);
    });

    it('should share Promise for simultaneous identical requests', async () => {
      let callCount = 0;
      const requestFn = vi.fn(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return `result-${callCount}`;
      });

      // Start multiple simultaneous requests
      const promise1 = deduplicator.deduplicate('test-key', requestFn);
      const promise2 = deduplicator.deduplicate('test-key', requestFn);
      const promise3 = deduplicator.deduplicate('test-key', requestFn);

      // All should return the same result
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1).toBe('result-1');
      expect(result2).toBe('result-1');
      expect(result3).toBe('result-1');
      expect(requestFn).toHaveBeenCalledTimes(1); // Only called once
      expect(callCount).toBe(1);
    });

    it('should execute new request after previous completes', async () => {
      let callCount = 0;
      const requestFn = vi.fn(async () => {
        callCount++;
        return `result-${callCount}`;
      });

      // First request
      const result1 = await deduplicator.deduplicate('test-key', requestFn);
      expect(result1).toBe('result-1');

      // Second request (after first completes)
      const result2 = await deduplicator.deduplicate('test-key', requestFn);
      expect(result2).toBe('result-2');

      expect(requestFn).toHaveBeenCalledTimes(2);
      expect(callCount).toBe(2);
    });

    it('should handle different keys independently', async () => {
      let callCount = 0;
      const requestFn = vi.fn(async () => {
        callCount++;
        return `result-${callCount}`;
      });

      // Start requests with different keys simultaneously
      const promise1 = deduplicator.deduplicate('key1', requestFn);
      const promise2 = deduplicator.deduplicate('key2', requestFn);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('result-1');
      expect(result2).toBe('result-2');
      expect(requestFn).toHaveBeenCalledTimes(2);
      expect(callCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors to all waiting callers', async () => {
      const error = new Error('Request failed');
      const requestFn = vi.fn(async () => {
        throw error;
      });

      // Start multiple simultaneous requests
      const promise1 = deduplicator.deduplicate('test-key', requestFn);
      const promise2 = deduplicator.deduplicate('test-key', requestFn);
      const promise3 = deduplicator.deduplicate('test-key', requestFn);

      // All should reject with the same error
      await expect(promise1).rejects.toThrow('Request failed');
      await expect(promise2).rejects.toThrow('Request failed');
      await expect(promise3).rejects.toThrow('Request failed');

      expect(requestFn).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should allow new requests after error', async () => {
      let callCount = 0;
      const requestFn = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First request failed');
        }
        return `result-${callCount}`;
      });

      // First request should fail
      await expect(deduplicator.deduplicate('test-key', requestFn)).rejects.toThrow('First request failed');

      // Second request should succeed
      const result = await deduplicator.deduplicate('test-key', requestFn);
      expect(result).toBe('result-2');

      expect(requestFn).toHaveBeenCalledTimes(2);
    });

    it('should clean up after error', async () => {
      const requestFn = vi.fn(async () => {
        throw new Error('Request failed');
      });

      await expect(deduplicator.deduplicate('test-key', requestFn)).rejects.toThrow('Request failed');

      // Should be cleaned up
      expect(deduplicator.isActive('test-key')).toBe(false);
      expect(deduplicator.getActiveCount()).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should track active requests', async () => {
      const requestFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      });

      expect(deduplicator.isActive('test-key')).toBe(false);
      expect(deduplicator.getActiveCount()).toBe(0);

      const promise = deduplicator.deduplicate('test-key', requestFn);

      expect(deduplicator.isActive('test-key')).toBe(true);
      expect(deduplicator.getActiveCount()).toBe(1);

      await promise;

      expect(deduplicator.isActive('test-key')).toBe(false);
      expect(deduplicator.getActiveCount()).toBe(0);
    });

    it('should return active keys', async () => {
      const requestFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      });

      const promise1 = deduplicator.deduplicate('key1', requestFn);
      const promise2 = deduplicator.deduplicate('key2', requestFn);

      const activeKeys = deduplicator.getActiveKeys();
      expect(activeKeys).toContain('key1');
      expect(activeKeys).toContain('key2');
      expect(activeKeys).toHaveLength(2);

      await Promise.all([promise1, promise2]);

      expect(deduplicator.getActiveKeys()).toHaveLength(0);
    });

    it('should track request count per key', async () => {
      const requestFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      });

      // Start multiple requests for same key
      const promise1 = deduplicator.deduplicate('test-key', requestFn);
      const promise2 = deduplicator.deduplicate('test-key', requestFn);
      const promise3 = deduplicator.deduplicate('test-key', requestFn);

      expect(deduplicator.getRequestCount('test-key')).toBe(3);

      await Promise.all([promise1, promise2, promise3]);

      expect(deduplicator.getRequestCount('test-key')).toBe(0); // Cleaned up
    });
  });

  describe('Metrics Tracking', () => {
    it('should track basic metrics', async () => {
      const requestFn = vi.fn(async () => 'result');

      // First request (not deduplicated)
      await deduplicator.deduplicate('key1', requestFn);

      let metrics = deduplicator.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.deduplicatedRequests).toBe(0);
      expect(metrics.deduplicationRate).toBe(0);

      // Simultaneous requests (should be deduplicated)
      const promise1 = deduplicator.deduplicate('key2', requestFn);
      const promise2 = deduplicator.deduplicate('key2', requestFn);
      const promise3 = deduplicator.deduplicate('key2', requestFn);

      await Promise.all([promise1, promise2, promise3]);

      metrics = deduplicator.getMetrics();
      expect(metrics.totalRequests).toBe(4); // 1 + 3
      expect(metrics.deduplicatedRequests).toBe(2); // 2 out of 3 were deduplicated
      expect(metrics.deduplicationRate).toBe(0.5); // 2/4
    });

    it('should reset metrics', async () => {
      const requestFn = vi.fn(async () => 'result');

      await deduplicator.deduplicate('test-key', requestFn);

      let metrics = deduplicator.getMetrics();
      expect(metrics.totalRequests).toBe(1);

      deduplicator.resetMetrics();

      metrics = deduplicator.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.deduplicatedRequests).toBe(0);
      expect(metrics.deduplicationRate).toBe(0);
    });

    it('should provide detailed statistics', async () => {
      const requestFn = vi.fn(async () => 'result');

      // Create various request patterns
      await deduplicator.deduplicate('key1', requestFn);
      
      const promise1 = deduplicator.deduplicate('key2', requestFn);
      const promise2 = deduplicator.deduplicate('key2', requestFn);
      const promise3 = deduplicator.deduplicate('key2', requestFn);
      
      await Promise.all([promise1, promise2, promise3]);

      const stats = deduplicator.getDetailedStats();
      
      expect(stats.totalRequests).toBe(4);
      expect(stats.uniqueRequests).toBe(2); // key1 and key2
      expect(stats.deduplicatedRequests).toBe(2);
      expect(stats.deduplicationRate).toBe(0.5);
      expect(stats.averageRequestsPerKey).toBe(2); // 4 total / 2 unique
    });
  });

  describe('Cancellation', () => {
    it('should cancel specific request', async () => {
      const requestFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      });

      const promise = deduplicator.deduplicate('test-key', requestFn);

      expect(deduplicator.isActive('test-key')).toBe(true);

      const cancelled = deduplicator.cancel('test-key');
      expect(cancelled).toBe(true);
      expect(deduplicator.isActive('test-key')).toBe(false);

      // Promise should still resolve (cancellation just cleans up tracking)
      const result = await promise;
      expect(result).toBe('result');
    });

    it('should return false when cancelling non-existent request', () => {
      const cancelled = deduplicator.cancel('non-existent');
      expect(cancelled).toBe(false);
    });

    it('should cancel all requests', async () => {
      const requestFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      });

      const promise1 = deduplicator.deduplicate('key1', requestFn);
      const promise2 = deduplicator.deduplicate('key2', requestFn);

      expect(deduplicator.getActiveCount()).toBe(2);

      const cancelledCount = deduplicator.cancelAll();
      expect(cancelledCount).toBe(2);
      expect(deduplicator.getActiveCount()).toBe(0);

      // Promises should still resolve
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });
  });

  describe('Advanced Features', () => {
    it('should create scoped deduplicator', async () => {
      const requestFn = vi.fn(async () => 'result');
      const scopedDeduplicator = deduplicator.createScoped('namespace1');

      // Requests with same key but different namespaces should not be deduplicated
      const promise1 = deduplicator.deduplicate('test-key', requestFn);
      const promise2 = scopedDeduplicator.deduplicate('test-key', requestFn);

      await Promise.all([promise1, promise2]);

      expect(requestFn).toHaveBeenCalledTimes(2); // Both should execute
    });

    it('should deduplicate with custom key generator', async () => {
      const requestFn = vi.fn(async () => 'result');
      const keyGenerator = (userId: number, action: string) => `${userId}-${action}`;

      // Same parameters should be deduplicated
      const promise1 = deduplicator.deduplicateWithKeyGen(keyGenerator, requestFn, 123, 'fetch');
      const promise2 = deduplicator.deduplicateWithKeyGen(keyGenerator, requestFn, 123, 'fetch');

      await Promise.all([promise1, promise2]);

      expect(requestFn).toHaveBeenCalledTimes(1); // Should be deduplicated

      // Different parameters should not be deduplicated
      await deduplicator.deduplicateWithKeyGen(keyGenerator, requestFn, 456, 'fetch');

      expect(requestFn).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout in deduplicateWithTimeout', async () => {
      const requestFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'result';
      });

      await expect(
        deduplicator.deduplicateWithTimeout('test-key', requestFn, 100)
      ).rejects.toThrow('Request timeout after 100ms');
    });

    it('should batch deduplicate multiple requests', async () => {
      let callCount = 0;
      const requestFn1 = vi.fn(async () => `result-${++callCount}`);
      const requestFn2 = vi.fn(async () => `result-${++callCount}`);

      const requests = [
        { key: 'key1', requestFn: requestFn1 },
        { key: 'key2', requestFn: requestFn2 },
        { key: 'key1', requestFn: requestFn1 } // Should be deduplicated
      ];

      const results = await deduplicator.batchDeduplicate(requests);

      expect(results).toHaveLength(3);
      expect(results[0]).toBe('result-1'); // key1 first call
      expect(results[1]).toBe('result-2'); // key2 call
      expect(results[2]).toBe('result-1'); // key1 deduplicated (same as first)

      expect(requestFn1).toHaveBeenCalledTimes(1); // Deduplicated
      expect(requestFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests that resolve immediately', async () => {
      const requestFn = vi.fn(async () => 'immediate-result');

      const result = await deduplicator.deduplicate('test-key', requestFn);

      expect(result).toBe('immediate-result');
      expect(deduplicator.isActive('test-key')).toBe(false);
      expect(deduplicator.getActiveCount()).toBe(0);
    });

    it('should handle requests that throw synchronously', async () => {
      const requestFn = vi.fn(() => {
        throw new Error('Sync error');
      });

      await expect(deduplicator.deduplicate('test-key', requestFn as any)).rejects.toThrow('Sync error');

      expect(deduplicator.isActive('test-key')).toBe(false);
      expect(deduplicator.getActiveCount()).toBe(0);
    });

    it('should handle empty key', async () => {
      const requestFn = vi.fn(async () => 'result');

      const result = await deduplicator.deduplicate('', requestFn);

      expect(result).toBe('result');
      expect(deduplicator.isActive('')).toBe(false);
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(10000);
      const requestFn = vi.fn(async () => 'result');

      const result = await deduplicator.deduplicate(longKey, requestFn);

      expect(result).toBe('result');
      expect(deduplicator.isActive(longKey)).toBe(false);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const requestFn = vi.fn(async () => 'result');

      const result = await deduplicator.deduplicate(specialKey, requestFn);

      expect(result).toBe('result');
      expect(deduplicator.isActive(specialKey)).toBe(false);
    });
  });
});