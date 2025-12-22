/**
 * Rotas para monitoramento e controle do sistema de resilência
 */

import { Router, Request, Response } from 'express'
import { resilienceInitializer } from '../services/ResilienceInitializer'
import { resilienceCoordinator } from '../services/ResilienceCoordinator'
import { databaseHealthMonitor } from '../services/DatabaseHealthMonitor'
import { fallbackNotificationService } from '../services/FallbackNotificationService'
import { connectionMetricsService } from '../services/ConnectionMetricsService'
import { databaseRouter } from '../services/DatabaseRouter'
import { apiLogger } from '../services/APILogger'

const router = Router()

/**
 * GET /api/resilience/status
 * Obtém status geral do sistema de resilência
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await resilienceInitializer.getStatistics()
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro ao obter status:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * GET /api/resilience/health
 * Obtém status de saúde das bases de dados
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await databaseHealthMonitor.getHealthStatus()
    const healthStats = databaseHealthMonitor.getHealthStatistics()
    
    res.json({
      success: true,
      data: {
        status: healthStatus,
        statistics: healthStats,
        isSystemHealthy: await resilienceCoordinator.isSystemHealthy()
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro ao obter saúde:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * GET /api/resilience/metrics
 * Obtém métricas de conexão e performance
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const systemMetrics = connectionMetricsService.getSystemMetrics()
    const performanceReport = connectionMetricsService.getPerformanceReport()
    const fallbackReport = connectionMetricsService.getFallbackReport()
    const executiveSummary = connectionMetricsService.getExecutiveSummary()
    
    res.json({
      success: true,
      data: {
        system: systemMetrics,
        performance: performanceReport,
        fallbacks: fallbackReport,
        summary: executiveSummary
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro ao obter métricas:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * GET /api/resilience/notifications
 * Obtém notificações de fallback para o usuário atual
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    // Obter usuário do contexto (implementar quando middleware estiver ativo)
    const userId = 'system' // Placeholder
    
    const activeNotifications = fallbackNotificationService.getActiveNotifications(userId)
    const notificationStats = fallbackNotificationService.getNotificationStatistics()
    
    res.json({
      success: true,
      data: {
        active: activeNotifications,
        statistics: notificationStats
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro ao obter notificações:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * POST /api/resilience/notifications/:database/dismiss
 * Descarta uma notificação específica
 */
router.post('/notifications/:database/dismiss', async (req: Request, res: Response) => {
  try {
    const { database } = req.params
    const userId = 'system' // Placeholder
    
    const dismissed = fallbackNotificationService.dismissNotification(userId, database)
    
    if (dismissed) {
      await apiLogger.logSuccess(
        'system',
        '/resilience/notifications/dismiss',
        `Notification dismissed for database: ${database}`
      )
    }
    
    res.json({
      success: true,
      data: { dismissed },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro ao descartar notificação:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * POST /api/resilience/health/check
 * Força verificação de saúde
 */
router.post('/health/check', async (req: Request, res: Response) => {
  try {
    await resilienceCoordinator.forceHealthCheck()
    
    // Aguardar um pouco para os resultados
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const healthStatus = await databaseHealthMonitor.getHealthStatus()
    
    await apiLogger.logSuccess(
      'system',
      '/resilience/health/check',
      'Forced health check completed'
    )
    
    res.json({
      success: true,
      data: healthStatus,
      message: 'Verificação de saúde executada',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro na verificação forçada:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * GET /api/resilience/diagnostics
 * Executa diagnóstico completo do sistema
 */
router.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    const diagnostics = await resilienceInitializer.runDiagnostics()
    
    res.json({
      success: true,
      data: diagnostics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro no diagnóstico:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * GET /api/resilience/connections
 * Obtém informações sobre conexões ativas
 */
router.get('/connections', async (req: Request, res: Response) => {
  try {
    const connectionInfo = databaseRouter.getConnectionInfo()
    const connectionMetrics = databaseRouter.getConnectionMetrics()
    const activeConnections = databaseRouter.getActiveConnections()
    
    res.json({
      success: true,
      data: {
        info: connectionInfo,
        metrics: connectionMetrics,
        active: activeConnections
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro ao obter conexões:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * POST /api/resilience/initialize
 * Inicializa o sistema de resilência
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    if (resilienceInitializer.isInitialized()) {
      return res.json({
        success: true,
        message: 'Sistema já inicializado',
        data: resilienceInitializer.getStatus(),
        timestamp: new Date().toISOString()
      })
    }

    await resilienceInitializer.initialize()
    
    await apiLogger.logSuccess(
      'system',
      '/resilience/initialize',
      'Resilience system initialized via API'
    )
    
    res.json({
      success: true,
      message: 'Sistema de resilência inicializado',
      data: resilienceInitializer.getStatus(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro na inicialização:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

/**
 * POST /api/resilience/reinitialize
 * Reinicializa o sistema de resilência
 */
router.post('/reinitialize', async (req: Request, res: Response) => {
  try {
    await resilienceInitializer.reinitialize()
    
    await apiLogger.logSuccess(
      'system',
      '/resilience/reinitialize',
      'Resilience system reinitialized via API'
    )
    
    res.json({
      success: true,
      message: 'Sistema de resilência reinicializado',
      data: resilienceInitializer.getStatus(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ResilienceAPI] Erro na reinicialização:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

export default router