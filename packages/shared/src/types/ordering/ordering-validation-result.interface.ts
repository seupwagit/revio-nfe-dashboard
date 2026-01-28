/**
 * Interface para resultado de validação de ordenação
 * 
 * Contém informações sobre a validação de campos de ordenação
 */
export interface OrderingValidationResult {
  /** Se a validação foi bem-sucedida */
  isValid: boolean;
  
  /** Lista de campos válidos */
  validFields: string[];
  
  /** Lista de campos inválidos */
  invalidFields: string[];
  
  /** Mensagens de erro detalhadas */
  errors: string[];
  
  /** Avisos sobre a configuração */
  warnings: string[];
}