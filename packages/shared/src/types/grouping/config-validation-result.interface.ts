/**
 * Interface para resultado de validação de configuração
 * 
 * Contém informações sobre a validação de campos de agrupamento
 * e ordenação, incluindo erros e avisos
 */
export interface ConfigValidationResult {
  /** Se a configuração é válida */
  isValid: boolean;
  
  /** Lista de erros encontrados */
  errors: string[];
  
  /** Lista de avisos */
  warnings: string[];
  
  /** Campos validados com sucesso */
  validFields: string[];
  
  /** Campos inválidos encontrados */
  invalidFields: string[];
  
  /** Contexto adicional da validação */
  context?: {
    collection: string;
    configType: 'grouping' | 'ordering';
    source: 'environment' | 'default';
  };
}