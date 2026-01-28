/**
 * Loading Steps UI Configuration - Frontend specific
 * 
 * UI-specific configuration for loading steps including messages,
 * descriptions, and icons for display in the frontend
 */

import { LoadingStep } from '../types/danfe-loading';

/**
 * UI configuration for each loading step
 */
export const LOADING_STEP_UI: Record<LoadingStep, {
  message: string;
  description: string;
  icon: string;
}> = {
  downloading: {
    message: 'Baixando arquivo...',
    description: 'Obtendo arquivo XML do servidor',
    icon: '⬇️'
  },
  generating: {
    message: 'Gerando arquivo...',
    description: 'Convertendo XML para PDF',
    icon: '⚙️'
  },
  loading: {
    message: 'Carregando visualizador...',
    description: 'Preparando visualização do PDF',
    icon: '📄'
  },
  complete: {
    message: 'Concluído',
    description: 'Processamento finalizado',
    icon: '✅'
  }
};

/**
 * Get UI configuration for a loading step
 */
export function getLoadingStepUI(step: LoadingStep) {
  return LOADING_STEP_UI[step];
}

/**
 * Loading animation configurations
 */
export const LOADING_ANIMATIONS = {
  spinner: {
    className: 'animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500',
    duration: '1s'
  },
  pulse: {
    className: 'animate-pulse',
    duration: '2s'
  },
  bounce: {
    className: 'animate-bounce',
    duration: '1s'
  }
} as const;

/**
 * Progress bar color schemes
 */
export const PROGRESS_COLORS = {
  downloading: 'bg-blue-500',
  generating: 'bg-yellow-500',
  loading: 'bg-green-500',
  complete: 'bg-green-600'
} as const;

/**
 * Step indicator colors
 */
export const STEP_INDICATOR_COLORS = {
  active: 'bg-blue-500 scale-125',
  completed: 'bg-green-500',
  pending: 'bg-gray-300'
};