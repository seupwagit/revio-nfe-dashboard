/**
 * Conta o total de documentos em cada collection do MongoDB
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING
const DB_NAME = process.env.VITE_DB_DATABASE

console.log('📊 CONTAGEM TOTAL DE DOCUMENTOS')
console.log('=' .repeat(70))
console.log('')

async function contarDocumentos() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
  
  try {
    console.log('⏳ Conectando ao MongoDB...')
    await client.connect()
    console.log('✅ Conectado!\n')
    
    const db = client.db(DB_NAME)
    
    // Collections que queremos contar
    const collections = ['tbl_nfe_100', 'tbl_cfe_100', 'tbl_cte_100']
    
    console.log('📋 Contando documentos em cada collection:\n')
    console.log('-'.repeat(70))
    
    let totalGeral = 0
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName)
        
        // Contagem total (sem filtros)
        const total = await collection.countDocuments()
        totalGeral += total
        
        console.log(`${collectionName.padEnd(20)} | ${total.toLocaleString('pt-BR').padStart(15)} documentos`)
        
        // Pegar data mais antiga e mais recente
        const maisAntiga = await collection.find().sort({ dataEmissao: 1 }).limit(1).toArray()
        const maisRecente = await collection.find().sort({ dataEmissao: -1 }).limit(1).toArray()
        
        if (maisAntiga.length > 0 && maisRecente.length > 0) {
          const dataInicio = new Date(maisAntiga[0].dataEmissao).toLocaleDateString('pt-BR')
          const dataFim = new Date(maisRecente[0].dataEmissao).toLocaleDateString('pt-BR')
          console.log(`${''.padEnd(20)} | Período: ${dataInicio} até ${dataFim}`)
        }
        
        console.log('-'.repeat(70))
        
      } catch (error) {
        console.error(`❌ Erro ao contar ${collectionName}:`, error.message)
        console.log('-'.repeat(70))
      }
    }
    
    console.log('')
    console.log('=' .repeat(70))
    console.log(`TOTAL GERAL          | ${totalGeral.toLocaleString('pt-BR').padStart(15)} documentos`)
    console.log('=' .repeat(70))
    console.log('')
    
    // Estatísticas adicionais
    console.log('📈 ESTATÍSTICAS ADICIONAIS:\n')
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName)
        
        console.log(`\n${collectionName}:`)
        
        // Contar por status
        const porStatus = await collection.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]).toArray()
        
        console.log('  Por Status:')
        porStatus.forEach(item => {
          const status = item._id || 'sem status'
          const count = item.count.toLocaleString('pt-BR')
          console.log(`    ${status.padEnd(20)}: ${count.padStart(10)}`)
        })
        
        // Contar por ano
        const porAno = await collection.aggregate([
          {
            $group: {
              _id: { $year: { $toDate: '$dataEmissao' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } }
        ]).toArray()
        
        console.log('  Por Ano:')
        porAno.forEach(item => {
          const ano = item._id || 'sem data'
          const count = item.count.toLocaleString('pt-BR')
          console.log(`    ${ano.toString().padEnd(20)}: ${count.padStart(10)}`)
        })
        
      } catch (error) {
        console.error(`  ❌ Erro ao obter estatísticas de ${collectionName}:`, error.message)
      }
    }
    
    console.log('')
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Servidor MongoDB não está aceitando conexões')
      console.error('   Verifique se o MongoDB está rodando em 10.0.0.8:27017')
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Timeout - servidor não respondeu')
      console.error('   Verifique a conectividade de rede')
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Credenciais incorretas')
      console.error('   Verifique VITE_MONGODB_CONNECTION_STRING no .env')
    }
    
    process.exit(1)
    
  } finally {
    await client.close()
    console.log('✅ Conexão fechada')
  }
}

contarDocumentos().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
