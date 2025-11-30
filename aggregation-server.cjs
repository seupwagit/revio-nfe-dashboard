/**
 * Servidor de Agregação MongoDB
 * 
 * ⚠️ READ-ONLY: Este servidor APENAS faz consultas agregadas
 * ⚠️ NUNCA executa DELETE, UPDATE ou INSERT
 * ⚠️ Otimizado para gráficos e dashboards
 */

const express = require('express')
const cors = require('cors')
const { MongoClient } = require('mongodb')

const app = express()
app.use(cors())
app.use(express.json())

// Configuração MongoDB
const MONGODB_URI = 'mongodb://revio:zaqwsx2001@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&directConnection=true'
const DB_NAME = 'C67624577000145'

let client
let db

// Conectar ao MongoDB
async function connectMongo() {
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    })
    
    await client.connect()
    db = client.db(DB_NAME)
    
    console.log('✅ Conectado ao MongoDB')
    console.log('📊 Database:', DB_NAME)
    console.log('⚠️  Modo: READ-ONLY (apenas agregações)')
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message)
    process.exit(1)
  }
}

// Endpoint: Agregação para Analytics
app.post('/api/aggregate/analytics', async (req, res) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest } = req.body
    
    console.log('📊 Agregação Analytics:', { collection, dtIni, dtFin })
    
    const coll = db.collection(collection)
    
    // Filtro de data
    const matchStage = {
      DT_DOC: {
        $gte: new Date(dtIni),
        $lte: new Date(dtFin)
      }
    }
    
    if (cnpjEmit) matchStage.CNPJ_EMIT = cnpjEmit
    if (cnpjDest) matchStage.CNPJ_DEST = cnpjDest
    
    // Pipeline de agregação otimizada
    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          // 1. Faturamento por dia
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
            {
              $project: {
                _id: 0,
                data: '$_id',
                valor: 1,
                quantidade: 1
              }
            }
          ],
          
          // 2. Top 10 emitentes
          topEmitentes: [
            {
              $group: {
                _id: '$NOME_EMIT',
                valor: { $sum: '$VL_DOC' },
                quantidade: { $sum: 1 }
              }
            },
            { $sort: { valor: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                nome: '$_id',
                valor: 1,
                quantidade: 1
              }
            }
          ],
          
          // 3. Distribuição por tipo de operação
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
          
          // 4. Status das notas
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
          
          // 5. Evolução mensal
          evolucao: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$DT_DOC' } },
                valor: { $sum: '$VL_DOC' },
                quantidade: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                mes: '$_id',
                valor: 1,
                quantidade: 1
              }
            }
          ],
          
          // 6. Estatísticas gerais
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
    
    // Retorna resultado
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
    
  } catch (error) {
    console.error('❌ Erro na agregação:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: client ? 'connected' : 'disconnected',
    database: DB_NAME,
    mode: 'READ-ONLY'
  })
})

// Iniciar servidor
const PORT = 3002
app.listen(PORT, async () => {
  await connectMongo()
  console.log(`🚀 Servidor de agregação rodando na porta ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Endpoint: POST http://localhost:${PORT}/api/aggregate/analytics`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Encerrando servidor...')
  if (client) {
    await client.close()
    console.log('✅ Conexão MongoDB fechada')
  }
  process.exit(0)
})
