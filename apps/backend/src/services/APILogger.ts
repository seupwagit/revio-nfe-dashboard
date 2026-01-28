/**
 * APILogger - Serviço de Log de API
 * 
 * Responsável por registrar todas as requisições e ações na tabela tbl_api_log
 * com suporte a roteamento automático baseado no contexto do usuário
 */

import { databaseRouter } from './DatabaseRouter'
import { userContextManager } from './UserContextManager'
import { UserContext, ContextError } from '../types/UserContext'
import { AuthenticatedRequest } from '../middleware/UserContextMiddleware'

export interface LogEntry {
  ip?: string
  caminhoAcessado?: string
  mensagem?: string
  usrCodigo?: number
  tipo?: string
  databaseUsed?: string
  isFallback?: boolean
  requestId?: string
  contextInfo?: string
}

export interface ConnectionEvent {
  type: 'connection_created' | 'connection_failed' | 'fallback_used' | 'context_set' | 'context_cleared'
  database: string
  userId?: string
  error?: string
  timestamp: Date
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export class APILogger {
  private fallbackToGlobal: boolean = true
  private logConnectionEvents: boolean = true

  /**
   * Registra uma requisição na tabela tbl_api_log
   */
  async logRequest(entry: LogEntry): Promise<void> {
    try {
      // Determinar qual conexão usar
      const { connection, databaseUsed, isFallback } = this.getLogConnection(entry.requestId)
      
      // Verificar se o Prisma está disponível
      if (!connection) {
        console.warn('[APILogger] Nenhuma conexão disponível, pulando log')
        return
      }

      // Enriquecer entry com informações de contexto
      const enrichedEntry = {
        ...entry,
        databaseUsed,
        isFallback
      }
      
      await connection.tblApiLog.create({
        data: {
          dthr: new Date(),
          ip: enrichedEntry.ip || null,
          caminhoAcessado: enrichedEntry.caminhoAcessado || null,
          mensagem: enrichedEntry.mensagem || null,
          usrCodigo: enrichedEntry.usrCodigo || null,
          tipo: enrichedEntry.tipo || 'REQUEST'
        }
      })

      // Log de debug sobre qual base foi usada
      if (isFallback && enrichedEntry.usrCodigo) {
        console.log(`[APILogger] Log registrado na base global (fallback) para usuário ${enrichedEntry.usrCodigo}`)
      }

    } catch (error) {
      // Não bloquear a requisição se o log falhar
      console.warn('[APILogger] Erro ao registrar log (não crítico):', error instanceof Error ? error.message : error)
      
      // Tentar fallback se não estava usando
      if (!entry.isFallback && this.fallbackToGlobal) {
        try {
          const globalConnection = databaseRouter.getGlobalSqlConnection()
          if (globalConnection) {
            await globalConnection.tblApiLog.create({
              data: {
                dthr: new Date(),
                ip: entry.ip || null,
                caminhoAcessado: entry.caminhoAcessado || null,
                mensagem: `[FALLBACK] ${entry.mensagem || ''}`,
                usrCodigo: entry.usrCodigo || null,
                tipo: entry.tipo || 'REQUEST'
              }
            })
            console.log('[APILogger] Log registrado na base global como fallback')
          }
        } catch (fallbackError) {
          console.error('[APILogger] Erro no fallback também:', fallbackError)
        }
      }
    }
  }

  /**
   * Registra log com contexto automático
   */
  async logWithContext(level: LogLevel, message: string, req: AuthenticatedRequest): Promise<void> {
    const entry: LogEntry = {
      ip: req.ip || 'unknown',
      caminhoAcessado: req.path,
      mensagem: message,
      usrCodigo: req.user ? parseInt(req.user.usrCodigo) : undefined,
      tipo: level,
      requestId: req.requestId
    }

    await this.logRequest(entry)
  }

  /**
   * Registra evento de conexão
   */
  async logConnectionEvent(event: ConnectionEvent, req?: AuthenticatedRequest): Promise<void> {
    const message = this.formatConnectionEventMessage(event)
    
    const entry: LogEntry = {
      ip: req?.ip || 'system',
      caminhoAcessado: req?.path || '/system/connection',
      mensagem: message,
      usrCodigo: event.userId ? parseInt(event.userId) : undefined,
      tipo: 'CONNECTION_EVENT',
      requestId: req?.requestId
    }

    await this.logRequest(entry)
  }

  /**
   * Registra uso de fallback
   */
  async logFallbackUsage(reason: string, req: AuthenticatedRequest): Promise<void> {
    const message = `Fallback para base global: ${reason}`
    
    const entry: LogEntry = {
      ip: req.ip || 'unknown',
      caminhoAcessado: req.path,
      mensagem: message,
      usrCodigo: req.user ? parseInt(req.user.usrCodigo) : undefined,
      tipo: 'FALLBACK_USED',
      requestId: req.requestId,
      isFallback: true
    }

    await this.logRequest(entry)
  }

  /**
   * Verifica se deve usar base do cliente
   */
  shouldUseClientDatabase(req: AuthenticatedRequest): boolean {
    return !!(req.userContext && req.userContext.bancoDeDados && req.userContext.isAuthenticated)
  }

  /**
   * Configura se deve fazer fallback para base global
   */
  setFallbackToGlobal(enabled: boolean): void {
    this.fallbackToGlobal = enabled
    console.log(`[APILogger] Fallback para base global: ${enabled ? 'habilitado' : 'desabilitado'}`)
  }

  /**
   * Obtém conexão para logging baseada no contexto
   */
  private getLogConnection(requestId?: string): { 
    connection: any | null; 
    databaseUsed: string; 
    isFallback: boolean 
  } {
    try {
      // Se não há requestId, usar base global
      if (!requestId) {
        return {
          connection: databaseRouter.getGlobalSqlConnection(),
          databaseUsed: 'spedrevio',
          isFallback: false
        }
      }

      // Tentar obter contexto da requisição
      const context = userContextManager.getContext(requestId)
      
      if (context && context.userContext && context.userContext.bancoDeDados) {
        // Tentar usar base do cliente
        const clientConnection = databaseRouter.getSqlConnection(context.userContext.bancoDeDados)
        
        if (clientConnection) {
          return {
            connection: clientConnection,
            databaseUsed: context.userContext.bancoDeDados,
            isFallback: false
          }
        }
      }

      // Fallback para base global
      return {
        connection: databaseRouter.getGlobalSqlConnection(),
        databaseUsed: 'spedrevio',
        isFallback: true
      }

    } catch (error) {
      console.warn('[APILogger] Erro ao determinar conexão, usando base global:', error)
      return {
        connection: databaseRouter.getGlobalSqlConnection(),
        databaseUsed: 'spedrevio',
        isFallback: true
      }
    }
  }

  /**
   * Formata mensagem de evento de conexão
   */
  private formatConnectionEventMessage(event: ConnectionEvent): string {
    const timestamp = event.timestamp.toISOString()
    
    switch (event.type) {
      case 'connection_created':
        return `Conexão criada para base: ${event.database} (${timestamp})`
      
      case 'connection_failed':
        return `Falha na conexão com base: ${event.database} - ${event.error || 'Erro desconhecido'} (${timestamp})`
      
      case 'fallback_used':
        return `Fallback usado para base: ${event.database} - ${event.error || 'Base indisponível'} (${timestamp})`
      
      case 'context_set':
        return `Contexto configurado para base: ${event.database} (usuário: ${event.userId}) (${timestamp})`
      
      case 'context_cleared':
        return `Contexto limpo para base: ${event.database} (usuário: ${event.userId}) (${timestamp})`
      
      default:
        return `Evento de conexão: ${event.type} - ${event.database} (${timestamp})`
    }
  }
  /**
   * Registra um erro na tabela tbl_api_log
   */
  async logError(ip: string, path: string, error: string, usrCodigo?: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: path,
      mensagem: error,
      usrCodigo,
      tipo: 'ERROR',
      requestId
    })
  }

  /**
   * Registra uma ação bem-sucedida na tabela tbl_api_log
   */
  async logSuccess(ip: string, path: string, message: string, usrCodigo?: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: path,
      mensagem: message,
      usrCodigo,
      tipo: 'SUCCESS',
      requestId
    })
  }

  /**
   * Registra tentativa de login
   */
  async logLogin(ip: string, username: string, success: boolean, usrCodigo?: number, requestId?: string): Promise<void> {
    const message = success 
      ? `Login bem-sucedido para usuário: ${username}`
      : `Tentativa de login falhada para usuário: ${username}`

    await this.logRequest({
      ip,
      caminhoAcessado: '/api/auth/login',
      mensagem: message,
      usrCodigo,
      tipo: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      requestId
    })
  }

  /**
   * Registra logout
   */
  async logLogout(ip: string, usrCodigo: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: '/api/auth/logout',
      mensagem: 'Logout realizado',
      usrCodigo,
      tipo: 'LOGOUT',
      requestId
    })
  }

  /**
   * Registra acesso negado
   */
  async logAccessDenied(ip: string, path: string, reason: string, usrCodigo?: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: path,
      mensagem: `Acesso negado: ${reason}`,
      usrCodigo,
      tipo: 'ACCESS_DENIED',
      requestId
    })
  }

  /**
   * Registra ação administrativa
   */
  async logAdminAction(ip: string, path: string, action: string, usrCodigo: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: path,
      mensagem: `Ação administrativa: ${action}`,
      usrCodigo,
      tipo: 'ADMIN_ACTION',
      requestId
    })
  }

  /**
   * Registra download agendado
   */
  async logDownloadScheduled(ip: string, usrCodigo: number, downloadId: number, keysCount: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: '/api/downloads/schedule',
      mensagem: `Download agendado ID: ${downloadId}, ${keysCount} documentos`,
      usrCodigo,
      tipo: 'DOWNLOAD_SCHEDULED',
      requestId
    })
  }

  /**
   * Registra download iniciado
   */
  async logDownloadStarted(ip: string, usrCodigo: number, downloadId: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: '/api/downloads/started',
      mensagem: `Download iniciado ID: ${downloadId}`,
      usrCodigo,
      tipo: 'DOWNLOAD_STARTED',
      requestId
    })
  }

  /**
   * Registra consulta de dados
   */
  async logDataQuery(ip: string, path: string, query: string, usrCodigo: number, requestId?: string): Promise<void> {
    await this.logRequest({
      ip,
      caminhoAcessado: path,
      mensagem: `Consulta: ${query}`,
      usrCodigo,
      tipo: 'DATA_QUERY',
      requestId
    })
  }
}

// Singleton instance
export const apiLogger = new APILogger()