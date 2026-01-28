import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

export class NetworkError extends AppError {
  constructor(message: string = 'Network error', requestId?: string) {
    super(message, ERROR_CODES.NETWORK_ERROR, 503, requestId);
    this.name = 'NetworkError';
  }
}