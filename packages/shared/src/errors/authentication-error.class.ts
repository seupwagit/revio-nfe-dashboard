import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', requestId?: string) {
    super(message, ERROR_CODES.UNAUTHORIZED, 401, requestId);
    this.name = 'AuthenticationError';
  }
}