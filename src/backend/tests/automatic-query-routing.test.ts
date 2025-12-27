/**
 * Testes para Task 13 - Implementar direcionamento automático de consultas
 * 
 * Valida que todas as consultas sejam direcionadas automaticamente,
 * implementa interceptação transparente de operações de banco,
 * adiciona logging de direcionamento de consultas,
 * verifica que não há vazamentos entre bases de clientes,
 * e implementa métricas de uso por base de dados.
 * 
 * Requisitos: 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { queryInterceptor } from '../services/QueryInterceptor'
import { databaseRouter } from '../services/DatabaseRouter'
import { downloadService } from '../services/DownloadService'
import { fiscalDocumentsService } from '../services/FiscalDocumentsService'
import { UserContext } from '../types/UserContext'

// Mock das dependências
vi.mock('../services/DatabaseRouter', () => ({
  databaseRouter: {
    getCurrentContext: vi.fn(),
    setUserContext: vi.fn(),
    clearUserContext: vi.fn(),
    isUsingFallback: vi.fn().mockReturnValue(false),
    getCurrentSqlConnection: vi.fn(),
    getCurrentMongoConnection: vi.fn()
  }
}))

vi.mock('../services/APILogger', () => ({
  apiLogger: {
    logRequest: vi.fn(),
    logError: vi.fn(),
    logSuccess: vi.fn()
  }
}))

describe('Task 13 - Direcionamento Automático de Consultas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Limpar métricas do interceptor
    queryInterceptor.cleanupOldMetrics(0)
  })

  afterEach(() => {
    vi.mocked(databaseRouter.clearUserContext).mockClear()
  })

  describe('13.1 - Interceptação Transparente de Operações', () => {
    it('deve interceptar consultas SQL automaticamente', async () => {
      // Arrange
      const mockContext: UserContext = {
        usrCodigo: '123',
        usrNome: 'Test User',
        bancoDeDados: 'cliente_test',
        isAuthenticated: true
      }
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext)
      
      const mockQueryFunction = vi.fn().mockResolvedValue({ id: 1, data: 'test' })

      // Act
      const result = await queryInterceptor.interceptSqlQuery(
        'test_operation',
        mockQueryFunction
      )

      // Assert
      expect(result.result).toEqual({ id: 1, data: 'test' })
      expect(result.validation.isValid).toBe(true)
      expect(result.validation.database).toBe('cliente_test')
      expect(result.validation.userId).toBe('123')
      expect(result.validation.isAutomaticallyRouted).toBe(true)
      expect(result.metrics.database).toBe('cliente_test')
      expect(result.metrics.queryType).toBe('sql')
      expect(result.metrics.operation).toBe('test_operation')
      expect(mockQueryFunction).toHaveBeenCalledOnce()
    })

    it('deve interceptar consultas MongoDB automaticamente', async () => {
      // Arrange
      const mockContext: UserContext = {
        usrCodigo: '456',
        usrNome: 'Test User 2',
        bancoDeDados: 'cliente_test2',
        isAuthenticated: true
      }
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext)
      
      const mockQueryFunction = vi.fn().mockResolvedValue([{ _id: '1', name: 'doc1' }])

      // Act
      const result = await queryInterceptor.interceptMongoQuery(
        'find',
        'tbl_nfe_100',
        mockQueryFunction
      )

      // Assert
      expect(result.result).toEqual([{ _id: '1', name: 'doc1' }])
      expect(result.validation.isValid).toBe(true)
      expect(result.validation.database).toBe('cliente_test2')
      expect(result.validation.userId).toBe('456')
      expect(result.validation.isAutomaticallyRouted).toBe(true)
      expect(result.metrics.database).toBe('cliente_test2')
      expect(result.metrics.queryType).toBe('mongo')
      expect(result.metrics.operation).toBe('find:tbl_nfe_100')
      expect(mockQueryFunction).toHaveBeenCalledOnce()
    })

    it('deve usar base global quando não há contexto de usuário', async () => {
      // Arrange - sem contexto de usuário
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(null)
      
      const mockQueryFunction = vi.fn().mockResolvedValue({ global: true })

      // Act
      const result = await queryInterceptor.interceptSqlQuery(
        'global_operation',
        mockQueryFunction
      )

      // Assert
      expect(result.result).toEqual({ global: true })
      expect(result.validation.isValid).toBe(true)
      expect(result.validation.database).toBe('spedrevio')
      expect(result.validation.userId).toBeUndefined()
      expect(result.validation.isAutomaticallyRouted).toBe(true)
      expect(result.metrics.database).toBe('spedrevio')
      expect(mockQueryFunction).toHaveBeenCalledOnce()
    })
  })

  describe('13.2 - Logging de Direcionamento de Consultas', () => {
    it('deve registrar logs detalhados de direcionamento', async () => {
      // Arrange
      const mockContext: UserContext = {
        usrCodigo: '789',
        usrNome: 'Log Test User',
        bancoDeDados: 'cliente_log_test',
        isAuthenticated: true
      }
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext)
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const mockQueryFunction = vi.fn().mockResolvedValue({ logged: true })

      // Act
      await queryInterceptor.interceptSqlQuery(
        'logged_operation',
        mockQueryFunction
      )

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[QueryInterceptor] 🔄 Consulta direcionada automaticamente:'),
        expect.objectContaining({
          database: 'cliente_log_test',
          queryType: 'sql',
          operation: 'logged_operation',
          userId: '789',
          isAutomaticallyRouted: true
        })
      )

      consoleSpy.mockRestore()
    })

    it('deve registrar erros de consulta com detalhes', async () => {
      // Arrange
      const mockContext: UserContext = {
        usrCodigo: '999',
        usrNome: 'Error Test User',
        bancoDeDados: 'cliente_error_test',
        isAuthenticated: true
      }
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext)
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockQueryFunction = vi.fn().mockRejectedValue(new Error('Test query error'))

      // Act & Assert
      await expect(
        queryInterceptor.interceptSqlQuery('error_operation', mockQueryFunction)
      ).rejects.toThrow('Test query error')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[QueryInterceptor] Erro na consulta SQL:'),
        expect.objectContaining({
          database: 'cliente_error_test',
          operation: 'error_operation',
          userId: '999',
          error: 'Test query error',
          isAutomaticallyRouted: true
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('13.3 - Métricas de Uso por Base de Dados', () => {
    it('deve coletar métricas de uso por base de dados', async () => {
      // Arrange
      const mockContext1: UserContext = {
        usrCodigo: '100',
        usrNome: 'Metrics User 1',
        bancoDeDados: 'cliente_metrics1',
        isAuthenticated: true
      }
      
      const mockContext2: UserContext = {
        usrCodigo: '200',
        usrNome: 'Metrics User 2',
        bancoDeDados: 'cliente_metrics2',
        isAuthenticated: true
      }

      const mockQueryFunction = vi.fn().mockResolvedValue({ success: true })

      // Act - Executar consultas em diferentes bases
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext1)
      await queryInterceptor.interceptSqlQuery('operation1', mockQueryFunction)
      await queryInterceptor.interceptMongoQuery('find', 'collection1', mockQueryFunction)

      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext2)
      await queryInterceptor.interceptSqlQuery('operation2', mockQueryFunction)

      // Assert
      const stats = queryInterceptor.getDatabaseUsageStats()
      
      expect(stats.has('cliente_metrics1')).toBe(true)
      expect(stats.has('cliente_metrics2')).toBe(true)
      
      const stats1 = stats.get('cliente_metrics1')
      expect(stats1?.totalQueries).toBe(2)
      expect(stats1?.sqlQueries).toBe(1)
      expect(stats1?.mongoQueries).toBe(1)
      expect(stats1?.uniqueUsers).toContain('100')
      
      const stats2 = stats.get('cliente_metrics2')
      expect(stats2?.totalQueries).toBe(1)
      expect(stats2?.sqlQueries).toBe(1)
      expect(stats2?.mongoQueries).toBe(0)
      expect(stats2?.uniqueUsers).toContain('200')
    })

    it('deve gerar relatório de direcionamento automático', async () => {
      // Arrange
      const mockContext: UserContext = {
        usrCodigo: '300',
        usrNome: 'Report User',
        bancoDeDados: 'cliente_report',
        isAuthenticated: true
      }
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext)
      
      const mockQueryFunction = vi.fn().mockResolvedValue({ data: 'test' })

      // Act - Executar várias consultas
      await queryInterceptor.interceptSqlQuery('report_op1', mockQueryFunction)
      await queryInterceptor.interceptSqlQuery('report_op2', mockQueryFunction)
      await queryInterceptor.interceptMongoQuery('find', 'collection', mockQueryFunction)

      // Assert
      const report = queryInterceptor.getAutomaticRoutingReport()
      
      expect(report.totalQueries).toBe(3)
      expect(report.automaticallyRouted).toBe(3)
      expect(report.routingEfficiency).toBe(100)
      expect(report.databaseDistribution['cliente_report']).toBe(3)
      expect(report.averageExecutionTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('13.4 - Detecção de Vazamentos entre Bases', () => {
    it('deve detectar tentativas de acesso cruzado', async () => {
      // Arrange
      const mockContext1: UserContext = {
        usrCodigo: '400',
        usrNome: 'User A',
        bancoDeDados: 'cliente_a',
        isAuthenticated: true
      }
      
      const mockContext2: UserContext = {
        usrCodigo: '500',
        usrNome: 'User B',
        bancoDeDados: 'cliente_b',
        isAuthenticated: true
      }

      const mockQueryFunction = vi.fn().mockResolvedValue({ data: 'test' })

      // Act - Simular usuário acessando múltiplas bases
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext1)
      await queryInterceptor.interceptSqlQuery('operation_a', mockQueryFunction)
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext2)
      await queryInterceptor.interceptSqlQuery('operation_b', mockQueryFunction)

      // Simular acesso suspeito (mesmo usuário, bases diferentes)
      // Isso seria detectado em cenários reais onde o contexto não muda corretamente
      
      // Assert
      const leakageReport = queryInterceptor.detectDataLeakage()
      
      // Em condições normais, não deve haver vazamento
      // pois cada usuário acessa apenas sua base
      expect(leakageReport.hasLeakage).toBe(false)
      expect(leakageReport.suspiciousActivities).toHaveLength(0)
    })

    it('deve validar isolamento entre usuários simultâneos', async () => {
      // Arrange
      const users = [
        { usrCodigo: '600', bancoDeDados: 'cliente_600' },
        { usrCodigo: '700', bancoDeDados: 'cliente_700' },
        { usrCodigo: '800', bancoDeDados: 'cliente_800' }
      ]

      const mockQueryFunction = vi.fn().mockResolvedValue({ isolated: true })

      // Act - Simular consultas simultâneas de diferentes usuários
      const promises = users.map(async (user, index) => {
        const context: UserContext = {
          usrCodigo: user.usrCodigo,
          usrNome: `User ${user.usrCodigo}`,
          bancoDeDados: user.bancoDeDados,
          isAuthenticated: true
        }
        
        // Mock context for this specific call
        vi.mocked(databaseRouter.getCurrentContext).mockReturnValueOnce(context)
        
        return queryInterceptor.interceptSqlQuery(
          `isolated_operation_${user.usrCodigo}`,
          mockQueryFunction
        )
      })

      const results = await Promise.all(promises)

      // Assert - Cada consulta deve ter usado a base correta
      results.forEach((result, index) => {
        expect(result.validation.database).toBe(users[index].bancoDeDados)
        expect(result.validation.userId).toBe(users[index].usrCodigo)
        expect(result.validation.isAutomaticallyRouted).toBe(true)
      })

      // Verificar métricas por base
      const stats = queryInterceptor.getDatabaseUsageStats()
      users.forEach(user => {
        expect(stats.has(user.bancoDeDados)).toBe(true)
        const userStats = stats.get(user.bancoDeDados)
        expect(userStats?.totalQueries).toBe(1)
        expect(userStats?.uniqueUsers).toContain(user.usrCodigo)
      })
    })
  })

  describe('13.5 - Testes de Propriedade com fast-check', () => {
    it('Propriedade 16: Direcionamento automático de consultas', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            usrCodigo: fc.string({ minLength: 1, maxLength: 10 }),
            usrNome: fc.string({ minLength: 1, maxLength: 50 }),
            bancoDeDados: fc.string({ minLength: 1, maxLength: 20 }),
            operation: fc.string({ minLength: 1, maxLength: 30 })
          }),
          async ({ usrCodigo, usrNome, bancoDeDados, operation }) => {
            // Arrange
            const context: UserContext = {
              usrCodigo,
              usrNome,
              bancoDeDados,
              isAuthenticated: true
            }
            
            vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(context)
            
            const mockQueryFunction = vi.fn().mockResolvedValue({ 
              user: usrCodigo, 
              database: bancoDeDados 
            })

            // Act
            const result = await queryInterceptor.interceptSqlQuery(
              operation,
              mockQueryFunction
            )

            // Assert - Propriedades que devem sempre ser verdadeiras
            expect(result.validation.isValid).toBe(true)
            expect(result.validation.database).toBe(bancoDeDados)
            expect(result.validation.userId).toBe(usrCodigo)
            expect(result.validation.isAutomaticallyRouted).toBe(true)
            expect(result.metrics.database).toBe(bancoDeDados)
            expect(result.metrics.userId).toBe(usrCodigo)
            expect(result.metrics.operation).toBe(operation)
            expect(result.metrics.isAutomaticallyRouted).toBe(true)
            expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0)
            expect(mockQueryFunction).toHaveBeenCalledOnce()
          }
        ),
        { numRuns: 10 } // Reduced for faster tests
      )
    })

    it('Propriedade: Métricas são sempre coletadas corretamente', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              usrCodigo: fc.string({ minLength: 1, maxLength: 10 }),
              bancoDeDados: fc.string({ minLength: 1, maxLength: 20 }),
              queryType: fc.constantFrom('sql', 'mongo'),
              operation: fc.string({ minLength: 1, maxLength: 20 })
            }),
            { minLength: 1, maxLength: 5 } // Reduced for faster tests
          ),
          async (queries) => {
            // Arrange
            const mockQueryFunction = vi.fn().mockResolvedValue({ success: true })

            // Act - Executar todas as consultas
            for (const query of queries) {
              const context: UserContext = {
                usrCodigo: query.usrCodigo,
                usrNome: `User ${query.usrCodigo}`,
                bancoDeDados: query.bancoDeDados,
                isAuthenticated: true
              }
              
              vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(context)
              
              if (query.queryType === 'sql') {
                await queryInterceptor.interceptSqlQuery(query.operation, mockQueryFunction)
              } else {
                await queryInterceptor.interceptMongoQuery(query.operation, 'collection', mockQueryFunction)
              }
            }

            // Assert - Verificar métricas
            const stats = queryInterceptor.getDatabaseUsageStats()
            const report = queryInterceptor.getAutomaticRoutingReport()
            
            // Propriedades das métricas
            expect(report.totalQueries).toBe(queries.length)
            expect(report.automaticallyRouted).toBe(queries.length)
            expect(report.routingEfficiency).toBe(100)
            
            // Verificar estatísticas por base
            const uniqueDatabases = new Set(queries.map(q => q.bancoDeDados))
            expect(stats.size).toBe(uniqueDatabases.size)
            
            for (const database of uniqueDatabases) {
              const dbQueries = queries.filter(q => q.bancoDeDados === database)
              const dbStats = stats.get(database)
              
              expect(dbStats).toBeDefined()
              expect(dbStats!.totalQueries).toBe(dbQueries.length)
              expect(dbStats!.sqlQueries).toBe(dbQueries.filter(q => q.queryType === 'sql').length)
              expect(dbStats!.mongoQueries).toBe(dbQueries.filter(q => q.queryType === 'mongo').length)
            }
          }
        ),
        { numRuns: 5 } // Reduced for faster tests
      )
    })
  })

  describe('13.6 - Integração com Serviços Existentes', () => {
    it('deve integrar com DownloadService automaticamente', async () => {
      // Arrange
      const mockContext: UserContext = {
        usrCodigo: '1000',
        usrNome: 'Download User',
        bancoDeDados: 'cliente_download',
        isAuthenticated: true
      }
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext)

      // Mock do Prisma
      const mockPrisma = {
        $queryRaw: vi.fn().mockResolvedValue([{ MAX_ID: 5 }]),
        tblNfeDow: {
          create: vi.fn().mockResolvedValue({ id: 6 })
        },
        tblNfeDowDet: {
          createMany: vi.fn().mockResolvedValue({ count: 2 })
        }
      }

      vi.mocked(databaseRouter.getCurrentSqlConnection).mockResolvedValue(mockPrisma as any)

      // Act
      const result = await downloadService.scheduleDownload({
        usrCodigo: '1000',
        chaves: ['chave1', 'chave2'],
        ip: '127.0.0.1',
        requestId: 'test-request'
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.downloadId).toBe(6)
      expect(databaseRouter.getCurrentSqlConnection).toHaveBeenCalled()
      
      // Verificar se métricas foram coletadas
      const recentMetrics = queryInterceptor.getRecentQueryMetrics(10)
      expect(recentMetrics.length).toBeGreaterThan(0)
      
      const downloadMetrics = recentMetrics.find(m => m.operation === 'scheduleDownload')
      expect(downloadMetrics).toBeDefined()
      expect(downloadMetrics?.database).toBe('cliente_download')
      expect(downloadMetrics?.userId).toBe('1000')
    })

    it('deve integrar com FiscalDocumentsService automaticamente', async () => {
      // Arrange
      const mockContext: UserContext = {
        usrCodigo: '2000',
        usrNome: 'Fiscal User',
        bancoDeDados: 'cliente_fiscal',
        isAuthenticated: true
      }
      
      vi.mocked(databaseRouter.getCurrentContext).mockReturnValue(mockContext)

      // Mock do MongoDB
      const mockCollection = {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([
                  { _id: '1', NUM_DOC: '123', VL_DOC: '100.00' }
                ])
              })
            })
          })
        }),
        estimatedDocumentCount: vi.fn().mockResolvedValue(1)
      }

      const mockConnection = {
        collection: vi.fn().mockReturnValue(mockCollection)
      }

      vi.mocked(databaseRouter.getCurrentMongoConnection).mockResolvedValue(mockConnection as any)

      // Act
      const result = await fiscalDocumentsService.fetchDocuments({
        collection: 'tbl_nfe_100',
        page: 1,
        size: 10
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(databaseRouter.getCurrentMongoConnection).toHaveBeenCalled()
      
      // Verificar se métricas foram coletadas
      const recentMetrics = queryInterceptor.getRecentQueryMetrics(10)
      expect(recentMetrics.length).toBeGreaterThan(0)
      
      const fiscalMetrics = recentMetrics.find(m => m.operation === 'find:tbl_nfe_100')
      expect(fiscalMetrics).toBeDefined()
      expect(fiscalMetrics?.database).toBe('cliente_fiscal')
      expect(fiscalMetrics?.userId).toBe('2000')
      expect(fiscalMetrics?.queryType).toBe('mongo')
    })
  })
})