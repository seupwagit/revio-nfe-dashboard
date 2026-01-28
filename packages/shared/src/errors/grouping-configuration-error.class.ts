import { ERROR_CODES } from '../constants/error-codes.constants';
import { AppError } from './app-error.class';

/**
 * Erro específico para configurações inválidas de agrupamento NFe
 * 
 * Usado quando configurações de agrupamento são malformadas,
 * campos inválidos são especificados ou configurações conflitantes são detectadas
 */
export class GroupingConfigurationError extends AppError {
  constructor(message: string = 'Configuração de agrupamento inválida', requestId?: string) {
    super(message, ERROR_CODES.GROUPING_CONFIG_ERROR, 400, requestId);
    this.name = 'GroupingConfigurationError';
  }
}