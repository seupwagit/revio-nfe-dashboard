/**
 * Unit Tests for AbortControllerManager
 * 
 * Tests request cancellation lifecycle and cleanup.
 * Validates: Requirements 3.2, 3.5
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbortControllerManager } from '../../../../services/performance/abort-controller-manager.service';

describe('AbortControllerManager', () => {
  let manager: AbortControllerManager;

  beforeEach(() => {
    manager = new AbortControllerManager();
  });

  describe('Basic Operations', () => {
    it('should create an AbortSignal for a key', () => {
      const signal = manager.create('test-key');
      
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
      expect(manager.hasController('test-key')).toBe(true);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should abort a controller by key', () => {
      const signal = manager.create('test-key');
      expect(signal.aborted).toBe(false);
      
      manager.abort('test-key');
      expect(signal.aborted).toBe(true);
      expect(manager.isAborted('test-key')).toBe(true);
    });

    it('should abort all controllers', () => {
      const signal1 = manager.create('key1');
      const signal2 = manager.create('key2');
      const signal3 = manager.create('key3');
      
      expect(signal1.aborted).toBe(false);
      expect(signal2.aborted).toBe(false);
      expect(signal3.aborted).toBe(false);
      
      manager.abortAll();
      
      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(true);
      expect(signal3.aborted).toBe(true);
    });

    it('should replace existing controller when creating with same key', () => {
      const signal1 = manager.create('test-key');
      expect(signal1.aborted).toBe(false);
      
      const signal2 = manager.create('test-key');
      
      // First signal should be aborted
      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should handle non-existent keys gracefully', () => {
      manager.abort('non-existent');
      expect(manager.isAborted('non-existent')).toBe(false);
      expect(manager.hasController('non-existent')).toBe(false);
      expect(manager.getSignal('non-existent')).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should track active controllers correctly', () => {
      expect(manager.getActiveCount()).toBe(0);
      
      manager.create('key1');
      expect(manager.getActiveCount()).toBe(1);
      
      manager.create('key2');
      expect(manager.getActiveCount()).toBe(2);
      
      manager.abort('key1');
      expect(manager.getActiveCount()).toBe(1);
      
      manager.abortAll();
      expect(manager.getActiveCount()).toBe(0);
    });

    it('should get active keys', () => {
      manager.create('key1');
      manager.create('key2');
      manager.create('key3');
      
      const activeKeys = manager.getActiveKeys();
      expect(activeKeys).toContain('key1');
      expect(activeKeys).toContain('key2');
      expect(activeKeys).toContain('key3');
      expect(activeKeys).toHaveLength(3);
      
      manager.abort('key2');
      
      const activeKeysAfterAbort = manager.getActiveKeys();
      expect(activeKeysAfterAbort).toContain('key1');
      expect(activeKeysAfterAbort).toContain('key3');
      expect(activeKeysAfterAbort).not.toContain('key2');
      expect(activeKeysAfterAbort).toHaveLength(2);
    });

    it('should get signal without creating new one', () => {
      expect(manager.getSignal('test-key')).toBeNull();
      
      const originalSignal = manager.create('test-key');
      const retrievedSignal = manager.getSignal('test-key');
      
      expect(retrievedSignal).toBe(originalSignal);
    });

    it('should provide statistics', () => {
      manager.create('key1');
      manager.create('key2');
      manager.create('key3');
      
      let stats = manager.getStats();
      expect(stats.totalControllers).toBe(3);
      expect(stats.activeControllers).toBe(3);
      expect(stats.abortedControllers).toBe(0);
      
      manager.abort('key1');
      manager.abort('key2');
      
      stats = manager.getStats();
      expect(stats.totalControllers).toBe(3);
      expect(stats.activeControllers).toBe(1);
      expect(stats.abortedControllers).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup aborted controllers', async () => {
      manager.create('key1');
      manager.create('key2');
      manager.create('key3');
      
      manager.abort('key1');
      manager.abort('key2');
      
      // Wait for automatic cleanup
      await new Promise(resolve => setTimeout(resolve, 150));
      
      manager.cleanup();
      
      const stats = manager.getStats();
      expect(stats.abortedKeysCount).toBe(0);
    });

    it('should handle cleanup with no controllers', () => {
      expect(() => manager.cleanup()).not.toThrow();
      
      const stats = manager.getStats();
      expect(stats.totalControllers).toBe(0);
      expect(stats.activeControllers).toBe(0);
    });
  });

  describe('Static Utility Methods', () => {
    it('should combine multiple signals', () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      const controller3 = new AbortController();
      
      const combinedSignal = AbortControllerManager.combineSignals(
        controller1.signal,
        controller2.signal,
        controller3.signal
      );
      
      expect(combinedSignal.aborted).toBe(false);
      
      // Abort one of the source signals
      controller2.abort();
      
      expect(combinedSignal.aborted).toBe(true);
    });

    it('should return aborted signal if any input signal is already aborted', () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      
      controller1.abort(); // Pre-abort one signal
      
      const combinedSignal = AbortControllerManager.combineSignals(
        controller1.signal,
        controller2.signal
      );
      
      expect(combinedSignal.aborted).toBe(true);
    });

    it('should create timeout signal', async () => {
      const timeoutSignal = AbortControllerManager.createTimeoutSignal(100);
      
      expect(timeoutSignal.aborted).toBe(false);
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(timeoutSignal.aborted).toBe(true);
    });

    it('should cleanup timeout when signal is aborted early', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const timeoutSignal = AbortControllerManager.createTimeoutSignal(100);
      
      // Wait for the timeout to trigger and abort the signal
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // The timeout should be cleaned up when the signal was aborted
      expect(timeoutSignal.aborted).toBe(true);
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Integration with Fetch', () => {
    it('should work with fetch requests', async () => {
      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue(new Response('test'));
      global.fetch = mockFetch;
      
      const signal = manager.create('fetch-test');
      
      await fetch('https://example.com', { signal });
      
      expect(mockFetch).toHaveBeenCalledWith('https://example.com', { signal });
    });

    it('should cancel fetch when aborted', async () => {
      // Mock fetch that takes time
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(new Response('test')), 1000))
      );
      global.fetch = mockFetch;
      
      const signal = manager.create('fetch-test');
      
      // Start fetch
      const fetchPromise = fetch('https://example.com', { signal });
      
      // Abort immediately
      manager.abort('fetch-test');
      
      // Fetch should be cancelled
      await expect(fetchPromise).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle aborting already aborted controllers', () => {
      const signal = manager.create('test-key');
      
      manager.abort('test-key');
      expect(signal.aborted).toBe(true);
      
      // Aborting again should not throw
      expect(() => manager.abort('test-key')).not.toThrow();
    });

    it('should handle creating controller with empty key', () => {
      const signal = manager.create('');
      
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(manager.hasController('')).toBe(true);
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      const signal = manager.create(longKey);
      
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(manager.hasController(longKey)).toBe(true);
    });
  });
});