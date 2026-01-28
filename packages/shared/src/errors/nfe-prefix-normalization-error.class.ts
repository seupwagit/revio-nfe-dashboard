import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

/**
 * Erro específico para falhas na normalização de prefixos NFe
 * 
 * Usado quando normalização de chaves NFe falha,
 * operações de string falham ou tipos inválidos são fornecidos
 */
export class NFePrefixNormalizationError extends AppError {
  constructor(message: string = 'Erro na normalização de prefixo NFe', requestId?: string) {
    super(message, ERROR_CODES.NFE_PREFIX_ERROR, 500, requestId);
    this.name = 'NFePrefixNormalizationError';
  }
}