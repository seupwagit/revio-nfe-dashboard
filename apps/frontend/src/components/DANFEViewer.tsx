/**
 * DANFE Viewer Component - Optimized with "Render Once, Manipulate DOM" Pattern
 * 
 * Complete DANFE viewing solution that integrates modal window and PDF viewer
 * Uses httpService for all API calls and integrates with real-time status polling
 * 
 * Performance Optimization:
 * - Renders once and uses direct DOM manipulation for state updates
 * - Prevents unnecessary re-renders that could cause PDF reloading
 * - Implements intelligent URL caching to reduce server load
 */

import { buildEndpoint } from '@fiscal/shared/constants/api-endpoints';
import { DocumentStatusResponse } from '@fiscal/shared/types/document-status-response';
import React, { useCallback, useEffect, useRef } from 'react';
import { STATUS_TO_LOADING_STEP } from '../constants/danfe-loading';
import { danfeService } from '../services/DANFEService';
import { httpService } from '../services/httpService';
import { intelligentURLCache } from '../services/intelligent-url-cache';
import { LoadingStep } from '../types/danfe-loading';
import { LOADING_STEP_UI } from '../ui/loadingSteps.ui';
import { DOMPerformanceMonitor, DOMStateManager, DOMUtils } from '../utils/dom-manipulation';
import DANFEModalWindow from './DANFEModalWindow';

export interface DANFEViewerProps {
  isOpen: boolean;
  documentId: string;
  documentData?: any;
  onClose: () => void;
}

// DOM State Management Class with Performance Optimization
class DANFEViewerDOMManager {
  private containerRef: HTMLDivElement | null = null;
  private currentDocumentId: string | null = null;
  private currentObjectURL: string | null = null;
  private statusPollingInterval: NodeJS.Timeout | null = null;
  private stateManager: DOMStateManager<{
    isLoading: boolean;
    currentStep: string;
    progress: number;
    error: string | null;
    pdfUrl: string | null;
    fileName: string | null;
  }>;
  private cleanupFunctions: (() => void)[] = [];

  constructor(containerRef: HTMLDivElement) {
    this.containerRef = containerRef;
    
    // Initialize state manager with proper types
    this.stateManager = new DOMStateManager<{
      isLoading: boolean;
      currentStep: string;
      progress: number;
      error: string | null;
      pdfUrl: string | null;
      fileName: string | null;
    }>({
      isLoading: false,
      currentStep: 'Verificando status...',
      progress: 0,
      error: null,
      pdfUrl: null,
      fileName: null
    });

    this.initializeDOM();
    this.setupStateListeners();
  }

  private initializeDOM(): void {
    if (!this.containerRef) return;

    const endMeasurement = DOMPerformanceMonitor.startMeasurement('DOM Initialization');

    // Create the static DOM structure that will never re-render
    this.containerRef.innerHTML = `
      <div class="danfe-viewer-container h-full">
        <!-- Loading State -->
        <div class="loading-container hidden">
          <div class="flex items-center justify-center h-full bg-gray-50">
            <div class="text-center">
              <div class="loading-spinner animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div class="loading-text text-lg font-medium text-gray-900 mb-2">Carregando DANFE...</div>
              <div class="loading-step text-sm text-gray-600 mb-2">Verificando status...</div>
              <div class="loading-progress text-xs text-gray-500">0%</div>
              <div class="loading-document text-xs text-gray-400 mt-2"></div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div class="error-container hidden">
          <div class="flex items-center justify-center h-full bg-gray-50">
            <div class="text-center max-w-md">
              <div class="text-red-500 text-4xl mb-4">❌</div>
              <h3 class="error-title text-lg font-medium text-gray-900 mb-2">Erro ao carregar DANFE</h3>
              <p class="error-message text-sm text-gray-600 mb-4"></p>
              <p class="error-document text-xs text-gray-500 mb-6"></p>
              <div class="space-x-3">
                <button class="retry-button px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium">
                  Tentar Novamente
                </button>
                <button class="download-button px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium">
                  Baixar PDF
                </button>
                <button class="close-button px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- PDF Viewer Container -->
        <div class="pdf-container hidden h-full">
          <iframe class="pdf-iframe w-full h-full border-0" title="DANFE PDF"></iframe>
        </div>
      </div>
    `;

    // Bind event listeners
    this.bindEventListeners();
    
    endMeasurement();
  }

  private setupStateListeners(): void {
    // Subscribe to state changes and update DOM accordingly
    this.cleanupFunctions.push(
      this.stateManager.subscribe('isLoading', (isLoading) => {
        if (isLoading) {
          this.showLoadingState();
        } else {
          this.hideLoadingState();
        }
      })
    );

    this.cleanupFunctions.push(
      this.stateManager.subscribe('currentStep', (step) => {
        this.updateLoadingStepInternal(step);
      })
    );

    this.cleanupFunctions.push(
      this.stateManager.subscribe('progress', (progress) => {
        this.updateLoadingProgress(progress);
      })
    );

    this.cleanupFunctions.push(
      this.stateManager.subscribe('error', (error) => {
        if (error) {
          this.showErrorState(error);
        } else {
          this.hideErrorState();
        }
      })
    );

    this.cleanupFunctions.push(
      this.stateManager.subscribe('pdfUrl', (pdfUrl) => {
        if (pdfUrl) {
          const fileName = this.stateManager.get('fileName') || 'document.pdf';
          this.showPDFState(pdfUrl, fileName);
        } else {
          this.hidePDFState();
        }
      })
    );
  }

  private bindEventListeners(): void {
    if (!this.containerRef) return;

    const retryButton = DOMUtils.querySelector(this.containerRef, '.retry-button');
    const downloadButton = DOMUtils.querySelector(this.containerRef, '.download-button');
    const closeButton = DOMUtils.querySelector(this.containerRef, '.close-button');

    if (retryButton) {
      this.cleanupFunctions.push(
        DOMUtils.addEventListener(retryButton, 'click', () => {
          if (this.currentDocumentId) {
            this.loadDocument(this.currentDocumentId);
          }
        })
      );
    }

    if (downloadButton) {
      this.cleanupFunctions.push(
        DOMUtils.addEventListener(downloadButton, 'click', () => {
          if (this.currentDocumentId) {
            const pdfUrl = danfeService.getPDFUrl(this.currentDocumentId);
            window.open(pdfUrl, '_blank');
          }
        })
      );
    }

    if (closeButton) {
      this.cleanupFunctions.push(
        DOMUtils.addEventListener(closeButton, 'click', () => {
          this.cleanup();
          // Trigger close callback (will be set externally)
          if ((window as any).danfeViewerCloseCallback) {
            (window as any).danfeViewerCloseCallback();
          }
        })
      );
    }
  }

  private showLoadingState(): void {
    if (!this.containerRef) return;

    const endMeasurement = DOMPerformanceMonitor.startMeasurement('Show Loading State');

    DOMUtils.batchDOMUpdates(() => {
      const loadingContainer = DOMUtils.querySelector(this.containerRef, '.loading-container');
      const errorContainer = DOMUtils.querySelector(this.containerRef, '.error-container');
      const pdfContainer = DOMUtils.querySelector(this.containerRef, '.pdf-container');

      DOMUtils.showElement(loadingContainer);
      DOMUtils.hideElement(errorContainer);
      DOMUtils.hideElement(pdfContainer);

      // Update document info
      const loadingDocument = DOMUtils.querySelector(this.containerRef, '.loading-document');
      if (this.currentDocumentId) {
        DOMUtils.updateTextContent(loadingDocument, `Documento: ${this.currentDocumentId}`);
      }
    });

    endMeasurement();
  }

  private hideLoadingState(): void {
    if (!this.containerRef) return;

    const loadingContainer = DOMUtils.querySelector(this.containerRef, '.loading-container');
    DOMUtils.hideElement(loadingContainer);
  }

  private updateLoadingStepInternal(step: string): void {
    if (!this.containerRef) return;

    // Translate step if it's a known LoadingStep
    const translatedStep = LOADING_STEP_UI[step as LoadingStep]?.message || step;

    const loadingStep = DOMUtils.querySelector(this.containerRef, '.loading-step');
    DOMUtils.updateTextContent(loadingStep, translatedStep);
  }

  private updateLoadingProgress(progress: number): void {
    if (!this.containerRef) return;

    const loadingProgress = DOMUtils.querySelector(this.containerRef, '.loading-progress');
    DOMUtils.updateTextContent(loadingProgress, `${progress}%`);
  }

  private showErrorState(message: string): void {
    if (!this.containerRef) return;

    const endMeasurement = DOMPerformanceMonitor.startMeasurement('Show Error State');

    DOMUtils.batchDOMUpdates(() => {
      const loadingContainer = DOMUtils.querySelector(this.containerRef, '.loading-container');
      const errorContainer = DOMUtils.querySelector(this.containerRef, '.error-container');
      const pdfContainer = DOMUtils.querySelector(this.containerRef, '.pdf-container');

      DOMUtils.hideElement(loadingContainer);
      DOMUtils.showElement(errorContainer);
      DOMUtils.hideElement(pdfContainer);

      // Update error message
      const errorMessage = DOMUtils.querySelector(this.containerRef, '.error-message');
      const errorDocument = DOMUtils.querySelector(this.containerRef, '.error-document');

      DOMUtils.updateTextContent(errorMessage, message);
      
      if (this.currentDocumentId) {
        DOMUtils.updateTextContent(errorDocument, `Documento: ${this.currentDocumentId}`);
      }
    });

    endMeasurement();
  }

  private hideErrorState(): void {
    if (!this.containerRef) return;

    const errorContainer = DOMUtils.querySelector(this.containerRef, '.error-container');
    DOMUtils.hideElement(errorContainer);
  }

  private showPDFState(pdfUrl: string, fileName: string): void {
    if (!this.containerRef) return;

    const endMeasurement = DOMPerformanceMonitor.startMeasurement('Show PDF State');

    DOMUtils.batchDOMUpdates(() => {
      const loadingContainer = DOMUtils.querySelector(this.containerRef, '.loading-container');
      const errorContainer = DOMUtils.querySelector(this.containerRef, '.error-container');
      const pdfContainer = DOMUtils.querySelector(this.containerRef, '.pdf-container');
      const pdfIframe = DOMUtils.querySelector(this.containerRef, '.pdf-iframe') as HTMLIFrameElement;

      DOMUtils.hideElement(loadingContainer);
      DOMUtils.hideElement(errorContainer);
      DOMUtils.showElement(pdfContainer);

      // Update PDF iframe
      if (pdfIframe) {
        DOMUtils.updateIframeSrc(pdfIframe, pdfUrl);
        DOMUtils.updateAttribute(pdfIframe, 'title', fileName);
      }
    });

    console.log(`[DANFEViewer] PDF displayed: ${fileName}`);
    endMeasurement();
  }

  private hidePDFState(): void {
    if (!this.containerRef) return;

    const pdfContainer = DOMUtils.querySelector(this.containerRef, '.pdf-container');
    const pdfIframe = DOMUtils.querySelector(this.containerRef, '.pdf-iframe') as HTMLIFrameElement;
    
    DOMUtils.hideElement(pdfContainer);
    DOMUtils.clearIframeSrc(pdfIframe);
  }

  showLoading(documentId: string): void {
    this.currentDocumentId = documentId;
    
    // Update state which will trigger DOM updates
    this.stateManager.update({
      isLoading: true,
      currentStep: 'Iniciando carregamento...',
      progress: 0,
      error: null,
      pdfUrl: null,
      fileName: null
    });

    // Start status polling
    this.startStatusPolling(documentId);
  }

  updateLoadingStep(step: string, progress: number = 0, fileSize?: number): void {
    const progressText = fileSize 
      ? `${progress}% (${Math.round(fileSize / 1024)}KB)`
      : `${progress}%`;

    this.stateManager.update({
      currentStep: step,
      progress: progress
    });

    // Update file size info separately to avoid re-triggering other updates
    if (fileSize) {
      const loadingProgress = DOMUtils.querySelector(this.containerRef, '.loading-progress');
      DOMUtils.updateTextContent(loadingProgress, progressText);
    }
  }

  showError(message: string, documentId: string): void {
    this.currentDocumentId = documentId;
    this.stopStatusPolling();

    this.stateManager.update({
      isLoading: false,
      error: message,
      pdfUrl: null,
      fileName: null
    });
  }

  showPDF(pdfUrl: string, fileName: string, fromCache: boolean = false): void {
    this.stopStatusPolling();

    const displayFileName = `${fileName}${fromCache ? ' (Cache)' : ''}`;

    this.stateManager.update({
      isLoading: false,
      error: null,
      pdfUrl: pdfUrl,
      fileName: displayFileName
    });

    // Cache the URL with intelligent caching
    intelligentURLCache.set(this.currentDocumentId!, pdfUrl, fromCache, {
      documentType: 'danfe'
    });
  }

  private startStatusPolling(documentId: string): void {
    this.stopStatusPolling();

    // Use throttled polling to prevent excessive requests
    const throttledPoll = DOMUtils.throttle(async () => {
      try {
          const statusResponse: DocumentStatusResponse = await httpService.get(
            `${httpService.baseURL}/api/danfe/status/${documentId}`,
            {
              retry: { maxRetries: 1, retryDelay: 500 },
              timeout: 5000
            }
          );

        if (statusResponse.success && statusResponse.data?.status) {
          const mappedStep = STATUS_TO_LOADING_STEP[statusResponse.data.status];
          const progress = this.getProgressFromStatus(statusResponse.data.status);
          
          this.updateLoadingStep(mappedStep, progress, statusResponse.data.fileSize);

          // If PDF is ready, load it
          if (statusResponse.data.status === 'pdf_ready' || statusResponse.data.status === 'pdf_cached') {
            const pdfUrl = danfeService.getPDFUrl(documentId);
            const fileName = `${documentId}.pdf`;
            const fromCache = statusResponse.data.status === 'pdf_cached';
            
            // Cache with metadata
            intelligentURLCache.set(documentId, pdfUrl, fromCache, {
              fileSize: statusResponse.data.fileSize,
              documentType: 'danfe'
            });
            
            this.showPDF(pdfUrl, fileName, fromCache);
          }
        }
      } catch (error: any) {
        console.warn('[DANFEViewer] Status polling error:', error);
        // Continue polling - don't stop on individual failures
      }
    }, 2000); // Throttle to maximum once every 2 seconds

    this.statusPollingInterval = setInterval(throttledPoll, 2000);
  }

  private stopStatusPolling(): void {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
    }
  }

  private getProgressFromStatus(status: string): number {
    const progressMap: Record<string, number> = {
      'xml_not_found': 25,
      'xml_downloaded': 50,
      'pdf_cached': 75,
      'pdf_ready': 100
    };
    return progressMap[status] || 0;
  }

  async loadDocument(documentId: string, gridData?: any): Promise<void> {
    // Guard: already loading or already showing this document
    if (this.currentDocumentId === documentId && this.stateManager.get('isLoading')) {
      console.log('[DANFEViewer] Document already loading, skipping redundant call:', documentId);
      return;
    }

    console.log('[DANFEViewer] Loading document:', documentId);
    this.currentDocumentId = documentId;
    
    const endMeasurement = DOMPerformanceMonitor.startMeasurement('Load Document');

    // Check intelligent cache first
    const cachedUrl = intelligentURLCache.get(documentId);
    if (cachedUrl) {
      console.log('[DANFEViewer] Using intelligent cached URL');
      const fileName = `${documentId}.pdf`;
      this.showPDF(cachedUrl.url, fileName, cachedUrl.fromCache);
      endMeasurement();
      return;
    }

    // Show loading state
    this.showLoading(documentId);

    try {
      // If we have grid data, we can generate the PDF directly via POST
      // This bypasses status polling and S3/DB downloads on the backend
      if (gridData) {
        this.updateLoadingStep('Gerando PDF a partir dos dados da grid...', 50);
        const pdfBlob = await danfeService.ensurePDFFromData(documentId, gridData);
        
        // Clean up previous object URL if exists
        if (this.currentObjectURL) {
          URL.revokeObjectURL(this.currentObjectURL);
        }
        
        this.currentObjectURL = URL.createObjectURL(pdfBlob);
        const fileName = `${documentId}.pdf`;
        this.showPDF(this.currentObjectURL, fileName, false);
        endMeasurement();
        return;
      }

      // Standard flow (without grid data)
      // Check initial status
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

      console.log('[DANFEViewer] Initial status:', statusResponse);

      // Update loading step based on status
      if (statusResponse.data?.status) {
        const mappedStep = STATUS_TO_LOADING_STEP[statusResponse.data.status];
        const progress = this.getProgressFromStatus(statusResponse.data.status);
        this.updateLoadingStep(mappedStep, progress, statusResponse.data.fileSize);
      }

      // If PDF is already ready, show it immediately
      if (statusResponse.data?.status === 'pdf_ready' || statusResponse.data?.status === 'pdf_cached') {
        const pdfUrl = danfeService.getPDFUrl(documentId);
        const fileName = `${documentId}.pdf`;
        const fromCache = statusResponse.data.status === 'pdf_cached';
        
        // Cache with metadata
        intelligentURLCache.set(documentId, pdfUrl, fromCache, {
          fileSize: statusResponse.data.fileSize,
          documentType: 'danfe'
        });
        
        this.showPDF(pdfUrl, fileName, fromCache);
        endMeasurement();
        return;
      }

      // If PDF is not ready, trigger generation
      console.log('[DANFEViewer] PDF not ready, triggering generation...');
      
      const pdfUrl = danfeService.getPDFUrl(documentId);
      
      // Use HEAD request to trigger PDF generation without downloading
      await httpService.head(pdfUrl, {
        retry: { maxRetries: 3, retryDelay: 2000 },
        timeout: 60000
      });

      // Status polling will handle the rest
      console.log('[DANFEViewer] PDF generation triggered, polling will handle updates');

    } catch (error: any) {
      console.error('[DANFEViewer] Error loading document:', error);
      
      // Check if it's an authentication error
      if (error.message && (
        error.message.includes('não autenticado') || 
        error.message.includes('Sessão expirada') ||
        error.message.includes('unauthorized') ||
        error.message.includes('401')
      )) {
        this.showError('Sessão expirada. Faça login novamente para visualizar o DANFE.', documentId);
      } else {
        this.showError(error.message || 'Erro ao carregar DANFE', documentId);
      }
    }

    endMeasurement();
  }

  cleanup(): void {
    this.stopStatusPolling();
    this.currentDocumentId = null;
    
    // Reset state
    this.stateManager.update({
      isLoading: false,
      error: null,
      pdfUrl: null,
      fileName: null
    });

    // Log performance stats
    DOMPerformanceMonitor.logAllStats();
  }

  destroy(): void {
    this.cleanup();
    
    // Clean up all event listeners
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    
    // Clear container
    if (this.containerRef) {
      this.containerRef.innerHTML = '';
    }

    // Clean up current object URL
    if (this.currentObjectURL) {
      URL.revokeObjectURL(this.currentObjectURL);
      this.currentObjectURL = null;
    }

    // Standard cleanup
    DOMPerformanceMonitor.clearStats();
  }
}

export const DANFEViewer: React.FC<DANFEViewerProps> = ({
  isOpen,
  documentId,
  documentData,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const domManagerRef = useRef<DANFEViewerDOMManager | null>(null);

  // Initialize DOM manager once
  useEffect(() => {
    if (containerRef.current && !domManagerRef.current) {
      domManagerRef.current = new DANFEViewerDOMManager(containerRef.current);
      
      // Set global close callback
      (window as any).danfeViewerCloseCallback = onClose;
    }

    return () => {
      // Cleanup on unmount
      if (domManagerRef.current) {
        domManagerRef.current.destroy();
        domManagerRef.current = null;
      }
      delete (window as any).danfeViewerCloseCallback;
    };
  }, [onClose]);

  // Handle modal open/close and document changes
  useEffect(() => {
    if (!domManagerRef.current) return;

    if (isOpen && documentId) {
      console.log('[DANFEViewer] Loading document:', documentId);
      domManagerRef.current.loadDocument(documentId, documentData);
    } else if (!isOpen) {
      console.log('[DANFEViewer] Modal closed - cleaning up');
      domManagerRef.current.cleanup();
    }
  }, [isOpen, documentId, documentData]);

  // Preload related documents when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      // Preload adjacent documents (this could be enhanced with actual adjacent document IDs)
      const preloadIds = generatePreloadIds(documentId);
      if (preloadIds.length > 0) {
        intelligentURLCache.preload(preloadIds).catch(error => {
          console.warn('[DANFEViewer] Preload failed:', error);
        });
      }
    }
  }, [isOpen, documentId]);

  // Get modal title based on current state
  const getModalTitle = useCallback((): string => {
    // Since we're using DOM manipulation, we need to check the DOM state
    if (!containerRef.current) return 'DANFE Viewer';

    const loadingContainer = containerRef.current.querySelector('.loading-container');
    const errorContainer = containerRef.current.querySelector('.error-container');
    const pdfContainer = containerRef.current.querySelector('.pdf-container');

    if (!loadingContainer?.classList.contains('hidden')) {
      return 'DANFE - Processando...';
    }
    
    if (!errorContainer?.classList.contains('hidden')) {
      return 'DANFE - Erro';
    }
    
    if (!pdfContainer?.classList.contains('hidden')) {
      const pdfIframe = containerRef.current.querySelector('.pdf-iframe') as HTMLIFrameElement;
      if (pdfIframe?.title) {
        return `DANFE - ${pdfIframe.title}`;
      }
      return `DANFE - ${documentId}.pdf`;
    }

    return 'DANFE Viewer';
  }, [documentId]);

  // This component renders only once - all state changes are handled
  //  via DOM manipulation
  return (
    <DANFEModalWindow
      isOpen={isOpen}
      title={getModalTitle()}
      onClose={onClose}
      initialWidth={900}
      initialHeight={700}
      minWidth={600}
      minHeight={500}
    >
      {/* Static container that will be managed by DOM manipulation */}
      <div ref={containerRef} className="h-full" />
    </DANFEModalWindow>
  );
};

/**
 * Generate document IDs for preloading based on current document
 * This is a simple implementation - could be enhanced with actual business logic
 */
function generatePreloadIds(currentDocumentId: string): string[] {
  // Simple strategy: preload documents with similar IDs
  // In a real application, this could be based on:
  // - Recently viewed documents
  // - Documents from the same batch/period
  // - User's typical viewing patterns
  
  const preloadIds: string[] = [];
  
  try {
    // Extract numeric part if document ID has a pattern
    const numericMatch = currentDocumentId.match(/(\d+)/);
    if (numericMatch) {
      const baseNumber = parseInt(numericMatch[1]);
      const basePrefix = currentDocumentId.replace(numericMatch[1], '');
      
      // Preload next few documents
      for (let i = 1; i <= 3; i++) {
        const nextId = basePrefix + (baseNumber + i);
        const prevId = basePrefix + (baseNumber - i);
        
        if (nextId !== currentDocumentId) preloadIds.push(nextId);
        if (prevId !== currentDocumentId && baseNumber - i > 0) preloadIds.push(prevId);
      }
    }
  } catch (error) {
    console.warn('[DANFEViewer] Failed to generate preload IDs:', error);
  }
  
  return preloadIds.slice(0, 5); // Limit to 5 preload documents
}

export default DANFEViewer;