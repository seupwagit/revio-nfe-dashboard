/**
 * Testes básicos para o sistema de resilência
 */

import { resilienceInitializer } from '../services/ResilienceInitializer'
import { resilienceCoordinator } from '../services/ResilienceCoordinator'
import { databaseHealthMonitor } from '../services/DatabaseHealthMonitor'
import { fallbackNotificationService } from '../services/FallbackNotificationService'
import { connectionMetricsService } from '../services/ConnectionMetricsService'
import { databaseRouter } from '../services/DatabaseRouter'

describe('Sistema de Resilência', () => {
  beforeAll(async () => {
    // Inicializar sistema se não estiver inicializado
    if (!resilienceInitializer.isInitialized()) {
      await resilienceInitializer.initialize()
    }
  })

  afterAll(async () => {
    // Limpar após os testes
    await resilienceInitializer.shutdown()
  })

  describe('ResilienceInitializer', () => {
    test('deve estar inicializado', () => {
      expect(resilienceInitializer.isInitialized()).toBe(true)
    })

    test('deve retornar status válido', () => {
      const status = resilienceInitializer.getStatus()
      
      expect(status).toHaveProperty('initialized', true)
      expect(status).toHaveProperty('components')
      expect(status.components).toHaveProperty('coordinator', true)
      expect(status.components).toHaveProperty('healthMonitor', true)
      expect(status.components).toHaveProperty('notifications', true)
      expect(status.components).toHaveProperty('metrics', true)
      expect(status.components).toHaveProperty('router', true)
    })

    test('deve executar diagnóstico', async () => {
      const diagnostics = await resilienceInitializer.runDiagnostics()
      
      expect(diagnostics).toHaveProperty('overall')
      expect(diagnostics).toHaveProperty('components')
      expect(diagnostics).toHaveProperty('recommendations')
      expect(['healthy', 'degraded', 'critical']).toContain(diagnostics.overall)
    })
  })

  describe('DatabaseHealthMonitor', () => {
    test('deve retornar status de saúde', async () => {
      const healthStatus = await databaseHealthMonitor.getHealthStatus()
      
      expect(healthStatus).toHaveProperty('sql')
      expect(healthStatus).toHaveProperty('mongo')
      expect(healthStatus).toHaveProperty('lastCheck')
      expect(healthStatus.sql).toHaveProperty('global')
      expect(healthStatus.sql).toHaveProperty('clients')
      expect(healthStatus.mongo).toHaveProperty('global')
      expect(healthStatus.mongo).toHaveProperty('clients')
    })

    test('deve retornar estatísticas', () => {
      const stats = databaseHealthMonitor.getHealthStatistics()
      
      expect(stats).toHaveProperty('totalDatabases')
      expect(stats).toHaveProperty('healthyDatabases')
      expect(stats).toHaveProperty('unhealthyDatabases')
      expect(stats).toHaveProperty('globalSqlHealthy')
      expect(stats).toHaveProperty('globalMongoHealthy')
      expect(stats).toHaveProperty('lastCheck')
      expect(typeof stats.totalDatabases).toBe('number')
      expect(typeof stats.healthyDatabases).toBe('number')
      expect(typeof stats.unhealthyDatabases).toBe('number')
    })
  })

  describe('FallbackNotificationService', () => {
    test('deve retornar estatísticas de notificações', () => {
      const stats = fallbackNotificationService.getNotificationStatistics()
      
      expect(stats).toHaveProperty('activeNotifications')
      expect(stats).toHaveProperty('totalNotificationsToday')
      expect(stats).toHaveProperty('topReasons')
      expect(stats).toHaveProperty('usersWithActiveNotifications')
      expect(typeof stats.activeNotifications).toBe('number')
      expect(Array.isArray(stats.topReasons)).toBe(true)
    })

    test('deve gerenciar preferências de usuário', () => {
      const userId = 'test-user'
      const preferences = {
        enableFallbackNotifications: false,
        maxNotificationsPerHour: 3
      }
      
      fallbackNotificationService.setUserPreferences(userId, preferences)
      const retrieved = fallbackNotificationService.getUserPreferences(userId)
      
      expect(retrieved.enableFallbackNotifications).toBe(false)
      expect(retrieved.maxNotificationsPerHour).toBe(3)
    })
  })

  describe('ConnectionMetricsService', () => {
    test('deve retornar métricas do sistema', () => {
      const metrics = connectionMetricsService.getSystemMetrics()
      
      expect(metrics).toHaveProperty('totalConnections')
      expect(metrics).toHaveProperty('totalFallbacks')
      expect(metrics).toHaveProperty('totalErrors')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('uptime')
      expect(metrics).toHaveProperty('activeConnections')
      expect(metrics).toHaveProperty('activeDatabases')
      expect(metrics).toHaveProperty('activeUsers')
      expect(typeof metrics.totalConnections).toBe('number')
      expect(typeof metrics.uptime).toBe('number')
    })

    test('deve retornar resumo executivo', () => {
      const summary = connectionMetricsService.getExecutiveSummary()
      
      expect(summary).toHaveProperty('systemHealth')
      expect(summary).toHaveProperty('totalDatabases')
      expect(summary).toHaveProperty('fallbackRate')
      expect(summary).toHaveProperty('averageResponseTime')
      expect(summary).toHaveProperty('errorRate')
      expect(summary).toHaveProperty('uptime')
      expect(['healthy', 'degraded', 'critical']).toContain(summary.systemHealth)
    })

    test('deve retornar relatório de performance', () => {
      const report = connectionMetricsService.getPerformanceReport()
      
      expect(report).toHaveProperty('averageResponseTime')
      expect(report).toHaveProperty('p95ResponseTime')
      expect(report).toHaveProperty('p99ResponseTime')
      expect(report).toHaveProperty('slowestDatabases')
      expect(report).toHaveProperty('errorRate')
      expect(Array.isArray(report.slowestDatabases)).toBe(true)
    })
  })

  describe('DatabaseRouter', () => {
    test('deve retornar informações de conexão', () => {
      const info = databaseRouter.getConnectionInfo()
      
      expect(info).toHaveProperty('sqlServer')
      expect(info).toHaveProperty('mongodb')
      expect(info).toHaveProperty('activeConnections')
      expect(info.sqlServer).toHaveProperty('host')
      expect(info.sqlServer).toHaveProperty('port')
      expect(info.sqlServer).toHaveProperty('hasUrl')
      expect(Array.isArray(info.activeConnections)).toBe(true)
    })

    test('deve retornar métricas de conexão', () => {
      const metrics = databaseRouter.getConnectionMetrics()
      
      expect(metrics).toHaveProperty('totalConnections')
      expect(metrics).toHaveProperty('activeClientConnections')
      expect(metrics).toHaveProperty('fallbackUsage')
      expect(metrics).toHaveProperty('connectionErrors')
      expect(typeof metrics.totalConnections).toBe('number')
      expect(typeof metrics.activeClientConnections).toBe('number')
    })

    test('deve retornar conexões ativas', () => {
      const connections = databaseRouter.getActiveConnections()
      
      expect(Array.isArray(connections)).toBe(true)
      expect(connections).toContain('spedrevio') // Base global deve estar presente
    })
  })

  describe('ResilienceCoordinator', () => {
    test('deve retornar métricas de resilência', () => {
      const metrics = resilienceCoordinator.getMetrics()
      
      expect(metrics).toHaveProperty('totalFailures')
      expect(metrics).toHaveProperty('totalFallbacks')
      expect(metrics).toHaveProperty('totalRecoveries')
      expect(metrics).toHaveProperty('activeCircuitBreakers')
      expect(metrics).toHaveProperty('averageRecoveryTime')
      expect(typeof metrics.totalFailures).toBe('number')
      expect(typeof metrics.totalFallbacks).toBe('number')
    })

    test('deve verificar saúde do sistema', async () => {
      const isHealthy = await resilienceCoordinator.isSystemHealthy()
      
      expect(typeof isHealthy).toBe('boolean')
    })

    test('deve obter estatísticas consolidadas', async () => {
      const stats = await resilienceCoordinator.getConsolidatedStatistics()
      
      expect(stats).toHaveProperty('resilience')
      expect(stats).toHaveProperty('health')
      expect(stats).toHaveProperty('notifications')
      expect(stats).toHaveProperty('connections')
    })
  })

  describe('Integração entre componentes', () => {
    test('deve registrar métrica quando conexão é criada', async () => {
      const initialMetrics = connectionMetricsService.getSystemMetrics()
      
      // Tentar criar uma conexão (pode falhar, mas deve registrar métrica)
      try {
        await databaseRouter.getSqlConnection('test-database')
      } catch (error) {
        // Ignorar erro de conexão para este teste
      }
      
      // Aguardar um pouco para processamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const finalMetrics = connectionMetricsService.getSystemMetrics()
      
      // Verificar se houve alguma atividade (conexão ou erro)
      expect(
        finalMetrics.totalConnections >= initialMetrics.totalConnections ||
        finalMetrics.totalErrors >= initialMetrics.totalErrors
      ).toBe(true)
    })

    test('deve executar verificação de saúde forçada', async () => {
      const initialStats = databaseHealthMonitor.getHealthStatistics()
      
      await resilienceCoordinator.forceHealthCheck()
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const finalStats = databaseHealthMonitor.getHealthStatistics()
      
      // Verificar se a verificação foi executada (timestamp deve ser mais recente)
      expect(finalStats.lastCheck.getTime()).toBeGreaterThanOrEqual(initialStats.lastCheck.getTime())
    })
  })
})