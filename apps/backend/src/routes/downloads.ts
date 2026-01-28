/**
 * Download Routes - Rotas de Downloads
 * 
 * Rotas para agendar downloads, verificar status e gerenciar downloads
 */

import { Response, Router } from 'express'
import { AuthenticatedRequest } from '../middleware/AuthMiddleware'
import { apiLogger } from '../services/APILogger'
import { downloadService } from '../services/DownloadService'

const router = Router()

// Note: authMiddleware is now handled by userContextMiddleware in the main app
// All routes here automatically have user context and database routing

/**
 * POST /api/downloads/schedule
 * Agenda um novo download com array de chaves
 */
router.post('/schedule', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    const { chaves } = req.body

    // Validar campos obrigatórios
    if (!chaves || !Array.isArray(chaves) || chaves.length === 0) {
      await apiLogger.logError(ip, '/api/downloads/schedule', 'Array de chaves não fornecido ou vazio')
      return res.status(400).json({
        success: false,
        error: 'Array de chaves é obrigatório e não pode estar vazio',
        code: 'MISSING_CHAVES'
      })
    }

    // Validar se todas as chaves são strings válidas
    const invalidChaves = chaves.filter((chave: any) => 
      typeof chave !== 'string' || !chave.trim()
    )

    if (invalidChaves.length > 0) {
      await apiLogger.logError(ip, '/api/downloads/schedule', `Chaves inválidas encontradas: ${invalidChaves.length}`)
      return res.status(400).json({
        success: false,
        error: 'Algumas chaves possuem formato inválido (devem ser strings não vazias)',
        code: 'INVALID_CHAVES'
      })
    }

    // Limitar quantidade de chaves por requisição
    if (chaves.length > 1000) {
      await apiLogger.logError(ip, '/api/downloads/schedule', `Muitas chaves: ${chaves.length}`)
      return res.status(400).json({
        success: false,
        error: 'Máximo de 1000 chaves por download',
        code: 'TOO_MANY_CHAVES'
      })
    }

    // Agendar download
    const result = await downloadService.scheduleDownload({
      usrCodigo: req.user.usrCodigo,
      chaves: chaves,
      ip: ip,
      requestId: req.requestId
    })

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao agendar download',
        code: 'SCHEDULE_ERROR'
      })
    }

    return res.json({
      success: true,
      data: {
        downloadId: result.downloadId,
        totalChaves: chaves.length,
        message: 'Download agendado com sucesso'
      }
    })

  } catch (error) {
    console.error('Erro ao agendar download:', error)
    await apiLogger.logError(ip, '/api/downloads/schedule', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /api/downloads/status/:usrCodigo
 * Consulta status de downloads do usuário
 */
router.get('/status/:usrCodigo', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    const { usrCodigo } = req.params

    // Verificar se o usuário pode consultar este código
    if (req.user.usrCodigo !== usrCodigo && !req.user.isAdmin) {
      await apiLogger.logError(ip, `/api/downloads/status/${usrCodigo}`, 'Tentativa de acesso não autorizado')
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
        code: 'ACCESS_DENIED'
      })
    }

    const result = await downloadService.getDownloadStatus(usrCodigo, req.requestId)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao consultar status',
        code: 'STATUS_ERROR'
      })
    }

    return res.json({
      success: true,
      data: {
        downloads: result.downloads || []
      }
    })

  } catch (error) {
    console.error('Erro ao consultar status:', error)
    await apiLogger.logError(ip, `/api/downloads/status/${req.params.usrCodigo}`, `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /api/downloads/ready
 * Verifica downloads prontos para o usuário autenticado
 */
router.get('/ready', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    const result = await downloadService.checkReadyDownloads(req.user.usrCodigo, req.requestId)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao verificar downloads prontos',
        code: 'READY_CHECK_ERROR'
      })
    }

    return res.json({
      success: true,
      data: {
        readyDownloads: result.readyDownloads || []
      }
    })

  } catch (error) {
    console.error('Erro ao verificar downloads prontos:', error)
    await apiLogger.logError(ip, '/api/downloads/ready', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * PUT /api/downloads/:id/started
 * Marca download como iniciado (STATUS = '3')
 */
router.put('/:id/started', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    const downloadId = parseInt(req.params.id)

    if (isNaN(downloadId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do download inválido',
        code: 'INVALID_ID'
      })
    }

    const result = await downloadService.markDownloadStarted(downloadId, req.user.usrCodigo, req.requestId)

    if (!result.success) {
      if (result.error?.includes('não encontrado') || result.error?.includes('não pertence')) {
        return res.status(404).json({
          success: false,
          error: result.error,
          code: 'DOWNLOAD_NOT_FOUND'
        })
      }

      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao marcar download como iniciado',
        code: 'UPDATE_ERROR'
      })
    }

    await apiLogger.logSuccess(ip, `/api/downloads/${downloadId}/started`, 'Download marcado como iniciado')

    return res.json({
      success: true,
      data: {
        message: 'Download marcado como iniciado'
      }
    })

  } catch (error) {
    console.error('Erro ao marcar download como iniciado:', error)
    await apiLogger.logError(ip, `/api/downloads/${req.params.id}/started`, `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * DELETE /api/downloads/cleanup
 * Limpa downloads antigos (apenas admin)
 */
router.delete('/cleanup', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    if (!req.user.isAdmin) {
      await apiLogger.logError(ip, '/api/downloads/cleanup', 'Tentativa de acesso não autorizado')
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - apenas administradores',
        code: 'ADMIN_REQUIRED'
      })
    }

    const result = await downloadService.cleanupOldDownloads(req.requestId)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao limpar downloads antigos',
        code: 'CLEANUP_ERROR'
      })
    }

    await apiLogger.logSuccess(ip, '/api/downloads/cleanup', `Downloads limpos: ${result.cleaned}`)

    return res.json({
      success: true,
      data: {
        cleaned: result.cleaned,
        message: `${result.cleaned} downloads antigos foram removidos`
      }
    })

  } catch (error) {
    console.error('Erro ao limpar downloads:', error)
    await apiLogger.logError(ip, '/api/downloads/cleanup', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /api/downloads/diagnostics
 * Obtém diagnóstico da base de dados atual (para debug)
 */
router.get('/diagnostics', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    if (!req.user.isAdmin) {
      await apiLogger.logError(ip, '/api/downloads/diagnostics', 'Tentativa de acesso não autorizado')
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - apenas administradores',
        code: 'ADMIN_REQUIRED'
      })
    }

    const diagnostics = await downloadService.getDatabaseDiagnostics()

    return res.json({
      success: true,
      data: {
        diagnostics,
        currentDatabase: downloadService.getCurrentDatabase()
      }
    })

  } catch (error) {
    console.error('Erro ao obter diagnósticos:', error)
    await apiLogger.logError(ip, '/api/downloads/diagnostics', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * POST /api/downloads/schedule-context
 * Agenda download usando contexto automático (demonstração)
 */
router.post('/schedule-context', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    const { chaves } = req.body

    // Validar campos obrigatórios
    if (!chaves || !Array.isArray(chaves) || chaves.length === 0) {
      await apiLogger.logError(ip, '/api/downloads/schedule-context', 'Array de chaves não fornecido ou vazio')
      return res.status(400).json({
        success: false,
        error: 'Array de chaves é obrigatório e não pode estar vazio',
        code: 'MISSING_CHAVES'
      })
    }

    // Usar método context-aware
    const result = await downloadService.scheduleDownloadWithContext(chaves, ip, req.requestId)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao agendar download',
        code: 'SCHEDULE_ERROR'
      })
    }

    return res.json({
      success: true,
      data: {
        downloadId: result.downloadId,
        totalChaves: chaves.length,
        message: 'Download agendado com contexto automático',
        database: downloadService.getCurrentDatabase()
      }
    })

  } catch (error) {
    console.error('Erro ao agendar download com contexto:', error)
    await apiLogger.logError(ip, '/api/downloads/schedule-context', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /api/downloads/my-status
 * Consulta status de downloads do usuário atual (usando contexto)
 */
router.get('/my-status', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    // Usar método context-aware
    const result = await downloadService.getMyDownloadStatus(req.requestId)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao consultar status',
        code: 'STATUS_ERROR'
      })
    }

    return res.json({
      success: true,
      data: {
        downloads: result.downloads || [],
        database: downloadService.getCurrentDatabase()
      }
    })

  } catch (error) {
    console.error('Erro ao consultar meu status:', error)
    await apiLogger.logError(ip, '/api/downloads/my-status', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

export default router