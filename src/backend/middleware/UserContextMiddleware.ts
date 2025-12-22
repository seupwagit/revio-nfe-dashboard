/**
 * UserContextMiddleware - Middleware de Contexto de Usuário
 * 
 * Responsável por configurar automaticamente o contexto de base de dados
 * baseado no usuário autenticado, garantindo roteamento transparente
 */

import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { UserContext, DatabaseContext, ContextError } from '../types/UserContext'
import { userContextManager } from '../services/UserContextManager'
import { databaseRouter } from '../services/DatabaseRouter'
import { apiLogger } from '../services/APILogger'
import { TokenPayload, tokenManager } from '../services/TokenManager'

// Estender a interface AuthenticatedRequest
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload
  userDatabase?: string
  requestId?: string
  userContext?: UserContext
  dbContext?: DatabaseContext
}

export class UserContextMiddleware {
  /**
   * Extrai contexto do usuário do token JWT
   */
  static extractUserContext(req: AuthenticatedRequest): UserContext | null {
    try {
      if (!req.user) {
        return null
      }

      const userContext: UserContext = {
        usrCodigo: req.user.usrCodigo,
        usrNome: req.user.usrNome,
        bancoDeDados: req.user.bancoDeDados,
        isAdmin: req.user.isAdmin,
        isAuthenticated: true
      }

      return userContext

    } catch (error) {
      console.error('[UserContextMiddleware] Erro ao extrair contexto do usuário:', error)
      return null
    }
  }

  /**
   * Middleware de autenticação e configuração de contexto combinado
   */
  static authenticateAndSetupContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Gerar ID único para a requisição
      req.requestId = uuidv4()

      // Extrair token do header Authorization
      const authHeader = req.headers.authorization
      let token: string | null = null

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }

      // Se não há token, configurar contexto global e continuar
      if (!token) {
        const globalContext: DatabaseContext = {
          userContext: null,
          sqlConnection: null,
          mongoConnection: null
        }

        userContextManager.setContext(req.requestId, globalContext)
        req.dbContext = globalContext

        console.log(`[UserContextMiddleware] Contexto global configurado - sem token (Request: ${req.requestId})`)
        return next()
      }

      // Validar token
      const validation = tokenManager.validateToken(token)
      
      if (!validation.valid || !validation.payload) {
        // Token inválido - configurar contexto global
        const globalContext: DatabaseContext = {
          userContext: null,
          sqlConnection: null,
          mongoConnection: null
        }

        userContextManager.setContext(req.requestId, globalContext)
        req.dbContext = globalContext

        console.log(`[UserContextMiddleware] Contexto global configurado - token inválido (Request: ${req.requestId})`)
        return next()
      }

      // Token válido - configurar contexto do usuário
      req.user = validation.payload

      const userContext: UserContext = {
        usrCodigo: validation.payload.usrCodigo,
        usrNome: validation.payload.usrNome,
        bancoDeDados: validation.payload.bancoDeDados,
        isAdmin: validation.payload.isAdmin,
        isAuthenticated: true
      }

      const dbContext: DatabaseContext = {
        userContext,
        sqlConnection: null, // Será criado sob demanda pelo DatabaseRouter
        mongoConnection: null // Será criado sob demanda pelo DatabaseRouter
      }

      // Armazenar contexto no gerenciador
      userContextManager.setContext(req.requestId, dbContext)

      // Configurar contexto no DatabaseRouter para esta requisição
      databaseRouter.setUserContext(userContext)

      // Anexar contexto à requisição para acesso direto
      req.userContext = userContext
      req.dbContext = dbContext

      // Log do evento de configuração de contexto
      await apiLogger.logSuccess(
        req.ip || 'unknown',
        req.path,
        `Contexto configurado para usuário ${userContext.usrNome} (${userContext.bancoDeDados})`
      )

      console.log(`[UserContextMiddleware] Contexto configurado: ${userContext.usrNome} -> ${userContext.bancoDeDados} (Request: ${req.requestId})`)

      next()

    } catch (error) {
      console.error('[UserContextMiddleware] Erro ao autenticar e configurar contexto:', error)
      
      // Em caso de erro, continuar com contexto global
      try {
        const fallbackContext: DatabaseContext = {
          userContext: null,
          sqlConnection: null,
          mongoConnection: null
        }

        if (req.requestId) {
          userContextManager.setContext(req.requestId, fallbackContext)
        }

        req.dbContext = fallbackContext

        await apiLogger.logError(
          req.ip || 'unknown',
          req.path,
          `Erro ao configurar contexto, usando fallback: ${error instanceof Error ? error.message : error}`
        )

      } catch (fallbackError) {
        console.error('[UserContextMiddleware] Erro crítico no fallback:', fallbackError)
      }

      next()
    }
  }

  /**
   * Configura o contexto de base de dados para a requisição
   */
  static setupDatabaseContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Gerar ID único para a requisição
      req.requestId = uuidv4()

      // Extrair contexto do usuário
      const userContext = UserContextMiddleware.extractUserContext(req)
      
      if (userContext) {
        // Criar contexto de base de dados
        const dbContext: DatabaseContext = {
          userContext,
          sqlConnection: null, // Será criado sob demanda pelo DatabaseRouter
          mongoConnection: null // Será criado sob demanda pelo DatabaseRouter
        }

        // Armazenar contexto no gerenciador
        userContextManager.setContext(req.requestId, dbContext)

        // Configurar contexto no DatabaseRouter para esta requisição
        databaseRouter.setUserContext(userContext)

        // Anexar contexto à requisição para acesso direto
        req.userContext = userContext
        req.dbContext = dbContext

        // Log do evento de configuração de contexto
        await apiLogger.logSuccess(
          req.ip || 'unknown',
          req.path,
          `Contexto configurado para usuário ${userContext.usrNome} (${userContext.bancoDeDados})`
        )

        console.log(`[UserContextMiddleware] Contexto configurado: ${userContext.usrNome} -> ${userContext.bancoDeDados} (Request: ${req.requestId})`)
      } else {
        // Sem usuário autenticado - configurar contexto para base global
        const globalContext: DatabaseContext = {
          userContext: null,
          sqlConnection: null,
          mongoConnection: null
        }

        userContextManager.setContext(req.requestId, globalContext)
        req.dbContext = globalContext

        console.log(`[UserContextMiddleware] Contexto global configurado (Request: ${req.requestId})`)
      }

      next()

    } catch (error) {
      console.error('[UserContextMiddleware] Erro ao configurar contexto:', error)
      
      // Em caso de erro, continuar com contexto global
      try {
        const fallbackContext: DatabaseContext = {
          userContext: null,
          sqlConnection: null,
          mongoConnection: null
        }

        if (req.requestId) {
          userContextManager.setContext(req.requestId, fallbackContext)
        }

        req.dbContext = fallbackContext

        await apiLogger.logError(
          req.ip || 'unknown',
          req.path,
          `Erro ao configurar contexto, usando fallback: ${error instanceof Error ? error.message : error}`
        )

      } catch (fallbackError) {
        console.error('[UserContextMiddleware] Erro crítico no fallback:', fallbackError)
      }

      next()
    }
  }

  /**
   * Limpa o contexto após a requisição
   */
  static cleanupContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Executar após a resposta ser enviada
    res.on('finish', () => {
      try {
        if (req.requestId) {
          // Limpar contexto do DatabaseRouter
          databaseRouter.clearUserContext()
          
          // Limpar contexto do gerenciador
          userContextManager.clearContext(req.requestId)
          console.log(`[UserContextMiddleware] Contexto limpo (Request: ${req.requestId})`)
        }
      } catch (error) {
        console.error('[UserContextMiddleware] Erro ao limpar contexto:', error)
      }
    })

    next()
  }

  /**
   * Middleware para validar contexto (opcional, para debug)
   */
  static validateContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.requestId && req.userContext) {
        const storedContext = userContextManager.getContext(req.requestId)
        
        if (!storedContext) {
          console.warn(`[UserContextMiddleware] Contexto não encontrado no gerenciador (Request: ${req.requestId})`)
        } else if (storedContext.userContext?.usrCodigo !== req.userContext.usrCodigo) {
          console.warn(`[UserContextMiddleware] Inconsistência de contexto detectada (Request: ${req.requestId})`)
        }
      }

      next()

    } catch (error) {
      console.error('[UserContextMiddleware] Erro na validação de contexto:', error)
      next()
    }
  }

  /**
   * Middleware para tratamento de erros de contexto
   */
  static handleContextError = async (error: any, req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (error instanceof ContextError) {
      console.error(`[UserContextMiddleware] Erro de contexto: ${error.type} - ${error.message}`)

      // Log do erro
      await apiLogger.logError(
        req.ip || 'unknown',
        req.path,
        `Erro de contexto: ${error.type} - ${error.message}`
      )

      // Determinar resposta baseada no tipo de erro
      switch (error.type) {
        case 'CONTEXT_NOT_FOUND':
        case 'CONTEXT_CORRUPTED':
          res.status(500).json({
            success: false,
            error: 'Erro interno de contexto',
            code: 'CONTEXT_ERROR'
          })
          return

        case 'DATABASE_UNAVAILABLE':
          res.status(503).json({
            success: false,
            error: 'Base de dados temporariamente indisponível',
            code: 'DATABASE_UNAVAILABLE'
          })
          return

        case 'INVALID_DATABASE':
          res.status(400).json({
            success: false,
            error: 'Base de dados do usuário inválida',
            code: 'INVALID_DATABASE'
          })
          return

        default:
          res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
          })
          return
      }
    }

    // Se não for erro de contexto, passar para o próximo handler
    next(error)
  }

  /**
   * Middleware para métricas de contexto (opcional)
   */
  static logContextMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = userContextManager.getMetrics()
      
      // Log métricas a cada 100 requisições
      if (metrics.totalContextsCreated % 100 === 0) {
        console.log('[UserContextMiddleware] Métricas de contexto:', {
          activeContexts: metrics.activeContexts,
          totalCreated: metrics.totalContextsCreated,
          averageLifetime: Math.round(metrics.averageLifetime / 1000) + 's',
          memoryUsage: Math.round(metrics.memoryUsage / 1024) + 'KB'
        })
      }

      next()

    } catch (error) {
      console.error('[UserContextMiddleware] Erro ao registrar métricas:', error)
      next()
    }
  }
}

// Middleware combinado para configuração completa de contexto com autenticação
export const userContextMiddleware = [
  UserContextMiddleware.authenticateAndSetupContext,
  UserContextMiddleware.cleanupContext,
  UserContextMiddleware.logContextMetrics
]

// Middleware para rotas que precisam de validação de contexto
export const validatedContextMiddleware = [
  UserContextMiddleware.authenticateAndSetupContext,
  UserContextMiddleware.validateContext,
  UserContextMiddleware.cleanupContext
]

// Middleware apenas para configuração de contexto (sem autenticação)
export const contextOnlyMiddleware = [
  UserContextMiddleware.setupDatabaseContext,
  UserContextMiddleware.cleanupContext,
  UserContextMiddleware.logContextMetrics
]