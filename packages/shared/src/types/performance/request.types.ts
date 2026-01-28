/**
 * Request Types for Input Performance Optimization
 * 
 * Defines types for network layer request management with built-in
 * protection against excessive request creation.
 * 
 * CRITICAL: These types enforce patterns that prevent millions of
 * unnecessary requests through throttling, deduplication, and cancellation.
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

export type RequestStatus = 
  | 'idle' 
  | 'pending' 
  | 'success' 
  | 'error' 
  | 'cancelled'
  | 'throttled'
  | 'deduplicated';

export interface RequestState {
  key: string;
  status: RequestStatus;
  startTime: number;
  endTime?: number;
  error?: Error;
  abortController?: AbortController;
  /** Number of times this request was deduplicated (prevented) */
  deduplicationCount?: number;
  /** Number of times this request was throttled (delayed) */
  throttleCount?: number;
}

export interface RequestOptions {
  /** Minimum time between requests (default: 300ms) - PREVENTS EXCESSIVE REQUESTS */
  throttleMs?: number;
  /** Cache duration in ms (default: 5min) - PREVENTS DUPLICATE REQUESTS */
  cacheMs?: number;
  /** Enable request deduplication (default: true) - PREVENTS SIMULTANEOUS DUPLICATES */
  deduplicate?: boolean;
  /** Maximum retry attempts (default: 3) - PREVENTS INFINITE RETRIES */
  retries?: number;
  /** Delay between retries in ms (default: 1000ms) */
  retryDelay?: number;
  /** Maximum concurrent requests per key (default: 1) - PREVENTS REQUEST FLOODING */
  maxConcurrent?: number;
  /** Request timeout in ms (default: 30000ms) - PREVENTS HANGING REQUESTS */
  timeoutMs?: number;
}

export interface ThrottleConfig {
  /** Minimum wait time between executions in ms */
  waitMs: number;
  /** Execute on leading edge (default: false) */
  leading?: boolean;
  /** Execute on trailing edge (default: true) */
  trailing?: boolean;
  /** Maximum number of queued requests (default: 1) - PREVENTS QUEUE OVERFLOW */
  maxQueued?: number;
}

export interface RequestMetrics {
  /** Total requests attempted */
  totalRequests: number;
  /** Requests that completed successfully */
  successfulRequests: number;
  /** Requests that failed */
  failedRequests: number;
  /** Requests that were cancelled */
  cancelledRequests: number;
  /** Requests prevented by throttling - SAVED REQUESTS */
  throttledRequests: number;
  /** Requests prevented by deduplication - SAVED REQUESTS */
  deduplicatedRequests: number;
  /** Requests served from cache - SAVED REQUESTS */
  cachedRequests: number;
  /** Average response time in ms */
  averageResponseTime: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  /** Request prevention rate (0-1) - Higher is better */
  preventionRate: number;
}

/**
 * Request Budget - Limits to prevent excessive requests
 * 
 * CRITICAL: These limits are enforced to prevent system overload
 */
export interface RequestBudget {
  /** Maximum requests per minute per endpoint */
  maxRequestsPerMinute: number;
  /** Maximum concurrent requests per endpoint */
  maxConcurrentRequests: number;
  /** Maximum queued requests per endpoint */
  maxQueuedRequests: number;
  /** Minimum time between requests in ms */
  minTimeBetweenRequests: number;
}

/**
 * Request Guard - Validates if a request should be allowed
 * 
 * Returns false if request would exceed budget limits
 */
export interface RequestGuard {
  /** Check if request is allowed based on budget */
  canMakeRequest(key: string, budget: RequestBudget): boolean;
  /** Get current request count for key */
  getRequestCount(key: string): number;
  /** Reset request count for key */
  resetRequestCount(key: string): void;
}
