/**
 * OrderingProcessor - Processador de Ordenação
 * 
 * Responsável por processar configurações de ordenação e aplicar aos resultados,
 * validando campos de ordenação contra schema e otimizando para performance
 */

import { NFE_GROUPING_DEFAULTS, NFE_GROUPING_ORDER_DIRECTIONS, NFE_GROUPING_VALID_ORDER_FIELDS } from '@fiscal/shared/constants/nfe-grouping.constants';
import { OrderingField } from '@fiscal/shared/types/grouping/ordering-field.interface';
import { logger } from '../utils/logger';

export class OrderingProcessor {
  private readonly DEFAULT_ORDERING = NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY;

  /**
   * Parseia configuração de ordenação em array de campos
   */
  parseOrderingConfig(config: string): OrderingField[] {
    const fields: OrderingField[] = [];

    // Se config está vazio ou só tem espaços/vírgulas, usar padrão
    if (!config || config.trim().length === 0 || config.replace(/[,\s]/g, '').length === 0) {
      return this.parseOrderingConfig(this.DEFAULT_ORDERING);
    }

    try {
      const parts = config.split(',');
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;

        const tokens = part.split(/\s+/);
        if (tokens.length === 0) continue;

        const field = tokens[0];
        const directionStr = tokens.length > 1 ? tokens[1].toUpperCase() : 'DESC';
        const direction = directionStr === 'ASC' ? 1 : -1;

        fields.push({
          field,
          direction,
          priority: i
        });
      }
    } catch (error) {
      logger.warn('[NFE-GROUPING-ORDER] ⚠️ Erro ao parsear configuração de ordenação', {
        config,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback para configuração padrão
      return this.parseOrderingConfig(this.DEFAULT_ORDERING);
    }

    // Se não conseguiu parsear nenhum campo válido, usar padrão
    if (fields.length === 0) {
      return this.parseOrderingConfig(this.DEFAULT_ORDERING);
    }

    return fields;
  }

  /**
   * Constrói stage $sort do MongoDB
   */
  buildSortStage(fields: OrderingField[]): any {
    const sortSpec: any = {};

    fields
      .sort((a, b) => a.priority - b.priority) // Ordenar por prioridade
      .forEach(field => {
        sortSpec[field.field] = field.direction;
      });

    return { $sort: sortSpec };
  }

  /**
   * Valida campos de ordenação contra schema da coleção
   */
  validateOrderingFields(fields: string[], collection: string): boolean {
    const validFields = this.getValidOrderingFieldsForCollection(collection);
    
    for (const field of fields) {
      // Filtrar campos vazios ou apenas espaços
      if (!field || field.trim().length === 0) {
        continue;
      }
      
      if (!validFields.includes(field.trim())) {
        logger.warn('[NFE-GROUPING-ORDER] ⚠️ Campo de ordenação inválido', {
          field,
          collection,
          validFields
        });
        throw new Error(`Campo de ordenação inválido: ${field}`);
      }
    }

    return true;
  }

  /**
   * Aplica ordenação específica para grupos
   */
  applyGroupOrdering(pipeline: any[], ordering: OrderingField[]): void {
    // Verificar se pipeline é válido
    if (!pipeline || !Array.isArray(pipeline)) {
      logger.warn('[NFE-GROUPING-ORDER] ⚠️ Pipeline inválido fornecido para ordenação');
      return;
    }

    if (ordering.length === 0) return;

    // Adicionar ordenação após agrupamento
    const sortStage = this.buildSortStage(ordering);
    pipeline.push(sortStage);

    logger.debug('[NFE-GROUPING-ORDER] 📊 Ordenação aplicada aos grupos', {
      orderingFields: ordering.map(f => `${f.field} ${f.direction === 1 ? 'ASC' : 'DESC'}`),
      stageAdded: sortStage
    });
  }

  /**
   * Aplica ordenação dentro de cada grupo
   */
  applyIntraGroupOrdering(groupStage: any, ordering: OrderingField[]): void {
    if (ordering.length === 0) return;

    // Ordenar documentos dentro de cada grupo
    const sortSpec: any = {};
    ordering.forEach(field => {
      sortSpec[field.field] = field.direction;
    });

    // Modificar o stage de agrupamento para incluir documentos ordenados
    if (groupStage.$group && groupStage.$group.documents) {
      groupStage.$group.documents = {
        $push: {
          $mergeObjects: [
            '$$ROOT',
            { _sortKey: sortSpec }
          ]
        }
      };
    }
  }

  /**
   * Cria pipeline de ordenação para documentos individuais
   */
  createDocumentOrderingPipeline(ordering: OrderingField[]): any[] {
    if (ordering.length === 0) return [];

    const sortStage = this.buildSortStage(ordering);
    return [sortStage];
  }

  /**
   * Otimiza ordenação para performance
   */
  optimizeOrdering(fields: OrderingField[], collection: string): OrderingField[] {
    // Verificar se há índices disponíveis para os campos de ordenação
    const indexedFields = this.getIndexedFieldsForCollection(collection);
    
    // Priorizar campos indexados
    const optimized = [...fields].sort((a, b) => {
      const aIndexed = indexedFields.includes(a.field);
      const bIndexed = indexedFields.includes(b.field);
      
      if (aIndexed && !bIndexed) return -1;
      if (!aIndexed && bIndexed) return 1;
      
      return a.priority - b.priority;
    });

    if (optimized.some((field, index) => field.priority !== fields[index].priority)) {
      logger.debug('[NFE-GROUPING-ORDER] ⚡ Ordenação otimizada para performance', {
        original: fields.map(f => f.field),
        optimized: optimized.map(f => f.field),
        indexedFields
      });
    }

    return optimized;
  }

  /**
   * Converte direção de ordenação para formato MongoDB
   */
  convertDirectionToMongoDB(direction: 'ASC' | 'DESC'): 1 | -1 {
    return direction === 'ASC' 
      ? NFE_GROUPING_ORDER_DIRECTIONS.MONGODB_ASC 
      : NFE_GROUPING_ORDER_DIRECTIONS.MONGODB_DESC;
  }

  /**
   * Converte direção MongoDB para string
   */
  convertDirectionToString(direction: 1 | -1): 'ASC' | 'DESC' {
    return direction === 1 
      ? NFE_GROUPING_ORDER_DIRECTIONS.ASCENDING 
      : NFE_GROUPING_ORDER_DIRECTIONS.DESCENDING;
  }

  /**
   * Valida configuração de ordenação completa
   */
  validateOrderingConfig(config: string, collection: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fields = this.parseOrderingConfig(config);
      
      if (fields.length === 0) {
        warnings.push('Nenhum campo de ordenação especificado, usando padrão');
      }

      // Validar cada campo
      const fieldNames = fields.map(f => f.field);
      if (!this.validateOrderingFields(fieldNames, collection)) {
        errors.push('Um ou mais campos de ordenação são inválidos');
      }

      // Verificar duplicatas
      const uniqueFields = new Set(fieldNames);
      if (uniqueFields.size !== fieldNames.length) {
        warnings.push('Campos de ordenação duplicados detectados');
      }

      // Verificar limite de campos
      if (fields.length > 5) {
        warnings.push('Muitos campos de ordenação podem impactar performance');
      }

    } catch (error) {
      errors.push(`Erro ao validar configuração: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Obtém campos válidos para ordenação por coleção
   */
  private getValidOrderingFieldsForCollection(collection: string): string[] {
    const collectionKey = collection as keyof typeof NFE_GROUPING_VALID_ORDER_FIELDS;
    return [...(NFE_GROUPING_VALID_ORDER_FIELDS[collectionKey] || [])];
  }

  /**
   * Obtém campos indexados para uma coleção (simulado - seria obtido do MongoDB)
   */
  private getIndexedFieldsForCollection(collection: string): string[] {
    // Em uma implementação real, isso consultaria os índices do MongoDB
    // Por enquanto, retornamos campos comumente indexados
    switch (collection) {
      case 'tbl_nfe_100':
        return ['_id', 'CHV_NFE', 'DT_DOC', 'CNPJ_EMIT'];
      default:
        return ['_id'];
    }
  }

  /**
   * Obtém configuração de ordenação para uma coleção
   */
  getOrderingConfig(collection: string): {
    enabled: boolean;
    fields: OrderingField[];
    defaultOrdering: string;
  } {
    // Verificar se há configuração específica para a coleção
    const collectionUpper = collection.toUpperCase();
    const orderByVar = `${collectionUpper}_ORDER_BY`;
    const orderByValue = process.env[orderByVar];

    let orderingString: string = this.DEFAULT_ORDERING;
    if (orderByValue && orderByValue.trim().length > 0) {
      orderingString = orderByValue;
    }

    const fields = this.parseOrderingConfig(orderingString);
    return {
      enabled: fields.length > 0,
      fields,
      defaultOrdering: orderingString
    };
  }

  /**
   * Verifica se a ordenação é válida
   */
  isValidOrdering(config: string, collection: string): boolean {
    const validation = this.validateOrderingConfig(config, collection);
    return validation.isValid;
  }

  /**
   * Verifica se a configuração de ordenação é válida (alias para compatibilidade)
   */
  isValidOrderingConfig(config: string, collection?: string): boolean {
    if (collection) {
      return this.isValidOrdering(config, collection);
    }
    
    // Se não tiver collection, fazer validação básica
    try {
      // Verificar se é uma configuração malformada
      if (!config || config.trim().length === 0 || config.replace(/[,\s]/g, '').length === 0) {
        return false;
      }
      
      const fields = this.parseOrderingConfig(config);
      
      // Se parseou mas retornou configuração padrão, significa que era inválida
      const defaultFields = this.parseOrderingConfig(this.DEFAULT_ORDERING);
      if (JSON.stringify(fields) === JSON.stringify(defaultFields) && config !== this.DEFAULT_ORDERING) {
        return false;
      }
      
      return fields.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Normaliza configuração de ordenação
   */
  normalizeOrdering(config: string): string {
    const fields = this.parseOrderingConfig(config);
    return fields.map(f => `${f.field} ${f.direction === 1 ? 'ASC' : 'DESC'}`).join(', ');
  }

  /**
   * Normaliza configuração de ordenação (alias para compatibilidade)
   */
  normalizeOrderingConfig(config: string): string {
    return this.normalizeOrdering(config);
  }
}