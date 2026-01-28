import * as fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFCacheService } from '../PDFCacheService';

describe('PDFCacheService', () => {
  let cacheService: PDFCacheService;

  beforeEach(() => {
    // Create a fresh cache service instance for each test
    cacheService = new PDFCacheService(
      10, // 10MB max size for testing
      100, // 100 max entries for testing
      1 // 1 hour expiration for testing
    );
    
    // Clear any existing timers to avoid interference
    vi.clearAllTimers();
  });

  describe('Basic Functionality', () => {
    it('should store and retrieve PDF data correctly', () => {
      const documentId = 'test-doc-123';
      const pdfData = Buffer.from('test pdf content');
      const fileName = 'test.pdf';

      cacheService.set(documentId, pdfData, fileName);
      const retrieved = cacheService.get(documentId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.pdfData).toEqual(pdfData);
      expect(retrieved?.fileName).toBe(fileName);
    });

    it('should return null for non-existent documents', () => {
      const result = cacheService.get('non-existent-doc');
      expect(result).toBeNull();
    });

    it('should delete entries correctly', () => {
      const documentId = 'test-doc-delete';
      const pdfData = Buffer.from('test content');
      
      cacheService.set(documentId, pdfData, 'test.pdf');
      expect(cacheService.has(documentId)).toBe(true);
      
      const deleted = cacheService.delete(documentId);
      expect(deleted).toBe(true);
      expect(cacheService.has(documentId)).toBe(false);
    });

    it('should clear all entries', () => {
      cacheService.set('doc1', Buffer.from('content1'), 'file1.pdf');
      cacheService.set('doc2', Buffer.from('content2'), 'file2.pdf');
      
      expect(cacheService.getStats().totalEntries).toBe(2);
      
      cacheService.clear();
      expect(cacheService.getStats().totalEntries).toBe(0);
    });
  });

  describe('Property Tests', () => {
    describe('Property 35: PDF Caching Behavior', () => {
      it('should cache PDF results temporarily to improve performance for repeated requests', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.uint8Array({ minLength: 100, maxLength: 1000 }),
            fc.string({ minLength: 1, maxLength: 50 }),
            (documentId, pdfDataArray, fileName) => {
              const pdfData = Buffer.from(pdfDataArray);
              
              // Property: After storing a PDF, it should be retrievable from cache
              cacheService.set(documentId, pdfData, fileName);
              const cachedEntry = cacheService.get(documentId);
              
              expect(cachedEntry).not.toBeNull();
              expect(cachedEntry?.pdfData).toEqual(pdfData);
              expect(cachedEntry?.fileName).toBe(fileName);
              
              // Property: Cache should improve performance by avoiding regeneration
              // Subsequent requests should return the same cached data
              const secondRetrieval = cacheService.get(documentId);
              expect(secondRetrieval).not.toBeNull();
              expect(secondRetrieval?.pdfData).toEqual(pdfData);
              expect(secondRetrieval?.fileName).toBe(fileName);
              
              // Property: Cached entries should have consistent metadata
              expect(cachedEntry?.createdAt).toBeInstanceOf(Date);
              expect(cachedEntry?.lastAccessed).toBeInstanceOf(Date);
              expect(cachedEntry?.size).toBe(pdfData.length);
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should maintain cache consistency across multiple operations', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                documentId: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                pdfData: fc.uint8Array({ minLength: 50, maxLength: 500 }),
                fileName: fc.string({ minLength: 1, maxLength: 30 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (documents) => {
              // Property: All stored documents should be retrievable
              const storedDocuments = new Map();
              
              // Store all documents
              documents.forEach(doc => {
                const pdfBuffer = Buffer.from(doc.pdfData);
                cacheService.set(doc.documentId, pdfBuffer, doc.fileName);
                storedDocuments.set(doc.documentId, { pdfData: pdfBuffer, fileName: doc.fileName });
              });
              
              // Verify all documents are cached correctly
              documents.forEach(doc => {
                const cached = cacheService.get(doc.documentId);
                const stored = storedDocuments.get(doc.documentId);
                
                expect(cached).not.toBeNull();
                expect(cached?.pdfData).toEqual(stored.pdfData);
                expect(cached?.fileName).toBe(stored.fileName);
              });
              
              // Property: Cache statistics should reflect the stored documents
              const stats = cacheService.getStats();
              expect(stats.totalEntries).toBe(new Set(documents.map(d => d.documentId)).size);
            }
          ),
          { numRuns: 20 }
        );
      });

      it('should update last accessed time on cache hits', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.uint8Array({ minLength: 100, maxLength: 500 }),
            fc.string({ minLength: 1, maxLength: 30 }),
            (documentId, pdfDataArray, fileName) => {
              const pdfData = Buffer.from(pdfDataArray);
              
              // Store the document
              cacheService.set(documentId, pdfData, fileName);
              const firstRetrieval = cacheService.get(documentId);
              expect(firstRetrieval).not.toBeNull();
              
              const firstAccessTime = firstRetrieval!.lastAccessed.getTime();
              
              // Wait a small amount and retrieve again
              const waitTime = 10; // 10ms
              const startTime = Date.now();
              while (Date.now() - startTime < waitTime) {
                // Busy wait to ensure time difference
              }
              
              const secondRetrieval = cacheService.get(documentId);
              expect(secondRetrieval).not.toBeNull();
              
              // Property: Last accessed time should be updated on subsequent retrievals
              const secondAccessTime = secondRetrieval!.lastAccessed.getTime();
              expect(secondAccessTime).toBeGreaterThanOrEqual(firstAccessTime);
            }
          ),
          { numRuns: 20 }
        );
      });

      it('should handle cache key generation consistently', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.uint8Array({ minLength: 50, maxLength: 200 }),
            (documentId, pdfDataArray) => {
              const pdfData = Buffer.from(pdfDataArray);
              const fileName = `${documentId}.pdf`;
              
              // Property: Same document ID should always map to the same cache entry
              cacheService.set(documentId, pdfData, fileName);
              
              // Multiple retrievals should return the same entry
              const retrieval1 = cacheService.get(documentId);
              const retrieval2 = cacheService.get(documentId);
              const retrieval3 = cacheService.get(documentId);
              
              expect(retrieval1).not.toBeNull();
              expect(retrieval2).not.toBeNull();
              expect(retrieval3).not.toBeNull();
              
              // All retrievals should return identical data
              expect(retrieval1?.pdfData).toEqual(retrieval2?.pdfData);
              expect(retrieval2?.pdfData).toEqual(retrieval3?.pdfData);
              expect(retrieval1?.fileName).toBe(retrieval2?.fileName);
              expect(retrieval2?.fileName).toBe(retrieval3?.fileName);
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe('Property 36: Cache Memory Management', () => {
      it('should clear PDF cache when memory usage exceeds defined thresholds', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                documentId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                dataSize: fc.integer({ min: 1000, max: 5000 }) // 1KB to 5KB per document
              }),
              { minLength: 5, maxLength: 15 }
            ),
            (documents) => {
              // Create a cache with very small size limit for testing
              const smallCache = new PDFCacheService(
                0.01, // 0.01MB = ~10KB max size
                50,   // 50 max entries
                1     // 1 hour expiration
              );
              
              let totalSizeAdded = 0;
              const addedDocuments: string[] = [];
              
              // Add documents until we exceed the size limit
              documents.forEach(doc => {
                const pdfData = Buffer.alloc(doc.dataSize, 'x'); // Create buffer of specified size
                const fileName = `${doc.documentId}.pdf`;
                
                smallCache.set(doc.documentId, pdfData, fileName);
                totalSizeAdded += doc.dataSize;
                addedDocuments.push(doc.documentId);
                
                const stats = smallCache.getStats();
                
                // Property: Cache should not exceed the maximum size limit
                expect(stats.totalSize).toBeLessThanOrEqual(stats.maxSize);
                
                // Property: When size limit is exceeded, older entries should be evicted
                if (totalSizeAdded > stats.maxSize) {
                  // Some documents should have been evicted
                  expect(stats.totalEntries).toBeLessThan(addedDocuments.length);
                }
              });
              
              // Property: Final cache size should be within limits
              const finalStats = smallCache.getStats();
              expect(finalStats.totalSize).toBeLessThanOrEqual(finalStats.maxSize);
            }
          ),
          { numRuns: 10 }
        );
      });

      it('should evict oldest entries when max entries limit is exceeded', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                documentId: fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0),
                content: fc.string({ minLength: 10, maxLength: 50 })
              }),
              { minLength: 8, maxLength: 12 }
            ),
            (documents) => {
              // Create a cache with small entry limit
              const limitedCache = new PDFCacheService(
                10,  // 10MB size (large enough to not be the limiting factor)
                5,   // Only 5 max entries
                1    // 1 hour expiration
              );
              
              const addedDocuments: string[] = [];
              
              // Add documents one by one
              documents.forEach((doc, index) => {
                const pdfData = Buffer.from(doc.content);
                const fileName = `${doc.documentId}.pdf`;
                
                limitedCache.set(doc.documentId, pdfData, fileName);
                addedDocuments.push(doc.documentId);
                
                const stats = limitedCache.getStats();
                
                // Property: Cache should never exceed max entries limit
                expect(stats.totalEntries).toBeLessThanOrEqual(5);
                
                // Property: When limit is exceeded, some entries should be evicted
                if (addedDocuments.length > 5) {
                  expect(stats.totalEntries).toBe(5);
                  
                  // Some of the earlier documents should no longer be in cache
                  const earlierDocuments = addedDocuments.slice(0, addedDocuments.length - 5);
                  let someEvicted = false;
                  
                  earlierDocuments.forEach(docId => {
                    if (!limitedCache.has(docId)) {
                      someEvicted = true;
                    }
                  });
                  
                  expect(someEvicted).toBe(true);
                }
              });
            }
          ),
          { numRuns: 15 }
        );
      });

      it('should maintain memory usage statistics accurately', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                documentId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                dataSize: fc.integer({ min: 100, max: 1000 })
              }),
              { minLength: 1, maxLength: 8 }
            ),
            (documents) => {
              let expectedTotalSize = 0;
              const uniqueDocuments = new Map();
              
              // Add documents and track expected size
              documents.forEach(doc => {
                const pdfData = Buffer.alloc(doc.dataSize, 'x');
                const fileName = `${doc.documentId}.pdf`;
                
                // If document already exists, we're replacing it
                if (uniqueDocuments.has(doc.documentId)) {
                  expectedTotalSize -= uniqueDocuments.get(doc.documentId);
                }
                
                cacheService.set(doc.documentId, pdfData, fileName);
                uniqueDocuments.set(doc.documentId, doc.dataSize);
                expectedTotalSize += doc.dataSize;
                
                const stats = cacheService.getStats();
                
                // Property: Total size should match the sum of all cached entries
                expect(stats.totalSize).toBe(expectedTotalSize);
                
                // Property: Total entries should match unique documents
                expect(stats.totalEntries).toBe(uniqueDocuments.size);
                
                // Property: Usage percentage should be calculated correctly
                const expectedUsagePercentage = (expectedTotalSize / stats.maxSize) * 100;
                expect(Math.abs(cacheService.getUsagePercentage() - expectedUsagePercentage)).toBeLessThan(0.01);
              });
            }
          ),
          { numRuns: 20 }
        );
      });

      it('should handle memory pressure by evicting least recently used entries', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0),
              { minLength: 6, maxLength: 10 }
            ),
            (documentIds) => {
              // Create cache with small size limit
              const pressureCache = new PDFCacheService(
                0.005, // 0.005MB = ~5KB max size
                20,    // 20 max entries (size will be the limiting factor)
                1      // 1 hour expiration
              );
              
              const largeDataSize = 2000; // 2KB per document
              const addedOrder: string[] = [];
              
              // Add documents in order
              documentIds.forEach(docId => {
                const pdfData = Buffer.alloc(largeDataSize, 'x');
                const fileName = `${docId}.pdf`;
                
                pressureCache.set(docId, pdfData, fileName);
                addedOrder.push(docId);
                
                // Access some documents to update their last accessed time
                if (addedOrder.length > 2) {
                  // Access the second-to-last document to make it more recently used
                  pressureCache.get(addedOrder[addedOrder.length - 2]);
                }
              });
              
              const stats = pressureCache.getStats();
              
              // Property: Cache should stay within size limits
              expect(stats.totalSize).toBeLessThanOrEqual(stats.maxSize);
              
              // Property: When under memory pressure, some entries should be evicted
              if (documentIds.length * largeDataSize > stats.maxSize) {
                expect(stats.totalEntries).toBeLessThan(documentIds.length);
                
                // Property: Most recently added/accessed documents should be more likely to remain
                const lastDocument = addedOrder[addedOrder.length - 1];
                expect(pressureCache.has(lastDocument)).toBe(true);
              }
            }
          ),
          { numRuns: 10 }
        );
      });

      it('should provide accurate cache statistics for memory management decisions', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                documentId: fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0),
                dataSize: fc.integer({ min: 50, max: 500 })
              }),
              { minLength: 1, maxLength: 6 }
            ),
            (documents) => {
              const uniqueDocs = new Map();
              let totalExpectedSize = 0;
              
              documents.forEach(doc => {
                const pdfData = Buffer.alloc(doc.dataSize, 'x');
                const fileName = `${doc.documentId}.pdf`;
                
                // Track expected values
                if (uniqueDocs.has(doc.documentId)) {
                  totalExpectedSize -= uniqueDocs.get(doc.documentId);
                }
                uniqueDocs.set(doc.documentId, doc.dataSize);
                totalExpectedSize += doc.dataSize;
                
                cacheService.set(doc.documentId, pdfData, fileName);
                
                const stats = cacheService.getStats();
                
                // Property: Statistics should accurately reflect cache state
                expect(stats.totalEntries).toBe(uniqueDocs.size);
                expect(stats.totalSize).toBe(totalExpectedSize);
                expect(stats.maxSize).toBeGreaterThan(0);
                
                // Property: Hit rate should be a valid percentage
                expect(stats.hitRate).toBeGreaterThanOrEqual(0);
                expect(stats.hitRate).toBeLessThanOrEqual(100);
                
                // Property: Size in MB should be consistent with total size
                const expectedSizeMB = totalExpectedSize / (1024 * 1024);
                expect(Math.abs(cacheService.getSizeMB() - expectedSizeMB)).toBeLessThan(0.01);
                
                // Property: Usage percentage should be consistent
                const expectedUsage = (totalExpectedSize / stats.maxSize) * 100;
                expect(Math.abs(cacheService.getUsagePercentage() - expectedUsage)).toBeLessThan(0.01);
              });
            }
          ),
          { numRuns: 25 }
        );
      });
    });
  });
});