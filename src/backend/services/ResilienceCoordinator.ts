/**
 * ResilienceCoordinator - Coordenador de Resilência
 * 
 * Coordena todos os componentes de resilência e fallback do sistema,
 * garantindo que o sistema continue funcionando mesmo com falhas
 */

import { databaseRouter } from './DatabaseRouter'
import { databaseHealthMonitor } from './DatabaseHealthMonitor'
import { fallbackNotificationService } from './FallbackNotificationService'
import { apiLogger } from './APILogger'
import { UserContext } from '../types/UserContext'

export interface ResilienceMetrics {
  totalFailures: number
  totalFallbacks: number
  totalRecoveries: number
  activeCircuitBreakers: number
  averageRecoveryTime: number
  lastFailure?: Date
  lastRecovery?: Date
}

export interface ResilienceConfig {
  healthCheckInterval: number
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  circuitBreakerThreshold: number
  notificationEnabled: boolean
  autoRecoveryEnabled: boolean
}

export class ResilienceCoordinator {
  private metrics: ResilienceMetrics
  private config: ResilienceConfig
  private isInitialized: boolean = false
  private recoveryTimes: number[] = []

  constructor() {
    this.metrics = {
      totalFailures: 0,
      totalFallbacks: 0,
      totalRecoveries: 0,
      activeCircuitBreakers: 0,
      averageRecoveryTime: 0
    }

    this.config = {
      healthCheckInterval: 30000, // 30 segundos
      maxRetries: 3,
      retryDelay: 1000, // 1 segundo
      backoffMultiplier: 2,
      circuitBreakerThreshold: 5,
      notificationEnabled: true,
      autoRecoveryEnabled: true
    }

    console.log('[ResilienceCoordinator] Inicializado')
  }

  /**
   * Inicializa o sistema de resilência
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[ResilienceCoordinator] Já inicializado')
      return
    }

    try {
      console.log('[ResilienceCoordinator] Iniciando sistema de resilência...')

      // Iniciar monitoramento de saúde
      databaseHealthMonitor.startMonitoring()

      // Configurar eventos de recuperação
      this.setupRecoveryHandlers()

      // Configurar limpeza automática
      this.setupAutomaticCleanup()

      this.isInitialized = true
      
      await apiLogger.logSuccess(
        'system',
        '/resilience',
        'Resilience system initialized successfully'
      )

      console.log('[ResilienceCoordinator] Sistema de resilência iniciado com sucesso')

    } catch (error) {
      console.error('[ResilienceCoordinator] Erro ao inicializar:', error)
      
      await apiLogger.logError(
        'system',
        '/resilience',
        `Failed to initialize resilience system: ${error instanceof Error ? error.message : String(error)}`
      )
      
      throw error
    }
  }

  /**
   * Para o sistema de resilência
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      console.log('[ResilienceCoordinator] Parando sistema de resilência...')

      // Parar monitoramento
      databaseHealthMonitor.stopMonitoring()

      // Limpar notificações
      fallbackNotificationService.cleanup()

      this.isInitialized = false

      await apiLogger.logSuccess(
        'system',
        '/resilience',
        'Resilience system shutdown successfully'
      )

      console.log('[ResilienceCoordinator] Sistema de resilência parado')

    } catch (error) {
      console.error('[ResilienceCoordinator] Erro ao parar:', error)
    }
  }

  /**
   * Registra uma falha no sistema
   */
  async recordFailure(database: string, type: 'sql' | 'mongo', error: string, userContext?: UserContext): Promise<void> {
    this.metrics.totalFailures++
    this.metrics.lastFailure = new Date()

    // Log da falha
    await apiLogger.logError(
      'system',
      '/resilience/failure',
      `Database failure recorded: ${database} (${type}) - ${error}`
    )

    // Notificar usuário se configurado e houver contexto
    if (this.config.notificationEnabled && userContext) {
      await fallbackNotificationService.notifyFallbackUsage(
        userContext,
        `Falha na base ${database}: ${error}`,
        type
      )
    }

    console.log(`[ResilienceCoordinator] Falha registrada: ${database} (${type}) - ${error}`)
  }

  /**
   * Registra uso de fallback
   */
  async recordFallback(database: string, reason: string, userContext?: UserContext): Promise<void> {
    this.metrics.totalFallbacks++

    // Log do fallback
    await apiLogger.logSuccess(
      'system',
      '/resilience/fallback',
      `Fallback used for database: ${database} - ${reason}`
    )

    // Notificar usuário se configurado e houver contexto
    if (this.config.notificationEnabled && userContext) {
      await fallbackNotificationService.notifyFallbackUsage(
        userContext,
        reason,
        'sql' // Assumir SQL por padrão, pode ser melhorado
      )
    }

    console.log(`[ResilienceCoordinator] Fallback registrado: ${database} - ${reason}`)
  }

  /**
   * Registra recuperação de uma base
   */
  async recordRecovery(database: string, type: 'sql' | 'mongo', recoveryTime: number): Promise<void> {
    this.metrics.totalRecoveries++
    this.metrics.lastRecovery = new Date()
    
    // Atualizar tempo médio de recuperação
    this.recoveryTimes.push(recoveryTime)
    if (this.recoveryTimes.length > 100) {
      this.recoveryTimes.shift() // Manter apenas os últimos 100
    }
    
    this.metrics.averageRecoveryTime = this.recoveryTimes.reduce((a, b) => a + b, 0) / this.recoveryTimes.length

    // Log da recuperação
    await apiLogger.logSuccess(
      'system',
      '/resilience/recovery',
      `Database recovery recorded: ${database} (${type}) - Recovery time: ${recoveryTime}ms`
    )

    console.log(`[ResilienceCoordinator] Recuperação registrada: ${database} (${type}) - Tempo: ${recoveryTime}ms`)
  }

  /**
   * Obtém métricas de resilência
   */
  getMetrics(): ResilienceMetrics {
    // Atualizar circuit breakers ativos
    const connectionMetrics = databaseRouter.getConnectionMetrics()
    this.metrics.activeCircuitBreakers = connectionMetrics.connectionErrors

    return { ...this.metrics }
  }

  /**
   * Obtém estatísticas consolidadas
   */
  async getConsolidatedStatistics(): Promise<{
    resilience: ResilienceMetrics
    health: ReturnType<typeof databaseHealthMonitor.getHealthStatistics>
    notifications: ReturnType<typeof fallbackNotificationService.getNotificationStatistics>
    connections: ReturnType<typeof databaseRouter.getConnectionMetrics>
  }> {
    return {
      resilience: this.getMetrics(),
      health: databaseHealthMonitor.getHealthStatistics(),
      notifications: fallbackNotificationService.getNotificationStatistics(),
      connections: databaseRouter.getConnectionMetrics()
    }
  }

  /**
   * Força verificação de saúde de todas as bases
   */
  async forceHealthCheck(): Promise<void> {
    try {
      console.log('[ResilienceCoordinator] Forçando verificação de saúde...')
      
      const activeConnections = databaseRouter.getActiveConnections()
      
      for (const database of activeConnections) {
        if (database !== 'spedrevio') { // Pular base global
          await databaseHealthMonitor.forceHealthCheck(database, 'sql')
          await databaseHealthMonitor.forceHealthCheck(database, 'mongo')
        }
      }
      
      console.log('[ResilienceCoordinator] Verificação de saúde forçada concluída')
      
    } catch (error) {
      console.error('[ResilienceCoordinator] Erro na verificação forçada:', error)
    }
  }

  /**
   * Configura handlers de recuperação
   */
  private setupRecoveryHandlers(): void {
    // Configurar limpeza automática de circuit breakers
    setInterval(() => {
      this.cleanupCircuitBreakers()
    }, this.config.healthCheckInterval)

    console.log('[ResilienceCoordinator] Handlers de recuperação configurados')
  }

  /**
   * Configura limpeza automática
   */
  private setupAutomaticCleanup(): void {
    // Limpeza a cada hora
    setInterval(() => {
      this.performAutomaticCleanup()
    }, 60 * 60 * 1000)

    console.log('[ResilienceCoordinator] Limpeza automática configurada')
  }

  /**
   * Limpa circuit breakers antigos
   */
  private cleanupCircuitBreakers(): void {
    try {
      // Lógica para limpar circuit breakers será implementada no DatabaseRouter
      console.log('[ResilienceCoordinator] Limpeza de circuit breakers executada')
    } catch (error) {
      console.error('[ResilienceCoordinator] Erro na limpeza de circuit breakers:', error)
    }
  }

  /**
   * Executa limpeza automática geral
   */
  private async performAutomaticCleanup(): Promise<void> {
    try {
      console.log('[ResilienceCoordinator] Executando limpeza automática...')

      // Limpar bases inativas do health monitor
      databaseHealthMonitor.cleanupInactiveDatabases()

      // Resetar métricas antigas se necessário
      if (this.recoveryTimes.length > 1000) {
        this.recoveryTimes = this.recoveryTimes.slice(-100)
      }

      console.log('[ResilienceCoordinator] Limpeza automática concluída')

    } catch (error) {
      console.error('[ResilienceCoordinator] Erro na limpeza automática:', error)
    }
  }

  /**
   * Atualiza configuração de resilência
   */
  updateConfig(newConfig: Partial<ResilienceConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[ResilienceCoordinator] Configuração atualizada:', newConfig)
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): ResilienceConfig {
    return { ...this.config }
  }

  /**
   * Verifica se o sistema está saudável
   */
  async isSystemHealthy(): Promise<boolean> {
    try {
      const stats = databaseHealthMonitor.getHealthStatistics()
      
      // Sistema é considerado saudável se:
      // 1. Base global SQL está saudável
      // 2. Base global MongoDB está saudável
      // 3. Menos de 50% das bases de clientes estão não saudáveis
      
      const globalHealthy = stats.globalSqlHealthy && stats.globalMongoHealthy
      const clientHealthRatio = stats.totalDatabases > 0 ? stats.healthyDatabases / stats.totalDatabases : 1
      
      return globalHealthy && clientHealthRatio >= 0.5
      
    } catch (error) {
      console.error('[ResilienceCoordinator] Erro ao verificar saúde do sistema:', error)
      return false
    }
  }
}

// Singleton instance
export const resilienceCoordinator = new ResilienceCoordinator()