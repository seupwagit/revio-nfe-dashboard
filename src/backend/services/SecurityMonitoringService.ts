/**
 * SecurityMonitoringService - Serviço de Monitoramento de Segurança
 * 
 * Serviço centralizado para monitorar todos os aspectos de isolamento de dados
 * e segurança do sistema
 */

import { dataAccessValidator } from './DataAccessValidator'
import { crossAccessBlocker } from './CrossAccessBlocker'
import { securityEventLogger } from './SecurityEventLogger'
import { contextCleanupHandler } from './ContextCleanupHandler'
import { userContextManager } from './UserContextManager'
import { databaseRouter } from './DatabaseRouter'

export interface SecurityOverview {
  timestamp: Date
  systemStatus: 'SECURE' | 'WARNING' | 'CRITICAL'
  activeThreats: number
  isolationStatus: {
    totalUsers: number
    activeContexts: number
    isolationViolations: number
    potentialLeaks: number
  }
  accessControl: {
    totalAttempts: number
    blockedAttempts: number
    blockingRate: number
    suspiciousUsers: string[]
  }
  securityEvents: {
    totalEvents: number
    criticalEvents: number
    recentCritical: number
    eventsByType: Record<string, number>
  }
  contextManagement: {
    totalCleanups: number
    contextsCleared: number
    lastCleanup?: Date
    orphanedContexts: number
  }
  recommendations: string[]
}

export interface SecurityAlert {
  id: string
  type: 'ISOLATION_BREACH' | 'SUSPICIOUS_ACTIVITY' | 'SYSTEM_ANOMALY' | 'CONTEXT_LEAK'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  userId?: string
  userName?: string
  userDatabase?: string
  timestamp: Date
  resolved: boolean
  actions: string[]
}

export interface SecurityMetrics {
  uptime: number
  totalUsers: number
  activeUsers: number
  totalRequests: number
  secureRequests: number
  securityRate: number
  averageResponseTime: number
  systemLoad: number
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService
  private alerts: SecurityAlert[] = []
  private readonly MAX_ALERTS = 1000
  private monitoringTimer: NodeJS.Timeout | null = null
  private startTime: Date = new Date()
  private metrics: SecurityMetrics = {
    uptime: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    secureRequests: 0,
    securityRate: 100,
    averageResponseTime: 0,
    systemLoad: 0
  }

  private constructor() {
    this.startMonitoring()
    console.log('[SecurityMonitoringService] Inicializado com monitoramento contínuo')
  }

  static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService()
    }
    return SecurityMonitoringService.instance
  }

  /**
   * Obtém visão geral da segurança do sistema
   */
  async getSecurityOverview(): Promise<SecurityOverview> {
    try {
      // Coletar dados de todos os componentes
      const isolationStats = userContextManager.getIsolationStats()
      const isolationValidation = userContextManager.validateUserIsolation()
      const blockingStats = crossAccessBlocker.getBlockingStats()
      const securityStats = securityEventLogger.getSecurityStats()
      const cleanupStats = contextCleanupHandler.getCleanupStats()
      const validationResults = await dataAccessValidator.validateAllActiveContexts()

      // Determinar status do sistema
      const systemStatus = this.determineSystemStatus(
        isolationValidation.violations.length,
        securityStats.criticalEventsLast24h,
        blockingStats.blockingRate
      )

      // Identificar usuários suspeitos
      const suspiciousUsers = this.identifySuspiciousUsers()

      // Gerar recomendações
      const recommendations = this.generateRecommendations(
        isolationValidation.violations.length,
        securityStats.criticalEventsLast24h,
        blockingStats.blockingRate,
        isolationStats.potentialLeaks
      )

      const overview: SecurityOverview = {
        timestamp: new Date(),
        systemStatus,
        activeThreats: this.countActiveThreats(),
        isolationStatus: {
          totalUsers: isolationStats.totalUsers,
          activeContexts: isolationStats.contextsPerUser.size,
          isolationViolations: isolationValidation.violations.length,
          potentialLeaks: isolationStats.potentialLeaks
        },
        accessControl: {
          totalAttempts: blockingStats.totalAttempts,
          blockedAttempts: blockingStats.blockedAttempts,
          blockingRate: blockingStats.blockingRate,
          suspiciousUsers
        },
        securityEvents: {
          totalEvents: securityStats.totalEvents,
          criticalEvents: securityStats.eventsBySeverity.CRITICAL,
          recentCritical: securityStats.criticalEventsLast24h,
          eventsByType: securityStats.eventsByType
        },
        contextManagement: {
          totalCleanups: cleanupStats.totalCleanups,
          contextsCleared: cleanupStats.contextsCleared,
          lastCleanup: cleanupStats.lastCleanup,
          orphanedContexts: this.countOrphanedContexts()
        },
        recommendations
      }

      return overview

    } catch (error) {
      console.error('[SecurityMonitoringService] Erro ao obter visão geral de segurança:', error)
      
      // Retornar overview de erro
      return {
        timestamp: new Date(),
        systemStatus: 'CRITICAL',
        activeThreats: 999,
        isolationStatus: {
          totalUsers: 0,
          activeContexts: 0,
          isolationViolations: 999,
          potentialLeaks: 999
        },
        accessControl: {
          totalAttempts: 0,
          blockedAttempts: 0,
          blockingRate: 0,
          suspiciousUsers: []
        },
        securityEvents: {
          totalEvents: 0,
          criticalEvents: 999,
          recentCritical: 999,
          eventsByType: {}
        },
        contextManagement: {
          totalCleanups: 0,
          contextsCleared: 0,
          orphanedContexts: 999
        },
        recommendations: ['ERRO: Não foi possível obter dados de segurança - verificar sistema imediatamente']
      }
    }
  }

  /**
   * Cria alerta de segurança
   */
  async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityAlert> {
    const fullAlert: SecurityAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false
    }

    // Adicionar ao array de alertas
    this.alerts.push(fullAlert)

    // Manter apenas os alertas mais recentes
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts.shift()
    }

    // Log do alerta
    console.warn(`[SecurityMonitoringService] 🚨 ALERTA ${fullAlert.severity}: ${fullAlert.title}`, {
      description: fullAlert.description,
      userId: fullAlert.userId,
      userName: fullAlert.userName,
      userDatabase: fullAlert.userDatabase
    })

    // Para alertas críticos, registrar evento de segurança
    if (fullAlert.severity === 'CRITICAL') {
      await securityEventLogger.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'CRITICAL',
        userId: fullAlert.userId,
        userName: fullAlert.userName,
        userDatabase: fullAlert.userDatabase,
        reason: `ALERTA CRÍTICO: ${fullAlert.title} - ${fullAlert.description}`,
        timestamp: fullAlert.timestamp
      })
    }

    return fullAlert
  }

  /**
   * Resolve alerta de segurança
   */
  resolveSecurityAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    
    if (alert) {
      alert.resolved = true
      console.log(`[SecurityMonitoringService] Alerta resolvido: ${alertId} por ${resolvedBy || 'sistema'}`)
      return true
    }
    
    return false
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): SecurityAlert[] {
    let alerts = this.alerts.filter(alert => !alert.resolved)
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Obtém alertas por usuário
   */
  getAlertsByUser(userId: string, hours: number = 24): SecurityAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return this.alerts.filter(alert => 
      alert.userId === userId && alert.timestamp > cutoff
    )
  }

  /**
   * Executa verificação completa de segurança
   */
  async performSecurityCheck(): Promise<{
    passed: boolean
    issues: string[]
    recommendations: string[]
    criticalIssues: string[]
  }> {
    const issues: string[] = []
    const criticalIssues: string[] = []
    const recommendations: string[] = []

    try {
      // 1. Verificar isolamento de usuários
      const isolationValidation = userContextManager.validateUserIsolation()
      if (!isolationValidation.valid) {
        issues.push(`${isolationValidation.violations.length} violações de isolamento detectadas`)
        
        for (const violation of isolationValidation.violations) {
          if (violation.issue.includes('bases diferentes')) {
            criticalIssues.push(`CRÍTICO: ${violation.issue}`)
          }
        }
      }

      // 2. Verificar contextos ativos
      const validationResults = await dataAccessValidator.validateAllActiveContexts()
      if (validationResults.violations.length > 0) {
        issues.push(`${validationResults.violations.length} contextos com problemas de validação`)
        
        if (validationResults.violations.length > 5) {
          criticalIssues.push('CRÍTICO: Muitos contextos com problemas de validação')
        }
      }

      // 3. Verificar eventos de segurança críticos
      const criticalEvents = securityEventLogger.getCriticalEvents(24)
      if (criticalEvents.length > 0) {
        issues.push(`${criticalEvents.length} eventos críticos nas últimas 24 horas`)
        
        if (criticalEvents.length > 10) {
          criticalIssues.push('CRÍTICO: Muitos eventos de segurança críticos')
        }
      }

      // 4. Verificar tentativas de acesso bloqueadas
      const blockingStats = crossAccessBlocker.getBlockingStats()
      if (blockingStats.blockingRate > 10) {
        issues.push(`Taxa de bloqueio alta: ${blockingStats.blockingRate.toFixed(2)}%`)
        
        if (blockingStats.blockingRate > 25) {
          criticalIssues.push('CRÍTICO: Taxa de bloqueio muito alta - possível ataque')
        }
      }

      // 5. Verificar contextos órfãos
      const orphanedContexts = this.countOrphanedContexts()
      if (orphanedContexts > 10) {
        issues.push(`${orphanedContexts} contextos órfãos detectados`)
        recommendations.push('Executar limpeza automática de contextos')
      }

      // Gerar recomendações baseadas nos problemas
      if (issues.length > 0) {
        recommendations.push('Revisar logs de segurança detalhadamente')
        recommendations.push('Considerar aumentar frequência de limpeza automática')
      }

      if (criticalIssues.length > 0) {
        recommendations.push('AÇÃO IMEDIATA: Investigar problemas críticos')
        recommendations.push('Considerar bloqueio temporário de usuários suspeitos')
      }

      return {
        passed: criticalIssues.length === 0 && issues.length < 5,
        issues,
        recommendations,
        criticalIssues
      }

    } catch (error) {
      console.error('[SecurityMonitoringService] Erro na verificação de segurança:', error)
      
      return {
        passed: false,
        issues: ['Erro interno na verificação de segurança'],
        recommendations: ['Verificar logs do sistema imediatamente'],
        criticalIssues: ['CRÍTICO: Falha na verificação de segurança']
      }
    }
  }

  /**
   * Obtém métricas de segurança
   */
  getSecurityMetrics(): SecurityMetrics {
    this.updateMetrics()
    return { ...this.metrics }
  }

  /**
   * Determina status do sistema baseado em métricas
   */
  private determineSystemStatus(
    isolationViolations: number,
    criticalEvents: number,
    blockingRate: number
  ): 'SECURE' | 'WARNING' | 'CRITICAL' {
    // Condições críticas
    if (isolationViolations > 5 || criticalEvents > 10 || blockingRate > 25) {
      return 'CRITICAL'
    }

    // Condições de aviso
    if (isolationViolations > 0 || criticalEvents > 0 || blockingRate > 10) {
      return 'WARNING'
    }

    return 'SECURE'
  }

  /**
   * Identifica usuários com atividade suspeita
   */
  private identifySuspiciousUsers(): string[] {
    const suspiciousUsers: string[] = []
    
    try {
      // Obter usuários com tentativas bloqueadas recentes
      const blockingStats = crossAccessBlocker.getBlockingStats()
      
      for (const blockedAttempt of blockingStats.recentBlocks) {
        if (blockedAttempt.userId && !suspiciousUsers.includes(blockedAttempt.userId)) {
          // Verificar se usuário tem múltiplas tentativas bloqueadas
          const userBlocked = crossAccessBlocker.getBlockedAttemptsByUser(blockedAttempt.userId, 1)
          if (userBlocked.length >= 3) {
            suspiciousUsers.push(blockedAttempt.userId)
          }
        }
      }

      return suspiciousUsers

    } catch (error) {
      console.error('[SecurityMonitoringService] Erro ao identificar usuários suspeitos:', error)
      return []
    }
  }

  /**
   * Gera recomendações baseadas no estado do sistema
   */
  private generateRecommendations(
    isolationViolations: number,
    criticalEvents: number,
    blockingRate: number,
    potentialLeaks: number
  ): string[] {
    const recommendations: string[] = []

    if (isolationViolations > 0) {
      recommendations.push('Investigar violações de isolamento imediatamente')
      recommendations.push('Verificar configuração de contextos de usuário')
    }

    if (criticalEvents > 5) {
      recommendations.push('Revisar eventos críticos das últimas 24 horas')
      recommendations.push('Considerar implementar medidas de segurança adicionais')
    }

    if (blockingRate > 15) {
      recommendations.push('Taxa de bloqueio alta - investigar tentativas de acesso')
      recommendations.push('Considerar implementar rate limiting mais rigoroso')
    }

    if (potentialLeaks > 0) {
      recommendations.push('Contextos com potencial vazamento detectados')
      recommendations.push('Executar limpeza forçada de contextos órfãos')
    }

    if (recommendations.length === 0) {
      recommendations.push('Sistema operando dentro dos parâmetros de segurança')
      recommendations.push('Manter monitoramento contínuo')
    }

    return recommendations
  }

  /**
   * Conta ameaças ativas
   */
  private countActiveThreats(): number {
    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'CRITICAL')
    const highAlerts = activeAlerts.filter(alert => alert.severity === 'HIGH')
    
    return criticalAlerts.length * 3 + highAlerts.length * 2 + (activeAlerts.length - criticalAlerts.length - highAlerts.length)
  }

  /**
   * Conta contextos órfãos
   */
  private countOrphanedContexts(): number {
    try {
      const activeContexts = userContextManager.listActiveContexts()
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      return activeContexts.filter(context => context.age > oneHourAgo.getTime()).length
    } catch (error) {
      console.error('[SecurityMonitoringService] Erro ao contar contextos órfãos:', error)
      return 0
    }
  }

  /**
   * Atualiza métricas do sistema
   */
  private updateMetrics(): void {
    try {
      const now = new Date()
      this.metrics.uptime = now.getTime() - this.startTime.getTime()
      
      // Obter estatísticas de isolamento
      const isolationStats = userContextManager.getIsolationStats()
      this.metrics.totalUsers = isolationStats.totalUsers
      this.metrics.activeUsers = isolationStats.contextsPerUser.size
      
      // Calcular taxa de segurança baseada em bloqueios
      const blockingStats = crossAccessBlocker.getBlockingStats()
      if (blockingStats.totalAttempts > 0) {
        this.metrics.securityRate = ((blockingStats.totalAttempts - blockingStats.blockedAttempts) / blockingStats.totalAttempts) * 100
      }
      
      this.metrics.totalRequests = blockingStats.totalAttempts
      this.metrics.secureRequests = blockingStats.allowedAttempts

    } catch (error) {
      console.error('[SecurityMonitoringService] Erro ao atualizar métricas:', error)
    }
  }

  /**
   * Inicia monitoramento contínuo
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
    }

    // Monitoramento a cada 5 minutos
    this.monitoringTimer = setInterval(async () => {
      try {
        const securityCheck = await this.performSecurityCheck()
        
        // Criar alertas para problemas críticos
        for (const criticalIssue of securityCheck.criticalIssues) {
          await this.createSecurityAlert({
            type: 'SYSTEM_ANOMALY',
            severity: 'CRITICAL',
            title: 'Problema Crítico de Segurança',
            description: criticalIssue,
            actions: ['Investigar imediatamente', 'Verificar logs de sistema']
          })
        }

        // Log de status
        if (!securityCheck.passed) {
          console.warn(`[SecurityMonitoringService] Verificação de segurança falhou: ${securityCheck.issues.length} problemas encontrados`)
        }

      } catch (error) {
        console.error('[SecurityMonitoringService] Erro no monitoramento contínuo:', error)
      }
    }, 5 * 60 * 1000) // 5 minutos

    console.log('[SecurityMonitoringService] Monitoramento contínuo iniciado (a cada 5 minutos)')
  }

  /**
   * Para monitoramento contínuo
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
      this.monitoringTimer = null
      console.log('[SecurityMonitoringService] Monitoramento contínuo parado')
    }
  }

  /**
   * Limpa alertas antigos
   */
  cleanupOldAlerts(days: number = 7): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const initialLength = this.alerts.length
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff)
    
    const cleaned = initialLength - this.alerts.length
    if (cleaned > 0) {
      console.log(`[SecurityMonitoringService] ${cleaned} alertas antigos removidos`)
    }
    
    return cleaned
  }

  /**
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    this.stopMonitoring()
    console.log('[SecurityMonitoringService] Destruído')
  }
}

// Singleton instance
export const securityMonitoringService = SecurityMonitoringService.getInstance()