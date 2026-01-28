/**
 * Constantes para configuração de ambiente do sistema
 * 
 * Define chaves de variáveis de ambiente, valores padrão e validações
 * para configurações do sistema de agrupamento configurável
 */

/**
 * Chaves de variáveis de ambiente para configuração geral
 */
export const ENVIRONMENT_KEYS = {
  // Configuração de ambiente
  NODE_ENV: 'NODE_ENV',
  LOG_LEVEL: 'LOG_LEVEL',
  
  // Configuração de banco de dados
  DATABASE_URL: 'DATABASE_URL',
  MONGODB_CONNECTION_STRING: 'MONGODB_CONNECTION_STRING',
  
  // Configuração de autenticação
  JWT_SECRET: 'JWT_SECRET',
  
  // Configuração de agrupamento NFe
  NFE_GROUPING_ENABLED: 'NFE_GROUPING_ENABLED',
  NFE_GROUPING_CACHE_TTL: 'NFE_GROUPING_CACHE_TTL',
  NFE_GROUPING_MAX_GROUPS: 'NFE_GROUPING_MAX_GROUPS',
  NFE_GROUPING_QUERY_TIMEOUT: 'NFE_GROUPING_QUERY_TIMEOUT',
  
  // Configuração específica por coleção
  TBL_NFE_100_GROUP_BY: 'TBL_NFE_100_GROUP_BY',
  TBL_NFE_100_ORDER_BY: 'TBL_NFE_100_ORDER_BY',
  TBL_NFE_100_GROUPING_ENABLED: 'TBL_NFE_100_GROUPING_ENABLED',
} as const;

/**
 * Valores padrão para variáveis de ambiente
 */
export const ENVIRONMENT_DEFAULTS = {
  // Ambiente
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
  
  // Agrupamento NFe
  NFE_GROUPING_ENABLED: 'true',
  NFE_GROUPING_CACHE_TTL: '60000', // 1 minuto em ms
  NFE_GROUPING_MAX_GROUPS: '1000',
  NFE_GROUPING_QUERY_TIMEOUT: '30000', // 30 segundos em ms
  
  // Configuração específica da coleção tbl_nfe_100
  TBL_NFE_100_GROUP_BY: 'CHV_NFE',
  TBL_NFE_100_ORDER_BY: 'DT_DOC DESC, PROTOCOLADA DESC',
  TBL_NFE_100_GROUPING_ENABLED: 'true',
} as const;

/**
 * Tipos de valores de ambiente
 */
export const ENVIRONMENT_VALUE_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
} as const;

/**
 * Configuração de validação para variáveis de ambiente
 */
export const ENVIRONMENT_VALIDATION_CONFIG = {
  [ENVIRONMENT_KEYS.NODE_ENV]: {
    type: ENVIRONMENT_VALUE_TYPES.STRING,
    required: false,
    default: ENVIRONMENT_DEFAULTS.NODE_ENV,
    validValues: ['development', 'production', 'test'],
  },
  
  [ENVIRONMENT_KEYS.LOG_LEVEL]: {
    type: ENVIRONMENT_VALUE_TYPES.STRING,
    required: false,
    default: ENVIRONMENT_DEFAULTS.LOG_LEVEL,
    validValues: ['error', 'warn', 'info', 'debug'],
  },
  
  [ENVIRONMENT_KEYS.JWT_SECRET]: {
    type: ENVIRONMENT_VALUE_TYPES.STRING,
    required: true,
    minLength: 32,
    description: 'Chave secreta para JWT (mínimo 32 caracteres)',
  },
  
  [ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED]: {
    type: ENVIRONMENT_VALUE_TYPES.BOOLEAN,
    required: false,
    default: ENVIRONMENT_DEFAULTS.NFE_GROUPING_ENABLED,
    description: 'Habilita/desabilita agrupamento global de NFe',
  },
  
  [ENVIRONMENT_KEYS.NFE_GROUPING_CACHE_TTL]: {
    type: ENVIRONMENT_VALUE_TYPES.NUMBER,
    required: false,
    default: ENVIRONMENT_DEFAULTS.NFE_GROUPING_CACHE_TTL,
    min: 1000, // 1 segundo
    max: 3600000, // 1 hora
    description: 'TTL do cache de configuração em milissegundos',
  },
  
  [ENVIRONMENT_KEYS.NFE_GROUPING_MAX_GROUPS]: {
    type: ENVIRONMENT_VALUE_TYPES.NUMBER,
    required: false,
    default: ENVIRONMENT_DEFAULTS.NFE_GROUPING_MAX_GROUPS,
    min: 1,
    max: 10000,
    description: 'Número máximo de grupos por consulta',
  },
  
  [ENVIRONMENT_KEYS.NFE_GROUPING_QUERY_TIMEOUT]: {
    type: ENVIRONMENT_VALUE_TYPES.NUMBER,
    required: false,
    default: ENVIRONMENT_DEFAULTS.NFE_GROUPING_QUERY_TIMEOUT,
    min: 5000, // 5 segundos
    max: 300000, // 5 minutos
    description: 'Timeout para consultas de agrupamento em milissegundos',
  },
  
  [ENVIRONMENT_KEYS.TBL_NFE_100_GROUP_BY]: {
    type: ENVIRONMENT_VALUE_TYPES.STRING,
    required: false,
    default: ENVIRONMENT_DEFAULTS.TBL_NFE_100_GROUP_BY,
    description: 'Campos para agrupamento da coleção tbl_nfe_100 (separados por vírgula)',
  },
  
  [ENVIRONMENT_KEYS.TBL_NFE_100_ORDER_BY]: {
    type: ENVIRONMENT_VALUE_TYPES.STRING,
    required: false,
    default: ENVIRONMENT_DEFAULTS.TBL_NFE_100_ORDER_BY,
    description: 'Ordenação para coleção tbl_nfe_100 (formato: CAMPO ASC/DESC)',
  },
  
  [ENVIRONMENT_KEYS.TBL_NFE_100_GROUPING_ENABLED]: {
    type: ENVIRONMENT_VALUE_TYPES.BOOLEAN,
    required: false,
    default: ENVIRONMENT_DEFAULTS.TBL_NFE_100_GROUPING_ENABLED,
    description: 'Habilita/desabilita agrupamento específico para tbl_nfe_100',
  },
} as const;

/**
 * Mensagens de erro para validação de ambiente
 */
export const ENVIRONMENT_ERROR_MESSAGES = {
  REQUIRED_MISSING: (key: string) => `Variável de ambiente obrigatória não encontrada: ${key}`,
  INVALID_TYPE: (key: string, expected: string, received: string) => 
    `Tipo inválido para ${key}: esperado ${expected}, recebido ${received}`,
  INVALID_VALUE: (key: string, value: string, validValues: string[]) => 
    `Valor inválido para ${key}: ${value}. Valores válidos: ${validValues.join(', ')}`,
  OUT_OF_RANGE: (key: string, value: number, min?: number, max?: number) => {
    const range = min !== undefined && max !== undefined 
      ? `entre ${min} e ${max}` 
      : min !== undefined 
        ? `maior que ${min}` 
        : `menor que ${max}`;
    return `Valor fora do intervalo para ${key}: ${value} (deve ser ${range})`;
  },
  TOO_SHORT: (key: string, value: string, minLength: number) => 
    `Valor muito curto para ${key}: ${value.length} caracteres (mínimo ${minLength})`,
} as const;

/**
 * Configurações de ambiente por contexto
 */
export const ENVIRONMENT_CONTEXTS = {
  DEVELOPMENT: {
    NFE_GROUPING_ENABLED: 'true',
    LOG_LEVEL: 'debug',
    NFE_GROUPING_CACHE_TTL: '30000', // 30 segundos para desenvolvimento
  },
  
  PRODUCTION: {
    NFE_GROUPING_ENABLED: 'true',
    LOG_LEVEL: 'info',
    NFE_GROUPING_CACHE_TTL: '300000', // 5 minutos para produção
  },
  
  TEST: {
    NFE_GROUPING_ENABLED: 'false',
    LOG_LEVEL: 'error',
    NFE_GROUPING_CACHE_TTL: '1000', // 1 segundo para testes
  },
} as const;

/**
 * Prefixos para logs de configuração de ambiente
 */
export const ENVIRONMENT_LOG_PREFIXES = {
  CONFIG: '[ENV-CONFIG]',
  VALIDATION: '[ENV-VALIDATION]',
  ERROR: '[ENV-ERROR]',
  WARNING: '[ENV-WARNING]',
} as const;