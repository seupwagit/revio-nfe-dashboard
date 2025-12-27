/**
 * Auth Routes - Rotas de Autenticação
 * 
 * Rotas para login, logout e verificação de autenticação
 */

import { Router, Request, Response } from 'express'
import { authService } from '../services/AuthService'
import { tokenManager } from '../services/TokenManager'
import { apiLogger } from '../services/APILogger'
import { authMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware'
import { contextCleanupHandler } from '../services/ContextCleanupHandler'

const router = Router()

/**
 * POST /api/auth/login
 * Autentica usuário e retorna token JWT
 */
router.post('/login', async (req: Request, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    const { username, password } = req.body

    // Validar campos obrigatórios
    if (!username || !password) {
      await apiLogger.logError(ip, '/api/auth/login', 'Campos obrigatórios não fornecidos')
      return res.status(400).json({
        success: false,
        error: 'Usuário e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      })
    }

    // Validar campos não vazios
    if (username.trim() === '' || password.trim() === '') {
      await apiLogger.logError(ip, '/api/auth/login', 'Campos vazios fornecidos')
      return res.status(400).json({
        success: false,
        error: 'Usuário e senha não podem estar vazios',
        code: 'EMPTY_FIELDS'
      })
    }

    // Autenticar usuário
    const authResult = await authService.authenticate(username.trim(), password)

    if (!authResult.success || !authResult.user) {
      await apiLogger.logLogin(ip, username, false)
      return res.status(401).json({
        success: false,
        error: authResult.error || 'Credenciais inválidas',
        code: authResult.errorCode || 'INVALID_CREDENTIALS'
      })
    }

    // Gerar token JWT
    const token = tokenManager.generateToken(authResult.user)

    // Log de sucesso
    await apiLogger.logLogin(ip, username, true, parseInt(authResult.user.usrCodigo))

    return res.json({
      success: true,
      data: {
        token,
        user: authResult.user
      }
    })

  } catch (error) {
    console.error('Erro no login:', error)
    await apiLogger.logError(ip, '/api/auth/login', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * POST /api/auth/logout
 * Realiza logout do usuário com limpeza completa de contexto
 */
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    if (req.user) {
      // Log do logout
      await apiLogger.logLogout(ip, parseInt(req.user.usrCodigo), req.requestId)

      // Limpar contexto do usuário
      await contextCleanupHandler.handleLogout(
        req.user.usrCodigo,
        req.user.usrNome,
        req.user.bancoDeDados,
        req.requestId
      )
    }

    return res.json({
      success: true,
      message: 'Logout realizado com sucesso - contexto limpo'
    })
  } catch (error) {
    console.error('Erro no logout:', error)
    await apiLogger.logError(ip, '/api/auth/logout', `Erro interno: ${error}`, req.user ? parseInt(req.user.usrCodigo) : undefined, req.requestId)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    const userData = {
      usrCodigo: req.user.usrCodigo,
      usrNome: req.user.usrNome,
      usrLogin: req.user.usrLogin,
      bancoDeDados: req.user.bancoDeDados,
      isAdmin: req.user.isAdmin,
      empresa: req.user.empresa,
      cnpj: req.user.cnpj
    }

    return res.json({
      success: true,
      data: {
        user: userData
      }
    })
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error)
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    await apiLogger.logError(ip, '/api/auth/me', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * POST /api/auth/verify
 * Verifica se um token é válido
 */
router.post('/verify', async (req: Request, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    const { token } = req.body

    if (!token) {
      await apiLogger.logError(ip, '/api/auth/verify', 'Token não fornecido')
      return res.status(400).json({
        success: false,
        error: 'Token é obrigatório',
        code: 'MISSING_TOKEN'
      })
    }

    const validation = tokenManager.validateToken(token)

    if (!validation.valid) {
      await apiLogger.logError(ip, '/api/auth/verify', `Token inválido: ${validation.error}`)
      return res.status(401).json({
        success: false,
        error: validation.error || 'Token inválido',
        code: validation.errorCode || 'INVALID_TOKEN'
      })
    }

    return res.json({
      success: true,
      data: {
        valid: true,
        payload: validation.payload
      }
    })
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    await apiLogger.logError(ip, '/api/auth/verify', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

/**
 * POST /api/auth/refresh
 * Renova token se estiver próximo do vencimento
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token é obrigatório',
        code: 'MISSING_TOKEN'
      })
    }

    const newToken = tokenManager.refreshTokenIfNeeded(token)

    if (newToken) {
      await apiLogger.logSuccess(ip, '/api/auth/refresh', 'Token renovado com sucesso')
      return res.json({
        success: true,
        data: {
          token: newToken,
          refreshed: true
        }
      })
    } else {
      return res.json({
        success: true,
        data: {
          token: token,
          refreshed: false
        }
      })
    }
  } catch (error) {
    console.error('Erro ao renovar token:', error)
    await apiLogger.logError(ip, '/api/auth/refresh', `Erro interno: ${error}`)
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
})

export default router