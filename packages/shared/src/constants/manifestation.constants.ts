/**
 * Constantes relacionadas à funcionalidade de manifestação de NFe
 */
export class ManifestationConstants {
  /** Limites de operação */
  static readonly LIMITS = {
    /** Máximo de documentos por operação de manifestação */
    MAX_DOCUMENTS_PER_OPERATION: 1000,
    /** Mínimo de documentos por operação */
    MIN_DOCUMENTS_PER_OPERATION: 1,
    /** Tamanho máximo do código do tipo de manifestação */
    MAX_TYPE_CODE_LENGTH: 10,
    /** Tamanho exato da chave de acesso NFe */
    ACCESS_KEY_LENGTH: 44
  } as const;

  /** Status possíveis para manifestações */
  static readonly STATUS = {
    AGENDADO: 'AGENDADO',
    PROCESSANDO: 'PROCESSANDO',
    CONCLUIDO: 'CONCLUIDO',
    ERRO: 'ERRO',
    CANCELADO: 'CANCELADO'
  } as const;

  /** Lista de status válidos */
  static readonly VALID_STATUS = [
    ManifestationConstants.STATUS.AGENDADO,
    ManifestationConstants.STATUS.PROCESSANDO,
    ManifestationConstants.STATUS.CONCLUIDO,
    ManifestationConstants.STATUS.ERRO,
    ManifestationConstants.STATUS.CANCELADO
  ] as const;

  /** Códigos de erro específicos */
  static readonly ERROR_CODES = {
    MANIFESTATION_TYPE_REQUIRED: 'MANIFESTATION_TYPE_REQUIRED',
    NO_DOCUMENTS_SELECTED: 'NO_DOCUMENTS_SELECTED',
    INVALID_ACCESS_KEY: 'INVALID_ACCESS_KEY',
    QUANTITY_LIMIT_EXCEEDED: 'QUANTITY_LIMIT_EXCEEDED',
    DUPLICATE_MANIFESTATION: 'DUPLICATE_MANIFESTATION',
    DATABASE_ROUTING_ERROR: 'DATABASE_ROUTING_ERROR',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    MANIFESTATION_TYPE_INVALID: 'MANIFESTATION_TYPE_INVALID',
    SYSTEM_ERROR: 'SYSTEM_ERROR'
  } as const;

  /** Mensagens de erro padronizadas */
  static readonly ERROR_MESSAGES = {
    [ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_REQUIRED]: 
      'Por favor, selecione um tipo de manifestação antes de continuar.',
    [ManifestationConstants.ERROR_CODES.NO_DOCUMENTS_SELECTED]: 
      'Selecione pelo menos um documento para manifestar.',
    [ManifestationConstants.ERROR_CODES.INVALID_ACCESS_KEY]: 
      'Uma ou mais chaves de acesso possuem formato inválido.',
    [ManifestationConstants.ERROR_CODES.QUANTITY_LIMIT_EXCEEDED]: 
      'Máximo de 1000 documentos por operação de manifestação.',
    [ManifestationConstants.ERROR_CODES.DUPLICATE_MANIFESTATION]: 
      'Alguns documentos já possuem manifestação agendada para este tipo.',
    [ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR]: 
      'Erro no roteamento de banco de dados. Tente novamente.',
    [ManifestationConstants.ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 
      'Você não possui permissão para esta operação.',
    [ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID]: 
      'Tipo de manifestação selecionado não é válido.',
    [ManifestationConstants.ERROR_CODES.SYSTEM_ERROR]: 
      'Erro interno do sistema. Nossa equipe foi notificada.'
  } as const;

  /** Configurações de paginação */
  static readonly PAGINATION = {
    /** Página padrão */
    DEFAULT_PAGE: 1,
    /** Tamanho padrão da página */
    DEFAULT_PAGE_SIZE: 50,
    /** Tamanho máximo da página */
    MAX_PAGE_SIZE: 1000,
    /** Tamanho mínimo da página */
    MIN_PAGE_SIZE: 1
  } as const;

  /** Configurações de cache */
  static readonly CACHE = {
    /** TTL para cache de tipos de manifestação (5 minutos) */
    MANIFESTATION_TYPES_TTL: 300000,
    /** TTL para cache de status de manifestação (1 minuto) */
    MANIFESTATION_STATUS_TTL: 60000,
    /** Chave base para cache de tipos */
    TYPES_CACHE_KEY: 'manifestation_types',
    /** Chave base para cache de status */
    STATUS_CACHE_KEY: 'manifestation_status'
  } as const;

  /** Regex para validação */
  static readonly REGEX = {
    /** Validação de chave de acesso NFe (44 dígitos ou prefixo NFe + 44 dígitos) */
    ACCESS_KEY: /^(NFe)?[0-9]{44}$/,
    /** Validação de código de tipo de manifestação */
    TYPE_CODE: /^[A-Z0-9]{1,10}$/
  } as const;

  /** Configurações de timeout */
  static readonly TIMEOUTS = {
    /** Timeout para operações de banco (30 segundos) */
    DATABASE_OPERATION: 30000,
    /** Timeout para validação de tipos (10 segundos) */
    TYPE_VALIDATION: 10000,
    /** Timeout para agendamento (60 segundos) */
    SCHEDULE_OPERATION: 60000
  } as const;
}