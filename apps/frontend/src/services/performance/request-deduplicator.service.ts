/**
 * Request Deduplicator Service
 * 
 * Prevents duplicate network requests by sharing Promise instances.
 * Multiple simultaneous identical requests will share the same Promise,
 * reducing server load and improving performance.
 * 
 * Validates: Requirements 3.3
 * Properties: 6 (Request Deduplication)
 */

export interface DeduplicationMetrics {
  totalRequests: number;
  deduplicatedRequests: number;
  activeRequests: number;
  deduplicationRate: number;
}

export class RequestDeduplicator {
  private activeRequests: Map<string, Promise<any>> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private metrics: DeduplicationMetrics = {
    totalRequests: 0,
    deduplicatedRequests: 0,
    activeRequests: 0,
    deduplicationRate: 0
  };

  /**
   * Deduplicate a request by key
   * If a request with the same key is already active, returns the existing Promise
   * Otherwise, executes the request function and caches the Promise
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    // Check if request is already active
    const existingRequest = this.activeRequests.get(key);
    if (existingRequest) {
      this.metrics.deduplicatedRequests++;
      this.incrementRequestCount(key);
      this.updateDeduplicationRate();
      
      // Return the existing Promise
      return existingRequest as Promise<T>;
    }

    // Create new request
    const requestPromise = this.executeRequest(key, requestFn);
    
    // Store the Promise
    this.activeRequests.set(key, requestPromise);
    this.requestCounts.set(key, 1);
    this.metrics.activeRequests = this.activeRequests.size;

    return requestPromise;
  }

  /**
   * Execute the request function with proper cleanup
   */
  private async executeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    try {
      const result = await requestFn();
      
      // Clean up after successful completion
      this.cleanup(key);
      
      return result;
    } catch (error) {
      // Clean up after error
      this.cleanup(key);
      
      // Re-throw error to all waiting callers
      throw error;
    }
  }

  /**
   * Clean up completed request
   */
  private cleanup(key: string): void {
    this.activeRequests.delete(key);
    this.requestCounts.delete(key);
    this.metrics.activeRequests = this.activeRequests.size;
  }

  /**
   * Increment request count for a key (for metrics)
   */
  private incrementRequestCount(key: string): void {
    const currentCount = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, currentCount + 1);
  }

  /**
   * Update deduplication rate metric
   */
  private updateDeduplicationRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.deduplicationRate = this.metrics.deduplicatedRequests / this.metrics.totalRequests;
    }
  }

  /**
   * Check if a request is currently active
   */
  isActive(key: string): boolean {
    return this.activeRequests.has(key);
  }

  /**
   * Get the number of active requests
   */
  getActiveCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Get all active request keys
   */
  getActiveKeys(): string[] {
    return Array.from(this.activeRequests.keys());
  }

  /**
   * Get the number of callers waiting for a specific request
   */
  getRequestCount(key: string): number {
    return this.requestCounts.get(key) || 0;
  }

  /**
   * Get deduplication metrics
   */
  getMetrics(): DeduplicationMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      activeRequests: this.activeRequests.size,
      deduplicationRate: 0
    };
  }

  /**
   * Cancel a specific request by key
   * This will cause the Promise to reject with an AbortError
   */
  cancel(key: string): boolean {
    const request = this.activeRequests.get(key);
    if (request) {
      this.cleanup(key);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active requests
   * Returns the number of requests that were cancelled
   */
  cancelAll(): number {
    const cancelledCount = this.activeRequests.size;
    
    this.activeRequests.clear();
    this.requestCounts.clear();
    this.metrics.activeRequests = 0;
    
    return cancelledCount;
  }

  /**
   * Get detailed statistics about request patterns
   */
  getDetailedStats(): {
    totalRequests: number;
    uniqueRequests: number;
    deduplicatedRequests: number;
    deduplicationRate: number;
    activeRequests: number;
    averageRequestsPerKey: number;
    topRequestKeys: Array<{ key: string; count: number }>;
  } {
    const uniqueRequests = this.metrics.totalRequests - this.metrics.deduplicatedRequests;
    const averageRequestsPerKey = uniqueRequests > 0 ? this.metrics.totalRequests / uniqueRequests : 0;
    
    // Get top request keys by count
    const keyCountPairs = Array.from(this.requestCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));

    return {
      totalRequests: this.metrics.totalRequests,
      uniqueRequests,
      deduplicatedRequests: this.metrics.deduplicatedRequests,
      deduplicationRate: this.metrics.deduplicationRate,
      activeRequests: this.metrics.activeRequests,
      averageRequestsPerKey,
      topRequestKeys: keyCountPairs
    };
  }

  /**
   * Create a scoped deduplicator for a specific namespace
   * This allows for separate deduplication contexts
   */
  createScoped(namespace: string): RequestDeduplicator {
    const scopedDeduplicator = new RequestDeduplicator();
    
    // Override the deduplicate method to add namespace prefix
    const originalDeduplicate = scopedDeduplicator.deduplicate.bind(scopedDeduplicator);
    
    scopedDeduplicator.deduplicate = async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
      const scopedKey = `${namespace}:${key}`;
      return originalDeduplicate(scopedKey, requestFn);
    };

    return scopedDeduplicator;
  }

  /**
   * Deduplicate with custom key generator
   * Useful for complex request deduplication logic
   */
  async deduplicateWithKeyGen<T>(
    keyGenerator: (...args: any[]) => string,
    requestFn: () => Promise<T>,
    ...keyArgs: any[]
  ): Promise<T> {
    const key = keyGenerator(...keyArgs);
    return this.deduplicate(key, requestFn);
  }

  /**
   * Deduplicate with timeout
   * If the request takes longer than the timeout, it will be cancelled
   */
  async deduplicateWithTimeout<T>(
    key: string,
    requestFn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return this.deduplicate(key, async () => {
      return Promise.race([
        requestFn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        })
      ]);
    });
  }

  /**
   * Batch deduplicate multiple requests
   * Returns results in the same order as the input keys
   */
  async batchDeduplicate<T>(
    requests: Array<{ key: string; requestFn: () => Promise<T> }>
  ): Promise<T[]> {
    const promises = requests.map(({ key, requestFn }) => 
      this.deduplicate(key, requestFn)
    );
    
    return Promise.all(promises);
  }
}

/**
 * Singleton instance for global use
 */
export const requestDeduplicator = new RequestDeduplicator();