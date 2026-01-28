/**
 * DANFE API End-to-End Property Tests
 * 
 * Tests the complete DANFE API workflow from request to response
 * Validates: All backend requirements (1.1-8.5)
 * 
 * Property-based testing approach:
 * - Tests complete API workflows with generated data
 * - Verifies error scenarios are handled properly
 * - Ensures resource cleanup works correctly
 * - Validates all service integrations
 */

import express from 'express';
import * as fc from 'fast-check';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

// Import the router and services
import danfeRouter from '../../routes/danfe';
import { apiLogger } from '../../services/APILogger';
import { danfeGenerator } from '../../services/DANFEGenerator';
import { pdfCacheService } from '../../services/PDFCacheService';
import { s3Service } from '../../services/S3Service';

// Mock external services
vi.mock('../../services/S3Service', () => ({
  s3Service: {
    downloadXMLFile: vi.fn(),
    testConnection: vi.fn(),
    getConfig: vi.fn(() => ({
      endpoint: 'https://s3.wasabisys.com',
      bucket: 'test-bucket',
      region: 'us-east-1'
    }))
  }
}));

vi.mock('../../services/DANFEGenerator', () => ({
  danfeGenerator: {
    convertXMLToPDF: vi.fn(),
    checkTempFiles: vi.fn(),
    listTempFiles: vi.fn(),
    cleanupOldTempFiles: vi.fn(),
    getTempDirectories: vi.fn(() => ({
      main: '/temp/danfe',
      xml: '/temp/danfe/xml',
      pdf: '/temp/danfe/pdf'
    }))
  }
}));

vi.mock('../../services/PDFCacheService', () => ({
  pdfCacheService: {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(() => ({
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      maxSize: 50 * 1024 * 1024
    })),
    getSizeMB: vi.fn(() => 0),
    getUsagePercentage: vi.fn(() => 0)
  }
}));

vi.mock('../../services/APILogger', () => ({
  apiLogger: {
    logError: vi.fn(),
    logSuccess: vi.fn()
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req: any, res, next) => {
    req.user = {
      usrCodigo: '123',
      usrNome: 'Test User',
      usrEmail: 'test@example.com'
    };
    next();
  });
  
  app.use('/api/danfe', danfeRouter);
  return app;
};

describe('DANFE API End-to-End Property Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    console.log('[E2E API Test] Initializing DANFE API end-to-end property tests...');
    app = createTestApp();
  });

  afterAll(async () => {
    console.log('[E2E API Test] Finalizing DANFE API end-to-end property tests...');
  });

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(s3Service.testConnection).mockResolvedValue(true);
    vi.mocked(danfeGenerator.listTempFiles).mockResolvedValue({
      xml: [],
      pdf: []
    });
    vi.mocked(pdfCacheService.getStats).mockReturnValue({
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      maxSize: 50 * 1024 * 1024
    });
  });

  describe('Property 17: Complete PDF Generation Workflow', () => {
    /**
     * Feature: danfe-viewer, Property 17: Complete PDF Generation Workflow
     * For any valid document ID, the complete workflow from API request to PDF response should work correctly
     * Validates: Requirements 1.1-2.5, 7.1-7.4 (S3 retrieval, PDF generation, API endpoints)
     */
    test('should complete full PDF generation workflow successfully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 100, maxLength: 500 }).map(s => 
            `<?xml version="1.0" encoding="UTF-8"?><NFe><infNFe>${s}</infNFe></NFe>`
          ),
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `${s}.xml`),
          fc.integer({ min: 1000, max: 50000 }),
          async (documentId, xmlContent, fileName, pdfSize) => {
            // Mock successful S3 download
            const xmlBuffer = Buffer.from(xmlContent, 'utf-8');
            vi.mocked(s3Service.downloadXMLFile).mockResolvedValue({
              success: true,
              data: xmlBuffer,
              fileName: fileName
            });

            // Mock successful PDF generation
            const pdfBuffer = Buffer.alloc(pdfSize, 'PDF content');
            vi.mocked(danfeGenerator.convertXMLToPDF).mockResolvedValue({
              success: true,
              pdfData: pdfBuffer
            });

            // Mock temp file check (PDF doesn't exist initially)
            vi.mocked(danfeGenerator.checkTempFiles).mockResolvedValue({
              xmlExists: false,
              pdfExists: false,
              xmlPath: undefined,
              pdfPath: undefined,
              pdfSize: undefined,
              pdfModified: undefined
            });

            // Mock cache miss
            vi.mocked(pdfCacheService.get).mockReturnValue(null);

            // Make API request
            const response = await request(app)
              .get(`/api/danfe/pdf/${documentId}`)
              .expect(200);

            // Property 1: Response should be PDF content type
            expect(response.headers['content-type']).toBe('application/pdf');

            // Property 2: Response should have correct filename
            expect(response.headers['content-disposition']).toContain(`filename="${fileName.replace('.xml', '.pdf')}"`);

            // Property 3: Response should have cache headers
            expect(response.headers['cache-control']).toContain('public');

            // Property 4: Response body should be the PDF buffer
            expect(response.body).toEqual(pdfBuffer);

            // Property 5: S3 service should be called with correct document ID
            expect(s3Service.downloadXMLFile).toHaveBeenCalledWith(documentId);

            // Property 6: DANFE generator should be called with XML data
            expect(danfeGenerator.convertXMLToPDF).toHaveBeenCalledWith(xmlBuffer, documentId);

            // Property 7: PDF should be cached after generation
            expect(pdfCacheService.set).toHaveBeenCalledWith(
              documentId,
              pdfBuffer,
              fileName.replace('.xml', '.pdf')
            );

            // Property 8: Success should be logged
            expect(apiLogger.logSuccess).toHaveBeenCalledWith(
              expect.any(String),
              '/api/danfe/pdf',
              expect.stringContaining(documentId),
              123
            );
          }
        ),
        { numRuns: 30, timeout: 15000 }
      );
    });
  });

  describe('Property 18: Status Endpoint Accuracy', () => {
    /**
     * Feature: danfe-viewer, Property 18: Status Endpoint Accuracy
     * For any document state, the status endpoint should return accurate information
     * Validates: Requirements 5.1-5.5 (Loading state management and feedback)
     */
    test('should return accurate status information for all document states', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.oneof(
            fc.constant('xml_not_found'),
            fc.constant('xml_downloaded'),
            fc.constant('pdf_cached'),
            fc.constant('pdf_ready')
          ),
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 1000, max: 50000 }),
          async (documentId, expectedStatus, xmlExists, pdfExists, fileSize) => {
            // Mock temp file state based on expected status
            vi.mocked(danfeGenerator.checkTempFiles).mockResolvedValue({
              xmlExists: expectedStatus !== 'xml_not_found',
              pdfExists: expectedStatus === 'pdf_ready',
              xmlPath: expectedStatus !== 'xml_not_found' ? `/temp/danfe/xml/${documentId}.xml` : undefined,
              pdfPath: expectedStatus === 'pdf_ready' ? `/temp/danfe/pdf/${documentId}.pdf` : undefined,
              pdfSize: expectedStatus === 'pdf_ready' ? fileSize : undefined,
              pdfModified: expectedStatus === 'pdf_ready' ? new Date() : undefined
            });

            // Mock cache state
            const cachedPDF = expectedStatus === 'pdf_cached' ? {
              pdfData: Buffer.alloc(fileSize, 'cached PDF'),
              fileName: `${documentId}.pdf`,
              createdAt: new Date(),
              lastAccessed: new Date(),
              size: fileSize,
              timestamp: new Date()
            } : null;
            
            vi.mocked(pdfCacheService.get).mockReturnValue(cachedPDF);

            // Make API request
            const response = await request(app)
              .get(`/api/danfe/status/${documentId}`)
              .expect(200);

            // Property 1: Response should be successful
            expect(response.body.success).toBe(true);

            // Property 2: Status should match expected state
            const actualStatus = response.body.status;
            if (expectedStatus === 'xml_not_found') {
              expect(actualStatus).toBe('xml_not_found');
              expect(response.body.currentStep).toBe('downloading');
              expect(response.body.progress).toBe(0);
            } else if (expectedStatus === 'xml_downloaded') {
              expect(actualStatus).toBe('xml_downloaded');
              expect(response.body.currentStep).toBe('generating');
              expect(response.body.progress).toBe(25);
            } else if (expectedStatus === 'pdf_cached') {
              expect(actualStatus).toBe('pdf_cached');
              expect(response.body.currentStep).toBe('loading');
              expect(response.body.progress).toBe(75);
            } else if (expectedStatus === 'pdf_ready') {
              expect(actualStatus).toBe('pdf_ready');
              expect(response.body.currentStep).toBe('complete');
              expect(response.body.progress).toBe(100);
            }

            // Property 3: File existence flags should be accurate
            expect(response.body.xmlExists).toBe(expectedStatus !== 'xml_not_found');
            expect(response.body.pdfExists).toBe(expectedStatus === 'pdf_ready');
            expect(response.body.pdfCached).toBe(expectedStatus === 'pdf_cached');

            // Property 4: Document ID should be returned
            expect(response.body.documentId).toBe(documentId);

            // Property 5: File size should be included when available
            if (expectedStatus === 'pdf_ready' || expectedStatus === 'pdf_cached') {
              expect(response.body.fileSize).toBe(fileSize);
            }

            // Property 6: Temp file check should be called
            expect(danfeGenerator.checkTempFiles).toHaveBeenCalledWith(documentId);

            // Property 7: Cache check should be called
            expect(pdfCacheService.get).toHaveBeenCalledWith(documentId);
          }
        ),
        { numRuns: 40, timeout: 10000 }
      );
    });
  });

  describe('Property 19: Error Handling Completeness', () => {
    /**
     * Feature: danfe-viewer, Property 19: Error Handling Completeness
     * For any error condition, the API should return appropriate error responses and log errors
     * Validates: Requirements 7.1-7.5 (Error handling and logging)
     */
    test('should handle all error scenarios with proper responses and logging', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.oneof(
            fc.constant('S3_DOWNLOAD_ERROR'),
            fc.constant('XML_PARSING_ERROR'),
            fc.constant('PDF_GENERATION_ERROR'),
            fc.constant('TEMP_FILE_ERROR'),
            fc.constant('CACHE_ERROR')
          ),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (documentId, errorType, errorMessage) => {
            // Mock different error scenarios
            switch (errorType) {
              case 'S3_DOWNLOAD_ERROR':
                vi.mocked(s3Service.downloadXMLFile).mockResolvedValue({
                  success: false,
                  error: errorMessage,
                  data: undefined
                });
                break;

              case 'XML_PARSING_ERROR':
                vi.mocked(s3Service.downloadXMLFile).mockResolvedValue({
                  success: true,
                  data: Buffer.from('invalid xml content'),
                  fileName: `${documentId}.xml`
                });
                vi.mocked(danfeGenerator.convertXMLToPDF).mockResolvedValue({
                  success: false,
                  error: errorMessage,
                  pdfData: undefined
                });
                break;

              case 'PDF_GENERATION_ERROR':
                vi.mocked(s3Service.downloadXMLFile).mockResolvedValue({
                  success: true,
                  data: Buffer.from('<?xml version="1.0"?><NFe></NFe>'),
                  fileName: `${documentId}.xml`
                });
                vi.mocked(danfeGenerator.convertXMLToPDF).mockResolvedValue({
                  success: false,
                  error: errorMessage,
                  pdfData: undefined
                });
                break;

              case 'TEMP_FILE_ERROR':
                vi.mocked(danfeGenerator.checkTempFiles).mockRejectedValue(new Error(errorMessage));
                break;

              case 'CACHE_ERROR':
                vi.mocked(pdfCacheService.get).mockImplementation(() => {
                  throw new Error(errorMessage);
                });
                break;
            }

            // Mock no cached PDF and no temp files for clean error testing
            if (errorType !== 'CACHE_ERROR') {
              vi.mocked(pdfCacheService.get).mockReturnValue(null);
            }
            
            if (errorType !== 'TEMP_FILE_ERROR') {
              vi.mocked(danfeGenerator.checkTempFiles).mockResolvedValue({
                xmlExists: false,
                pdfExists: false,
                xmlPath: undefined,
                pdfPath: undefined,
                pdfSize: undefined,
                pdfModified: undefined
              });
            }

            // Make API request and expect error response
            const response = await request(app)
              .get(`/api/danfe/pdf/${documentId}`);

            // Property 1: Response should indicate failure
            expect(response.body.success).toBe(false);

            // Property 2: Appropriate HTTP status code should be returned
            if (errorType === 'S3_DOWNLOAD_ERROR') {
              expect(response.status).toBe(404);
              expect(response.body.code).toBe('XML_NOT_FOUND');
            } else {
              expect(response.status).toBe(500);
              expect(response.body.code).toMatch(/ERROR$/);
            }

            // Property 3: Error message should be included
            expect(response.body.error).toBeDefined();
            expect(typeof response.body.error).toBe('string');

            // Property 4: Error should be logged
            await new Promise(resolve => setTimeout(resolve, 100)); // Allow async logging
            expect(apiLogger.logError).toHaveBeenCalledWith(
              expect.any(String),
              '/api/danfe/pdf',
              expect.stringContaining('error')
            );

            // Property 5: Error log should contain relevant information
            const logCalls = vi.mocked(apiLogger.logError).mock.calls;
            const relevantCall = logCalls.find(call => 
              call[1] === '/api/danfe/pdf' && call[2].includes('error')
            );
            expect(relevantCall).toBeDefined();
          }
        ),
        { numRuns: 25, timeout: 10000 }
      );
    });
  });

  describe('Property 20: Resource Management and Cleanup', () => {
    /**
     * Feature: danfe-viewer, Property 20: Resource Management and Cleanup
     * For any resource-intensive operation, proper cleanup and management should occur
     * Validates: Requirements 8.1-8.5 (Resource management, caching, cleanup)
     */
    test('should manage resources and perform cleanup correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 10 }
          ),
          fc.integer({ min: 1, max: 24 }),
          fc.integer({ min: 0, max: 100 }),
          async (documentIds, maxAgeHours, initialCacheEntries) => {
            // Mock temp files for cleanup
            const mockTempFiles = {
              xml: documentIds.map(id => `${id}.xml`),
              pdf: documentIds.map(id => `${id}.pdf`)
            };

            vi.mocked(danfeGenerator.listTempFiles).mockResolvedValue(mockTempFiles);

            // Mock cache stats
            vi.mocked(pdfCacheService.getStats).mockReturnValue({
              totalEntries: initialCacheEntries,
              totalSize: initialCacheEntries * 5000,
              hitRate: 0.8,
              maxSize: 50 * 1024 * 1024
            });

            // Test temp file cleanup
            const cleanupResponse = await request(app)
              .post('/api/danfe/temp/cleanup')
              .send({ maxAgeHours })
              .expect(200);

            // Property 1: Cleanup should be successful
            expect(cleanupResponse.body.success).toBe(true);

            // Property 2: Cleanup should report files processed
            expect(cleanupResponse.body.filesBefore).toBe(documentIds.length * 2);
            expect(cleanupResponse.body.maxAgeHours).toBe(maxAgeHours);

            // Property 3: Cleanup function should be called with correct parameters
            expect(danfeGenerator.cleanupOldTempFiles).toHaveBeenCalledWith(maxAgeHours);

            // Property 4: Success should be logged
            expect(apiLogger.logSuccess).toHaveBeenCalledWith(
              expect.any(String),
              '/api/danfe/temp/cleanup',
              expect.stringContaining('Cleaned'),
              123
            );

            // Test cache management
            const cacheStatsResponse = await request(app)
              .get('/api/danfe/cache/stats')
              .expect(200);

            // Property 5: Cache stats should be returned
            expect(cacheStatsResponse.body.success).toBe(true);
            expect(cacheStatsResponse.body.cache.totalEntries).toBe(initialCacheEntries);

            // Test cache clearing
            const cacheClearResponse = await request(app)
              .delete('/api/danfe/cache/clear')
              .expect(200);

            // Property 6: Cache clear should be successful
            expect(cacheClearResponse.body.success).toBe(true);
            expect(cacheClearResponse.body.clearedEntries).toBe(initialCacheEntries);

            // Property 7: Cache clear should be called
            expect(pdfCacheService.clear).toHaveBeenCalled();

            // Test individual cache deletion
            if (documentIds.length > 0) {
              const testDocId = documentIds[0];
              vi.mocked(pdfCacheService.has).mockReturnValue(true);
              vi.mocked(pdfCacheService.delete).mockReturnValue(true);

              const cacheDeleteResponse = await request(app)
                .delete(`/api/danfe/cache/${testDocId}`)
                .expect(200);

              // Property 8: Individual cache deletion should work
              expect(cacheDeleteResponse.body.success).toBe(true);
              expect(cacheDeleteResponse.body.removed).toBe(true);
              expect(cacheDeleteResponse.body.documentId).toBe(testDocId);

              // Property 9: Cache delete should be called with correct ID
              expect(pdfCacheService.delete).toHaveBeenCalledWith(testDocId);
            }
          }
        ),
        { numRuns: 20, timeout: 15000 }
      );
    });
  });

  describe('Property 21: Health Check Completeness', () => {
    /**
     * Feature: danfe-viewer, Property 21: Health Check Completeness
     * For any system state, health checks should accurately report service status
     * Validates: Requirements 8.1-8.5 (System monitoring and health)
     */
    test('should provide comprehensive health check information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 0, max: 10 }),
          async (s3Healthy, danfeHealthy, tempHealthy, cacheHealthy, activeRequests) => {
            // Mock service health states
            vi.mocked(s3Service.testConnection).mockResolvedValue(s3Healthy);
            
            if (danfeHealthy && tempHealthy) {
              vi.mocked(danfeGenerator.getTempDirectories).mockReturnValue({
                main: '/temp/danfe',
                xml: '/temp/danfe/xml',
                pdf: '/temp/danfe/pdf'
              });
              vi.mocked(danfeGenerator.listTempFiles).mockResolvedValue({
                xml: Array(5).fill(null).map((_, i) => `file${i}.xml`),
                pdf: Array(3).fill(null).map((_, i) => `file${i}.pdf`)
              });
            } else {
              vi.mocked(danfeGenerator.getTempDirectories).mockImplementation(() => {
                throw new Error('Temp directory error');
              });
            }

            if (cacheHealthy) {
              vi.mocked(pdfCacheService.getStats).mockReturnValue({
                totalEntries: 10,
                totalSize: 50000,
                hitRate: 0.85,
                maxSize: 50 * 1024 * 1024
              });
            } else {
              vi.mocked(pdfCacheService.getStats).mockImplementation(() => {
                throw new Error('Cache error');
              });
            }

            // Make health check request
            const response = await request(app)
              .get('/api/danfe/health');

            const allHealthy = s3Healthy && danfeHealthy && tempHealthy && cacheHealthy;

            // Property 1: HTTP status should reflect overall health
            expect(response.status).toBe(allHealthy ? 200 : 503);

            // Property 2: Response should indicate overall success
            expect(response.body.success).toBe(allHealthy);

            // Property 3: Individual service health should be reported
            expect(response.body.services).toBeDefined();
            expect(response.body.services.s3Service).toBe(s3Healthy);
            expect(response.body.services.danfeGenerator).toBe(danfeHealthy && tempHealthy);
            expect(response.body.services.tempDirectory).toBe(tempHealthy);
            expect(response.body.services.pdfCache).toBe(cacheHealthy);

            // Property 4: Active request count should be reported
            expect(response.body.services.activeRequests).toBeDefined();
            expect(typeof response.body.services.activeRequests).toBe('number');

            // Property 5: Max concurrent requests should be reported
            expect(response.body.services.maxConcurrentRequests).toBeDefined();
            expect(response.body.services.maxConcurrentRequests).toBeGreaterThan(0);

            // Property 6: Timestamp should be included
            expect(response.body.timestamp).toBeDefined();
            expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);

            // Property 7: Service checks should be called
            expect(s3Service.testConnection).toHaveBeenCalled();
            expect(danfeGenerator.getTempDirectories).toHaveBeenCalled();
            
            if (danfeHealthy && tempHealthy) {
              expect(danfeGenerator.listTempFiles).toHaveBeenCalled();
            }
            
            if (cacheHealthy) {
              expect(pdfCacheService.getStats).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });
});