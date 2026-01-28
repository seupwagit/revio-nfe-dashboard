import { GROUPING_VALIDATION_ERROR_MESSAGES, GROUPING_VALIDATION_LIMITS, GROUPING_VALIDATION_PATTERNS, GROUPING_VALIDATION_SEPARATORS } from '../constants/grouping-validation.constants';
import { NFE_GROUPING_SUPPORTED_COLLECTIONS, NFE_GROUPING_VALID_FIELDS, NFE_GROUPING_VALID_ORDER_FIELDS } from '../constants/nfe-grouping.constants';
import { GroupingConfigurationError } from '../errors/grouping-configuration-error.class';

/**
 * Interface para resultado de validação de configuração
 */
export interface GroupingConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedFields: string[];
}

/**
 * Interface para resultado de validação de ordenação
 */
export interface OrderingConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedOrdering: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
}

/**
 * Utilitário para validação de configurações de agrupamento NFe
 * 
 * Valida campos de agrupamento, configurações de ordenação e
 * configurações específicas por coleção conforme regras definidas
 */
export class GroupingConfigValidator {
  /**
   * Valida lista de campos para agrupamento
   */
  static validateGroupingFields(
    fieldsConfig: string, 
    collection: string
  ): GroupingConfigValidationResult {
    const result: GroupingConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedFields: []
    };

    // Verificar se configuração está vazia
    if (!fieldsConfig || fieldsConfig.trim().length === 0) {
      result.errors.push(GROUPING_VALIDATION_ERROR_MESSAGES.EMPTY_FIELD_LIST());
      result.isValid = false;
      return result;
    }

    // Verificar se coleção é suportada
    if (!this.isCollectionSupported(collection)) {
      result.errors.push(
        GROUPING_VALIDATION_ERROR_MESSAGES.UNSUPPORTED_COLLECTION(
          collection, 
          NFE_GROUPING_SUPPORTED_COLLECTIONS as unknown as string[]
        )
      );
      result.isValid = false;
      return result;
    }

    // Parsear campos
    const fields = this.parseFieldList(fieldsConfig);
    
    // Verificar limite de campos
    if (fields.length > GROUPING_VALIDATION_LIMITS.MAX_GROUP_BY_FIELDS) {
      result.errors.push(
        GROUPING_VALIDATION_ERROR_MESSAGES.TOO_MANY_FIELDS(
          fields.length, 
          GROUPING_VALIDATION_LIMITS.MAX_GROUP_BY_FIELDS
        )
      );
      result.isValid = false;
    }

    // Verificar duplicatas
    const duplicates = this.findDuplicateFields(fields);
    if (duplicates.length > 0) {
      duplicates.forEach(field => {
        result.errors.push(GROUPING_VALIDATION_ERROR_MESSAGES.DUPLICATE_FIELD(field));
      });
      result.isValid = false;
    }

    // Validar cada campo individualmente
    const validFields = this.getValidFieldsForCollection(collection);
    const invalidFields: string[] = [];

    fields.forEach(field => {
      // Validar formato do nome do campo
      if (!this.isValidFieldName(field)) {
        result.errors.push(GROUPING_VALIDATION_ERROR_MESSAGES.INVALID_FIELD_NAME(field));
        result.isValid = false;
        return;
      }

      // Validar se campo é suportado pela coleção
      if (!validFields.includes(field)) {
        invalidFields.push(field);
      } else {
        result.validatedFields.push(field);
      }
    });

    // Reportar campos inválidos
    if (invalidFields.length > 0) {
      result.errors.push(
        GROUPING_VALIDATION_ERROR_MESSAGES.INVALID_FIELD_NAME(
          invalidFields.join(', ')
        )
      );
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valida configuração de ordenação
   */
  static validateOrderingConfig(
    orderingConfig: string, 
    collection: string
  ): OrderingConfigValidationResult {
    const result: OrderingConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedOrdering: []
    };

    // Configuração de ordenação é opcional
    if (!orderingConfig || orderingConfig.trim().length === 0) {
      return result;
    }

    // Verificar se coleção é suportada
    if (!this.isCollectionSupported(collection)) {
      result.errors.push(
        GROUPING_VALIDATION_ERROR_MESSAGES.UNSUPPORTED_COLLECTION(
          collection, 
          NFE_GROUPING_SUPPORTED_COLLECTIONS as unknown as string[]
        )
      );
      result.isValid = false;
      return result;
    }

    // Parsear configuração de ordenação
    const orderingParts = this.parseOrderingConfig(orderingConfig);
    
    // Verificar limite de campos de ordenação
    if (orderingParts.length > GROUPING_VALIDATION_LIMITS.MAX_ORDER_BY_FIELDS) {
      result.warnings.push(
        `Muitos campos de ordenação especificados (${orderingParts.length}). ` +
        `Recomendado máximo: ${GROUPING_VALIDATION_LIMITS.MAX_ORDER_BY_FIELDS}`
      );
    }

    // Validar cada parte da ordenação
    const validOrderFields = this.getValidOrderFieldsForCollection(collection);

    orderingParts.forEach(part => {
      const validation = this.validateSingleOrderingPart(part, validOrderFields);
      
      if (!validation.isValid) {
        result.errors.push(...validation.errors);
        result.isValid = false;
      } else {
        result.validatedOrdering.push(validation.orderingField!);
      }
    });

    return result;
  }

  /**
   * Valida uma única parte da configuração de ordenação
   */
  private static validateSingleOrderingPart(
    orderingPart: string, 
    validFields: string[]
  ): { 
    isValid: boolean; 
    errors: string[]; 
    orderingField?: { field: string; direction: 'ASC' | 'DESC' } 
  } {
    const errors: string[] = [];
    
    // Parsear campo e direção
    const parts = orderingPart.trim().split(GROUPING_VALIDATION_SEPARATORS.ORDER_SEPARATOR);
    const field = parts[0]?.trim();
    const direction = parts[1]?.trim()?.toUpperCase() as 'ASC' | 'DESC' | undefined;

    // Validar campo
    if (!field) {
      errors.push(GROUPING_VALIDATION_ERROR_MESSAGES.MALFORMED_ORDER_CONFIG(orderingPart));
      return { isValid: false, errors };
    }

    if (!this.isValidFieldName(field)) {
      errors.push(GROUPING_VALIDATION_ERROR_MESSAGES.INVALID_FIELD_NAME(field));
      return { isValid: false, errors };
    }

    if (!validFields.includes(field)) {
      errors.push(`Campo de ordenação não suportado: ${field}`);
      return { isValid: false, errors };
    }

    // Validar direção (opcional, padrão é DESC)
    const finalDirection = direction || 'DESC';
    if (direction && !GROUPING_VALIDATION_PATTERNS.ORDER_DIRECTION.test(direction)) {
      errors.push(GROUPING_VALIDATION_ERROR_MESSAGES.INVALID_ORDER_DIRECTION(direction));
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      orderingField: { field, direction: finalDirection }
    };
  }

  /**
   * Parseia lista de campos separados por vírgula
   */
  private static parseFieldList(fieldsConfig: string): string[] {
    return fieldsConfig
      .split(GROUPING_VALIDATION_SEPARATORS.FIELD_SEPARATOR)
      .map(field => field.trim())
      .filter(field => field.length > 0);
  }

  /**
   * Parseia configuração de ordenação
   */
  private static parseOrderingConfig(orderingConfig: string): string[] {
    return orderingConfig
      .split(GROUPING_VALIDATION_SEPARATORS.ORDER_CONFIG_SEPARATOR)
      .map(part => part.trim())
      .filter(part => part.length > 0);
  }

  /**
   * Verifica se nome de campo é válido
   */
  private static isValidFieldName(fieldName: string): boolean {
    if (!fieldName || fieldName.length < GROUPING_VALIDATION_LIMITS.MIN_FIELD_NAME_LENGTH) {
      return false;
    }

    if (fieldName.length > GROUPING_VALIDATION_LIMITS.MAX_FIELD_NAME_LENGTH) {
      return false;
    }

    return GROUPING_VALIDATION_PATTERNS.FIELD_NAME.test(fieldName);
  }

  /**
   * Encontra campos duplicados em uma lista
   */
  private static findDuplicateFields(fields: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    fields.forEach(field => {
      if (seen.has(field)) {
        duplicates.add(field);
      } else {
        seen.add(field);
      }
    });

    return Array.from(duplicates);
  }

  /**
   * Verifica se coleção é suportada
   */
  private static isCollectionSupported(collection: string): boolean {
    return NFE_GROUPING_SUPPORTED_COLLECTIONS.includes(collection as any);
  }

  /**
   * Obtém campos válidos para agrupamento por coleção
   */
  private static getValidFieldsForCollection(collection: string): string[] {
    const validFields = NFE_GROUPING_VALID_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_FIELDS];
    return validFields ? [...validFields] : [];
  }

  /**
   * Obtém campos válidos para ordenação por coleção
   */
  private static getValidOrderFieldsForCollection(collection: string): string[] {
    const validFields = NFE_GROUPING_VALID_ORDER_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_ORDER_FIELDS];
    return validFields ? [...validFields] : [];
  }

  /**
   * Valida configuração completa de agrupamento
   */
  static validateCompleteGroupingConfig(
    groupByConfig: string,
    orderByConfig: string,
    collection: string
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validatedConfig: {
      groupByFields: string[];
      orderByFields: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
    };
  } {
    const groupingValidation = this.validateGroupingFields(groupByConfig, collection);
    const orderingValidation = this.validateOrderingConfig(orderByConfig, collection);

    const allErrors = [...groupingValidation.errors, ...orderingValidation.errors];
    const allWarnings = [...groupingValidation.warnings, ...orderingValidation.warnings];

    return {
      isValid: groupingValidation.isValid && orderingValidation.isValid,
      errors: allErrors,
      warnings: allWarnings,
      validatedConfig: {
        groupByFields: groupingValidation.validatedFields,
        orderByFields: orderingValidation.validatedOrdering
      }
    };
  }

  /**
   * Cria erro de configuração com contexto detalhado
   */
  static createConfigurationError(
    message: string,
    context: {
      collection?: string;
      configuration?: string;
      validationErrors?: string[];
    }
  ): GroupingConfigurationError {
    return new GroupingConfigurationError(message, JSON.stringify(context));
  }
}