/**
 * Security Routes - Rotas de Monitoramento de Segurança
 * 
 * Rotas para monitoramento de isolamento de dados e eventos de segurança
 */

import { Router, Response } from 'express'
import { AuthenticatedRequest, adminMiddleware } from '../middleware/AuthMiddleware'
import { securityMonitoringService } from '../services/SecurityMonitoringService'
import { dataAccessValidator } from '../services/DataAccessValidator'
import { crossAccessBlocker } from '../services/CrossAccessBlocker'
import { securityEventLogger } from '../services/SecurityEventLogger'
import { contextCleanupHandler } from '../services/ContextCleanupHandler'
import { userContextManager } from '../services/UserContextManager'
import { apiLogger } from '../services/APILogger'

const router = Router()

/**
 * GET /api/security/overview
 * Obtém visão geral da segurança do sistema
 */
router.get('/overview', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await securityMonitoringService.getSecurityOverview()
    
    // Log da consulta administrativa
    await apiLogger.logAdminAction(
      req.ip || 'unknown',
      req.path,
      'Consulta de visão geral de segurança',
      parseInt(req.user!.usrCodigo),
      req.requestId
    )

    res.json({
      success: true,
      data: overview
    })

  } catch (error) {
    console.error('Erro ao obter visão geral de segurança:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter visão geral: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'SECURITY_OVERVIEW_ERROR'
    })
  }
})

/**
 * GET /api/security/alerts
 * Obtém alertas de segurança ativos
 */
router.get('/alerts', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { severity } = req.query
    const alerts = securityMonitoringService.getActiveAlerts(
      severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined
    )

    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length
      }
    })

  } catch (error) {
    console.error('Erro ao obter alertas de segurança:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter alertas: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'SECURITY_ALERTS_ERROR'
    })
  }
})

/**
 * POST /api/security/alerts/:alertId/resolve
 * Resolve um alerta de segurança
 */
router.post('/alerts/:alertId/resolve', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { alertId } = req.params
    const resolved = securityMonitoringService.resolveSecurityAlert(alertId, req.user!.usrNome)

    if (resolved) {
      await apiLogger.logAdminAction(
        req.ip || 'unknown',
        req.path,
        `Alerta de segurança resolvido: ${alertId}`,
        parseInt(req.user!.usrCodigo),
        req.requestId
      )

      res.json({
        success: true,
        message: 'Alerta resolvido com sucesso'
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Alerta não encontrado',
        code: 'ALERT_NOT_FOUND'
      })
    }

  } catch (error) {
    console.error('Erro ao resolver alerta:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao resolver alerta: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'RESOLVE_ALERT_ERROR'
    })
  }
})

/**
 * POST /api/security/check
 * Executa verificação completa de segurança
 */
router.post('/check', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const securityCheck = await securityMonitoringService.performSecurityCheck()

    await apiLogger.logAdminAction(
      req.ip || 'unknown',
      req.path,
      `Verificação de segurança executada - Status: ${securityCheck.passed ? 'PASSOU' : 'FALHOU'}`,
      parseInt(req.user!.usrCodigo),
      req.requestId
    )

    res.json({
      success: true,
      data: securityCheck
    })

  } catch (error) {
    console.error('Erro na verificação de segurança:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro na verificação: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'SECURITY_CHECK_ERROR'
    })
  }
})

/**
 * GET /api/security/isolation/stats
 * Obtém estatísticas de isolamento de usuários
 */
router.get('/isolation/stats', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isolationStats = userContextManager.getIsolationStats()
    const isolationValidation = userContextManager.validateUserIsolation()

    res.json({
      success: true,
      data: {
        stats: isolationStats,
        validation: isolationValidation
      }
    })

  } catch (error) {
    console.error('Erro ao obter estatísticas de isolamento:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter estatísticas: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'ISOLATION_STATS_ERROR'
    })
  }
})

/**
 * GET /api/security/blocking/stats
 * Obtém estatísticas de bloqueio de acesso
 */
router.get('/blocking/stats', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blockingStats = crossAccessBlocker.getBlockingStats()
    const blockingRules = crossAccessBlocker.getBlockingRules()

    res.json({
      success: true,
      data: {
        stats: blockingStats,
        rules: blockingRules
      }
    })

  } catch (error) {
    console.error('Erro ao obter estatísticas de bloqueio:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter estatísticas: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'BLOCKING_STATS_ERROR'
    })
  }
})

/**
 * GET /api/security/events
 * Obtém eventos de segurança recentes
 */
router.get('/events', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hours = '24' } = req.query
    const hoursNum = parseInt(hours as string)
    
    const securityStats = securityEventLogger.getSecurityStats()
    const criticalEvents = securityEventLogger.getCriticalEvents(hoursNum)

    res.json({
      success: true,
      data: {
        stats: securityStats,
        criticalEvents,
        timeframe: `${hoursNum} horas`
      }
    })

  } catch (error) {
    console.error('Erro ao obter eventos de segurança:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter eventos: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'SECURITY_EVENTS_ERROR'
    })
  }
})

/**
 * GET /api/security/cleanup/stats
 * Obtém estatísticas de limpeza de contexto
 */
router.get('/cleanup/stats', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cleanupStats = contextCleanupHandler.getCleanupStats()
    const recentCleanups = contextCleanupHandler.getCleanupHistory(24)

    res.json({
      success: true,
      data: {
        stats: cleanupStats,
        recentCleanups
      }
    })

  } catch (error) {
    console.error('Erro ao obter estatísticas de limpeza:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter estatísticas: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'CLEANUP_STATS_ERROR'
    })
  }
})

/**
 * POST /api/security/cleanup/force
 * Força limpeza completa de contextos
 */
router.post('/cleanup/force', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason = 'Limpeza forçada via API administrativa' } = req.body
    
    const cleanupEvent = await contextCleanupHandler.forceCompleteCleanup(
      `${reason} (por ${req.user!.usrNome})`
    )

    await apiLogger.logAdminAction(
      req.ip || 'unknown',
      req.path,
      `Limpeza forçada executada - ${cleanupEvent.contextsCleared} contextos limpos`,
      parseInt(req.user!.usrCodigo),
      req.requestId
    )

    res.json({
      success: true,
      data: cleanupEvent
    })

  } catch (error) {
    console.error('Erro na limpeza forçada:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro na limpeza forçada: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'FORCE_CLEANUP_ERROR'
    })
  }
})

/**
 * POST /api/security/cleanup/user/:userId
 * Limpa contextos de um usuário específico
 */
router.post('/cleanup/user/:userId', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { reason = 'Limpeza de usuário via API administrativa' } = req.body
    
    const cleanupEvent = await contextCleanupHandler.cleanupUserContexts(
      userId,
      `${reason} (por ${req.user!.usrNome})`
    )

    await apiLogger.logAdminAction(
      req.ip || 'unknown',
      req.path,
      `Limpeza de usuário ${userId} executada - ${cleanupEvent.contextsCleared} contextos limpos`,
      parseInt(req.user!.usrCodigo),
      req.requestId
    )

    res.json({
      success: true,
      data: cleanupEvent
    })

  } catch (error) {
    console.error('Erro na limpeza de usuário:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro na limpeza de usuário: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'USER_CLEANUP_ERROR'
    })
  }
})

/**
 * GET /api/security/metrics
 * Obtém métricas de segurança do sistema
 */
router.get('/metrics', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = securityMonitoringService.getSecurityMetrics()

    res.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('Erro ao obter métricas de segurança:', error)
    await apiLogger.logError(
      req.ip || 'unknown',
      req.path,
      `Erro ao obter métricas: ${error}`,
      req.user ? parseInt(req.user.usrCodigo) : undefined,
      req.requestId
    )
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'SECURITY_METRICS_ERROR'
    })
  }
})

export default router