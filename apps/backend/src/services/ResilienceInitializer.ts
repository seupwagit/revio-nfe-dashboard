/**
 * ResilienceInitializer - Inicializador do Sistema de Resilência
 * 
 * Responsável por inicializar e coordenar todos os componentes
 * do sistema de resilência e fallback
 */

import { resilienceCoordinator } from './ResilienceCoordinator'
import { databaseHealthMonitor } from './DatabaseHealthMonitor'
import { fallbackNotificationService } from './FallbackNotificationService'
import { connectionMetricsService } from './ConnectionMetricsService'
import { databaseRouter } from './DatabaseRouter'
import { apiLogger } from './APILogger'

export interface ResilienceStatus {
  initialized: boolean
  components: {
    coordinator: boolean
    healthMonitor: boolean
    notifications: boolean
    metrics: boolean
    router: boolean
  }
  startTime?: Date
  errors: string[]
}

export class ResilienceInitializer {
  private status: ResilienceStatus
  private initializationPromise: Promise<void> | null = null

  constructor() {
    this.status = {
      initialized: false,
      components: {
        coordinator: false,
        healthMonitor: false,
        notifications: false,
        metrics: false,
        router: false
      },
      errors: []
    }

    console.log('[ResilienceInitializer] Criado')
  }

  /**
   * Inicializa todo o sistema de resilência
   */
  async initialize(): Promise<void> {
    // Evitar múltiplas inicializações simultâneas
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    if (this.status.initialized) {
      console.log('[ResilienceInitializer] Sistema já inicializado')
      return
    }

    this.initializationPromise = this.performInitialization()
    return this.initializationPromise
  }

  /**
   * Executa a inicialização dos componentes
   */
  private async performInitialization(): Promise<void> {
    try {
      console.log('[ResilienceInitializer] Iniciando sistema de resilência...')
      this.status.startTime = new Date()
      this.status.errors = []

      // 1. Inicializar DatabaseRouter (já está inicializado)
      await this.initializeRouter()

      // 2. Inicializar ConnectionMetricsService (já está inicializado)
      await this.initializeMetrics()

      // 3. Inicializar FallbackNotificationService (já está inicializado)
      await this.initializeNotifications()

      // 4. Inicializar DatabaseHealthMonitor
      await this.initializeHealthMonitor()

      // 5. Inicializar ResilienceCoordinator
      await this.initializeCoordinator()

      // 6. Configurar integração entre componentes
      await this.setupIntegration()

      // 7. Executar verificação inicial de saúde
      await this.performInitialHealthCheck()

      this.status.initialized = true

      await apiLogger.logSuccess(
        'system',
        '/resilience/init',
        'Resilience system initialized successfully'
      )

      console.log('[ResilienceInitializer] ✅ Sistema de resilência inicializado com sucesso')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.status.errors.push(errorMessage)

      console.error('[ResilienceInitializer] ❌ Erro na inicialização:', error)

      await apiLogger.logError(
        'system',
        '/resilience/init',
        `Failed to initialize resilience system: ${errorMessage}`
      )

      throw error
    } finally {
      this.initializationPromise = null
    }
  }

  /**
   * Inicializa o DatabaseRouter
   */
  private async initializeRouter(): Promise<void> {
    try {
      // DatabaseRouter já está inicializado como singleton
      // Apenas validar configuração
      const connectionInfo = databaseRouter.getConnectionInfo()
      
      if (!connectionInfo.sqlServer.hasUrl) {
        throw new Error('DATABASE_URL não configurado')
      }

      this.status.components.router = true
      console.log('[ResilienceInitializer] ✅ DatabaseRouter inicializado')

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro ao inicializar DatabaseRouter:', error)
      throw error
    }
  }

  /**
   * Inicializa o ConnectionMetricsService
   */
  private async initializeMetrics(): Promise<void> {
    try {
      // ConnectionMetricsService já está inicializado como singleton
      // Resetar métricas para começar limpo
      connectionMetricsService.reset()

      this.status.components.metrics = true
      console.log('[ResilienceInitializer] ✅ ConnectionMetricsService inicializado')

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro ao inicializar ConnectionMetricsService:', error)
      throw error
    }
  }

  /**
   * Inicializa o FallbackNotificationService
   */
  private async initializeNotifications(): Promise<void> {
    try {
      // FallbackNotificationService já está inicializado como singleton
      // Limpar notificações antigas
      fallbackNotificationService.cleanup()

      this.status.components.notifications = true
      console.log('[ResilienceInitializer] ✅ FallbackNotificationService inicializado')

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro ao inicializar FallbackNotificationService:', error)
      throw error
    }
  }

  /**
   * Inicializa o DatabaseHealthMonitor
   */
  private async initializeHealthMonitor(): Promise<void> {
    try {
      // Iniciar monitoramento automático
      databaseHealthMonitor.startMonitoring()

      this.status.components.healthMonitor = true
      console.log('[ResilienceInitializer] ✅ DatabaseHealthMonitor inicializado')

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro ao inicializar DatabaseHealthMonitor:', error)
      throw error
    }
  }

  /**
   * Inicializa o ResilienceCoordinator
   */
  private async initializeCoordinator(): Promise<void> {
    try {
      await resilienceCoordinator.initialize()

      this.status.components.coordinator = true
      console.log('[ResilienceInitializer] ✅ ResilienceCoordinator inicializado')

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro ao inicializar ResilienceCoordinator:', error)
      throw error
    }
  }

  /**
   * Configura integração entre componentes
   */
  private async setupIntegration(): Promise<void> {
    try {
      console.log('[ResilienceInitializer] Configurando integração entre componentes...')

      // Configurar eventos de integração se necessário
      // Por enquanto, a integração é feita através das chamadas diretas nos serviços

      console.log('[ResilienceInitializer] ✅ Integração configurada')

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro na configuração de integração:', error)
      throw error
    }
  }

  /**
   * Executa verificação inicial de saúde
   */
  private async performInitialHealthCheck(): Promise<void> {
    try {
      console.log('[ResilienceInitializer] Executando verificação inicial de saúde...')

      // Forçar verificação de saúde
      await resilienceCoordinator.forceHealthCheck()

      // Aguardar um pouco para os resultados
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verificar se o sistema está saudável
      const isHealthy = await resilienceCoordinator.isSystemHealthy()
      
      if (!isHealthy) {
        console.warn('[ResilienceInitializer] ⚠️ Sistema não está completamente saudável após inicialização')
      } else {
        console.log('[ResilienceInitializer] ✅ Sistema saudável após inicialização')
      }

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro na verificação inicial:', error)
      // Não falhar a inicialização por causa da verificação de saúde
    }
  }

  /**
   * Para todo o sistema de resilência
   */
  async shutdown(): Promise<void> {
    try {
      console.log('[ResilienceInitializer] Parando sistema de resilência...')

      // Parar componentes na ordem inversa
      await resilienceCoordinator.shutdown()
      databaseHealthMonitor.stopMonitoring()
      fallbackNotificationService.cleanup()
      
      // Limpar conexões do router
      await databaseRouter.cleanup()

      this.status.initialized = false
      this.status.components = {
        coordinator: false,
        healthMonitor: false,
        notifications: false,
        metrics: false,
        router: false
      }

      await apiLogger.logSuccess(
        'system',
        '/resilience/shutdown',
        'Resilience system shutdown successfully'
      )

      console.log('[ResilienceInitializer] ✅ Sistema de resilência parado')

    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro ao parar sistema:', error)
      throw error
    }
  }

  /**
   * Obtém status do sistema
   */
  getStatus(): ResilienceStatus {
    return { ...this.status }
  }

  /**
   * Verifica se o sistema está inicializado
   */
  isInitialized(): boolean {
    return this.status.initialized
  }

  /**
   * Obtém estatísticas consolidadas
   */
  async getStatistics(): Promise<{
    status: ResilienceStatus
    resilience: ReturnType<typeof resilienceCoordinator.getMetrics>
    health: ReturnType<typeof databaseHealthMonitor.getHealthStatistics>
    notifications: ReturnType<typeof fallbackNotificationService.getNotificationStatistics>
    metrics: ReturnType<typeof connectionMetricsService.getSystemMetrics>
    executiveSummary: ReturnType<typeof connectionMetricsService.getExecutiveSummary>
  }> {
    return {
      status: this.getStatus(),
      resilience: resilienceCoordinator.getMetrics(),
      health: databaseHealthMonitor.getHealthStatistics(),
      notifications: fallbackNotificationService.getNotificationStatistics(),
      metrics: connectionMetricsService.getSystemMetrics(),
      executiveSummary: connectionMetricsService.getExecutiveSummary()
    }
  }

  /**
   * Força reinicialização do sistema
   */
  async reinitialize(): Promise<void> {
    console.log('[ResilienceInitializer] Forçando reinicialização...')
    
    try {
      await this.shutdown()
      await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1 segundo
      await this.initialize()
      
      console.log('[ResilienceInitializer] ✅ Reinicialização concluída')
      
    } catch (error) {
      console.error('[ResilienceInitializer] ❌ Erro na reinicialização:', error)
      throw error
    }
  }

  /**
   * Executa diagnóstico completo do sistema
   */
  async runDiagnostics(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical'
    components: Record<string, { status: string; details: any }>
    recommendations: string[]
  }> {
    const diagnostics = {
      overall: 'healthy' as 'healthy' | 'degraded' | 'critical',
      components: {} as Record<string, { status: string; details: any }>,
      recommendations: [] as string[]
    }

    try {
      // Verificar cada componente
      const stats = await this.getStatistics()

      // DatabaseRouter
      const connectionInfo = databaseRouter.getConnectionInfo()
      diagnostics.components.router = {
        status: connectionInfo.sqlServer.hasUrl ? 'healthy' : 'degraded',
        details: connectionInfo
      }

      // Health Monitor
      diagnostics.components.healthMonitor = {
        status: stats.health.globalSqlHealthy && stats.health.globalMongoHealthy ? 'healthy' : 'degraded',
        details: stats.health
      }

      // Metrics
      diagnostics.components.metrics = {
        status: stats.metrics.totalErrors < stats.metrics.totalConnections * 0.1 ? 'healthy' : 'degraded',
        details: stats.metrics
      }

      // Executive Summary
      const execSummary = stats.executiveSummary
      diagnostics.components.system = {
        status: execSummary.systemHealth,
        details: execSummary
      }

      // Determinar saúde geral
      const componentStatuses = Object.values(diagnostics.components).map(c => c.status)
      if (componentStatuses.includes('critical')) {
        diagnostics.overall = 'critical'
      } else if (componentStatuses.includes('degraded')) {
        diagnostics.overall = 'degraded'
      }

      // Gerar recomendações
      if (!connectionInfo.sqlServer.hasUrl) {
        diagnostics.recommendations.push('Configurar DATABASE_URL nas variáveis de ambiente')
      }

      if (execSummary.errorRate > 5) {
        diagnostics.recommendations.push('Investigar alta taxa de erros nas conexões')
      }

      if (execSummary.fallbackRate > 10) {
        diagnostics.recommendations.push('Investigar alta taxa de uso de fallback')
      }

      if (stats.health.unhealthyDatabases > 0) {
        diagnostics.recommendations.push(`Verificar ${stats.health.unhealthyDatabases} base(s) não saudável(is)`)
      }

    } catch (error) {
      diagnostics.overall = 'critical'
      diagnostics.recommendations.push(`Erro no diagnóstico: ${error instanceof Error ? error.message : String(error)}`)
    }

    return diagnostics
  }
}

// Singleton instance
export const resilienceInitializer = new ResilienceInitializer()