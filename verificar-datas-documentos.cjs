/**
 * Verifica as datas dos documentos para entender o período
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING
const DB_NAME = process.env.VITE_DB_DATABASE

console.log('📅 VERIFICAÇÃO DE DATAS DOS DOCUMENTOS')
console.log('=' .repeat(70))
console.log('')

async function verificarDatas() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
  
  try {
    console.log('⏳ Conectando ao MongoDB...')
    await client.connect()
    console.log('✅ Conectado!\n')
    
    const db = client.db(DB_NAME)
    const collection = db.collection('tbl_nfe_100')
    
    // Pegar alguns documentos de amostra para ver a estrutura
    console.log('📋 Estrutura dos documentos (amostra de 3):\n')
    const amostras = await collection.find().limit(3).toArray()
    
    amostras.forEach((doc, index) => {
      console.log(`Documento ${index + 1}:`)
      console.log('  _id:', doc._id)
      console.log('  dataEmissao:', doc.dataEmissao)
      console.log('  dhEmi:', doc.dhEmi)
      console.log('  status:', doc.status)
      console.log('  valorTotal:', doc.valorTotal)
      console.log('  Campos disponíveis:', Object.keys(doc).slice(0, 10).join(', '))
      console.log('')
    })
    
    // Verificar qual campo de data existe
    console.log('🔍 Verificando campos de data disponíveis:\n')
    
    const camposPossiveis = ['dataEmissao', 'dhEmi', 'dEmi', 'data', 'date', 'createdAt']
    
    for (const campo of camposPossiveis) {
      const count = await collection.countDocuments({ [campo]: { $exists: true } })
      if (count > 0) {
        console.log(`✅ ${campo.padEnd(20)}: ${count.toLocaleString('pt-BR')} documentos`)
        
        // Pegar valores de exemplo
        const exemplos = await collection.find({ [campo]: { $exists: true } }).limit(3).toArray()
        console.log(`   Exemplos:`)
        exemplos.forEach(ex => {
          console.log(`     - ${ex[campo]}`)
        })
        console.log('')
      }
    }
    
    // Tentar encontrar o campo de data correto
    console.log('📊 Análise de período (tentando diferentes campos):\n')
    
    for (const campo of camposPossiveis) {
      try {
        const count = await collection.countDocuments({ [campo]: { $exists: true } })
        if (count === 0) continue
        
        console.log(`\nUsando campo: ${campo}`)
        console.log('-'.repeat(70))
        
        // Tentar como string ISO
        try {
          const maisAntiga = await collection.find({ [campo]: { $exists: true } })
            .sort({ [campo]: 1 })
            .limit(1)
            .toArray()
          
          const maisRecente = await collection.find({ [campo]: { $exists: true } })
            .sort({ [campo]: -1 })
            .limit(1)
            .toArray()
          
          if (maisAntiga.length > 0 && maisRecente.length > 0) {
            console.log('  Mais antiga:', maisAntiga[0][campo])
            console.log('  Mais recente:', maisRecente[0][campo])
            
            // Tentar converter para data
            try {
              const dataInicio = new Date(maisAntiga[0][campo])
              const dataFim = new Date(maisRecente[0][campo])
              
              if (!isNaN(dataInicio.getTime()) && !isNaN(dataFim.getTime())) {
                console.log('  Período:', dataInicio.toLocaleDateString('pt-BR'), 'até', dataFim.toLocaleDateString('pt-BR'))
                
                // Calcular diferença em dias
                const diffDias = Math.floor((dataFim - dataInicio) / (1000 * 60 * 60 * 24))
                console.log('  Duração:', diffDias, 'dias')
                
                // Contar por ano
                const porAno = await collection.aggregate([
                  { $match: { [campo]: { $exists: true } } },
                  {
                    $addFields: {
                      dataConvertida: { $toDate: `$${campo}` }
                    }
                  },
                  {
                    $group: {
                      _id: { $year: '$dataConvertida' },
                      count: { $sum: 1 }
                    }
                  },
                  { $sort: { _id: -1 } }
                ]).toArray()
                
                console.log('  Por Ano:')
                porAno.forEach(item => {
                  const ano = item._id
                  const count = item.count.toLocaleString('pt-BR')
                  console.log(`    ${ano}: ${count} documentos`)
                })
              }
            } catch (e) {
              console.log('  ⚠️ Não foi possível converter para data:', e.message)
            }
          }
        } catch (e) {
          console.log('  ⚠️ Erro ao ordenar:', e.message)
        }
        
      } catch (error) {
        console.log(`  ❌ Erro ao analisar ${campo}:`, error.message)
      }
    }
    
    console.log('')
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
    
  } finally {
    await client.close()
    console.log('\n✅ Conexão fechada')
  }
}

verificarDatas().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
