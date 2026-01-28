/**
 * Testes unitários para pipeline de agregação do NFeQueryInterceptor
 * 
 * **Valida: Requisitos 6.2, 6.3**
 * 
 * Foca em:
 * - Construção de pipelines com diferentes configurações
 * - Preservação de filtros originais
 * - Validação de estágios do pipeline
 * - Otimização de performance
 */

// 1. Node.js built-ins
import { MongoClient } from 'mongodb';

// 2. External libraries
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)
import { NFE_GROUPING_DEFAULTS } from '@fiscal/shared/constants/nfe-grouping.constants';
import { QueryInterceptionError } from '@fiscal/shared/errors/query-interception-error.class';
import { GroupingConfig } from '@fiscal/shared/types/grouping/grouping-config.interface';
import { OrderingConfig } from '@fiscal/shared/types/grouping/ordering-config.interface';

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';
import { NFePrefixNormalizer } from '../NFePrefixNormalizer';
import { NFeQueryInterceptor } from '../NFeQueryInterceptor';
import { OrderingProcessor } from '../OrderingProcessor';

describe('NFeQueryInterceptor - Pipeline de Agregação', () => {
  let interceptor: NFeQueryInterceptor;
  let mockMongoClient: MongoClient;
  let mockDb: any;
  let mockCollection: any;

  // Configurações de teste padrão
  const defaultGroupingConfig: GroupingConfig = {
    enabled: true,
    globalEnabled: true,
    groupByFields: ['CHV_NFE'],
    collection: 'tbl_nfe_100',
    lastUpdated: Date.now(),
    source: 'default'
  };

  const defaultOrderingConfig: OrderingConfig = {
    enabled: true,
    fields: [
      { field: 'DT_DOC', direction: 'DESC' },
      { field: 'PROTOCOLADA', direction: 'DESC' }
    ],
    defaultOrdering: 'DT_DOC DESC, PROTOCOLADA DESC',
    lastUpdated: Date.now()
  };

  // Dados de teste simulados
  const mockDocuments = [
    {
      _id: '1',
      CHV_NFE: 'NFe35200714200166000187550010000000001123456789',
      CNPJ_EMIT: '14200166000187',
      DT_DOC: '2024-01-15',
      VALOR_TOTAL: 1500.00,
      PROTOCOLADA: 'S'
    },
    {
      _id: '2',
      CHV_NFE: '35200714200166000187550010000000001123456789',
      CNPJ_EMIT: '14200166000187',
      DT_DOC: '2024-01-16',
      VALOR_TOTAL: 2000.00,
      PROTOCOLADA: 'S'
    },
    {
      _id: '3',
      CHV_NFE: 'NFe35200714200166000187550010000000002987654321',
      CNPJ_EMIT: '14200166000187',
      DT_DOC: '2024-01-17',
      VALOR_TOTAL: 800.00,
      PROTOCOLADA: 'N'
    }
  ];

  beforeEach(() => {
    // Setup mocks para MongoDB
    mockCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockDocuments)
      }),
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      })
    };

    mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection)
    };

    mockMongoClient = {
      db: vi.fn().mockReturnValue(mockDb)
    } as any;

    // Usar getInstance para padrão singleton
    interceptor = NFeQueryInterceptor.getInstance();
    interceptor.setMongoClient(mockMongoClient);

    // Mock dos serviços internos
    vi.spyOn(GroupingConfigManager.prototype, 'getGroupingConfig').mockReturnValue(defaultGroupingConfig);
    vi.spyOn(GroupingConfigManager.prototype, 'getOrderingConfig').mockReturnValue(defaultOrderingConfig);
    vi.spyOn(NFePrefixNormalizer.prototype, 'createNormalizationPipeline').mockReturnValue([
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
    ]);
    vi.spyOn(OrderingProcessor.prototype, 'parseOrderingConfig').mockReturnValue([
      { field: 'DT_DOC', direction: -1, priority: 1 },
      { field: 'PROTOCOLADA', direction: -1, priority: 2 }
    ]);
    vi.spyOn(OrderingProcessor.prototype, 'buildSortStage').mockReturnValue({
      $sort: { DT_DOC: -1, PROTOCOLADA: -1 }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Construção de Pipeline Básico', () => {
    it('deve construir pipeline com filtros originais preservados', async () => {
      // Arrange
      const originalQuery = { CNPJ_EMIT: '14200166000187', DT_DOC: { $gte: '2024-01-01' } };
      const expectedPipeline = [
        { $match: originalQuery },
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
        },
        {
          $group: {
            _id: { CHV_NFE_NORMALIZED: '$CHV_NFE_NORMALIZED' },
            documents: { $push: '$$ROOT' },
            count: { $sum: 1 },
            totalValue: { $sum: { $ifNull: ['$VALOR_TOTAL', 0] } },
            latestDocument: { $last: '$$ROOT' },
            originalKeys: { $addToSet: '$CHV_NFE' },
            hasNFePrefix: {
              $max: {
                $cond: [
                  { $eq: [{ $substr: ['$CHV_NFE', 0, 3] }, 'NFe'] },
                  true,
                  false
                ]
              }
            }
          }
        },
        { $sort: { DT_DOC: -1, PROTOCOLADA: -1 } }
      ];

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            _id: { CHV_NFE_NORMALIZED: '35200714200166000187550010000000001123456789' },
            documents: [mockDocuments[0], mockDocuments[1]],
            count: 2,
            totalValue: 3500.00,
            latestDocument: mockDocuments[1],
            originalKeys: ['NFe35200714200166000187550010000000001123456789', '35200714200166000187550010000000001123456789'],
            hasNFePrefix: true
          }
        ])
      });

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', originalQuery);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.grouped).toBe(true);
      expect(mockCollection.aggregate).toHaveBeenCalledWith(
        expectedPipeline,
        { maxTimeMS: NFE_GROUPING_DEFAULTS.AGGREGATION_TIMEOUT_MS }
      );
    });

    it('deve construir pipeline sem filtros quando query original está vazia', async () => {
      // Arrange
      const originalQuery = {};
      
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', originalQuery);

      // Assert
      expect(result.success).toBe(true);
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      expect(capturedPipeline[0]).not.toEqual({ $match: {} });
      expect(capturedPipeline[0].$addFields).toBeDefined();
    });

    it('deve incluir stage de normalização quando agrupando por CHV_NFE', async () => {
      // Arrange
      const groupingConfig = { ...defaultGroupingConfig, groupByFields: ['CHV_NFE'] };
      vi.spyOn(GroupingConfigManager.prototype, 'getGroupingConfig').mockReturnValue(groupingConfig);

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      expect(capturedPipeline.some((stage: any) => stage.$addFields?.CHV_NFE_NORMALIZED)).toBe(true);
    });

    it('deve omitir stage de normalização quando não agrupando por CHV_NFE', async () => {
      // Arrange
      const groupingConfig = { ...defaultGroupingConfig, groupByFields: ['CNPJ_EMIT'] };
      vi.spyOn(GroupingConfigManager.prototype, 'getGroupingConfig').mockReturnValue(groupingConfig);

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      expect(capturedPipeline.some((stage: any) => stage.$addFields?.CHV_NFE_NORMALIZED)).toBe(false);
    });
  });

  describe('Configurações de Agrupamento', () => {
    it('deve construir pipeline com múltiplos campos de agrupamento', async () => {
      // Arrange
      const groupingConfig = { 
        ...defaultGroupingConfig, 
        groupByFields: ['CHV_NFE', 'CNPJ_EMIT'] 
      };
      vi.spyOn(GroupingConfigManager.prototype, 'getGroupingConfig').mockReturnValue(groupingConfig);

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      const groupStage = capturedPipeline.find((stage: any) => stage.$group);
      expect(groupStage.$group._id).toEqual({
        CHV_NFE_NORMALIZED: '$CHV_NFE_NORMALIZED',
        CNPJ_EMIT: '$CNPJ_EMIT'
      });
    });

    it('deve aplicar ordenação personalizada quando especificada nas opções', async () => {
      // Arrange
      const customSort = { VALOR_TOTAL: -1, DT_DOC: 1 };
      
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {}, { sort: customSort });

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      expect(capturedPipeline).toContainEqual({ $sort: customSort });
    });

    it('deve aplicar ordenação padrão quando não especificada nas opções', async () => {
      // Arrange
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      expect(capturedPipeline).toContainEqual({ $sort: { DT_DOC: -1, PROTOCOLADA: -1 } });
    });

    it('deve aplicar skip e limit quando especificados', async () => {
      // Arrange
      const options = { skip: 10, limit: 50 };
      
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {}, options);

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      expect(capturedPipeline).toContainEqual({ $skip: 10 });
      expect(capturedPipeline).toContainEqual({ $limit: 50 });
    });

    it('deve omitir skip quando valor é zero ou negativo', async () => {
      // Arrange
      const options = { skip: 0, limit: 50 };
      
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {}, options);

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      expect(capturedPipeline.some((stage: any) => stage.$skip)).toBe(false);
      expect(capturedPipeline).toContainEqual({ $limit: 50 });
    });
  });

  describe('Transformação de Resultados', () => {
    it('deve retornar documento único quando grupo tem apenas um documento', async () => {
      // Arrange
      const singleDocumentGroup = {
        _id: { CHV_NFE_NORMALIZED: '35200714200166000187550010000000001123456789' },
        documents: [mockDocuments[0]],
        count: 1,
        totalValue: 1500.00,
        latestDocument: mockDocuments[0],
        originalKeys: ['NFe35200714200166000187550010000000001123456789'],
        hasNFePrefix: true
      };

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([singleDocumentGroup])
      });

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockDocuments[0]);
    });

    it('deve retornar estrutura agrupada quando grupo tem múltiplos documentos', async () => {
      // Arrange
      const multipleDocumentGroup = {
        _id: { CHV_NFE_NORMALIZED: '35200714200166000187550010000000001123456789' },
        documents: [mockDocuments[0], mockDocuments[1]],
        count: 2,
        totalValue: 3500.00,
        latestDocument: mockDocuments[1],
        originalKeys: ['NFe35200714200166000187550010000000001123456789', '35200714200166000187550010000000001123456789'],
        hasNFePrefix: true
      };

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([multipleDocumentGroup])
      });

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        _id: multipleDocumentGroup._id,
        documents: multipleDocumentGroup.documents,
        count: 2,
        totalValue: 3500.00,
        latestDocument: mockDocuments[1],
        metadata: {
          hasNFePrefix: true,
          originalKeys: multipleDocumentGroup.originalKeys,
          groupedBy: ['CHV_NFE']
        }
      });
    });

    it('deve incluir metadados corretos no resultado', async () => {
      // Arrange
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            _id: { CHV_NFE_NORMALIZED: '35200714200166000187550010000000001123456789' },
            documents: [mockDocuments[0], mockDocuments[1]],
            count: 2,
            totalValue: 3500.00,
            latestDocument: mockDocuments[1],
            originalKeys: ['NFe35200714200166000187550010000000001123456789'],
            hasNFePrefix: true
          }
        ])
      });

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(result.metadata).toEqual({
        grouped: true,
        groupCount: 1,
        totalDocuments: 2,
        processingTime: expect.any(Number),
        cacheUsed: false,
        normalizationApplied: true,
        fallbackUsed: false
      });
    });
  });

  describe('Configurações Desabilitadas', () => {
    it('deve executar consulta original quando agrupamento está desabilitado', async () => {
      // Arrange
      const disabledConfig = { ...defaultGroupingConfig, enabled: false };
      vi.spyOn(GroupingConfigManager.prototype, 'getGroupingConfig').mockReturnValue(disabledConfig);

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.grouped).toBe(false);
      expect(mockCollection.find).toHaveBeenCalled();
      expect(mockCollection.aggregate).not.toHaveBeenCalled();
    });

    it('deve executar consulta original quando agrupamento global está desabilitado', async () => {
      // Arrange
      const disabledGlobalConfig = { ...defaultGroupingConfig, globalEnabled: false };
      vi.spyOn(GroupingConfigManager.prototype, 'getGroupingConfig').mockReturnValue(disabledGlobalConfig);

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.grouped).toBe(false);
      expect(mockCollection.find).toHaveBeenCalled();
      expect(mockCollection.aggregate).not.toHaveBeenCalled();
    });

    it('deve ignorar interceptação para coleções não suportadas', async () => {
      // Act
      const result = await interceptor.intercept('unsupported_collection', {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.grouped).toBe(false);
      expect(mockCollection.find).toHaveBeenCalled();
      expect(mockCollection.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('Performance e Otimização', () => {
    it('deve medir tempo de processamento corretamente', async () => {
      // Arrange
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve([]), 100))
        )
      });

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(result.metadata.processingTime).toBeGreaterThan(90);
      expect(result.metadata.processingTime).toBeLessThan(200);
    });

    it('deve construir pipeline otimizado com ordem correta de estágios', async () => {
      // Arrange
      const query = { CNPJ_EMIT: '14200166000187' };
      const options = { skip: 10, limit: 20, sort: { DT_DOC: -1 } };

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', query, options);

      // Assert
      const capturedPipeline = mockCollection.aggregate.mock.calls[0][0];
      
      // Verificar ordem dos estágios
      const stageTypes = capturedPipeline.map((stage: any) => Object.keys(stage)[0]);
      const expectedOrder = ['$match', '$addFields', '$group', '$sort', '$skip', '$limit'];
      
      expectedOrder.forEach((expectedStage, index) => {
        const actualIndex = stageTypes.indexOf(expectedStage);
        if (actualIndex !== -1) {
          expect(actualIndex).toBeGreaterThanOrEqual(index);
        }
      });
    });

    it('deve aplicar timeout correto na agregação', async () => {
      // Arrange
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      // Act
      await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(mockCollection.aggregate).toHaveBeenCalledWith(
        expect.any(Array),
        { maxTimeMS: NFE_GROUPING_DEFAULTS.AGGREGATION_TIMEOUT_MS }
      );
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve executar fallback quando pipeline falha', async () => {
      // Arrange
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockRejectedValue(new Error('Aggregation failed'))
      });

      // Act
      const result = await interceptor.intercept('tbl_nfe_100', {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.fallbackUsed).toBe(true);
      expect(result.metadata.grouped).toBe(false);
      expect(mockCollection.find).toHaveBeenCalled();
    });

    it('deve lançar erro quando cliente MongoDB não está configurado', async () => {
      // Arrange
      const interceptorWithoutClient = NFeQueryInterceptor.getInstance();
      interceptorWithoutClient.setMongoClient(undefined as any);

      // Act & Assert
      await expect(interceptorWithoutClient.intercept('tbl_nfe_100', {}))
        .rejects.toThrow(QueryInterceptionError);
    });
  });
});