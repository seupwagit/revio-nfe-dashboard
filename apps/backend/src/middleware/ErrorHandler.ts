/**
 * ErrorHandler - Middleware de Tratamento de Erros
 * 
 * Responsável por tratar erros centralizadamente e retornar respostas padronizadas
 */

import { Request, Response, NextFunction } from 'express'
import { apiLogger } from '../services/APILogger'

export interface ErrorResponse {
  success: false
  error: string
  code: string
  timestamp: string
  path: string
}

export class ErrorHandler {
  /**
   * Trata erro 401 - Não autorizado
   */
  static handle401(res: Response, message: string = 'Não autorizado'): void {
    const errorResponse: ErrorResponse = {
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
      path: res.req?.path || 'unknown'
    }

    res.status(401).json(errorResponse)
  }

  /**
   * Trata erro 403 - Acesso negado
   */
  static handle403(res: Response, message: string = 'Acesso negado'): void {
    const errorResponse: ErrorResponse = {
      success: false,
      error: message,
      code: 'FORBIDDEN',
      timestamp: new Date().toISOString(),
      path: res.req?.path || 'unknown'
    }

    res.status(403).json(errorResponse)
  }

  /**
   * Trata erro 500 - Erro interno do servidor
   */
  static handle500(res: Response, message: string = 'Erro interno do servidor'): void {
    const errorResponse: ErrorResponse = {
      success: false,
      error: message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: res.req?.path || 'unknown'
    }

    res.status(500).json(errorResponse)
  }

  /**
   * Middleware para tratar rotas não encontradas
   */
  static notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.path}`)
    ;(error as any).status = 404
    next(error)
  }

  /**
   * Middleware genérico para tratamento de erros
   */
  static handleError = async (error: any, req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      const status = error.status || 500
      const message = error.message || 'Erro interno do servidor'

      // Log do erro
      await apiLogger.logError(ip, req.path, `${status}: ${message}`)

      // Resposta baseada no status
      const errorResponse: ErrorResponse = {
        success: false,
        error: message,
        code: ErrorHandler.getErrorCode(status),
        timestamp: new Date().toISOString(),
        path: req.path
      }

      // Em desenvolvimento, incluir stack trace
      if (process.env.NODE_ENV === 'development') {
        (errorResponse as any).stack = error.stack
      }

      res.status(status).json(errorResponse)

    } catch (logError) {
      // Se falhar ao logar, pelo menos retornar erro básico
      console.error('Erro ao processar erro:', logError)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path
      })
    }
  }

  /**
   * Converte status HTTP em código de erro
   */
  private static getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST'
      case 401: return 'UNAUTHORIZED'
      case 403: return 'FORBIDDEN'
      case 404: return 'NOT_FOUND'
      case 409: return 'CONFLICT'
      case 422: return 'VALIDATION_ERROR'
      case 429: return 'TOO_MANY_REQUESTS'
      case 500: return 'INTERNAL_ERROR'
      case 502: return 'BAD_GATEWAY'
      case 503: return 'SERVICE_UNAVAILABLE'
      default: return 'UNKNOWN_ERROR'
    }
  }

  /**
   * Cria erro personalizado
   */
  static createError(status: number, message: string, code?: string): Error {
    const error = new Error(message)
    ;(error as any).status = status
    ;(error as any).code = code || ErrorHandler.getErrorCode(status)
    return error
  }

  /**
   * Middleware para validação de dados
   */
  static validateRequired = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const missing = fields.filter(field => !req.body[field])
      
      if (missing.length > 0) {
        const error = ErrorHandler.createError(
          400, 
          `Campos obrigatórios não fornecidos: ${missing.join(', ')}`,
          'MISSING_FIELDS'
        )
        next(error)
        return
      }
      
      next()
    }
  }

  /**
   * Middleware para validação de tipos
   */
  static validateTypes = (validations: { [key: string]: string }) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const errors: string[] = []
      
      for (const [field, expectedType] of Object.entries(validations)) {
        const value = req.body[field]
        if (value !== undefined && typeof value !== expectedType) {
          errors.push(`${field} deve ser do tipo ${expectedType}`)
        }
      }
      
      if (errors.length > 0) {
        const error = ErrorHandler.createError(
          400,
          `Tipos inválidos: ${errors.join(', ')}`,
          'INVALID_TYPES'
        )
        next(error)
        return
      }
      
      next()
    }
  }
}

export default ErrorHandler