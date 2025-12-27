/**
 * CrossAccessBlocker - Bloqueador de Acesso Cruzado
 * 
 * Responsável por bloquear tentativas de acesso cruzado entre bases de dados
 * e implementar medidas de segurança preventivas
 */

import { UserContext, ContextError } from '../types/UserContext'
import { userContextManager } from './UserContextManager'
import { securityEventLogger } from './SecurityEventLogger'
import { dataAccessValidator } from './DataAccessValidator'

export interface AccessAttempt {
  requestId: string
  userId: string
  userName: string
  userDatabase: string
  requestedDatabase: string
  operation: string
  resourceType: string
  timestamp: Date
  blocked: boolean
  reason?: string
}

export interface BlockingRule {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  action: 'LOG' | 'BLOCK' | 'BLOCK_AND_ALERT'
  condition: (attempt: AccessAttempt) => boolean
}

export interface BlockingStats {
  totalAttempts: number
  blockedAttempts: number
  allowedAttempts: number
  blockingRate: number
  recentBlocks: AccessAttempt[]
  ruleStats: Record<string, { triggered: number; blocked: number }>
}

export class CrossAccessBlocker {
  private static instance: CrossAccessBlocker
  private accessAttempts: AccessAttempt[] = []
  private readonly MAX_ATTEMPTS_HISTORY = 1000
  private blockingRules: Map<string, BlockingRule> = new Map()
  private stats: BlockingStats = {
    totalAttempts: 0,
    blockedAttempts: 0,
    allowedAttempts: 0,
    blockingRate: 0,
    recentBlocks: [],
    ruleStats: {}
  }

  private constructor() {
    this.initializeDefaultRules()
    console.log('[CrossAccessBlocker] Inicializado com regras de bloqueio')
  }

  static getInstance(): CrossAccessBlocker {
    if (!CrossAccessBlocker.instance) {
      CrossAccessBlocker.instance = new CrossAccessBlocker()
    }
    return CrossAccessBlocker.instance
  }

  /**
   * Verifica e bloqueia tentativas de acesso cruzado
   */
  async checkAndBlockCrossAccess(
    requestId: string,
    requestedDatabase: string,
    operation: string = 'read',
    resourceType: string = 'data'
  ): Promise<{ allowed: boolean; reason?: string; blocked?: boolean }> {
    try {
      // Obter contexto do usuário
      const context = userContextManager.getContext(requestId)
      
      if (!context || !context.userContext) {
        const attempt: AccessAttempt = {
          requestId,
          userId: 'unknown',
          userName: 'unknown',
          userDatabase: 'none',
          requestedDatabase,
          operation,
          resourceType,
          timestamp: new Date(),
          blocked: true,
          reason: 'Usuário não autenticado'
        }

        await this.recordAccessAttempt(attempt)
        return { allowed: false, reason: 'Usuário não autenticado', blocked: true }
      }

      const userContext = context.userContext
      
      // Criar registro da tentativa de acesso
      const attempt: AccessAttempt = {
        requestId,
        userId: userContext.usrCodigo,
        userName: userContext.usrNome,
        userDatabase: userContext.bancoDeDados,
        requestedDatabase,
        operation,
        resourceType,
        timestamp: new Date(),
        blocked: false
      }

      // Verificar se é acesso à própria base (permitido)
      if (requestedDatabase === userContext.bancoDeDados) {
        attempt.blocked = false
        await this.recordAccessAttempt(attempt)
        return { allowed: true }
      }

      // Verificar regras de bloqueio
      const blockingResult = await this.evaluateBlockingRules(attempt)
      
      if (blockingResult.shouldBlock) {
        attempt.blocked = true
        attempt.reason = blockingResult.reason

        // Registrar tentativa bloqueada
        await this.recordAccessAttempt(attempt)

        // Log de evento de segurança
        await securityEventLogger.logCrossDatabaseAccess(
          userContext.usrCodigo,
          userContext.usrNome,
          userContext.bancoDeDados,
          requestedDatabase,
          requestId,
          operation
        )

        return { 
          allowed: false, 
          reason: blockingResult.reason, 
          blocked: true 
        }
      }

      // Acesso permitido (caso especial ou exceção)
      attempt.blocked = false
      await this.recordAccessAttempt(attempt)

      return { allowed: true }

    } catch (error) {
      console.error('[CrossAccessBlocker] Erro ao verificar acesso cruzado:', error)
      
      // Em caso de erro, bloquear por segurança
      const attempt: AccessAttempt = {
        requestId,
        userId: 'error',
        userName: 'error',
        userDatabase: 'error',
        requestedDatabase,
        operation,
        resourceType,
        timestamp: new Date(),
        blocked: true,
        reason: `Erro interno: ${error instanceof Error ? error.message : String(error)}`
      }

      await this.recordAccessAttempt(attempt)
      
      return { 
        allowed: false, 
        reason: 'Erro interno na verificação de segurança', 
        blocked: true 
      }
    }
  }

  /**
   * Avalia regras de bloqueio para uma tentativa de acesso
   */
  private async evaluateBlockingRules(attempt: AccessAttempt): Promise<{ shouldBlock: boolean; reason?: string; triggeredRules: string[] }> {
    const triggeredRules: string[] = []
    let shouldBlock = false
    let blockReason = ''

    for (const [ruleId, rule] of this.blockingRules.entries()) {
      if (!rule.enabled) {
        continue
      }

      try {
        if (rule.condition(attempt)) {
          triggeredRules.push(ruleId)
          
          // Atualizar estatísticas da regra
          if (!this.stats.ruleStats[ruleId]) {
            this.stats.ruleStats[ruleId] = { triggered: 0, blocked: 0 }
          }
          this.stats.ruleStats[ruleId].triggered++

          // Determinar ação baseada na regra
          if (rule.action === 'BLOCK' || rule.action === 'BLOCK_AND_ALERT') {
            shouldBlock = true
            blockReason = `Bloqueado pela regra: ${rule.name} - ${rule.description}`
            this.stats.ruleStats[ruleId].blocked++

            // Alertas especiais para regras críticas
            if (rule.action === 'BLOCK_AND_ALERT' && rule.severity === 'CRITICAL') {
              await this.sendCriticalAlert(attempt, rule)
            }
          }
        }
      } catch (error) {
        console.error(`[CrossAccessBlocker] Erro ao avaliar regra ${ruleId}:`, error)
      }
    }

    return { shouldBlock, reason: blockReason, triggeredRules }
  }

  /**
   * Inicializa regras de bloqueio padrão
   */
  private initializeDefaultRules(): void {
    // Regra 1: Bloquear acesso cruzado direto entre bases
    this.blockingRules.set('cross-database-access', {
      id: 'cross-database-access',
      name: 'Bloqueio de Acesso Cruzado',
      description: 'Bloqueia tentativas de acesso a bases de dados de outros clientes',
      enabled: true,
      severity: 'CRITICAL',
      action: 'BLOCK_AND_ALERT',
      condition: (attempt) => attempt.userDatabase !== attempt.requestedDatabase
    })

    // Regra 2: Bloquear operações de escrita em bases não próprias
    this.blockingRules.set('cross-write-operations', {
      id: 'cross-write-operations',
      name: 'Bloqueio de Escrita Cruzada',
      description: 'Bloqueia operações de escrita em bases que não pertencem ao usuário',
      enabled: true,
      severity: 'CRITICAL',
      action: 'BLOCK_AND_ALERT',
      condition: (attempt) => 
        attempt.userDatabase !== attempt.requestedDatabase && 
        (attempt.operation === 'write' || attempt.operation === 'delete' || attempt.operation === 'update')
    })

    // Regra 3: Detectar tentativas suspeitas repetidas
    this.blockingRules.set('repeated-cross-attempts', {
      id: 'repeated-cross-attempts',
      name: 'Tentativas Repetidas Suspeitas',
      description: 'Detecta múltiplas tentativas de acesso cruzado do mesmo usuário',
      enabled: true,
      severity: 'HIGH',
      action: 'BLOCK_AND_ALERT',
      condition: (attempt) => {
        const recentAttempts = this.accessAttempts.filter(a => 
          a.userId === attempt.userId &&
          a.userDatabase !== a.requestedDatabase &&
          (Date.now() - a.timestamp.getTime()) < 5 * 60 * 1000 // Últimos 5 minutos
        )
        return recentAttempts.length >= 3
      }
    })

    // Regra 4: Bloquear acesso a recursos de sistema
    this.blockingRules.set('system-resource-access', {
      id: 'system-resource-access',
      name: 'Proteção de Recursos de Sistema',
      description: 'Bloqueia acesso não autorizado a recursos de sistema',
      enabled: true,
      severity: 'HIGH',
      action: 'BLOCK',
      condition: (attempt) => 
        attempt.resourceType === 'system' && attempt.userDatabase !== 'spedrevio'
    })

    console.log(`[CrossAccessBlocker] ${this.blockingRules.size} regras de bloqueio inicializadas`)
  }

  /**
   * Registra tentativa de acesso
   */
  private async recordAccessAttempt(attempt: AccessAttempt): Promise<void> {
    // Adicionar ao histórico
    this.accessAttempts.push(attempt)
    
    // Manter apenas os últimos registros
    if (this.accessAttempts.length > this.MAX_ATTEMPTS_HISTORY) {
      this.accessAttempts.shift()
    }

    // Atualizar estatísticas
    this.stats.totalAttempts++
    
    if (attempt.blocked) {
      this.stats.blockedAttempts++
      this.stats.recentBlocks.push(attempt)
      
      // Manter apenas os 50 bloqueios mais recentes
      if (this.stats.recentBlocks.length > 50) {
        this.stats.recentBlocks.shift()
      }
    } else {
      this.stats.allowedAttempts++
    }

    // Calcular taxa de bloqueio
    this.stats.blockingRate = this.stats.totalAttempts > 0 ? 
      (this.stats.blockedAttempts / this.stats.totalAttempts) * 100 : 0

    // Log para tentativas bloqueadas
    if (attempt.blocked) {
      console.warn(`[CrossAccessBlocker] ACESSO BLOQUEADO: ${attempt.userName} (${attempt.userDatabase}) tentou acessar ${attempt.requestedDatabase} - ${attempt.reason}`)
    }
  }

  /**
   * Envia alerta crítico
   */
  private async sendCriticalAlert(attempt: AccessAttempt, rule: BlockingRule): Promise<void> {
    try {
      // Log de evento crítico
      await securityEventLogger.logSecurityEvent({
        type: 'CROSS_DATABASE_ACCESS_ATTEMPT',
        severity: 'CRITICAL',
        userId: attempt.userId,
        userName: attempt.userName,
        userDatabase: attempt.userDatabase,
        requestId: attempt.requestId,
        operation: attempt.operation,
        resourceType: attempt.resourceType,
        requestedDatabase: attempt.requestedDatabase,
        reason: `ALERTA CRÍTICO: ${rule.name} - ${attempt.reason}`,
        additionalData: {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleDescription: rule.description
        },
        timestamp: attempt.timestamp
      })

      console.error(`[CrossAccessBlocker] 🚨 ALERTA CRÍTICO: ${rule.name}`, {
        user: `${attempt.userName} (${attempt.userId})`,
        userDatabase: attempt.userDatabase,
        requestedDatabase: attempt.requestedDatabase,
        operation: attempt.operation,
        requestId: attempt.requestId
      })

    } catch (error) {
      console.error('[CrossAccessBlocker] Erro ao enviar alerta crítico:', error)
    }
  }

  /**
   * Adiciona nova regra de bloqueio
   */
  addBlockingRule(rule: BlockingRule): void {
    this.blockingRules.set(rule.id, rule)
    console.log(`[CrossAccessBlocker] Nova regra adicionada: ${rule.name}`)
  }

  /**
   * Remove regra de bloqueio
   */
  removeBlockingRule(ruleId: string): boolean {
    const removed = this.blockingRules.delete(ruleId)
    if (removed) {
      console.log(`[CrossAccessBlocker] Regra removida: ${ruleId}`)
    }
    return removed
  }

  /**
   * Habilita/desabilita regra de bloqueio
   */
  toggleBlockingRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.blockingRules.get(ruleId)
    if (rule) {
      rule.enabled = enabled
      console.log(`[CrossAccessBlocker] Regra ${ruleId} ${enabled ? 'habilitada' : 'desabilitada'}`)
      return true
    }
    return false
  }

  /**
   * Obtém todas as regras de bloqueio
   */
  getBlockingRules(): BlockingRule[] {
    return Array.from(this.blockingRules.values())
  }

  /**
   * Obtém estatísticas de bloqueio
   */
  getBlockingStats(): BlockingStats {
    return { ...this.stats }
  }

  /**
   * Obtém tentativas de acesso recentes
   */
  getRecentAttempts(hours: number = 1): AccessAttempt[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.accessAttempts.filter(attempt => attempt.timestamp > cutoff)
  }

  /**
   * Obtém tentativas bloqueadas por usuário
   */
  getBlockedAttemptsByUser(userId: string, hours: number = 24): AccessAttempt[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.accessAttempts.filter(attempt => 
      attempt.userId === userId && 
      attempt.blocked && 
      attempt.timestamp > cutoff
    )
  }

  /**
   * Verifica se usuário tem tentativas suspeitas
   */
  hasSuspiciousActivity(userId: string, hours: number = 1): boolean {
    const recentBlocked = this.getBlockedAttemptsByUser(userId, hours)
    return recentBlocked.length >= 3 // 3 ou mais tentativas bloqueadas na última hora
  }

  /**
   * Limpa histórico de tentativas antigas
   */
  cleanupOldAttempts(hours: number = 24): number {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    const initialLength = this.accessAttempts.length
    
    this.accessAttempts = this.accessAttempts.filter(attempt => attempt.timestamp > cutoff)
    
    const cleaned = initialLength - this.accessAttempts.length
    if (cleaned > 0) {
      console.log(`[CrossAccessBlocker] ${cleaned} tentativas antigas removidas`)
    }
    
    return cleaned
  }

  /**
   * Limpa todas as estatísticas (para testes)
   */
  clearStats(): void {
    this.accessAttempts = []
    this.stats = {
      totalAttempts: 0,
      blockedAttempts: 0,
      allowedAttempts: 0,
      blockingRate: 0,
      recentBlocks: [],
      ruleStats: {}
    }
    console.log('[CrossAccessBlocker] Estatísticas limpas')
  }
}

// Singleton instance
export const crossAccessBlocker = CrossAccessBlocker.getInstance()