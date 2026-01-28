/**
 * Erro específico para configurações de ordenação inválidas
 */

import { AppError } from './app-error.class';

export class OrderingConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ORDERING_CONFIGURATION_ERROR', 400);
    this.name = 'OrderingConfigurationError';
    
    // Adicionar contexto como propriedade se fornecido
    if (context) {
      Object.assign(this, { context });
    }
  }
}