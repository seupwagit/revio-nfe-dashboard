/**
 * FallbackNotificationService - Serviço de Notificação de Fallback
 * 
 * Responsável por notificar usuários quando o sistema está usando
 * fallback para a base global devido a problemas na base específica
 */

import { UserContext } from '../types/UserContext'
import { apiLogger } from './APILogger'

export interface FallbackNotification {
  userId: string
  database: string
  reason: string
  timestamp: Date
  notified: boolean
}

export interface NotificationPreferences {
  enableFallbackNotifications: boolean
  notificationMethod: 'header' | 'toast' | 'both'
  maxNotificationsPerHour: number
}

export class FallbackNotificationService {
  private activeNotifications: Map<string, FallbackNotification> = new Map()
  private notificationHistory: FallbackNotification[] = []
  private userPreferences: Map<string, NotificationPreferences> = new Map()
  private rateLimitMap: Map<string, { count: number; resetTime: Date }> = new Map()

  constructor() {
    // Configurações padrão
    this.setDefaultPreferences()
    
    // Limpeza automática a cada hora
    setInterval(() => {
      this.cleanupOldNotifications()
      this.resetRateLimits()
    }, 60 * 60 * 1000)

    console.log('[FallbackNotificationService] Inicializado')
  }

  /**
   * Notifica usuário sobre uso de fallback
   */
  async notifyFallbackUsage(
    userContext: UserContext,
    reason: string,
    databaseType: 'sql' | 'mongo'
  ): Promise<boolean> {
    try {
      const userId = userContext.usrCodigo
      const database = userContext.bancoDeDados
      
      // Verificar rate limiting
      if (!this.canNotifyUser(userId)) {
        console.log(`[FallbackNotificationService] Rate limit atingido para usuário ${userId}`)
        return false
      }

      // Verificar se já existe notificação ativa para este usuário/base
      const notificationKey = `${userId}-${database}`
      if (this.activeNotifications.has(notificationKey)) {
        console.log(`[FallbackNotificationService] Notificação já ativa para ${userId}/${database}`)
        return false
      }

      // Criar notificação
      const notification: FallbackNotification = {
        userId,
        database,
        reason: `${databaseType.toUpperCase()}: ${reason}`,
        timestamp: new Date(),
        notified: false
      }

      // Armazenar notificação
      this.activeNotifications.set(notificationKey, notification)
      this.notificationHistory.push(notification)

      // Incrementar rate limit
      this.incrementRateLimit(userId)

      // Log da notificação
      await apiLogger.logSuccess(
        'system',
        '/fallback-notification',
        `Fallback notification created for user ${userContext.usrNome} (${database}): ${reason}`
      )

      console.log(`[FallbackNotificationService] Notificação criada para ${userContext.usrNome}: ${reason}`)
      
      return true

    } catch (error) {
      console.error('[FallbackNotificationService] Erro ao criar notificação:', error)
      return false
    }
  }

  /**
   * Obtém notificações ativas para um usuário
   */
  getActiveNotifications(userId: string): FallbackNotification[] {
    const notifications: FallbackNotification[] = []
    
    for (const [key, notification] of this.activeNotifications.entries()) {
      if (notification.userId === userId) {
        notifications.push(notification)
      }
    }
    
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Marca notificação como visualizada
   */
  markNotificationAsViewed(userId: string, database: string): boolean {
    const notificationKey = `${userId}-${database}`
    const notification = this.activeNotifications.get(notificationKey)
    
    if (notification) {
      notification.notified = true
      console.log(`[FallbackNotificationService] Notificação marcada como vista: ${userId}/${database}`)
      return true
    }
    
    return false
  }

  /**
   * Remove notificação ativa
   */
  dismissNotification(userId: string, database: string): boolean {
    const notificationKey = `${userId}-${database}`
    const removed = this.activeNotifications.delete(notificationKey)
    
    if (removed) {
      console.log(`[FallbackNotificationService] Notificação removida: ${userId}/${database}`)
    }
    
    return removed
  }

  /**
   * Remove todas as notificações de um usuário
   */
  dismissAllNotifications(userId: string): number {
    let removed = 0
    
    for (const [key, notification] of this.activeNotifications.entries()) {
      if (notification.userId === userId) {
        this.activeNotifications.delete(key)
        removed++
      }
    }
    
    if (removed > 0) {
      console.log(`[FallbackNotificationService] ${removed} notificações removidas para usuário ${userId}`)
    }
    
    return removed
  }

  /**
   * Configura preferências de notificação para um usuário
   */
  setUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const currentPrefs = this.userPreferences.get(userId) || this.getDefaultPreferences()
    const updatedPrefs = { ...currentPrefs, ...preferences }
    
    this.userPreferences.set(userId, updatedPrefs)
    console.log(`[FallbackNotificationService] Preferências atualizadas para usuário ${userId}`)
  }

  /**
   * Obtém preferências de notificação de um usuário
   */
  getUserPreferences(userId: string): NotificationPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences()
  }

  /**
   * Obtém estatísticas de notificações
   */
  getNotificationStatistics(): {
    activeNotifications: number
    totalNotificationsToday: number
    topReasons: Array<{ reason: string; count: number }>
    usersWithActiveNotifications: number
  } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayNotifications = this.notificationHistory.filter(
      n => n.timestamp >= today
    )
    
    // Contar razões mais comuns
    const reasonCounts = new Map<string, number>()
    for (const notification of todayNotifications) {
      const count = reasonCounts.get(notification.reason) || 0
      reasonCounts.set(notification.reason, count + 1)
    }
    
    const topReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Contar usuários únicos com notificações ativas
    const uniqueUsers = new Set()
    for (const notification of this.activeNotifications.values()) {
      uniqueUsers.add(notification.userId)
    }
    
    return {
      activeNotifications: this.activeNotifications.size,
      totalNotificationsToday: todayNotifications.length,
      topReasons,
      usersWithActiveNotifications: uniqueUsers.size
    }
  }

  /**
   * Verifica se pode notificar um usuário (rate limiting)
   */
  private canNotifyUser(userId: string): boolean {
    const preferences = this.getUserPreferences(userId)
    
    if (!preferences.enableFallbackNotifications) {
      return false
    }
    
    const rateLimit = this.rateLimitMap.get(userId)
    if (!rateLimit) {
      return true
    }
    
    // Verificar se o período de reset passou
    if (new Date() > rateLimit.resetTime) {
      this.rateLimitMap.delete(userId)
      return true
    }
    
    // Verificar se ainda pode notificar
    return rateLimit.count < preferences.maxNotificationsPerHour
  }

  /**
   * Incrementa contador de rate limit
   */
  private incrementRateLimit(userId: string): void {
    const now = new Date()
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hora
    
    const rateLimit = this.rateLimitMap.get(userId)
    if (rateLimit) {
      rateLimit.count++
    } else {
      this.rateLimitMap.set(userId, { count: 1, resetTime })
    }
  }

  /**
   * Reset rate limits expirados
   */
  private resetRateLimits(): void {
    const now = new Date()
    
    for (const [userId, rateLimit] of this.rateLimitMap.entries()) {
      if (now > rateLimit.resetTime) {
        this.rateLimitMap.delete(userId)
      }
    }
  }

  /**
   * Limpa notificações antigas (mais de 24 horas)
   */
  private cleanupOldNotifications(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    let cleaned = 0
    
    // Limpar notificações ativas antigas
    for (const [key, notification] of this.activeNotifications.entries()) {
      if (notification.timestamp < oneDayAgo) {
        this.activeNotifications.delete(key)
        cleaned++
      }
    }
    
    // Limpar histórico antigo (manter apenas últimos 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const originalLength = this.notificationHistory.length
    this.notificationHistory = this.notificationHistory.filter(
      n => n.timestamp >= sevenDaysAgo
    )
    
    const historyCleanup = originalLength - this.notificationHistory.length
    
    if (cleaned > 0 || historyCleanup > 0) {
      console.log(`[FallbackNotificationService] Limpeza: ${cleaned} notificações ativas, ${historyCleanup} do histórico`)
    }
  }

  /**
   * Configurações padrão
   */
  private setDefaultPreferences(): void {
    // Configurações padrão globais - podem ser sobrescritas por usuário
  }

  /**
   * Obtém preferências padrão
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enableFallbackNotifications: true,
      notificationMethod: 'both',
      maxNotificationsPerHour: 5
    }
  }

  /**
   * Limpa todas as notificações e dados
   */
  cleanup(): void {
    this.activeNotifications.clear()
    this.notificationHistory = []
    this.userPreferences.clear()
    this.rateLimitMap.clear()
    console.log('[FallbackNotificationService] Cleanup concluído')
  }
}

// Singleton instance
export const fallbackNotificationService = new FallbackNotificationService()