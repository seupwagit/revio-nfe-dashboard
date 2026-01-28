/**
 * AnalyticsService - Serviço de Analytics e Agregações
 * 
 * Responsável por operações de analytics e agregações de documentos fiscais
 * usando roteamento automático de base de dados baseado no contexto do usuário
 */

import mongoose from 'mongoose';
import { AnalyticsData } from '../types/analytics/analytics-data.interface';
import { AnalyticsOptions } from '../types/analytics/analytics-options.interface';
import { AnalyticsResponse } from '../types/analytics/analytics-response.interface';
import { createDocumentFilter, formatDateRangeForLog, validateDates } from '../utils/dateFilter';
import {
    createGroupingFilter
} from '../utils/nfeGrouping';
import { apiLogger } from './APILogger';
import { databaseRouter } from './DatabaseRouter';
import { queryInterceptor } from './QueryInterceptor';

/**
 * Serviço de Analytics com roteamento automático
 * 
 * Usa getCurrentMongoConnection() para obter automaticamente a conexão
 * da base de dados do usuário autenticado
 */
export class AnalyticsService {

  /**
   * Busca dados agregados para Analytics usando roteamento transparente com agrupamento por CHV_NFE
   */
  async fetchAnalyticsAggregation(options: AnalyticsOptions): Promise<AnalyticsResponse> {
    const startTime = Date.now()
    
    try {
      const { collection, dtIni, dtFin, cnpjEmit, cnpjDest } = options

      // Validar datas
      validateDates(dtIni, dtFin)

      // Obter configuração de agrupamento
      const { getValidatedGroupingConfig } = await import('../utils/nfeGrouping')
      const groupingConfig = getValidatedGroupingConfig()

      // Log de uso da base de dados
      const currentDatabase = this.getCurrentDatabase()
      await this.logDatabaseUsage('fetchAnalyticsAggregation', {
        collection,
        database: currentDatabase,
        periodo: formatDateRangeForLog(dtIni, dtFin),
        hasFilters: !!(cnpjEmit || cnpjDest),
        groupingEnabled: groupingConfig.enabled,
        groupingKeys: groupingConfig.keys
      })

      console.log('[AnalyticsService] 📊 Buscando agregação Analytics:', { 
        collection, 
        periodo: formatDateRangeForLog(dtIni, dtFin),
        cnpjEmit, 
        cnpjDest,
        database: currentDatabase,
        grouping: groupingConfig.enabled ? `Habilitado (${groupingConfig.keys.join(', ')})` : 'Desabilitado'
      })

      // Log da configuração de agrupamento
      if (groupingConfig.enabled) {
        console.log('[AnalyticsService] ✅ Agrupamento NFE habilitado para chaves:', groupingConfig.keys.join(', '))
      }

      // Usar interceptação de consultas para operações MongoDB
      const { result } = await queryInterceptor.interceptMongoQuery(
        'aggregate',
        collection,
        async () => {
          // Obter conexão MongoDB usando roteamento transparente
          const mongoConnection = await databaseRouter.getCurrentMongoConnection()
          
          // Validar acesso à base MongoDB
          await this.validateSpecificMongoAccess(mongoConnection)
          
          const coll = mongoConnection.collection(collection)

          // Criar filtro usando utilitário centralizado
          const baseMatchStage = createDocumentFilter({
            dtIni,
            dtFin,
            cnpjEmit,
            cnpjDest
          })

          // Aplicar agrupamento se habilitado
          const matchStage = groupingConfig.enabled ? createGroupingFilter(baseMatchStage, groupingConfig) : baseMatchStage

          // Log do filtro aplicado para debug
          if (groupingConfig.enabled) {
            console.log('[AnalyticsService] 🔍 Filtro com agrupamento aplicado:', JSON.stringify(matchStage, null, 2))
          }

          // Pipeline de agregação otimizado
          const pipeline: Array<Record<string, any>> = [
            { $match: matchStage }
          ]

          // LOG DEBUG: Verificar quantos documentos batem com o filtro inicial
          const dbName = mongoConnection.name || mongoConnection.db?.databaseName;
          const matchCount = await coll.countDocuments(matchStage);
          
          console.log(`[AnalyticsService] 🔍 [DEBUG] DATABASE: ${dbName}`);
          console.log(`[AnalyticsService] 🔍 [DEBUG] MATCH COUNT for ${collection}: ${matchCount}`);
          console.log(`[AnalyticsService] 🔍 [DEBUG] INITIAL FILTER:`, JSON.stringify(matchStage));

          // Adicionar agrupamento por CHV_NFE se habilitado
          if (groupingConfig.enabled && groupingConfig.keys.length > 0) {
            // Adicionar campo normalizado para agrupamento
            pipeline.push({
              $addFields: {
                CHV_NFE_normalized: {
                  $cond: {
                    if: { $and: [
                      { $ne: ["$CHV_NFE", null] },
                      { $ne: ["$CHV_NFE", ""] },
                      { $eq: [{ $type: "$CHV_NFE" }, "string"] }
                    ]},
                    then: {
                      $cond: {
                        if: { $eq: [{ $substr: ["$CHV_NFE", 0, 3] }, "NFe"] },
                        then: { $substr: ["$CHV_NFE", 3, -1] },
                        else: "$CHV_NFE"
                      }
                    },
                    else: "$CHV_NFE"
                  }
                }
              }
            })

            // Agrupar por chave normalizada e manter apenas o primeiro documento de cada grupo
            pipeline.push({
              $group: {
                _id: "$CHV_NFE_normalized",
                doc: { $first: "$$ROOT" }
              }
            })

            // Substituir documento raiz
            pipeline.push({ $replaceRoot: { newRoot: "$doc" } })
          }

          // Adicionar facet para agregações
          pipeline.push({
            $facet: {
              // Faturamento por dia
              faturamentoDiario: [
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$DT_DOC' } },
                    valor: { $sum: '$VL_DOC' },
                    quantidade: { $sum: 1 }
                  }
                },
                { $sort: { _id: 1 } },
                { $limit: 30 },
                { $project: { _id: 0, data: '$_id', valor: 1, quantidade: 1 } }
              ],
              
              // Top 10 emitentes
              topEmitentes: [
                {
                  $group: {
                    _id: { $ifNull: ['$NOME_EMIT', '$CNPJ_EMIT'] },
                    valor: { $sum: '$VL_DOC' },
                    quantidade: { $sum: 1 }
                  }
                },
                { $match: { _id: { $nin: [null, ''] } } },
                { $sort: { valor: -1 } },
                { $limit: 10 },
                { $project: { _id: 0, nome: '$_id', valor: 1, quantidade: 1 } }
              ],
              
              // Distribuição por tipo
              distribuicaoTipos: [
                {
                  $group: {
                    _id: '$IND_OPER',
                    value: { $sum: '$VL_DOC' },
                    quantidade: { $sum: 1 }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    name: {
                      $switch: {
                        branches: [
                          { case: { $eq: ['$_id', '1'] }, then: 'Saída' },
                          { case: { $eq: ['$_id', '0'] }, then: 'Entrada' }
                        ],
                        default: 'Outros'
                      }
                    },
                    value: 1,
                    quantidade: 1
                  }
                }
              ],
              
              // Status das notas
              distribuicaoStatus: [
                {
                  $group: {
                    _id: '$PROTOCOLADA',
                    value: { $sum: 1 }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    name: {
                      $cond: {
                        if: { $eq: ['$_id', 'Sim'] },
                        then: 'Protocolada',
                        else: 'Não Protocolada'
                      }
                    },
                    value: 1
                  }
                }
              ],
              
              // Evolução mensal
              evolucao: [
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$DT_DOC' } },
                    valor: { $sum: '$VL_DOC' },
                    quantidade: { $sum: 1 }
                  }
                },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, mes: '$_id', valor: 1, quantidade: 1 } }
              ],
              
              // Estatísticas gerais
              stats: [
                {
                  $group: {
                    _id: null,
                    totalNotas: { $sum: 1 },
                    totalValor: { $sum: '$VL_DOC' },
                    mediaValor: { $avg: '$VL_DOC' },
                    maiorNota: { $max: '$VL_DOC' },
                    menorNota: { $min: '$VL_DOC' }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    totalNotas: 1,
                    totalValor: 1,
                    mediaValor: 1,
                    maiorNota: 1,
                    menorNota: 1
                  }
                }
              ]
            }
          })

          // Executar agregação
          console.log(`[AnalyticsService] 🚀 [DEBUG] EXECUTING PIPELINE:`, JSON.stringify(pipeline, null, 2));
          const aggregationResult = await coll.aggregate(pipeline).toArray()
          return aggregationResult[0]
        }
      )

      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.log(`[AnalyticsService] ✅ Agregação concluída em ${executionTime}ms`)

      // Estruturar dados de resposta
      const analyticsData: AnalyticsData = {
        faturamentoDiario: result.faturamentoDiario || [],
        topEmitentes: result.topEmitentes || [],
        distribuicaoTipos: result.distribuicaoTipos || [],
        distribuicaoStatus: result.distribuicaoStatus || [],
        evolucao: result.evolucao || [],
        stats: result.stats[0] || {
          totalNotas: 0,
          totalValor: 0,
          mediaValor: 0,
          maiorNota: 0,
          menorNota: 0
        }
      }

      console.log(`[AnalyticsService] 📊 [DEBUG] RESULT SUMMARY:`, {
        faturamentoDiario: analyticsData.faturamentoDiario.length,
        totalNotas: analyticsData.stats.totalNotas,
        totalValor: analyticsData.stats.totalValor
      });

      return {
        success: true,
        data: analyticsData,
        executionTime
      }

    } catch (error) {
      const endTime = Date.now()
      const executionTime = endTime - startTime

      console.error('[AnalyticsService] ❌ Erro na agregação:', error)
      
      // Log do erro
      await this.logDatabaseUsage('fetchAnalyticsAggregation_error', {
        error: error instanceof Error ? error.message : String(error),
        executionTime
      })

      // Logs específicos para analytics
      if (error instanceof Error) {
        if (error.name === 'MongoNetworkError' || (error as any).code === 'ECONNREFUSED') {
          console.error('[AnalyticsService] 🔌 Erro de conectividade durante agregação:')
          console.error('   - MongoDB pode estar offline')
          console.error('   - Conexão foi perdida durante a operação')
          console.error('   - Verifique logs de conexão do MongoDB')
        } else if ((error as any).code === 16389 || error.message.includes('exceeded time limit')) {
          console.error('[AnalyticsService] ⏱️ Timeout na agregação MongoDB:')
          console.error('   - Query muito complexa ou dados grandes')
          console.error('   - Considere adicionar índices')
          console.error('   - Considere limitar período de dados')
          console.error('   - Período solicitado:', options.dtIni, 'até', options.dtFin)
        } else if (error.message.includes('$group') || error.message.includes('$facet')) {
          console.error('[AnalyticsService] 📊 Erro na operação de agrupamento:')
          console.error('   - Verifique se os campos existem')
          console.error('   - Verifique tipos de dados')
          console.error('   - Collection:', options.collection)
        } else if (error.message.includes('Topology is closed')) {
          console.error('[AnalyticsService] 💔 Conexão MongoDB foi fechada durante agregação:')
          console.error('   - Conexão perdida durante a operação')
          console.error('   - MongoDB pode ter reiniciado')
          console.error('   - Verifique logs do MongoDB')
        } else if ((error as any).code === 13) {
          console.error('[AnalyticsService] 🚫 Erro de permissão na agregação:')
          console.error('   - Usuário não tem permissão para agregação')
          console.error('   - Verifique roles do usuário no MongoDB')
        }
      }

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
      console.error('[AnalyticsService] Erro ao obter base atual:', error)
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
        console.error('[AnalyticsService] ❌ Conexão MongoDB não disponível')
        return false
      }

      // Testar acesso básico
      if (mongoConnection.db) {
        await mongoConnection.db.admin().ping()
      } else {
        throw new Error('Database não disponível na conexão MongoDB')
      }
      
      console.log('[AnalyticsService] ✅ Acesso MongoDB validado')
      return true

    } catch (error) {
      console.error('[AnalyticsService] ❌ Erro na validação de acesso MongoDB:', error)
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
      console.error('[AnalyticsService] Erro ao validar acesso MongoDB:', error)
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
        service: 'AnalyticsService',
        userId: context?.usrCodigo,
        userName: context?.usrNome,
        timestamp: new Date().toISOString(),
        ...details
      }

      console.log(`[AnalyticsService] 📋 ${operation}:`, logData)

      // Registrar no APILogger se disponível
      if (context) {
        await apiLogger.logSuccess(
          `AnalyticsService.${operation} - Database: ${database}`,
          {} as any, // req object não disponível aqui
          context.usrCodigo
        )
      }

    } catch (error) {
      console.error('[AnalyticsService] Erro ao registrar uso da base:', error)
      // Não propagar erro de logging
    }
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService()