/**
 * Property-Based Tests for DANFE Loading Indicator Component
 * 
 * Tests loading indicator responsiveness, progress indication, processing step feedback,
 * loading state management, and request deduplication.
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */

import { DocumentStatus } from '@fiscal/shared/types/document-status';
import { DocumentStatusResponse } from '@fiscal/shared/types/document-status-response';
import { act, render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DANFELoadingIndicator, { useDANFELoadingState } from '../../../components/DANFELoadingIndicator';
import { LoadingStep } from '../../../types/danfe-loading';

// Mock httpService
vi.mock('../../../services/httpService', () => ({
  httpService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    baseURL: 'http://localhost:3001'
  }
}));

// Mock shared constants
vi.mock('@fiscal/shared/constants/api-endpoints', () => ({
  buildEndpoint: {
    danfeStatus: (documentId: string) => `/api/danfe/status/${documentId}`
  }
}));

// Test component for useDANFELoadingState hook
const TestLoadingStateComponent: React.FC<{
  onStateChange?: (state: any) => void;
  documentId?: string;
}> = ({ onStateChange, documentId }) => {
  const {
    loadingState,
    startLoading,
    updateStep,
    stopLoading,
    setError,
    isRequestActive
  } = useDANFELoadingState();

  React.useEffect(() => {
    if (onStateChange) {
      onStateChange({
        loadingState,
        startLoading,
        updateStep,
        stopLoading,
        setError,
        isRequestActive
      });
    }
  }, [loadingState, startLoading, updateStep, stopLoading, setError, isRequestActive, onStateChange]);

  return (
    <div data-testid="loading-state-test">
      <div data-testid="is-loading">{loadingState.isLoading.toString()}</div>
      <div data-testid="current-step">{loadingState.currentStep}</div>
      <div data-testid="document-id">{loadingState.documentId || 'none'}</div>
      <div data-testid="progress">{loadingState.progress || 0}</div>
      <div data-testid="error">{loadingState.error || 'none'}</div>
      {documentId && (
        <div data-testid="request-active">{isRequestActive(documentId).toString()}</div>
      )}
    </div>
  );
};

describe('DANFE Loading Indicator Property Tests', () => {
  let mockHttpService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Get the mocked httpService
    const httpServiceModule = await import('../../../services/httpService');
    mockHttpService = vi.mocked(httpServiceModule.httpService);
    
    mockHttpService.get.mockResolvedValue({
      success: true,
      data: {
        status: 'xml_downloaded' as DocumentStatus,
        xmlExists: true,
        pdfExists: false,
        pdfCached: false
      }
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  /**
   * **Property 21: Loading Indicator Responsiveness**
   * **Validates: Requirements 5.1**
   * 
   * For any "Visualizar" button click, the loading indicator should appear immediately
   */
  it('property: loading indicator appears immediately when isVisible becomes true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          currentStep: fc.constantFrom('downloading', 'generating', 'loading', 'complete') as fc.Arbitrary<LoadingStep>,
          progress: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
          documentId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          className: fc.option(fc.string(), { nil: undefined }),
          enableStatusPolling: fc.boolean()
        }),
        async ({ currentStep, progress, documentId, className, enableStatusPolling }) => {
          // Property: Initially hidden indicator should not be visible
          const { rerender } = render(
            <DANFELoadingIndicator
              isVisible={false}
              currentStep={currentStep}
              progress={progress}
              documentId={documentId}
              className={className}
              enableStatusPolling={enableStatusPolling}
            />
          );

          // Should not render when not visible
          expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

          // Property: Indicator should appear immediately when isVisible becomes true
          rerender(
            <DANFELoadingIndicator
              isVisible={true}
              currentStep={currentStep}
              progress={progress}
              documentId={documentId}
              className={className}
              enableStatusPolling={enableStatusPolling}
            />
          );

          // Should render immediately without delay
          expect(screen.getByRole('progressbar')).toBeInTheDocument();
          
          // Property: Loading animation should be present
          const loadingSpinner = screen.getByRole('progressbar').closest('div')?.querySelector('.animate-spin');
          expect(loadingSpinner).toBeInTheDocument();

          // Property: Step information should be displayed immediately
          const stepMessage = screen.getByRole('heading', { level: 3 });
          expect(stepMessage).toBeInTheDocument();
          expect(stepMessage.textContent).toBeTruthy();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Property 22: Progress Indication**
   * **Validates: Requirements 5.2**
   * 
   * For any processing phase (download, generation), the loading indicator should show appropriate progress information
   */
  it('property: progress indication reflects processing phases accurately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialStep: fc.constantFrom('downloading', 'generating', 'loading') as fc.Arbitrary<LoadingStep>,
          progressValue: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
          documentId: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async ({ initialStep, progressValue, documentId }) => {
          render(
            <DANFELoadingIndicator
              isVisible={true}
              currentStep={initialStep}
              progress={progressValue}
              documentId={documentId}
              enableStatusPolling={false}
            />
          );

          // Property: Progress bar should be present when progress is defined
          if (progressValue !== undefined && progressValue >= 0 && progressValue <= 100) {
            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toBeInTheDocument();
            expect(progressBar).toHaveAttribute('aria-valuenow', progressValue.toString());
            expect(progressBar).toHaveAttribute('aria-valuemin', '0');
            expect(progressBar).toHaveAttribute('aria-valuemax', '100');

            // Property: Progress percentage should be displayed
            const progressText = screen.getByText(`${progressValue}% concluído`);
            expect(progressText).toBeInTheDocument();

            // Property: Progress bar visual width should match value
            const progressBarFill = progressBar.querySelector('div[style*="width"]');
            expect(progressBarFill).toHaveStyle(`width: ${progressValue}%`);
          }

          // Property: Step indicators should reflect current phase
          const stepIndicators = screen.getAllByRole('progressbar').filter(el => 
            el.getAttribute('aria-label')?.includes('Etapa')
          );
          expect(stepIndicators.length).toBeGreaterThan(0);

          // At least one step indicator should be present
          expect(stepIndicators.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Property 23: Processing Step Feedback**
   * **Validates: Requirements 5.3**
   * 
   * For any processing state, the loading indicator should display descriptive text indicating the current step
   */
  it('property: processing step feedback provides descriptive text for each state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          currentStep: fc.constantFrom('downloading', 'generating', 'loading', 'complete') as fc.Arbitrary<LoadingStep>,
          documentId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
        }),
        async ({ currentStep, documentId }) => {
          render(
            <DANFELoadingIndicator
              isVisible={true}
              currentStep={currentStep}
              documentId={documentId}
              enableStatusPolling={false}
            />
          );

          // Property: Step message should be descriptive and non-empty
          const stepMessage = screen.getByRole('heading', { level: 3 });
          expect(stepMessage).toBeInTheDocument();
          expect(stepMessage.textContent).toBeTruthy();
          expect(stepMessage.textContent!.length).toBeGreaterThan(5);

          // Property: Step description should provide additional context
          const stepDescription = stepMessage.parentElement?.querySelector('p');
          expect(stepDescription).toBeInTheDocument();
          expect(stepDescription?.textContent).toBeTruthy();
          expect(stepDescription?.textContent!.length).toBeGreaterThan(10);

          // Property: Step should have appropriate icon
          const stepIcon = screen.getByRole('img');
          expect(stepIcon).toBeInTheDocument();
          expect(stepIcon).toHaveAttribute('aria-label');

          // Property: Step-specific content validation
          const messageText = stepMessage.textContent!.toLowerCase();
          const descriptionText = stepDescription?.textContent!.toLowerCase() || '';

          switch (currentStep) {
            case 'downloading':
              expect(messageText).toMatch(/baixando|download|xml/);
              break;
            case 'generating':
              expect(messageText).toMatch(/gerando|danfe|pdf/);
              break;
            case 'loading':
              expect(messageText).toMatch(/carregando|visualizador/);
              break;
            case 'complete':
              expect(messageText).toMatch(/concluído|pronto|completo/);
              break;
          }

          // Property: Description should be contextually relevant
          expect(descriptionText.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Property 24: Loading State Management**
   * **Validates: Requirements 5.4**
   * 
   * For any completion scenario (success or failure), the loading indicator should be hidden
   */
  it('property: loading state management handles completion and failure scenarios', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          documentId: fc.string({ minLength: 1, maxLength: 50 }),
          shouldComplete: fc.boolean(),
          errorMessage: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined })
        }),
        async ({ documentId, shouldComplete, errorMessage }) => {
          let hookState: any = null;

          render(
            <TestLoadingStateComponent
              documentId={documentId}
              onStateChange={(state) => { hookState = state; }}
            />
          );

          await act(async () => {
            // Property: Starting loading should set isLoading to true
            const started = hookState.startLoading(documentId);
            expect(started).toBe(true);
          });

          // Wait for state update
          await waitFor(() => {
            expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
          });

          // Property: Loading state should be active
          expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
          expect(screen.getByTestId('current-step')).toHaveTextContent('downloading');
          expect(screen.getByTestId('document-id')).toHaveTextContent(documentId);
          expect(screen.getByTestId('request-active')).toHaveTextContent('true');

          await act(async () => {
            if (shouldComplete) {
              // Property: Stopping loading should set isLoading to false
              hookState.stopLoading(documentId);
            } else if (errorMessage) {
              // Property: Setting error should set isLoading to false
              hookState.setError(errorMessage, documentId);
            }
          });

          // Wait for state update
          await waitFor(() => {
            expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
          });

          // Property: Completion should clear loading state
          expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
          expect(screen.getByTestId('current-step')).toHaveTextContent('complete');
          expect(screen.getByTestId('request-active')).toHaveTextContent('false');

          if (errorMessage) {
            // Property: Error should be reflected in state
            expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Property 25: Request Deduplication**
   * **Validates: Requirements 5.5**
   * 
   * For any document ID, the system should prevent multiple simultaneous DANFE generation requests
   */
  it('property: request deduplication prevents multiple simultaneous requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          documentId: fc.string({ minLength: 1, maxLength: 50 }),
          simultaneousRequests: fc.integer({ min: 2, max: 10 })
        }),
        async ({ documentId, simultaneousRequests }) => {
          let hookState: any = null;

          render(
            <TestLoadingStateComponent
              documentId={documentId}
              onStateChange={(state) => { hookState = state; }}
            />
          );

          await act(async () => {
            // Property: First request should succeed
            const firstRequest = hookState.startLoading(documentId);
            expect(firstRequest).toBe(true);
          });

          // Wait for state update
          await waitFor(() => {
            expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
          });

          // Property: Request should be marked as active
          expect(screen.getByTestId('request-active')).toHaveTextContent('true');

          await act(async () => {
            // Property: Subsequent requests for same document should be rejected
            for (let i = 0; i < simultaneousRequests - 1; i++) {
              const duplicateRequest = hookState.startLoading(documentId);
              expect(duplicateRequest).toBe(false);
            }
          });

          // Property: State should remain unchanged after duplicate requests
          expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
          expect(screen.getByTestId('current-step')).toHaveTextContent('downloading');
          expect(screen.getByTestId('document-id')).toHaveTextContent(documentId);
          expect(screen.getByTestId('request-active')).toHaveTextContent('true');

          await act(async () => {
            // Property: Stopping the original request should allow new requests
            hookState.stopLoading(documentId);
          });

          // Wait for state update
          await waitFor(() => {
            expect(screen.getByTestId('request-active')).toHaveTextContent('false');
          });

          await act(async () => {
            // Property: New request should succeed after previous one is stopped
            const newRequest = hookState.startLoading(documentId);
            expect(newRequest).toBe(true);
          });

          // Wait for state update
          await waitFor(() => {
            expect(screen.getByTestId('request-active')).toHaveTextContent('true');
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property: Status Polling Integration
   * Ensures that status polling works correctly with the backend endpoint
   */
  it('property: status polling integrates correctly with backend endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          documentId: fc.string({ minLength: 1, maxLength: 50 }),
          backendStatus: fc.constantFrom('xml_not_found', 'xml_downloaded', 'pdf_cached', 'pdf_ready') as fc.Arbitrary<DocumentStatus>,
          pollingEnabled: fc.boolean()
        }),
        async ({ documentId, backendStatus, pollingEnabled }) => {
          // Mock backend response
          const mockResponse: DocumentStatusResponse = {
            success: true,
            data: {
              documentId: documentId,
              status: backendStatus,
              xmlExists: backendStatus !== 'xml_not_found',
              pdfExists: backendStatus === 'pdf_ready',
              pdfCached: backendStatus === 'pdf_cached' || backendStatus === 'pdf_ready'
            }
          };

          mockHttpService.get.mockResolvedValue(mockResponse);

          const mockOnStatusChange = vi.fn();

          render(
            <DANFELoadingIndicator
              isVisible={true}
              currentStep="downloading"
              documentId={documentId}
              enableStatusPolling={pollingEnabled}
              onStatusChange={mockOnStatusChange}
            />
          );

          if (pollingEnabled && documentId) {
            // Property: Status polling should make HTTP request
            await act(async () => {
              vi.advanceTimersByTime(100); // Initial status check
            });

            await waitFor(() => {
              expect(mockHttpService.get).toHaveBeenCalledWith(
                `/api/danfe/status/${documentId}`,
                {
                  retry: { maxRetries: 1, retryDelay: 500 },
                  timeout: 5000
                }
              );
            });

            // Property: Status change callback should be called
            await waitFor(() => {
              expect(mockOnStatusChange).toHaveBeenCalledWith(mockResponse);
            });

            // Property: Status should be displayed in UI
            const statusDisplay = screen.getByText(new RegExp(backendStatus, 'i'));
            expect(statusDisplay).toBeInTheDocument();

            // Property: Polling should continue at intervals
            mockHttpService.get.mockClear();
            mockOnStatusChange.mockClear();

            await act(async () => {
              vi.advanceTimersByTime(2000); // Advance by polling interval
            });

            await waitFor(() => {
              expect(mockHttpService.get).toHaveBeenCalledTimes(1);
            });
          } else {
            // Property: No polling should occur when disabled or no documentId
            await act(async () => {
              vi.advanceTimersByTime(5000);
            });

            expect(mockHttpService.get).not.toHaveBeenCalled();
            expect(mockOnStatusChange).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property: Error Handling in Status Polling
   * Ensures that polling errors don't break the component
   */
  it('property: status polling handles errors gracefully without breaking UI', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          documentId: fc.string({ minLength: 1, maxLength: 50 }),
          errorType: fc.constantFrom('network', 'timeout', 'server_error'),
          shouldRecover: fc.boolean()
        }),
        async ({ documentId, errorType, shouldRecover }) => {
          // Mock different types of errors
          let mockError: Error;
          switch (errorType) {
            case 'network':
              mockError = new Error('Network error');
              break;
            case 'timeout':
              mockError = new Error('Request timeout');
              break;
            case 'server_error':
              mockError = new Error('Internal server error');
              break;
            default:
              mockError = new Error('Unknown error');
          }

          mockHttpService.get.mockRejectedValueOnce(mockError);

          const mockOnStatusChange = vi.fn();

          render(
            <DANFELoadingIndicator
              isVisible={true}
              currentStep="downloading"
              documentId={documentId}
              enableStatusPolling={true}
              onStatusChange={mockOnStatusChange}
            />
          );

          // Property: Initial polling should fail gracefully
          await act(async () => {
            vi.advanceTimersByTime(100);
          });

          await waitFor(() => {
            expect(mockHttpService.get).toHaveBeenCalled();
          });

          // Property: Component should remain functional after error
          expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
          expect(screen.getByRole('progressbar')).toBeInTheDocument();

          // Property: Error should not be displayed to user (graceful degradation)
          expect(screen.queryByText(/error|erro/i)).not.toBeInTheDocument();

          if (shouldRecover) {
            // Property: Subsequent polling should continue after error
            mockHttpService.get.mockResolvedValue({
              success: true,
              data: {
                status: 'xml_downloaded' as DocumentStatus,
                xmlExists: true,
                pdfExists: false,
                pdfCached: false
              }
            });

            await act(async () => {
              vi.advanceTimersByTime(2000); // Next polling interval
            });

            await waitFor(() => {
              expect(mockHttpService.get).toHaveBeenCalledTimes(2);
            });

            // Property: Recovery should work normally
            expect(mockOnStatusChange).toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});