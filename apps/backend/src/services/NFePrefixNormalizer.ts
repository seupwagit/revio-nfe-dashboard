/**
 * NFePrefixNormalizer - Normalizador de Prefixos NFe
 * 
 * Responsável por processar chaves CHV_NFE para normalizar prefixos "NFe",
 * mantendo mapeamento entre chaves originais e normalizadas para preservar formato original
 */

import { NFE_GROUPING_DEFAULTS, NFE_GROUPING_LOG_PREFIXES } from '@fiscal/shared/constants/nfe-grouping.constants';
import { NormalizationResult } from '@fiscal/shared/types/grouping/normalization-result.interface';
import { logger } from '../utils/logger';

export class NFePrefixNormalizer {
  private readonly NFE_PREFIX = NFE_GROUPING_DEFAULTS.NFE_PREFIX;
  private readonly PREFIX_LENGTH = NFE_GROUPING_DEFAULTS.NFE_PREFIX_LENGTH;

  /**
   * Normaliza uma única chave CHV_NFE
   */
  normalizeKey(key: string): NormalizationResult {
    if (!key || typeof key !== 'string') {
      return {
        originalKey: key,
        normalizedKey: key,
        hadPrefix: false
      };
    }

    const hasPrefix = key.startsWith(this.NFE_PREFIX);
    const normalizedKey = hasPrefix 
      ? key.substring(this.PREFIX_LENGTH)
      : key;

    return {
      originalKey: key,
      normalizedKey,
      hadPrefix: hasPrefix
    };
  }

  /**
   * Normaliza um lote de chaves de forma eficiente
   */
  normalizeBatch(keys: string[]): Map<string, NormalizationResult> {
    const results = new Map<string, NormalizationResult>();
    let normalizedCount = 0;

    try {
      keys.forEach(key => {
        const result = this.normalizeKey(key);
        results.set(key, result);
        
        if (result.hadPrefix) {
          normalizedCount++;
        }
      });

      if (normalizedCount > 0) {
        logger.debug(`${NFE_GROUPING_LOG_PREFIXES.NORMALIZATION} 🔄 Chaves normalizadas`, {
          totalKeys: keys.length,
          normalizedCount,
          percentage: ((normalizedCount / keys.length) * 100).toFixed(1)
        });
      }

    } catch (error) {
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro no processamento em lote`, {
        error: error instanceof Error ? error.message : String(error),
        keysCount: keys.length
      });
      throw error;
    }

    return results;
  }

  /**
   * Verifica se um campo deve ser normalizado
   */
  shouldNormalize(field: string): boolean {
    // Normalizar apenas campos que contêm "CHV_NFE" no nome
    return field.includes('CHV_NFE') || field === 'CHV_NFE';
  }

  /**
   * Cria pipeline de normalização para chaves
   */
  createNormalizationPipeline(): any[] {
    return [
      {
        $addFields: {
          CHV_NFE_NORMALIZED: {
            $cond: [
              {
                $and: [
                  { $ne: ['$CHV_NFE', null] },
                  { $ne: ['$CHV_NFE', ''] },
                  { $eq: [{ $type: '$CHV_NFE' }, 'string'] }
                ]
              },
              {
                $cond: [
                  { $eq: [{ $substr: ['$CHV_NFE', 0, this.PREFIX_LENGTH] }, this.NFE_PREFIX] },
                  { $substr: ['$CHV_NFE', this.PREFIX_LENGTH, -1] },
                  '$CHV_NFE'
                ]
              },
              '$CHV_NFE'
            ]
          },
          CHV_NFE_HAD_PREFIX: {
            $cond: [
              {
                $and: [
                  { $ne: ['$CHV_NFE', null] },
                  { $ne: ['$CHV_NFE', ''] },
                  { $eq: [{ $type: '$CHV_NFE' }, 'string'] }
                ]
              },
              { $eq: [{ $substr: ['$CHV_NFE', 0, this.PREFIX_LENGTH] }, this.NFE_PREFIX] },
              false
            ]
          },
          ORIGINAL_DOC: '$$ROOT'
        }
      }
    ];
  }

  /**
   * Cria pipeline otimizado para normalização de chaves
   */
  createOptimizedNormalizationPipeline(additionalFields?: string[]): any[] {
    if (additionalFields && additionalFields.length > 0) {
      return this.createMultiFieldNormalizationPipeline(['CHV_NFE', ...additionalFields]);
    }
    
    return [
      {
        $addFields: {
          CHV_NFE_NORMALIZED: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $ne: ['$CHV_NFE', null] },
                      { $ne: ['$CHV_NFE', ''] },
                      { $eq: [{ $type: '$CHV_NFE' }, 'string'] },
                      { $eq: [{ $substr: ['$CHV_NFE', 0, this.PREFIX_LENGTH] }, this.NFE_PREFIX] }
                    ]
                  },
                  then: { $substr: ['$CHV_NFE', this.PREFIX_LENGTH, -1] }
                }
              ],
              default: '$CHV_NFE'
            }
          },
          CHV_NFE_HAD_PREFIX: {
            $cond: [
              {
                $and: [
                  { $ne: ['$CHV_NFE', null] },
                  { $ne: ['$CHV_NFE', ''] },
                  { $eq: [{ $type: '$CHV_NFE' }, 'string'] }
                ]
              },
              { $eq: [{ $substr: ['$CHV_NFE', 0, this.PREFIX_LENGTH] }, this.NFE_PREFIX] },
              false
            ]
          },
          ORIGINAL_DOC: '$$ROOT'
        }
      }
    ];
  }

  /**
   * Valida múltiplas chaves de uma vez
   */
  validateKeys(keys: string[]): string[] {
    return keys.filter(key => {
      if (!key || typeof key !== 'string') {
        return false;
      }
      const validation = this.validateKeyFormat(key);
      return validation.isValid;
    });
  }

  /**
   * Cria pipeline para múltiplos campos de normalização
   */
  createMultiFieldNormalizationPipeline(fields: string[]): any[] {
    const addFieldsStage: any = { $addFields: {} };

    fields.forEach(field => {
      if (this.shouldNormalize(field)) {
        const normalizedFieldName = `${field}_NORMALIZED`;
        const hadPrefixFieldName = `${field}_HAD_PREFIX`;

        addFieldsStage.$addFields[normalizedFieldName] = {
          $cond: [
            {
              $and: [
                { $ne: [`$${field}`, null] },
                { $ne: [`$${field}`, ''] },
                { $eq: [{ $type: `$${field}` }, 'string'] }
              ]
            },
            {
              $cond: [
                { $eq: [{ $substr: [`$${field}`, 0, this.PREFIX_LENGTH] }, this.NFE_PREFIX] },
                { $substr: [`$${field}`, this.PREFIX_LENGTH, -1] },
                `$${field}`
              ]
            },
            `$${field}`
          ]
        };

        addFieldsStage.$addFields[hadPrefixFieldName] = {
          $cond: [
            {
              $and: [
                { $ne: [`$${field}`, null] },
                { $ne: [`$${field}`, ''] },
                { $eq: [{ $type: `$${field}` }, 'string'] }
              ]
            },
            { $eq: [{ $substr: [`$${field}`, 0, this.PREFIX_LENGTH] }, this.NFE_PREFIX] },
            false
          ]
        };
      }
    });

    return Object.keys(addFieldsStage.$addFields).length > 0 ? [addFieldsStage] : [];
  }

  /**
   * Valida formato de chave NFe
   */
  validateKeyFormat(key: string): { isValid: boolean; error?: string } {
    if (!key || typeof key !== 'string') {
      return { isValid: false, error: 'Chave deve ser uma string não vazia' };
    }

    const normalizedKey = this.normalizeKey(key).normalizedKey;
    
    // Chave NFe deve ter 44 caracteres após normalização
    if (normalizedKey.length !== 44) {
      return { 
        isValid: false, 
        error: `Chave deve ter 44 caracteres após normalização, encontrados: ${normalizedKey.length}` 
      };
    }

    // Chave deve conter apenas números
    if (!/^\d{44}$/.test(normalizedKey)) {
      return { 
        isValid: false, 
        error: 'Chave deve conter apenas números após normalização' 
      };
    }

    return { isValid: true };
  }

  /**
   * Obtém estatísticas de normalização para um lote
   */
  getBatchNormalizationStats(results: Map<string, NormalizationResult>): {
    totalKeys: number;
    normalizedKeys: number;
    invalidKeys: number;
    normalizationRate: number;
    // Propriedades adicionais para compatibilidade com testes
    total: number;
    withPrefix: number;
    withoutPrefix: number;
    percentageWithPrefix: number;
  } {
    const totalKeys = results.size;
    let normalizedKeys = 0;
    let invalidKeys = 0;
    let withPrefix = 0;

    for (const result of results.values()) {
      if (result.hadPrefix) {
        normalizedKeys++;
        withPrefix++;
      }
      
      const validation = this.validateKeyFormat(result.originalKey);
      if (!validation.isValid) {
        invalidKeys++;
      }
    }

    const withoutPrefix = totalKeys - withPrefix;
    const percentageWithPrefix = totalKeys > 0 ? Math.round((withPrefix / totalKeys) * 100 * 100) / 100 : 0;

    return {
      totalKeys,
      normalizedKeys,
      invalidKeys,
      normalizationRate: totalKeys > 0 ? (normalizedKeys / totalKeys) * 100 : 0,
      // Propriedades adicionais para compatibilidade
      total: totalKeys,
      withPrefix,
      withoutPrefix,
      percentageWithPrefix
    };
  }

  /**
   * Obtém estatísticas de normalização (alias para getBatchNormalizationStats)
   */
  getStatistics(results: Map<string, NormalizationResult>): {
    totalKeys: number;
    normalizedKeys: number;
    invalidKeys: number;
    normalizationRate: number;
    // Propriedades adicionais para compatibilidade com testes
    total: number;
    withPrefix: number;
    withoutPrefix: number;
    percentageWithPrefix: number;
  } {
    return this.getBatchNormalizationStats(results);
  }

  /**
   * Cria pipeline de agrupamento com normalização
   */
  createGroupingPipeline(groupByFields: string[]): any[] {
    const pipeline: any[] = [];

    // Adicionar normalização se necessário
    if (groupByFields.some(field => this.shouldNormalize(field))) {
      pipeline.push(...this.createNormalizationPipeline());
    }

    // Criar stage de agrupamento
    const groupId: any = {};
    const groupStage: any = {
      $group: {
        _id: groupId,
        documents: { $push: '$ROOT' },
        count: { $sum: 1 },
        originalKeys: { $addToSet: '$CHV_NFE' },
        hasNFePrefix: { $addToSet: '$CHV_NFE_HAD_PREFIX' },
        latestDocument: { $last: '$$ROOT' }
      }
    };

    // Configurar campos de agrupamento
    groupByFields.forEach(field => {
      if (this.shouldNormalize(field)) {
        groupId[`${field}_NORMALIZED`] = `$${field}_NORMALIZED`;
      } else {
        groupId[field] = `$${field}`;
      }
    });

    pipeline.push(groupStage);

    return pipeline;
  }
}