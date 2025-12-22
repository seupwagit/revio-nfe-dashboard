/**
 * AuthMiddleware - Middleware de Autenticação
 * 
 * Responsável por verificar tokens JWT e autorizar acesso às rotas
 */

import { Request, Response, NextFunction } from 'express'
import { tokenManager, TokenPayload } from '../services/TokenManager'
import { apiLogger } from '../services/APILogger'
import { databaseRouter } from '../services/DatabaseRouter'
import { UserContext, DatabaseContext } from '../types/UserContext'

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload
  userDatabase?: string
  requestId?: string
  userContext?: UserContext
  dbContext?: DatabaseContext
}

export class AuthMiddleware {
  /**
   * Middleware para verificar token JWT
   */
  static verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization
      const ip = req.ip || req.connection.remoteAddress || 'unknown'

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        await apiLogger.logAccessDenied(ip, req.path, 'Token não fornecido')
        res.status(401).json({
          success: false,
          error: 'Token de autenticação não fornecido',
          code: 'NO_TOKEN'
        })
        return
      }

      const token = authHeader.substring(7) // Remove "Bearer "
      const validation = tokenManager.validateToken(token)

      if (!validation.valid || !validation.payload) {
        await apiLogger.logAccessDenied(ip, req.path, validation.error || 'Token inválido')
        res.status(401).json({
          success: false,
          error: validation.error || 'Token inválido',
          code: validation.errorCode || 'INVALID_TOKEN'
        })
        return
      }

      // Anexar dados do usuário à requisição
      req.user = validation.payload
      req.userDatabase = validation.payload.bancoDeDados

      next()

    } catch (error) {
      console.error('Erro no middleware de autenticação:', error)
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      await apiLogger.logError(ip, req.path, 'Erro interno no middleware de autenticação')
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      })
    }
  }

  /**
   * Middleware para verificar permissões administrativas
   */
  static requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        })
        return
      }

      if (!req.user.isAdmin) {
        const ip = req.ip || req.connection.remoteAddress || 'unknown'
        await apiLogger.logAccessDenied(
          ip, 
          req.path, 
          'Acesso administrativo negado', 
          parseInt(req.user.usrCodigo)
        )
        
        res.status(403).json({
          success: false,
          error: 'Acesso negado. Permissões administrativas necessárias.',
          code: 'ADMIN_REQUIRED'
        })
        return
      }

      next()

    } catch (error) {
      console.error('Erro no middleware de autorização:', error)
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      await apiLogger.logError(ip, req.path, 'Erro interno no middleware de autorização')
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      })
    }
  }

  /**
   * Middleware para anexar conexões de base de dados à requisição
   */
  static attachDatabase = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        })
        return
      }

      // Anexar conexões de base de dados baseadas no usuário autenticado
      const bancoDeDados = req.user.bancoDeDados

      // Para implementação futura: configurar conexões dinâmicas
      // Por enquanto, usar sempre as conexões globais
      req.userDatabase = bancoDeDados

      next()

    } catch (error) {
      console.error('Erro ao anexar base de dados:', error)
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      await apiLogger.logError(ip, req.path, 'Erro ao configurar base de dados do usuário')
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      })
    }
  }

  /**
   * Middleware opcional que permite acesso sem token (para rotas públicas)
   */
  static optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const validation = tokenManager.validateToken(token)

        if (validation.valid && validation.payload) {
          req.user = validation.payload
          req.userDatabase = validation.payload.bancoDeDados
        }
      }

      next()

    } catch (error) {
      // Em caso de erro, continuar sem autenticação
      console.warn('Erro na autenticação opcional:', error)
      next()
    }
  }

  /**
   * Middleware para log de requisições autenticadas
   */
  static logAuthenticatedRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        const ip = req.ip || req.connection.remoteAddress || 'unknown'
        await apiLogger.logRequest({
          ip,
          caminhoAcessado: req.path,
          mensagem: `${req.method} ${req.path}`,
          usrCodigo: parseInt(req.user.usrCodigo),
          tipo: 'AUTHENTICATED_REQUEST'
        })
      }

      next()

    } catch (error) {
      // Não bloquear requisição se log falhar
      console.error('Erro ao registrar requisição autenticada:', error)
      next()
    }
  }
}

// Middleware combinado para rotas protegidas
export const authMiddleware = [
  AuthMiddleware.verifyToken,
  AuthMiddleware.attachDatabase,
  AuthMiddleware.logAuthenticatedRequest
]

// Middleware combinado para rotas administrativas
export const adminMiddleware = [
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireAdmin,
  AuthMiddleware.attachDatabase,
  AuthMiddleware.logAuthenticatedRequest
]

// Middleware combinado com contexto de usuário (novo)
export const contextAwareAuthMiddleware = [
  AuthMiddleware.verifyToken,
  AuthMiddleware.attachDatabase,
  AuthMiddleware.logAuthenticatedRequest
]