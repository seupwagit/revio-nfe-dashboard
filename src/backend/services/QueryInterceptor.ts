/**
 * QueryInterceptor - Interceptador de Consultas
 * 
 * Responsável por interceptar e registrar todas as consultas de banco de dados,
 * garantindo direcionamento automático e prevenindo vazamentos entre clientes
 */

import { UserContext } from '../types/UserContext'
import { databaseRouter } from './DatabaseRouter'
import { apiLogger } from './APILogger'

export interface QueryMetrics {
  database: string
  queryType: 'sql' | 'mongo'
  operation: string
  userId?: string
  executionTime: number
  timestamp: Date
  isAutomaticallyRouted: boolean
  isFallback: boolean
}

export interface DatabaseUsageStats {
  database: string
  totalQueries: number
  sqlQueries: number
  mongoQueries: number
  averageExecutionTime: number
  fallbackUsage: number
  lastAccess: Date
  uniqueUsers: Set<string>
}

export interface QueryValidationResult {
  isValid: boolean
  database: string
  userId?: string
  error?: string
  isAutomaticallyRouted: boolean
}

export class QueryInterceptor {
  private queryMetrics: QueryMetrics[] = []
  private databaseStats: Map<string, DatabaseUsageStats> = new Map()
  private maxMetricsHistory = 10000 // Manter últimas 10k consultas

  /**
   * Intercepta e valida uma consulta SQL antes da execução
   */
  async interceptSqlQuery(
    operation: string,
    queryFunction: () => Promise<any>,
    context?: UserContext
  ): Promise<{ result: any; metrics: QueryMetrics; validation: QueryValidationResult }> {
    const startTime = Date.now()
    const currentContext = context || databaseRouter.getCurrentContext()
    
    // Validar roteamento automático
    const validation = this.validateQueryRouting(currentContext, 'sql')
    
    try {
      // Executar consulta
      const result = await queryFunction()
      const executionTime = Date.now() - startTime
      
      // Registrar métricas
      const metrics = await this.recordQueryMetrics({
        database: validation.database,
        queryType: 'sql',
        operation,
        userId: validation.userId,
        executionTime,
        timestamp: new Date(),
        isAutomaticallyRouted: validation.isAutomaticallyRouted,
        isFallback: databaseRouter.isUsingFallback()
      })

      // Log do direcionamento automático
      await this.logQueryRouting(metrics, validation)

      return { result, metrics, validation }

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      // Registrar erro
      await this.recordQueryError({
        database: validation.database,
        queryType: 'sql',
        operation,
        userId: validation.userId,
        executionTime,
        error: error instanceof Error ? error.message : String(error),
        isAutomaticallyRouted: validation.isAutomaticallyRouted
      })

      throw error
    }
  }

  /**
   * Intercepta e valida uma consulta MongoDB antes da execução
   */
  async interceptMongoQuery(
    operation: string,
    collection: string,
    queryFunction: () => Promise<any>,
    context?: UserContext
  ): Promise<{ result: any; metrics: QueryMetrics; validation: QueryValidationResult }> {
    const startTime = Date.now()
    const currentContext = context || databaseRouter.getCurrentContext()
    
    // Validar roteamento automático
    const validation = this.validateQueryRouting(currentContext, 'mongo')
    
    try {
      // Executar consulta
      const result = await queryFunction()
      const executionTime = Date.now() - startTime
      
      // Registrar métricas
      const metrics = await this.recordQueryMetrics({
        database: validation.database,
        queryType: 'mongo',
        operation: `${operation}:${collection}`,
        userId: validation.userId,
        executionTime,
        timestamp: new Date(),
        isAutomaticallyRouted: validation.isAutomaticallyRouted,
        isFallback: databaseRouter.isUsingFallback()
      })

      // Log do direcionamento automático
      await this.logQueryRouting(metrics, validation)

      return { result, metrics, validation }

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      // Registrar erro
      await this.recordQueryError({
        database: validation.database,
        queryType: 'mongo',
        operation: `${operation}:${collection}`,
        userId: validation.userId,
        executionTime,
        error: error instanceof Error ? error.message : String(error),
        isAutomaticallyRouted: validation.isAutomaticallyRouted
      })

      throw error
    }
  }

  /**
   * Valida se a consulta está sendo roteada automaticamente
   */
  private validateQueryRouting(context: UserContext | null, queryType: 'sql' | 'mongo'): QueryValidationResult {
    try {
      // Verificar se há contexto de usuário
      if (!context) {
        return {
          isValid: true,
          database: 'spedrevio',
          isAutomaticallyRouted: true // Roteamento automático para base global
        }
      }

      // Verificar se a base de dados do contexto é válida
      if (!context.bancoDeDados) {
        return {
          isValid: false,
          database: 'spedrevio',
          userId: context.usrCodigo,
          error: 'Contexto de usuário sem base de dados definida',
          isAutomaticallyRouted: true
        }
      }

      // Validar que não há tentativa de acesso cruzado
      const expectedDatabase = context.bancoDeDados
      const isUsingFallback = databaseRouter.isUsingFallback()
      
      if (isUsingFallback && expectedDatabase !== 'spedrevio') {
        console.warn(`[QueryInterceptor] Fallback detectado: usuário ${context.usrCodigo} esperava ${expectedDatabase} mas usando spedrevio`)
      }

      return {
        isValid: true,
        database: isUsingFallback ? 'spedrevio' : expectedDatabase,
        userId: context.usrCodigo,
        isAutomaticallyRouted: true
      }

    } catch (error) {
      return {
        isValid: false,
        database: 'spedrevio',
        userId: context?.usrCodigo,
        error: `Erro na validação de roteamento: ${error instanceof Error ? error.message : String(error)}`,
        isAutomaticallyRouted: false
      }
    }
  }

  /**
   * Registra métricas de consulta
   */
  private async recordQueryMetrics(metrics: QueryMetrics): Promise<QueryMetrics> {
    try {
      // Adicionar às métricas
      this.queryMetrics.push(metrics)
      
      // Manter apenas as últimas N consultas
      if (this.queryMetrics.length > this.maxMetricsHistory) {
        this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory)
      }

      // Atualizar estatísticas por base de dados
      this.updateDatabaseStats(metrics)

      return metrics

    } catch (error) {
      console.error('[QueryInterceptor] Erro ao registrar métricas:', error)
      return metrics
    }
  }

  /**
   * Atualiza estatísticas por base de dados
   */
  private updateDatabaseStats(metrics: QueryMetrics): void {
    try {
      let stats = this.databaseStats.get(metrics.database)
      
      if (!stats) {
        stats = {
          database: metrics.database,
          totalQueries: 0,
          sqlQueries: 0,
          mongoQueries: 0,
          averageExecutionTime: 0,
          fallbackUsage: 0,
          lastAccess: new Date(),
          uniqueUsers: new Set()
        }
        this.databaseStats.set(metrics.database, stats)
      }

      // Atualizar contadores
      stats.totalQueries++
      if (metrics.queryType === 'sql') {
        stats.sqlQueries++
      } else {
        stats.mongoQueries++
      }

      // Atualizar tempo médio de execução
      stats.averageExecutionTime = (
        (stats.averageExecutionTime * (stats.totalQueries - 1) + metrics.executionTime) / 
        stats.totalQueries
      )

      // Atualizar fallback usage
      if (metrics.isFallback) {
        stats.fallbackUsage++
      }

      // Atualizar último acesso
      stats.lastAccess = metrics.timestamp

      // Adicionar usuário único
      if (metrics.userId) {
        stats.uniqueUsers.add(metrics.userId)
      }

    } catch (error) {
      console.error('[QueryInterceptor] Erro ao atualizar estatísticas:', error)
    }
  }

  /**
   * Registra erro de consulta
   */
  private async recordQueryError(errorData: {
    database: string
    queryType: 'sql' | 'mongo'
    operation: string
    userId?: string
    executionTime: number
    error: string
    isAutomaticallyRouted: boolean
  }): Promise<void> {
    try {
      // Log do erro
      console.error(`[QueryInterceptor] Erro na consulta ${errorData.queryType.toUpperCase()}:`, {
        database: errorData.database,
        operation: errorData.operation,
        userId: errorData.userId,
        error: errorData.error,
        executionTime: errorData.executionTime,
        isAutomaticallyRouted: errorData.isAutomaticallyRouted
      })

      // Registrar no APILogger se disponível
      await apiLogger.logError(
        'system',
        `/query/${errorData.queryType}`,
        `Erro na consulta: ${errorData.error}`,
        errorData.userId ? parseInt(errorData.userId) : undefined,
        undefined,
        {
          database: errorData.database,
          operation: errorData.operation,
          executionTime: errorData.executionTime,
          isAutomaticallyRouted: errorData.isAutomaticallyRouted
        }
      )

    } catch (logError) {
      console.error('[QueryInterceptor] Erro ao registrar erro de consulta:', logError)
    }
  }

  /**
   * Registra log do direcionamento automático de consultas
   */
  private async logQueryRouting(metrics: QueryMetrics, validation: QueryValidationResult): Promise<void> {
    try {
      const routingInfo = {
        database: metrics.database,
        queryType: metrics.queryType,
        operation: metrics.operation,
        userId: metrics.userId,
        executionTime: metrics.executionTime,
        isAutomaticallyRouted: metrics.isAutomaticallyRouted,
        isFallback: metrics.isFallback,
        timestamp: metrics.timestamp.toISOString()
      }

      // Log detalhado para debug
      console.log(`[QueryInterceptor] 🔄 Consulta direcionada automaticamente:`, routingInfo)

      // Registrar no APILogger para auditoria
      await apiLogger.logRequest({
        ip: 'system',
        caminhoAcessado: `/query/${metrics.queryType}`,
        mensagem: `Consulta direcionada automaticamente para ${metrics.database}`,
        usrCodigo: metrics.userId ? parseInt(metrics.userId) : undefined,
        tipo: 'QUERY_ROUTING',
        databaseUsed: metrics.database,
        isFallback: metrics.isFallback,
        executionTime: metrics.executionTime,
        queryOperation: metrics.operation
      })

    } catch (error) {
      console.error('[QueryInterceptor] Erro ao registrar log de roteamento:', error)
    }
  }

  /**
   * Obtém métricas de uso por base de dados
   */
  getDatabaseUsageStats(): Map<string, DatabaseUsageStats> {
    // Converter Set para array para serialização
    const stats = new Map<string, any>()
    
    for (const [database, stat] of this.databaseStats) {
      stats.set(database, {
        ...stat,
        uniqueUsers: Array.from(stat.uniqueUsers),
        uniqueUserCount: stat.uniqueUsers.size
      })
    }
    
    return stats
  }

  /**
   * Obtém métricas recentes de consultas
   */
  getRecentQueryMetrics(limit: number = 100): QueryMetrics[] {
    return this.queryMetrics.slice(-limit)
  }

  /**
   * Verifica se há vazamentos entre bases de clientes
   */
  detectDataLeakage(): {
    hasLeakage: boolean
    suspiciousActivities: Array<{
      userId: string
      expectedDatabase: string
      actualDatabase: string
      queryCount: number
      lastOccurrence: Date
    }>
  } {
    const suspiciousActivities: Array<{
      userId: string
      expectedDatabase: string
      actualDatabase: string
      queryCount: number
      lastOccurrence: Date
    }> = []

    try {
      // Analisar métricas recentes para detectar padrões suspeitos
      const recentMetrics = this.getRecentQueryMetrics(1000)
      const userDatabaseMap = new Map<string, Map<string, { count: number; lastAccess: Date }>>()

      // Agrupar consultas por usuário e base de dados
      for (const metric of recentMetrics) {
        if (!metric.userId) continue

        if (!userDatabaseMap.has(metric.userId)) {
          userDatabaseMap.set(metric.userId, new Map())
        }

        const userDatabases = userDatabaseMap.get(metric.userId)!
        const existing = userDatabases.get(metric.database) || { count: 0, lastAccess: new Date(0) }
        
        userDatabases.set(metric.database, {
          count: existing.count + 1,
          lastAccess: metric.timestamp > existing.lastAccess ? metric.timestamp : existing.lastAccess
        })
      }

      // Detectar usuários acessando múltiplas bases
      for (const [userId, databases] of userDatabaseMap) {
        if (databases.size > 1) {
          // Usuário acessou múltiplas bases - pode ser suspeito
          for (const [database, stats] of databases) {
            if (database !== 'spedrevio') { // Ignorar base global
              suspiciousActivities.push({
                userId,
                expectedDatabase: 'unknown', // Seria necessário contexto adicional
                actualDatabase: database,
                queryCount: stats.count,
                lastOccurrence: stats.lastAccess
              })
            }
          }
        }
      }

      return {
        hasLeakage: suspiciousActivities.length > 0,
        suspiciousActivities
      }

    } catch (error) {
      console.error('[QueryInterceptor] Erro ao detectar vazamentos:', error)
      return {
        hasLeakage: false,
        suspiciousActivities: []
      }
    }
  }

  /**
   * Limpa métricas antigas
   */
  cleanupOldMetrics(olderThanHours: number = 24): void {
    try {
      const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000))
      
      // Limpar métricas de consulta
      this.queryMetrics = this.queryMetrics.filter(metric => metric.timestamp > cutoffTime)
      
      console.log(`[QueryInterceptor] Limpeza concluída: mantidas ${this.queryMetrics.length} métricas`)

    } catch (error) {
      console.error('[QueryInterceptor] Erro na limpeza de métricas:', error)
    }
  }

  /**
   * Obtém relatório de direcionamento automático
   */
  getAutomaticRoutingReport(): {
    totalQueries: number
    automaticallyRouted: number
    fallbackUsage: number
    databaseDistribution: Record<string, number>
    averageExecutionTime: number
    routingEfficiency: number
  } {
    try {
      const totalQueries = this.queryMetrics.length
      const automaticallyRouted = this.queryMetrics.filter(m => m.isAutomaticallyRouted).length
      const fallbackUsage = this.queryMetrics.filter(m => m.isFallback).length
      
      const databaseDistribution: Record<string, number> = {}
      let totalExecutionTime = 0

      for (const metric of this.queryMetrics) {
        databaseDistribution[metric.database] = (databaseDistribution[metric.database] || 0) + 1
        totalExecutionTime += metric.executionTime
      }

      const averageExecutionTime = totalQueries > 0 ? totalExecutionTime / totalQueries : 0
      const routingEfficiency = totalQueries > 0 ? (automaticallyRouted / totalQueries) * 100 : 0

      return {
        totalQueries,
        automaticallyRouted,
        fallbackUsage,
        databaseDistribution,
        averageExecutionTime,
        routingEfficiency
      }

    } catch (error) {
      console.error('[QueryInterceptor] Erro ao gerar relatório:', error)
      return {
        totalQueries: 0,
        automaticallyRouted: 0,
        fallbackUsage: 0,
        databaseDistribution: {},
        averageExecutionTime: 0,
        routingEfficiency: 0
      }
    }
  }
}

// Singleton instance
export const queryInterceptor = new QueryInterceptor()