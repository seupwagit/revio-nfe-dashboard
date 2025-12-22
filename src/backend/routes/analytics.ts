/**
 * Analytics Routes
 * 
 * Endpoints para agregações e analytics usando MongoDB
 * Usa roteamento automático baseado no contexto do usuário
 */

import { Router, Response } from 'express'
import { createDocumentFilter, validateDates, formatDateRangeForLog } from '../utils/dateFilter'
import { authMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware'
import { databaseRouter } from '../services/DatabaseRouter'

const router = Router()

// Note: authMiddleware is now handled by userContextMiddleware in the main app
// All routes here automatically have user context and database routing

// POST /api/analytics/aggregate
router.post('/aggregate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest } = req.body
    
    // Validar datas
    validateDates(dtIni, dtFin)
    
    console.log('📊 Agregação Analytics:', { 
      collection, 
      periodo: formatDateRangeForLog(dtIni, dtFin),
      cnpjEmit, 
      cnpjDest,
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userContext?.bancoDeDados || 'global'
    })
    
    // Usar roteamento automático para obter conexão MongoDB
    const mongoConnection = await databaseRouter.getCurrentMongoConnection()
    
    if (!mongoConnection) {
      throw new Error('Conexão MongoDB não disponível')
    }
    
    // Usar a base de dados do contexto atual (automático)
    const coll = mongoConnection.collection(collection)
    
    // Criar filtro usando utilitário centralizado
    const matchStage = createDocumentFilter({
      dtIni,
      dtFin,
      cnpjEmit,
      cnpjDest
    })
    
    // Pipeline de agregação
    const pipeline = [
      { $match: matchStage },
      {
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
                count: '$value'
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
      }
    ]
    
    const startTime = Date.now()
    const result = await coll.aggregate(pipeline).toArray()
    const endTime = Date.now()
    
    console.log(`✅ Agregação concluída em ${endTime - startTime}ms`)
    
    const data = result[0]
    
    res.json({
      success: true,
      data: {
        faturamentoDiario: data.faturamentoDiario || [],
        topEmitentes: data.topEmitentes || [],
        distribuicaoTipos: data.distribuicaoTipos || [],
        distribuicaoStatus: data.distribuicaoStatus || [],
        evolucao: data.evolucao || [],
        stats: data.stats[0] || {
          totalNotas: 0,
          totalValor: 0,
          mediaValor: 0,
          maiorNota: 0,
          menorNota: 0
        }
      },
      executionTime: endTime - startTime
    })
    
  } catch (error: any) {
    console.error('❌ Erro na agregação:', error.message)
    console.error('📊 Detalhes do erro analytics:', {
      name: error.name,
      code: error.code,
      collection: req.body.collection,
      pipeline: 'aggregation',
      timestamp: new Date().toISOString()
    })
    
    // Logs específicos para analytics
    if (error.name === 'MongoNetworkError' || error.code === 'ECONNREFUSED') {
      console.error('🔌 Erro de conectividade durante agregação:')
      console.error('   - MongoDB pode estar offline')
      console.error('   - Conexão foi perdida durante a operação')
      console.error('   - Verifique logs de conexão do MongoDB')
    } else if (error.code === 16389 || error.message.includes('exceeded time limit')) {
      console.error('⏱️ Timeout na agregação MongoDB:')
      console.error('   - Query muito complexa ou dados grandes')
      console.error('   - Considere adicionar índices')
      console.error('   - Considere limitar período de dados')
      console.error('   - Período solicitado:', req.body.dtIni, 'até', req.body.dtFin)
    } else if (error.message.includes('$group') || error.message.includes('$facet')) {
      console.error('📊 Erro na operação de agrupamento:')
      console.error('   - Verifique se os campos existem')
      console.error('   - Verifique tipos de dados')
      console.error('   - Collection:', req.body.collection)
    } else if (error.message.includes('Topology is closed')) {
      console.error('💔 Conexão MongoDB foi fechada durante agregação:')
      console.error('   - Conexão perdida durante a operação')
      console.error('   - MongoDB pode ter reiniciado')
      console.error('   - Verifique logs do MongoDB')
    } else if (error.code === 13) {
      console.error('🚫 Erro de permissão na agregação:')
      console.error('   - Usuário não tem permissão para agregação')
      console.error('   - Verifique roles do usuário no MongoDB')
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name,
      errorCode: error.code
    })
  }
})

export default router
