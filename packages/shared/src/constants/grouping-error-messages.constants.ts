/**
 * Constantes para mensagens de erro específicas do agrupamento NFe
 * 
 * Define mensagens padronizadas para diferentes tipos de erro
 * que podem ocorrer durante operações de agrupamento configurável
 */

/**
 * Mensagens de erro para configuração de agrupamento
 */
export const GROUPING_CONFIG_ERROR_MESSAGES = {
  // Configuração geral
  CONFIGURATION_NOT_FOUND: (collection: string) => 
    `Configuração de agrupamento não encontrada para coleção: ${collection}`,
  
  INVALID_CONFIGURATION_FORMAT: (config: string) => 
    `Formato de configuração inválido: ${config}`,
  
  CONFIGURATION_LOAD_FAILED: (collection: string, error: string) => 
    `Falha ao carregar configuração para ${collection}: ${error}`,
  
  CONFIGURATION_CACHE_EXPIRED: (collection: string) => 
    `Cache de configuração expirado para coleção: ${collection}`,
  
  // Campos de agrupamento
  INVALID_GROUPING_FIELD: (field: string, collection: string, validFields: string[]) => 
    `Campo de agrupamento inválido '${field}' para coleção '${collection}'. Campos válidos: ${validFields.join(', ')}`,
  
  MULTIPLE_INVALID_FIELDS: (invalidFields: string[], collection: string) => 
    `Múltiplos campos inválidos para coleção '${collection}': ${invalidFields.join(', ')}`,
  
  EMPTY_GROUPING_CONFIGURATION: (collection: string) => 
    `Configuração de agrupamento vazia para coleção: ${collection}`,
  
  MALFORMED_FIELD_LIST: (fieldList: string) => 
    `Lista de campos malformada: ${fieldList}. Use vírgulas para separar múltiplos campos`,
  
  // Ordenação
  INVALID_ORDER_FIELD: (field: string, collection: string, validFields: string[]) => 
    `Campo de ordenação inválido '${field}' para coleção '${collection}'. Campos válidos: ${validFields.join(', ')}`,
  
  MALFORMED_ORDER_CONFIGURATION: (orderConfig: string) => 
    `Configuração de ordenação malformada: ${orderConfig}. Formato esperado: 'CAMPO ASC/DESC'`,
  
  INVALID_ORDER_DIRECTION: (direction: string, field: string) => 
    `Direção de ordenação inválida '${direction}' para campo '${field}'. Use ASC ou DESC`,
  
  // Controle global
  GLOBAL_GROUPING_DISABLED: () => 
    'Agrupamento global está desabilitado. Habilite NFE_GROUPING_ENABLED para usar agrupamento',
  
  COLLECTION_GROUPING_DISABLED: (collection: string) => 
    `Agrupamento está desabilitado para coleção: ${collection}`,
  
  CONFLICTING_GLOBAL_SETTINGS: (globalSetting: boolean, collectionSetting: boolean) => 
    `Configurações conflitantes: global=${globalSetting}, coleção=${collectionSetting}`,
} as const;

/**
 * Mensagens de erro para normalização de prefixos NFe
 */
export const NFE_PREFIX_ERROR_MESSAGES = {
  // Tipos de chave
  INVALID_KEY_TYPE: (key: any, expectedType: string) => 
    `Tipo de chave inválido: ${typeof key}. Esperado: ${expectedType}`,
  
  NULL_OR_UNDEFINED_KEY: () => 
    'Chave NFe não pode ser null ou undefined',
  
  EMPTY_KEY: () => 
    'Chave NFe não pode estar vazia',
  
  // Formato de chave
  INVALID_KEY_LENGTH: (key: string, actualLength: number, expectedLength: number) => 
    `Comprimento de chave inválido: '${key}' (${actualLength} caracteres). Esperado: ${expectedLength} caracteres`,
  
  INVALID_KEY_FORMAT: (key: string) => 
    `Formato de chave NFe inválido: '${key}'. Deve conter apenas dígitos numéricos`,
  
  INVALID_PREFIX_FORMAT: (key: string, prefix: string) => 
    `Prefixo inválido na chave: '${key}'. Prefixo encontrado: '${prefix}', esperado: 'NFe'`,
  
  // Processamento em lote
  BATCH_PROCESSING_FAILED: (batchSize: number, error: string) => 
    `Falha no processamento em lote de ${batchSize} chaves: ${error}`,
  
  EMPTY_BATCH: () => 
    'Lote de chaves para normalização não pode estar vazio',
  
  BATCH_SIZE_EXCEEDED: (actualSize: number, maxSize: number) => 
    `Tamanho do lote excedido: ${actualSize} chaves. Máximo permitido: ${maxSize}`,
  
  // Operações de string
  STRING_OPERATION_FAILED: (operation: string, key: string, error: string) => 
    `Operação de string '${operation}' falhou para chave '${key}': ${error}`,
  
  SUBSTRING_OUT_OF_BOUNDS: (key: string, startIndex: number, length: number) => 
    `Índice de substring fora dos limites para chave '${key}': início=${startIndex}, comprimento=${length}`,
} as const;

/**
 * Mensagens de erro para interceptação de consultas
 */
export const QUERY_INTERCEPTION_ERROR_MESSAGES = {
  // Interceptação geral
  INTERCEPTION_FAILED: (collection: string, error: string) => 
    `Falha na interceptação de consulta para coleção '${collection}': ${error}`,
  
  UNSUPPORTED_COLLECTION: (collection: string, supportedCollections: string[]) => 
    `Coleção não suportada para interceptação: '${collection}'. Coleções suportadas: ${supportedCollections.join(', ')}`,
  
  INTERCEPTION_DISABLED: (collection: string) => 
    `Interceptação desabilitada para coleção: ${collection}`,
  
  // Pipeline de agregação
  PIPELINE_BUILD_FAILED: (stage: string, error: string) => 
    `Falha na construção do estágio '${stage}' do pipeline: ${error}`,
  
  INVALID_AGGREGATION_STAGE: (stage: string, stageName: string) => 
    `Estágio de agregação inválido '${stageName}': ${stage}`,
  
  PIPELINE_EXECUTION_FAILED: (pipelineLength: number, error: string) => 
    `Falha na execução do pipeline (${pipelineLength} estágios): ${error}`,
  
  EMPTY_PIPELINE: () => 
    'Pipeline de agregação não pode estar vazio',
  
  // Consulta original
  INVALID_ORIGINAL_QUERY: (query: string) => 
    `Consulta original inválida: ${query}`,
  
  QUERY_FILTER_PRESERVATION_FAILED: (originalFilters: string, error: string) => 
    `Falha ao preservar filtros da consulta original '${originalFilters}': ${error}`,
  
  UNSUPPORTED_QUERY_OPERATION: (operation: string) => 
    `Operação de consulta não suportada: ${operation}`,
  
  // Transformação de resultados
  RESULT_TRANSFORMATION_FAILED: (resultCount: number, error: string) => 
    `Falha na transformação de ${resultCount} resultados: ${error}`,
  
  INVALID_AGGREGATION_RESULT: (result: string) => 
    `Resultado de agregação inválido: ${result}`,
  
  RESULT_FORMAT_MISMATCH: (expected: string, actual: string) => 
    `Formato de resultado incompatível. Esperado: ${expected}, Atual: ${actual}`,
  
  // Timeout e performance
  EXECUTION_TIMEOUT: (timeoutMs: number, collection: string) => 
    `Timeout na execução da consulta (${timeoutMs}ms) para coleção: ${collection}`,
  
  PERFORMANCE_THRESHOLD_EXCEEDED: (actualTime: number, thresholdTime: number) => 
    `Limite de performance excedido: ${actualTime}ms (limite: ${thresholdTime}ms)`,
  
  MEMORY_LIMIT_EXCEEDED: (memoryUsage: number, memoryLimit: number) => 
    `Limite de memória excedido: ${memoryUsage}MB (limite: ${memoryLimit}MB)`,
} as const;

/**
 * Mensagens de contexto para logging estruturado
 */
export const GROUPING_CONTEXT_MESSAGES = {
  // Contexto de configuração
  CONFIG_CONTEXT: (collection: string, config: Record<string, any>) => ({
    collection,
    configuration: config,
    timestamp: new Date().toISOString(),
    component: 'GroupingConfigManager',
  }),
  
  // Contexto de normalização
  NORMALIZATION_CONTEXT: (originalKey: string, normalizedKey: string, hadPrefix: boolean) => ({
    originalKey,
    normalizedKey,
    hadPrefix,
    timestamp: new Date().toISOString(),
    component: 'NFePrefixNormalizer',
  }),
  
  // Contexto de interceptação
  INTERCEPTION_CONTEXT: (collection: string, queryType: string, processingTime: number) => ({
    collection,
    queryType,
    processingTime,
    timestamp: new Date().toISOString(),
    component: 'QueryInterceptor',
  }),
  
  // Contexto de erro
  ERROR_CONTEXT: (errorType: string, errorMessage: string, additionalData?: Record<string, any>) => ({
    errorType,
    errorMessage,
    additionalData,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack,
  }),
} as const;