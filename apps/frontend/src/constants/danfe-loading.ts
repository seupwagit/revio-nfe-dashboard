
import { DocumentStatus } from '@fiscal/shared/types/document-status.type';
import { LoadingStep } from '../types/danfe-loading';

export const STATUS_TO_LOADING_STEP: Record<DocumentStatus, LoadingStep> = {
  'xml_not_found': 'downloading',
  'xml_downloaded': 'generating',
  'pdf_cached': 'loading',
  'pdf_ready': 'complete'
};

export const getLoadingStepProgress = (step: LoadingStep): number => {
  const progressMap: Record<LoadingStep, number> = {
    'downloading': 25,
    'generating': 50,
    'loading': 75,
    'complete': 100
  };
  return progressMap[step];
};

export const getLoadingStepOrder = (step: LoadingStep): number => {
  const orderMap: Record<LoadingStep, number> = {
    'downloading': 1,
    'generating': 2,
    'loading': 3,
    'complete': 4
  };
  return orderMap[step];
};

/**
 * Helper function to determine if one step comes after another
 */
export function isStepAfter(currentStep: LoadingStep, compareStep: LoadingStep): boolean {
  return getLoadingStepOrder(currentStep) > getLoadingStepOrder(compareStep);
}
