/**
 * Análise completa dos documentos no MongoDB
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING
const DB_NAME = process.env.VITE_DB_DATABASE

console.log('📊 ANÁLISE COMPLETA DOS DOCUMENTOS')
console.log('=' .repeat(80))
console.log('')

async function analisarDocumentos() {
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
    
    // Contagem total
    const total = await collection.countDocuments()
    console.log('📋 TOTAL DE DOCUMENTOS:', total.toLocaleString('pt-BR'))
    console.log('=' .repeat(80))
    console.log('')
    
    // Pegar um documento de exemplo para ver a estrutura
    console.log('📄 ESTRUTURA DO DOCUMENTO:\n')
    const exemplo = await collection.findOne()
    
    if (exemplo) {
      console.log('Campos disponíveis:')
      Object.keys(exemplo).forEach(campo => {
        const valor = exemplo[campo]
        const tipo = typeof valor
        const preview = tipo === 'string' && valor.length > 50 
          ? valor.substring(0, 50) + '...' 
          : valor
        console.log(`  ${campo.padEnd(20)}: ${tipo.padEnd(10)} = ${preview}`)
      })
      console.log('')
    }
    
    // Análise por campo DT_DOC (parece ser a data do documento)
    console.log('📅 ANÁLISE POR DATA (campo DT_DOC):\n')
    console.log('-'.repeat(80))
    
    try {
      // Pegar a data mais antiga e mais recente
      const maisAntiga = await collection.find({ DT_DOC: { $exists: true } })
        .sort({ DT_DOC: 1 })
        .limit(1)
        .toArray()
      
      const maisRecente = await collection.find({ DT_DOC: { $exists: true } })
        .sort({ DT_DOC: -1 })
        .limit(1)
        .toArray()
      
      if (maisAntiga.length > 0 && maisRecente.length > 0) {
        console.log('Data mais antiga :', maisAntiga[0].DT_DOC)
        console.log('Data mais recente:', maisRecente[0].DT_DOC)
        console.log('')
        
        // Tentar converter para Date
        try {
          const dataInicio = new Date(maisAntiga[0].DT_DOC)
          const dataFim = new Date(maisRecente[0].DT_DOC)
          
          if (!isNaN(dataInicio.getTime()) && !isNaN(dataFim.getTime())) {
            console.log('Período:', dataInicio.toLocaleDateString('pt-BR'), 'até', dataFim.toLocaleDateString('pt-BR'))
            
            const diffDias = Math.floor((dataFim - dataInicio) / (1000 * 60 * 60 * 24))
            console.log('Duração:', diffDias, 'dias')
            console.log('')
          }
        } catch (e) {
          console.log('⚠️ Não foi possível converter DT_DOC para data')
          console.log('')
        }
      }
      
      // Contar documentos por ano
      console.log('Documentos por Ano:')
      const porAno = await collection.aggregate([
        { $match: { DT_DOC: { $exists: true } } },
        {
          $addFields: {
            ano: { $year: { $toDate: '$DT_DOC' } }
          }
        },
        {
          $group: {
            _id: '$ano',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]).toArray()
      
      porAno.forEach(item => {
        const ano = item._id
        const count = item.count.toLocaleString('pt-BR')
        const percentual = ((item.count / total) * 100).toFixed(1)
        console.log(`  ${ano}: ${count.padStart(10)} documentos (${percentual}%)`)
      })
      console.log('')
      
    } catch (error) {
      console.log('❌ Erro ao analisar DT_DOC:', error.message)
      console.log('')
    }
    
    // Análise por tipo de operação
    console.log('📦 ANÁLISE POR TIPO DE OPERAÇÃO (campo IND_OPER):\n')
    console.log('-'.repeat(80))
    
    try {
      const porTipo = await collection.aggregate([
        {
          $group: {
            _id: '$IND_OPER',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray()
      
      porTipo.forEach(item => {
        const tipo = item._id === '0' ? 'Entrada' : item._id === '1' ? 'Saída' : item._id || 'Não especificado'
        const count = item.count.toLocaleString('pt-BR')
        const percentual = ((item.count / total) * 100).toFixed(1)
        console.log(`  ${tipo.padEnd(20)}: ${count.padStart(10)} documentos (${percentual}%)`)
      })
      console.log('')
      
    } catch (error) {
      console.log('❌ Erro ao analisar IND_OPER:', error.message)
      console.log('')
    }
    
    // Análise por valor
    console.log('💰 ANÁLISE POR VALOR (campo VL_DOC):\n')
    console.log('-'.repeat(80))
    
    try {
      const stats = await collection.aggregate([
        { $match: { VL_DOC: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$VL_DOC' },
            media: { $avg: '$VL_DOC' },
            maximo: { $max: '$VL_DOC' },
            minimo: { $min: '$VL_DOC' },
            count: { $sum: 1 }
          }
        }
      ]).toArray()
      
      if (stats.length > 0) {
        const s = stats[0]
        console.log('Valor Total  :', s.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
        console.log('Valor Médio  :', s.media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
        console.log('Valor Máximo :', s.maximo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
        console.log('Valor Mínimo :', s.minimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
        console.log('Documentos   :', s.count.toLocaleString('pt-BR'))
        console.log('')
      }
      
    } catch (error) {
      console.log('❌ Erro ao analisar VL_DOC:', error.message)
      console.log('')
    }
    
    // Análise por status de protocolo
    console.log('✅ ANÁLISE POR STATUS (campo PROTOCOLADA):\n')
    console.log('-'.repeat(80))
    
    try {
      const porStatus = await collection.aggregate([
        {
          $group: {
            _id: '$PROTOCOLADA',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray()
      
      porStatus.forEach(item => {
        const status = item._id === 'S' ? 'Protocolada' : item._id === 'N' ? 'Não Protocolada' : item._id || 'Não especificado'
        const count = item.count.toLocaleString('pt-BR')
        const percentual = ((item.count / total) * 100).toFixed(1)
        console.log(`  ${status.padEnd(20)}: ${count.padStart(10)} documentos (${percentual}%)`)
      })
      console.log('')
      
    } catch (error) {
      console.log('❌ Erro ao analisar PROTOCOLADA:', error.message)
      console.log('')
    }
    
    // Análise de último ano
    console.log('📆 ANÁLISE DE ÚLTIMO ANO:\n')
    console.log('-'.repeat(80))
    
    try {
      const hoje = new Date()
      const umAnoAtras = new Date()
      umAnoAtras.setFullYear(hoje.getFullYear() - 1)
      
      const dtIni = umAnoAtras.toISOString().split('T')[0]
      const dtFim = hoje.toISOString().split('T')[0]
      
      console.log('Período:', dtIni, 'até', dtFim)
      
      const countUltimoAno = await collection.countDocuments({
        DT_DOC: {
          $gte: dtIni,
          $lte: dtFim
        }
      })
      
      console.log('Documentos no último ano:', countUltimoAno.toLocaleString('pt-BR'))
      console.log('Percentual do total     :', ((countUltimoAno / total) * 100).toFixed(1) + '%')
      console.log('')
      
    } catch (error) {
      console.log('❌ Erro ao analisar último ano:', error.message)
      console.log('')
    }
    
    console.log('=' .repeat(80))
    console.log('✅ Análise concluída!')
    console.log('=' .repeat(80))
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
    
  } finally {
    await client.close()
    console.log('\n✅ Conexão fechada')
  }
}

analisarDocumentos().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
