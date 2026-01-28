import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', requestId?: string) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, requestId);
    this.name = 'ValidationError';
  }
}