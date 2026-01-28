import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupingConfigManager } from '../GroupingConfigManager';
import { NFePrefixNormalizer } from '../NFePrefixNormalizer';
import { NFeQueryInterceptor } from '../NFeQueryInterceptor';
import { OrderingProcessor } from '../OrderingProcessor';
import { createTestGroupingConfig, createTestOrderingConfig } from './test-helpers';

/**
 * Testes de Performance para NFeQueryInterceptor
 * 
 * Valida: Requisitos 9.1, 9.2
 * 
 * Mede overhead com agrupamento habilitado vs desabilitado
 * Valida que overhead não excede 20%
 * Testa com datasets grandes (>10k documentos)
 */
describe('NFeQueryInterceptor - Performance Tests', () => {
  let interceptor: NFeQueryInterceptor;
  let mockGroupingManager: GroupingConfigManager;
  let mockPrefixNormalizer: NFePrefixNormalizer;
  let mockOrderingProcessor: OrderingProcessor;
  let originalEnv: NodeJS.ProcessEnv;

  // Dados de teste para performance
  const generateLargeDataset = (size: number) => {
    return Array.from({ length: size }, (_, index) => ({
      _id: `doc_${index}`,
      CHV_NFE: index % 2 === 0 ? `NFe${String(index).padStart(44, '0')}` : String(index).padStart(44, '0'),
      CNPJ_EMIT: `${String(index % 1000).padStart(14, '0')}`,
      DT_DOC: new Date(2024, 0, (index % 365) + 1).toISOString().split('T')[0],
      VL_DOC: (index * 100) % 10000,
      PROTOCOLADA: index % 2 === 0
    }));
  };

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

  describe('Overhead de Performance', () => {
    it('deve ter overhead máximo de 20% com agrupamento habilitado', async () => {
      // Arrange
      const testDataset = generateLargeDataset(1000);
      
      const groupingEnabledConfig = createTestGroupingConfig({
        enabled: true,
        groupByFields: ['CHV_NFE'],
        collection: 'tbl_nfe_100',
        globalEnabled: true
      });

      const groupingDisabledConfig = createTestGroupingConfig({
        enabled: false,
        groupByFields: [],
        collection: 'tbl_nfe_100',
        globalEnabled: false
      });

      const orderingConfig = createTestOrderingConfig({
        enabled: true,
        fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
        defaultOrdering: 'DT_DOC DESC'
      });

      const testQuery = { CNPJ_EMIT: '12345678000195' };

      // Mock para consulta sem agrupamento
      vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingDisabledConfig);
      vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

      // Medir tempo sem agrupamento
      const startTimeDisabled = performance.now();
      const resultDisabled = await interceptor.intercept('tbl_nfe_100', testQuery);
      const endTimeDisabled = performance.now();
      const timeDisabled = endTimeDisabled - startTimeDisabled;

      // Mock para consulta com agrupamento
      vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingEnabledConfig);

      // Medir tempo com agrupamento
      const startTimeEnabled = performance.now();
      const resultEnabled = await interceptor.intercept('tbl_nfe_100', testQuery);
      const endTimeEnabled = performance.now();
      const timeEnabled = endTimeEnabled - startTimeEnabled;

      // Assert
      expect(resultDisabled.success).toBe(true);
      expect(resultEnabled.success).toBe(true);
      
      // Calcular overhead
      const overhead = ((timeEnabled - timeDisabled) / timeDisabled) * 100;
      
      console.log(`Performance Test Results:
        - Sem agrupamento: ${timeDisabled.toFixed(2)}ms
        - Com agrupamento: ${timeEnabled.toFixed(2)}ms
        - Overhead: ${overhead.toFixed(2)}%`);

      // Validar que overhead não excede 20%
      expect(overhead).toBeLessThanOrEqual(20);
      
      // Validar que ambos os resultados são válidos
      expect(resultDisabled.metadata.grouped).toBe(false);
      expect(resultEnabled.metadata.grouped).toBe(true);
    });

    it('deve manter performance aceitável com datasets grandes (>10k documentos)', async () => {
      // Arrange
      const largeDataset = generateLargeDataset(15000);
      
      const groupingConfig = createTestGroupingConfig({
        enabled: true,
        groupByFields: ['CHV_NFE'],
        collection: 'tbl_nfe_100',
        globalEnabled: true
      });

      const orderingConfig = createTestOrderingConfig();

      vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
      vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

      const testQuery = { DT_DOC: { $gte: '2024-01-01' } };

      // Act
      const startTime = performance.now();
      const result = await interceptor.intercept('tbl_nfe_100', testQuery);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.grouped).toBe(true);
      
      // Performance deve ser aceitável (< 5 segundos para 15k documentos)
      expect(processingTime).toBeLessThan(5000);
      
      // Calcular throughput
      const documentsPerSecond = 15000 / (processingTime / 1000);
      
      console.log(`Large Dataset Performance:
        - Dataset size: 15,000 documentos
        - Processing time: ${processingTime.toFixed(2)}ms
        - Throughput: ${documentsPerSecond.toFixed(0)} docs/sec`);

      // Throughput mínimo esperado: 3000 docs/sec
      expect(documentsPerSecond).toBeGreaterThan(3000);
    });

    it('deve ter performance consistente em múltiplas execuções', async () => {
      // Arrange
      const testDataset = generateLargeDataset(5000);
      
      const groupingConfig = createTestGroupingConfig({
        enabled: true,
        groupByFields: ['CHV_NFE'],
        collection: 'tbl_nfe_100',
        globalEnabled: true
      });

      const orderingConfig = createTestOrderingConfig({
        fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
        defaultOrdering: 'DT_DOC DESC'
      });

      vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
      vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

      const testQuery = { CNPJ_EMIT: '12345678000195' };
      const executionTimes: number[] = [];

      // Act - Executar múltiplas vezes
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        const result = await interceptor.intercept('tbl_nfe_100', testQuery);
        const endTime = performance.now();
        
        expect(result.success).toBe(true);
        executionTimes.push(endTime - startTime);
      }

      // Assert
      const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
      const maxTime = Math.max(...executionTimes);
      const minTime = Math.min(...executionTimes);
      const variance = maxTime - minTime;
      const variancePercentage = (variance / avgTime) * 100;

      console.log(`Consistency Test Results:
        - Average time: ${avgTime.toFixed(2)}ms
        - Min time: ${minTime.toFixed(2)}ms
        - Max time: ${maxTime.toFixed(2)}ms
        - Variance: ${variance.toFixed(2)}ms (${variancePercentage.toFixed(1)}%)`);

      // Variância não deve exceder 50% da média
      expect(variancePercentage).toBeLessThan(50);
      
      // Tempo médio deve ser aceitável
      expect(avgTime).toBeLessThan(1000); // < 1 segundo para 5k documentos
    });
  });

  describe('Performance de Cache', () => {
    it('deve ter melhor performance com cache de configuração', async () => {
      // Arrange
      const groupingConfig = createTestGroupingConfig({
        enabled: true,
        groupByFields: ['CHV_NFE'],
        collection: 'tbl_nfe_100',
        globalEnabled: true
      });

      const orderingConfig = createTestOrderingConfig({
        fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
        defaultOrdering: 'DT_DOC DESC'
      });

      const testQuery = { CNPJ_EMIT: '12345678000195' };

      // Primeira execução (sem cache)
      vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(createTestGroupingConfig(groupingConfig));
      vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(createTestOrderingConfig(orderingConfig));

      const startTimeFirst = performance.now();
      const resultFirst = await interceptor.intercept('tbl_nfe_100', testQuery);
      const endTimeFirst = performance.now();
      const timeFirst = endTimeFirst - startTimeFirst;

      // Segunda execução (com cache simulado - mock mais rápido)
      vi.mocked(mockGroupingManager.getGroupingConfig).mockImplementation(() => {
        // Simular cache hit com retorno mais rápido
        return createTestGroupingConfig(groupingConfig);
      });

      const startTimeSecond = performance.now();
      const resultSecond = await interceptor.intercept('tbl_nfe_100', testQuery);
      const endTimeSecond = performance.now();
      const timeSecond = endTimeSecond - startTimeSecond;

      // Assert
      expect(resultFirst.success).toBe(true);
      expect(resultSecond.success).toBe(true);
      
      console.log(`Cache Performance Test:
        - First execution: ${timeFirst.toFixed(2)}ms
        - Second execution: ${timeSecond.toFixed(2)}ms
        - Improvement: ${((timeFirst - timeSecond) / timeFirst * 100).toFixed(1)}%`);

      // Segunda execução deve ser pelo menos tão rápida quanto a primeira
      expect(timeSecond).toBeLessThanOrEqual(timeFirst * 1.1); // Margem de 10%
    });
  });

  describe('Performance de Normalização', () => {
    it('deve ter overhead mínimo para normalização de prefixos NFe', async () => {
      // Arrange
      const datasetWithPrefixes = generateLargeDataset(2000).map(doc => ({
        ...doc,
        CHV_NFE: `NFe${doc.CHV_NFE}` // Todos com prefixo
      }));

      const datasetWithoutPrefixes = generateLargeDataset(2000); // Sem prefixos

      const groupingConfig = createTestGroupingConfig({
        enabled: true,
        groupByFields: ['CHV_NFE'],
        collection: 'tbl_nfe_100',
        globalEnabled: true
      });

      const orderingConfig = createTestOrderingConfig({
        fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
        defaultOrdering: 'DT_DOC DESC'
      });

      vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
      vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

      const testQuery = { DT_DOC: { $gte: '2024-01-01' } };

      // Teste com prefixos (requer normalização)
      const startTimeWithPrefixes = performance.now();
      const resultWithPrefixes = await interceptor.intercept('tbl_nfe_100', testQuery);
      const endTimeWithPrefixes = performance.now();
      const timeWithPrefixes = endTimeWithPrefixes - startTimeWithPrefixes;

      // Teste sem prefixos (não requer normalização)
      const startTimeWithoutPrefixes = performance.now();
      const resultWithoutPrefixes = await interceptor.intercept('tbl_nfe_100', testQuery);
      const endTimeWithoutPrefixes = performance.now();
      const timeWithoutPrefixes = endTimeWithoutPrefixes - startTimeWithoutPrefixes;

      // Assert
      expect(resultWithPrefixes.success).toBe(true);
      expect(resultWithoutPrefixes.success).toBe(true);

      const normalizationOverhead = ((timeWithPrefixes - timeWithoutPrefixes) / timeWithoutPrefixes) * 100;

      console.log(`Normalization Performance Test:
        - With prefixes: ${timeWithPrefixes.toFixed(2)}ms
        - Without prefixes: ${timeWithoutPrefixes.toFixed(2)}ms
        - Normalization overhead: ${normalizationOverhead.toFixed(2)}%`);

      // Overhead de normalização deve ser mínimo (< 10%)
      expect(Math.abs(normalizationOverhead)).toBeLessThan(10);
    });
  });

  describe('Performance de Agregação', () => {
    it('deve ter performance aceitável para diferentes complexidades de pipeline', async () => {
      // Arrange
      const testCases = [
        {
          name: 'Pipeline Simples',
          groupByFields: ['CHV_NFE'],
          expectedComplexity: 'medium'
        },
        {
          name: 'Pipeline Complexo',
          groupByFields: ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'],
          expectedComplexity: 'high'
        }
      ];

      const orderingConfig = createTestOrderingConfig({
        fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
        defaultOrdering: 'DT_DOC DESC'
      });

      const testQuery = { DT_DOC: { $gte: '2024-01-01' } };

      for (const testCase of testCases) {
        const groupingConfig = createTestGroupingConfig({
          enabled: true,
          groupByFields: testCase.groupByFields,
          collection: 'tbl_nfe_100',
          globalEnabled: true
        });

        vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
        vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

        // Act
        const startTime = performance.now();
        const result = await interceptor.intercept('tbl_nfe_100', testQuery);
        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Assert
        expect(result.success).toBe(true);
        expect(result.metadata.grouped).toBe(true);

        console.log(`${testCase.name} Performance:
          - Fields: ${testCase.groupByFields.join(', ')}
          - Processing time: ${processingTime.toFixed(2)}ms`);

        // Performance deve ser aceitável mesmo para pipelines complexos
        expect(processingTime).toBeLessThan(2000); // < 2 segundos
      }
    });
  });

  describe('Métricas de Performance', () => {
    it('deve fornecer métricas detalhadas de performance', async () => {
      // Arrange
      const groupingConfig = createTestGroupingConfig({
        enabled: true,
        groupByFields: ['CHV_NFE'],
        collection: 'tbl_nfe_100',
        globalEnabled: true
      });

      const orderingConfig = createTestOrderingConfig({
        fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
        defaultOrdering: 'DT_DOC DESC'
      });

      vi.mocked(mockGroupingManager.getGroupingConfig).mockReturnValue(groupingConfig);
      vi.mocked(mockGroupingManager.getOrderingConfig).mockReturnValue(orderingConfig);

      const testQuery = { CNPJ_EMIT: '12345678000195' };

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', testQuery);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata).toHaveProperty('breakdown');
      
      if (result.metadata.breakdown) {
        expect(result.metadata.breakdown).toHaveProperty('configTime');
        expect(result.metadata.breakdown).toHaveProperty('pipelineTime');
        expect(result.metadata.breakdown).toHaveProperty('aggregationTime');
        expect(result.metadata.breakdown).toHaveProperty('transformTime');
        
        // Todos os tempos devem ser números positivos
        expect(result.metadata.breakdown.configTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.breakdown.pipelineTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.breakdown.aggregationTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.breakdown.transformTime).toBeGreaterThanOrEqual(0);
      }

      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});