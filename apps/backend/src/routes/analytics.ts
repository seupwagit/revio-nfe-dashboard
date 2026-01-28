/**
 * Analytics Routes
 * 
 * Endpoints para agregações e analytics usando MongoDB
 * Usa roteamento automático baseado no contexto do usuário
 */

import { Router, Response } from 'express'
import { AuthenticatedRequest } from '../middleware/AuthMiddleware'
import { analyticsService } from '../services/AnalyticsService'

const router = Router()

// Note: authMiddleware is now handled by userContextMiddleware in the main app
// All routes here automatically have user context and database routing

// POST /api/analytics/aggregate
router.post('/aggregate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest } = req.body
    
    console.log('📊 Requisição Analytics recebida:', { 
      collection, 
      dtIni,
      dtFin,
      cnpjEmit, 
      cnpjDest,
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userContext?.bancoDeDados || 'global'
    })
    
    // Usar o serviço de analytics
    const result = await analyticsService.fetchAnalyticsAggregation({
      collection,
      dtIni,
      dtFin,
      cnpjEmit,
      cnpjDest
    })
    
    res.json(result)
    
  } catch (error: any) {
    console.error('❌ Erro na rota analytics:', error.message)
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name,
      errorCode: error.code
    })
  }
})

export default router