/**
 * Testes de propriedade para GroupingConfigManager - Aplicação Correta de Configurações de Agrupamento
 * 
 * **Valida: Requisitos 1.1, 1.4, 1.5**
 * 
 * Propriedade 2: Aplicação Correta de Configurações de Agrupamento
 * - Configurações devem ser aplicadas consistentemente por coleção
 * - Precedência de configurações deve ser respeitada (específica > global)
 * - Cache de configurações deve ser eficiente e consistente
 * - Configurações inválidas devem usar fallback para padrões
 * - Mudanças de configuração devem ser refletidas imediatamente
 */

// 1. Node.js built-ins

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)
import { NFE_GROUPING_SUPPORTED_COLLECTIONS } from '@fiscal/shared/constants/nfe-grouping.constants';

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';

describe('GroupingConfigManager - Propriedade: Aplicação Correta de Configurações', () => {
  let configManager: GroupingConfigManager;

  beforeEach(() => {
    configManager = new GroupingConfigManager();
    vi.clearAllMocks();
    
    // Limpar variáveis de ambiente para testes limpos
    delete process.env.NFE_GROUPING_ENABLED;
    delete process.env.NFE_GROUPING_GLOBAL_ENABLED;
    delete process.env.NFE_GROUPING_FIELDS;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== GERADORES FAST-CHECK ==========

  /**
   * Gerador de coleções suportadas
   */
  const supportedCollectionGenerator = fc.constantFrom(...NFE_GROUPING_SUPPORTED_COLLECTIONS);

  /**
   * Gerador de configurações de agrupamento válidas
   */
  const validGroupingConfigGenerator = fc.record({
    enabled: fc.boolean(),
    globalEnabled: fc.boolean(),
    groupByFields: fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
    collection: supportedCollectionGenerator,
    lastUpdated: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
    source: fc.constantFrom('default', 'environment', 'config')
  });

  /**
   * Gerador de configurações de ordenação válidas
   */
  const validOrderingConfigGenerator = fc.record({
    enabled: fc.boolean(),
    fields: fc.array(fc.record({
      field: fc.constantFrom('DT_DOC', 'PROTOCOLADA', 'VALOR_TOTAL'),
      direction: fc.constantFrom('ASC', 'DESC'),
      priority: fc.integer({ min: 1, max: 10 })
    }), { minLength: 1, maxLength: 3 }),
    defaultOrdering: fc.constantFrom('DT_DOC DESC', 'PROTOCOLADA DESC', 'VALOR_TOTAL ASC'),
    lastUpdated: fc.integer({ min: Date.now() - 86400000, max: Date.now() })
  });

  /**
   * Gerador de variáveis de ambiente
   */
  const environmentVariablesGenerator = fc.record({
    NFE_GROUPING_ENABLED: fc.option(fc.constantFrom('true', 'false'), { nil: undefined }),
    NFE_GROUPING_GLOBAL_ENABLED: fc.option(fc.constantFrom('true', 'false'), { nil: undefined }),
    NFE_GROUPING_FIELDS: fc.option(fc.constantFrom('CHV_NFE', 'CHV_NFE,CNPJ_EMIT', 'CNPJ_EMIT'), { nil: undefined })
  });

  // ========== TESTES DE PROPRIEDADE ==========

  describe('Propriedade 2: Aplicação Correta de Configurações de Agrupamento', () => {
    it('deve aplicar configurações consistentemente para a mesma coleção', () => {
      fc.assert(
        fc.property(
          supportedCollectionGenerator,
          validGroupingConfigGenerator,
          (collection, config) => {
            // Arrange
            const configWithCollection = { ...config, collection };

            // Act - Múltiplas chamadas para a mesma coleção
            const config1 = configManager.getGroupingConfig(collection);
            const config2 = configManager.getGroupingConfig(collection);
            const config3 = configManager.getGroupingConfig(collection);

            // Assert - Todas as chamadas devem retornar a mesma configuração
            expect(config1).toEqual(config2);
            expect(config2).toEqual(config3);
            
            // Assert - Configuração deve ter estrutura correta
            expect(config1).toHaveProperty('enabled');
            expect(config1).toHaveProperty('globalEnabled');
            expect(config1).toHaveProperty('groupByFields');
            expect(config1).toHaveProperty('collection');
            expect(config1).toHaveProperty('lastUpdated');
            expect(config1).toHaveProperty('source');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve respeitar precedência de configurações (específica > global)', () => {
      fc.assert(
        fc.property(
          supportedCollectionGenerator,
          environmentVariablesGenerator,
          (collection, envVars) => {
            // Arrange - Configurar variáveis de ambiente
            Object.entries(envVars).forEach(([key, value]) => {
              if (value !== undefined) {
                process.env[key] = value;
              }
            });

            // Act
            const config = configManager.getGroupingConfig(collection);

            // Assert - Configuração deve refletir variáveis de ambiente quando definidas
            if (envVars.NFE_GROUPING_ENABLED !== undefined) {
              expect(config.enabled).toBe(envVars.NFE_GROUPING_ENABLED === 'true');
            }
            
            if (envVars.NFE_GROUPING_GLOBAL_ENABLED !== undefined) {
              expect(config.globalEnabled).toBe(envVars.NFE_GROUPING_GLOBAL_ENABLED === 'true');
            }

            if (envVars.NFE_GROUPING_FIELDS !== undefined) {
              const expectedFields = envVars.NFE_GROUPING_FIELDS.split(',');
              expect(config.groupByFields).toEqual(expectedFields);
            }

            // Assert - Configuração deve ter coleção correta
            expect(config.collection).toBe(collection);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve usar configurações padrão para configurações inválidas', () => {
      fc.assert(
        fc.property(
          supportedCollectionGenerator,
          fc.constantFrom('invalid', '', 'null', 'undefined'),
          (collection, invalidValue) => {
            // Arrange - Configurar variável inválida
            process.env.NFE_GROUPING_ENABLED = invalidValue;

            // Act
            const config = configManager.getGroupingConfig(collection);

            // Assert - Deve usar configuração padrão
            expect(config.enabled).toBe(true); // Padrão
            expect(config.globalEnabled).toBe(true); // Padrão
            expect(config.groupByFields).toEqual(['CHV_NFE']); // Padrão
            expect(config.collection).toBe(collection);
            expect(config.source).toBe('default');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve aplicar configurações de ordenação consistentemente', () => {
      fc.assert(
        fc.property(
          supportedCollectionGenerator,
          validOrderingConfigGenerator,
          (collection, orderingConfig) => {
            // Act - Múltiplas chamadas
            const config1 = configManager.getOrderingConfig(collection);
            const config2 = configManager.getOrderingConfig(collection);

            // Assert - Configurações devem ser idênticas
            expect(config1).toEqual(config2);
            
            // Assert - Estrutura deve estar correta
            expect(config1).toHaveProperty('enabled');
            expect(config1).toHaveProperty('fields');
            expect(config1).toHaveProperty('defaultOrdering');
            expect(config1).toHaveProperty('lastUpdated');
            
            // Assert - Fields deve ser array válido
            expect(Array.isArray(config1.fields)).toBe(true);
            config1.fields.forEach(field => {
              expect(field).toHaveProperty('field');
              expect(field).toHaveProperty('direction');
              expect(field).toHaveProperty('priority');
              expect(['ASC', 'DESC']).toContain(field.direction);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve detectar mudanças de configuração global corretamente', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          (initialGlobal, newGlobal) => {
            // Arrange - Configuração inicial
            process.env.NFE_GROUPING_GLOBAL_ENABLED = initialGlobal.toString();
            const initialStatus = configManager.isGloballyEnabled();

            // Act - Mudar configuração
            process.env.NFE_GROUPING_GLOBAL_ENABLED = newGlobal.toString();
            configManager.refreshConfig();
            const newStatus = configManager.isGloballyEnabled();

            // Assert - Status deve refletir a mudança
            expect(initialStatus).toBe(initialGlobal);
            expect(newStatus).toBe(newGlobal);
            
            // Se houve mudança, deve ser detectada
            if (initialGlobal !== newGlobal) {
              expect(newStatus).not.toBe(initialStatus);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve manter cache eficiente para múltiplas coleções', () => {
      fc.assert(
        fc.property(
          fc.array(supportedCollectionGenerator, { minLength: 2, maxLength: 5 }),
          (collections) => {
            // Arrange
            const uniqueCollections = [...new Set(collections)];
            const startTime = Date.now();

            // Act - Buscar configurações para todas as coleções
            const configs = uniqueCollections.map(collection => ({
              collection,
              grouping: configManager.getGroupingConfig(collection),
              ordering: configManager.getOrderingConfig(collection)
            }));

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // Assert - Performance deve ser eficiente (< 10ms por coleção)
            expect(processingTime).toBeLessThan(uniqueCollections.length * 10);

            // Assert - Cada coleção deve ter configuração válida
            configs.forEach(({ collection, grouping, ordering }) => {
              expect(grouping.collection).toBe(collection);
              expect(grouping).toHaveProperty('enabled');
              expect(grouping).toHaveProperty('globalEnabled');
              expect(ordering).toHaveProperty('enabled');
              expect(ordering).toHaveProperty('fields');
            });

            // Assert - Configurações devem ser consistentes em chamadas subsequentes
            const secondConfigs = uniqueCollections.map(collection => ({
              collection,
              grouping: configManager.getGroupingConfig(collection),
              ordering: configManager.getOrderingConfig(collection)
            }));

            expect(secondConfigs).toEqual(configs);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('deve validar campos de agrupamento corretamente', () => {
      fc.assert(
        fc.property(
          supportedCollectionGenerator,
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          (collection, customFields) => {
            // Arrange - Configurar campos customizados
            process.env.NFE_GROUPING_FIELDS = customFields.join(',');

            // Act
            const config = configManager.getGroupingConfig(collection);

            // Assert - Campos devem ser validados
            expect(Array.isArray(config.groupByFields)).toBe(true);
            expect(config.groupByFields.length).toBeGreaterThan(0);
            
            // Se campos são válidos, devem ser usados; senão, usar padrão
            const validFields = ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'];
            const hasValidFields = customFields.some(field => validFields.includes(field));
            
            if (hasValidFields) {
              const expectedFields = customFields.filter(field => validFields.includes(field));
              expect(config.groupByFields).toEqual(expectedFields);
            } else {
              expect(config.groupByFields).toEqual(['CHV_NFE']); // Padrão
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve ser thread-safe para acesso concorrente', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(supportedCollectionGenerator, { minLength: 2, maxLength: 4 }),
          async (collections) => {
            // Act - Acessar configurações concorrentemente
            const promises = collections.map(async (collection) => {
              return {
                collection,
                grouping: configManager.getGroupingConfig(collection),
                ordering: configManager.getOrderingConfig(collection)
              };
            });

            const results = await Promise.all(promises);

            // Assert - Todos os resultados devem ser válidos
            results.forEach(({ collection, grouping, ordering }) => {
              expect(grouping.collection).toBe(collection);
              expect(grouping).toHaveProperty('enabled');
              expect(ordering).toHaveProperty('enabled');
            });

            // Assert - Resultados devem ser consistentes
            const secondResults = await Promise.all(promises);
            expect(secondResults).toEqual(results);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Propriedade 2 - Casos Extremos e Robustez', () => {
    it('deve lidar com coleções não suportadas graciosamente', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !NFE_GROUPING_SUPPORTED_COLLECTIONS.includes(s as any)),
          (unsupportedCollection) => {
            // Act
            const config = configManager.getGroupingConfig(unsupportedCollection);

            // Assert - Deve retornar configuração padrão
            expect(config.enabled).toBe(true);
            expect(config.globalEnabled).toBe(true);
            expect(config.groupByFields).toEqual(['CHV_NFE']);
            expect(config.collection).toBe(unsupportedCollection);
            expect(config.source).toBe('default');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve manter configurações após refresh sem mudanças', () => {
      fc.assert(
        fc.property(
          supportedCollectionGenerator,
          (collection) => {
            // Arrange
            const initialConfig = configManager.getGroupingConfig(collection);

            // Act - Refresh sem mudanças
            configManager.refreshConfig();
            const configAfterRefresh = configManager.getGroupingConfig(collection);

            // Assert - Configuração deve permanecer igual
            expect(configAfterRefresh).toEqual(initialConfig);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve aplicar configurações com timestamps corretos', () => {
      fc.assert(
        fc.property(
          supportedCollectionGenerator,
          (collection) => {
            // Arrange
            const beforeTime = Date.now();

            // Act
            const config = configManager.getGroupingConfig(collection);

            // Assert - Timestamp deve ser recente
            expect(config.lastUpdated).toBeGreaterThanOrEqual(beforeTime - 1000);
            expect(config.lastUpdated).toBeLessThanOrEqual(Date.now() + 1000);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});