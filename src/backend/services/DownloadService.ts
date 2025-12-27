/**
 * DownloadService - Serviço de Downloads
 * 
 * Responsável por agendar downloads, verificar status e gerenciar
 * registros nas tabelas tbl_nfe_dow e tbl_nfe_dow_det
 * 
 * Atualizado para usar roteamento automático de base de dados baseado no contexto do usuário
 */

import { databaseRouter } from './DatabaseRouter'
import { apiLogger } from './APILogger'
import { UserContext } from '../types/UserContext'

export interface DownloadScheduleData {
  usrCodigo: string
  chaves: string[]
  ip: string
  requestId?: string
}

export interface DownloadStatus {
  id: number
  status: string
  link?: string
  dataAgendamento: Date
  dataInicio?: Date
  dataFim?: Date
  totalChaves: number
  processadas: number
}

export interface DatabaseDiagnostics {
  currentDatabase: string | null
  isUsingFallback: boolean
  connectionStatus: 'connected' | 'failed' | 'unavailable'
  lastError?: string
}

export class DownloadService {
  /**
   * Valida acesso à base de dados atual
   */
  private async validateDatabaseAccess(): Promise<{ valid: boolean; database: string | null; error?: string }> {
    try {
      const connection = await databaseRouter.getCurrentSqlConnection()
      
      if (!connection) {
        return {
          valid: false,
          database: null,
          error: 'Nenhuma conexão SQL disponível'
        }
      }

      // Tentar uma query simples para validar acesso
      try {
        await connection.$queryRaw`SELECT 1 as test`
        
        const context = databaseRouter.getCurrentContext()
        const database = context?.bancoDeDados || 'spedrevio'
        
        return {
          valid: true,
          database
        }
      } catch (queryError) {
        return {
          valid: false,
          database: null,
          error: `Erro ao validar acesso: ${queryError instanceof Error ? queryError.message : String(queryError)}`
        }
      }

    } catch (error) {
      return {
        valid: false,
        database: null,
        error: `Erro ao obter conexão: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Registra uso da base de dados
   */
  private async logDatabaseUsage(operation: string, usrCodigo?: string, requestId?: string): Promise<void> {
    try {
      const context = databaseRouter.getCurrentContext()
      const database = context?.bancoDeDados || 'spedrevio'
      const isUsingFallback = databaseRouter.isUsingFallback()
      
      const message = isUsingFallback
        ? `${operation} - Usando base global (fallback)`
        : `${operation} - Usando base do cliente: ${database}`

      await apiLogger.logRequest({
        ip: 'system',
        caminhoAcessado: '/api/downloads',
        mensagem: message,
        usrCodigo: usrCodigo ? parseInt(usrCodigo) : undefined,
        tipo: 'DATABASE_USAGE',
        requestId,
        databaseUsed: database,
        isFallback: isUsingFallback
      })

      console.log(`[DownloadService] ${message}${usrCodigo ? ` (usuário: ${usrCodigo})` : ''}`)

    } catch (error) {
      // Não bloquear operação se logging falhar
      console.warn('[DownloadService] Erro ao registrar uso de base de dados:', error)
    }
  }

  /**
   * Obtém diagnóstico da base de dados atual
   */
  async getDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
    try {
      const validation = await this.validateDatabaseAccess()
      const context = databaseRouter.getCurrentContext()
      const isUsingFallback = databaseRouter.isUsingFallback()

      return {
        currentDatabase: validation.database,
        isUsingFallback,
        connectionStatus: validation.valid ? 'connected' : (validation.error ? 'failed' : 'unavailable'),
        lastError: validation.error
      }

    } catch (error) {
      return {
        currentDatabase: null,
        isUsingFallback: true,
        connectionStatus: 'failed',
        lastError: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Obtém a base de dados atual
   */
  getCurrentDatabase(): string | null {
    const context = databaseRouter.getCurrentContext()
    return context?.bancoDeDados || 'spedrevio'
  }

  /**
   * Agenda um novo download criando registros pai e filhos
   * ATUALIZADO: Usa roteamento transparente - não especifica base de dados
   */
  async scheduleDownload(data: DownloadScheduleData): Promise<{ success: boolean; downloadId?: number; error?: string }> {
    try {
      // Registrar uso da base de dados
      await this.logDatabaseUsage('Agendamento de download', data.usrCodigo, data.requestId)

      // Usar conexão transparente - DatabaseRouter decide automaticamente qual base usar
      const prisma = await databaseRouter.getCurrentSqlConnection()
      
      if (!prisma) {
        console.error('[DownloadService] Conexão SQL não disponível para agendamento de download')
        await apiLogger.logError(
          data.ip,
          '/api/downloads/schedule',
          'Conexão SQL não disponível',
          parseInt(data.usrCodigo),
          data.requestId
        )
        return {
          success: false,
          error: 'Serviço de base de dados não disponível'
        }
      }
      
      // Obter próximo ID disponível
      const maxIdResult = await prisma.$queryRaw<[{ MAX_ID: number | null }]>`
        SELECT ISNULL(MAX(ID), 0) as MAX_ID FROM tbl_nfe_dow
      `
      const nextId = (maxIdResult[0]?.MAX_ID || 0) + 1
      
      // Criar registro pai na tbl_nfe_dow
      const downloadRecord = await prisma.tblNfeDow.create({
        data: {
          id: nextId,
          usrCodigo: parseInt(data.usrCodigo),
          status: '1', // 1 = Agendado
          dthrAdd: new Date(),
          tipoDoc: 'NFE',
          csv: 0
        }
      })

      // Criar registros filhos na tbl_nfe_dow_det
      const detailRecords = data.chaves.map(chave => ({
        id: downloadRecord.id,
        chv: chave,
        status: 1, // 1 = Agendado
        dthrAdd: new Date()
      }))

      await prisma.tblNfeDowDet.createMany({
        data: detailRecords
      })

      await apiLogger.logSuccess(
        data.ip,
        '/api/downloads/schedule',
        `Download agendado: ID ${downloadRecord.id}, ${data.chaves.length} chaves`,
        parseInt(data.usrCodigo),
        data.requestId
      )

      return {
        success: true,
        downloadId: downloadRecord.id
      }

    } catch (error) {
      console.error('[DownloadService] Erro ao agendar download:', error)
      await apiLogger.logError(
        data.ip,
        '/api/downloads/schedule',
        `Erro ao agendar download: ${error}`,
        parseInt(data.usrCodigo),
        data.requestId
        
      )

      return {
        success: false,
        error: 'Erro interno ao agendar download'
      }
    }
  }

  /**
   * Obtém status de downloads do usuário
   * ATUALIZADO: Usa roteamento transparente - não especifica base de dados
   */
  async getDownloadStatus(usrCodigo: string, requestId?: string): Promise<{ success: boolean; downloads?: DownloadStatus[]; error?: string }> {
    try {
      // Registrar uso da base de dados
      await this.logDatabaseUsage('Consulta de status de downloads', usrCodigo, requestId)

      // Usar conexão transparente - DatabaseRouter decide automaticamente qual base usar
      const prisma = await databaseRouter.getCurrentSqlConnection()
      
      if (!prisma) {
        console.error('[DownloadService] Conexão SQL não disponível para consulta de downloads')
        return {
          success: false,
          error: 'Serviço de base de dados não disponível'
        }
      }
      
      const downloads = await prisma.tblNfeDow.findMany({
        where: {
          usrCodigo: parseInt(usrCodigo)
        },
        orderBy: {
          dthrAdd: 'desc'
        },
        take: 10, // Últimos 10 downloads
        include: {
          detalhes: true
        }
      })

      const downloadStatus: DownloadStatus[] = downloads.map(download => ({
        id: download.id,
        status: download.status || '0',
        link: download.link || undefined,
        dataAgendamento: download.dthrAdd || new Date(),
        dataInicio: download.dataInicial || undefined,
        dataFim: download.dataFinal || undefined,
        totalChaves: download.detalhes.length,
        processadas: download.detalhes.filter(d => d.status === 2).length
      }))

      return {
        success: true,
        downloads: downloadStatus
      }

    } catch (error) {
      console.error('[DownloadService] Erro ao obter status de downloads:', error)
      return {
        success: false,
        error: 'Erro interno ao consultar downloads'
      }
    }
  }

  /**
   * Marca download como iniciado (STATUS = '3')
   * ATUALIZADO: Usa roteamento transparente - não especifica base de dados
   * CRÍTICO: Este método é chamado quando DOWNLOAD_READY é recebido e download é iniciado
   * REGRA: Nunca preencher dataInicial - usar apenas dthrAdd na criação e dthrEdit nas atualizações
   */
  async markDownloadStarted(downloadId: number, usrCodigo: string, requestId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[DownloadService] 🔄 Marcando download ${downloadId} como iniciado (STATUS = '3') para usuário ${usrCodigo}`)
      
      // Registrar uso da base de dados
      await this.logDatabaseUsage('Marcação de download como iniciado', usrCodigo, requestId)

      // Usar conexão transparente - DatabaseRouter decide automaticamente qual base usar
      const prisma = await databaseRouter.getCurrentSqlConnection()
      
      if (!prisma) {
        console.error('[DownloadService] ❌ Conexão SQL não disponível para atualização de download')
        return {
          success: false,
          error: 'Serviço de base de dados não disponível'
        }
      }
      
      // Verificar se o download pertence ao usuário
      console.log(`[DownloadService] 🔍 Verificando se download ${downloadId} pertence ao usuário ${usrCodigo}`)
      const download = await prisma.tblNfeDow.findFirst({
        where: {
          id: downloadId,
          usrCodigo: parseInt(usrCodigo)
        }
      })

      if (!download) {
        console.error(`[DownloadService] ❌ Download ${downloadId} não encontrado ou não pertence ao usuário ${usrCodigo}`)
        return {
          success: false,
          error: 'Download não encontrado ou não pertence ao usuário'
        }
      }

      console.log(`[DownloadService] ✅ Download encontrado - Status atual: ${download.status}`)

      // Atualizar status para '3' (Iniciado) - APENAS dthrEdit, nunca dataInicial
      console.log(`[DownloadService] 🔄 Atualizando status na tabela tbl_nfe_dow: ${download.status} → '3'`)
      const updateResult = await prisma.tblNfeDow.update({
        where: {
          id: downloadId
        },
        data: {
          status: '3',
          dthrEdit: new Date()
        }
      })

      console.log(`[DownloadService] ✅ Download ${downloadId} marcado como iniciado com sucesso na tabela tbl_nfe_dow`)
      console.log(`[DownloadService] 📊 Detalhes da atualização:`, {
        id: updateResult.id,
        status: updateResult.status,
        dthrEdit: updateResult.dthrEdit
      })

      return {
        success: true
      }

    } catch (error) {
      console.error(`[DownloadService] ❌ Erro ao marcar download ${downloadId} como iniciado:`, error)
      return {
        success: false,
        error: 'Erro interno ao atualizar status do download'
      }
    }
  }

  /**
   * Verifica downloads prontos para um usuário (STATUS = '2' e LINK preenchido)
   */
  async checkReadyDownloads(usrCodigo: string, requestId?: string): Promise<{ success: boolean; readyDownloads?: DownloadStatus[]; error?: string }> {
    try {
      // Validar acesso à base de dados
      const validation = await this.validateDatabaseAccess()
      if (!validation.valid) {
        console.error('[DownloadService] Validação de acesso falhou:', validation.error)
        return {
          success: false,
          error: 'Serviço de base de dados não disponível'
        }
      }

      // Registrar uso da base de dados
      await this.logDatabaseUsage('Verificação de downloads prontos', usrCodigo, requestId)

      // Usar conexão automática baseada no contexto
      const prisma = await databaseRouter.getCurrentSqlConnection()
      
      if (!prisma) {
        console.error('[DownloadService] Conexão SQL não disponível para verificação de downloads prontos')
        return {
          success: false,
          error: 'Serviço de base de dados não disponível'
        }
      }
      
      const readyDownloads = await prisma.tblNfeDow.findMany({
        where: {
          usrCodigo: parseInt(usrCodigo),
          status: '2', // 2 = Pronto
          link: {
            not: null
          }
        },
        orderBy: {
          dataFinal: 'desc'
        },
        include: {
          detalhes: true
        }
      })

      const downloadStatus: DownloadStatus[] = readyDownloads.map(download => ({
        id: download.id,
        status: download.status!,
        link: download.link!,
        dataAgendamento: download.dthrAdd || new Date(),
        dataInicio: download.dataInicial || undefined,
        dataFim: download.dataFinal || undefined,
        totalChaves: download.detalhes.length,
        processadas: download.detalhes.filter(d => d.status === 2).length
      }))

      return {
        success: true,
        readyDownloads: downloadStatus
      }

    } catch (error) {
      console.error('[DownloadService] Erro ao verificar downloads prontos:', error)
      return {
        success: false,
        error: 'Erro interno ao verificar downloads prontos'
      }
    }
  }

  /**
   * Limpa downloads antigos (mais de 7 dias)
   */
  async cleanupOldDownloads(requestId?: string): Promise<{ success: boolean; cleaned?: number; error?: string }> {
    try {
      // Validar acesso à base de dados
      const validation = await this.validateDatabaseAccess()
      if (!validation.valid) {
        console.error('[DownloadService] Validação de acesso falhou:', validation.error)
        return {
          success: false,
          error: 'Serviço de base de dados não disponível'
        }
      }

      // Registrar uso da base de dados
      await this.logDatabaseUsage('Limpeza de downloads antigos', undefined, requestId)

      // Usar conexão automática baseada no contexto
      const prisma = await databaseRouter.getCurrentSqlConnection()
      
      if (!prisma) {
        console.error('[DownloadService] Conexão SQL não disponível para limpeza de downloads')
        return {
          success: false,
          error: 'Serviço de base de dados não disponível'
        }
      }
      
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Primeiro, deletar registros de detalhes
      await prisma.tblNfeDowDet.deleteMany({
        where: {
          download: {
            dthrAdd: {
              lt: sevenDaysAgo
            }
          }
        }
      })

      // Depois, deletar registros principais
      const result = await prisma.tblNfeDow.deleteMany({
        where: {
          dthrAdd: {
            lt: sevenDaysAgo
          }
        }
      })

      return {
        success: true,
        cleaned: result.count
      }

    } catch (error) {
      console.error('[DownloadService] Erro ao limpar downloads antigos:', error)
      return {
        success: false,
        error: 'Erro interno ao limpar downloads antigos'
      }
    }
  }

  // ========== NOVOS MÉTODOS CONTEXT-AWARE ==========

  /**
   * Agenda download usando contexto automático (sem especificar usuário)
   */
  async scheduleDownloadWithContext(chaves: string[], ip: string, requestId?: string): Promise<{ success: boolean; downloadId?: number; error?: string }> {
    const context = databaseRouter.getCurrentContext()
    
    if (!context || !context.isAuthenticated) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      }
    }

    const data: DownloadScheduleData = {
      usrCodigo: context.usrCodigo,
      chaves,
      ip,
      requestId
    }

    return this.scheduleDownload(data)
  }

  /**
   * Obtém status de downloads do usuário atual
   */
  async getMyDownloadStatus(requestId?: string): Promise<{ success: boolean; downloads?: DownloadStatus[]; error?: string }> {
    const context = databaseRouter.getCurrentContext()
    
    if (!context || !context.isAuthenticated) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      }
    }

    return this.getDownloadStatus(context.usrCodigo, requestId)
  }

  /**
   * Marca download do usuário atual como iniciado
   */
  async markMyDownloadStarted(downloadId: number, requestId?: string): Promise<{ success: boolean; error?: string }> {
    const context = databaseRouter.getCurrentContext()
    
    if (!context || !context.isAuthenticated) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      }
    }

    return this.markDownloadStarted(downloadId, context.usrCodigo, requestId)
  }

  /**
   * Verifica downloads prontos do usuário atual
   */
  async checkMyReadyDownloads(requestId?: string): Promise<{ success: boolean; readyDownloads?: DownloadStatus[]; error?: string }> {
    const context = databaseRouter.getCurrentContext()
    
    if (!context || !context.isAuthenticated) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      }
    }

    return this.checkReadyDownloads(context.usrCodigo, requestId)
  }
}

// Singleton instance
export const downloadService = new DownloadService()