/**
 * Analytics Routes
 * 
 * Endpoints para agregações e analytics usando MongoDB
 */

import { Router } from 'express'
import { mongoose } from '../database/mongodb'

const router = Router()

// POST /api/analytics/aggregate
router.post('/aggregate', async (req, res) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest } = req.body
    
    console.log('📊 Agregação Analytics:', { collection, dtIni, dtFin, cnpjEmit, cnpjDest })
    
    const coll = mongoose.connection.db.collection(collection)
    
    // Filtro de data
    const matchStage: any = {
      DT_DOC: {
        $gte: new Date(dtIni),
        $lte: new Date(dtFin)
      }
    }
    
    if (cnpjEmit) matchStage.CNPJ_EMIT = cnpjEmit
    if (cnpjDest) matchStage.CNPJ_DEST = cnpjDest
    
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
            { $match: { _id: { $ne: null, $ne: '' } } },
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
    console.error('❌ Erro na agregação:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
