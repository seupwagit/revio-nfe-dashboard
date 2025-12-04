/**
 * Análise Detalhada da Diferença de 199 Documentos
 * 
 * Este script vai investigar EXATAMENTE onde está a diferença
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING
const DB_NAME = process.env.VITE_DB_DATABASE

console.log('🔍 ANÁLISE DETALHADA DA DIFERENÇA DE 199 DOCUMENTOS')
console.log('=' .repeat(80))
console.log('')

async function analisarDiferenca() {
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
    
    // ========================================
    // 1. TOTAL GERAL SEM FILTROS
    // ========================================
    console.log('📊 1. TOTAL GERAL SEM FILTROS')
    console.log('-'.repeat(80))
    
    const totalGeral = await collection.countDocuments()
    console.log(`Total de documentos na collection: ${totalGeral.toLocaleString('pt-BR')}`)
    console.log('')
    
    // ========================================
    // 2. ANÁLISE DE CAMPOS OBRIGATÓRIOS
    // ========================================
    console.log('📋 2. ANÁLISE DE CAMPOS OBRIGATÓRIOS')
    console.log('-'.repeat(80))
    
    // Documentos sem _id (impossível, mas vamos verificar)
    const semId = await collection.countDocuments({ _id: { $exists: false } })
    console.log(`Documentos sem _id: ${semId}`)
    
    // Documentos sem CHV_NFE (chave de acesso)
    const semChave = await collection.countDocuments({ CHV_NFE: { $exists: false } })
    const chaveVazia = await collection.countDocuments({ CHV_NFE: '' })
    const chaveNull = await collection.countDocuments({ CHV_NFE: null })
    console.log(`Documentos sem CHV_NFE: ${semChave}`)
    console.log(`Documentos com CHV_NFE vazia: ${chaveVazia}`)
    console.log(`Documentos com CHV_NFE null: ${chaveNull}`)
    
    // Documentos sem DT_DOC (data)
    const semData = await collection.countDocuments({ DT_DOC: { $exists: false } })
    const dataNull = await collection.countDocuments({ DT_DOC: null })
    console.log(`Documentos sem DT_DOC: ${semData}`)
    console.log(`Documentos com DT_DOC null: ${dataNull}`)
    
    // Documentos sem VL_DOC (valor)
    const semValor = await collection.countDocuments({ VL_DOC: { $exists: false } })
    const valorZero = await collection.countDocuments({ VL_DOC: 0 })
    const valorNull = await collection.countDocuments({ VL_DOC: null })
    console.log(`Documentos sem VL_DOC: ${semValor}`)
    console.log(`Documentos com VL_DOC = 0: ${valorZero}`)
    console.log(`Documentos com VL_DOC null: ${valorNull}`)
    console.log('')
    
    // ========================================
    // 3. ANÁLISE POR STATUS/PROTOCOLADA
    // ========================================
    console.log('✅ 3. ANÁLISE POR STATUS (PROTOCOLADA)')
    console.log('-'.repeat(80))
    
    const porProtocolada = await collection.aggregate([
      {
        $group: {
          _id: '$PROTOCOLADA',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()
    
    porProtocolada.forEach(item => {
      const status = item._id || 'null/undefined'
      const count = item.count.toLocaleString('pt-BR')
      const percentual = ((item.count / totalGeral) * 100).toFixed(2)
      console.log(`  ${status.padEnd(20)}: ${count.padStart(10)} (${percentual}%)`)
    })
    console.log('')
    
    // ========================================
    // 4. SIMULAÇÃO DE FILTRO "ÚLTIMO ANO"
    // ========================================
    console.log('📅 4. SIMULAÇÃO DE FILTRO "ÚLTIMO ANO"')
    console.log('-'.repeat(80))
    
    const hoje = new Date()
    const umAnoAtras = new Date()
    umAnoAtras.setFullYear(hoje.getFullYear() - 1)
    
    const dtIni = umAnoAtras.toISOString().split('T')[0]
    const dtFim = hoje.toISOString().split('T')[0]
    
    console.log(`Período: ${dtIni} até ${dtFim}`)
    console.log('')
    
    // Método 1: Como o Analytics fazia ANTES (sem incluir dia final completo)
    console.log('Método 1: Analytics ANTIGO (sem incluir 23:59:59)')
    const countAnalyticsAntigo = await collection.countDocuments({
      DT_DOC: {
        $gte: new Date(dtIni),
        $lte: new Date(dtFim)  // Sem ajustar hora
      }
    })
    console.log(`  Resultado: ${countAnalyticsAntigo.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    // Método 2: Como o Dashboard/Grid fazem (incluindo dia final completo)
    console.log('Método 2: Dashboard/Grid (incluindo 23:59:59.999)')
    const dtFinCompleto = new Date(dtFim)
    dtFinCompleto.setHours(23, 59, 59, 999)
    const countDashboard = await collection.countDocuments({
      DT_DOC: {
        $gte: new Date(dtIni),
        $lte: dtFinCompleto
      }
    })
    console.log(`  Resultado: ${countDashboard.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    // Diferença
    const diferenca = countDashboard - countAnalyticsAntigo
    console.log(`DIFERENÇA: ${diferenca} documentos`)
    console.log('')
    
    // ========================================
    // 5. ANÁLISE DO DIA FINAL
    // ========================================
    console.log('🔍 5. ANÁLISE DO DIA FINAL (03/12/2025)')
    console.log('-'.repeat(80))
    
    const diaFinal = new Date(dtFim)
    const inicioDiaFinal = new Date(dtFim)
    inicioDiaFinal.setHours(0, 0, 0, 0)
    const fimDiaFinal = new Date(dtFim)
    fimDiaFinal.setHours(23, 59, 59, 999)
    
    const docsDiaFinal = await collection.countDocuments({
      DT_DOC: {
        $gte: inicioDiaFinal,
        $lte: fimDiaFinal
      }
    })
    
    console.log(`Documentos no dia ${dtFim}: ${docsDiaFinal.toLocaleString('pt-BR')}`)
    
    // Documentos exatamente à meia-noite
    const docsExatoMeiaNoite = await collection.countDocuments({
      DT_DOC: new Date(dtFim)
    })
    console.log(`Documentos exatamente à 00:00:00: ${docsExatoMeiaNoite}`)
    
    // Documentos após meia-noite
    const docsAposMeiaNoite = await collection.countDocuments({
      DT_DOC: {
        $gt: new Date(dtFim),
        $lte: fimDiaFinal
      }
    })
    console.log(`Documentos após 00:00:00: ${docsAposMeiaNoite}`)
    console.log('')
    
    // ========================================
    // 6. VERIFICAR SE HÁ FILTROS IMPLÍCITOS
    // ========================================
    console.log('🔎 6. VERIFICAR FILTROS IMPLÍCITOS')
    console.log('-'.repeat(80))
    
    // Contar com diferentes combinações de filtros
    const filtros = [
      { nome: 'Sem filtros', filtro: {} },
      { nome: 'Com DT_DOC exists', filtro: { DT_DOC: { $exists: true } } },
      { nome: 'Com DT_DOC not null', filtro: { DT_DOC: { $ne: null } } },
      { nome: 'Com VL_DOC > 0', filtro: { VL_DOC: { $gt: 0 } } },
      { nome: 'Com CHV_NFE exists', filtro: { CHV_NFE: { $exists: true, $ne: '', $ne: null } } },
      { nome: 'PROTOCOLADA = Sim', filtro: { PROTOCOLADA: 'Sim' } },
      { nome: 'PROTOCOLADA = Não', filtro: { PROTOCOLADA: 'Não' } },
    ]
    
    for (const { nome, filtro } of filtros) {
      const count = await collection.countDocuments(filtro)
      console.log(`  ${nome.padEnd(30)}: ${count.toLocaleString('pt-BR').padStart(10)} documentos`)
    }
    console.log('')
    
    // ========================================
    // 7. AMOSTRA DE DOCUMENTOS DO DIA FINAL
    // ========================================
    console.log('📄 7. AMOSTRA DE DOCUMENTOS DO DIA FINAL')
    console.log('-'.repeat(80))
    
    const amostraDiaFinal = await collection.find({
      DT_DOC: {
        $gte: inicioDiaFinal,
        $lte: fimDiaFinal
      }
    }).limit(5).toArray()
    
    console.log(`Mostrando 5 documentos do dia ${dtFim}:`)
    console.log('')
    amostraDiaFinal.forEach((doc, index) => {
      console.log(`Documento ${index + 1}:`)
      console.log(`  _id: ${doc._id}`)
      console.log(`  CHV_NFE: ${doc.CHV_NFE}`)
      console.log(`  DT_DOC: ${doc.DT_DOC}`)
      console.log(`  VL_DOC: ${doc.VL_DOC}`)
      console.log(`  PROTOCOLADA: ${doc.PROTOCOLADA}`)
      console.log(`  CNPJ_EMIT: ${doc.CNPJ_EMIT}`)
      console.log('')
    })
    
    // ========================================
    // 8. RESUMO E CONCLUSÃO
    // ========================================
    console.log('=' .repeat(80))
    console.log('📊 RESUMO E CONCLUSÃO')
    console.log('=' .repeat(80))
    console.log('')
    console.log(`Total geral na collection: ${totalGeral.toLocaleString('pt-BR')} documentos`)
    console.log(`Analytics ANTIGO (sem 23:59:59): ${countAnalyticsAntigo.toLocaleString('pt-BR')} documentos`)
    console.log(`Dashboard/Grid (com 23:59:59): ${countDashboard.toLocaleString('pt-BR')} documentos`)
    console.log(`Diferença: ${diferenca} documentos`)
    console.log('')
    console.log(`Documentos no dia final (${dtFim}): ${docsDiaFinal.toLocaleString('pt-BR')}`)
    console.log('')
    
    if (diferenca === docsDiaFinal) {
      console.log('✅ CONCLUSÃO: A diferença é EXATAMENTE os documentos do dia final!')
      console.log('   O Analytics antigo não incluía o dia final completo.')
    } else if (diferenca === docsAposMeiaNoite) {
      console.log('✅ CONCLUSÃO: A diferença são os documentos após meia-noite do dia final!')
      console.log('   O Analytics antigo parava exatamente à 00:00:00.')
    } else {
      console.log('⚠️  ATENÇÃO: A diferença NÃO corresponde aos documentos do dia final!')
      console.log('   Pode haver outro filtro sendo aplicado.')
    }
    console.log('')
    
    // Verificar se há documentos inválidos
    const totalInvalidos = semChave + chaveVazia + chaveNull + semData + dataNull
    if (totalInvalidos > 0) {
      console.log(`⚠️  ATENÇÃO: Há ${totalInvalidos} documentos com campos inválidos!`)
      console.log('   Estes documentos podem estar sendo filtrados implicitamente.')
    } else {
      console.log('✅ Todos os documentos têm campos obrigatórios preenchidos.')
    }
    console.log('')
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
    
  } finally {
    await client.close()
    console.log('✅ Conexão fechada')
  }
}

analisarDiferenca().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
