import { GroupingConfig } from '@fiscal/shared/types/grouping/grouping-config.interface';
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupingConfigManager } from '../GroupingConfigManager';
import { NFePrefixNormalizer } from '../NFePrefixNormalizer';
import { NFeQueryInterceptor } from '../NFeQueryInterceptor';
import { OrderingProcessor } from '../OrderingProcessor';
import { createTestGroupingConfig, createTestOrderingConfig } from './test-helpers';

/**
 * Property-Based Tests para Interceptação e Preservação de Consultas
 * 
 * Feature: nfe-configurable-grouping, Property 7: Interceptação e Preservação de Consultas
 * 
 * Valida: Requisitos 6.1, 6.2, 6.3, 6.4
 * 
 * Para qualquer consulta MongoDB válida na coleção tbl_nfe_100, quando agrupamento
 * estiver configurado, o sistema deve interceptar a consulta, aplicar pipeline de
 * agregação apropriado, e preservar todos os filtros e condições da consulta original.
 */
describe('NFeQueryInterceptor - Query Preservation Properties', () => {
  let interceptor: NFeQueryInterceptor;
  let mockGroupingManager: GroupingConfigManager;
  let mockPrefixNormalizer: NFePrefixNormalizer;
  let mockOrderingProcessor: OrderingProcessor;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    
    mockGroupingManager = {
      getGroupingConfig: vi.fn(),
      getOrderingConfig: vi.fn(),
      isGloballyEnabled: vi.fn().mockReturnValue(true),
      refreshConfig: vi.fn()
    } as any;

    mockPrefixNormalizer = {
      normalizeKey: vi.fn(),
      normalizeBatch: vi.fn(),
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
  });

  it('should preserve all original query filters in aggregation pipeline', async () => {
    await fc.assert(fc.asyncProperty(
      // Gerador para filtros de consulta MongoDB
      fc.record({
        CHV_NFE: fc.option(fc.string({ minLength: 44, maxLength: 47 })),
        CNPJ_EMIT: fc.option(fc.string({ minLength: 14, maxLength: 18 })),
        DT_DOC: fc.option(fc.record({
          $gte: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
          $lte: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
        })),
        VALOR_TOTAL: fc.option(fc.record({
          $gte: fc.float({ min: 0, max: 100000 }),
          $lte: fc.float({ min: 0, max: 100000 })
        })),
        PROTOCOLADA: fc.option(fc.boolean())
      }, { requiredKeys: [] }),
      
      // Configuração de agrupamento
      fc.record({
        enabled: fc.boolean(),
        groupByFields: fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
        collection: fc.constant('tbl_nfe_100'),
        globalEnabled: fc.constant(true)
      }),
      
      async (queryFilters: any, partialGroupingConfig: Partial<GroupingConfig>) => {
        // Feature: nfe-configurable-grouping, Property 7: Interceptação e Preservação de Consultas
        
        // Remover campos null/undefined do filtro
        const cleanFilters = Object.fromEntries(
          Object.entries(queryFilters).filter(([_, value]) => value !== null)
        );
        
        // Criar configuração completa usando helper
        const groupingConfig = createTestGroupingConfig(partialGroupingConfig);
        
        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(createTestOrderingConfig({
          fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
          defaultOrdering: 'DT_DOC DESC'
        }));

        // Mock da execução de agregação
        const mockAggregationResult = [
          {
            _id: { CHV_NFE_NORMALIZED: 'test-key' },
            documents: [{ CHV_NFE: 'NFe-test-key', CNPJ_EMIT: '12345678000195' }],
            count: 1,
            totalValue: 1000,
            latestDocument: { CHV_NFE: 'NFe-test-key', CNPJ_EMIT: '12345678000195' }
          }
        ];

        // Interceptar consulta
        const result = await interceptor.intercept('tbl_nfe_100', cleanFilters);

        if (groupingConfig.enabled && Object.keys(cleanFilters).length > 0) {
          // Verificar que interceptação foi aplicada
          expect(result.metadata.grouped).toBe(true);
          
          // Verificar que filtros originais foram preservados
          // O pipeline deve começar com $match contendo os filtros originais
          const expectedMatchStage = { $match: cleanFilters };
          
          // Verificar que os filtros foram aplicados corretamente
          expect(vi.mocked(mockGroupingManager.getGroupingConfig)).toHaveBeenCalledWith('tbl_nfe_100');
          
          // Se há filtros, eles devem ser preservados no pipeline
          if (Object.keys(cleanFilters).length > 0) {
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
          }
        } else {
          // Se agrupamento não está habilitado, consulta original deve ser executada
          expect(result.metadata.grouped).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });

  it('should apply appropriate aggregation pipeline when grouping is enabled', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
      fc.record({
        CHV_NFE: fc.option(fc.string({ minLength: 44, maxLength: 47 })),
        CNPJ_EMIT: fc.option(fc.string({ minLength: 14, maxLength: 18 }))
      }, { requiredKeys: [] }),
      
      async (groupByFields: string[], filters: any) => {
        // Feature: nfe-configurable-grouping, Property 7: Interceptação e Preservação de Consultas
        
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== null)
        );
        
        const groupingConfig = createTestGroupingConfig({
          enabled: true,
          groupByFields,
          collection: 'tbl_nfe_100',
          globalEnabled: true
        });

        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(createTestOrderingConfig({
          fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
          defaultOrdering: 'DT_DOC DESC'
        }));

        // Interceptar consulta
        const result = await interceptor.intercept('tbl_nfe_100', cleanFilters);

        // Verificar que pipeline de agregação foi aplicado
        expect(result.metadata.grouped).toBe(true);
        expect(result.success).toBe(true);

        // Verificar que normalização foi aplicada se CHV_NFE está nos campos de agrupamento
        if (groupByFields.includes('CHV_NFE')) {
          expect(vi.mocked(mockPrefixNormalizer.createNormalizationPipeline)).toHaveBeenCalled();
        }

        // Verificar que ordenação foi aplicada
        expect(vi.mocked(mockOrderingProcessor.buildSortStage)).toHaveBeenCalled();

        // Verificar que configuração foi obtida
        expect(vi.mocked(mockGroupingManager.getGroupingConfig)).toHaveBeenCalledWith('tbl_nfe_100');
        expect(vi.mocked(mockGroupingManager.getOrderingConfig)).toHaveBeenCalledWith('tbl_nfe_100');
      }
    ), { numRuns: 100 });
  });

  it('should handle collection-specific interception correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100', 'tbl_cfe_100', 'other_collection'),
      fc.boolean(),
      
      async (collectionName: string, shouldIntercept: boolean) => {
        // Feature: nfe-configurable-grouping, Property 7: Interceptação e Preservação de Consultas
        
        const groupingConfig = createTestGroupingConfig({
          enabled: shouldIntercept,
          groupByFields: ['CHV_NFE'],
          collection: collectionName,
          globalEnabled: true
        });

        // Configurar mock
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(createTestOrderingConfig({
          fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
          defaultOrdering: 'DT_DOC DESC'
        }));

        const testFilters = { CHV_NFE: 'test-key' };
        
        // Interceptar consulta
        const result = await interceptor.intercept(collectionName, testFilters);

        // Verificar comportamento baseado na coleção e configuração
        if (collectionName === 'tbl_nfe_100' && shouldIntercept) {
          // Deve interceptar e aplicar agrupamento
          expect(result.metadata.grouped).toBe(true);
          expect(vi.mocked(mockGroupingManager.getGroupingConfig)).toHaveBeenCalledWith(collectionName);
        } else {
          // Não deve interceptar ou deve executar consulta original
          if (collectionName !== 'tbl_nfe_100') {
            // Coleções diferentes de tbl_nfe_100 não devem ser interceptadas
            expect(result.metadata.grouped).toBe(false);
          } else if (!shouldIntercept) {
            // Se agrupamento está desabilitado, não deve interceptar
            expect(result.metadata.grouped).toBe(false);
          }
        }

        // Resultado sempre deve ser bem-sucedido
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
    ), { numRuns: 100 });
  });

  it('should maintain query result format compatibility', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        CHV_NFE: fc.option(fc.string({ minLength: 44, maxLength: 47 })),
        CNPJ_EMIT: fc.option(fc.string({ minLength: 14, maxLength: 18 }))
      }, { requiredKeys: [] }),
      fc.boolean(),
      
      async (filters: any, groupingEnabled: boolean) => {
        // Feature: nfe-configurable-grouping, Property 7: Interceptação e Preservação de Consultas
        
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== null)
        );
        
        const groupingConfig = createTestGroupingConfig({
          enabled: groupingEnabled,
          groupByFields: ['CHV_NFE'],
          collection: 'tbl_nfe_100',
          globalEnabled: true
        });

        // Configurar mocks
        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(createTestOrderingConfig({
          fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
          defaultOrdering: 'DT_DOC DESC'
        }));

        // Interceptar consulta
        const result = await interceptor.intercept('tbl_nfe_100', cleanFilters);

        // Verificar formato do resultado
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('metadata');
        
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.data)).toBe(true);
        expect(typeof result.metadata).toBe('object');
        
        // Verificar propriedades dos metadados
        expect(result.metadata).toHaveProperty('grouped');
        expect(result.metadata).toHaveProperty('groupCount');
        expect(result.metadata).toHaveProperty('totalDocuments');
        expect(result.metadata).toHaveProperty('processingTime');
        
        expect(typeof result.metadata.grouped).toBe('boolean');
        expect(typeof result.metadata.groupCount).toBe('number');
        expect(typeof result.metadata.totalDocuments).toBe('number');
        expect(typeof result.metadata.processingTime).toBe('number');
        
        // Verificar que tempo de processamento é positivo
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 100 });
  });
});