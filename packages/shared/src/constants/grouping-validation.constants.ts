/**
 * Constantes para validação de configurações de agrupamento NFe
 * 
 * Define regras de validação, limites e padrões para
 * validação de configurações de agrupamento configurável
 */

/**
 * Limites de validação para configurações de agrupamento
 */
export const GROUPING_VALIDATION_LIMITS = {
  // Limites de chave NFe
  MIN_KEY_LENGTH: 44, // Chave sem prefixo NFe
  MAX_KEY_LENGTH: 47, // Chave com prefixo NFe
  
  // Limites de configuração
  MAX_GROUP_BY_FIELDS: 5, // Máximo de campos para agrupamento
  MAX_ORDER_BY_FIELDS: 3, // Máximo de campos para ordenação
  
  // Limites de string
  MIN_FIELD_NAME_LENGTH: 2,
  MAX_FIELD_NAME_LENGTH: 50,
  
  // Limites de performance
  MAX_VALIDATION_RETRIES: 3,
  VALIDATION_TIMEOUT_MS: 5000,
} as const;

/**
 * Padrões regex para validação de configurações
 */
export const GROUPING_VALIDATION_PATTERNS = {
  // Validação de nome de campo (deve começar com letra maiúscula ou underscore)
  FIELD_NAME: /^[A-Z_][A-Z0-9_]*$/,
  
  // Validação de direção de ordenação
  ORDER_DIRECTION: /^(ASC|DESC)$/i,
  
  // Validação de chave NFe (44 caracteres alfanuméricos)
  NFE_KEY_WITHOUT_PREFIX: /^[0-9]{44}$/,
  
  // Validação de chave NFe com prefixo (NFe + 44 caracteres)
  NFE_KEY_WITH_PREFIX: /^NFe[0-9]{44}$/,
  
  // Validação de CNPJ (formato: XX.XXX.XXX/XXXX-XX)
  CNPJ_FORMAT: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  
  // Validação de configuração de ordenação (CAMPO ASC/DESC)
  ORDER_CONFIG: /^[A-Z_][A-Z0-9_]*\s+(ASC|DESC)$/i,
} as const;

/**
 * Separadores para parsing de configurações
 */
export const GROUPING_VALIDATION_SEPARATORS = {
  // Separador de campos múltiplos
  FIELD_SEPARATOR: ',',
  
  // Separador de campo e direção de ordenação
  ORDER_SEPARATOR: ' ',
  
  // Separador de múltiplas configurações de ordenação
  ORDER_CONFIG_SEPARATOR: ',',
  
  // Caracteres de espaço em branco para trim
  WHITESPACE_CHARS: ' \t\n\r',
} as const;

/**
 * Mensagens de erro específicas para validação de agrupamento
 */
export const GROUPING_VALIDATION_ERROR_MESSAGES = {
  // Erros de campo
  INVALID_FIELD_NAME: (field: string) => 
    `Nome de campo inválido: ${field}. Deve começar com letra maiúscula ou underscore e conter apenas letras maiúsculas, números e underscores`,
  
  FIELD_TOO_SHORT: (field: string, minLength: number) => 
    `Nome de campo muito curto: ${field}. Mínimo ${minLength} caracteres`,
  
  FIELD_TOO_LONG: (field: string, maxLength: number) => 
    `Nome de campo muito longo: ${field}. Máximo ${maxLength} caracteres`,
  
  TOO_MANY_FIELDS: (count: number, maxFields: number) => 
    `Muitos campos especificados: ${count}. Máximo permitido: ${maxFields}`,
  
  EMPTY_FIELD_LIST: () => 
    'Lista de campos não pode estar vazia',
  
  DUPLICATE_FIELD: (field: string) => 
    `Campo duplicado encontrado: ${field}`,
  
  // Erros de ordenação
  INVALID_ORDER_DIRECTION: (direction: string) => 
    `Direção de ordenação inválida: ${direction}. Deve ser ASC ou DESC`,
  
  MALFORMED_ORDER_CONFIG: (config: string) => 
    `Configuração de ordenação malformada: ${config}. Formato esperado: CAMPO ASC/DESC`,
  
  // Erros de chave NFe
  INVALID_NFE_KEY_LENGTH: (key: string, expectedLength: number) => 
    `Chave NFe com comprimento inválido: ${key} (${key.length} caracteres). Esperado: ${expectedLength} caracteres`,
  
  INVALID_NFE_KEY_FORMAT: (key: string) => 
    `Formato de chave NFe inválido: ${key}. Deve conter apenas números`,
  
  INVALID_NFE_PREFIX: (key: string) => 
    `Prefixo NFe inválido: ${key}. Deve começar com 'NFe' seguido de 44 dígitos`,
  
  // Erros de configuração
  CONFLICTING_CONFIGURATIONS: (global: string, specific: string) => 
    `Configurações conflitantes detectadas. Global: ${global}, Específica: ${specific}`,
  
  UNSUPPORTED_COLLECTION: (collection: string, supportedCollections: string[]) => 
    `Coleção não suportada: ${collection}. Coleções suportadas: ${supportedCollections.join(', ')}`,
  
  CONFIGURATION_PARSE_FAILED: (config: string, error: string) => 
    `Falha ao parsear configuração: ${config}. Erro: ${error}`,
} as const;

/**
 * Tipos de validação suportados
 */
export const GROUPING_VALIDATION_TYPES = {
  FIELD_NAME: 'field_name',
  ORDER_DIRECTION: 'order_direction',
  NFE_KEY: 'nfe_key',
  CNPJ: 'cnpj',
  ORDER_CONFIG: 'order_config',
  FIELD_LIST: 'field_list',
} as const;

/**
 * Configurações de validação por tipo
 */
export const GROUPING_VALIDATION_CONFIG = {
  [GROUPING_VALIDATION_TYPES.FIELD_NAME]: {
    pattern: GROUPING_VALIDATION_PATTERNS.FIELD_NAME,
    minLength: GROUPING_VALIDATION_LIMITS.MIN_FIELD_NAME_LENGTH,
    maxLength: GROUPING_VALIDATION_LIMITS.MAX_FIELD_NAME_LENGTH,
    required: true,
  },
  
  [GROUPING_VALIDATION_TYPES.ORDER_DIRECTION]: {
    pattern: GROUPING_VALIDATION_PATTERNS.ORDER_DIRECTION,
    validValues: ['ASC', 'DESC'],
    required: false,
    default: 'DESC',
  },
  
  [GROUPING_VALIDATION_TYPES.NFE_KEY]: {
    patterns: {
      withPrefix: GROUPING_VALIDATION_PATTERNS.NFE_KEY_WITH_PREFIX,
      withoutPrefix: GROUPING_VALIDATION_PATTERNS.NFE_KEY_WITHOUT_PREFIX,
    },
    minLength: GROUPING_VALIDATION_LIMITS.MIN_KEY_LENGTH,
    maxLength: GROUPING_VALIDATION_LIMITS.MAX_KEY_LENGTH,
    required: true,
  },
  
  [GROUPING_VALIDATION_TYPES.FIELD_LIST]: {
    separator: GROUPING_VALIDATION_SEPARATORS.FIELD_SEPARATOR,
    maxFields: GROUPING_VALIDATION_LIMITS.MAX_GROUP_BY_FIELDS,
    allowDuplicates: false,
    trimWhitespace: true,
  },
} as const;