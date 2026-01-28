import { ERROR_CODES } from '../constants/error-codes.constants';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = 500,
    requestId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
  }
}