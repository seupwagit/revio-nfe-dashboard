/**
 * DANFE Service Integration Tests
 * 
 * Tests complete flow from button click to PDF display, error scenarios,
 * and concurrent request handling as specified in task 10.2
 * 
 * Requirements Coverage:
 * - Complete flow from button click to PDF display
 * - Error scenarios and recovery mechanisms
 * - Concurrent request handling
 */

import { buildEndpoint } from '@fiscal/shared/constants/api-endpoints';
import { DocumentStatusResponse } from '@fiscal/shared/types/document-status-response';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { DANFEService } from '../../services/DANFEService';
import { httpService } from '../../services/httpService';

// Mock httpService
vi.mock('../../services/httpService', () => ({
  httpService: {
    baseURL: 'http://localhost:4001',
    get: vi.fn(),
    head: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('DANFE Service Integration Tests', () => {
  const mockDocumentId = 'test-document-123';
  const mockPdfUrl = `http://localhost:4001/api/danfe/pdf/${mockDocumentId}`;
  
  let service: DANFEService;
  let mockHttpGet: Mock;
  let mockHttpHead: Mock;

  beforeEach(() => {
    service = DANFEService.getInstance();
    mockHttpGet = httpService.get as Mock;
    mockHttpHead = httpService.head as Mock;
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Clear active requests
    service.cancelAllRequests();
  });

  afterEach(() => {
    service.cancelAllRequests();
  });

  describe('Complete Flow: Button Click to PDF Display', () => {
    it('should complete full DANFE viewing workflow successfully', async () => {
      // Mock successful status response
      const mockStatusResponse: DocumentStatusResponse = {
        success: true,
        data: {
          documentId: mockDocumentId,
          status: 'pdf_ready',
          xmlExists: true,
          pdfExists: true,
          pdfCached: true,
          fileSize: 1024000,
          lastModified: '2024-01-15T10:30:00Z'
        }
      };

      mockHttpGet.mockResolvedValue(mockStatusResponse);
      mockHttpHead.mockResolvedValue({});

      // Step 1: Get PDF URL (simulates button click)
      const pdfUrl = service.getPDFUrl(mockDocumentId);
      expect(pdfUrl).toBe(mockPdfUrl);

      // Step 2: Check document status
      const status = await service.getDocumentStatus(mockDocumentId);
      expect(status.success).toBe(true);
      expect(status.data?.status).toBe('pdf_ready');
      expect(status.data?.pdfExists).toBe(true);

      // Step 3: Verify PDF availability
      const isAvailable = await service.checkPDFAvailability(mockDocumentId);
      expect(isAvailable).toBe(true);

      // Verify API calls were made correctly
      expect(mockHttpGet).toHaveBeenCalledWith(
        buildEndpoint.danfeStatus(mockDocumentId),
        {
          retry: { maxRetries: 2, retryDelay: 1000 },
          timeout: 10000
        }
      );

      expect(mockHttpHead).toHaveBeenCalledWith(
        mockPdfUrl,
        {
          retry: { maxRetries: 1, retryDelay: 500 },
          timeout: 5000
        }
      );
    });

    it('should handle PDF generation workflow when PDF does not exist', async () => {
      // Mock status response indicating PDF needs generation
      const mockStatusResponse: DocumentStatusResponse = {
        success: true,
        data: {
          documentId: mockDocumentId,
          status: 'xml_downloaded',
          xmlExists: true,
          pdfExists: false,
          pdfCached: false
        }
      };

      mockHttpGet.mockResolvedValue(mockStatusResponse);
      mockHttpHead.mockResolvedValue({}); // Successful HEAD request triggers generation

      // Step 1: Check status (PDF not ready)
      const status = await service.getDocumentStatus(mockDocumentId);
      expect(status.data?.pdfExists).toBe(false);

      // Step 2: Ensure PDF exists (triggers generation)
      await service.ensurePDFExists(mockDocumentId);

      // Step 3: Verify PDF availability after generation
      const isAvailable = await service.checkPDFAvailability(mockDocumentId);
      expect(isAvailable).toBe(true);

      // Verify generation was triggered
      expect(mockHttpHead).toHaveBeenCalledWith(
        mockPdfUrl,
        {
          retry: { maxRetries: 3, retryDelay: 2000 },
          timeout: 60000
        }
      );
    });

    it('should track active requests during workflow', async () => {
      // Mock delayed response to test active request tracking
      mockHttpHead.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start PDF generation (async)
      const generationPromise = service.ensurePDFExists(mockDocumentId);

      // Verify request is tracked as active
      expect(service.isRequestActive(mockDocumentId)).toBe(true);
      expect(service.getActiveRequests()).toContain(mockDocumentId);

      // Wait for completion
      await generationPromise;

      // Verify request is no longer active
      expect(service.isRequestActive(mockDocumentId)).toBe(false);
      expect(service.getActiveRequests()).not.toContain(mockDocumentId);
    });
  });

  describe('Error Scenarios and Recovery Mechanisms', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = {
        status: 500,
        message: 'Network error',
        isNetworkError: true
      };

      mockHttpGet.mockRejectedValue(networkError);

      await expect(service.getDocumentStatus(mockDocumentId))
        .rejects
        .toThrow('Erro interno do servidor. Tente novamente mais tarde');
    });

    it('should handle authentication errors', async () => {
      const authError = {
        status: 401,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      };

      mockHttpGet.mockRejectedValue(authError);

      await expect(service.getDocumentStatus(mockDocumentId))
        .rejects
        .toThrow('Sessão expirada. Faça login novamente');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        status: 408,
        message: 'Request timeout',
        code: 'TIMEOUT_ERROR'
      };

      mockHttpHead.mockRejectedValue(timeoutError);

      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow('Tempo limite excedido. Tente novamente');
    });

    it('should handle document not found errors', async () => {
      const notFoundError = {
        status: 404,
        message: 'Document not found',
        code: 'NOT_FOUND'
      };

      mockHttpGet.mockRejectedValue(notFoundError);

      await expect(service.getDocumentStatus(mockDocumentId))
        .rejects
        .toThrow('Documento não encontrado no servidor');
    });

    it('should handle XML parsing errors', async () => {
      const xmlError = {
        status: 400,
        message: 'XML parsing failed',
        code: 'XML_PARSE_ERROR'
      };

      mockHttpHead.mockRejectedValue(xmlError);

      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow('Arquivo XML inválido ou corrompido');
    });

    it('should handle PDF generation errors', async () => {
      const pdfError = {
        status: 500,
        message: 'PDF generation failed',
        code: 'PDF_GENERATION_ERROR'
      };

      mockHttpHead.mockRejectedValue(pdfError);

      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow('Erro interno do servidor. Tente novamente mais tarde');
    });

    it('should clean up active requests after errors', async () => {
      const error = new Error('Test error');
      mockHttpHead.mockRejectedValue(error);

      // Start request that will fail
      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow();

      // Verify request was cleaned up
      expect(service.isRequestActive(mockDocumentId)).toBe(false);
      expect(service.getActiveRequests()).not.toContain(mockDocumentId);
    });

    it('should recover from partial failures in status check', async () => {
      // First call fails, second succeeds
      const mockStatusResponse: DocumentStatusResponse = {
        success: true,
        data: {
          documentId: mockDocumentId,
          status: 'pdf_ready',
          xmlExists: true,
          pdfExists: true,
          pdfCached: true
        }
      };

      mockHttpGet
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockStatusResponse);

      // First attempt should fail
      await expect(service.getDocumentStatus(mockDocumentId))
        .rejects
        .toThrow();

      // Second attempt should succeed
      const status = await service.getDocumentStatus(mockDocumentId);
      expect(status.success).toBe(true);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should prevent duplicate requests for same document', async () => {
      // Mock delayed response
      mockHttpHead.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start first request
      const firstRequest = service.ensurePDFExists(mockDocumentId);

      // Try to start second request for same document
      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow('Solicitação já em andamento para este documento');

      // Wait for first request to complete
      await firstRequest;

      // Now second request should be allowed
      await expect(service.ensurePDFExists(mockDocumentId))
        .resolves
        .toBeUndefined();
    });

    it('should handle multiple concurrent requests for different documents', async () => {
      const documentIds = ['doc1', 'doc2', 'doc3'];
      
      // Mock successful responses for all
      mockHttpHead.mockResolvedValue({});

      // Start concurrent requests
      const requests = documentIds.map(id => service.ensurePDFExists(id));

      // All should complete successfully
      await Promise.all(requests);

      // Verify all requests were made
      expect(mockHttpHead).toHaveBeenCalledTimes(3);
      
      // Verify no active requests remain
      expect(service.getActiveRequests()).toHaveLength(0);
    });

    it('should allow cancellation of active requests', async () => {
      // Mock delayed response
      mockHttpHead.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      // Start request
      const requestPromise = service.ensurePDFExists(mockDocumentId);

      // Verify request is active
      expect(service.isRequestActive(mockDocumentId)).toBe(true);

      // Cancel request
      const cancelled = service.cancelRequest(mockDocumentId);
      expect(cancelled).toBe(true);

      // Verify request is no longer active
      expect(service.isRequestActive(mockDocumentId)).toBe(false);

      // Original request should be rejected due to cancellation
      await expect(requestPromise).rejects.toThrow();
    });

    it('should handle cancellation of all active requests', async () => {
      const documentIds = ['doc1', 'doc2', 'doc3'];
      
      // Mock delayed responses
      mockHttpHead.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      // Start multiple requests
      const requests = documentIds.map(id => service.ensurePDFExists(id));

      // Verify all are active
      expect(service.getActiveRequests()).toHaveLength(3);

      // Cancel all requests
      service.cancelAllRequests();

      // Verify no active requests remain
      expect(service.getActiveRequests()).toHaveLength(0);

      // All requests should be rejected
      await Promise.all(
        requests.map(request => 
          expect(request).rejects.toThrow()
        )
      );
    });

    it('should handle race conditions in request management', async () => {
      let resolveFirst: () => void;
      let resolveSecond: () => void;

      // Create controlled promises
      const firstPromise = new Promise<void>(resolve => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<void>(resolve => {
        resolveSecond = resolve;
      });

      mockHttpHead
        .mockImplementationOnce(() => firstPromise)
        .mockImplementationOnce(() => secondPromise);

      // Start first request
      const firstRequest = service.ensurePDFExists(mockDocumentId);

      // Verify it's active
      expect(service.isRequestActive(mockDocumentId)).toBe(true);

      // Resolve first request
      resolveFirst!();
      await firstRequest;

      // Verify it's no longer active
      expect(service.isRequestActive(mockDocumentId)).toBe(false);

      // Start second request (should be allowed now)
      const secondRequest = service.ensurePDFExists(mockDocumentId);
      
      // Verify second request is active
      expect(service.isRequestActive(mockDocumentId)).toBe(true);

      // Resolve second request
      resolveSecond!();
      await secondRequest;

      // Verify no active requests
      expect(service.isRequestActive(mockDocumentId)).toBe(false);
    });

    it('should maintain request isolation between different document IDs', async () => {
      const doc1 = 'document-1';
      const doc2 = 'document-2';

      // Mock delayed responses
      mockHttpHead.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start requests for different documents
      const request1 = service.ensurePDFExists(doc1);
      const request2 = service.ensurePDFExists(doc2);

      // Both should be active
      expect(service.isRequestActive(doc1)).toBe(true);
      expect(service.isRequestActive(doc2)).toBe(true);
      expect(service.getActiveRequests()).toContain(doc1);
      expect(service.getActiveRequests()).toContain(doc2);

      // Cancel only first request
      service.cancelRequest(doc1);

      // First should be cancelled, second should continue
      expect(service.isRequestActive(doc1)).toBe(false);
      expect(service.isRequestActive(doc2)).toBe(true);

      // First request should fail, second should succeed
      await expect(request1).rejects.toThrow();
      await expect(request2).resolves.toBeUndefined();
    });
  });

  describe('Service State Management', () => {
    it('should maintain singleton instance', () => {
      const instance1 = DANFEService.getInstance();
      const instance2 = DANFEService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service);
    });

    it('should validate document IDs correctly', () => {
      expect(DANFEService.validateDocumentId('valid-doc-123')).toBe(true);
      expect(DANFEService.validateDocumentId('')).toBe(false);
      expect(DANFEService.validateDocumentId('   ')).toBe(false);
      expect(DANFEService.validateDocumentId(null as any)).toBe(false);
      expect(DANFEService.validateDocumentId(undefined as any)).toBe(false);
      expect(DANFEService.validateDocumentId(123 as any)).toBe(false);
      
      // Test length limit
      const longId = 'a'.repeat(101);
      expect(DANFEService.validateDocumentId(longId)).toBe(false);
    });

    it('should format file sizes correctly', () => {
      expect(DANFEService.formatFileSize(0)).toBe('0 Bytes');
      expect(DANFEService.formatFileSize(1024)).toBe('1 KB');
      expect(DANFEService.formatFileSize(1048576)).toBe('1 MB');
      expect(DANFEService.formatFileSize(1073741824)).toBe('1 GB');
      expect(DANFEService.formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should generate correct PDF URLs', () => {
      const documentId = 'test-doc-456';
      const expectedUrl = `http://localhost:4001/api/danfe/pdf/${documentId}`;
      
      expect(service.getPDFUrl(documentId)).toBe(expectedUrl);
    });

    it('should throw error for invalid document IDs in getPDFUrl', () => {
      expect(() => service.getPDFUrl('')).toThrow('ID do documento é obrigatório');
      expect(() => service.getPDFUrl('   ')).toThrow('ID do documento é obrigatório');
    });
  });

  describe('Error Message Translation', () => {
    it('should translate network errors to Portuguese', async () => {
      const networkError = { message: 'Network error occurred' };
      mockHttpGet.mockRejectedValue(networkError);

      await expect(service.getDocumentStatus(mockDocumentId))
        .rejects
        .toThrow('Erro de conexão. Verifique sua internet e tente novamente');
    });

    it('should translate timeout errors to Portuguese', async () => {
      const timeoutError = { message: 'Request timeout' };
      mockHttpHead.mockRejectedValue(timeoutError);

      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow('Tempo limite excedido. Tente novamente');
    });

    it('should translate S3 errors to Portuguese', async () => {
      const s3Error = { message: 'S3 bucket access denied' };
      mockHttpGet.mockRejectedValue(s3Error);

      await expect(service.getDocumentStatus(mockDocumentId))
        .rejects
        .toThrow('Erro ao acessar arquivo no servidor');
    });

    it('should translate XML errors to Portuguese', async () => {
      const xmlError = { message: 'XML parsing failed' };
      mockHttpHead.mockRejectedValue(xmlError);

      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow('Arquivo XML inválido ou corrompido');
    });

    it('should translate PDF errors to Portuguese', async () => {
      const pdfError = { message: 'PDF generation error' };
      mockHttpHead.mockRejectedValue(pdfError);

      await expect(service.ensurePDFExists(mockDocumentId))
        .rejects
        .toThrow('Erro ao gerar DANFE em PDF');
    });

    it('should handle unknown errors gracefully', async () => {
      const unknownError = { message: 'Some unknown error' };
      mockHttpGet.mockRejectedValue(unknownError);

      await expect(service.getDocumentStatus(mockDocumentId))
        .rejects
        .toThrow('Some unknown error');
    });
  });
});