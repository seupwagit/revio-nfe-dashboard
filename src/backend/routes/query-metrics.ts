/**
 * Rotas para métricas de consultas e diagnóstico de roteamento
 * 
 * Fornece endpoints para monitoramento do direcionamento automático de consultas
 */

import { Router, Request, Response } from 'express'
import { queryInterceptor } from '../services/QueryInterceptor'
import { databaseRouter } from '../services/DatabaseRouter'
import { authMiddleware } from '../middleware/AuthMiddleware'
import { userContextMiddleware } from '../middleware/UserContextMiddleware'
import { apiLogger } from '../services/APILogger'

const router = Router()

/**
 * GET /api/query-metrics/stats
 * Obtém estatísticas de uso por base de dados
 */
router.get('/stats', authMiddleware, userContextMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = queryInterceptor.getDatabaseUsageStats()
    const report = queryInterceptor.getAutomaticRoutingReport()
    
    // Converter Map para objeto para serialização JSON
    const statsObject: Record<string, any> = {}
    for (const [database, stat] of stats) {
      statsObject[database] = stat
    }

    await apiLogger.logSuccess(
      req.ip || 'unknown',
      req.path,
      'Consulta de métricas de query realizada',
      req.user?.usrCodigo
    )

    res.json({
      success: true,
      data: {
        databaseStats: statsObject,
        routingReport: report,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[QueryMetrics] Erro ao obter estatísticas:', error)
    
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter métricas: ${error instanceof Error ? error.message : String(error)}`,
      req.user?.usrCodigo
    )

    res.status(500).json({
      success: false,
      error: 'Erro interno ao obter métricas de consultas'
    })
  }
})

/**
 * GET /api/query-metrics/recent
 * Obtém métricas recentes de consultas
 */
router.get('/recent', authMiddleware, userContextMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100
    const recentMetrics = queryInterceptor.getRecentQueryMetrics(limit)

    await apiLogger.logSuccess(
      req.ip || 'unknown',
      req.path,
      `Consulta de métricas recentes realizada (limit: ${limit})`,
      req.user?.usrCodigo
    )

    res.json({
      success: true,
      data: {
        metrics: recentMetrics,
        count: recentMetrics.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[QueryMetrics] Erro ao obter métricas recentes:', error)
    
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter métricas recentes: ${error instanceof Error ? error.message : String(error)}`,
      req.user?.usrCodigo
    )

    res.status(500).json({
      success: false,
      error: 'Erro interno ao obter métricas recentes'
    })
  }
})

/**
 * GET /api/query-metrics/leakage-detection
 * Verifica vazamentos entre bases de clientes
 */
router.get('/leakage-detection', authMiddleware, userContextMiddleware, async (req: Request, res: Response) => {
  try {
    const leakageReport = queryInterceptor.detectDataLeakage()

    await apiLogger.logSuccess(
      req.ip || 'unknown',
      req.path,
      `Detecção de vazamentos realizada - ${leakageReport.hasLeakage ? 'VAZAMENTOS DETECTADOS' : 'Nenhum vazamento'}`,
      req.user?.usrCodigo
    )

    // Se houver vazamentos, registrar como evento de segurança
    if (leakageReport.hasLeakage) {
      await apiLogger.logError(
        req.ip || 'unknown',
        req.path,
        `ALERTA DE SEGURANÇA: Vazamentos detectados entre bases de clientes`,
        req.user?.usrCodigo,
        undefined,
        {
          suspiciousActivities: leakageReport.suspiciousActivities,
          securityAlert: true
        }
      )
    }

    res.json({
      success: true,
      data: leakageReport,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[QueryMetrics] Erro na detecção de vazamentos:', error)
    
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro na detecção de vazamentos: ${error instanceof Error ? error.message : String(error)}`,
      req.user?.usrCodigo
    )

    res.status(500).json({
      success: false,
      error: 'Erro interno na detecção de vazamentos'
    })
  }
})

/**
 * GET /api/query-metrics/routing-diagnostics
 * Obtém diagnósticos de roteamento de base de dados
 */
router.get('/routing-diagnostics', authMiddleware, userContextMiddleware, async (req: Request, res: Response) => {
  try {
    const diagnostics = databaseRouter.getTransparencyDiagnostics()
    const connectionInfo = databaseRouter.getConnectionInfo()
    const connectionMetrics = databaseRouter.getConnectionMetrics()

    await apiLogger.logSuccess(
      req.ip || 'unknown',
      req.path,
      'Diagnóstico de roteamento realizado',
      req.user?.usrCodigo
    )

    res.json({
      success: true,
      data: {
        transparency: diagnostics,
        connections: connectionInfo,
        metrics: connectionMetrics,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[QueryMetrics] Erro no diagnóstico de roteamento:', error)
    
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro no diagnóstico: ${error instanceof Error ? error.message : String(error)}`,
      req.user?.usrCodigo
    )

    res.status(500).json({
      success: false,
      error: 'Erro interno no diagnóstico de roteamento'
    })
  }
})

/**
 * POST /api/query-metrics/cleanup
 * Limpa métricas antigas
 */
router.post('/cleanup', authMiddleware, userContextMiddleware, async (req: Request, res: Response) => {
  try {
    const { olderThanHours = 24 } = req.body
    
    queryInterceptor.cleanupOldMetrics(olderThanHours)

    await apiLogger.logSuccess(
      req.ip || 'unknown',
      req.path,
      `Limpeza de métricas realizada (${olderThanHours}h)`,
      req.user?.usrCodigo
    )

    res.json({
      success: true,
      message: `Métricas antigas (>${olderThanHours}h) foram limpas`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[QueryMetrics] Erro na limpeza de métricas:', error)
    
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro na limpeza: ${error instanceof Error ? error.message : String(error)}`,
      req.user?.usrCodigo
    )

    res.status(500).json({
      success: false,
      error: 'Erro interno na limpeza de métricas'
    })
  }
})

/**
 * GET /api/query-metrics/health
 * Endpoint de saúde para monitoramento
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const report = queryInterceptor.getAutomaticRoutingReport()
    const diagnostics = databaseRouter.getTransparencyDiagnostics()
    
    const isHealthy = report.routingEfficiency > 95 && !diagnostics.isUsingFallback
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      healthy: isHealthy,
      data: {
        routingEfficiency: report.routingEfficiency,
        totalQueries: report.totalQueries,
        fallbackUsage: report.fallbackUsage,
        isUsingFallback: diagnostics.isUsingFallback,
        activeConnections: diagnostics.activeConnections
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[QueryMetrics] Erro no health check:', error)
    
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'Erro interno no health check'
    })
  }
})

export default router