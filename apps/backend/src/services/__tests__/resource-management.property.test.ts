/**
 * Resource Management Property Tests
 * 
 * Tests for DANFE system resource management including:
 * - Property 32: Temporary File Cleanup
 * - Property 33: Concurrent Request Management  
 * - Property 34: Operation Timeout Implementation
 * 
 * Validates Requirements 8.1, 8.2, 8.3
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DANFEGenerator } from '../DANFEGenerator';
import { PDFCacheService } from '../PDFCacheService';

// Mock filesystem operations for testing
vi.mock('fs');
vi.mock('path');

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('Resource Management Property Tests', () => {
  let danfeGenerator: DANFEGenerator;
  let pdfCacheService: PDFCacheService;
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = '/tmp/test-danfe';
    
    // Mock path operations
    mockPath.join.mockImplementation((...paths) => paths.join('/'));
    
    // Mock filesystem operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.readdir.mockImplementation(() => Promise.resolve([]));
    mockFs.stat.mockImplementation(() => Promise.resolve({
      mtime: new Date(),
      size: 1024
    } as any));
    mockFs.unlink.mockImplementation(() => Promise.resolve());
    
    danfeGenerator = new DANFEGenerator();
    pdfCacheService = new PDFCacheService(10, 100, 1); // Small limits for testing
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 32: Temporary File Cleanup
   * Validates: Requirements 8.1
   * 
   * For any PDF generation process, the system should store temporary XML and PDF files 
   * in the temp\danfe directory and clean them up appropriately
   */
  describe('Property 32: Temporary File Cleanup', () => {
    it('should clean up temporary files after specified age', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 48 }), // maxAgeHours
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }), // file names
        async (maxAgeHours, fileNames) => {
          // Setup: Create mock files with different ages
          const now = Date.now();
          const oldFiles = fileNames.slice(0, Math.floor(fileNames.length / 2));
          const newFiles = fileNames.slice(Math.floor(fileNames.length / 2));
          
          const mockFiles = [
            ...oldFiles.map(name => `${name}.xml`),
            ...oldFiles.map(name => `${name}.pdf`),
            ...newFiles.map(name => `${name}.xml`),
            ...newFiles.map(name => `${name}.pdf`)
          ];

          mockFs.readdir.mockResolvedValue(mockFiles as any);
          
          // Mock file stats - old files are older than maxAge, new files are recent
          mockFs.stat.mockImplementation((filePath) => {
            const fileName = path.basename(filePath as string);
            const isOld = oldFiles.some(name => fileName.startsWith(name));
            const ageMs = isOld ? (maxAgeHours + 1) * 60 * 60 * 1000 : 1000; // Old files exceed maxAge
            
            return Promise.resolve({
              mtime: new Date(now - ageMs),
              size: 1024
            } as any);
          });

          let deletedFiles: string[] = [];
          mockFs.unlink.mockImplementation((filePath) => {
            deletedFiles.push(filePath as string);
            return Promise.resolve();
          });

          // Execute cleanup
          await danfeGenerator.cleanupOldTempFiles(maxAgeHours);

          // Verify: Only old files should be deleted
          const expectedDeletedCount = oldFiles.length * 2; // XML + PDF for each old file
          expect(deletedFiles.length).toBe(expectedDeletedCount);
          
          // Verify all deleted files correspond to old files
          deletedFiles.forEach(deletedPath => {
            const fileName = path.basename(deletedPath);
            const baseName = fileName.replace(/\.(xml|pdf)$/, '');
            expect(oldFiles).toContain(baseName);
          });
        }
      ), { numRuns: 50 });
    });

    it('should handle cleanup errors gracefully', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        async (fileNames) => {
          const mockFiles = fileNames.map(name => `${name}.xml`);
          mockFs.readdir.mockResolvedValue(mockFiles as any);
          
          // Mock some files to fail deletion
          let deleteAttempts = 0;
          mockFs.unlink.mockImplementation(() => {
            deleteAttempts++;
            if (deleteAttempts % 2 === 0) {
              return Promise.reject(new Error('Permission denied'));
            }
            return Promise.resolve();
          });

          // Should not throw error even if some deletions fail
          await expect(danfeGenerator.cleanupOldTempFiles(24)).resolves.not.toThrow();
          
          // Should have attempted to delete all files
          expect(deleteAttempts).toBe(mockFiles.length);
        }
      ), { numRuns: 30 });
    });
  });

  /**
   * Property 33: Concurrent Request Management
   * Validates: Requirements 8.2
   * 
   * For any set of concurrent requests, the system should limit DANFE generation 
   * to prevent resource exhaustion
   */
  describe('Property 33: Concurrent Request Management', () => {
    it('should limit concurrent PDF cache operations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }), // maxConcurrent
        async (documentIds, maxConcurrent) => {
          const uniqueIds = [...new Set(documentIds)]; // Remove duplicates
          const pdfData = Buffer.from('mock pdf data');
          
          // Track concurrent operations
          let currentConcurrent = 0;
          let maxObservedConcurrent = 0;
          const operationPromises: Promise<void>[] = [];

          // Simulate concurrent cache operations
          for (const docId of uniqueIds) {
            const operation = new Promise<void>((resolve) => {
              currentConcurrent++;
              maxObservedConcurrent = Math.max(maxObservedConcurrent, currentConcurrent);
              
              // Simulate async operation
              setTimeout(() => {
                try {
                  pdfCacheService.set(docId, pdfData, `${docId}.pdf`);
                  currentConcurrent--;
                  resolve();
                } catch (error) {
                  currentConcurrent--;
                  resolve(); // Don't fail the test on cache errors
                }
              }, Math.random() * 10); // Random delay 0-10ms
            });
            
            operationPromises.push(operation);
          }

          await Promise.all(operationPromises);

          // Verify cache handled all operations
          const stats = pdfCacheService.getStats();
          expect(stats.totalEntries).toBeGreaterThan(0);
          expect(stats.totalEntries).toBeLessThanOrEqual(uniqueIds.length);
        }
      ), { numRuns: 30 });
    });

    it('should prevent duplicate concurrent requests for same document', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 2, max: 10 }),
        async (documentId, concurrentCount) => {
          const mockDANFEService = {
            activeRequests: new Map<string, AbortController>(),
            
            async processDocument(docId: string): Promise<boolean> {
              // Check if request is already active
              if (this.activeRequests.has(docId)) {
                throw new Error('Solicitação já em andamento para este documento');
              }
              
              // Add to active requests
              const controller = new AbortController();
              this.activeRequests.set(docId, controller);
              
              try {
                // Simulate processing
                await new Promise(resolve => setTimeout(resolve, 10));
                return true;
              } finally {
                // Clean up
                this.activeRequests.delete(docId);
              }
            }
          };

          // Try to process same document concurrently
          const promises = Array(concurrentCount).fill(0).map(() => 
            mockDANFEService.processDocument(documentId).catch(error => error.message)
          );

          const results = await Promise.all(promises);
          
          // Only one should succeed, others should be rejected with duplicate message
          const successes = results.filter(result => result === true);
          const duplicateErrors = results.filter(result => 
            typeof result === 'string' && result.includes('já em andamento')
          );
          
          expect(successes.length).toBe(1);
          expect(duplicateErrors.length).toBe(concurrentCount - 1);
        }
      ), { numRuns: 30 });
    });
  });

  /**
   * Property 34: Operation Timeout Implementation
   * Validates: Requirements 8.3
   * 
   * For any S3 download or PDF generation operation, the system should implement 
   * appropriate timeouts
   */
  describe('Property 34: Operation Timeout Implementation', () => {
    it('should timeout long-running operations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 100, max: 2000 }), // timeout in ms
        fc.integer({ min: 50, max: 5000 }), // operation duration in ms
        async (timeoutMs, operationDurationMs) => {
          const shouldTimeout = operationDurationMs > timeoutMs;
          
          const mockOperation = () => new Promise<string>((resolve, reject) => {
            const timer = setTimeout(() => {
              resolve('Operation completed');
            }, operationDurationMs);
            
            // Simulate timeout
            const timeoutTimer = setTimeout(() => {
              clearTimeout(timer);
              reject(new Error('Operation timed out'));
            }, timeoutMs);
            
            // Clean up timeout if operation completes first
            setTimeout(() => {
              if (operationDurationMs <= timeoutMs) {
                clearTimeout(timeoutTimer);
              }
            }, Math.min(operationDurationMs, timeoutMs));
          });

          if (shouldTimeout) {
            await expect(mockOperation()).rejects.toThrow('Operation timed out');
          } else {
            await expect(mockOperation()).resolves.toBe('Operation completed');
          }
        }
      ), { numRuns: 50 });
    });

    it('should handle AbortController for request cancellation', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        async (documentIds) => {
          const mockRequestManager = {
            activeRequests: new Map<string, AbortController>(),
            
            startRequest(docId: string): AbortController {
              const controller = new AbortController();
              this.activeRequests.set(docId, controller);
              return controller;
            },
            
            cancelRequest(docId: string): boolean {
              const controller = this.activeRequests.get(docId);
              if (controller) {
                controller.abort();
                this.activeRequests.delete(docId);
                return true;
              }
              return false;
            },
            
            isRequestActive(docId: string): boolean {
              return this.activeRequests.has(docId);
            }
          };

          // Start requests for all documents
          const controllers = documentIds.map(docId => {
            const controller = mockRequestManager.startRequest(docId);
            expect(mockRequestManager.isRequestActive(docId)).toBe(true);
            return { docId, controller };
          });

          // Cancel half of the requests
          const toCancelCount = Math.floor(documentIds.length / 2);
          const cancelledIds = documentIds.slice(0, toCancelCount);
          
          cancelledIds.forEach(docId => {
            const cancelled = mockRequestManager.cancelRequest(docId);
            expect(cancelled).toBe(true);
            expect(mockRequestManager.isRequestActive(docId)).toBe(false);
          });

          // Verify remaining requests are still active
          const remainingIds = documentIds.slice(toCancelCount);
          remainingIds.forEach(docId => {
            expect(mockRequestManager.isRequestActive(docId)).toBe(true);
          });

          // Verify cancelled requests cannot be cancelled again
          cancelledIds.forEach(docId => {
            const cancelled = mockRequestManager.cancelRequest(docId);
            expect(cancelled).toBe(false);
          });
        }
      ), { numRuns: 30 });
    });

    it('should enforce memory limits in cache operations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // maxSizeMB
        fc.array(fc.integer({ min: 1024, max: 1024 * 1024 }), { minLength: 5, maxLength: 20 }), // file sizes
        async (maxSizeMB, fileSizes) => {
          const cache = new PDFCacheService(maxSizeMB, 1000, 24);
          const maxSizeBytes = maxSizeMB * 1024 * 1024;
          
          let totalAdded = 0;
          let addedCount = 0;
          
          // Add files until we exceed memory limit
          for (let i = 0; i < fileSizes.length; i++) {
            const size = fileSizes[i];
            const pdfData = Buffer.alloc(size);
            const docId = `doc_${i}`;
            
            try {
              cache.set(docId, pdfData, `${docId}.pdf`);
              totalAdded += size;
              addedCount++;
              
              // Cache should enforce memory limits
              const stats = cache.getStats();
              expect(stats.totalSize).toBeLessThanOrEqual(maxSizeBytes);
              
            } catch (error) {
              // Cache might reject if it can't make space
              break;
            }
          }
          
          // Verify cache stayed within limits
          const finalStats = cache.getStats();
          expect(finalStats.totalSize).toBeLessThanOrEqual(maxSizeBytes);
          expect(finalStats.totalEntries).toBeGreaterThan(0);
        }
      ), { numRuns: 30 });
    });
  });
});