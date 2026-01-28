/**
 * Testes de integração para FiscalDocumentsService
 * 
 * **Valida: Requisitos 4.1, 4.2, 4.3, 8.1, 8.2**
 * 
 * Testa a integração completa entre FiscalDocumentsService e NFeQueryInterceptor
 * verificando compatibilidade com código cliente existente e logging de performance
 */

// 1. Node.js built-ins

// 2. External libraries
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)
import { NFE_GROUPING_SUPPORTED_COLLECTIONS } from '@fiscal/shared/constants/nfe-grouping.constants';

// 4. Relative imports
import { createFiscalDocumentsService, FiscalDocumentsService, type FetchDocumentsParams } from '../FiscalDocumentsService';
import { NFeQueryInterceptor } from '../NFeQueryInterceptor';

describe('FiscalDocumentsService - Testes de Integração', () => {
  let service: FiscalDocumentsService;
  let mockMongoClient: any;
  let mockDb: any;
  let mockCollection: any;
  let interceptorSpy: any;

  // Dados de teste
  const mockDocuments = [
    {
      _id: '1',
      CHV_NFE: 'NFe35200714200166000187550010000000001123456789',
      DT_DOC: '2024-01-15',
      VL_DOC: 1500.00,
      NM_EMIT: 'Empresa Teste LTDA'
    },
    {
      _id: '2',
      CHV_NFE: '35200714200166000187550010000000001123456789',
      DT_DOC: '2024-01-16',
      VL_DOC: 2000.00,
      NM_EMIT: 'Empresa Teste LTDA'
    },
    {
      _id: '3',
      CHV_NFE: 'NFe35200714200166000187550010000000002987654321',
      DT_DOC: '2024-01-17',
      VL_DOC: 800.00,
      NM_EMIT: 'Outra Empresa LTDA'
    }
  ];

  beforeEach(() => {
    // Setup mocks para MongoDB
    mockCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockDocuments)
      }),
      countDocuments: vi.fn().mockResolvedValue(mockDocuments.length)
    };

    mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection)
    };

    mockMongoClient = {
      db: vi.fn().mockReturnValue(mockDb)
    } as any;

    // Criar serviço com dependências mockadas
    service = createFiscalDocumentsService(mockMongoClient, mockDb);

    // Spy no interceptador
    interceptorSpy = vi.spyOn(NFeQueryInterceptor.prototype, 'intercept');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Integração com NFeQueryInterceptor', () => {
    it('deve usar interceptador para busca de documentos com agrupamento habilitado', async () => {
      // Arrange
      const params: FetchDocumentsParams = {
        collection: 'tbl_nfe_100',
        filter: { CNPJ_EMIT: '14200166000187' },
        sort: { DT_DOC: -1 },
        limit: 50,
        skip: 0
      };

      const mockInterceptorResult = {
        success: true,
        data: [
          {
            _id: { CHV_NFE_NORMALIZED: '35200714200166000187550010000000001123456789' },
            documents: [mockDocuments[0], mockDocuments[1]],
            count: 2,
            totalValue: 3500.00,
            latestDocument: mockDocuments[1],
            metadata: {
              hasNFePrefix: true,
              originalKeys: ['NFe35200714200166000187550010000000001123456789', '35200714200166000187550010000000001123456789'],
              groupedBy: ['CHV_NFE']
            }
          },
          mockDocuments[2]
        ],
        metadata: {
          grouped: true,
          groupCount: 2,
          totalDocuments: 3,
          processingTime: 45,
          cacheUsed: false,
          normalizationApplied: true,
          fallbackUsed: false
        }
      };

      interceptorSpy.mockResolvedValue(mockInterceptorResult as any);

      // Act
      const result = await service.fetchDocuments(params);

      // Assert
      expect(interceptorSpy).toHaveBeenCalledWith(
        'tbl_nfe_100',
        { CNPJ_EMIT: '14200166000187' },
        {
          sort: { DT_DOC: -1 },
          limit: 50,
          skip: 0
        }
      );

      expect(result).toEqual(mockInterceptorResult.data);
    });

    it('deve usar interceptador para busca sem agrupamento quando desabilitado', async () => {
      // Arrange
      const params: FetchDocumentsParams = {
        collection: 'tbl_nfe_100',
        filter: {},
        limit: 100
      };

      const mockInterceptorResult = {
        success: true,
        data: mockDocuments,
        metadata: {
          grouped: false,
          groupCount: 0,
          totalDocuments: mockDocuments.length,
          processingTime: 15,
          cacheUsed: false,
          normalizationApplied: false,
          fallbackUsed: false
        }
      };

      interceptorSpy.mockResolvedValue(mockInterceptorResult as any);

      // Act
      const result = await service.fetchDocuments(params);

      // Assert
      expect(interceptorSpy).toHaveBeenCalledWith(
        'tbl_nfe_100',
        {},
        {
          sort: { DT_DOC: -1 },
          limit: 100,
          skip: 0
        }
      );

      expect(result).toEqual(mockDocuments);
    });

    it('deve usar consulta direta para contagem de documentos', async () => {
      // Arrange
      const params = {
        collection: 'tbl_nfe_100',
        filter: { CNPJ_EMIT: '14200166000187' }
      };

      // Act
      const result = await service.fetchCount(params);

      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('tbl_nfe_100');
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ CNPJ_EMIT: '14200166000187' });
      expect(result).toBe(mockDocuments.length);
      
      // Interceptador não deve ser usado para contagem
      expect(interceptorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Compatibilidade com Código Cliente Existente', () => {
    it('deve manter assinaturas de métodos inalteradas', async () => {
      // Arrange
      const fetchParams: FetchDocumentsParams = {
        collection: 'tbl_nfe_100',
        filter: { DT_DOC: { $gte: '2024-01-01' } },
        sort: { DT_DOC: -1 },
        limit: 25,
        skip: 10
      };

      const countParams = {
        collection: 'tbl_nfe_100',
        filter: { DT_DOC: { $gte: '2024-01-01' } }
      };

      interceptorSpy.mockResolvedValue({
        success: true,
        data: mockDocuments,
        metadata: {
          grouped: false,
          groupCount: 0,
          totalDocuments: mockDocuments.length,
          processingTime: 20,
          cacheUsed: false,
          normalizationApplied: false,
          fallbackUsed: false
        }
      });

      // Act & Assert - Métodos devem existir e funcionar
      expect(typeof service.fetchDocuments).toBe('function');
      expect(typeof service.fetchCount).toBe('function');

      const documents = await service.fetchDocuments(fetchParams);
      const count = await service.fetchCount(countParams);

      expect(Array.isArray(documents)).toBe(true);
      expect(typeof count).toBe('number');
    });

    it('deve funcionar com parâmetros opcionais padrão', async () => {
      // Arrange
      const minimalParams: FetchDocumentsParams = {
        collection: 'tbl_nfe_100'
      };

      interceptorSpy.mockResolvedValue({
        success: true,
        data: mockDocuments,
        metadata: {
          grouped: false,
          groupCount: 0,
          totalDocuments: mockDocuments.length,
          processingTime: 10,
          cacheUsed: false,
          normalizationApplied: false,
          fallbackUsed: false
        }
      });

      // Act
      const result = await service.fetchDocuments(minimalParams);

      // Assert - Deve usar valores padrão
      expect(interceptorSpy).toHaveBeenCalledWith(
        'tbl_nfe_100',
        {}, // filter padrão
        {
          sort: { DT_DOC: -1 }, // sort padrão
          limit: 100, // limit padrão
          skip: 0 // skip padrão
        }
      );

      expect(result).toEqual(mockDocuments);
    });

    it('deve tratar erros graciosamente mantendo compatibilidade', async () => {
      // Arrange
      const params: FetchDocumentsParams = {
        collection: 'tbl_nfe_100'
      };

      const testError = new Error('Erro de conexão com MongoDB');
      interceptorSpy.mockRejectedValue(testError);

      // Act & Assert
      await expect(service.fetchDocuments(params)).rejects.toThrow('Erro de conexão com MongoDB');
    });
  });

  describe('Logging de Performance', () => {
    it('deve registrar logs detalhados quando agrupamento é aplicado', async () => {
      // Arrange
      const loggerSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const params: FetchDocumentsParams = {
        collection: 'tbl_nfe_100',
        filter: { CNPJ_EMIT: '14200166000187' }
      };

      interceptorSpy.mockResolvedValue({
        success: true,
        data: mockDocuments,
        metadata: {
          grouped: true,
          groupCount: 2,
          totalDocuments: 3,
          processingTime: 75,
          cacheUsed: true,
          normalizationApplied: true,
          fallbackUsed: false
        }
      });

      // Act
      await service.fetchDocuments(params);

      // Assert - Verificar se logs foram registrados
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NFE-GROUPING-SERVICE]'),
        expect.stringContaining('📄 Buscando documentos fiscais'),
        expect.objectContaining({
          collection: 'tbl_nfe_100',
          filter: { CNPJ_EMIT: '14200166000187' }
        })
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NFE-GROUPING-SERVICE]'),
        expect.stringContaining('✅ Documentos agrupados retornados'),
        expect.objectContaining({
          collection: 'tbl_nfe_100',
          groupCount: 2,
          totalDocuments: 3,
          processingTime: 75,
          normalizationApplied: true,
          fallbackUsed: false
        })
      );

      loggerSpy.mockRestore();
    });

    it('deve registrar logs quando agrupamento não é aplicado', async () => {
      // Arrange
      const loggerSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const params: FetchDocumentsParams = {
        collection: 'unsupported_collection'
      };

      interceptorSpy.mockResolvedValue({
        success: true,
        data: mockDocuments,
        metadata: {
          grouped: false,
          groupCount: 0,
          totalDocuments: mockDocuments.length,
          processingTime: 25,
          cacheUsed: false,
          normalizationApplied: false,
          fallbackUsed: false
        }
      });

      // Act
      await service.fetchDocuments(params);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NFE-GROUPING-SERVICE]'),
        expect.stringContaining('✅ Documentos retornados sem agrupamento'),
        expect.objectContaining({
          collection: 'unsupported_collection',
          documentCount: mockDocuments.length,
          fallbackUsed: false
        })
      );

      loggerSpy.mockRestore();
    });

    it('deve medir tempo de processamento do serviço', async () => {
      // Arrange
      const loggerSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const params: FetchDocumentsParams = {
        collection: 'tbl_nfe_100'
      };

      // Simular delay no interceptador
      interceptorSpy.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          success: true,
          data: mockDocuments,
          metadata: {
            grouped: false,
            groupCount: 0,
            totalDocuments: mockDocuments.length,
            processingTime: 45,
            cacheUsed: false,
            normalizationApplied: false,
            fallbackUsed: false
          }
        };
      });

      // Act
      await service.fetchDocuments(params);

      // Assert - Verificar se tempo de processamento do serviço foi registrado
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NFE-GROUPING-SERVICE]'),
        expect.stringContaining('✅ Documentos retornados sem agrupamento'),
        expect.objectContaining({
          serviceProcessingTime: expect.any(Number)
        })
      );

      // Verificar se o tempo é razoável (> 40ms devido ao delay simulado)
      const logCall = loggerSpy.mock.calls.find(call => 
        call[1]?.includes('✅ Documentos retornados sem agrupamento')
      );
      expect(logCall).toBeDefined();
      expect(logCall![2].serviceProcessingTime).toBeGreaterThan(40);

      loggerSpy.mockRestore();
    });
  });

  describe('Métodos de Utilidade', () => {
    it('deve fornecer estatísticas do serviço', () => {
      // Act
      const stats = service.getServiceStats();

      // Assert
      expect(stats).toHaveProperty('totalDocuments');
      expect(stats).toHaveProperty('groupedDocuments');
      expect(stats).toHaveProperty('processingTime');
      expect(stats).toHaveProperty('cacheHitRate');
    });

    it('deve permitir atualização de configurações', () => {
      // Arrange
      const refreshSpy = vi.spyOn(NFeQueryInterceptor.prototype, 'refreshConfigurations');

      // Act
      service.refreshGroupingConfigurations();

      // Assert
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('deve verificar se agrupamento está habilitado', () => {
      // Arrange
      const getStatsSpy = vi.spyOn(NFeQueryInterceptor.prototype, 'getInterceptionStats')
        .mockReturnValue({
          supportedCollections: [...NFE_GROUPING_SUPPORTED_COLLECTIONS],
          globalEnabled: true,
          configCacheSize: 5
        });

      // Act
      const isEnabled = service.isGroupingEnabled();

      // Assert
      expect(isEnabled).toBe(true);
      expect(getStatsSpy).toHaveBeenCalled();
    });

    it('deve listar coleções suportadas', () => {
      // Arrange
      const getStatsSpy = vi.spyOn(NFeQueryInterceptor.prototype, 'getInterceptionStats')
        .mockReturnValue({
          supportedCollections: [...NFE_GROUPING_SUPPORTED_COLLECTIONS],
          globalEnabled: true,
          configCacheSize: 5
        });

      // Act
      const collections = service.getSupportedCollections();

      // Assert
      expect(collections).toEqual(NFE_GROUPING_SUPPORTED_COLLECTIONS);
      expect(getStatsSpy).toHaveBeenCalled();
    });
  });

  describe('Cenários de Erro', () => {
    it('deve tratar erro no interceptador e propagar corretamente', async () => {
      // Arrange
      const params: FetchDocumentsParams = {
        collection: 'tbl_nfe_100'
      };

      const testError = new Error('Falha na interceptação');
      interceptorSpy.mockRejectedValue(testError);

      // Act & Assert
      await expect(service.fetchDocuments(params)).rejects.toThrow('Falha na interceptação');
    });

    it('deve tratar erro na contagem e propagar corretamente', async () => {
      // Arrange
      const params = {
        collection: 'tbl_nfe_100',
        filter: {}
      };

      const testError = new Error('Erro na contagem');
      mockCollection.countDocuments.mockRejectedValue(testError);

      // Act & Assert
      await expect(service.fetchCount(params)).rejects.toThrow('Erro na contagem');
    });

    it('deve registrar logs de erro com contexto completo', async () => {
      // Arrange
      const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const params: FetchDocumentsParams = {
        collection: 'tbl_nfe_100',
        filter: { test: 'value' }
      };

      const testError = new Error('Erro de teste');
      interceptorSpy.mockRejectedValue(testError);

      // Act
      try {
        await service.fetchDocuments(params);
      } catch (error) {
        // Esperado
      }

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NFE-GROUPING-ERROR]'),
        expect.stringContaining('❌ Erro ao buscar documentos fiscais'),
        expect.objectContaining({
          error: 'Erro de teste',
          params,
          processingTime: expect.any(Number)
        })
      );

      loggerSpy.mockRestore();
    });
  });
});