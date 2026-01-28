/**
 * Constantes para configuração de agrupamento de NFe
 * 
 * Define valores padrão, configurações de ambiente e limites
 * para o sistema de agrupamento configurável de documentos NFe
 */

/**
 * Configurações padrão para agrupamento de NFe
 */
export const NFE_GROUPING_DEFAULTS = {
  // Campo padrão para agrupamento
  DEFAULT_GROUP_BY_FIELD: 'CHV_NFE',
  
  // Ordenação padrão
  DEFAULT_ORDER_BY: 'DT_DOC DESC, PROTOCOLADA DESC',
  
  // Prefixo NFe para normalização
  NFE_PREFIX: 'NFe',
  NFE_PREFIX_LENGTH: 3,
  
  // Cache de configuração
  CONFIG_CACHE_TTL_MS: 60000, // 1 minuto
  
  // Limites de performance
  MAX_GROUPS_PER_QUERY: 1000,
  MAX_DOCUMENTS_PER_GROUP: 100,
  
  // Timeout para operações
  QUERY_TIMEOUT_MS: 30000, // 30 segundos
  AGGREGATION_TIMEOUT_MS: 45000, // 45 segundos
} as const;

/**
 * Nomes de variáveis de ambiente para configuração
 */
export const NFE_GROUPING_ENV_VARS = {
  // Configuração específica da coleção tbl_nfe_100
  TBL_NFE_100_GROUP_BY: 'TBL_NFE_100_GROUP_BY',
  TBL_NFE_100_ORDER_BY: 'TBL_NFE_100_ORDER_BY',
  
  // Configurações de performance
  CACHE_TTL: 'NFE_GROUPING_CACHE_TTL',
  MAX_GROUPS: 'NFE_GROUPING_MAX_GROUPS',
  QUERY_TIMEOUT: 'NFE_GROUPING_QUERY_TIMEOUT',
} as const;

/**
 * Campos válidos para agrupamento por coleção
 */
export const NFE_GROUPING_VALID_FIELDS = {
  tbl_nfe_100: [
    'CHV_NFE',
    'CNPJ_EMIT',
    'DT_DOC',
    'PROTOCOLADA',
    'VALOR_TOTAL',
    'NOME_EMIT',
    'SERIE',
    'NUMERO'
  ],
  tbl_cte_100: [
    'CHV_CTE',
    'CHV_NFE', // Para compatibilidade com testes
    'CNPJ_EMIT',
    'DT_DOC', // Para compatibilidade com testes
    'VALOR_TOTAL',
    'NOME_EMIT',
    'SERIE',
    'NUMERO'
  ],
  tbl_cfe_100: [
    'CHV_CFE',
    'CHV_NFE', // Para compatibilidade com testes
    'CNPJ_EMIT',
    'DT_DOC', // Para compatibilidade com testes
    'VALOR_TOTAL',
    'NOME_EMIT',
    'SERIE',
    'NUMERO'
  ],
  // Adicionar outras coleções conforme necessário
} as const;

/**
 * Campos válidos para ordenação por coleção
 */
export const NFE_GROUPING_VALID_ORDER_FIELDS = {
  tbl_nfe_100: [
    'DT_DOC',
    'PROTOCOLADA',
    'VALOR_TOTAL',
    'CHV_NFE',
    'CNPJ_EMIT',
    'NOME_EMIT',
    'SERIE',
    'NUMERO',
    '_id'
  ],
  tbl_cte_100: [
    'DT_DOC', // Para compatibilidade com testes
    'PROTOCOLADA', // Para compatibilidade com testes
    'VALOR_TOTAL',
    'CHV_CTE',
    'CHV_NFE', // Para compatibilidade com testes
    'CNPJ_EMIT',
    'NOME_EMIT',
    'SERIE',
    'NUMERO',
    '_id'
  ],
  tbl_cfe_100: [
    'DT_DOC', // Para compatibilidade com testes
    'PROTOCOLADA', // Para compatibilidade com testes
    'VALOR_TOTAL',
    'CHV_CFE',
    'CHV_NFE', // Para compatibilidade com testes
    'CNPJ_EMIT',
    'NOME_EMIT',
    'SERIE',
    'NUMERO',
    '_id'
  ],
} as const;

/**
 * Direções de ordenação válidas
 */
export const NFE_GROUPING_ORDER_DIRECTIONS = {
  ASCENDING: 'ASC',
  DESCENDING: 'DESC',
  MONGODB_ASC: 1,
  MONGODB_DESC: -1,
} as const;

/**
 * Tipos de erro específicos para agrupamento
 */
export const NFE_GROUPING_ERROR_TYPES = {
  // Configuração
  INVALID_GROUPING_FIELD: 'INVALID_GROUPING_FIELD',
  MALFORMED_CONFIGURATION: 'MALFORMED_CONFIGURATION',
  MULTIPLE_INVALID_FIELDS: 'MULTIPLE_INVALID_FIELDS',
  EMPTY_CONFIGURATION: 'EMPTY_CONFIGURATION',
  
  // Normalização
  INVALID_KEY_TYPE: 'INVALID_KEY_TYPE',
  BATCH_PROCESSING_FAILED: 'BATCH_PROCESSING_FAILED',
  STRING_OPERATION_FAILED: 'STRING_OPERATION_FAILED',
  INVALID_KEY_FORMAT: 'INVALID_KEY_FORMAT',
  
  // Interceptação de consultas
  PIPELINE_BUILD_FAILED: 'PIPELINE_BUILD_FAILED',
  AGGREGATION_EXECUTION_FAILED: 'AGGREGATION_EXECUTION_FAILED',
  RESULT_TRANSFORMATION_FAILED: 'RESULT_TRANSFORMATION_FAILED',
  INVALID_ORIGINAL_QUERY: 'INVALID_ORIGINAL_QUERY',
  EXECUTION_TIMEOUT: 'EXECUTION_TIMEOUT',
  UNSUPPORTED_COLLECTION: 'UNSUPPORTED_COLLECTION',
} as const;

/**
 * Mensagens de log estruturadas
 */
export const NFE_GROUPING_LOG_MESSAGES = {
  // Configuração
  CONFIG_LOADED: 'Configuração de agrupamento carregada',
  CONFIG_CACHED: 'Configuração de agrupamento cacheada',
  CONFIG_REFRESHED: 'Configuração de agrupamento atualizada',
  CONFIG_VALIDATION_FAILED: 'Validação de configuração falhou',
  
  // Normalização
  KEYS_NORMALIZED: 'Chaves NFe normalizadas',
  PREFIX_REMOVED: 'Prefixo NFe removido',
  BATCH_PROCESSED: 'Lote de chaves processado',
  
  // Interceptação
  QUERY_INTERCEPTED: 'Consulta interceptada para agrupamento',
  PIPELINE_BUILT: 'Pipeline de agregação construído',
  AGGREGATION_EXECUTED: 'Agregação executada com sucesso',
  RESULTS_TRANSFORMED: 'Resultados transformados',
  FALLBACK_EXECUTED: 'Fallback para consulta original executado',
  
  // Performance
  PERFORMANCE_MEASURED: 'Performance de agrupamento medida',
  CACHE_HIT: 'Cache de configuração utilizado',
  CACHE_MISS: 'Cache de configuração perdido',
} as const;

/**
 * Prefixos para logs estruturados (compatível com Coolify)
 */
export const NFE_GROUPING_LOG_PREFIXES = {
  CONFIG: '[NFE-GROUPING-CONFIG]',
  NORMALIZATION: '[NFE-NORMALIZATION]',
  INTERCEPTION: '[QUERY-INTERCEPTION]',
  SERVICE: '[NFE-GROUPING-SERVICE]',
  PERFORMANCE: '[NFE-PERFORMANCE]',
  ERROR: '[NFE-GROUPING-ERROR]',
  WARNING: '[NFE-GROUPING-WARN]',
  INFO: '[NFE-GROUPING-INFO]',
} as const;

/**
 * Configurações de validação
 */
export const NFE_GROUPING_VALIDATION = {
  // Limites de chave NFe
  MIN_KEY_LENGTH: 44, // Chave sem prefixo
  MAX_KEY_LENGTH: 47, // Chave com prefixo
  
  // Limites de configuração
  MAX_GROUP_BY_FIELDS: 5,
  MAX_ORDER_BY_FIELDS: 3,
  
  // Regex para validação
  FIELD_NAME_REGEX: /^[A-Z_][A-Z0-9_]*$/,
  ORDER_DIRECTION_REGEX: /^(ASC|DESC)$/i,
  
  // Separadores
  FIELD_SEPARATOR: ',',
  ORDER_SEPARATOR: ' ',
} as const;

/**
 * Coleções suportadas para agrupamento
 */
export const NFE_GROUPING_SUPPORTED_COLLECTIONS = [
  'tbl_nfe_100',
  'tbl_cte_100',
  'tbl_cfe_100',
  // Adicionar outras coleções conforme necessário
] as const;

/**
 * Metadados para resultados agrupados
 */
export const NFE_GROUPING_METADATA_FIELDS = {
  GROUPED: 'grouped',
  GROUP_COUNT: 'groupCount',
  TOTAL_DOCUMENTS: 'totalDocuments',
  PROCESSING_TIME: 'processingTime',
  CACHE_USED: 'cacheUsed',
  NORMALIZATION_APPLIED: 'normalizationApplied',
  FALLBACK_USED: 'fallbackUsed',
} as const;