import { NFE_GROUPING_DEFAULTS } from '../constants/nfe-grouping.constants';
import { NFePrefixNormalizationError } from '../errors/nfe-prefix-normalization-error.class';
import { NormalizationResult } from '../types/nfe-grouping/normalization-result.interface';

/**
 * Classe responsável pela normalização de prefixos "NFe" em chaves de acesso
 * 
 * Detecta e remove prefixos "NFe" de chaves de acesso NFe, preservando
 * o formato original para exibição e mantendo informações sobre a normalização
 */
export class NFePrefixNormalizer {
  private readonly nfePrefix = NFE_GROUPING_DEFAULTS.NFE_PREFIX;
  private readonly prefixLength = NFE_GROUPING_DEFAULTS.NFE_PREFIX_LENGTH;

  /**
   * Normaliza uma chave individual removendo o prefixo "NFe" se presente
   * 
   * @param key - Chave de acesso a ser normalizada
   * @returns Resultado da normalização com informações detalhadas
   * @throws NFePrefixNormalizationError quando tipo inválido é fornecido
   */
  normalizeKey(key: string): NormalizationResult {
    try {
      // Validar entrada
      if (key === null || key === undefined) {
        throw new NFePrefixNormalizationError(
          'Chave não pode ser null ou undefined',
          undefined
        );
      }

      if (typeof key !== 'string') {
        throw new NFePrefixNormalizationError(
          `Tipo inválido para chave: esperado string, recebido ${typeof key}`,
          undefined
        );
      }

      // Detectar se tem prefixo "NFe"
      const hasPrefix = this.hasNFePrefix(key);
      
      // Normalizar chave removendo prefixo se presente
      const normalizedKey = hasPrefix 
        ? key.substring(this.prefixLength)
        : key;

      // Validar resultado da normalização
      this.validateNormalizedKey(normalizedKey, key);

      return {
        originalKey: key,
        normalizedKey,
        hadPrefix: hasPrefix
      };
    } catch (error) {
      if (error instanceof NFePrefixNormalizationError) {
        throw error;
      }

      throw new NFePrefixNormalizationError(
        `Erro durante normalização da chave: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        undefined
      );
    }
  }

  /**
   * Verifica se uma chave tem o prefixo "NFe"
   * 
   * @param key - Chave a ser verificada
   * @returns true se a chave inicia com "NFe", false caso contrário
   */
  private hasNFePrefix(key: string): boolean {
    if (key.length < this.prefixLength) {
      return false;
    }

    return key.startsWith(this.nfePrefix);
  }

  /**
   * Valida se a chave normalizada está em formato válido
   * 
   * @param normalizedKey - Chave normalizada
   * @param originalKey - Chave original para contexto de erro
   * @throws NFePrefixNormalizationError se a chave normalizada for inválida
   */
  private validateNormalizedKey(normalizedKey: string, originalKey: string): void {
    // Verificar se a chave original é apenas o prefixo "NFe"
    if (originalKey === this.nfePrefix) {
      throw new NFePrefixNormalizationError(
        `Chave contém apenas o prefixo "NFe" sem conteúdo adicional: "${originalKey}"`,
        undefined
      );
    }

    // String vazia é válida se a chave original também era vazia
    // Não validamos comprimento mínimo aqui pois isso é responsabilidade de outras camadas
  }

  /**
   * Verifica se um campo deve ser normalizado
   * 
   * @param field - Nome do campo a ser verificado
   * @returns true se o campo deve ser normalizado, false caso contrário
   */
  shouldNormalize(field: string): boolean {
    // Apenas o campo CHV_NFE deve ser normalizado
    return field === 'CHV_NFE';
  }
}