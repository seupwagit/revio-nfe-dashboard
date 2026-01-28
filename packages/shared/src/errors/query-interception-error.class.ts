import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

/**
 * Erro específico para falhas na interceptação de consultas
 * 
 * Usado quando interceptação de consultas MongoDB falha,
 * construção de pipeline de agregação falha ou transformação de resultados falha
 */
export class QueryInterceptionError extends AppError {
  constructor(message: string = 'Erro na interceptação de consulta', requestId?: string) {
    super(message, ERROR_CODES.QUERY_INTERCEPTION_ERROR, 500, requestId);
    this.name = 'QueryInterceptionError';
  }
}