/**
 * DataAccessValidator - Validador de Acesso a Dados
 * 
 * Responsável por garantir que usuários só acessem dados de suas respectivas organizações
 * e implementar validação de correspondência entre base e usuário
 */

import { UserContext, ContextError } from '../types/UserContext'
import { userContextManager } from './UserContextManager'
import { securityEventLogger } from './SecurityEventLogger'
import { databaseRouter } from './DatabaseRouter'

export interface DataAccessValidation {
  allowed: boolean
  reason?: string
  securityViolation?: boolean
  userContext?: UserContext
  requestedDatabase?: string
}

export interface DatabaseCorrespondenceCheck {
  valid: boolean
  expectedDatabase: string
  actualDatabase: string
  userId: string
  violation?: string
}

export class DataAccessValidator {
  private static instance: DataAccessValidator
  private validationCache: Map<string, { validation: DataAccessValidation; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  private constructor() {
    // Limpar cache periodicamente
    setInterval(() => {
      this.cleanupValidationCache()
    }, 60 * 1000) // A cada minuto
  }

  static getInstance(): DataAccessValidator {
    if (!DataAccessValidator.instance) {
      DataAccessValidator.instance = new DataAccessValidator()
    }
    return DataAccessValidator.instance
  }

  /**
   * Valida se o usuário pode acessar dados da base especificada
   */
  async validateDataAccess(
    requestId: string,
    requestedDatabase: string,
    operation: string = 'read',
    resourceType: string = 'data'
  ): Promise<DataAccessValidation> {
    try {
      // Verificar cache primeiro
      const cacheKey = `${requestId}:${requestedDatabase}:${operation}`
      const cached = this.validationCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.validation
      }

      // Obter contexto do usuário
      const context = userContextManager.getContext(requestId)
      
      if (!context || !context.userContext) {
        const validation: DataAccessValidation = {
          allowed: false,
          reason: 'Usuário não autenticado',
          securityViolation: true
        }

        // Log de evento de segurança
        await securityEventLogger.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: 'HIGH',
          requestId,
          operation,
          resourceType,
          requestedDatabase,
          reason: 'Usuário não autenticado',
          timestamp: new Date()
        })

        return validation
      }

      const userContext = context.userContext

      // Verificar se a base solicitada corresponde à base do usuário
      if (requestedDatabase !== userContext.bancoDeDados) {
        const validation: DataAccessValidation = {
          allowed: false,
          reason: `Acesso negado: usuário ${userContext.usrNome} tentou acessar base ${requestedDatabase}, mas pertence à base ${userContext.bancoDeDados}`,
          securityViolation: true,
          userContext,
          requestedDatabase
        }

        // Log de violação de segurança
        await securityEventLogger.logSecurityEvent({
          type: 'CROSS_DATABASE_ACCESS_ATTEMPT',
          severity: 'CRITICAL',
          userId: userContext.usrCodigo,
          userName: userContext.usrNome,
          userDatabase: userContext.bancoDeDados,
          requestId,
          operation,
          resourceType,
          requestedDatabase,
          reason: 'Tentativa de acesso cruzado entre bases',
          timestamp: new Date()
        })

        // Cache da validação negativa
        this.validationCache.set(cacheKey, {
          validation,
          timestamp: Date.now()
        })

        return validation
      }

      // Validação adicional para operações sensíveis
      if (operation === 'write' || operation === 'delete') {
        const writeValidation = await this.validateWriteAccess(userContext, requestedDatabase, resourceType)
        if (!writeValidation.allowed) {
          return writeValidation
        }
      }

      // Acesso permitido
      const validation: DataAccessValidation = {
        allowed: true,
        userContext,
        requestedDatabase
      }

      // Cache da validação positiva
      this.validationCache.set(cacheKey, {
        validation,
        timestamp: Date.now()
      })

      // Log de acesso autorizado (apenas para operações sensíveis)
      if (operation !== 'read') {
        await securityEventLogger.logSecurityEvent({
          type: 'AUTHORIZED_ACCESS',
          severity: 'INFO',
          userId: userContext.usrCodigo,
          userName: userContext.usrNome,
          userDatabase: userContext.bancoDeDados,
          requestId,
          operation,
          resourceType,
          requestedDatabase,
          reason: 'Acesso autorizado',
          timestamp: new Date()
        })
      }

      return validation

    } catch (error) {
      console.error('[DataAccessValidator] Erro na validação de acesso:', error)
      
      // Em caso de erro, negar acesso por segurança
      const validation: DataAccessValidation = {
        allowed: false,
        reason: `Erro interno na validação de acesso: ${error instanceof Error ? error.message : String(error)}`,
        securityViolation: true
      }

      // Log do erro de segurança
      await securityEventLogger.logSecurityEvent({
        type: 'ACCESS_VALIDATION_ERROR',
        severity: 'HIGH',
        requestId,
        operation,
        resourceType,
        requestedDatabase,
        reason: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      })

      return validation
    }
  }

  /**
   * Valida correspondência entre base de dados e usuário
   */
  async validateDatabaseCorrespondence(
    requestId: string,
    expectedDatabase: string
  ): Promise<DatabaseCorrespondenceCheck> {
    try {
      const context = userContextManager.getContext(requestId)
      
      if (!context || !context.userContext) {
        return {
          valid: false,
          expectedDatabase,
          actualDatabase: 'none',
          userId: 'unknown',
          violation: 'Contexto de usuário não encontrado'
        }
      }

      const userContext = context.userContext
      const actualDatabase = userContext.bancoDeDados

      if (expectedDatabase !== actualDatabase) {
        // Log da violação
        await securityEventLogger.logSecurityEvent({
          type: 'DATABASE_CORRESPONDENCE_VIOLATION',
          severity: 'CRITICAL',
          userId: userContext.usrCodigo,
          userName: userContext.usrNome,
          userDatabase: actualDatabase,
          requestId,
          requestedDatabase: expectedDatabase,
          reason: `Base esperada: ${expectedDatabase}, base do usuário: ${actualDatabase}`,
          timestamp: new Date()
        })

        return {
          valid: false,
          expectedDatabase,
          actualDatabase,
          userId: userContext.usrCodigo,
          violation: `Base esperada: ${expectedDatabase}, base do usuário: ${actualDatabase}`
        }
      }

      return {
        valid: true,
        expectedDatabase,
        actualDatabase,
        userId: userContext.usrCodigo
      }

    } catch (error) {
      console.error('[DataAccessValidator] Erro na validação de correspondência:', error)
      
      return {
        valid: false,
        expectedDatabase,
        actualDatabase: 'error',
        userId: 'unknown',
        violation: `Erro na validação: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Valida acesso de escrita (operações mais sensíveis)
   */
  private async validateWriteAccess(
    userContext: UserContext,
    requestedDatabase: string,
    resourceType: string
  ): Promise<DataAccessValidation> {
    try {
      // Verificações adicionais para operações de escrita
      
      // 1. Verificar se o usuário está ativo
      if (!userContext.isAuthenticated) {
        return {
          allowed: false,
          reason: 'Usuário não está autenticado para operações de escrita',
          securityViolation: true,
          userContext
        }
      }

      // 2. Verificar se a base está disponível
      const sqlConnection = await databaseRouter.getSqlConnection(requestedDatabase)
      if (!sqlConnection) {
        return {
          allowed: false,
          reason: `Base de dados ${requestedDatabase} não está disponível para escrita`,
          securityViolation: false,
          userContext
        }
      }

      // 3. Verificações específicas por tipo de recurso
      if (resourceType === 'system' && !userContext.isAdmin) {
        return {
          allowed: false,
          reason: 'Operações de sistema requerem privilégios administrativos',
          securityViolation: true,
          userContext
        }
      }

      return {
        allowed: true,
        userContext
      }

    } catch (error) {
      console.error('[DataAccessValidator] Erro na validação de escrita:', error)
      
      return {
        allowed: false,
        reason: `Erro na validação de escrita: ${error instanceof Error ? error.message : String(error)}`,
        securityViolation: true,
        userContext
      }
    }
  }

  /**
   * Valida isolamento entre usuários simultâneos
   */
  async validateUserIsolation(
    requestId1: string,
    requestId2: string
  ): Promise<{ isolated: boolean; violation?: string }> {
    try {
      const context1 = userContextManager.getContext(requestId1)
      const context2 = userContextManager.getContext(requestId2)

      if (!context1 || !context2) {
        return { isolated: true } // Se um dos contextos não existe, não há violação
      }

      if (!context1.userContext || !context2.userContext) {
        return { isolated: true } // Se um dos usuários não está autenticado, não há violação
      }

      // Verificar se são usuários diferentes acessando bases diferentes
      const user1 = context1.userContext
      const user2 = context2.userContext

      if (user1.usrCodigo !== user2.usrCodigo && user1.bancoDeDados === user2.bancoDeDados) {
        const violation = `Usuários diferentes (${user1.usrNome} e ${user2.usrNome}) acessando a mesma base (${user1.bancoDeDados})`
        
        // Log da violação de isolamento
        await securityEventLogger.logSecurityEvent({
          type: 'USER_ISOLATION_VIOLATION',
          severity: 'CRITICAL',
          userId: user1.usrCodigo,
          userName: user1.usrNome,
          userDatabase: user1.bancoDeDados,
          requestId: requestId1,
          reason: violation,
          additionalData: {
            secondUserId: user2.usrCodigo,
            secondUserName: user2.usrNome,
            secondRequestId: requestId2
          },
          timestamp: new Date()
        })

        return {
          isolated: false,
          violation
        }
      }

      return { isolated: true }

    } catch (error) {
      console.error('[DataAccessValidator] Erro na validação de isolamento:', error)
      return { isolated: false, violation: `Erro na validação: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  /**
   * Força validação de todos os contextos ativos
   */
  async validateAllActiveContexts(): Promise<{
    totalContexts: number
    validContexts: number
    violations: Array<{ requestId: string; violation: string }>
  }> {
    const violations: Array<{ requestId: string; violation: string }> = []
    const activeContexts = userContextManager.listActiveContexts()
    let validContexts = 0

    for (const contextInfo of activeContexts) {
      try {
        const validation = await this.validateDataAccess(
          contextInfo.requestId,
          contextInfo.database,
          'read',
          'validation'
        )

        if (validation.allowed) {
          validContexts++
        } else {
          violations.push({
            requestId: contextInfo.requestId,
            violation: validation.reason || 'Validação falhou'
          })
        }
      } catch (error) {
        violations.push({
          requestId: contextInfo.requestId,
          violation: `Erro na validação: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    }

    return {
      totalContexts: activeContexts.length,
      validContexts,
      violations
    }
  }

  /**
   * Limpa cache de validações antigas
   */
  private cleanupValidationCache(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, cached] of this.validationCache.entries()) {
      if ((now - cached.timestamp) > this.CACHE_TTL) {
        this.validationCache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[DataAccessValidator] Cache limpo: ${cleaned} validações removidas`)
    }
  }

  /**
   * Obtém estatísticas de validação
   */
  getValidationStats(): {
    cacheSize: number
    cacheHitRate: number
    totalValidations: number
    deniedValidations: number
  } {
    // Para implementação futura - coletar métricas de validação
    return {
      cacheSize: this.validationCache.size,
      cacheHitRate: 0, // Implementar contador de hits/misses
      totalValidations: 0, // Implementar contador total
      deniedValidations: 0 // Implementar contador de negações
    }
  }

  /**
   * Limpa todas as validações em cache
   */
  clearValidationCache(): void {
    const size = this.validationCache.size
    this.validationCache.clear()
    console.log(`[DataAccessValidator] Cache limpo: ${size} validações removidas`)
  }
}

// Singleton instance
export const dataAccessValidator = DataAccessValidator.getInstance()