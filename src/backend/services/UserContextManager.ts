/**
 * UserContextManager - Gerenciador de Contexto de Usuário
 * 
 * Singleton responsável por gerenciar contextos de usuário por requisição,
 * garantindo isolamento e limpeza automática
 */

import { UserContext, DatabaseContext, StoredContext, ContextMetrics, ContextError } from '../types/UserContext'
import { PrismaClient } from '@prisma/client'
import mongoose from 'mongoose'

export class UserContextManager {
  private static instance: UserContextManager
  private contextStore: Map<string, StoredContext> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private metrics: ContextMetrics = {
    activeContexts: 0,
    totalContextsCreated: 0,
    averageLifetime: 0,
    memoryUsage: 0
  }

  private constructor() {
    // Iniciar limpeza automática a cada 5 minutos
    this.startCleanupTimer()
    
    console.log('[UserContextManager] Inicializado com limpeza automática')
  }

  /**
   * Obtém a instância singleton
   */
  static getInstance(): UserContextManager {
    if (!UserContextManager.instance) {
      UserContextManager.instance = new UserContextManager()
    }
    return UserContextManager.instance
  }

  /**
   * Define o contexto para uma requisição
   */
  setContext(requestId: string, context: DatabaseContext): void {
    try {
      if (!requestId) {
        throw new ContextError('INVALID_DATABASE', 'Request ID é obrigatório')
      }

      if (!context.userContext) {
        throw new ContextError('CONTEXT_CORRUPTED', 'UserContext é obrigatório')
      }

      // Verificar se já existe contexto para esta requisição
      if (this.contextStore.has(requestId)) {
        console.warn(`[UserContextManager] Sobrescrevendo contexto existente para requisição: ${requestId}`)
        this.clearContext(requestId)
      }

      const storedContext: StoredContext = {
        requestId,
        userContext: context.userContext,
        createdAt: new Date(),
        lastAccessed: new Date(),
        sqlConnection: context.sqlConnection || undefined,
        mongoConnection: context.mongoConnection || undefined
      }

      this.contextStore.set(requestId, storedContext)
      this.updateMetrics()

      console.log(`[UserContextManager] Contexto definido para usuário ${context.userContext.usrNome} (${context.userContext.bancoDeDados}) - Request: ${requestId}`)

    } catch (error) {
      console.error('[UserContextManager] Erro ao definir contexto:', error)
      throw error
    }
  }

  /**
   * Obtém o contexto de uma requisição
   */
  getContext(requestId: string): DatabaseContext | null {
    try {
      if (!requestId) {
        return null
      }

      const storedContext = this.contextStore.get(requestId)
      if (!storedContext) {
        return null
      }

      // Atualizar último acesso
      storedContext.lastAccessed = new Date()

      const context: DatabaseContext = {
        userContext: storedContext.userContext,
        sqlConnection: storedContext.sqlConnection || null,
        mongoConnection: storedContext.mongoConnection || null
      }

      return context

    } catch (error) {
      console.error('[UserContextManager] Erro ao obter contexto:', error)
      return null
    }
  }

  /**
   * Limpa o contexto de uma requisição
   */
  clearContext(requestId: string): void {
    try {
      if (!requestId) {
        return
      }

      const storedContext = this.contextStore.get(requestId)
      if (storedContext) {
        // Fechar conexões se existirem
        if (storedContext.sqlConnection) {
          try {
            storedContext.sqlConnection.$disconnect()
          } catch (error) {
            console.warn('[UserContextManager] Erro ao fechar conexão SQL:', error)
          }
        }

        this.contextStore.delete(requestId)
        this.updateMetrics()

        console.log(`[UserContextManager] Contexto limpo para usuário ${storedContext.userContext.usrNome} - Request: ${requestId}`)
      }

    } catch (error) {
      console.error('[UserContextManager] Erro ao limpar contexto:', error)
    }
  }

  /**
   * Verifica se existe contexto para uma requisição
   */
  hasContext(requestId: string): boolean {
    return this.contextStore.has(requestId)
  }

  /**
   * Obtém o contexto do usuário atual (baseado no thread local)
   */
  getCurrentContext(): DatabaseContext | null {
    // Para implementação futura com AsyncLocalStorage
    // Por enquanto, retorna null - será usado pelo middleware
    return null
  }

  /**
   * Obtém contexto por ID de requisição com validação de isolamento
   */
  getContextWithIsolationCheck(requestId: string, expectedUserId?: string): DatabaseContext | null {
    try {
      const context = this.getContext(requestId)
      
      if (!context) {
        return null
      }

      // Verificar isolamento se ID de usuário esperado foi fornecido
      if (expectedUserId && context.userContext) {
        if (context.userContext.usrCodigo !== expectedUserId) {
          console.error(`[UserContextManager] VIOLAÇÃO DE ISOLAMENTO: Usuário esperado ${expectedUserId}, encontrado ${context.userContext.usrCodigo} (Request: ${requestId})`)
          
          // Log de evento de segurança crítico
          this.logSecurityViolation('ISOLATION_VIOLATION', requestId, context.userContext.usrCodigo, expectedUserId)
          
          return null
        }
      }

      return context

    } catch (error) {
      console.error('[UserContextManager] Erro na verificação de isolamento:', error)
      return null
    }
  }

  /**
   * Valida que não há vazamento de contexto entre usuários
   */
  validateUserIsolation(): { valid: boolean; violations: Array<{ requestId: string; issue: string }> } {
    const violations: Array<{ requestId: string; issue: string }> = []
    const userDatabases = new Map<string, string[]>()

    // Agrupar contextos por usuário
    for (const [requestId, context] of this.contextStore.entries()) {
      if (context.userContext) {
        const userId = context.userContext.usrCodigo
        const database = context.userContext.bancoDeDados
        
        if (!userDatabases.has(userId)) {
          userDatabases.set(userId, [])
        }
        userDatabases.get(userId)!.push(database)
      }
    }

    // Verificar se usuários têm bases consistentes
    for (const [userId, databases] of userDatabases.entries()) {
      const uniqueDatabases = [...new Set(databases)]
      
      if (uniqueDatabases.length > 1) {
        violations.push({
          requestId: 'multiple',
          issue: `Usuário ${userId} tem contextos com bases diferentes: ${uniqueDatabases.join(', ')}`
        })
      }
    }

    // Verificar contextos órfãos (muito antigos)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    for (const [requestId, context] of this.contextStore.entries()) {
      if (context.createdAt < oneHourAgo) {
        violations.push({
          requestId,
          issue: `Contexto órfão detectado - criado há ${Math.round((Date.now() - context.createdAt.getTime()) / 60000)} minutos`
        })
      }
    }

    return {
      valid: violations.length === 0,
      violations
    }
  }

  /**
   * Força limpeza de contextos de um usuário específico
   */
  clearUserContexts(userId: string): number {
    let cleared = 0
    
    for (const [requestId, context] of this.contextStore.entries()) {
      if (context.userContext && context.userContext.usrCodigo === userId) {
        this.clearContext(requestId)
        cleared++
      }
    }

    if (cleared > 0) {
      console.log(`[UserContextManager] Contextos limpos para usuário ${userId}: ${cleared} contextos`)
    }

    return cleared
  }

  /**
   * Obtém estatísticas de isolamento
   */
  getIsolationStats(): {
    totalUsers: number
    contextsPerUser: Map<string, number>
    averageContextsPerUser: number
    potentialLeaks: number
  } {
    const contextsPerUser = new Map<string, number>()
    let potentialLeaks = 0

    for (const context of this.contextStore.values()) {
      if (context.userContext) {
        const userId = context.userContext.usrCodigo
        contextsPerUser.set(userId, (contextsPerUser.get(userId) || 0) + 1)
      }
    }

    // Detectar potenciais vazamentos (usuários com muitos contextos)
    for (const count of contextsPerUser.values()) {
      if (count > 5) { // Mais de 5 contextos simultâneos pode indicar vazamento
        potentialLeaks++
      }
    }

    const totalUsers = contextsPerUser.size
    const totalContexts = Array.from(contextsPerUser.values()).reduce((sum, count) => sum + count, 0)
    const averageContextsPerUser = totalUsers > 0 ? totalContexts / totalUsers : 0

    return {
      totalUsers,
      contextsPerUser,
      averageContextsPerUser,
      potentialLeaks
    }
  }

  /**
   * Obtém métricas do gerenciador
   */
  getMetrics(): ContextMetrics {
    this.updateMetrics()
    return { ...this.metrics }
  }

  /**
   * Limpa contextos antigos (mais de 1 hora)
   */
  cleanupOldContexts(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    let cleaned = 0

    for (const [requestId, context] of this.contextStore.entries()) {
      if (context.lastAccessed < oneHourAgo) {
        this.clearContext(requestId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[UserContextManager] Limpeza automática: ${cleaned} contextos removidos`)
    }

    return cleaned
  }

  /**
   * Força limpeza de todos os contextos
   */
  clearAllContexts(): void {
    const count = this.contextStore.size
    
    for (const requestId of this.contextStore.keys()) {
      this.clearContext(requestId)
    }

    console.log(`[UserContextManager] Todos os contextos limpos: ${count} contextos removidos`)
  }

  /**
   * Lista todos os contextos ativos (para debug)
   */
  listActiveContexts(): Array<{ requestId: string; user: string; database: string; age: number }> {
    const now = new Date()
    const contexts: Array<{ requestId: string; user: string; database: string; age: number }> = []

    for (const [requestId, context] of this.contextStore.entries()) {
      contexts.push({
        requestId,
        user: context.userContext.usrNome,
        database: context.userContext.bancoDeDados,
        age: now.getTime() - context.createdAt.getTime()
      })
    }

    return contexts.sort((a, b) => b.age - a.age)
  }

  /**
   * Inicia o timer de limpeza automática
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // Limpeza a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldContexts()
    }, 5 * 60 * 1000)
  }

  /**
   * Para o timer de limpeza automática
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Atualiza métricas internas
   */
  private updateMetrics(): void {
    const now = new Date()
    let totalLifetime = 0

    for (const context of this.contextStore.values()) {
      totalLifetime += now.getTime() - context.createdAt.getTime()
    }

    this.metrics = {
      activeContexts: this.contextStore.size,
      totalContextsCreated: this.metrics.totalContextsCreated + (this.contextStore.size > this.metrics.activeContexts ? 1 : 0),
      averageLifetime: this.contextStore.size > 0 ? totalLifetime / this.contextStore.size : 0,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * Estima uso de memória (aproximado)
   */
  private estimateMemoryUsage(): number {
    // Estimativa aproximada: 1KB por contexto
    return this.contextStore.size * 1024
  }

  /**
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.clearAllContexts()
    console.log('[UserContextManager] Destruído')
  }

  /**
   * Log de violação de segurança
   */
  private logSecurityViolation(type: string, requestId: string, actualUserId: string, expectedUserId: string): void {
    try {
      // Para evitar dependência circular, usar console.error por enquanto
      // Em implementação futura, usar securityEventLogger
      console.error(`[UserContextManager] VIOLAÇÃO DE SEGURANÇA: ${type}`, {
        requestId,
        actualUserId,
        expectedUserId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('[UserContextManager] Erro ao registrar violação de segurança:', error)
    }
  }
}

// Singleton instance
export const userContextManager = UserContextManager.getInstance()