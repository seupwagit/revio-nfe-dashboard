import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

export class DANFEError extends AppError {
  constructor(message: string = 'DANFE generation failed', requestId?: string) {
    super(message, ERROR_CODES.DANFE_GENERATION_FAILED, 500, requestId);
    this.name = 'DANFEError';
  }
}