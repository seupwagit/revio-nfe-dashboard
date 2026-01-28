/**
 * Intelligent URL Cache Service
 * 
 * Advanced caching system for DANFE PDF URLs with:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) expiration
 * - Memory usage monitoring
 * - Cache hit/miss statistics
 * - Automatic cleanup and optimization
 */

interface CacheEntry {
  url: string;
  fromCache: boolean;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  fileSize?: number;
  documentType?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  memoryUsage: number;
  entryCount: number;
}

interface CacheConfig {
  maxEntries: number;
  ttlMs: number;
  maxMemoryMB: number;
  cleanupIntervalMs: number;
  enableStats: boolean;
}

export class IntelligentURLCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // For LRU tracking
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    hitRate: 0,
    memoryUsage: 0,
    entryCount: 0
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxEntries: 100,
      ttlMs: 30 * 60 * 1000, // 30 minutes
      maxMemoryMB: 50,
      cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
      enableStats: true,
      ...config
    };

    this.startCleanupInterval();
  }

  /**
   * Get URL from cache with intelligent access tracking
   */
  get(documentId: string): { url: string; fromCache: boolean } | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(documentId);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check TTL expiration
    const now = Date.now();
    if (now - entry.timestamp > this.config.ttlMs) {
      console.log(`[URLCache] Entry expired for document: ${documentId}`);
      this.cache.delete(documentId);
      this.removeFromAccessOrder(documentId);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access tracking for LRU
    entry.lastAccessed = now;
    entry.accessCount++;
    this.updateAccessOrder(documentId);

    this.stats.hits++;
    this.updateHitRate();

    console.log(`[URLCache] Cache hit for document: ${documentId} (accessed ${entry.accessCount} times)`);
    
    return {
      url: entry.url,
      fromCache: entry.fromCache
    };
  }

  /**
   * Set URL in cache with intelligent storage
   */
  set(
    documentId: string, 
    url: string, 
    fromCache: boolean = false,
    metadata?: { fileSize?: number; documentType?: string }
  ): void {
    const now = Date.now();

    // Check if we need to evict entries
    this.ensureCapacity();

    const entry: CacheEntry = {
      url,
      fromCache,
      timestamp: now,
      lastAccessed: now,
      accessCount: 1,
      fileSize: metadata?.fileSize,
      documentType: metadata?.documentType
    };

    // If entry already exists, preserve access count
    const existingEntry = this.cache.get(documentId);
    if (existingEntry) {
      entry.accessCount = existingEntry.accessCount + 1;
    }

    this.cache.set(documentId, entry);
    this.updateAccessOrder(documentId);
    this.updateStats();

    console.log(`[URLCache] Cached URL for document: ${documentId} (${fromCache ? 'from server cache' : 'fresh'})`);
  }

  /**
   * Preload URLs for anticipated requests
   */
  async preload(documentIds: string[]): Promise<void> {
    console.log(`[URLCache] Preloading ${documentIds.length} documents`);

    const uncachedIds = documentIds.filter(id => !this.cache.has(id));
    
    if (uncachedIds.length === 0) {
      console.log('[URLCache] All documents already cached');
      return;
    }

    // Batch preload uncached documents
    const preloadPromises = uncachedIds.map(async (documentId) => {
      try {
        // Import danfeService dynamically to avoid circular dependencies
        const { danfeService } = await import('./DANFEService');
        const url = danfeService.getPDFUrl(documentId);
        
        // Set with lower priority (shorter TTL for preloaded items)
        const entry: CacheEntry = {
          url,
          fromCache: false,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0, // Mark as preloaded
          documentType: 'preloaded'
        };

        this.cache.set(documentId, entry);
        this.updateAccessOrder(documentId);
        
      } catch (error) {
        console.warn(`[URLCache] Failed to preload document ${documentId}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    this.updateStats();
    
    console.log(`[URLCache] Preloaded ${uncachedIds.length} documents`);
  }

  /**
   * Invalidate specific document or pattern
   */
  invalidate(documentIdOrPattern: string | RegExp): number {
    let removedCount = 0;

    if (typeof documentIdOrPattern === 'string') {
      // Single document invalidation
      if (this.cache.delete(documentIdOrPattern)) {
        this.removeFromAccessOrder(documentIdOrPattern);
        removedCount = 1;
        console.log(`[URLCache] Invalidated document: ${documentIdOrPattern}`);
      }
    } else {
      // Pattern-based invalidation
      const keysToRemove: string[] = [];
      
      for (const key of this.cache.keys()) {
        if (documentIdOrPattern.test(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        removedCount++;
      });

      console.log(`[URLCache] Invalidated ${removedCount} documents matching pattern`);
    }

    this.updateStats();
    return removedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get detailed cache information
   */
  getDetailedInfo(): {
    stats: CacheStats;
    entries: Array<{
      documentId: string;
      age: number;
      accessCount: number;
      lastAccessed: number;
      fromCache: boolean;
      fileSize?: number;
    }>;
    config: CacheConfig;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([documentId, entry]) => ({
      documentId,
      age: now - entry.timestamp,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
      fromCache: entry.fromCache,
      fileSize: entry.fileSize
    }));

    return {
      stats: this.getStats(),
      entries: entries.sort((a, b) => b.lastAccessed - a.lastAccessed), // Most recently accessed first
      config: { ...this.config }
    };
  }

  /**
   * Optimize cache by removing least valuable entries
   */
  optimize(): void {
    console.log('[URLCache] Starting cache optimization');

    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Calculate value score for each entry
    const scoredEntries = entries.map(([documentId, entry]) => {
      const age = now - entry.timestamp;
      const timeSinceAccess = now - entry.lastAccessed;
      
      // Higher score = more valuable
      const score = (
        entry.accessCount * 10 + // Frequently accessed items are valuable
        (entry.fromCache ? 5 : 0) + // Server-cached items are valuable
        Math.max(0, (this.config.ttlMs - age) / this.config.ttlMs) * 20 + // Newer items are valuable
        Math.max(0, (this.config.ttlMs - timeSinceAccess) / this.config.ttlMs) * 15 // Recently accessed items are valuable
      );

      return { documentId, entry, score };
    });

    // Sort by score (lowest first for removal)
    scoredEntries.sort((a, b) => a.score - b.score);

    // Remove lowest-scoring entries if over capacity
    const targetSize = Math.floor(this.config.maxEntries * 0.8); // Reduce to 80% capacity
    const toRemove = Math.max(0, scoredEntries.length - targetSize);

    if (toRemove > 0) {
      scoredEntries
        .slice(0, toRemove)
        .forEach(({ documentId }) => {
          this.cache.delete(documentId);
          this.removeFromAccessOrder(documentId);
        });

      this.stats.evictions += toRemove;
      console.log(`[URLCache] Optimized cache: removed ${toRemove} low-value entries`);
    }

    this.updateStats();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const entryCount = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    this.stats.evictions += entryCount;
    this.updateStats();
    
    console.log(`[URLCache] Cleared all ${entryCount} cache entries`);
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('[URLCache] Cache destroyed and resources cleaned up');
  }

  private ensureCapacity(): void {
    // Check entry count limit
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    // Check memory usage limit
    const memoryUsageMB = this.estimateMemoryUsage();
    if (memoryUsageMB > this.config.maxMemoryMB) {
      console.warn(`[URLCache] Memory usage (${memoryUsageMB}MB) exceeds limit (${this.config.maxMemoryMB}MB)`);
      this.optimize();
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruDocumentId = this.accessOrder[0];
    this.cache.delete(lruDocumentId);
    this.removeFromAccessOrder(lruDocumentId);
    this.stats.evictions++;

    console.log(`[URLCache] Evicted LRU entry: ${lruDocumentId}`);
  }

  private updateAccessOrder(documentId: string): void {
    // Remove from current position
    this.removeFromAccessOrder(documentId);
    
    // Add to end (most recently used)
    this.accessOrder.push(documentId);
  }

  private removeFromAccessOrder(documentId: string): void {
    const index = this.accessOrder.indexOf(documentId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  private updateStats(): void {
    this.stats.entryCount = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
    this.updateHitRate();
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [documentId, entry] of this.cache) {
      // Estimate memory usage for each entry
      totalSize += documentId.length * 2; // UTF-16 characters
      totalSize += entry.url.length * 2;
      totalSize += 100; // Overhead for object structure
      totalSize += entry.fileSize || 0;
    }

    return totalSize / (1024 * 1024); // Convert to MB
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [documentId, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttlMs) {
        expiredKeys.push(documentId);
      }
    }

    // Remove expired entries
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`[URLCache] Cleaned up ${expiredKeys.length} expired entries`);
      this.updateStats();
    }

    // Log stats periodically
    if (this.config.enableStats && this.stats.totalRequests > 0) {
      console.log('[URLCache] Stats:', {
        hitRate: `${this.stats.hitRate.toFixed(1)}%`,
        entries: this.stats.entryCount,
        memoryUsage: `${this.stats.memoryUsage.toFixed(1)}MB`
      });
    }
  }
}

// Global cache instance
export const intelligentURLCache = new IntelligentURLCache({
  maxEntries: 100,
  ttlMs: 30 * 60 * 1000, // 30 minutes
  maxMemoryMB: 50,
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
  enableStats: true
});

// Export cache management utilities
export const cacheUtils = {
  /**
   * Preload URLs for a list of documents
   */
  preloadDocuments: (documentIds: string[]) => intelligentURLCache.preload(documentIds),

  /**
   * Get cache statistics
   */
  getStats: () => intelligentURLCache.getStats(),

  /**
   * Get detailed cache information
   */
  getDetailedInfo: () => intelligentURLCache.getDetailedInfo(),

  /**
   * Optimize cache performance
   */
  optimize: () => intelligentURLCache.optimize(),

  /**
   * Invalidate cache entries
   */
  invalidate: (pattern: string | RegExp) => intelligentURLCache.invalidate(pattern),

  /**
   * Clear all cache
   */
  clear: () => intelligentURLCache.clear()
};