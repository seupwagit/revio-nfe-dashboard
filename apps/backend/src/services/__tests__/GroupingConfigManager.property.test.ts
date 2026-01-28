/**
 * Testes de propriedade para GroupingConfigManager
 * 
 * Valida propriedades universais do sistema de configuração de agrupamento usando fast-check
 * com mínimo de 100 iterações por teste para garantir cobertura abrangente
 */

// 1. Node.js built-ins
// (nenhum built-in necessário)

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// 3. Internal packages (workspace)
import {
    NFE_GROUPING_DEFAULTS,
    NFE_GROUPING_ENV_VARS,
    NFE_GROUPING_SUPPORTED_COLLECTIONS,
    NFE_GROUPING_VALID_FIELDS
} from '@fiscal/shared/constants/nfe-grouping.constants';
import { GroupingConfigurationError } from '@fiscal/shared/errors/grouping-configuration-error.class';

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';

describe('GroupingConfigManager - Property Tests', () => {
  let configManager: GroupingConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original
    originalEnv = { ...process.env };
    
    // Limpar variáveis de ambiente relacionadas
    Object.values(NFE_GROUPING_ENV_VARS).forEach(envVar => {
      delete process.env[envVar];
    });
    
    // Obter nova instância (limpar singleton para testes)
    (GroupingConfigManager as any).instance = undefined;
    configManager = GroupingConfigManager.getInstance();
  });

  afterEach(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
    
    // Limpar cache
    configManager.refreshConfig();
  });

  // ========== GERADORES FAST-CHECK ==========

  /**
   * Gerador de coleções suportadas
   */
  const supportedCollectionArb = fc.constantFrom(...NFE_GROUPING_SUPPORTED_COLLECTIONS);

  /**
   * Gerador de campos válidos para agrupamento
   */
  const validGroupingFieldArb = fc.constantFrom(...NFE_GROUPING_VALID_FIELDS.tbl_nfe_100);

  /**
   * Gerador de campos inválidos para agrupamento
   */
  const invalidGroupingFieldArb = fc.string({ minLength: 1, maxLength: 20 })
    .filter(field => !NFE_GROUPING_VALID_FIELDS.tbl_nfe_100.includes(field as any));

  /**
   * Gerador de configurações de agrupamento válidas
   */
  const validGroupingConfigArb = fc.record({
    groupByFields: fc.array(validGroupingFieldArb, { minLength: 1, maxLength: 3 }),
    enabled: fc.boolean(),
    globalEnabled: fc.boolean()
  });

  /**
   * Gerador de configurações de agrupamento inválidas
   */
  const invalidGroupingConfigArb = fc.oneof(
    // Campos inválidos
    fc.record({
      groupByFields: fc.array(invalidGroupingFieldArb, { minLength: 1, maxLength: 3 }),
      enabled: fc.constant(true),
      globalEnabled: fc.constant(true)
    }),
    // Campos vazios mas habilitado
    fc.record({
      groupByFields: fc.constant([]),
      enabled: fc.constant(true),
      globalEnabled: fc.constant(true)
    }),
    // Muitos campos
    fc.record({
      groupByFields: fc.array(validGroupingFieldArb, { minLength: 6, maxLength: 10 }),
      enabled: fc.constant(true),
      globalEnabled: fc.constant(true)
    })
  );

  /**
   * Gerador de valores de variáveis de ambiente
   */
  const envValueArb = fc.oneof(
    fc.constant('true'),
    fc.constant('false'),
    fc.constant('1'),
    fc.constant('0'),
    fc.constant(''),
    fc.constant(undefined)
  );

  // ========== PROPERTY 2: APLICAÇÃO CORRETA DE CONFIGURAÇÕES DE AGRUPAMENTO ==========

  describe('Property 2: Aplicação Correta de Configurações de Agrupamento', () => {
    /**
     * **Feature: nfe-configurable-grouping, Property 2: Aplicação Correta de Configurações de Agrupamento**
     * **Valida: Requisitos 1.1, 1.4, 1.5**
     * 
     * Para qualquer configuração válida de agrupamento especificada em variáveis de ambiente,
     * o sistema deve aplicar o agrupamento pelos campos especificados e refletir mudanças
     * de configuração em consultas subsequentes
     */
    it('should apply grouping configurations correctly for any valid environment setup', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        validGroupingConfigArb,
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        (collection, config, cacheTtl) => {
          // Arrange - Configurar variáveis de ambiente baseadas na configuração
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const enabledVar = `${collectionUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          // Configurar campos de agrupamento
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = config.groupByFields.join(',');
          process.env[NFE_GROUPING_ENV_VARS[enabledVar]] = config.enabled.toString();
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = config.globalEnabled.toString();
          
          if (cacheTtl) {
            process.env[NFE_GROUPING_ENV_VARS.CACHE_TTL] = cacheTtl;
          }

          // Act
          const result = configManager.getGroupingConfig(collection);

          // Assert - Propriedades universais
          expect(result).toBeDefined();
          expect(result.collection).toBe(collection);
          expect(result.globalEnabled).toBe(config.globalEnabled);
          expect(result.source).toBe('environment');
          expect(result.lastUpdated).toBeTypeOf('number');
          expect(result.lastUpdated).toBeGreaterThan(0);

          // **Requisito 1.1**: Configuração deve ser aplicada pelos campos especificados
          expect(result.groupByFields).toEqual(config.groupByFields);
          
          // **Requisito 1.4**: Múltiplas chaves devem ser processadas corretamente
          if (config.groupByFields.length > 1) {
            expect(result.groupByFields.length).toBe(config.groupByFields.length);
            config.groupByFields.forEach(field => {
              expect(result.groupByFields).toContain(field);
            });
          }

          // **Requisito 1.5**: Configuração deve ser aplicada em consultas subsequentes
          // (testado através da consistência de múltiplas chamadas)
          const result2 = configManager.getGroupingConfig(collection);
          expect(result2.groupByFields).toEqual(result.groupByFields);
          expect(result2.enabled).toBe(result.enabled);
          expect(result2.globalEnabled).toBe(result.globalEnabled);

          // Propriedade: enabled deve refletir tanto configuração local quanto global
          const expectedEnabled = config.enabled && config.groupByFields.length > 0;
          expect(result.enabled).toBe(expectedEnabled);

          // Propriedade: Campos devem ser válidos para a coleção
          result.groupByFields.forEach(field => {
            expect(NFE_GROUPING_VALID_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_FIELDS])
              .toContain(field);
          });
        }
      ), { numRuns: 100 });
    });

    it('should reflect configuration changes in subsequent queries', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        validGroupingFieldArb,
        validGroupingFieldArb,
        fc.boolean(),
        fc.boolean(),
        (collection, initialField, changedField, initialEnabled, changedEnabled) => {
          // Arrange - Configuração inicial
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const enabledVar = `${collectionUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = initialField;
          process.env[NFE_GROUPING_ENV_VARS[enabledVar]] = initialEnabled.toString();
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'true';

          // Act - Primeira consulta
          const initialConfig = configManager.getGroupingConfig(collection);

          // Arrange - Alterar configuração
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = changedField;
          process.env[NFE_GROUPING_ENV_VARS[enabledVar]] = changedEnabled.toString();
          
          // Force cache refresh to simulate runtime changes
          configManager.refreshConfig();

          // Act - Segunda consulta após mudança
          const changedConfig = configManager.getGroupingConfig(collection);

          // Assert - **Requisito 1.5**: Mudanças devem ser refletidas
          expect(changedConfig.groupByFields).toEqual([changedField]);
          expect(changedConfig.enabled).toBe(changedEnabled && changedField.length > 0);
          
          // Propriedade: Configurações devem ser diferentes se os valores mudaram
          if (initialField !== changedField || initialEnabled !== changedEnabled) {
            expect(changedConfig.groupByFields).not.toEqual(initialConfig.groupByFields);
          }

          // Propriedade: Timestamp deve ser atualizado
          expect(changedConfig.lastUpdated).toBeGreaterThanOrEqual(initialConfig.lastUpdated!);
        }
      ), { numRuns: 100 });
    });

    it('should handle multiple fields correctly with proper validation', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        fc.array(validGroupingFieldArb, { minLength: 1, maxLength: 5 }),
        fc.boolean(),
        (collection, fields, globalEnabled) => {
          // Remove duplicatas para evitar configurações inválidas
          const uniqueFields = [...new Set(fields)];
          
          // Arrange
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = uniqueFields.join(',');
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabled.toString();

          // Act
          const result = configManager.getGroupingConfig(collection);

          // Assert - **Requisito 1.4**: Múltiplas chaves devem ser processadas
          expect(result.groupByFields).toEqual(uniqueFields);
          expect(result.groupByFields.length).toBe(uniqueFields.length);
          
          // Propriedade: Todos os campos devem ser válidos
          result.groupByFields.forEach(field => {
            expect(NFE_GROUPING_VALID_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_FIELDS])
              .toContain(field);
          });

          // Propriedade: Ordem deve ser preservada
          uniqueFields.forEach((field, index) => {
            expect(result.groupByFields[index]).toBe(field);
          });

          // Propriedade: enabled deve considerar se há campos válidos
          expect(result.enabled).toBe(uniqueFields.length > 0);
        }
      ), { numRuns: 100 });
    });

    it('should handle empty and whitespace configurations correctly', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant(',,,'),
          fc.constant('  ,  ,  '),
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => s.trim().length === 0)
        ),
        (collection, emptyConfig) => {
          // Arrange
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = emptyConfig;
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'true';

          // Act
          const result = configManager.getGroupingConfig(collection);

          // Assert - Propriedades para configurações vazias
          expect(result.groupByFields).toEqual([]);
          expect(result.enabled).toBe(false);
          expect(result.collection).toBe(collection);
          expect(result.globalEnabled).toBe(true);
          expect(result.source).toBe('environment');
        }
      ), { numRuns: 100 });
    });

    it('should reject invalid configurations consistently', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        invalidGroupingConfigArb,
        (collection, invalidConfig) => {
          // Arrange
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = invalidConfig.groupByFields.join(',');
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = invalidConfig.globalEnabled.toString();

          // Act & Assert - Deve sempre lançar erro para configuração inválida
          expect(() => {
            configManager.getGroupingConfig(collection);
          }).toThrow(GroupingConfigurationError);
        }
      ), { numRuns: 100 });
    });

    it('should maintain cache consistency across configuration changes', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        validGroupingFieldArb,
        validGroupingFieldArb,
        (collection, field1, field2) => {
          // Skip if fields are the same to ensure we test actual changes
          fc.pre(field1 !== field2);
          
          // Arrange - Configuração inicial
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = field1;
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'true';

          // Act - Primeira consulta (popula cache)
          const config1 = configManager.getGroupingConfig(collection);
          
          // Act - Segunda consulta (deve usar cache)
          const config2 = configManager.getGroupingConfig(collection);
          
          // Assert - Cache deve retornar mesma configuração
          expect(config1).toBe(config2); // Mesma referência de objeto
          expect(config1.groupByFields).toEqual([field1]);

          // Arrange - Alterar configuração
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = field2;
          
          // Act - Detectar mudanças
          const changes = configManager.detectConfigurationChanges(collection);
          expect(changes).not.toBeNull();
          expect(changes!.hasSignificantChanges).toBe(true);

          // Act - Nova consulta deve refletir mudanças
          const config3 = configManager.getGroupingConfig(collection);
          
          // Assert - Nova configuração deve ser diferente
          expect(config3.groupByFields).toEqual([field2]);
          expect(config3.groupByFields).not.toEqual(config1.groupByFields);
        }
      ), { numRuns: 100 });
    });

    it('should handle global enable/disable correctly', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        validGroupingFieldArb,
        envValueArb,
        (collection, field, globalEnabledValue) => {
          // Arrange
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = field;
          if (globalEnabledValue !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabledValue;
          }

          // Act
          const result = configManager.getGroupingConfig(collection);

          // Assert - Propriedades de controle global
          const expectedGlobalEnabled = globalEnabledValue !== 'false' && globalEnabledValue !== '0';
          expect(result.globalEnabled).toBe(expectedGlobalEnabled);
          
          // Propriedade: Configuração local deve ser independente do global
          expect(result.groupByFields).toEqual([field]);
          expect(result.enabled).toBe(true); // Campo válido sempre habilita localmente
          
          // Propriedade: Source deve ser environment quando configurado
          expect(result.source).toBe('environment');
        }
      ), { numRuns: 100 });
    });
  });

  // ========== PROPERTY: CONFIGURATION VALIDATION ==========

  describe('Property: Configuration Validation', () => {
    it('should validate field names against collection schema consistently', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (collection, fields) => {
          // Arrange
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = fields.join(',');
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'true';

          // Determine if configuration should be valid
          const validFields = NFE_GROUPING_VALID_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_FIELDS];
          const allFieldsValid = fields.every(field => validFields.includes(field as any));

          if (allFieldsValid) {
            // Act - Should succeed for valid fields
            const result = configManager.getGroupingConfig(collection);
            
            // Assert
            expect(result.groupByFields).toEqual(fields);
            expect(result.enabled).toBe(true);
          } else {
            // Act & Assert - Should fail for invalid fields
            expect(() => {
              configManager.getGroupingConfig(collection);
            }).toThrow(GroupingConfigurationError);
          }
        }
      ), { numRuns: 100 });
    });

    it('should handle mixed valid and invalid fields appropriately', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        fc.array(validGroupingFieldArb, { minLength: 1, maxLength: 2 }),
        fc.array(invalidGroupingFieldArb, { minLength: 1, maxLength: 2 }),
        (collection, validFields, invalidFields) => {
          // Arrange - Mix valid and invalid fields
          const mixedFields = [...validFields, ...invalidFields];
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = mixedFields.join(',');
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'true';

          // Act & Assert - Should always fail when any field is invalid
          expect(() => {
            configManager.getGroupingConfig(collection);
          }).toThrow(GroupingConfigurationError);
        }
      ), { numRuns: 100 });
    });
  });

  // ========== PROPERTY: DEFAULT BEHAVIOR ==========

  describe('Property: Default Behavior', () => {
    it('should provide consistent default configuration when no environment variables are set', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        (collection) => {
          // Arrange - No environment variables set (already cleared in beforeEach)
          
          // Act
          const result = configManager.getGroupingConfig(collection);

          // Assert - Default behavior properties
          expect(result.collection).toBe(collection);
          expect(result.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
          expect(result.enabled).toBe(true);
          expect(result.globalEnabled).toBe(true);
          expect(result.source).toBe('default');
          expect(result.lastUpdated).toBeTypeOf('number');
        }
      ), { numRuns: 100 });
    });
  });
});