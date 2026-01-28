/**
 * Interface para resultado de normalização de chave NFe
 */
export interface NormalizationResult {
  originalKey: string;
  normalizedKey: string;
  hadPrefix: boolean;
}