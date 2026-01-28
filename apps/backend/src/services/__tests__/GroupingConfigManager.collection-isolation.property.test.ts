/**
 * Teste de Propriedade 11: Isolamento de Configurações por Coleção
 * 
 * **Feature: nfe-configurable-grouping, Property 11: Isolamento de Configurações por Coleção**
 * **Valida: Requisitos 10.1, 10.2, 10.3, 10.4, 10.5**
 * 
 * Para qualquer conjunto de coleções com configurações independentes, mudanças na configuração 
 * de uma coleção não devem afetar outras coleções, e coleções sem configuração específica 
 * devem usar configuração global padrão
 * 
 * Configuração de teste: numRuns reduzido para 10 para performance otimizada
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

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';

describe('GroupingConfigManager - Property 11: Isolamento de Configurações por Coleção', () => {
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

  // ========== GERADORES FAST-CHECK (OTIMIZADOS) ==========

  /**
   * Gerador de coleções suportadas
   */
  const supportedCollectionArb = fc.constantFrom(...NFE_GROUPING_SUPPORTED_COLLECTIONS);

  /**
   * Gerador de campos válidos para agrupamento
   */
  const validGroupingFieldArb = fc.constantFrom(...NFE_GROUPING_VALID_FIELDS.tbl_nfe_100);

  /**
   * Gerador de múltiplos campos válidos (simplificado)
   */
  const multipleValidFieldsArb = fc.array(validGroupingFieldArb, { minLength: 1, maxLength: 2 })
    .map(fields => [...new Set(fields)]); // Remove duplicatas

  /**
   * Gerador de valores booleanos para variáveis de ambiente (simplificado)
   */
  const booleanEnvArb = fc.oneof(
    fc.constant('true'),
    fc.constant('false')
  );

  /**
   * Gerador de configuração específica para uma coleção (simplificado)
   */
  const collectionConfigArb = fc.record({
    groupBy: fc.option(validGroupingFieldArb, { nil: undefined }), // Usar undefined em vez de null
    enabled: booleanEnvArb
  });

  /**
   * Gerador de múltiplas coleções com configurações independentes (otimizado)
   */
  const multipleCollectionsConfigArb = fc.array(
    fc.record({
      collection: supportedCollectionArb,
      config: collectionConfigArb
    }),
    { minLength: 2, maxLength: 3 } // Reduzido para máximo 3 coleções
  ).map(configs => {
    // Garantir que temos coleções únicas
    const uniqueConfigs = new Map();
    configs.forEach(({ collection, config }) => {
      if (!uniqueConfigs.has(collection)) {
        uniqueConfigs.set(collection, config);
      }
    });
    return Array.from(uniqueConfigs.entries()).map(([collection, config]) => ({ collection, config }));
  }).filter(configs => configs.length >= 2);

  // ========== PROPERTY 11: ISOLAMENTO DE CONFIGURAÇÕES POR COLEÇÃO ==========

  describe('Property 11: Isolamento de Configurações por Coleção', () => {
    /**
     * **Requisito 10.1**: Quando múltiplas coleções existirem, 
     * sistema deve permitir configuração independente para cada uma
     */
    it('should allow independent configuration for multiple collections', async () => {
      await fc.assert(fc.property(
        multipleCollectionsConfigArb,
        booleanEnvArb,
        (collectionsConfigs, globalEnabled) => {
          // Skip if we don't have enough collections
          fc.pre(collectionsConfigs.length >= 2);

          // Arrange - Configurar cada coleção independentemente
          collectionsConfigs.forEach(({ collection, config }) => {
            const collectionUpper = collection.toUpperCase();
            const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
            const enabledVar = `${collectionUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;

            if (config.groupBy !== undefined) {
              process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = config.groupBy;
            }
            if (config.enabled !== undefined) {
              process.env[NFE_GROUPING_ENV_VARS[enabledVar]] = config.enabled;
            }
          });

          // Configurar global
          if (globalEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabled;
          }

          // Act - Obter configuração para cada coleção
          const results = collectionsConfigs.map(({ collection, config: expectedConfig }) => {
            const actualConfig = configManager.getGroupingConfig(collection);
            return { collection, expectedConfig, actualConfig };
          });

          // Assert - **Requisito 10.1**: Cada coleção deve ter configuração independente
          results.forEach(({ collection, expectedConfig, actualConfig }) => {
            expect(actualConfig.collection).toBe(collection);

            // Verificar campos de agrupamento
            if (expectedConfig.groupBy !== undefined) {
              const expectedFields = [expectedConfig.groupBy]; // Simplificado para um campo
              
              if (expectedFields.length > 0 && 
                  expectedFields.every(field => NFE_GROUPING_VALID_FIELDS.tbl_nfe_100.includes(field as any))) {
                expect(actualConfig.groupByFields).toEqual(expectedFields);
                expect(actualConfig.source).toBe('environment');
              }
            }

            // Verificar enabled específico
            if (expectedConfig.enabled !== undefined) {
              const expectedEnabled = expectedConfig.enabled !== 'false' && expectedConfig.enabled !== '0';
              expect(actualConfig.enabled).toBe(expectedEnabled);
            }
          });

          // Propriedade: Configurações devem ser independentes entre coleções
          for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
              const config1 = results[i].actualConfig;
              const config2 = results[j].actualConfig;
              
              // Coleções diferentes devem ter identificadores diferentes
              expect(config1.collection).not.toBe(config2.collection);
              
              // Se configurações específicas são diferentes, resultados devem ser diferentes
              const expected1 = results[i].expectedConfig;
              const expected2 = results[j].expectedConfig;
              
              if (expected1.groupBy !== expected2.groupBy && 
                  expected1.groupBy !== undefined && 
                  expected2.groupBy !== undefined) {
                expect(config1.groupByFields).not.toEqual(config2.groupByFields);
              }
            }
          }
        }
      ), { numRuns: 50 });
    });

    /**
     * **Requisito 10.2**: Quando uma coleção não tiver configuração específica,
     * sistema deve usar configuração padrão global
     */
    it('should use global default configuration when collection has no specific config', async () => {
      await fc.assert(fc.property(
        fc.tuple(supportedCollectionArb, supportedCollectionArb),
        validGroupingFieldArb,
        booleanEnvArb,
        booleanEnvArb,
        ([collectionWithConfig, collectionWithoutConfig]: [string, string], specificField: string, specificEnabled: string, globalEnabled: string) => {
          // Skip if collections are the same
          fc.pre(collectionWithConfig !== collectionWithoutConfig);

          // Arrange - Configurar apenas uma coleção especificamente
          const collectionWithConfigUpper = collectionWithConfig.toUpperCase();
          const groupByVar = `${collectionWithConfigUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const enabledVar = `${collectionWithConfigUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;

          // Configuração específica para primeira coleção
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = specificField;
          if (specificEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS[enabledVar]] = specificEnabled;
          }

          // Configuração global
          if (globalEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabled;
          }

          // Garantir que segunda coleção não tem configuração específica
          const collectionWithoutConfigUpper = collectionWithoutConfig.toUpperCase();
          const groupByVar2 = `${collectionWithoutConfigUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const enabledVar2 = `${collectionWithoutConfigUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          delete process.env[NFE_GROUPING_ENV_VARS[groupByVar2]];
          delete process.env[NFE_GROUPING_ENV_VARS[enabledVar2]];

          // Act
          const configWithSpecific = configManager.getGroupingConfig(collectionWithConfig);
          const configWithoutSpecific = configManager.getGroupingConfig(collectionWithoutConfig);

          // Assert - **Requisito 10.2**: Coleção sem configuração específica deve usar padrão
          expect(configWithSpecific.collection).toBe(collectionWithConfig);
          expect(configWithoutSpecific.collection).toBe(collectionWithoutConfig);

          // Coleção com configuração específica
          expect(configWithSpecific.groupByFields).toEqual([specificField]);
          expect(configWithSpecific.source).toBe('environment');

          // Coleção sem configuração específica deve usar padrão
          expect(configWithoutSpecific.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
          expect(configWithoutSpecific.source).toBe('default');

          // Propriedade: globalEnabled deve ser consistente
          if (globalEnabled !== undefined) {
            const expectedGlobalEnabled = globalEnabled === 'true';
            expect(configWithSpecific.globalEnabled).toBe(expectedGlobalEnabled);
            expect(configWithoutSpecific.globalEnabled).toBe(expectedGlobalEnabled);
          }

          // Propriedade: Configurações devem ser diferentes
          expect(configWithSpecific.groupByFields).not.toEqual(configWithoutSpecific.groupByFields);
        }
      ), { numRuns: 20 });
    });

    /**
     * **Requisito 10.3**: Quando configurações específicas e globais existirem,
     * sistema deve priorizar configuração específica da coleção
     */
    it('should prioritize collection-specific configuration over global', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        validGroupingFieldArb,
        booleanEnvArb,
        booleanEnvArb,
        (collection: string, specificField: string, specificEnabled: string, globalEnabled: string) => {
          // Arrange - Configurar tanto específico quanto global
          const collectionUpper = collection.toUpperCase();
          const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const enabledVar = `${collectionUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;

          // Configuração específica (deve ter precedência)
          process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = specificField;
          if (specificEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS[enabledVar]] = specificEnabled;
          }

          // Configuração global
          if (globalEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabled;
          }

          // Act
          const config = configManager.getGroupingConfig(collection);
          const precedenceHistory = configManager.getConfigurationPrecedenceHistory();
          const collectionHistory = precedenceHistory.get(collection);

          // Assert - **Requisito 10.3**: Configuração específica deve ter precedência
          expect(config.groupByFields).toEqual([specificField]);
          expect(config.source).toBe('environment');

          // Verificar precedência no histórico
          expect(collectionHistory).toBeDefined();
          expect(collectionHistory!.resolved.source).toBe('specific');
          expect(collectionHistory!.resolved.groupBy).toBe(specificField);

          // Propriedade: enabled específico deve ter precedência
          if (specificEnabled !== undefined) {
            const expectedSpecificEnabled = specificEnabled === 'true';
            expect(config.enabled).toBe(expectedSpecificEnabled);
            expect(collectionHistory!.resolved.enabled).toBe(expectedSpecificEnabled);
          }

          // Propriedade: globalEnabled deve refletir configuração global
          if (globalEnabled !== undefined) {
            const expectedGlobalEnabled = globalEnabled === 'true';
            expect(config.globalEnabled).toBe(expectedGlobalEnabled);
            expect(collectionHistory!.resolved.globalEnabled).toBe(expectedGlobalEnabled);
          }

          // Propriedade: appliedPrecedence deve mostrar precedência específica
          const appliedPrecedence = collectionHistory!.resolved.appliedPrecedence;
          const specificPrecedence = appliedPrecedence.filter(p => p.level === 'specific');
          expect(specificPrecedence.length).toBeGreaterThan(0);
        }
      ), { numRuns: 20 });
    });

    /**
     * **Requisito 10.4**: Quando nome da variável incluir nome da coleção,
     * sistema deve aplicar configuração apenas àquela coleção
     */
    it('should apply configuration only to collection specified in variable name', async () => {
      await fc.assert(fc.property(
        fc.tuple(supportedCollectionArb, supportedCollectionArb),
        validGroupingFieldArb,
        validGroupingFieldArb,
        booleanEnvArb,
        ([collection1, collection2]: [string, string], field1: string, field2: string, globalEnabled: string) => {
          // Skip if collections are the same
          fc.pre(collection1 !== collection2);

          // Arrange - Configurar cada coleção com variável específica
          const collection1Upper = collection1.toUpperCase();
          const collection2Upper = collection2.toUpperCase();
          
          const groupByVar1 = `${collection1Upper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const groupByVar2 = `${collection2Upper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;

          // Configurações específicas por nome de variável
          process.env[NFE_GROUPING_ENV_VARS[groupByVar1]] = field1;
          process.env[NFE_GROUPING_ENV_VARS[groupByVar2]] = field2;

          if (globalEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabled;
          }

          // Act
          const config1 = configManager.getGroupingConfig(collection1);
          const config2 = configManager.getGroupingConfig(collection2);

          // Assert - **Requisito 10.4**: Cada variável deve afetar apenas sua coleção
          expect(config1.collection).toBe(collection1);
          expect(config2.collection).toBe(collection2);

          expect(config1.groupByFields).toEqual([field1]);
          expect(config2.groupByFields).toEqual([field2]);

          // Propriedade: Configurações devem ser independentes
          expect(config1.groupByFields).not.toEqual(config2.groupByFields);

          // Propriedade: Ambas devem usar source environment
          expect(config1.source).toBe('environment');
          expect(config2.source).toBe('environment');

          // Propriedade: globalEnabled deve ser consistente
          if (globalEnabled !== undefined) {
            const expectedGlobalEnabled = globalEnabled === 'true';
            expect(config1.globalEnabled).toBe(expectedGlobalEnabled);
            expect(config2.globalEnabled).toBe(expectedGlobalEnabled);
          }

          // Propriedade: Precedência deve ser específica para cada coleção
          const precedenceHistory = configManager.getConfigurationPrecedenceHistory();
          const history1 = precedenceHistory.get(collection1);
          const history2 = precedenceHistory.get(collection2);

          expect(history1).toBeDefined();
          expect(history2).toBeDefined();
          expect(history1!.collection).toBe(collection1);
          expect(history2!.collection).toBe(collection2);
          expect(history1!.resolved.groupBy).toBe(field1);
          expect(history2!.resolved.groupBy).toBe(field2);
        }
      ), { numRuns: 20 });
    });

    /**
     * **Requisito 10.5**: Quando configuração for alterada para uma coleção,
     * sistema deve não afetar outras coleções
     */
    it('should not affect other collections when one collection configuration changes', async () => {
      await fc.assert(fc.property(
        fc.tuple(supportedCollectionArb, supportedCollectionArb),
        validGroupingFieldArb,
        validGroupingFieldArb,
        validGroupingFieldArb,
        booleanEnvArb,
        ([collection1, collection2]: [string, string], initialField1: string, initialField2: string, changedField1: string, globalEnabled: string) => {
          // Skip if collections are the same or no change
          fc.pre(collection1 !== collection2 && initialField1 !== changedField1);

          // Arrange - Configuração inicial para ambas coleções
          const collection1Upper = collection1.toUpperCase();
          const collection2Upper = collection2.toUpperCase();
          
          const groupByVar1 = `${collection1Upper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const groupByVar2 = `${collection2Upper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;

          process.env[NFE_GROUPING_ENV_VARS[groupByVar1]] = initialField1;
          process.env[NFE_GROUPING_ENV_VARS[groupByVar2]] = initialField2;

          if (globalEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabled;
          }

          // Act - Primeira consulta (estado inicial)
          const initialConfig1 = configManager.getGroupingConfig(collection1);
          const initialConfig2 = configManager.getGroupingConfig(collection2);

          // Arrange - Alterar apenas configuração da primeira coleção
          process.env[NFE_GROUPING_ENV_VARS[groupByVar1]] = changedField1;
          // collection2 mantém configuração original

          // Act - Segunda consulta após mudança
          const changedConfig1 = configManager.getGroupingConfig(collection1);
          const unchangedConfig2 = configManager.getGroupingConfig(collection2);

          // Assert - **Requisito 10.5**: Mudança em collection1 não deve afetar collection2
          
          // Collection1 deve refletir mudança
          expect(changedConfig1.groupByFields).toEqual([changedField1]);
          expect(changedConfig1.groupByFields).not.toEqual(initialConfig1.groupByFields);
          expect(changedConfig1.lastUpdated).toBeGreaterThanOrEqual(initialConfig1.lastUpdated!);

          // Collection2 deve permanecer inalterada
          expect(unchangedConfig2.groupByFields).toEqual([initialField2]);
          expect(unchangedConfig2.groupByFields).toEqual(initialConfig2.groupByFields);
          expect(unchangedConfig2.collection).toBe(collection2);

          // Propriedade: Configurações devem permanecer independentes
          expect(changedConfig1.collection).toBe(collection1);
          expect(unchangedConfig2.collection).toBe(collection2);
          expect(changedConfig1.groupByFields).not.toEqual(unchangedConfig2.groupByFields);

          // Propriedade: globalEnabled deve ser consistente para ambas
          if (globalEnabled !== undefined) {
            const expectedGlobalEnabled = globalEnabled === 'true';
            expect(changedConfig1.globalEnabled).toBe(expectedGlobalEnabled);
            expect(unchangedConfig2.globalEnabled).toBe(expectedGlobalEnabled);
          }

          // Propriedade: Mudanças devem ser detectadas apenas para collection1
          const changes1 = configManager.detectConfigurationChanges(collection1);
          const changes2 = configManager.detectConfigurationChanges(collection2);

          expect(changes1).not.toBeNull();
          expect(changes1!.hasSignificantChanges).toBe(true);
          expect(changes1!.changes.length).toBeGreaterThan(0);

          // Collection2 pode ou não ter mudanças detectadas (depende do cache)
          // mas suas configurações devem permanecer as mesmas
          expect(unchangedConfig2.groupByFields).toEqual([initialField2]);

          // Propriedade: Histórico de precedência deve ser independente
          const precedenceHistory = configManager.getConfigurationPrecedenceHistory();
          const history1 = precedenceHistory.get(collection1);
          const history2 = precedenceHistory.get(collection2);

          expect(history1).toBeDefined();
          expect(history2).toBeDefined();
          expect(history1!.collection).toBe(collection1);
          expect(history2!.collection).toBe(collection2);
          expect(history1!.resolved.groupBy).toBe(changedField1);
          expect(history2!.resolved.groupBy).toBe(initialField2);
        }
      ), { numRuns: 20 });
    });

    /**
     * Propriedade adicional: Cache deve ser isolado por coleção
     */
    it('should maintain isolated cache entries for different collections', async () => {
      await fc.assert(fc.property(
        fc.array(supportedCollectionArb, { minLength: 2, maxLength: 3 }),
        fc.array(validGroupingFieldArb, { minLength: 2, maxLength: 3 }),
        booleanEnvArb,
        (collections, fields, globalEnabled) => {
          // Ensure we have enough fields for collections
          fc.pre(collections.length <= fields.length);

          // Remove duplicates
          const uniqueCollections = [...new Set(collections)];
          fc.pre(uniqueCollections.length >= 2);

          // Arrange - Configurar cada coleção
          uniqueCollections.forEach((collection, index) => {
            const collectionUpper = collection.toUpperCase();
            const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
            process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = fields[index];
          });

          if (globalEnabled !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = globalEnabled;
          }

          // Act - Obter configuração para cada coleção (popula cache)
          const configs = uniqueCollections.map(collection => ({
            collection,
            config: configManager.getGroupingConfig(collection)
          }));

          // Act - Verificar estatísticas do cache
          const cacheStats = configManager.getCacheStats();

          // Assert - Cache deve ter entradas separadas para cada coleção
          expect(cacheStats.configCache.size).toBeGreaterThanOrEqual(uniqueCollections.length);

          // Propriedade: Cada coleção deve ter sua entrada de cache
          uniqueCollections.forEach(collection => {
            const cacheKey = `grouping_${collection}`;
            const cacheEntry = cacheStats.configCache.entries.find(entry => entry.key === cacheKey);
            expect(cacheEntry).toBeDefined();
            expect(cacheEntry!.accessCount).toBeGreaterThan(0);
          });

          // Propriedade: Configurações devem ser independentes
          configs.forEach(({ collection, config }, index) => {
            expect(config.collection).toBe(collection);
            expect(config.groupByFields).toEqual([fields[index]]);
          });

          // Propriedade: Alterar uma coleção não deve afetar cache de outras
          const firstCollection = uniqueCollections[0];
          const firstCollectionUpper = firstCollection.toUpperCase();
          const firstGroupByVar = `${firstCollectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          
          // Alterar primeira coleção
          const newField = fields.find(f => f !== fields[0]) || fields[0];
          process.env[NFE_GROUPING_ENV_VARS[firstGroupByVar]] = newField;

          // Obter configuração alterada
          const changedConfig = configManager.getGroupingConfig(firstCollection);
          const newCacheStats = configManager.getCacheStats();

          // Cache deve ter sido atualizado para primeira coleção
          expect(changedConfig.groupByFields).toEqual([newField]);

          // Outras coleções devem manter suas configurações
          for (let i = 1; i < uniqueCollections.length; i++) {
            const otherCollection = uniqueCollections[i];
            const otherConfig = configManager.getGroupingConfig(otherCollection);
            expect(otherConfig.groupByFields).toEqual([fields[i]]);
          }

          // Propriedade: Cache deve ter entradas para todas as coleções
          expect(newCacheStats.configCache.size).toBeGreaterThanOrEqual(uniqueCollections.length);
        }
      ), { numRuns: 20 });
    });

    /**
     * Propriedade adicional: Detecção de mudanças deve ser isolada por coleção
     */
    it('should detect configuration changes independently for each collection', async () => {
      await fc.assert(fc.property(
        fc.tuple(supportedCollectionArb, supportedCollectionArb),
        validGroupingFieldArb,
        validGroupingFieldArb,
        validGroupingFieldArb,
        ([collection1, collection2]: [string, string], field1: string, field2: string, changedField1: string) => {
          // Skip if collections are the same or no change
          fc.pre(collection1 !== collection2 && field1 !== changedField1);

          // Arrange - Configuração inicial
          const collection1Upper = collection1.toUpperCase();
          const collection2Upper = collection2.toUpperCase();
          
          const groupByVar1 = `${collection1Upper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
          const groupByVar2 = `${collection2Upper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;

          process.env[NFE_GROUPING_ENV_VARS[groupByVar1]] = field1;
          process.env[NFE_GROUPING_ENV_VARS[groupByVar2]] = field2;
          process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'true';

          // Act - Primeira consulta (estabelece baseline)
          configManager.getGroupingConfig(collection1);
          configManager.getGroupingConfig(collection2);

          // Arrange - Alterar apenas collection1
          process.env[NFE_GROUPING_ENV_VARS[groupByVar1]] = changedField1;

          // Act - Detectar mudanças
          const changes1 = configManager.detectConfigurationChanges(collection1);
          const changes2 = configManager.detectConfigurationChanges(collection2);
          const allChanges = configManager.detectAllConfigurationChanges();

          // Assert - Mudanças devem ser detectadas apenas para collection1
          expect(changes1).not.toBeNull();
          expect(changes1!.hasSignificantChanges).toBe(true);
          expect(changes1!.changes.length).toBeGreaterThan(0);

          // Collection2 não deve ter mudanças significativas
          if (changes2 !== null) {
            // Se mudanças são detectadas, não devem ser significativas
            expect(changes2.hasSignificantChanges).toBe(false);
          }

          // Propriedade: allChanges deve incluir collection1
          expect(allChanges.has(collection1)).toBe(true);
          const collection1Changes = allChanges.get(collection1);
          expect(collection1Changes).toBeDefined();
          expect(collection1Changes!.hasSignificantChanges).toBe(true);

          // Propriedade: collection2 não deve ter mudanças significativas em allChanges
          if (allChanges.has(collection2)) {
            const collection2Changes = allChanges.get(collection2);
            expect(collection2Changes!.hasSignificantChanges).toBe(false);
          }

          // Propriedade: Configurações finais devem refletir isolamento
          const finalConfig1 = configManager.getGroupingConfig(collection1);
          const finalConfig2 = configManager.getGroupingConfig(collection2);

          expect(finalConfig1.groupByFields).toEqual([changedField1]);
          expect(finalConfig2.groupByFields).toEqual([field2]);
          expect(finalConfig1.collection).toBe(collection1);
          expect(finalConfig2.collection).toBe(collection2);
        }
      ), { numRuns: 20 });
    });
  });

  describe('Integration with Multiple Collections', () => {
    /**
     * Teste de integração com múltiplas coleções simultâneas
     */
    it('should handle multiple collections simultaneously with complete isolation', async () => {
      await fc.assert(fc.property(
        multipleCollectionsConfigArb,
        booleanEnvArb,
        booleanEnvArb,
        (collectionsConfigs, initialGlobal, changedGlobal) => {
          // Skip if we don't have enough collections or no global change
          fc.pre(collectionsConfigs.length >= 2 && initialGlobal !== changedGlobal);

          // Arrange - Configuração inicial completa
          collectionsConfigs.forEach(({ collection, config }) => {
            const collectionUpper = collection.toUpperCase();
            const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
            const enabledVar = `${collectionUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;

            if (config.groupBy !== undefined) {
              process.env[NFE_GROUPING_ENV_VARS[groupByVar]] = config.groupBy;
            }
            if (config.enabled !== undefined) {
              process.env[NFE_GROUPING_ENV_VARS[enabledVar]] = config.enabled;
            }
          });

          if (initialGlobal !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = initialGlobal;
          }

          // Act - Primeira consulta para todas as coleções
          const initialConfigs = collectionsConfigs.map(({ collection }) => ({
            collection,
            config: configManager.getGroupingConfig(collection)
          }));

          // Arrange - Alterar apenas configuração global
          if (changedGlobal !== undefined) {
            process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = changedGlobal;
          }

          // Act - Segunda consulta após mudança global
          const changedConfigs = collectionsConfigs.map(({ collection }) => ({
            collection,
            config: configManager.getGroupingConfig(collection)
          }));

          // Assert - Mudança global deve afetar todas as coleções igualmente
          const expectedGlobalEnabled = changedGlobal === 'true';
          
          changedConfigs.forEach(({ collection, config }) => {
            expect(config.globalEnabled).toBe(expectedGlobalEnabled);
            expect(config.collection).toBe(collection);
          });

          // Propriedade: Configurações específicas devem permanecer isoladas
          initialConfigs.forEach((initial, index) => {
            const changed = changedConfigs[index];
            expect(initial.collection).toBe(changed.collection);
            
            // groupByFields deve permanecer igual (apenas globalEnabled muda)
            expect(changed.config.groupByFields).toEqual(initial.config.groupByFields);
            
            // Apenas globalEnabled deve ter mudado
            expect(changed.config.globalEnabled).toBe(expectedGlobalEnabled);
          });

          // Propriedade: Precedência deve ser mantida para cada coleção
          const precedenceHistory = configManager.getConfigurationPrecedenceHistory();
          
          collectionsConfigs.forEach(({ collection, config }) => {
            const history = precedenceHistory.get(collection);
            expect(history).toBeDefined();
            expect(history!.collection).toBe(collection);
            
            if (config.groupBy !== undefined) {
              expect(history!.resolved.source).toBe('specific');
              expect(history!.resolved.groupBy).toBe(config.groupBy);
            }
          });

          // Propriedade: Cache deve ter entradas para todas as coleções
          const cacheStats = configManager.getCacheStats();
          expect(cacheStats.configCache.size).toBeGreaterThanOrEqual(collectionsConfigs.length);

          collectionsConfigs.forEach(({ collection }) => {
            const cacheKey = `grouping_${collection}`;
            const cacheEntry = cacheStats.configCache.entries.find(entry => entry.key === cacheKey);
            expect(cacheEntry).toBeDefined();
          });
        }
      ), { numRuns: 20 });
    });
  });
});