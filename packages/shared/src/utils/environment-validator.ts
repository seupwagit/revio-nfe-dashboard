import {
    ENVIRONMENT_ERROR_MESSAGES,
    ENVIRONMENT_KEYS,
    ENVIRONMENT_LOG_PREFIXES,
    ENVIRONMENT_VALIDATION_CONFIG,
    ENVIRONMENT_VALUE_TYPES
} from '../constants/environment-config.constants';
import { GroupingConfigurationError } from '../errors/grouping-configuration-error.class';

/**
 * Interface para resultado de validação de ambiente
 */
export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedConfig: Record<string, any>;
}

/**
 * Interface para configuração de validação
 */
interface ValidationConfig {
  type: string;
  required: boolean;
  default?: string;
  validValues?: readonly string[];
  min?: number;
  max?: number;
  minLength?: number;
  description?: string;
}

/**
 * Utilitário para validação de configurações de ambiente
 * 
 * Valida variáveis de ambiente conforme regras definidas,
 * aplica valores padrão e converte tipos apropriadamente
 */
export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private validatedConfig: Record<string, any> = {};
  private lastValidation: number = 0;
  private readonly VALIDATION_CACHE_TTL = 60000; // 1 minuto

  private constructor() {}

  /**
   * Obtém instância singleton do validador
   */
  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Valida todas as configurações de ambiente
   */
  validateEnvironment(): EnvironmentValidationResult {
    const now = Date.now();
    
    // Usar cache se ainda válido
    if (this.validatedConfig && (now - this.lastValidation) < this.VALIDATION_CACHE_TTL) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        validatedConfig: this.validatedConfig
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const validatedConfig: Record<string, any> = {};

    // Validar cada configuração
    Object.entries(ENVIRONMENT_VALIDATION_CONFIG).forEach(([key, config]) => {
      try {
        const validatedValue = this.validateSingleConfig(key, config);
        validatedConfig[key] = validatedValue;
      } catch (error) {
        if (error instanceof GroupingConfigurationError) {
          errors.push(error.message);
        } else if (error instanceof Error) {
          errors.push(`Erro inesperado validando ${key}: ${error.message}`);
        } else {
          errors.push(`Erro desconhecido validando ${key}: ${String(error)}`);
        }
      }
    });

    // Validações específicas de agrupamento NFe
    this.validateNFeGroupingConfig(validatedConfig, errors, warnings);

    const isValid = errors.length === 0;
    
    if (isValid) {
      this.validatedConfig = validatedConfig;
      this.lastValidation = now;
    }

    return {
      isValid,
      errors,
      warnings,
      validatedConfig: isValid ? validatedConfig : {}
    };
  }

  /**
   * Valida uma configuração específica
   */
  private validateSingleConfig(key: string, config: ValidationConfig): any {
    const envValue = process.env[key];
    
    // Verificar se é obrigatória
    if (config.required && !envValue) {
      throw new GroupingConfigurationError(
        ENVIRONMENT_ERROR_MESSAGES.REQUIRED_MISSING(key),
        `validation-${key}`
      );
    }

    // Usar valor padrão se não fornecido
    const value = envValue || config.default;
    if (!value) {
      return undefined;
    }

    // Converter e validar tipo
    return this.convertAndValidateType(key, value, config);
  }

  /**
   * Converte e valida tipo de valor
   */
  private convertAndValidateType(key: string, value: string, config: ValidationConfig): any {
    switch (config.type) {
      case ENVIRONMENT_VALUE_TYPES.STRING:
        return this.validateStringValue(key, value, config);
      
      case ENVIRONMENT_VALUE_TYPES.NUMBER:
        return this.validateNumberValue(key, value, config);
      
      case ENVIRONMENT_VALUE_TYPES.BOOLEAN:
        return this.validateBooleanValue(key, value, config);
      
      case ENVIRONMENT_VALUE_TYPES.ARRAY:
        return this.validateArrayValue(key, value, config);
      
      default:
        throw new GroupingConfigurationError(
          `Tipo de configuração não suportado: ${config.type}`,
          `type-validation-${key}`
        );
    }
  }

  /**
   * Valida valor string
   */
  private validateStringValue(key: string, value: string, config: ValidationConfig): string {
    // Validar comprimento mínimo
    if (config.minLength && value.length < config.minLength) {
      throw new GroupingConfigurationError(
        ENVIRONMENT_ERROR_MESSAGES.TOO_SHORT(key, value, config.minLength),
        `string-validation-${key}`
      );
    }

    // Validar valores válidos
    if (config.validValues && !config.validValues.includes(value)) {
      throw new GroupingConfigurationError(
        ENVIRONMENT_ERROR_MESSAGES.INVALID_VALUE(key, value, [...config.validValues]),
        `value-validation-${key}`
      );
    }

    return value;
  }

  /**
   * Valida valor numérico
   */
  private validateNumberValue(key: string, value: string, config: ValidationConfig): number {
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      throw new GroupingConfigurationError(
        ENVIRONMENT_ERROR_MESSAGES.INVALID_TYPE(key, 'number', typeof value),
        `number-validation-${key}`
      );
    }

    // Validar intervalo
    if (config.min !== undefined && numValue < config.min) {
      throw new GroupingConfigurationError(
        ENVIRONMENT_ERROR_MESSAGES.OUT_OF_RANGE(key, numValue, config.min, config.max),
        `range-validation-${key}`
      );
    }

    if (config.max !== undefined && numValue > config.max) {
      throw new GroupingConfigurationError(
        ENVIRONMENT_ERROR_MESSAGES.OUT_OF_RANGE(key, numValue, config.min, config.max),
        `range-validation-${key}`
      );
    }

    return numValue;
  }

  /**
   * Valida valor booleano
   */
  private validateBooleanValue(key: string, value: string, config: ValidationConfig): boolean {
    const lowerValue = value.toLowerCase();
    
    if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
      return true;
    }
    
    if (['false', '0', 'no', 'off'].includes(lowerValue)) {
      return false;
    }

    throw new GroupingConfigurationError(
      ENVIRONMENT_ERROR_MESSAGES.INVALID_TYPE(key, 'boolean', value),
      `boolean-validation-${key}`
    );
  }

  /**
   * Valida valor array (separado por vírgula)
   */
  private validateArrayValue(key: string, value: string, config: ValidationConfig): string[] {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * Validações específicas para configuração de agrupamento NFe
   */
  private validateNFeGroupingConfig(
    config: Record<string, any>, 
    errors: string[], 
    warnings: string[]
  ): void {
    // Validar se JWT_SECRET está configurado adequadamente
    const jwtSecret = config[ENVIRONMENT_KEYS.JWT_SECRET];
    if (jwtSecret && jwtSecret.length < 32) {
      errors.push('JWT_SECRET deve ter pelo menos 32 caracteres para segurança adequada');
    }

    // Validar configuração de agrupamento global vs específica
    const globalEnabled = config[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED];
    const tblNfe100Enabled = config[ENVIRONMENT_KEYS.TBL_NFE_100_GROUPING_ENABLED];
    
    if (!globalEnabled && tblNfe100Enabled) {
      warnings.push(
        'Agrupamento específico para tbl_nfe_100 está habilitado mas agrupamento global está desabilitado'
      );
    }

    // Validar campos de agrupamento
    const groupByFields = config[ENVIRONMENT_KEYS.TBL_NFE_100_GROUP_BY];
    if (groupByFields) {
      this.validateGroupByFields(groupByFields, errors, warnings);
    }

    // Validar configuração de ordenação
    const orderBy = config[ENVIRONMENT_KEYS.TBL_NFE_100_ORDER_BY];
    if (orderBy) {
      this.validateOrderByConfig(orderBy, errors, warnings);
    }
  }

  /**
   * Valida campos de agrupamento
   */
  private validateGroupByFields(groupByFields: string, errors: string[], warnings: string[]): void {
    const fields = groupByFields.split(',').map(f => f.trim()).filter(f => f.length > 0);
    
    if (fields.length === 0) {
      errors.push('TBL_NFE_100_GROUP_BY não pode estar vazio quando especificado');
      return;
    }

    if (fields.length > 5) {
      warnings.push('Muitos campos de agrupamento podem impactar performance');
    }

    // Validar formato dos campos
    const invalidFields = fields.filter(field => !/^[A-Z_][A-Z0-9_]*$/.test(field));
    if (invalidFields.length > 0) {
      errors.push(`Campos de agrupamento com formato inválido: ${invalidFields.join(', ')}`);
    }
  }

  /**
   * Valida configuração de ordenação
   */
  private validateOrderByConfig(orderBy: string, errors: string[], warnings: string[]): void {
    const orderParts = orderBy.split(',').map(part => part.trim());
    
    for (const part of orderParts) {
      const [field, direction] = part.split(' ').filter(p => p.length > 0);
      
      if (!field) {
        errors.push(`Campo de ordenação inválido: ${part}`);
        continue;
      }

      if (direction && !['ASC', 'DESC'].includes(direction.toUpperCase())) {
        errors.push(`Direção de ordenação inválida: ${direction} (deve ser ASC ou DESC)`);
      }
    }
  }

  /**
   * Obtém configuração validada
   */
  getValidatedConfig(): Record<string, any> {
    const result = this.validateEnvironment();
    if (!result.isValid) {
      throw new GroupingConfigurationError(
        'Configuração de ambiente inválida',
        'environment-validation-failed'
      );
    }
    return result.validatedConfig;
  }

  /**
   * Limpa cache de validação (útil para testes)
   */
  clearCache(): void {
    this.validatedConfig = {};
    this.lastValidation = 0;
  }

  /**
   * Registra resultado de validação nos logs
   */
  logValidationResult(result: EnvironmentValidationResult): void {
    if (result.isValid) {
      console.log(`${ENVIRONMENT_LOG_PREFIXES.CONFIG} ✅ Configuração de ambiente validada com sucesso`);
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          console.warn(`${ENVIRONMENT_LOG_PREFIXES.WARNING} ⚠️ ${warning}`);
        });
      }
    } else {
      console.error(`${ENVIRONMENT_LOG_PREFIXES.ERROR} ❌ Configuração de ambiente inválida`);
      result.errors.forEach(error => {
        console.error(`${ENVIRONMENT_LOG_PREFIXES.ERROR} - ${error}`);
      });
    }
  }
}