/**
 * Resultado da normalização de uma chave NFe
 * 
 * Contém informações sobre a chave original, normalizada e se tinha prefixo
 */
export interface NormalizationResult {
  /** Chave original fornecida */
  originalKey: string;
  
  /** Chave normalizada (sem prefixo "NFe" se presente) */
  normalizedKey: string;
  
  /** Indica se a chave original tinha o prefixo "NFe" */
  hadPrefix: boolean;
}