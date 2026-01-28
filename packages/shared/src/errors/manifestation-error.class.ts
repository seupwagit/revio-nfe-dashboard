import { AppError } from './app-error.class';

/**
 * Classe base para erros relacionados à manifestação de NFe
 */
export class ManifestationError extends AppError {
  constructor(
    message: string,
    code: string = 'MANIFESTATION_ERROR',
    statusCode: number = 400,
    requestId?: string
  ) {
    super(message, code, statusCode, requestId);
    this.name = 'ManifestationError';
  }
}

/**
 * Erro quando nenhum tipo de manifestação foi selecionado
 */
export class ManifestationTypeRequiredError extends ManifestationError {
  constructor(requestId?: string) {
    super(
      'Por favor, selecione um tipo de manifestação antes de continuar.',
      'MANIFESTATION_TYPE_REQUIRED',
      400,
      requestId
    );
    this.name = 'ManifestationTypeRequiredError';
  }
}

/**
 * Erro quando nenhum documento foi selecionado
 */
export class NoDocumentsSelectedError extends ManifestationError {
  constructor(requestId?: string) {
    super(
      'Selecione pelo menos um documento para manifestar.',
      'NO_DOCUMENTS_SELECTED',
      400,
      requestId
    );
    this.name = 'NoDocumentsSelectedError';
  }
}

/**
 * Erro quando uma ou mais chaves de acesso são inválidas
 */
export class InvalidAccessKeyError extends ManifestationError {
  constructor(invalidKeys: string[] = [], requestId?: string) {
    const message = invalidKeys.length > 0 
      ? `Chaves de acesso inválidas: ${invalidKeys.join(', ')}`
      : 'Uma ou mais chaves de acesso possuem formato inválido.';
    
    super(message, 'INVALID_ACCESS_KEY', 400, requestId);
    this.name = 'InvalidAccessKeyError';
  }
}

/**
 * Erro quando o limite de documentos por operação é excedido
 */
export class QuantityLimitExceededError extends ManifestationError {
  constructor(quantity: number, limit: number = 1000, requestId?: string) {
    super(
      `Máximo de ${limit} documentos por operação de manifestação. Quantidade solicitada: ${quantity}.`,
      'QUANTITY_LIMIT_EXCEEDED',
      400,
      requestId
    );
    this.name = 'QuantityLimitExceededError';
  }
}

/**
 * Erro quando tentativa de criar manifestação duplicada
 */
export class DuplicateManifestationError extends ManifestationError {
  constructor(duplicateCount: number, requestId?: string) {
    const message = duplicateCount === 1
      ? 'Um documento já possui manifestação agendada para este tipo.'
      : `${duplicateCount} documentos já possuem manifestação agendada para este tipo.`;
    
    super(message, 'DUPLICATE_MANIFESTATION', 409, requestId);
    this.name = 'DuplicateManifestationError';
  }
}

/**
 * Erro de roteamento de banco de dados
 */
export class DatabaseRoutingError extends ManifestationError {
  constructor(requestId?: string) {
    super(
      'Erro no roteamento de banco de dados. Tente novamente.',
      'DATABASE_ROUTING_ERROR',
      500,
      requestId
    );
    this.name = 'DatabaseRoutingError';
  }
}

/**
 * Erro quando usuário não possui permissão para a operação
 */
export class InsufficientPermissionsError extends ManifestationError {
  constructor(requestId?: string) {
    super(
      'Você não possui permissão para esta operação.',
      'INSUFFICIENT_PERMISSIONS',
      403,
      requestId
    );
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Erro quando tipo de manifestação é inválido
 */
export class InvalidManifestationTypeError extends ManifestationError {
  constructor(manifestationType: string, requestId?: string) {
    super(
      `Tipo de manifestação '${manifestationType}' não é válido ou não está disponível.`,
      'MANIFESTATION_TYPE_INVALID',
      400,
      requestId
    );
    this.name = 'InvalidManifestationTypeError';
  }
}