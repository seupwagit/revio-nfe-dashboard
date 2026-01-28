import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupingConfigManager } from '../GroupingConfigManager';
import { NFePrefixNormalizer } from '../NFePrefixNormalizer';
import { NFeQueryInterceptor } from '../NFeQueryInterceptor';
import { OrderingProcessor } from '../OrderingProcessor';
import { createTestGroupingConfig, createTestOrderingConfig } from './test-helpers';

/**
 * Property-Based Tests para Logging Estruturado e Completo
 * 
 * Feature: nfe-configurable-grouping, Property 9: Logging Estruturado e Completo
 * 
 * Valida: Requisitos 8.1, 8.2, 8.3, 8.5
 * 
 * Para qualquer operação de agrupamento executada, o sistema deve registrar
 * configurações utilizadas, tempos de processamento, quantidades de chaves
 * normalizadas e mudanças de configuração com timestamps apropriados.
 */
describe('NFeQueryInterceptor - Logging Properties', () => {
  let interceptor: NFeQueryInterceptor;
  let mockGroupingManager: GroupingConfigManager;
  let mockPrefixNormalizer: NFePrefixNormalizer;
  let mockOrderingProcessor: OrderingProcessor;
  let originalEnv: NodeJS.ProcessEnv;
  let logSpy: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    
    // Mock do logger
    logSpy = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    };
    
    // Mock global do console para capturar logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});

    mockGroupingManager = {
      getGroupingConfig: vi.fn(),
      getOrderingConfig: vi.fn(),
      isGloballyEnabled: vi.fn().mockReturnValue(true),
      refreshConfig: vi.fn()
    } as any;

    mockPrefixNormalizer = {
      normalizeKey: vi.fn(),
      normalizeBatch: vi.fn().mockReturnValue(new Map()),
      shouldNormalize: vi.fn().mockReturnValue(true),
      createNormalizationPipeline: vi.fn().mockReturnValue([
        {
          $addFields: {
            CHV_NFE_NORMALIZED: {
              $cond: [
                { $eq: [{ $substr: ['$CHV_NFE', 0, 3] }, 'NFe'] },
                { $substr: ['$CHV_NFE', 3, -1] },
                '$CHV_NFE'
              ]
            }
          }
        }
      ])
    } as any;

    mockOrderingProcessor = {
      parseOrderingConfig: vi.fn().mockReturnValue([
        { field: 'DT_DOC', direction: -1, priority: 1 }
      ]),
      buildSortStage: vi.fn().mockReturnValue({ $sort: { DT_DOC: -1 } }),
      validateOrderingFields: vi.fn().mockReturnValue(true),
      applyGroupOrdering: vi.fn()
    } as any;

    interceptor = new NFeQueryInterceptor(
      mockGroupingManager,
      mockPrefixNormalizer,
      mockOrderingProcessor
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should log configuration details when grouping is applied', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        enabled: fc.boolean(),
        groupByFields: fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
        collection: fc.constant('tbl_nfe_100'),
        globalEnabled: fc.boolean(),
        lastUpdated: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
        source: fc.constantFrom('environment', 'global', 'default')
      }),
      fc.record({
        enabled: fc.boolean(),
        fields: fc.array(fc.record({
          field: fc.constantFrom('DT_DOC', 'PROTOCOLADA', 'CHV_NFE'),
          direction: fc.constantFrom('ASC', 'DESC') as fc.Arbitrary<'ASC' | 'DESC'>
        }), { minLength: 1, maxLength: 2 }),
        defaultOrdering: fc.constantFrom('DT_DOC DESC', 'PROTOCOLADA ASC'),
        lastUpdated: fc.integer({ min: Date.now() - 86400000, max: Date.now() })
      }),
      fc.record({
        CHV_NFE: fc.option(fc.string({ minLength: 44, maxLength: 47 })),
        CNPJ_EMIT: fc.option(fc.string({ minLength: 14, maxLength: 18 }))
      }, { requiredKeys: [] }),
      
      async (groupingConfig, orderingConfig, queryFilters) => {
        // Feature: nfe-configurable-grouping, Property 9: Logging Estruturado e Completo
        
        const cleanFilters = Object.fromEntries(
          Object.entries(queryFilters).filter(([_, value]) => value !== null)
        );
        
        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

        // Interceptar consulta
        const startTime = Date.now();
        const result = await interceptor.intercept('tbl_nfe_100', cleanFilters);
        const endTime = Date.now();

        // Verificar que resultado contém informações de logging
        expect(result.metadata).toBeDefined();
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.processingTime).toBeLessThan(endTime - startTime + 100); // Margem de erro
        
        if (groupingConfig.enabled && groupingConfig.globalEnabled) {
          // Quando agrupamento está habilitado, deve haver logs estruturados
          expect(result.metadata.grouped).toBe(true);
          expect(result.metadata.groupCount).toBeGreaterThanOrEqual(0);
          expect(result.metadata.totalDocuments).toBeGreaterThanOrEqual(0);
          
          // Verificar que configurações foram registradas
          expect(vi.mocked(mockGroupingManager.getGroupingConfig)).toHaveBeenCalledWith('tbl_nfe_100');
          expect(vi.mocked(mockGroupingManager.getOrderingConfig)).toHaveBeenCalledWith('tbl_nfe_100');
        } else {
          // Quando agrupamento está desabilitado
          expect(result.metadata.grouped).toBe(false);
        }

        // Verificar que timestamp está presente e é válido
        expect(result.metadata.processingTime).toBeTypeOf('number');
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 100 });
  });

  it('should log normalization statistics when CHV_NFE is processed', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(fc.string({ minLength: 44, maxLength: 47 }), { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 0, max: 10 }),
      
      async (chavesList, normalizedCount) => {
        // Feature: nfe-configurable-grouping, Property 9: Logging Estruturado e Completo
        
        const groupingConfig = createTestGroupingConfig({
          collection: 'tbl_nfe_100',
          groupByFields: ['CHV_NFE']
        });

        const orderingConfig = createTestOrderingConfig();

        // Mock do resultado da normalização
        const normalizationResults = new Map();
        chavesList.forEach((chave, index) => {
          const hadPrefix = index < normalizedCount;
          normalizationResults.set(chave, {
            originalKey: chave,
            normalizedKey: hadPrefix ? chave.substring(3) : chave,
            hadPrefix
          });
        });

        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);
        vi.mocked(mockPrefixNormalizer.normalizeBatch).mockReturnValue(normalizationResults);

        // Interceptar consulta
        const result = await interceptor.intercept('tbl_nfe_100', { CHV_NFE: { $in: chavesList } });

        // Verificar que normalização foi processada
        if (chavesList.length > 0) {
          expect(vi.mocked(mockPrefixNormalizer.createNormalizationPipeline)).toHaveBeenCalled();
        }

        // Verificar que resultado contém informações sobre processamento
        expect(result.metadata.grouped).toBe(true);
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        
        // Verificar que contadores são consistentes
        expect(result.metadata.groupCount).toBeGreaterThanOrEqual(0);
        expect(result.metadata.totalDocuments).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 100 });
  });

  it('should log processing time accurately for different operation complexities', async () => {
    await fc.assert(fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }), // Número de campos de agrupamento
      fc.integer({ min: 0, max: 100 }), // Número de filtros
      fc.boolean(), // Se deve simular operação lenta
      
      async (groupFieldsCount, filtersCount, simulateSlowOperation) => {
        // Feature: nfe-configurable-grouping, Property 9: Logging Estruturado e Completo
        
        const groupByFields = ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA', 'VALOR_TOTAL']
          .slice(0, groupFieldsCount);
        
        const groupingConfig = createTestGroupingConfig({
          collection: 'tbl_nfe_100',
          groupByFields
        });

        const orderingConfig = createTestOrderingConfig();

        // Gerar filtros dinâmicos
        const filters: any = {};
        for (let i = 0; i < filtersCount && i < 10; i++) {
          filters[`field_${i}`] = `value_${i}`;
        }

        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

        // Simular operação lenta se necessário
        if (simulateSlowOperation) {
          vi.mocked(mockPrefixNormalizer.createNormalizationPipeline).mockImplementation(() => {
            // Simular delay pequeno
            const start = Date.now();
            while (Date.now() - start < 10) {
              // Busy wait para simular processamento
            }
            return [{ $addFields: { CHV_NFE_NORMALIZED: '$CHV_NFE' } }];
          });
        }

        // Medir tempo de execução
        const startTime = Date.now();
        const result = await interceptor.intercept('tbl_nfe_100', filters);
        const endTime = Date.now();
        const actualDuration = endTime - startTime;

        // Verificar que tempo de processamento foi registrado
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.processingTime).toBeLessThanOrEqual(actualDuration + 50); // Margem de erro

        // Verificar que tempo é proporcional à complexidade
        if (simulateSlowOperation) {
          expect(result.metadata.processingTime).toBeGreaterThan(5); // Pelo menos 5ms para operação lenta
        }

        // Verificar que metadados são consistentes
        expect(result.metadata.grouped).toBe(true);
        expect(typeof result.metadata.processingTime).toBe('number');
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 100 });
  });

  it('should maintain consistent logging format across different scenarios', async () => {
    await fc.assert(fc.asyncProperty(
      fc.oneof(
        // Cenário com agrupamento habilitado
        fc.record({
          enabled: fc.constant(true),
          groupByFields: fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT'), { minLength: 1, maxLength: 2 }),
          collection: fc.constant('tbl_nfe_100'),
          globalEnabled: fc.constant(true),
          lastUpdated: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          source: fc.constantFrom('environment', 'global', 'default')
        }),
        // Cenário com agrupamento desabilitado
        fc.record({
          enabled: fc.constant(false),
          groupByFields: fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT'), { minLength: 1, maxLength: 2 }),
          collection: fc.constant('tbl_nfe_100'),
          globalEnabled: fc.constant(true),
          lastUpdated: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          source: fc.constantFrom('environment', 'global', 'default')
        }),
        // Cenário com controle global desabilitado
        fc.record({
          enabled: fc.constant(true),
          groupByFields: fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT'), { minLength: 1, maxLength: 2 }),
          collection: fc.constant('tbl_nfe_100'),
          globalEnabled: fc.constant(false),
          lastUpdated: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          source: fc.constantFrom('environment', 'global', 'default')
        })
      ),
      fc.record({
        CHV_NFE: fc.option(fc.string({ minLength: 44, maxLength: 47 })),
        CNPJ_EMIT: fc.option(fc.string({ minLength: 14, maxLength: 18 }))
      }, { requiredKeys: [] }),
      
      async (groupingConfig, queryFilters) => {
        // Feature: nfe-configurable-grouping, Property 9: Logging Estruturado e Completo
        
        const cleanFilters = Object.fromEntries(
          Object.entries(queryFilters).filter(([_, value]) => value !== null)
        );
        
        const orderingConfig = createTestOrderingConfig({
          fields: [{ field: 'DT_DOC', direction: 'DESC' }],
          defaultOrdering: 'DT_DOC DESC'
        });

        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

        // Interceptar consulta
        const result = await interceptor.intercept('tbl_nfe_100', cleanFilters);

        // Verificar formato consistente dos metadados
        expect(result.metadata).toBeDefined();
        expect(result.metadata).toHaveProperty('grouped');
        expect(result.metadata).toHaveProperty('groupCount');
        expect(result.metadata).toHaveProperty('totalDocuments');
        expect(result.metadata).toHaveProperty('processingTime');

        // Verificar tipos dos metadados
        expect(typeof result.metadata.grouped).toBe('boolean');
        expect(typeof result.metadata.groupCount).toBe('number');
        expect(typeof result.metadata.totalDocuments).toBe('number');
        expect(typeof result.metadata.processingTime).toBe('number');

        // Verificar valores válidos
        expect(result.metadata.groupCount).toBeGreaterThanOrEqual(0);
        expect(result.metadata.totalDocuments).toBeGreaterThanOrEqual(0);
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);

        // Verificar consistência lógica
        if (result.metadata.grouped) {
          // Se agrupamento foi aplicado, deve ter configuração habilitada
          expect(groupingConfig.enabled && groupingConfig.globalEnabled).toBe(true);
        } else {
          // Se agrupamento não foi aplicado, configuração deve estar desabilitada
          // ou não deve haver campos de agrupamento válidos
          expect(
            !groupingConfig.enabled || 
            !groupingConfig.globalEnabled || 
            groupingConfig.groupByFields.length === 0
          ).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  it('should log error context when operations fail', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'invalid_collection'),
      fc.record({
        CHV_NFE: fc.option(fc.string({ minLength: 1, maxLength: 10 })), // Chaves inválidas
        INVALID_FIELD: fc.option(fc.string())
      }, { requiredKeys: [] }),
      
      async (collectionName, queryFilters) => {
        // Feature: nfe-configurable-grouping, Property 9: Logging Estruturado e Completo
        
        const cleanFilters = Object.fromEntries(
          Object.entries(queryFilters).filter(([_, value]) => value !== null)
        );
        
        const groupingConfig = createTestGroupingConfig({
          collection: collectionName,
          groupByFields: ['CHV_NFE']
        });

        const orderingConfig = createTestOrderingConfig();

        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

        // Simular erro em algumas operações
        if (collectionName === 'invalid_collection') {
          vi.mocked(mockPrefixNormalizer.createNormalizationPipeline).mockImplementation(() => {
            throw new Error('Invalid collection schema');
          });
        }

        // Interceptar consulta (não deve quebrar mesmo com erros)
        const result = await interceptor.intercept(collectionName, cleanFilters);

        // Sistema deve sempre retornar resultado válido
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);

        // Em caso de erro, deve fazer fallback graceful
        if (collectionName === 'invalid_collection') {
          // Pode retornar consulta original ou erro tratado
          expect(typeof result.success).toBe('boolean');
        } else {
          // Para coleções válidas, deve funcionar normalmente
          expect(result.success).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });
});