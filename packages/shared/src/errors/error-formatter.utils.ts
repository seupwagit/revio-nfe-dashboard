import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

// Error formatting utilities
export const formatErrorResponse = (error: AppError | Error, requestId?: string) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        requestId: error.requestId || requestId
      }
    };
  }

  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId
    }
  };
};