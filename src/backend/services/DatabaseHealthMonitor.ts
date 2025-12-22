/**
 * DatabaseHealthMonitor - Monitor de Saúde das Bases de Dados
 * 
 * Responsável por monitorar a saúde das conexões SQL Server e MongoDB,
 * implementando circuit breakers e notificações de fallback
 */

import { PrismaClient } from '@prisma/client'
import mongoose from 'mongoose'
import { databaseRouter } from './DatabaseRouter'
import { apiLogger } from './APILogger'
import { fallbackNotificationService } from './FallbackNotificationService'

export interface HealthStatus {
  sql: {
    global: boolean
    clients: Map<string, boolean>
  }
  mongo: {
    global: boolean
    clients: Map<string, boolean>
  }
  lastCheck: Date
}

export interface HealthCheckResult {
  database: string
  type: 'sql' | 'mongo'
  healthy: boolean
  responseTime: number
  error?: string
}

export class DatabaseHealthMonitor {
  private healthStatus: HealthStatus
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring: boolean = false
  private healthCheckInterval: number = 30000 // 30 segundos
  private maxResponseTime: number = 5000 // 5 segundos
  private retryAttempts: number = 3
  private retryDelay: number = 1000 // 1 segundo

  constructor() {
    this.healthStatus = {
      sql: {
        global: true,
        clients: new Map()
      },
      mongo: {
        global: true,
        clients: new Map()
      },
      lastCheck: new Date()
    }

    console.log('[DatabaseHealthMonitor] Inicializado')
  }

  /**
   * Inicia o monitoramento automático
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('[DatabaseHealthMonitor] Monitoramento já está ativo')
      return
    }

    this.isMonitoring = true
    
    // Fazer verificação inicial
    this.performHealthCheck()

    // Configurar verificações periódicas
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.healthCheckInterval)

    console.log(`[DatabaseHealthMonitor] Monitoramento iniciado (intervalo: ${this.healthCheckInterval}ms)`)
  }

  /**
   * Para o monitoramento automático
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.isMonitoring = false
    console.log('[DatabaseHealthMonitor] Monitoramento parado')
  }

  /**
   * Verifica a saúde de uma base SQL Server específica
   */
  async checkSqlHealth(database: string): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      const connection = await databaseRouter.getSqlConnection(database)
      if (!connection) {
        throw new Error('Conexão não disponível')
      }

      // Fazer uma consulta simples para testar a conexão
      await connection.$queryRaw`SELECT 1 as test`
      
      const responseTime = Date.now() - startTime
      const healthy = responseTime < this.maxResponseTime

      // Atualizar status
      const wasUnhealthy = this.healthStatus.sql.clients.get(database) === false
      this.healthStatus.sql.clients.set(database, healthy)
      
      // Se a base estava não saudável e agora está saudável, tentar reconectar
      if (wasUnhealthy && healthy) {
        await this.attemptReconnection(database, 'sql')
      }
      
      // Log resultado
      const result: HealthCheckResult = {
        database,
        type: 'sql',
        healthy,
        responseTime,
        error: healthy ? undefined : 'Tempo de resposta muito alto'
      }

      await this.logHealthCheck(result)
      
      return healthy

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Atualizar status
      this.healthStatus.sql.clients.set(database, false)
      
      // Log erro
      const result: HealthCheckResult = {
        database,
        type: 'sql',
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      }

      await this.logHealthCheck(result)
      
      console.error(`[DatabaseHealthMonitor] SQL health check falhou para ${database}:`, error)
      return false
    }
  }

  /**
   * Verifica a saúde de uma base MongoDB específica
   */
  async checkMongoHealth(database: string): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      const connection = await databaseRouter.getMongoConnection(database)
      
      // Fazer uma operação simples para testar a conexão
      if (!connection.db) {
        throw new Error('Database não disponível na conexão')
      }
      
      await connection.db.admin().ping()
      
      const responseTime = Date.now() - startTime
      const healthy = responseTime < this.maxResponseTime

      // Atualizar status
      const wasUnhealthy = this.healthStatus.mongo.clients.get(database) === false
      this.healthStatus.mongo.clients.set(database, healthy)
      
      // Se a base estava não saudável e agora está saudável, tentar reconectar
      if (wasUnhealthy && healthy) {
        await this.attemptReconnection(database, 'mongo')
      }
      
      // Log resultado
      const result: HealthCheckResult = {
        database,
        type: 'mongo',
        healthy,
        responseTime,
        error: healthy ? undefined : 'Tempo de resposta muito alto'
      }

      await this.logHealthCheck(result)
      
      return healthy

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Atualizar status
      this.healthStatus.mongo.clients.set(database, false)
      
      // Log erro
      const result: HealthCheckResult = {
        database,
        type: 'mongo',
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      }

      await this.logHealthCheck(result)
      
      console.error(`[DatabaseHealthMonitor] MongoDB health check falhou para ${database}:`, error)
      return false
    }
  }

  /**
   * Obtém o status de saúde atual
   */
  async getHealthStatus(): Promise<HealthStatus> {
    // Atualizar timestamp
    this.healthStatus.lastCheck = new Date()
    
    // Retornar cópia do status
    return {
      sql: {
        global: this.healthStatus.sql.global,
        clients: new Map(this.healthStatus.sql.clients)
      },
      mongo: {
        global: this.healthStatus.mongo.global,
        clients: new Map(this.healthStatus.mongo.clients)
      },
      lastCheck: this.healthStatus.lastCheck
    }
  }

  /**
   * Verifica se uma base específica está saudável
   */
  isDatabaseHealthy(database: string, type: 'sql' | 'mongo'): boolean {
    if (type === 'sql') {
      return this.healthStatus.sql.clients.get(database) ?? false
    } else {
      return this.healthStatus.mongo.clients.get(database) ?? false
    }
  }

  /**
   * Força uma verificação de saúde para uma base específica
   */
  async forceHealthCheck(database: string, type: 'sql' | 'mongo'): Promise<boolean> {
    if (type === 'sql') {
      return await this.checkSqlHealth(database)
    } else {
      return await this.checkMongoHealth(database)
    }
  }

  /**
   * Executa verificação de saúde completa
   */
  private async performHealthCheck(): Promise<void> {
    try {
      console.log('[DatabaseHealthMonitor] Executando verificação de saúde...')
      
      // Verificar base global SQL
      await this.checkGlobalSqlHealth()
      
      // Verificar base global MongoDB
      await this.checkGlobalMongoHealth()
      
      // Verificar bases de clientes ativas
      const activeConnections = databaseRouter.getActiveConnections()
      
      for (const database of activeConnections) {
        if (database !== 'spedrevio') { // Pular base global
          await this.checkSqlHealth(database)
          await this.checkMongoHealth(database)
        }
      }

      // Atualizar timestamp
      this.healthStatus.lastCheck = new Date()
      
      console.log('[DatabaseHealthMonitor] Verificação de saúde concluída')

    } catch (error) {
      console.error('[DatabaseHealthMonitor] Erro na verificação de saúde:', error)
    }
  }

  /**
   * Verifica saúde da base SQL global
   */
  private async checkGlobalSqlHealth(): Promise<void> {
    try {
      const connection = databaseRouter.getGlobalSqlConnection()
      if (connection) {
        await connection.$queryRaw`SELECT 1 as test`
        this.healthStatus.sql.global = true
      } else {
        this.healthStatus.sql.global = false
      }
    } catch (error) {
      this.healthStatus.sql.global = false
      console.error('[DatabaseHealthMonitor] Base SQL global não saudável:', error)
    }
  }

  /**
   * Verifica saúde da base MongoDB global
   */
  private async checkGlobalMongoHealth(): Promise<void> {
    try {
      if (!mongoose.connection.db) {
        throw new Error('MongoDB global não conectado')
      }
      
      await mongoose.connection.db.admin().ping()
      this.healthStatus.mongo.global = true
    } catch (error) {
      this.healthStatus.mongo.global = false
      console.error('[DatabaseHealthMonitor] Base MongoDB global não saudável:', error)
    }
  }

  /**
   * Registra resultado de verificação de saúde
   */
  private async logHealthCheck(result: HealthCheckResult): Promise<void> {
    try {
      const message = result.healthy 
        ? `Health check OK: ${result.type}/${result.database} (${result.responseTime}ms)`
        : `Health check FAIL: ${result.type}/${result.database} - ${result.error} (${result.responseTime}ms)`

      await apiLogger.logSuccess(
        'system',
        '/health-check',
        message
      )

      // Log crítico se base não estiver saudável
      if (!result.healthy) {
        await apiLogger.logError(
          'system',
          '/health-check',
          `Database health check failed: ${result.database} (${result.type})`
        )
      }

    } catch (error) {
      console.error('[DatabaseHealthMonitor] Erro ao registrar health check:', error)
    }
  }

  /**
   * Obtém estatísticas de saúde
   */
  getHealthStatistics(): {
    totalDatabases: number
    healthyDatabases: number
    unhealthyDatabases: number
    globalSqlHealthy: boolean
    globalMongoHealthy: boolean
    lastCheck: Date
  } {
    const sqlClients = Array.from(this.healthStatus.sql.clients.values())
    const mongoClients = Array.from(this.healthStatus.mongo.clients.values())
    
    const totalDatabases = sqlClients.length + mongoClients.length
    const healthyDatabases = sqlClients.filter(h => h).length + mongoClients.filter(h => h).length
    
    return {
      totalDatabases,
      healthyDatabases,
      unhealthyDatabases: totalDatabases - healthyDatabases,
      globalSqlHealthy: this.healthStatus.sql.global,
      globalMongoHealthy: this.healthStatus.mongo.global,
      lastCheck: this.healthStatus.lastCheck
    }
  }

  /**
   * Tenta reconectar a uma base que voltou a ficar saudável
   */
  private async attemptReconnection(database: string, type: 'sql' | 'mongo'): Promise<void> {
    try {
      console.log(`[DatabaseHealthMonitor] Base ${database} (${type}) voltou a ficar saudável, tentando reconectar...`)
      
      if (type === 'sql') {
        // Fechar conexão existente se houver
        await databaseRouter.closeConnection(database)
        
        // Criar nova conexão
        const newConnection = await databaseRouter.getSqlConnection(database)
        if (newConnection) {
          console.log(`[DatabaseHealthMonitor] Reconexão SQL bem-sucedida para: ${database}`)
          
          // Log evento de reconexão
          await apiLogger.logSuccess(
            'system',
            '/reconnection',
            `SQL reconnection successful for database: ${database}`
          )
        }
      } else {
        // Para MongoDB, a reconexão é automática através do useDb
        const connection = await databaseRouter.getMongoConnection(database)
        if (connection) {
          console.log(`[DatabaseHealthMonitor] Reconexão MongoDB bem-sucedida para: ${database}`)
          
          // Log evento de reconexão
          await apiLogger.logSuccess(
            'system',
            '/reconnection',
            `MongoDB reconnection successful for database: ${database}`
          )
        }
      }
      
    } catch (error) {
      console.error(`[DatabaseHealthMonitor] Erro na reconexão para ${database} (${type}):`, error)
      
      // Log erro de reconexão
      await apiLogger.logError(
        'system',
        '/reconnection',
        `Reconnection failed for ${database} (${type}): ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Limpa status de bases que não estão mais ativas
   */
  cleanupInactiveDatabases(): void {
    const activeConnections = new Set(databaseRouter.getActiveConnections())
    
    // Limpar SQL clients inativos
    for (const database of this.healthStatus.sql.clients.keys()) {
      if (!activeConnections.has(database)) {
        this.healthStatus.sql.clients.delete(database)
      }
    }
    
    // Limpar MongoDB clients inativos
    for (const database of this.healthStatus.mongo.clients.keys()) {
      if (!activeConnections.has(database)) {
        this.healthStatus.mongo.clients.delete(database)
      }
    }
    
    console.log('[DatabaseHealthMonitor] Limpeza de bases inativas concluída')
  }

  /**
   * Destruir o monitor
   */
  destroy(): void {
    this.stopMonitoring()
    this.healthStatus.sql.clients.clear()
    this.healthStatus.mongo.clients.clear()
    console.log('[DatabaseHealthMonitor] Destruído')
  }
}

// Singleton instance
export const databaseHealthMonitor = new DatabaseHealthMonitor()