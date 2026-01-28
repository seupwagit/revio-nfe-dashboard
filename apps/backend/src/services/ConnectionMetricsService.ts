/**
 * ConnectionMetricsService - Serviço de Métricas de Conexão
 * 
 * Coleta e armazena métricas detalhadas sobre uso de conexões,
 * fallbacks e performance do sistema de roteamento
 */

import { UserContext } from '../types/UserContext'
import { apiLogger } from './APILogger'

export interface ConnectionMetric {
  timestamp: Date
  database: string
  type: 'sql' | 'mongo'
  operation: 'connect' | 'disconnect' | 'fallback' | 'error' | 'recovery'
  userId?: string
  responseTime?: number
  error?: string
  metadata?: Record<string, any>
}

export interface DatabaseUsageStats {
  database: string
  totalConnections: number
  successfulConnections: number
  failedConnections: number
  fallbackUsage: number
  averageResponseTime: number
  lastUsed: Date
  activeUsers: Set<string>
}

export interface SystemMetrics {
  totalConnections: number
  totalFallbacks: number
  totalErrors: number
  averageResponseTime: number
  uptime: number
  activeConnections: number
  activeDatabases: number
  activeUsers: number
}

export class ConnectionMetricsService {
  private metrics: ConnectionMetric[] = []
  private databaseStats: Map<string, DatabaseUsageStats> = new Map()
  private systemStartTime: Date = new Date()
  private maxMetricsHistory: number = 10000 // Manter últimas 10k métricas

  constructor() {
    // Limpeza automática a cada hora
    setInterval(() => {
      this.cleanupOldMetrics()
    }, 60 * 60 * 1000)

    console.log('[ConnectionMetricsService] Inicializado')
  }

  /**
   * Registra uma métrica de conexão
   */
  async recordMetric(
    database: string,
    type: 'sql' | 'mongo',
    operation: 'connect' | 'disconnect' | 'fallback' | 'error' | 'recovery',
    userContext?: UserContext,
    responseTime?: number,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const metric: ConnectionMetric = {
        timestamp: new Date(),
        database,
        type,
        operation,
        userId: userContext?.usrCodigo,
        responseTime,
        error,
        metadata
      }

      // Adicionar à lista de métricas
      this.metrics.push(metric)

      // Atualizar estatísticas da base
      this.updateDatabaseStats(database, operation, userContext?.usrCodigo, responseTime)

      // Log da métrica
      await this.logMetric(metric)

      // Limitar tamanho do histórico
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory)
      }

    } catch (error) {
      console.error('[ConnectionMetricsService] Erro ao registrar métrica:', error)
    }
  }

  /**
   * Obtém estatísticas de uma base específica
   */
  getDatabaseStats(database: string): DatabaseUsageStats | null {
    return this.databaseStats.get(database) || null
  }

  /**
   * Obtém estatísticas de todas as bases
   */
  getAllDatabaseStats(): Map<string, DatabaseUsageStats> {
    return new Map(this.databaseStats)
  }

  /**
   * Obtém métricas do sistema
   */
  getSystemMetrics(): SystemMetrics {
    const now = new Date()
    const uptime = now.getTime() - this.systemStartTime.getTime()

    // Calcular estatísticas dos últimos dados
    const recentMetrics = this.metrics.filter(m => 
      now.getTime() - m.timestamp.getTime() < 60 * 60 * 1000 // Última hora
    )

    const totalConnections = recentMetrics.filter(m => m.operation === 'connect').length
    const totalFallbacks = recentMetrics.filter(m => m.operation === 'fallback').length
    const totalErrors = recentMetrics.filter(m => m.operation === 'error').length

    const responseTimes = recentMetrics
      .filter(m => m.responseTime !== undefined)
      .map(m => m.responseTime!)

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    // Contar bases e usuários ativos
    const activeDatabases = new Set(recentMetrics.map(m => m.database)).size
    const activeUsers = new Set(recentMetrics.filter(m => m.userId).map(m => m.userId)).size

    return {
      totalConnections,
      totalFallbacks,
      totalErrors,
      averageResponseTime,
      uptime,
      activeConnections: this.getActiveConnectionsCount(),
      activeDatabases,
      activeUsers
    }
  }

  /**
   * Obtém métricas filtradas por período
   */
  getMetricsByPeriod(
    startDate: Date,
    endDate: Date,
    database?: string,
    operation?: string
  ): ConnectionMetric[] {
    return this.metrics.filter(metric => {
      const inPeriod = metric.timestamp >= startDate && metric.timestamp <= endDate
      const matchesDatabase = !database || metric.database === database
      const matchesOperation = !operation || metric.operation === operation
      
      return inPeriod && matchesDatabase && matchesOperation
    })
  }

  /**
   * Obtém top bases por uso
   */
  getTopDatabasesByUsage(limit: number = 10): Array<{
    database: string
    totalConnections: number
    successRate: number
    averageResponseTime: number
  }> {
    const stats = Array.from(this.databaseStats.entries())
      .map(([database, stats]) => ({
        database,
        totalConnections: stats.totalConnections,
        successRate: stats.totalConnections > 0 
          ? (stats.successfulConnections / stats.totalConnections) * 100 
          : 0,
        averageResponseTime: stats.averageResponseTime
      }))
      .sort((a, b) => b.totalConnections - a.totalConnections)
      .slice(0, limit)

    return stats
  }

  /**
   * Obtém relatório de fallbacks
   */
  getFallbackReport(hours: number = 24): {
    totalFallbacks: number
    fallbacksByDatabase: Map<string, number>
    fallbacksByHour: Map<string, number>
    topReasons: Array<{ reason: string; count: number }>
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    const fallbackMetrics = this.metrics.filter(m => 
      m.operation === 'fallback' && m.timestamp >= cutoff
    )

    const fallbacksByDatabase = new Map<string, number>()
    const fallbacksByHour = new Map<string, number>()
    const reasonCounts = new Map<string, number>()

    for (const metric of fallbackMetrics) {
      // Por base
      const dbCount = fallbacksByDatabase.get(metric.database) || 0
      fallbacksByDatabase.set(metric.database, dbCount + 1)

      // Por hora
      const hour = metric.timestamp.toISOString().substring(0, 13) // YYYY-MM-DDTHH
      const hourCount = fallbacksByHour.get(hour) || 0
      fallbacksByHour.set(hour, hourCount + 1)

      // Por razão
      const reason = metric.error || 'Razão não especificada'
      const reasonCount = reasonCounts.get(reason) || 0
      reasonCounts.set(reason, reasonCount + 1)
    }

    const topReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalFallbacks: fallbackMetrics.length,
      fallbacksByDatabase,
      fallbacksByHour,
      topReasons
    }
  }

  /**
   * Obtém relatório de performance
   */
  getPerformanceReport(): {
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    slowestDatabases: Array<{ database: string; averageTime: number }>
    errorRate: number
  } {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp.getTime() < 60 * 60 * 1000 // Última hora
    )

    const responseTimes = recentMetrics
      .filter(m => m.responseTime !== undefined)
      .map(m => m.responseTime!)
      .sort((a, b) => a - b)

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    const p95Index = Math.floor(responseTimes.length * 0.95)
    const p99Index = Math.floor(responseTimes.length * 0.99)
    
    const p95ResponseTime = responseTimes[p95Index] || 0
    const p99ResponseTime = responseTimes[p99Index] || 0

    // Bases mais lentas
    const databaseTimes = new Map<string, number[]>()
    for (const metric of recentMetrics) {
      if (metric.responseTime !== undefined) {
        const times = databaseTimes.get(metric.database) || []
        times.push(metric.responseTime)
        databaseTimes.set(metric.database, times)
      }
    }

    const slowestDatabases = Array.from(databaseTimes.entries())
      .map(([database, times]) => ({
        database,
        averageTime: times.reduce((a, b) => a + b, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5)

    // Taxa de erro
    const totalOperations = recentMetrics.length
    const errorOperations = recentMetrics.filter(m => m.operation === 'error').length
    const errorRate = totalOperations > 0 ? (errorOperations / totalOperations) * 100 : 0

    return {
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      slowestDatabases,
      errorRate
    }
  }

  /**
   * Exporta métricas para análise
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'database', 'type', 'operation', 'userId', 'responseTime', 'error']
      const rows = this.metrics.map(m => [
        m.timestamp.toISOString(),
        m.database,
        m.type,
        m.operation,
        m.userId || '',
        m.responseTime?.toString() || '',
        m.error || ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(this.metrics, null, 2)
  }

  /**
   * Atualiza estatísticas de uma base
   */
  private updateDatabaseStats(
    database: string,
    operation: string,
    userId?: string,
    responseTime?: number
  ): void {
    let stats = this.databaseStats.get(database)
    
    if (!stats) {
      stats = {
        database,
        totalConnections: 0,
        successfulConnections: 0,
        failedConnections: 0,
        fallbackUsage: 0,
        averageResponseTime: 0,
        lastUsed: new Date(),
        activeUsers: new Set()
      }
      this.databaseStats.set(database, stats)
    }

    // Atualizar contadores
    switch (operation) {
      case 'connect':
        stats.totalConnections++
        stats.successfulConnections++
        break
      case 'error':
        stats.totalConnections++
        stats.failedConnections++
        break
      case 'fallback':
        stats.fallbackUsage++
        break
    }

    // Atualizar tempo de resposta médio
    if (responseTime !== undefined) {
      const totalTime = stats.averageResponseTime * (stats.totalConnections - 1) + responseTime
      stats.averageResponseTime = totalTime / stats.totalConnections
    }

    // Atualizar usuários ativos
    if (userId) {
      stats.activeUsers.add(userId)
    }

    stats.lastUsed = new Date()
  }

  /**
   * Registra métrica no log
   */
  private async logMetric(metric: ConnectionMetric): Promise<void> {
    try {
      const message = `Connection metric: ${metric.operation} on ${metric.database} (${metric.type})${
        metric.responseTime ? ` - ${metric.responseTime}ms` : ''
      }${metric.error ? ` - Error: ${metric.error}` : ''}`

      if (metric.operation === 'error') {
        await apiLogger.logError('system', '/metrics', message)
      } else {
        await apiLogger.logSuccess('system', '/metrics', message)
      }

    } catch (error) {
      console.error('[ConnectionMetricsService] Erro ao registrar log da métrica:', error)
    }
  }

  /**
   * Obtém contagem de conexões ativas
   */
  private getActiveConnectionsCount(): number {
    // Contar conexões ativas baseado nas métricas recentes
    const recentConnects = this.metrics.filter(m => 
      m.operation === 'connect' && 
      Date.now() - m.timestamp.getTime() < 5 * 60 * 1000 // Últimos 5 minutos
    )

    const recentDisconnects = this.metrics.filter(m => 
      m.operation === 'disconnect' && 
      Date.now() - m.timestamp.getTime() < 5 * 60 * 1000
    )

    return Math.max(0, recentConnects.length - recentDisconnects.length)
  }

  /**
   * Limpa métricas antigas
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 dias
    const originalLength = this.metrics.length
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)
    
    const cleaned = originalLength - this.metrics.length
    if (cleaned > 0) {
      console.log(`[ConnectionMetricsService] Limpeza: ${cleaned} métricas antigas removidas`)
    }

    // Limpar usuários ativos antigos das estatísticas
    for (const stats of this.databaseStats.values()) {
      // Resetar usuários ativos (serão repovoados pelas métricas recentes)
      stats.activeUsers.clear()
    }
  }

  /**
   * Reseta todas as métricas
   */
  reset(): void {
    this.metrics = []
    this.databaseStats.clear()
    this.systemStartTime = new Date()
    console.log('[ConnectionMetricsService] Métricas resetadas')
  }

  /**
   * Obtém resumo executivo
   */
  getExecutiveSummary(): {
    systemHealth: 'healthy' | 'degraded' | 'critical'
    totalDatabases: number
    fallbackRate: number
    averageResponseTime: number
    errorRate: number
    uptime: string
  } {
    const systemMetrics = this.getSystemMetrics()
    const performanceReport = this.getPerformanceReport()
    
    // Determinar saúde do sistema
    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (performanceReport.errorRate > 10 || systemMetrics.totalFallbacks > systemMetrics.totalConnections * 0.3) {
      systemHealth = 'critical'
    } else if (performanceReport.errorRate > 5 || systemMetrics.totalFallbacks > systemMetrics.totalConnections * 0.1) {
      systemHealth = 'degraded'
    }

    const fallbackRate = systemMetrics.totalConnections > 0 
      ? (systemMetrics.totalFallbacks / systemMetrics.totalConnections) * 100 
      : 0

    const uptimeHours = Math.floor(systemMetrics.uptime / (1000 * 60 * 60))
    const uptimeMinutes = Math.floor((systemMetrics.uptime % (1000 * 60 * 60)) / (1000 * 60))
    const uptime = `${uptimeHours}h ${uptimeMinutes}m`

    return {
      systemHealth,
      totalDatabases: systemMetrics.activeDatabases,
      fallbackRate,
      averageResponseTime: performanceReport.averageResponseTime,
      errorRate: performanceReport.errorRate,
      uptime
    }
  }
}

// Singleton instance
export const connectionMetricsService = new ConnectionMetricsService()