/**
 * PDFCacheService - Serviço de Cache de PDF
 * 
 * Responsável por gerenciar cache em memória de PDFs gerados
 * com controle de tamanho e expiração automática
 */

export interface CacheEntry {
  pdfData: Buffer;
  fileName: string;
  createdAt: Date;
  lastAccessed: Date;
  size: number;
  timestamp: Date;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  maxSize: number;
  hitRate: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class PDFCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number; // Maximum cache size in bytes
  private maxEntries: number; // Maximum number of entries
  private expirationTime: number; // Expiration time in milliseconds
  private hits: number = 0;
  private misses: number = 0;

  constructor(
    maxSizeMB: number = 100, // 100MB default
    maxEntries: number = 1000, // 1000 entries default
    expirationHours: number = 24 // 24 hours default
  ) {
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    this.maxEntries = maxEntries;
    this.expirationTime = expirationHours * 60 * 60 * 1000; // Convert hours to milliseconds

    // Schedule periodic cleanup every hour
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 60 * 1000); // 1 hour

    console.log(`[PDFCache] Initialized with maxSize: ${maxSizeMB}MB, maxEntries: ${maxEntries}, expiration: ${expirationHours}h`);
  }

  /**
   * Generates cache key from document ID
   */
  private generateCacheKey(documentId: string): string {
    return `danfe_${documentId}`;
  }

  /**
   * Gets PDF from cache
   */
  get(documentId: string): CacheEntry | null {
    const key = this.generateCacheKey(documentId);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      console.log(`[PDFCache] Cache miss for document: ${documentId}`);
      return null;
    }

    // Check if entry has expired
    const now = new Date();
    if (now.getTime() - entry.createdAt.getTime() > this.expirationTime) {
      this.cache.delete(key);
      this.misses++;
      console.log(`[PDFCache] Cache expired for document: ${documentId}`);
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = now;
    this.hits++;
    console.log(`[PDFCache] Cache hit for document: ${documentId}`);
    return entry;
  }

  /**
   * Stores PDF in cache
   */
  set(documentId: string, pdfData: Buffer, fileName: string): void {
    const key = this.generateCacheKey(documentId);
    const now = new Date();
    const size = pdfData.length;

    // Check if we need to make space
    this.ensureSpace(size);

    const entry: CacheEntry = {
      pdfData,
      fileName,
      createdAt: now,
      lastAccessed: now,
      size,
      timestamp: now
    };

    this.cache.set(key, entry);
    console.log(`[PDFCache] Cached PDF for document: ${documentId}, size: ${size} bytes`);

    // Check if we exceeded max entries
    if (this.cache.size > this.maxEntries) {
      this.evictOldestEntry();
    }
  }

  /**
   * Removes entry from cache
   */
  delete(documentId: string): boolean {
    const key = this.generateCacheKey(documentId);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      console.log(`[PDFCache] Removed from cache: ${documentId}`);
    }
    
    return deleted;
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log(`[PDFCache] Cleared ${entriesCount} entries from cache`);
  }

  /**
   * Ensures there's enough space for a new entry
   */
  private ensureSpace(requiredSize: number): void {
    const currentSize = this.getCurrentSize();
    
    if (currentSize + requiredSize <= this.maxSize) {
      return; // Enough space available
    }

    console.log(`[PDFCache] Need to free space: current ${currentSize}, required ${requiredSize}, max ${this.maxSize}`);

    // Remove entries until we have enough space
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());

    for (const [key, entry] of entries) {
      this.cache.delete(key);
      console.log(`[PDFCache] Evicted entry: ${key}, freed ${entry.size} bytes`);
      
      const newCurrentSize = this.getCurrentSize();
      if (newCurrentSize + requiredSize <= this.maxSize) {
        break;
      }
    }
  }

  /**
   * Evicts the oldest entry (by last accessed time)
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[PDFCache] Evicted oldest entry: ${oldestKey}`);
    }
  }

  /**
   * Cleans up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt.getTime() > this.expirationTime) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`[PDFCache] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Gets current cache size in bytes
   */
  private getCurrentSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * Gets cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = this.getCurrentSize();
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;

    if (entries.length > 0) {
      const sortedByCreation = entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      oldestEntry = sortedByCreation[0].createdAt;
      newestEntry = sortedByCreation[sortedByCreation.length - 1].createdAt;
    }

    return {
      totalEntries: this.cache.size,
      totalSize,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Checks if cache contains a document
   */
  has(documentId: string): boolean {
    const key = this.generateCacheKey(documentId);
    return this.cache.has(key);
  }

  /**
   * Gets cache size in MB
   */
  getSizeMB(): number {
    return Math.round((this.getCurrentSize() / (1024 * 1024)) * 100) / 100;
  }

  /**
   * Gets cache usage percentage
   */
  getUsagePercentage(): number {
    const currentSize = this.getCurrentSize();
    return Math.round((currentSize / this.maxSize) * 10000) / 100; // Round to 2 decimal places
  }
}

// Export singleton instance
export const pdfCacheService = new PDFCacheService(
  parseInt(process.env.PDF_CACHE_SIZE_MB || '100'), // 100MB default
  parseInt(process.env.PDF_CACHE_MAX_ENTRIES || '1000'), // 1000 entries default
  parseInt(process.env.PDF_CACHE_EXPIRATION_HOURS || '24') // 24 hours default
);