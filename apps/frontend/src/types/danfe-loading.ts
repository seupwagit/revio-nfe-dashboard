

export type LoadingStep = 'downloading' | 'generating' | 'loading' | 'complete';

export interface LoadingState {
  isLoading: boolean;
  currentStep: LoadingStep;
  documentId?: string;
  progress?: number;
  error?: string;
}
