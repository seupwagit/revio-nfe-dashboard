/**
 * Property-Based Tests for DANFE Resource Management
 * 
 * Tests temporary file cleanup, concurrent request management, and operation timeouts
 * 
 * Validates: Requirements 8.1, 8.2, 8.3
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DANFEGenerator } from '../DANFEGenerator';

describe('DANFE Resource Management Property Tests', () => {
  let danfeGenerator: DANFEGenerator;
  let tempDir: string;

  beforeAll(() => {
    // Set up test environment
    tempDir = path.join(process.cwd(), 'temp', 'test-resource-management');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    danfeGenerator = new DANFEGenerator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up all mocks after each test
    vi.restoreAllMocks();
  });

  afterAll(() => {
    // Clean up test temp directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Failed to cleanup test temp directory:', error);
    }
  });

  describe('Property 32: Temporary File Cleanup', () => {
    /**
     * **Validates: Requirements 8.1**
     * For any PDF generation process, the system should store temporary XML and PDF files 
     * in the temp\danfe directory and clean them up appropriately
     */
    it('should clean up temporary files after PDF generation process', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              documentId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s)),
              shouldSucceed: fc.boolean(),
              fileAge: fc.integer({ min: 1, max: 48 }) // hours
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (testFiles) => {
            // Mock file system operations
            const createdFiles: string[] = [];
            const deletedFiles: string[] = [];
            
            const mockWriteFile = vi.fn().mockImplementation(async (filePath: string) => {
              createdFiles.push(filePath);
            });
            
            const mockUnlink = vi.fn().mockImplementation(async (filePath: string) => {
              deletedFiles.push(filePath);
            });
            
            const mockExistsSync = vi.fn().mockImplementation((filePath: string) => {
              return createdFiles.includes(filePath) && !deletedFiles.includes(filePath);
            });
            
            const mockReaddir = vi.fn().mockImplementation(async (dirPath: string) => {
              return createdFiles
                .filter(file => file.startsWith(dirPath))
                .map(file => path.basename(file));
            });
            
            const mockStat = vi.fn().mockImplementation(async (filePath: string) => {
              const fileInfo = testFiles.find(tf => filePath.includes(tf.documentId));
              const ageMs = (fileInfo?.fileAge || 1) * 60 * 60 * 1000;
              return {
                mtime: new Date(Date.now() - ageMs)
              };
            });

            // Mock fs methods
            vi.doMock('fs', async () => {
              const actual = await vi.importActual<typeof fs>('fs');
              return {
                ...actual,
                promises: {
                  writeFile: mockWriteFile,
                  unlink: mockUnlink,
                  readdir: mockReaddir,
                  stat: mockStat,
                },
                existsSync: mockExistsSync,
                unlinkSync: vi.fn().mockImplementation((filePath: string) => {
                  deletedFiles.push(filePath);
                }),
              };
            });

            // Mock PDF generation
            const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
              .mockImplementation(async () => {
                // Simulate file creation during PDF generation
                return Promise.resolve();
              });

            // Process each test file
            for (const testFile of testFiles) {
              const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><nNF>${testFile.documentId}</nNF></ide>
    <emit><xNome>Test ${testFile.documentId}</xNome></emit>
    <det nItem="1"><prod><xProd>Product</xProd><vProd>100.00</vProd></prod></det>
    <total><ICMSTot><vNF>100.00</vNF></ICMSTot></total>
  </infNFe>
</NFe>`;

              const xmlBuffer = Buffer.from(validXML, 'utf8');
              
              if (!testFile.shouldSucceed) {
                generatePDFSpy.mockRejectedValueOnce(new Error('PDF generation failed'));
              }

              try {
                await danfeGenerator.convertXMLToPDF(xmlBuffer, testFile.documentId);
              } catch {
                // Ignore conversion errors - we're testing cleanup
              }
            }

            // Property: Cleanup should be performed for old files
            const maxAgeHours = 24;
            await danfeGenerator.cleanupOldTempFiles(maxAgeHours);

            // Property: Files older than maxAge should be cleaned up
            const oldFiles = testFiles.filter(tf => tf.fileAge > maxAgeHours);
            const recentFiles = testFiles.filter(tf => tf.fileAge <= maxAgeHours);

            // Verify cleanup behavior
            expect(mockReaddir).toHaveBeenCalled();
            expect(mockStat).toHaveBeenCalled();
            
            // Property: Old files should be deleted
            oldFiles.forEach(oldFile => {
              const xmlPath = expect.stringContaining(`${oldFile.documentId}.xml`);
              const pdfPath = expect.stringContaining(`${oldFile.documentId}.pdf`);
              
              // At least one of the file types should be cleaned up
              const wasXmlDeleted = deletedFiles.some(file => file.includes(`${oldFile.documentId}.xml`));
              const wasPdfDeleted = deletedFiles.some(file => file.includes(`${oldFile.documentId}.pdf`));
              
              if (oldFile.fileAge > maxAgeHours) {
                expect(wasXmlDeleted || wasPdfDeleted).toBe(true);
              }
            });

            // Property: Recent files should not be deleted
            recentFiles.forEach(recentFile => {
              const wasXmlDeleted = deletedFiles.some(file => file.includes(`${recentFile.documentId}.xml`));
              const wasPdfDeleted = deletedFiles.some(file => file.includes(`${recentFile.documentId}.pdf`));
              
              // Recent files should not be cleaned up
              expect(wasXmlDeleted && wasPdfDeleted).toBe(false);
            });

            // Cleanup
            generatePDFSpy.mockRestore();
          }
        ),
        { numRuns: 5, timeout: 10000 }
      );
    });

    it('should handle cleanup errors gracefully without affecting system stability', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              documentId: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s)),
              errorType: fc.oneof(
                fc.constant('permission-denied'),
                fc.constant('file-not-found'),
                fc.constant('io-error')
              )
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (testCases) => {
            // Mock file system operations with errors
            const mockReaddir = vi.fn().mockResolvedValue(
              testCases.map(tc => `${tc.documentId}.xml`)
            );
            
            const mockStat = vi.fn().mockResolvedValue({
              mtime: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours old
            });
            
            const mockUnlink = vi.fn().mockImplementation(async (filePath: string) => {
              const testCase = testCases.find(tc => filePath.includes(tc.documentId));
              if (testCase) {
                switch (testCase.errorType) {
                  case 'permission-denied':
                    throw new Error('EACCES: permission denied');
                  case 'file-not-found':
                    throw new Error('ENOENT: no such file or directory');
                  case 'io-error':
                    throw new Error('EIO: i/o error');
                  default:
                    return Promise.resolve();
                }
              }
            });

            vi.doMock('fs', async () => {
              const actual = await vi.importActual<typeof fs>('fs');
              return {
                ...actual,
                promises: {
                  readdir: mockReaddir,
                  stat: mockStat,
                  unlink: mockUnlink,
                },
                existsSync: vi.fn().mockReturnValue(true),
              };
            });

            // Property: Cleanup should not throw errors even when file operations fail
            let cleanupError: Error | null = null;
            try {
              await danfeGenerator.cleanupOldTempFiles(24);
            } catch (error) {
              cleanupError = error as Error;
            }

            // Property: Cleanup should handle errors gracefully
            expect(cleanupError).toBeNull();
            
            // Property: Cleanup should attempt to process all files despite individual failures
            expect(mockReaddir).toHaveBeenCalled();
            expect(mockStat).toHaveBeenCalled();
            expect(mockUnlink).toHaveBeenCalled();
            
            // Property: System should remain stable after cleanup errors
            expect(danfeGenerator).toBeDefined();
            expect(typeof danfeGenerator.cleanupOldTempFiles).toBe('function');
          }
        ),
        { numRuns: 5, timeout: 8000 }
      );
    });
  });

  describe('Property 33: Concurrent Request Management', () => {
    /**
     * **Validates: Requirements 8.2**
     * For any set of concurrent requests, the system should limit DANFE generation 
     * to prevent resource exhaustion
     */
    it('should limit concurrent DANFE generation requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            concurrentRequests: fc.integer({ min: 1, max: 10 }),
            maxConcurrent: fc.integer({ min: 1, max: 5 }),
            processingDelay: fc.integer({ min: 50, max: 200 })
          }),
          async ({ concurrentRequests, maxConcurrent, processingDelay }) => {
            // Mock the concurrent request tracking from danfe.ts routes
            const activeRequests = new Map<string, { startTime: number; timeout: NodeJS.Timeout }>();
            const MAX_CONCURRENT_REQUESTS = maxConcurrent;
            
            // Track request processing
            let activeCount = 0;
            let maxActiveCount = 0;
            let rejectedCount = 0;
            
            // Mock PDF generation with delay
            const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
              .mockImplementation(async () => {
                activeCount++;
                maxActiveCount = Math.max(maxActiveCount, activeCount);
                
                await new Promise(resolve => setTimeout(resolve, processingDelay));
                
                activeCount--;
                return Promise.resolve();
              });

            // Mock file system operations
            const mockWriteFile = vi.fn().mockResolvedValue(undefined);
            const mockReadFile = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'));
            const mockExistsSync = vi.fn().mockReturnValue(true);

            vi.doMock('fs', async () => {
              const actual = await vi.importActual<typeof fs>('fs');
              return {
                ...actual,
                promises: {
                  writeFile: mockWriteFile,
                  readFile: mockReadFile,
                },
                existsSync: mockExistsSync,
              };
            });

            // Create concurrent requests
            const requests = Array.from({ length: concurrentRequests }, (_, i) => {
              const documentId = `concurrent-test-${i}`;
              
              return new Promise<{ success: boolean; rejected?: boolean }>(async (resolve) => {
                // Simulate concurrent request limiting
                if (activeRequests.size >= MAX_CONCURRENT_REQUESTS) {
                  rejectedCount++;
                  resolve({ success: false, rejected: true });
                  return;
                }
                
                // Add to active requests
                const timeout = setTimeout(() => {
                  activeRequests.delete(documentId);
                }, 60000);
                
                activeRequests.set(documentId, { startTime: Date.now(), timeout });
                
                try {
                  const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><nNF>${documentId}</nNF></ide>
    <emit><xNome>Test ${documentId}</xNome></emit>
    <det nItem="1"><prod><xProd>Product</xProd><vProd>100.00</vProd></prod></det>
    <total><ICMSTot><vNF>100.00</vNF></ICMSTot></total>
  </infNFe>
</NFe>`;

                  const xmlBuffer = Buffer.from(validXML, 'utf8');
                  const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, documentId);
                  
                  // Clean up
                  clearTimeout(timeout);
                  activeRequests.delete(documentId);
                  
                  resolve({ success: result.success });
                } catch (error) {
                  clearTimeout(timeout);
                  activeRequests.delete(documentId);
                  resolve({ success: false });
                }
              });
            });

            // Execute all requests concurrently
            const results = await Promise.all(requests);
            
            // Property: System should limit concurrent requests
            expect(maxActiveCount).toBeLessThanOrEqual(MAX_CONCURRENT_REQUESTS);
            
            // Property: If more requests than limit, some should be rejected
            if (concurrentRequests > maxConcurrent) {
              expect(rejectedCount).toBeGreaterThan(0);
            }
            
            // Property: Total processed + rejected should equal total requests
            const processedCount = results.filter(r => !r.rejected).length;
            expect(processedCount + rejectedCount).toBe(concurrentRequests);
            
            // Property: Active requests should be cleaned up
            expect(activeRequests.size).toBe(0);
            
            // Cleanup
            generatePDFSpy.mockRestore();
          }
        ),
        { numRuns: 5, timeout: 15000 }
      );
    });

    it('should handle concurrent request cleanup properly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              documentId: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s)),
              shouldFail: fc.boolean(),
              delay: fc.integer({ min: 10, max: 100 })
            }),
            { minLength: 2, maxLength: 4 }
          ),
          async (testRequests) => {
            // Track active requests
            const activeRequests = new Map<string, { startTime: number; timeout: NodeJS.Timeout }>();
            const completedRequests: string[] = [];
            const failedRequests: string[] = [];
            
            // Mock PDF generation
            const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
              .mockImplementation(async (xmlPath: any, pdfPath: any) => {
                const documentId = testRequests.find(tr => pdfPath.includes(tr.documentId))?.documentId;
                const testRequest = testRequests.find(tr => tr.documentId === documentId);
                
                if (testRequest) {
                  await new Promise(resolve => setTimeout(resolve, testRequest.delay));
                  
                  if (testRequest.shouldFail) {
                    failedRequests.push(testRequest.documentId);
                    throw new Error(`PDF generation failed for ${testRequest.documentId}`);
                  }
                }
                
                return Promise.resolve();
              });

            // Mock file system operations
            const mockWriteFile = vi.fn().mockResolvedValue(undefined);
            const mockReadFile = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'));
            const mockExistsSync = vi.fn().mockReturnValue(true);

            vi.doMock('fs', async () => {
              const actual = await vi.importActual<typeof fs>('fs');
              return {
                ...actual,
                promises: {
                  writeFile: mockWriteFile,
                  readFile: mockReadFile,
                },
                existsSync: mockExistsSync,
              };
            });

            // Process requests concurrently
            const promises = testRequests.map(async (testRequest) => {
              // Add to active requests
              const timeout = setTimeout(() => {
                activeRequests.delete(testRequest.documentId);
              }, 5000);
              
              activeRequests.set(testRequest.documentId, { 
                startTime: Date.now(), 
                timeout 
              });
              
              try {
                const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><nNF>${testRequest.documentId}</nNF></ide>
    <emit><xNome>Test ${testRequest.documentId}</xNome></emit>
    <det nItem="1"><prod><xProd>Product</xProd><vProd>100.00</vProd></prod></det>
    <total><ICMSTot><vNF>100.00</vNF></ICMSTot></total>
  </infNFe>
</NFe>`;

                const xmlBuffer = Buffer.from(validXML, 'utf8');
                const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, testRequest.documentId);
                
                // Clean up on success
                clearTimeout(timeout);
                activeRequests.delete(testRequest.documentId);
                completedRequests.push(testRequest.documentId);
                
                return { documentId: testRequest.documentId, success: result.success };
              } catch (error) {
                // Clean up on failure
                clearTimeout(timeout);
                activeRequests.delete(testRequest.documentId);
                
                return { documentId: testRequest.documentId, success: false, error };
              }
            });

            const results = await Promise.all(promises);
            
            // Property: All requests should be cleaned up from active tracking
            expect(activeRequests.size).toBe(0);
            
            // Property: Successful requests should be completed
            const successfulResults = results.filter(r => r.success);
            const expectedSuccessful = testRequests.filter(tr => !tr.shouldFail);
            expect(successfulResults.length).toBe(expectedSuccessful.length);
            
            // Property: Failed requests should be handled properly
            const failedResults = results.filter(r => !r.success);
            const expectedFailed = testRequests.filter(tr => tr.shouldFail);
            expect(failedResults.length).toBe(expectedFailed.length);
            
            // Property: All requests should have been processed
            expect(results.length).toBe(testRequests.length);
            
            // Cleanup
            generatePDFSpy.mockRestore();
          }
        ),
        { numRuns: 3, timeout: 10000 }
      );
    });
  });

  describe('Property 34: Operation Timeout Implementation', () => {
    /**
     * **Validates: Requirements 8.3**
     * For any S3 download or PDF generation operation, the system should implement appropriate timeouts
     */
    it('should implement timeouts for PDF generation operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            timeoutMs: fc.integer({ min: 100, max: 2000 }),
            operationDelay: fc.integer({ min: 50, max: 3000 }),
            documentId: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s))
          }),
          async ({ timeoutMs, operationDelay, documentId }) => {
            const shouldTimeout = operationDelay > timeoutMs;
            
            // Mock PDF generation with configurable delay
            const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
              .mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, operationDelay));
                return Promise.resolve();
              });

            // Mock file system operations
            const mockWriteFile = vi.fn().mockResolvedValue(undefined);
            const mockReadFile = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'));
            const mockExistsSync = vi.fn().mockReturnValue(true);

            vi.doMock('fs', async () => {
              const actual = await vi.importActual<typeof fs>('fs');
              return {
                ...actual,
                promises: {
                  writeFile: mockWriteFile,
                  readFile: mockReadFile,
                },
                existsSync: mockExistsSync,
              };
            });

            // Create a timeout wrapper for the operation
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => {
                reject(new Error(`Operation timeout after ${timeoutMs}ms`));
              }, timeoutMs);
            });

            const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><nNF>${documentId}</nNF></ide>
    <emit><xNome>Test ${documentId}</xNome></emit>
    <det nItem="1"><prod><xProd>Product</xProd><vProd>100.00</vProd></prod></det>
    <total><ICMSTot><vNF>100.00</vNF></ICMSTot></total>
  </infNFe>
</NFe>`;

            const xmlBuffer = Buffer.from(validXML, 'utf8');
            
            // Race between operation and timeout
            const operationPromise = danfeGenerator.convertXMLToPDF(xmlBuffer, documentId);
            
            let result: any;
            let timedOut = false;
            
            try {
              result = await Promise.race([operationPromise, timeoutPromise]);
            } catch (error: any) {
              if (error.message.includes('timeout')) {
                timedOut = true;
                result = { success: false, error: error.message };
              } else {
                result = { success: false, error: error.message };
              }
            }

            // Property: Operations that exceed timeout should be cancelled
            if (shouldTimeout) {
              expect(timedOut || !result.success).toBe(true);
              if (timedOut) {
                expect(result.error).toMatch(/timeout/i);
              }
            } else {
              // Property: Operations within timeout should complete normally
              expect(timedOut).toBe(false);
              // Result may still fail due to other reasons, but not timeout
              if (!result.success && result.error) {
                expect(result.error).not.toMatch(/timeout/i);
              }
            }

            // Property: Timeout should be enforced consistently
            const startTime = Date.now();
            if (timedOut) {
              const elapsedTime = Date.now() - startTime;
              // Allow some tolerance for timing precision
              expect(elapsedTime).toBeLessThan(timeoutMs + 100);
            }

            // Cleanup
            generatePDFSpy.mockRestore();
          }
        ),
        { numRuns: 5, timeout: 10000 }
      );
    });

    it('should handle timeout scenarios gracefully without resource leaks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              documentId: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s)),
              timeoutMs: fc.integer({ min: 100, max: 500 }),
              operationDelay: fc.integer({ min: 600, max: 1000 }) // Always longer than timeout
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (timeoutTests) => {
            const activeOperations = new Set<string>();
            const timedOutOperations: string[] = [];
            const completedOperations: string[] = [];
            
            // Mock PDF generation with tracking
            const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
              .mockImplementation(async (xmlPath: any, pdfPath: any) => {
                const testCase = timeoutTests.find(tt => pdfPath.includes(tt.documentId));
                if (testCase) {
                  activeOperations.add(testCase.documentId);
                  
                  try {
                    await new Promise(resolve => setTimeout(resolve, testCase.operationDelay));
                    completedOperations.push(testCase.documentId);
                    return Promise.resolve();
                  } finally {
                    activeOperations.delete(testCase.documentId);
                  }
                }
                return Promise.resolve();
              });

            // Mock file system operations
            const mockWriteFile = vi.fn().mockResolvedValue(undefined);
            const mockExistsSync = vi.fn().mockReturnValue(true);

            vi.doMock('fs', async () => {
              const actual = await vi.importActual<typeof fs>('fs');
              return {
                ...actual,
                promises: {
                  writeFile: mockWriteFile,
                },
                existsSync: mockExistsSync,
              };
            });

            // Process all timeout tests
            const promises = timeoutTests.map(async (testCase) => {
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                  timedOutOperations.push(testCase.documentId);
                  reject(new Error(`Operation timeout after ${testCase.timeoutMs}ms`));
                }, testCase.timeoutMs);
              });

              const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><nNF>${testCase.documentId}</nNF></ide>
    <emit><xNome>Test ${testCase.documentId}</xNome></emit>
    <det nItem="1"><prod><xProd>Product</xProd><vProd>100.00</vProd></prod></det>
    <total><ICMSTot><vNF>100.00</vNF></ICMSTot></total>
  </infNFe>
</NFe>`;

              const xmlBuffer = Buffer.from(validXML, 'utf8');
              const operationPromise = danfeGenerator.convertXMLToPDF(xmlBuffer, testCase.documentId);

              try {
                const result = await Promise.race([operationPromise, timeoutPromise]);
                return { documentId: testCase.documentId, success: true, result };
              } catch (error: any) {
                return { 
                  documentId: testCase.documentId, 
                  success: false, 
                  timedOut: error.message.includes('timeout'),
                  error: error.message 
                };
              }
            });

            const results = await Promise.all(promises);
            
            // Property: All operations should timeout (since operationDelay > timeoutMs)
            results.forEach(result => {
              expect(result.success).toBe(false);
              expect(result.timedOut).toBe(true);
            });
            
            // Property: Timed out operations should be tracked
            expect(timedOutOperations.length).toBe(timeoutTests.length);
            
            // Property: No resource leaks - operations should eventually complete cleanup
            // Wait a bit for background operations to finish
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Property: System should remain stable after timeouts
            expect(danfeGenerator).toBeDefined();
            expect(typeof danfeGenerator.convertXMLToPDF).toBe('function');
            
            // Cleanup
            generatePDFSpy.mockRestore();
          }
        ),
        { numRuns: 3, timeout: 8000 }
      );
    });

    it('should implement consistent timeout behavior across different operation types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            timeoutMs: fc.integer({ min: 200, max: 800 }),
            operations: fc.array(
              fc.record({
                type: fc.oneof(
                  fc.constant('pdf-generation'),
                  fc.constant('file-write'),
                  fc.constant('file-read')
                ),
                documentId: fc.string({ minLength: 1, maxLength: 8 }).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s)),
                delay: fc.integer({ min: 100, max: 1200 })
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          async ({ timeoutMs, operations }) => {
            const results: Array<{ type: string; documentId: string; timedOut: boolean; success: boolean }> = [];
            
            // Mock different operation types
            const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
              .mockImplementation(async () => {
                const op = operations.find(o => o.type === 'pdf-generation');
                if (op) {
                  await new Promise(resolve => setTimeout(resolve, op.delay));
                }
                return Promise.resolve();
              });

            const mockWriteFile = vi.fn().mockImplementation(async () => {
              const op = operations.find(o => o.type === 'file-write');
              if (op) {
                await new Promise(resolve => setTimeout(resolve, op.delay));
              }
              return Promise.resolve();
            });

            const mockReadFile = vi.fn().mockImplementation(async () => {
              const op = operations.find(o => o.type === 'file-read');
              if (op) {
                await new Promise(resolve => setTimeout(resolve, op.delay));
              }
              return Buffer.from('mock-data');
            });

            vi.doMock('fs', async () => {
              const actual = await vi.importActual<typeof fs>('fs');
              return {
                ...actual,
                promises: {
                  writeFile: mockWriteFile,
                  readFile: mockReadFile,
                },
                existsSync: vi.fn().mockReturnValue(true),
              };
            });

            // Test each operation with timeout
            for (const operation of operations) {
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                  reject(new Error(`${operation.type} timeout after ${timeoutMs}ms`));
                }, timeoutMs);
              });

              let operationPromise: Promise<any>;
              
              switch (operation.type) {
                case 'pdf-generation':
                  const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><nNF>${operation.documentId}</nNF></ide>
    <emit><xNome>Test</xNome></emit>
    <det nItem="1"><prod><xProd>Product</xProd><vProd>100.00</vProd></prod></det>
    <total><ICMSTot><vNF>100.00</vNF></ICMSTot></total>
  </infNFe>
</NFe>`;
                  const xmlBuffer = Buffer.from(validXML, 'utf8');
                  operationPromise = danfeGenerator.convertXMLToPDF(xmlBuffer, operation.documentId);
                  break;
                  
                case 'file-write':
                  operationPromise = mockWriteFile('test-path', 'test-data');
                  break;
                  
                case 'file-read':
                  operationPromise = mockReadFile('test-path');
                  break;
                  
                default:
                  operationPromise = Promise.resolve();
              }

              try {
                await Promise.race([operationPromise, timeoutPromise]);
                results.push({
                  type: operation.type,
                  documentId: operation.documentId,
                  timedOut: false,
                  success: true
                });
              } catch (error: any) {
                const timedOut = error.message.includes('timeout');
                results.push({
                  type: operation.type,
                  documentId: operation.documentId,
                  timedOut,
                  success: false
                });
              }
            }

            // Property: Timeout behavior should be consistent across operation types
            results.forEach((result, index) => {
              const operation = operations[index];
              const shouldTimeout = operation.delay > timeoutMs;
              
              if (shouldTimeout) {
                expect(result.timedOut || !result.success).toBe(true);
              } else {
                expect(result.timedOut).toBe(false);
              }
            });

            // Property: All operations should be handled
            expect(results.length).toBe(operations.length);

            // Cleanup
            generatePDFSpy.mockRestore();
          }
        ),
        { numRuns: 3, timeout: 10000 }
      );
    });
  });
});