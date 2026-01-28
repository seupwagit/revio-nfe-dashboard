/**
 * DANFE Loading Indicator Component
 * 
 * Provides visual feedback during DANFE processing phases with real-time status polling
 * Uses shared constants and integrates with /api/danfe/status/:documentId endpoint
 */

import { buildEndpoint } from '@fiscal/shared/constants/api-endpoints';
import { DocumentStatusResponse } from '@fiscal/shared/types/document-status-response';
import { DocumentStatus } from '@fiscal/shared/types/document-status.type';
import React, { useCallback, useEffect, useState } from 'react';
import {
    STATUS_TO_LOADING_STEP,
    getLoadingStepOrder,
    getLoadingStepProgress
} from '../constants/danfe-loading';
import { httpService } from '../services/httpService';
import { LoadingState, LoadingStep } from '../types/danfe-loading';
import { LOADING_STEP_UI, PROGRESS_COLORS, STEP_INDICATOR_COLORS } from '../ui/loadingSteps.ui';

export interface DANFELoadingIndicatorProps {
  isVisible: boolean;
  currentStep: LoadingStep;
  progress?: number;
  documentId?: string;
  className?: string;
  enableStatusPolling?: boolean;
  onStatusChange?: (status: DocumentStatusResponse) => void;
}

export const DANFELoadingIndicator: React.FC<DANFELoadingIndicatorProps> = ({
  isVisible,
  currentStep: initialStep,
  progress: initialProgress,
  documentId,
  className = '',
  enableStatusPolling = true,
  onStatusChange
}) => {
  const [currentStep, setCurrentStep] = useState<LoadingStep>(initialStep);
  const [progress, setProgress] = useState<number>(initialProgress || getLoadingStepProgress(initialStep));
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll status endpoint for real-time feedback
  const pollDocumentStatus = useCallback(async () => {
    if (!documentId || !enableStatusPolling) return;

    try {
      const statusResponse: DocumentStatusResponse = await httpService.get(
        buildEndpoint.danfeStatus(documentId),
        {
          retry: { maxRetries: 1, retryDelay: 500 },
          timeout: 5000
        }
      );

      if (statusResponse.success && statusResponse.data) {
        setDocumentStatus(statusResponse.data.status);
        setError(null);

        // Map backend status to frontend loading step
        const mappedStep = STATUS_TO_LOADING_STEP[statusResponse.data.status];
        const stepProgress = statusResponse.data.fileSize || getLoadingStepProgress(mappedStep);

        // Only update if the step has progressed forward
        if (getLoadingStepOrder(mappedStep) >= getLoadingStepOrder(currentStep)) {
          setCurrentStep(mappedStep);
          setProgress(stepProgress);
        }

        // Notify parent component of status change
        if (onStatusChange) {
          onStatusChange(statusResponse);
        }
      } else {
        setError(statusResponse.error || 'Erro ao verificar status do documento');
      }

    } catch (error: any) {
      console.warn('[DANFELoadingIndicator] Status polling failed:', error);
      // Don't set error state for polling failures to avoid UI noise
    }
  }, [documentId, enableStatusPolling, currentStep, onStatusChange]);

  // Set up status polling interval
  useEffect(() => {
    if (!isVisible || !documentId || !enableStatusPolling) return;

    // Initial status check
    pollDocumentStatus();

    // Set up polling interval (every 2 seconds)
    const interval = setInterval(pollDocumentStatus, 2000);

    return () => clearInterval(interval);
  }, [isVisible, documentId, enableStatusPolling, pollDocumentStatus]);

  // Update local state when props change
  useEffect(() => {
    setCurrentStep(initialStep);
    setProgress(initialProgress || getLoadingStepProgress(initialStep));
  }, [initialStep, initialProgress]);

  const stepInfo = LOADING_STEP_UI[currentStep];
  const progressColor = PROGRESS_COLORS[currentStep];

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
      <div className="text-center max-w-md px-6">
        {/* Loading Animation */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label={stepInfo.message}>
              {stepInfo.icon}
            </span>
          </div>
        </div>

        {/* Step Information */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {stepInfo.message}
          </h3>
          <p className="text-sm text-gray-600">
            {stepInfo.description}
          </p>
        </div>

        {/* Real-time Status Information */}
        {documentStatus && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <div>Status: <span className="font-mono">{documentStatus}</span></div>
              {documentId && (
                <div>Documento: <span className="font-mono text-xs">{documentId}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Progress Bar */}
        {progress !== undefined && progress >= 0 && progress <= 100 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`${progressColor} h-2 rounded-full transition-all duration-300 ease-out`}
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {progress.toFixed(0)}% concluído
            </p>
          </div>
        )}

        {/* Step Indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {Object.values(LOADING_STEP_UI).map((stepUI, index) => {
            const stepKey = Object.keys(LOADING_STEP_UI)[index] as LoadingStep;
            const isActive = stepKey === currentStep;
            const isCompleted = getLoadingStepOrder(currentStep) > getLoadingStepOrder(stepKey);
            
            let colorClass = STEP_INDICATOR_COLORS.pending;
            if (isActive) {
              colorClass = STEP_INDICATOR_COLORS.active;
            } else if (isCompleted) {
              colorClass = STEP_INDICATOR_COLORS.completed;
            }
            
            return (
              <div
                key={stepKey}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${colorClass}`}
                title={stepUI.message}
                role="progressbar"
                aria-label={`Etapa ${index + 1}: ${stepUI.message}`}
              />
            );
          })}
        </div>

        {/* Processing Time Indicator */}
        <div className="mt-4">
          <p className="text-xs text-gray-400">
            {enableStatusPolling 
              ? 'Status atualizado em tempo real...' 
              : 'Este processo pode levar alguns segundos...'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for managing loading state with request deduplication and status polling
 */
export function useDANFELoadingState() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    currentStep: 'downloading'
  });

  // Track active requests to prevent duplicates
  const [activeRequests, setActiveRequests] = useState<Set<string>>(new Set());

  const startLoading = useCallback((documentId: string) => {
    // Prevent duplicate requests for the same document
    if (activeRequests.has(documentId)) {
      console.warn(`[useDANFELoadingState] Request already in progress for document: ${documentId}`);
      return false;
    }

    setActiveRequests(prev => new Set(prev).add(documentId));
    setLoadingState({
      isLoading: true,
      currentStep: 'downloading',
      documentId,
      progress: getLoadingStepProgress('downloading')
    });

    return true;
  }, [activeRequests]);

  const updateStep = useCallback((step: LoadingStep, progress?: number) => {
    setLoadingState(prev => ({
      ...prev,
      currentStep: step,
      progress: progress || getLoadingStepProgress(step)
    }));
  }, []);

  const stopLoading = useCallback((documentId?: string) => {
    if (documentId) {
      setActiveRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }

    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      currentStep: 'complete',
      progress: 100
    }));
  }, []);

  const setError = useCallback((error: string, documentId?: string) => {
    if (documentId) {
      setActiveRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }

    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      currentStep: 'complete',
      error
    }));
  }, []);

  const isRequestActive = useCallback((documentId: string) => {
    return activeRequests.has(documentId);
  }, [activeRequests]);

  return {
    loadingState,
    startLoading,
    updateStep,
    stopLoading,
    setError,
    isRequestActive
  };
}

export default DANFELoadingIndicator;