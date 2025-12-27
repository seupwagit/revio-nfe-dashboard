/**
 * SecurityEventLogger - Logger de Eventos de Segurança
 * 
 * Responsável por registrar eventos de segurança, violações de acesso
 * e tentativas de acesso cruzado entre bases de dados
 */

import { apiLogger } from './APILogger'
import { databaseRouter } from './DatabaseRouter'

export interface SecurityEvent {
  type: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  userName?: string
  userDatabase?: string
  requestId?: string
  operation?: string
  resourceType?: string
  requestedDatabase?: string
  reason: string
  additionalData?: any
  timestamp: Date
}

export type SecurityEventType = 
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'CROSS_DATABASE_ACCESS_ATTEMPT'
  | 'DATABASE_CORRESPONDENCE_VIOLATION'
  | 'USER_ISOLATION_VIOLATION'
  | 'ACCESS_VALIDATION_ERROR'
  | 'AUTHORIZED_ACCESS'
  | 'CONTEXT_CLEANUP_FORCED'
  | 'TOKEN_EXPIRATION_CLEANUP'
  | 'LOGOUT_CLEANUP'
  | 'SUSPICIOUS_ACTIVITY'
  | 'MULTIPLE_CONTEXT_VIOLATION'
  | 'CONTEXT_CORRUPTION_DETECTED'

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SecurityEventStats {
  totalEvents: number
  eventsBySeverity: Record<SecuritySeverity, number>
  eventsByType: Record<SecurityEventType, number>
  recentEvents: SecurityEvent[]
  criticalEventsLast24h: number
}

export class SecurityEventLogger {
  private static instance: SecurityEventLogger
  private eventBuffer: SecurityEvent[] = []
  private readonly MAX_BUFFER_SIZE = 1000
  private readonly FLUSH_INTERVAL = 30 * 1000 // 30 segundos
  private flushTimer: NodeJS.Timeout | null = null
  private stats: SecurityEventStats = {
    totalEvents: 0,
    eventsBySeverity: {
      INFO: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    },
    eventsByType: {} as Record<SecurityEventType, number>,
    recentEvents: [],
    criticalEventsLast24h: 0
  }

  private constructor() {
    this.startFlushTimer()
    console.log('[SecurityEventLogger] Inicializado com buffer de eventos')
  }

  static getInstance(): SecurityEventLogger {
    if (!SecurityEventLogger.instance) {
      SecurityEventLogger.instance = new SecurityEventLogger()
    }
    return SecurityEventLogger.instance
  }

  /**
   * Registra um evento de segurança
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Adicionar ao buffer
      this.eventBuffer.push(event)
      
      // Atualizar estatísticas
      this.updateStats(event)

      // Log imediato no console para eventos críticos
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        console.error(`[SECURITY] ${event.severity} - ${event.type}: ${event.reason}`, {
          userId: event.userId,
          userName: event.userName,
          userDatabase: event.userDatabase,
          requestId: event.requestId,
          requestedDatabase: event.requestedDatabase
        })
      }

      // Flush imediato para eventos críticos
      if (event.severity === 'CRITICAL') {
        await this.flushEvents()
      }

      // Flush se buffer estiver cheio
      if (this.eventBuffer.length >= this.MAX_BUFFER_SIZE) {
        await this.flushEvents()
      }

    } catch (error) {
      console.error('[SecurityEventLogger] Erro ao registrar evento de segurança:', error)
    }
  }

  /**
   * Registra tentativa de acesso não autorizado
   */
  async logUnauthorizedAccess(
    requestId: string,
    operation: string,
    resourceType: string,
    reason: string,
    userId?: string,
    userName?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'HIGH',
      userId,
      userName,
      requestId,
      operation,
      resourceType,
      reason,
      timestamp: new Date()
    })
  }

  /**
   * Registra tentativa de acesso cruzado entre bases
   */
  async logCrossDatabaseAccess(
    userId: string,
    userName: string,
    userDatabase: string,
    requestedDatabase: string,
    requestId: string,
    operation: string = 'unknown'
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'CROSS_DATABASE_ACCESS_ATTEMPT',
      severity: 'CRITICAL',
      userId,
      userName,
      userDatabase,
      requestedDatabase,
      requestId,
      operation,
      reason: `Usuário ${userName} (base: ${userDatabase}) tentou acessar base: ${requestedDatabase}`,
      timestamp: new Date()
    })
  }

  /**
   * Registra violação de isolamento entre usuários
   */
  async logUserIsolationViolation(
    user1Id: string,
    user1Name: string,
    user2Id: string,
    user2Name: string,
    sharedDatabase: string,
    requestId1: string,
    requestId2: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'USER_ISOLATION_VIOLATION',
      severity: 'CRITICAL',
      userId: user1Id,
      userName: user1Name,
      userDatabase: sharedDatabase,
      requestId: requestId1,
      reason: `Violação de isolamento: usuários ${user1Name} e ${user2Name} acessando a mesma base`,
      additionalData: {
        secondUserId: user2Id,
        secondUserName: user2Name,
        secondRequestId: requestId2
      },
      timestamp: new Date()
    })
  }

  /**
   * Registra limpeza forçada de contexto
   */
  async logContextCleanup(
    type: 'FORCED' | 'TOKEN_EXPIRATION' | 'LOGOUT',
    userId?: string,
    userName?: string,
    userDatabase?: string,
    requestId?: string,
    reason?: string
  ): Promise<void> {
    const eventType = type === 'FORCED' ? 'CONTEXT_CLEANUP_FORCED' :
                     type === 'TOKEN_EXPIRATION' ? 'TOKEN_EXPIRATION_CLEANUP' :
                     'LOGOUT_CLEANUP'

    await this.logSecurityEvent({
      type: eventType,
      severity: type === 'FORCED' ? 'MEDIUM' : 'INFO',
      userId,
      userName,
      userDatabase,
      requestId,
      reason: reason || `Limpeza de contexto: ${type}`,
      timestamp: new Date()
    })
  }

  /**
   * Registra atividade suspeita
   */
  async logSuspiciousActivity(
    userId: string,
    userName: string,
    userDatabase: string,
    activity: string,
    requestId?: string,
    additionalData?: any
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      userId,
      userName,
      userDatabase,
      requestId,
      reason: `Atividade suspeita detectada: ${activity}`,
      additionalData,
      timestamp: new Date()
    })
  }

  /**
   * Registra corrupção de contexto
   */
  async logContextCorruption(
    requestId: string,
    reason: string,
    userId?: string,
    userName?: string,
    additionalData?: any
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'CONTEXT_CORRUPTION_DETECTED',
      severity: 'HIGH',
      userId,
      userName,
      requestId,
      reason: `Corrupção de contexto detectada: ${reason}`,
      additionalData,
      timestamp: new Date()
    })
  }

  /**
   * Flush dos eventos para o banco de dados
   */
  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return
    }

    const eventsToFlush = [...this.eventBuffer]
    this.eventBuffer = []

    try {
      // Registrar cada evento no APILogger
      for (const event of eventsToFlush) {
        await apiLogger.logRequest({
          ip: 'security-system',
          caminhoAcessado: '/security/event',
          mensagem: this.formatSecurityEventMessage(event),
          usrCodigo: event.userId ? parseInt(event.userId) : undefined,
          tipo: 'SECURITY_EVENT',
          requestId: event.requestId
        })
      }

      console.log(`[SecurityEventLogger] ${eventsToFlush.length} eventos de segurança registrados`)

    } catch (error) {
      console.error('[SecurityEventLogger] Erro ao registrar eventos de segurança:', error)
      
      // Recolocar eventos no buffer em caso de erro
      this.eventBuffer.unshift(...eventsToFlush)
    }
  }

  /**
   * Formata mensagem do evento de segurança
   */
  private formatSecurityEventMessage(event: SecurityEvent): string {
    const timestamp = event.timestamp.toISOString()
    const userInfo = event.userName ? `${event.userName} (${event.userId})` : event.userId || 'unknown'
    
    let message = `[${event.severity}] ${event.type}: ${event.reason}`
    
    if (event.userName) {
      message += ` | Usuário: ${userInfo}`
    }
    
    if (event.userDatabase) {
      message += ` | Base: ${event.userDatabase}`
    }
    
    if (event.requestedDatabase && event.requestedDatabase !== event.userDatabase) {
      message += ` | Base solicitada: ${event.requestedDatabase}`
    }
    
    if (event.operation) {
      message += ` | Operação: ${event.operation}`
    }
    
    if (event.requestId) {
      message += ` | Request: ${event.requestId}`
    }
    
    message += ` | ${timestamp}`
    
    if (event.additionalData) {
      message += ` | Dados: ${JSON.stringify(event.additionalData)}`
    }
    
    return message
  }

  /**
   * Atualiza estatísticas internas
   */
  private updateStats(event: SecurityEvent): void {
    this.stats.totalEvents++
    this.stats.eventsBySeverity[event.severity]++
    
    if (!this.stats.eventsByType[event.type]) {
      this.stats.eventsByType[event.type] = 0
    }
    this.stats.eventsByType[event.type]++
    
    // Manter apenas os 100 eventos mais recentes
    this.stats.recentEvents.push(event)
    if (this.stats.recentEvents.length > 100) {
      this.stats.recentEvents.shift()
    }
    
    // Contar eventos críticos das últimas 24 horas
    if (event.severity === 'CRITICAL') {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      this.stats.criticalEventsLast24h = this.stats.recentEvents.filter(e => 
        e.severity === 'CRITICAL' && e.timestamp > yesterday
      ).length
    }
  }

  /**
   * Inicia timer de flush automático
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(async () => {
      await this.flushEvents()
    }, this.FLUSH_INTERVAL)
  }

  /**
   * Para timer de flush
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Obtém estatísticas de eventos de segurança
   */
  getSecurityStats(): SecurityEventStats {
    return { ...this.stats }
  }

  /**
   * Obtém eventos críticos recentes
   */
  getCriticalEvents(hours: number = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return this.stats.recentEvents.filter(event => 
      event.severity === 'CRITICAL' && event.timestamp > cutoff
    )
  }

  /**
   * Obtém eventos por usuário
   */
  getEventsByUser(userId: string, hours: number = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return this.stats.recentEvents.filter(event => 
      event.userId === userId && event.timestamp > cutoff
    )
  }

  /**
   * Força flush de todos os eventos pendentes
   */
  async forceFlush(): Promise<void> {
    await this.flushEvents()
  }

  /**
   * Limpa estatísticas (para testes)
   */
  clearStats(): void {
    this.stats = {
      totalEvents: 0,
      eventsBySeverity: {
        INFO: 0,
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0
      },
      eventsByType: {} as Record<SecurityEventType, number>,
      recentEvents: [],
      criticalEventsLast24h: 0
    }
    this.eventBuffer = []
  }

  /**
   * Cleanup ao destruir a instância
   */
  async destroy(): Promise<void> {
    this.stopFlushTimer()
    await this.flushEvents()
    console.log('[SecurityEventLogger] Destruído')
  }
}

// Singleton instance
export const securityEventLogger = SecurityEventLogger.getInstance()