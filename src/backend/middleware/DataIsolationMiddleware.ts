/**
 * DataIsolationMiddleware - Middleware de Isolamento de Dados
 * 
 * Middleware que integra todos os componentes de isolamento de dados
 * para garantir segurança completa entre clientes
 */

import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './UserContextMiddleware'
import { dataAccessValidator } from '../services/DataAccessValidator'
import { crossAccessBlocker } from '../services/CrossAccessBlocker'
import { securityEventLogger } from '../services/SecurityEventLogger'
import { contextCleanupHandler } from '../services/ContextCleanupHandler'
import { userContextManager } from '../services/UserContextManager'
import { tokenManager } from '../services/TokenManager'

export interface IsolatedRequest extends AuthenticatedRequest {
  dataAccess?: {
    validated: boolean
    allowedDatabase: string
    securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
}

export class DataIsolationMiddleware {
  /**
   * Middleware principal de isolamento de dados
   */
  static enforceDataIsolation = async (req: IsolatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Pular validação para rotas de autenticação
      if (req.path.includes('/auth/') || req.path.includes('/login') || req.path.includes('/logout')) {
        return next()
      }

      // Verificar se há contexto de usuário
      if (!req.userContext || !req.requestId) {
        await securityEventLogger.logUnauthorizedAccess(
          req.requestId || 'unknown',
          req.method,
          'api',
          'Contexto de usuário não encontrado'
        )

        res.status(401).json({
          success: false,
          error: 'Acesso não autorizado - contexto inválido',
          code: 'INVALID_CONTEXT'
        })
        return
      }

      const userContext = req.userContext
      const requestedDatabase = userContext.bancoDeDados

      // Validar acesso aos dados
      const accessValidation = await dataAccessValidator.validateDataAccess(
        req.requestId,
        requestedDatabase,
        req.method.toLowerCase(),
        'api'
      )

      if (!accessValidation.allowed) {
        // Bloquear acesso
        const blockResult = await crossAccessBlocker.checkAndBlockCrossAccess(
          req.requestId,
          requestedDatabase,
          req.method.toLowerCase(),
          'api'
        )

        res.status(403).json({
          success: false,
          error: accessValidation.reason || 'Acesso negado',
          code: accessValidation.securityViolation ? 'SECURITY_VIOLATION' : 'ACCESS_DENIED'
        })
        return
      }

      // Verificar correspondência de base de dados
      const correspondenceCheck = await dataAccessValidator.validateDatabaseCorrespondence(
        req.requestId,
        requestedDatabase
      )

      if (!correspondenceCheck.valid) {
        res.status(403).json({
          success: false,
          error: `Violação de correspondência de base: ${correspondenceCheck.violation}`,
          code: 'DATABASE_MISMATCH'
        })
        return
      }

      // Anexar informações de acesso validado à requisição
      req.dataAccess = {
        validated: true,
        allowedDatabase: requestedDatabase,
        securityLevel: DataIsolationMiddleware.determineSecurityLevel(req)
      }

      next()

    } catch (error) {
      console.error('[DataIsolationMiddleware] Erro na validação de isolamento:', error)
      
      await securityEventLogger.logSecurityEvent({
        type: 'ACCESS_VALIDATION_ERROR',
        severity: 'HIGH',
        requestId: req.requestId,
        reason: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      })

      res.status(500).json({
        success: false,
        error: 'Erro interno na validação de segurança',
        code: 'SECURITY_ERROR'
      })
    }
  }

  /**
   * Middleware para validar token e limpar contexto se expirado
   */
  static validateTokenAndCleanup = async (req: IsolatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next() // Deixar outros middlewares tratarem
      }

      const token = authHeader.substring(7)
      const validation = tokenManager.validateToken(token)

      if (!validation.valid) {
        // Token inválido ou expirado - limpar contexto
        if (validation.errorCode === 'TOKEN_EXPIRED') {
          await contextCleanupHandler.handleTokenExpiration(token, req.requestId)
          
          res.status(401).json({
            success: false,
            error: 'Token expirado - contexto limpo',
            code: 'TOKEN_EXPIRED'
          })
          return
        }

        // Token inválido
        if (req.requestId) {
          await contextCleanupHandler.forceCleanupContext(req.requestId, 'Token inválido')
        }

        res.status(401).json({
          success: false,
          error: validation.error || 'Token inválido',
          code: validation.errorCode || 'INVALID_TOKEN'
        })
        return
      }

      next()

    } catch (error) {
      console.error('[DataIsolationMiddleware] Erro na validação de token:', error)
      
      // Limpar contexto em caso de erro
      if (req.requestId) {
        await contextCleanupHandler.forceCleanupContext(req.requestId, 'Erro na validação de token')
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno na validação de token',
        code: 'TOKEN_VALIDATION_ERROR'
      })
    }
  }

  /**
   * Middleware para detectar atividade suspeita
   */
  static detectSuspiciousActivity = async (req: IsolatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userContext) {
        return next()
      }

      const userId = req.userContext.usrCodigo
      
      // Verificar se usuário tem tentativas suspeitas
      const hasSuspiciousActivity = crossAccessBlocker.hasSuspiciousActivity(userId, 1) // Última hora
      
      if (hasSuspiciousActivity) {
        await securityEventLogger.logSuspiciousActivity(
          userId,
          req.userContext.usrNome,
          req.userContext.bancoDeDados,
          `Múltiplas tentativas de acesso bloqueadas - ${req.method} ${req.path}`,
          req.requestId
        )

        // Para atividade muito suspeita, bloquear temporariamente
        const recentBlocked = crossAccessBlocker.getBlockedAttemptsByUser(userId, 1)
        if (recentBlocked.length >= 5) {
          res.status(429).json({
            success: false,
            error: 'Muitas tentativas de acesso negadas. Tente novamente mais tarde.',
            code: 'TOO_MANY_VIOLATIONS'
          })
          return
        }
      }

      next()

    } catch (error) {
      console.error('[DataIsolationMiddleware] Erro na detecção de atividade suspeita:', error)
      next() // Não bloquear requisição por erro na detecção
    }
  }

  /**
   * Middleware para validar isolamento entre usuários simultâneos
   */
  static validateUserIsolation = async (req: IsolatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.requestId || !req.userContext) {
        return next()
      }

      // Validar isolamento geral
      const isolationValidation = userContextManager.validateUserIsolation()
      
      if (!isolationValidation.valid && isolationValidation.violations.length > 0) {
        console.warn('[DataIsolationMiddleware] Violações de isolamento detectadas:', isolationValidation.violations)
        
        // Log das violações mais críticas
        for (const violation of isolationValidation.violations) {
          if (violation.issue.includes('bases diferentes')) {
            await securityEventLogger.logSecurityEvent({
              type: 'USER_ISOLATION_VIOLATION',
              severity: 'CRITICAL',
              requestId: req.requestId,
              userId: req.userContext.usrCodigo,
              userName: req.userContext.usrNome,
              userDatabase: req.userContext.bancoDeDados,
              reason: violation.issue,
              timestamp: new Date()
            })
          }
        }
      }

      next()

    } catch (error) {
      console.error('[DataIsolationMiddleware] Erro na validação de isolamento:', error)
      next() // Não bloquear requisição por erro na validação
    }
  }

  /**
   * Middleware para limpeza de contexto no final da requisição
   */
  static cleanupOnResponse = (req: IsolatedRequest, res: Response, next: NextFunction): void => {
    // Executar limpeza quando a resposta for enviada
    res.on('finish', async () => {
      try {
        if (req.requestId && req.userContext) {
          // Verificar se deve limpar contexto (para requisições de logout)
          if (req.path.includes('/logout')) {
            await contextCleanupHandler.handleLogout(
              req.userContext.usrCodigo,
              req.userContext.usrNome,
              req.userContext.bancoDeDados,
              req.requestId
            )
          }
        }
      } catch (error) {
        console.error('[DataIsolationMiddleware] Erro na limpeza de contexto:', error)
      }
    })

    next()
  }

  /**
   * Determina nível de segurança baseado na requisição
   */
  private static determineSecurityLevel(req: IsolatedRequest): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Operações críticas
    if (req.method === 'DELETE' || req.path.includes('/admin/')) {
      return 'CRITICAL'
    }

    // Operações de alta segurança
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      return 'HIGH'
    }

    // Operações de média segurança
    if (req.path.includes('/download') || req.path.includes('/export')) {
      return 'MEDIUM'
    }

    // Operações de baixa segurança (leitura)
    return 'LOW'
  }

  /**
   * Middleware para rotas administrativas com isolamento extra
   */
  static enforceAdminIsolation = async (req: IsolatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userContext || !req.userContext.isAdmin) {
        await securityEventLogger.logUnauthorizedAccess(
          req.requestId || 'unknown',
          req.method,
          'admin',
          'Tentativa de acesso administrativo sem privilégios'
        )

        res.status(403).json({
          success: false,
          error: 'Acesso administrativo negado',
          code: 'ADMIN_ACCESS_DENIED'
        })
        return
      }

      // Validações extras para administradores
      const adminValidation = await dataAccessValidator.validateDataAccess(
        req.requestId!,
        req.userContext.bancoDeDados,
        req.method.toLowerCase(),
        'admin'
      )

      if (!adminValidation.allowed) {
        res.status(403).json({
          success: false,
          error: adminValidation.reason || 'Acesso administrativo negado',
          code: 'ADMIN_VALIDATION_FAILED'
        })
        return
      }

      next()

    } catch (error) {
      console.error('[DataIsolationMiddleware] Erro na validação administrativa:', error)
      
      res.status(500).json({
        success: false,
        error: 'Erro interno na validação administrativa',
        code: 'ADMIN_VALIDATION_ERROR'
      })
    }
  }
}

// Middleware combinado para isolamento completo
export const dataIsolationMiddleware = [
  DataIsolationMiddleware.validateTokenAndCleanup,
  DataIsolationMiddleware.detectSuspiciousActivity,
  DataIsolationMiddleware.enforceDataIsolation,
  DataIsolationMiddleware.validateUserIsolation,
  DataIsolationMiddleware.cleanupOnResponse
]

// Middleware para rotas administrativas
export const adminIsolationMiddleware = [
  DataIsolationMiddleware.validateTokenAndCleanup,
  DataIsolationMiddleware.detectSuspiciousActivity,
  DataIsolationMiddleware.enforceAdminIsolation,
  DataIsolationMiddleware.validateUserIsolation,
  DataIsolationMiddleware.cleanupOnResponse
]

// Middleware apenas para validação de token e limpeza
export const tokenValidationMiddleware = [
  DataIsolationMiddleware.validateTokenAndCleanup,
  DataIsolationMiddleware.cleanupOnResponse
]