/**
 * FiscalDocumentsService - Serviço de Documentos Fiscais
 * 
 * Responsável por operações com documentos fiscais (NF-e, CF-e, CT-e)
 * usando roteamento automático de base de dados baseado no contexto do usuário
 */

import mongoose from 'mongoose'
import { databaseRouter } from './DatabaseRouter'
import { apiLogger } from './APILogger'
import { UserContext } from '../types/UserContext'
import { createDocumentFilter, validateDates, formatDateRangeForLog } from '../utils/dateFilter'

export interface FetchOptions {
  collection?: string
  dtIni?: string
  dtFin?: string
  cnpjEmit?: string
  cnpjDest?: string
  status?: string
  page?: number
  size?: number
}

export interface DocumentsResponse {
  success: boolean
  data: any[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
  executionTime: number
}

export interface CountResponse {
  success: boolean
  count: number
}

export interface StatsResponse {
  success: boolean
  stats: any
}

/**
 * Serviço de Documentos Fiscais com roteamento automático
 * 
 * Usa getCurrentMongoConnection() para obter automaticamente a conexão
 * da base de dados do usuário autenticado
 */
export class FiscalDocumentsService {

  /**
   * Busca documentos fiscais usando roteamento transparente
   * ATUALIZADO: Não especifica base de dados - usa roteamento automático
   */
  async fetchDocuments(options: FetchOptions): Promise<DocumentsResponse> {
    const startTime = Date.now()
    
    try {
      const {
        collection = 'tbl_nfe_100',
        dtIni,
        dtFin,
        cnpjEmit,
        cnpjDest,
        page = 1,
        size = 100
      } = options

      // Validar datas se fornecidas
      if (dtIni || dtFin) {
        validateDates(dtIni, dtFin)
      }

      // Obter conexão MongoDB usando roteamento transparente
      const mongoConnection = await databaseRouter.getCurrentMongoConnection()
      const currentDatabase = this.getCurrentDatabase()
      
      // Log de uso da base de dados
      await this.logDatabaseUsage('fetchDocuments', {
        collection,
        database: currentDatabase,
        hasFilters: !!(dtIni || dtFin || cnpjEmit || cnpjDest)
      })

      console.log('[FiscalDocumentsService] 📄 Buscando documentos:', { 
        collection, 
        periodo: formatDateRangeForLog(dtIni, dtFin),
        page, 
        size,
        database: currentDatabase
      })

      const coll = mongoConnection.collection(collection)

      // Criar filtro usando utilitário centralizado
      const filter = createDocumentFilter({
        dtIni,
        dtFin,
        cnpjEmit,
        cnpjDest
      })

      // Paginação
      const skip = (page - 1) * size
      const limit = size

      // Buscar documentos
      const documents = await coll
        .find(filter)
        .sort({ DT_DOC: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      // Contar total (otimizado)
      const hasFilters = Object.keys(filter).length > 0
      const total = hasFilters 
        ? await coll.countDocuments(filter)
        : await coll.estimatedDocumentCount()

      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.log(`[FiscalDocumentsService] ✅ ${documents.length} documentos retornados em ${executionTime}ms`)

      // Mapear campos do MongoDB para o formato esperado pelo frontend
      const mappedDocuments = this.mapDocuments(documents)

      return {
        success: true,
        data: mappedDocuments,
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size)
        },
        executionTime
      }

    } catch (error) {
      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.error('[FiscalDocumentsService] ❌ Erro ao buscar documentos:', error)
      
      // Log do erro
      await this.logDatabaseUsage('fetchDocuments_error', {
        error: error instanceof Error ? error.message : String(error),
        executionTime
      })

      throw error
    }
  }

  /**
   * Conta documentos fiscais usando roteamento automático
   */
  async fetchCount(options: Omit<FetchOptions, 'page' | 'size'>): Promise<CountResponse> {
    const startTime = Date.now()
    
    try {
      const {
        collection = 'tbl_nfe_100',
        dtIni,
        dtFin,
        cnpjEmit,
        cnpjDest
      } = options

      // Validar datas se fornecidas
      if (dtIni || dtFin) {
        validateDates(dtIni, dtFin)
      }

      // Obter conexão MongoDB usando roteamento automático
      const mongoConnection = await databaseRouter.getCurrentMongoConnection()
      const currentDatabase = this.getCurrentDatabase()

      // Log de uso da base de dados
      await this.logDatabaseUsage('fetchCount', {
        collection,
        database: currentDatabase,
        hasFilters: !!(dtIni || dtFin || cnpjEmit || cnpjDest)
      })

      console.log('[FiscalDocumentsService] 🔢 Contando documentos:', { 
        collection, 
        database: currentDatabase
      })

      // Validar acesso à base MongoDB
      await this.validateSpecificMongoAccess(mongoConnection)

      const coll = mongoConnection.collection(collection)

      // Criar filtro usando utilitário centralizado
      const filter = createDocumentFilter({
        dtIni,
        dtFin,
        cnpjEmit,
        cnpjDest
      })

      // Contar documentos (otimizado)
      const hasFilters = Object.keys(filter).length > 0
      const count = hasFilters 
        ? await coll.countDocuments(filter)
        : await coll.estimatedDocumentCount()

      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.log(`[FiscalDocumentsService] ✅ ${count} documentos contados em ${executionTime}ms`)

      return {
        success: true,
        count
      }

    } catch (error) {
      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.error('[FiscalDocumentsService] ❌ Erro ao contar documentos:', error)
      
      // Log do erro
      await this.logDatabaseUsage('fetchCount_error', {
        error: error instanceof Error ? error.message : String(error),
        executionTime
      })

      throw error
    }
  }

  /**
   * Busca estatísticas de documentos fiscais usando roteamento automático
   */
  async fetchStats(options: Omit<FetchOptions, 'page' | 'size'>): Promise<StatsResponse> {
    const startTime = Date.now()
    
    try {
      const {
        collection = 'tbl_nfe_100',
        dtIni,
        dtFin
      } = options

      // Validar datas se fornecidas
      if (dtIni || dtFin) {
        validateDates(dtIni, dtFin)
      }

      // Obter conexão MongoDB usando roteamento automático
      const mongoConnection = await databaseRouter.getCurrentMongoConnection()
      const currentDatabase = this.getCurrentDatabase()

      // Log de uso da base de dados
      await this.logDatabaseUsage('fetchStats', {
        collection,
        database: currentDatabase
      })

      console.log('[FiscalDocumentsService] 📊 Buscando estatísticas:', { 
        collection, 
        database: currentDatabase
      })

      // Validar acesso à base MongoDB
      await this.validateSpecificMongoAccess(mongoConnection)

      const coll = mongoConnection.collection(collection)

      // Criar filtro usando utilitário centralizado
      const filter = createDocumentFilter({
        dtIni,
        dtFin
      })

      // Agregar estatísticas básicas
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            totalValue: { $sum: { $toDouble: "$VL_DOC" } },
            avgValue: { $avg: { $toDouble: "$VL_DOC" } },
            minValue: { $min: { $toDouble: "$VL_DOC" } },
            maxValue: { $max: { $toDouble: "$VL_DOC" } }
          }
        }
      ]

      const statsResult = await coll.aggregate(pipeline).toArray()
      const stats = statsResult[0] || {
        totalDocuments: 0,
        totalValue: 0,
        avgValue: 0,
        minValue: 0,
        maxValue: 0
      }

      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.log(`[FiscalDocumentsService] ✅ Estatísticas calculadas em ${executionTime}ms`)

      return {
        success: true,
        stats
      }

    } catch (error) {
      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.error('[FiscalDocumentsService] ❌ Erro ao buscar estatísticas:', error)
      
      // Log do erro
      await this.logDatabaseUsage('fetchStats_error', {
        error: error instanceof Error ? error.message : String(error),
        executionTime
      })

      throw error
    }
  }

  // ========== MÉTODOS DE DIAGNÓSTICO ==========

  /**
   * Obtém o nome da base de dados atual
   */
  getCurrentDatabase(): string | null {
    try {
      const context = databaseRouter.getCurrentContext()
      return context?.bancoDeDados || null
    } catch (error) {
      console.error('[FiscalDocumentsService] Erro ao obter base atual:', error)
      return null
    }
  }

  /**
   * Valida se tem acesso à base MongoDB atual
   */
  async validateMongoAccess(): Promise<boolean> {
    try {
      const mongoConnection = await databaseRouter.getCurrentMongoConnection()
      
      if (!mongoConnection) {
        console.error('[FiscalDocumentsService] ❌ Conexão MongoDB não disponível')
        return false
      }

      // Testar acesso básico
      if (mongoConnection.db) {
        await mongoConnection.db.admin().ping()
      } else {
        throw new Error('Database não disponível na conexão MongoDB')
      }
      
      console.log('[FiscalDocumentsService] ✅ Acesso MongoDB validado')
      return true

    } catch (error) {
      console.error('[FiscalDocumentsService] ❌ Erro na validação de acesso MongoDB:', error)
      return false
    }
  }

  /**
   * Valida acesso a uma conexão MongoDB específica (método privado)
   */
  private async validateSpecificMongoAccess(connection: mongoose.Connection): Promise<void> {
    if (!connection) {
      throw new Error('Conexão MongoDB não disponível')
    }

    try {
      // Testar acesso básico
      if (connection.db) {
        await connection.db.admin().ping()
      } else {
        throw new Error('Database não disponível na conexão')
      }
    } catch (error) {
      console.error('[FiscalDocumentsService] Erro ao validar acesso MongoDB:', error)
      throw new Error('Erro de acesso à base MongoDB')
    }
  }

  /**
   * Registra uso da base de dados para auditoria
   */
  async logDatabaseUsage(operation: string, details?: any): Promise<void> {
    try {
      const context = databaseRouter.getCurrentContext()
      const database = this.getCurrentDatabase()
      
      const logData = {
        operation,
        database: database || 'global',
        service: 'FiscalDocumentsService',
        userId: context?.usrCodigo,
        userName: context?.usrNome,
        timestamp: new Date().toISOString(),
        ...details
      }

      console.log(`[FiscalDocumentsService] 📋 ${operation}:`, logData)

      // Registrar no APILogger se disponível
      if (context) {
        await apiLogger.logSuccess(
          `FiscalDocumentsService.${operation} - Database: ${database}`,
          {} as any, // req object não disponível aqui
          context.usrCodigo
        )
      }

    } catch (error) {
      console.error('[FiscalDocumentsService] Erro ao registrar uso da base:', error)
      // Não propagar erro de logging
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Mapeia documentos do MongoDB para o formato esperado pelo frontend
   */
  private mapDocuments(documents: any[]): any[] {
    return documents.map(doc => ({
      id: doc._id?.toString() || doc.ID || '',
      numero: doc.NUM_DOC || doc.numero || '',
      serie: doc.SER || doc.serie || '',
      modelo: doc.COD_MOD || doc.modelo || '55',
      chaveAcesso: doc.CHV_NFE || doc.chaveAcesso || '',
      dataEmissao: doc.DT_DOC || doc.dataEmissao || '',
      valorTotal: parseFloat(doc.VL_DOC || doc.valorTotal || 0),
      status: doc.PROTOCOLADA === 'Sim' ? 'autorizada' : doc.PROTOCOLADA === 'Não' ? 'processando' : doc.status || 'processando',
      protocolada: doc.PROTOCOLADA || doc.protocolada || 'Não',
      tipo: doc.TIPO || doc.tipo || 'nfe',
      tipoOperacao: doc.IND_OPER || doc.tipoOperacao || '1',
      naturezaOperacao: doc.NAT_OPER || doc.naturezaOperacao || '',
      
      // Totais
      totais: {
        baseCalculo: parseFloat(doc.VL_BC_ICMS || 0),
        valorICMS: parseFloat(doc.VL_ICMS || 0),
        valorIPI: parseFloat(doc.VL_IPI || 0),
        valorPIS: parseFloat(doc.VL_PIS || 0),
        valorCOFINS: parseFloat(doc.VL_COFINS || 0),
        valorFrete: parseFloat(doc.VL_FRETE || 0),
        valorSeguro: parseFloat(doc.VL_SEGURO || 0),
        valorDesconto: parseFloat(doc.VL_DESCONTO || 0),
        valorOutros: parseFloat(doc.VL_OUTROS || 0)
      },
      
      // Emitente
      emitente: {
        cnpj: doc.CNPJ_EMIT || doc.emitente?.cnpj || '',
        razaoSocial: doc.NOME_EMIT || doc.EMIT_XNOME || doc.emitente?.razaoSocial || '',
        nomeFantasia: doc.EMIT_XFANT || doc.emitente?.nomeFantasia || '',
        ie: doc.IE_EMIT || doc.EMIT_IE || doc.emitente?.ie || '',
        endereco: doc.EMIT_XLGR || doc.emitente?.endereco || '',
        municipio: doc.EMIT_XMUN || doc.emitente?.municipio || '',
        uf: doc.UF_EMIT || doc.EMIT_UF || doc.emitente?.uf || ''
      },
      
      // Destinatário
      destinatario: {
        cnpj: doc.CNPJ_DEST || doc.destinatario?.cnpj || '',
        cpfCnpj: doc.CNPJ_DEST || doc.CPF_DEST || doc.destinatario?.cpfCnpj || '',
        razaoSocial: doc.NOME_DEST || doc.DEST_XNOME || doc.destinatario?.razaoSocial || '',
        nome: doc.NOME_DEST || doc.DEST_XNOME || doc.destinatario?.nome || '',
        ie: doc.IE_DEST || doc.DEST_IE || doc.destinatario?.ie || '',
        endereco: doc.DEST_XLGR || doc.destinatario?.endereco || '',
        municipio: doc.DEST_XMUN || doc.destinatario?.municipio || '',
        uf: doc.UF_DEST || doc.DEST_UF || doc.destinatario?.uf || ''
      },
      
      // Informações adicionais
      origem: doc.ORIGEM || doc.origem || '',
      statusManifestacao: doc.STATUS_MANIFESTACAO || doc.statusManifestacao || '',
      informacoesAdicionais: doc.INF_ADIC || doc.informacoesAdicionais || ''
    }))
  }
}

// Singleton instance
export const fiscalDocumentsService = new FiscalDocumentsService()