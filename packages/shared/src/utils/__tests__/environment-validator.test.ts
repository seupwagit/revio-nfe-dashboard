import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENVIRONMENT_DEFAULTS, ENVIRONMENT_KEYS } from '../../constants/environment-config.constants';
import { GroupingConfigurationError } from '../../errors/grouping-configuration-error.class';
import { EnvironmentValidator } from '../environment-validator';

describe('EnvironmentValidator', () => {
  let validator: EnvironmentValidator;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original
    originalEnv = { ...process.env };
    
    // Limpar variáveis de ambiente para testes
    Object.keys(ENVIRONMENT_KEYS).forEach(key => {
      delete process.env[ENVIRONMENT_KEYS[key as keyof typeof ENVIRONMENT_KEYS]];
    });

    validator = EnvironmentValidator.getInstance();
    validator.clearCache();
  });

  afterEach(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EnvironmentValidator.getInstance();
      const instance2 = EnvironmentValidator.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('validateEnvironment', () => {
    it('should validate with default values when no env vars set', () => {
      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedConfig[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED]).toBe(true);
      expect(result.validatedConfig[ENVIRONMENT_KEYS.TBL_NFE_100_GROUP_BY]).toBe(ENVIRONMENT_DEFAULTS.TBL_NFE_100_GROUP_BY);
    });

    it('should fail validation when required JWT_SECRET is missing', () => {
      // JWT_SECRET é obrigatório
      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Variável de ambiente obrigatória não encontrada: JWT_SECRET');
    });

    it('should validate successfully with all required vars set', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32); // 32 caracteres mínimos

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with short JWT_SECRET', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'short'; // Menos de 32 caracteres

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('32 caracteres'))).toBe(true);
    });

    it('should validate boolean values correctly', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED] = 'true';
      process.env[ENVIRONMENT_KEYS.TBL_NFE_100_GROUPING_ENABLED] = 'false';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.validatedConfig[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED]).toBe(true);
      expect(result.validatedConfig[ENVIRONMENT_KEYS.TBL_NFE_100_GROUPING_ENABLED]).toBe(false);
    });

    it('should validate number values correctly', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_CACHE_TTL] = '30000';
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_MAX_GROUPS] = '500';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.validatedConfig[ENVIRONMENT_KEYS.NFE_GROUPING_CACHE_TTL]).toBe(30000);
      expect(result.validatedConfig[ENVIRONMENT_KEYS.NFE_GROUPING_MAX_GROUPS]).toBe(500);
    });

    it('should fail validation with invalid number values', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_CACHE_TTL] = 'invalid';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('esperado number'))).toBe(true);
    });

    it('should fail validation with out of range number values', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_CACHE_TTL] = '500'; // Menor que mínimo (1000)

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('fora do intervalo'))).toBe(true);
    });

    it('should validate enum values correctly', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.NODE_ENV] = 'production';
      process.env[ENVIRONMENT_KEYS.LOG_LEVEL] = 'info';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.validatedConfig[ENVIRONMENT_KEYS.NODE_ENV]).toBe('production');
      expect(result.validatedConfig[ENVIRONMENT_KEYS.LOG_LEVEL]).toBe('info');
    });

    it('should fail validation with invalid enum values', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.NODE_ENV] = 'invalid_env';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Valor inválido'))).toBe(true);
    });

    it('should generate warnings for conflicting configurations', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED] = 'false';
      process.env[ENVIRONMENT_KEYS.TBL_NFE_100_GROUPING_ENABLED] = 'true';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('agrupamento global está desabilitado')
      )).toBe(true);
    });

    it('should validate grouping fields format', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE,invalid-field';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('formato inválido')
      )).toBe(true);
    });

    it('should validate ordering configuration', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);
      process.env[ENVIRONMENT_KEYS.TBL_NFE_100_ORDER_BY] = 'DT_DOC INVALID_DIRECTION';

      const result = validator.validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Direção de ordenação inválida')
      )).toBe(true);
    });

    it('should use cache for subsequent validations', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);

      // Primeira validação
      const result1 = validator.validateEnvironment();
      expect(result1.isValid).toBe(true);

      // Alterar ambiente (não deve afetar resultado cached)
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED] = 'false';

      // Segunda validação (deve usar cache)
      const result2 = validator.validateEnvironment();
      expect(result2.validatedConfig[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED]).toBe(true); // Valor cached
    });
  });

  describe('getValidatedConfig', () => {
    it('should return validated config when valid', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);

      const config = validator.getValidatedConfig();

      expect(config).toBeDefined();
      expect(config[ENVIRONMENT_KEYS.JWT_SECRET]).toBe('a'.repeat(32));
    });

    it('should throw error when configuration is invalid', () => {
      // JWT_SECRET obrigatório não definido

      expect(() => validator.getValidatedConfig()).toThrow(GroupingConfigurationError);
    });
  });

  describe('clearCache', () => {
    it('should clear validation cache', () => {
      process.env[ENVIRONMENT_KEYS.JWT_SECRET] = 'a'.repeat(32);

      // Primeira validação
      validator.validateEnvironment();

      // Alterar ambiente
      process.env[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED] = 'false';

      // Limpar cache
      validator.clearCache();

      // Nova validação deve refletir mudança
      const result = validator.validateEnvironment();
      expect(result.validatedConfig[ENVIRONMENT_KEYS.NFE_GROUPING_ENABLED]).toBe(false);
    });
  });
});