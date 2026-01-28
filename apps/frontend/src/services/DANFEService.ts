/**
 * DANFE Service
 * 
 * Frontend service class that orchestrates DANFE viewing using direct PDF URL approach
 * Uses httpService for all API calls and integrates with status polling system
 * 
 * ARCHITECTURAL COMPLIANCE:
 * - Uses httpService.ts for ALL API calls (no direct fetch)
 * - No direct localStorage access for tokens
 * - Implements resilience patterns with retry logic
 * - Uses shared constants and types from monorepo packages
 */

import { buildEndpoint } from '@fiscal/shared/constants/api-endpoints';
import { DocumentStatusResponse } from '@fiscal/shared/types/document-status-response';
import { httpService } from './httpService';

export interface DANFEError {
  code: string;
  message: string;
  details?: any;
}

export class DANFEService {
  private static instance: DANFEService;
  private activeRequests: Map<string, AbortController> = new Map();
  private activePromises: Map<string, Promise<any>> = new Map();

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DANFEService {
    if (!DANFEService.instance) {
      DANFEService.instance = new DANFEService();
    }
    return DANFEService.instance;
  }

  /**
   * Get PDF URL for a document (serves PDF directly)
   * Uses httpService baseURL to construct proper URL
   */
  getPDFUrl(documentId: any): string {
    const id = typeof documentId === 'string' ? documentId : String(documentId || '');
    
    if (!id || id.trim().length === 0) {
      throw new Error('ID do documento é obrigatório');
    }

    return `${httpService.baseURL}${buildEndpoint.danfePdf(id)}`;
  }

  /**
   * Get detailed document status using the new status endpoint
   * Provides real-time feedback without generating PDF
   */
  async getDocumentStatus(documentId: any): Promise<DocumentStatusResponse> {
    const id = typeof documentId === 'string' ? documentId : String(documentId || '');
    
    if (!id || id.trim().length === 0) {
      throw new Error('ID do documento é obrigatório');
    }

    try {
      const statusResponse: DocumentStatusResponse = await httpService.get(
        buildEndpoint.danfeStatus(documentId),
        {
          retry: { maxRetries: 2, retryDelay: 1000 },
          timeout: 10000
        }
      );

      if (!statusResponse.success) {
        throw new Error(statusResponse.error || 'Erro ao verificar status do documento');
      }

      return statusResponse;

    } catch (error: any) {
      console.error(`[DANFEService] Error getting document status for ${documentId}:`, error);
      throw new Error(this.translateErrorMessage(error.message || error.toString()));
    }
  }

  /**
   * Check if PDF is available for a document using httpService HEAD request
   * COMPLIANT: Uses httpService instead of direct fetch
   */
  async checkPDFAvailability(documentId: string): Promise<boolean> {
    try {
      const pdfUrl = this.getPDFUrl(documentId);
      
      // Use httpService for HEAD request with proper error handling
      await httpService.head(pdfUrl, {
        retry: { maxRetries: 1, retryDelay: 500 },
        timeout: 5000
      });

      return true;

    } catch (error) {
      console.warn(`[DANFEService] PDF not available for ${documentId}:`, error);
      return false;
    }
  }

  /**
   * Trigger PDF generation by accessing the PDF endpoint
   * This replaces the old generateDANFE method with a simpler approach
   */
  async ensurePDFExists(documentId: any): Promise<void> {
    const id = typeof documentId === 'string' ? documentId : String(documentId || '');
    
    if (!id || id.trim().length === 0) {
      throw new Error('ID do documento é obrigatório');
    }

    // Reuse existing promise if active
    const activePromise = this.activePromises.get(id);
    if (activePromise) {
      return activePromise;
    }

    // Create new request
    const abortController = new AbortController();
    this.activeRequests.set(id, abortController);

    const promise = (async () => {
      try {
        console.log(`[DANFEService] Ensuring PDF exists for document: ${id}`);
        const pdfUrl = this.getPDFUrl(id);
        
        await httpService.head(pdfUrl, {
          retry: { maxRetries: 3, retryDelay: 2000 },
          timeout: 60000
        });
      } finally {
        this.activeRequests.delete(id);
        this.activePromises.delete(id);
      }
    })();

    this.activePromises.set(id, promise);
    return promise;
  }

  /**
   * Generates PDF using data already present in the grid
   * Returns a Blob that can be used directly via URL.createObjectURL
   */
  async ensurePDFFromData(documentId: any, data: any): Promise<Blob> {
    const id = typeof documentId === 'string' ? documentId : String(documentId || '');
    
    if (!id || id.trim().length === 0) {
      throw new Error('ID do documento é obrigatório');
    }

    if (!data) {
      throw new Error('Dados do documento são obrigatórios');
    }

    // Reuse existing promise if active
    const activePromise = this.activePromises.get(id);
    if (activePromise) {
      console.log(`[DANFEService] Reusing active promise for: ${id}`);
      return activePromise;
    }

    const abortController = new AbortController();
    this.activeRequests.set(id, abortController);

    const promise = (async () => {
      try {
        console.log(`[DANFEService] Generating PDF from grid data for document: ${id}`);
        const endpoint = `${httpService.baseURL}${buildEndpoint.danfePdf(id)}`;
        
        const pdfBlob = await httpService.postBlob(endpoint, data, {
          timeout: 60000
        });

        console.log(`[DANFEService] PDF successfully generated from grid data for: ${id}`);
        return pdfBlob;
      } finally {
        this.activeRequests.delete(id);
        this.activePromises.delete(id);
      }
    })();

    this.activePromises.set(id, promise);
    return promise;
  }

  /**
   * Cancel an active request
   */
  cancelRequest(documentId: string): boolean {
    const abortController = this.activeRequests.get(documentId);
    if (abortController) {
      abortController.abort();
      this.activeRequests.delete(documentId);
      console.log(`[DANFEService] Cancelled request for document: ${documentId}`);
      return true;
    }
    return false;
  }

  /**
   * Check if a request is currently active for a document
   */
  isRequestActive(documentId: string): boolean {
    return this.activeRequests.has(documentId);
  }

  /**
   * Get list of active requests
   */
  getActiveRequests(): string[] {
    return Array.from(this.activeRequests.keys());
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    for (const [documentId, abortController] of this.activeRequests) {
      abortController.abort();
      console.log(`[DANFEService] Cancelled request for document: ${documentId}`);
    }
    this.activeRequests.clear();
  }

  /**
   * Translate technical error messages to user-friendly Portuguese
   */
  private translateErrorMessage(message: string): string {
    if (!message) {
      return 'Erro desconhecido';
    }

    const lowerMessage = message.toLowerCase();

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente';
    }

    // Timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('aborted')) {
      return 'Tempo limite excedido. Tente novamente';
    }

    // S3/Storage errors
    if (lowerMessage.includes('s3') || lowerMessage.includes('storage') || lowerMessage.includes('bucket')) {
      return 'Erro ao acessar arquivo no servidor';
    }

    // XML errors
    if (lowerMessage.includes('xml') || lowerMessage.includes('parsing')) {
      return 'Arquivo XML inválido ou corrompido';
    }

    // PDF errors
    if (lowerMessage.includes('pdf') || lowerMessage.includes('danfe')) {
      return 'Erro ao gerar DANFE em PDF';
    }

    // Authentication errors
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('token')) {
      return 'Sessão expirada. Faça login novamente';
    }

    // File not found
    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
      return 'Documento não encontrado no servidor';
    }

    // Server errors
    if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
      return 'Erro interno do servidor. Tente novamente mais tarde';
    }

    // Return original message if no translation found
    return message;
  }

  /**
   * Validate document ID format
   */
  static validateDocumentId(documentId: string): boolean {
    if (!documentId || typeof documentId !== 'string') {
      return false;
    }

    const trimmed = documentId.trim();
    return trimmed.length > 0 && trimmed.length <= 100; // Reasonable length limit
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Download PDF file using URL (opens in new tab/window)
   */
  static downloadPDF(pdfUrl: string, fileName: string = 'danfe.pdf'): void {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.target = '_blank'; // Open in new tab as fallback
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`[DANFEService] Initiated download for: ${fileName}`);
    } catch (error) {
      console.error('[DANFEService] Error downloading PDF:', error);
      // Fallback: open in new window
      window.open(pdfUrl, '_blank');
    }
  }
}

// Export singleton instance
export const danfeService = DANFEService.getInstance();

// Export default
export default DANFEService;