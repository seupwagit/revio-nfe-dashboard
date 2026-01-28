/**
 * ContextCleanupHandler - Manipulador de Limpeza de Contexto
 * 
 * Responsável por garantir que logout e expiração de token limpem contexto
 * e implementar limpeza automática de contextos órfãos
 */

import { UserContext, ContextError } from '../types/UserContext'
import { userContextManager } from './UserContextManager'
import { securityEventLogger } from './SecurityEventLogger'
import { databaseRouter } from './DatabaseRouter'
import { tokenManager } from './TokenManager'

export interface CleanupEvent {
  type: 'LOGOUT' | 'TOKEN_EXPIRATION' | 'FORCED_CLEANUP' | 'AUTOMATIC_CLEANUP'
  userId?: string
  userName?: string
  userDatabase?: string
  requestId?: string
  reason: string
  timestamp: Date
  contextsCleared: number
}

export interface CleanupStats {
  totalCleanups: number
  cleanupsByType: Record<string, number>
  contextsCleared: number
  lastCleanup?: Date
  averageContextsPerCleanup: number
}

export class ContextCleanupHandler {
  private static instance: ContextCleanupHandler
  private cleanupHistory: CleanupEvent[] = []
  private readonly MAX_HISTORY = 500
  private automaticCleanupTimer: NodeJS.Timeout | null = null
  private stats: CleanupStats = {
    totalCleanups: 0,
    cleanupsByType: {},
    contextsCleared: 0,
    averageContextsPerCleanup: 0
  }

  private constructor() {
    this.startAutomaticCleanup()
    console.log('[ContextCleanupHandler] Inicializado com limpeza automática')
  }

  static getInstance(): ContextCleanupHandler {
    if (!ContextCleanupHandler.instance) {
      ContextCleanupHandler.instance = new ContextCleanupHandler()
    }
    return ContextCleanupHandler.instance
  }

  /**
   * Limpa contexto no logout do usuário
   */
  async handleLogout(
    userId: string,
    userName?: string,
    userDatabase?: string,
    requestId?: string
  ): Promise<CleanupEvent> {
    try {
      console.log(`[ContextCleanupHandler] Processando logout para usuário: ${userName || userId}`)

      // Limpar todos os contextos do usuário
      const contextsCleared = userContextManager.clearUserContexts(userId)

      // Limpar contexto do DatabaseRouter se for o usuário atual
      const currentContext = databaseRouter.getCurrentContext()
      if (currentContext && currentContext.usrCodigo === userId) {
        databaseRouter.clearUserContext()
      }

      // Criar evento de limpeza
      const cleanupEvent: CleanupEvent = {
        type: 'LOGOUT',
        userId,
        userName,
        userDatabase,
        requestId,
        reason: `Logout do usuário ${userName || userId}`,
        timestamp: new Date(),
        contextsCleared
      }

      // Registrar evento
      await this.recordCleanupEvent(cleanupEvent)

      // Log de evento de segurança
      await securityEventLogger.logContextCleanup(
        'LOGOUT',
        userId,
        userName,
        userDatabase,
        requestId,
        `Logout - ${contextsCleared} contextos limpos`
      )

      console.log(`[ContextCleanupHandler] Logout processado: ${contextsCleared} contextos limpos para usuário ${userName || userId}`)

      return cleanupEvent

    } catch (error) {
      console.error('[ContextCleanupHandler] Erro no processamento de logout:', error)
      
      const errorEvent: CleanupEvent = {
        type: 'LOGOUT',
        userId,
        userName,
        userDatabase,
        requestId,
        reason: `Erro no logout: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        contextsCleared: 0
      }

      await this.recordCleanupEvent(errorEvent)
      return errorEvent
    }
  }

  /**
   * Limpa contexto quando token expira
   */
  async handleTokenExpiration(
    token: string,
    requestId?: string
  ): Promise<CleanupEvent> {
    try {
      // Decodificar token para obter informações do usuário
      const payload = tokenManager.decodeToken(token)
      
      if (!payload) {
        console.warn('[ContextCleanupHandler] Token inválido para limpeza de expiração')
        
        const errorEvent: CleanupEvent = {
          type: 'TOKEN_EXPIRATION',
          requestId,
          reason: 'Token inválido para decodificação',
          timestamp: new Date(),
          contextsCleared: 0
        }

        await this.recordCleanupEvent(errorEvent)
        return errorEvent
      }

      const userId = payload.usrCodigo
      const userName = payload.usrNome
      const userDatabase = payload.bancoDeDados

      console.log(`[ContextCleanupHandler] Processando expiração de token para usuário: ${userName}`)

      // Limpar todos os contextos do usuário
      const contextsCleared = userContextManager.clearUserContexts(userId)

      // Limpar contexto do DatabaseRouter se for o usuário atual
      const currentContext = databaseRouter.getCurrentContext()
      if (currentContext && currentContext.usrCodigo === userId) {
        databaseRouter.clearUserContext()
      }

      // Criar evento de limpeza
      const cleanupEvent: CleanupEvent = {
        type: 'TOKEN_EXPIRATION',
        userId,
        userName,
        userDatabase,
        requestId,
        reason: `Token expirado para usuário ${userName}`,
        timestamp: new Date(),
        contextsCleared
      }

      // Registrar evento
      await this.recordCleanupEvent(cleanupEvent)

      // Log de evento de segurança
      await securityEventLogger.logContextCleanup(
        'TOKEN_EXPIRATION',
        userId,
        userName,
        userDatabase,
        requestId,
        `Token expirado - ${contextsCleared} contextos limpos`
      )

      console.log(`[ContextCleanupHandler] Expiração processada: ${contextsCleared} contextos limpos para usuário ${userName}`)

      return cleanupEvent

    } catch (error) {
      console.error('[ContextCleanupHandler] Erro no processamento de expiração:', error)
      
      const errorEvent: CleanupEvent = {
        type: 'TOKEN_EXPIRATION',
        requestId,
        reason: `Erro na expiração: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        contextsCleared: 0
      }

      await this.recordCleanupEvent(errorEvent)
      return errorEvent
    }
  }

  /**
   * Força limpeza de contexto específico
   */
  async forceCleanupContext(
    requestId: string,
    reason: string = 'Limpeza forçada'
  ): Promise<CleanupEvent> {
    try {
      console.log(`[ContextCleanupHandler] Forçando limpeza de contexto: ${requestId}`)

      // Obter contexto antes de limpar para logging
      const context = userContextManager.getContext(requestId)
      const userContext = context?.userContext

      // Limpar contexto específico
      userContextManager.clearContext(requestId)

      // Limpar contexto do DatabaseRouter se corresponder
      const currentContext = databaseRouter.getCurrentContext()
      if (currentContext && userContext && currentContext.usrCodigo === userContext.usrCodigo) {
        databaseRouter.clearUserContext()
      }

      // Criar evento de limpeza
      const cleanupEvent: CleanupEvent = {
        type: 'FORCED_CLEANUP',
        userId: userContext?.usrCodigo,
        userName: userContext?.usrNome,
        userDatabase: userContext?.bancoDeDados,
        requestId,
        reason,
        timestamp: new Date(),
        contextsCleared: 1
      }

      // Registrar evento
      await this.recordCleanupEvent(cleanupEvent)

      // Log de evento de segurança
      await securityEventLogger.logContextCleanup(
        'FORCED',
        userContext?.usrCodigo,
        userContext?.usrNome,
        userContext?.bancoDeDados,
        requestId,
        reason
      )

      console.log(`[ContextCleanupHandler] Limpeza forçada concluída para request: ${requestId}`)

      return cleanupEvent

    } catch (error) {
      console.error('[ContextCleanupHandler] Erro na limpeza forçada:', error)
      
      const errorEvent: CleanupEvent = {
        type: 'FORCED_CLEANUP',
        requestId,
        reason: `Erro na limpeza forçada: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        contextsCleared: 0
      }

      await this.recordCleanupEvent(errorEvent)
      return errorEvent
    }
  }

  /**
   * Limpeza automática de contextos órfãos
   */
  async performAutomaticCleanup(): Promise<CleanupEvent> {
    try {
      console.log('[ContextCleanupHandler] Iniciando limpeza automática de contextos órfãos')

      // Limpar contextos antigos do UserContextManager
      const contextsCleared = userContextManager.cleanupOldContexts()

      // Validar isolamento de usuários
      const isolationValidation = userContextManager.validateUserIsolation()
      
      if (!isolationValidation.valid) {
        console.warn('[ContextCleanupHandler] Violações de isolamento detectadas durante limpeza automática:', isolationValidation.violations)
        
        // Log das violações
        for (const violation of isolationValidation.violations) {
          await securityEventLogger.logSecurityEvent({
            type: 'USER_ISOLATION_VIOLATION',
            severity: 'HIGH',
            requestId: violation.requestId,
            reason: violation.issue,
            timestamp: new Date()
          })
        }
      }

      // Criar evento de limpeza
      const cleanupEvent: CleanupEvent = {
        type: 'AUTOMATIC_CLEANUP',
        reason: `Limpeza automática - ${contextsCleared} contextos órfãos removidos`,
        timestamp: new Date(),
        contextsCleared
      }

      // Registrar evento
      await this.recordCleanupEvent(cleanupEvent)

      if (contextsCleared > 0) {
        console.log(`[ContextCleanupHandler] Limpeza automática concluída: ${contextsCleared} contextos removidos`)
      }

      return cleanupEvent

    } catch (error) {
      console.error('[ContextCleanupHandler] Erro na limpeza automática:', error)
      
      const errorEvent: CleanupEvent = {
        type: 'AUTOMATIC_CLEANUP',
        reason: `Erro na limpeza automática: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        contextsCleared: 0
      }

      await this.recordCleanupEvent(errorEvent)
      return errorEvent
    }
  }

  /**
   * Limpa todos os contextos de um usuário específico
   */
  async cleanupUserContexts(
    userId: string,
    reason: string = 'Limpeza de usuário'
  ): Promise<CleanupEvent> {
    try {
      console.log(`[ContextCleanupHandler] Limpando todos os contextos do usuário: ${userId}`)

      // Obter informações do usuário antes de limpar
      const activeContexts = userContextManager.listActiveContexts()
      const userContexts = activeContexts.filter(ctx => ctx.user === userId)
      const userName = userContexts.length > 0 ? userContexts[0].user : undefined
      const userDatabase = userContexts.length > 0 ? userContexts[0].database : undefined

      // Limpar contextos do usuário
      const contextsCleared = userContextManager.clearUserContexts(userId)

      // Limpar contexto do DatabaseRouter se for o usuário atual
      const currentContext = databaseRouter.getCurrentContext()
      if (currentContext && currentContext.usrCodigo === userId) {
        databaseRouter.clearUserContext()
      }

      // Criar evento de limpeza
      const cleanupEvent: CleanupEvent = {
        type: 'FORCED_CLEANUP',
        userId,
        userName,
        userDatabase,
        reason: `${reason} - ${contextsCleared} contextos limpos`,
        timestamp: new Date(),
        contextsCleared
      }

      // Registrar evento
      await this.recordCleanupEvent(cleanupEvent)

      // Log de evento de segurança
      await securityEventLogger.logContextCleanup(
        'FORCED',
        userId,
        userName,
        userDatabase,
        undefined,
        reason
      )

      console.log(`[ContextCleanupHandler] Limpeza de usuário concluída: ${contextsCleared} contextos limpos para usuário ${userId}`)

      return cleanupEvent

    } catch (error) {
      console.error('[ContextCleanupHandler] Erro na limpeza de usuário:', error)
      
      const errorEvent: CleanupEvent = {
        type: 'FORCED_CLEANUP',
        userId,
        reason: `Erro na limpeza de usuário: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        contextsCleared: 0
      }

      await this.recordCleanupEvent(errorEvent)
      return errorEvent
    }
  }

  /**
   * Registra evento de limpeza
   */
  private async recordCleanupEvent(event: CleanupEvent): Promise<void> {
    // Adicionar ao histórico
    this.cleanupHistory.push(event)
    
    // Manter apenas os últimos registros
    if (this.cleanupHistory.length > this.MAX_HISTORY) {
      this.cleanupHistory.shift()
    }

    // Atualizar estatísticas
    this.stats.totalCleanups++
    this.stats.contextsCleared += event.contextsCleared
    this.stats.lastCleanup = event.timestamp

    if (!this.stats.cleanupsByType[event.type]) {
      this.stats.cleanupsByType[event.type] = 0
    }
    this.stats.cleanupsByType[event.type]++

    // Calcular média de contextos por limpeza
    this.stats.averageContextsPerCleanup = this.stats.totalCleanups > 0 ? 
      this.stats.contextsCleared / this.stats.totalCleanups : 0
  }

  /**
   * Inicia limpeza automática periódica
   */
  private startAutomaticCleanup(): void {
    if (this.automaticCleanupTimer) {
      clearInterval(this.automaticCleanupTimer)
    }

    // Limpeza automática a cada 10 minutos
    this.automaticCleanupTimer = setInterval(async () => {
      await this.performAutomaticCleanup()
    }, 10 * 60 * 1000)

    console.log('[ContextCleanupHandler] Limpeza automática iniciada (a cada 10 minutos)')
  }

  /**
   * Para limpeza automática
   */
  stopAutomaticCleanup(): void {
    if (this.automaticCleanupTimer) {
      clearInterval(this.automaticCleanupTimer)
      this.automaticCleanupTimer = null
      console.log('[ContextCleanupHandler] Limpeza automática parada')
    }
  }

  /**
   * Obtém histórico de limpezas
   */
  getCleanupHistory(hours: number = 24): CleanupEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.cleanupHistory.filter(event => event.timestamp > cutoff)
  }

  /**
   * Obtém estatísticas de limpeza
   */
  getCleanupStats(): CleanupStats {
    return { ...this.stats }
  }

  /**
   * Obtém limpezas por usuário
   */
  getCleanupsByUser(userId: string, hours: number = 24): CleanupEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.cleanupHistory.filter(event => 
      event.userId === userId && event.timestamp > cutoff
    )
  }

  /**
   * Verifica se usuário teve limpezas recentes
   */
  hasRecentCleanups(userId: string, minutes: number = 30): boolean {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.cleanupHistory.some(event => 
      event.userId === userId && event.timestamp > cutoff
    )
  }

  /**
   * Força limpeza completa de todos os contextos
   */
  async forceCompleteCleanup(reason: string = 'Limpeza completa forçada'): Promise<CleanupEvent> {
    try {
      console.log('[ContextCleanupHandler] Forçando limpeza completa de todos os contextos')

      // Obter estatísticas antes da limpeza
      const activeContexts = userContextManager.listActiveContexts()
      const contextsCount = activeContexts.length

      // Limpar todos os contextos
      userContextManager.clearAllContexts()
      databaseRouter.clearUserContext()

      // Criar evento de limpeza
      const cleanupEvent: CleanupEvent = {
        type: 'FORCED_CLEANUP',
        reason: `${reason} - ${contextsCount} contextos limpos`,
        timestamp: new Date(),
        contextsCleared: contextsCount
      }

      // Registrar evento
      await this.recordCleanupEvent(cleanupEvent)

      // Log de evento de segurança
      await securityEventLogger.logContextCleanup(
        'FORCED',
        undefined,
        undefined,
        undefined,
        undefined,
        `${reason} - limpeza completa`
      )

      console.log(`[ContextCleanupHandler] Limpeza completa concluída: ${contextsCount} contextos limpos`)

      return cleanupEvent

    } catch (error) {
      console.error('[ContextCleanupHandler] Erro na limpeza completa:', error)
      
      const errorEvent: CleanupEvent = {
        type: 'FORCED_CLEANUP',
        reason: `Erro na limpeza completa: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        contextsCleared: 0
      }

      await this.recordCleanupEvent(errorEvent)
      return errorEvent
    }
  }

  /**
   * Limpa histórico de limpezas (para testes)
   */
  clearHistory(): void {
    this.cleanupHistory = []
    this.stats = {
      totalCleanups: 0,
      cleanupsByType: {},
      contextsCleared: 0,
      averageContextsPerCleanup: 0
    }
    console.log('[ContextCleanupHandler] Histórico limpo')
  }

  /**
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    this.stopAutomaticCleanup()
    console.log('[ContextCleanupHandler] Destruído')
  }
}

// Singleton instance
export const contextCleanupHandler = ContextCleanupHandler.getInstance()