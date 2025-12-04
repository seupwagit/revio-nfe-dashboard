/**
 * Compara os períodos EXATOS que cada tela está usando
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING
const DB_NAME = process.env.VITE_DB_DATABASE

console.log('🔍 COMPARAÇÃO DE PERÍODOS ENTRE TELAS')
console.log('=' .repeat(80))
console.log('')

async function compararPeriodos() {
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
    
    const hoje = new Date()
    console.log(`Data/Hora atual: ${hoje.toLocaleString('pt-BR')}`)
    console.log(`Data ISO: ${hoje.toISOString()}`)
    console.log('')
    
    // ========================================
    // ANALYTICS - "Último ano" (12m)
    // ========================================
    console.log('📊 ANALYTICS - Filtro "Último ano" (12m)')
    console.log('-'.repeat(80))
    
    const inicioAnalytics = new Date()
    inicioAnalytics.setFullYear(hoje.getFullYear() - 1)
    
    const dtIniAnalytics = inicioAnalytics.toISOString().split('T')[0]
    const dtFimAnalytics = hoje.toISOString().split('T')[0]
    
    console.log(`Data Início: ${dtIniAnalytics}`)
    console.log(`Data Fim: ${dtFimAnalytics}`)
    console.log('')
    
    // Query do Analytics (via backend com correção)
    const dtFinAnalyticsCompleto = new Date(dtFimAnalytics)
    dtFinAnalyticsCompleto.setHours(23, 59, 59, 999)
    
    const countAnalytics = await collection.countDocuments({
      DT_DOC: {
        $gte: new Date(dtIniAnalytics),
        $lte: dtFinAnalyticsCompleto
      }
    })
    
    console.log(`Resultado: ${countAnalytics.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    // ========================================
    // DASHBOARD/GRID - Filtro padrão "Último mês"
    // ========================================
    console.log('📊 DASHBOARD/GRID - Filtro padrão "Último mês"')
    console.log('-'.repeat(80))
    
    const inicioDashboard = new Date()
    inicioDashboard.setMonth(hoje.getMonth() - 1)
    
    const dtIniDashboard = inicioDashboard.toISOString().split('T')[0]
    const dtFimDashboard = hoje.toISOString().split('T')[0]
    
    console.log(`Data Início: ${dtIniDashboard}`)
    console.log(`Data Fim: ${dtFimDashboard}`)
    console.log('')
    
    // Query do Dashboard (via backend com correção)
    const dtFinDashboardCompleto = new Date(dtFimDashboard)
    dtFinDashboardCompleto.setHours(23, 59, 59, 999)
    
    const countDashboard = await collection.countDocuments({
      DT_DOC: {
        $gte: new Date(dtIniDashboard),
        $lte: dtFinDashboardCompleto
      }
    })
    
    console.log(`Resultado: ${countDashboard.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    // ========================================
    // DASHBOARD/GRID - SE clicar "Último ano"
    // ========================================
    console.log('📊 DASHBOARD/GRID - SE clicar botão "Último ano" (365 dias)')
    console.log('-'.repeat(80))
    
    const inicioDashboardAno = new Date()
    inicioDashboardAno.setFullYear(hoje.getFullYear() - 1)
    
    const dtIniDashboardAno = inicioDashboardAno.toISOString().split('T')[0]
    const dtFimDashboardAno = hoje.toISOString().split('T')[0]
    
    console.log(`Data Início: ${dtIniDashboardAno}`)
    console.log(`Data Fim: ${dtFimDashboardAno}`)
    console.log('')
    
    const dtFinDashboardAnoCompleto = new Date(dtFimDashboardAno)
    dtFinDashboardAnoCompleto.setHours(23, 59, 59, 999)
    
    const countDashboardAno = await collection.countDocuments({
      DT_DOC: {
        $gte: new Date(dtIniDashboardAno),
        $lte: dtFinDashboardAnoCompleto
      }
    })
    
    console.log(`Resultado: ${countDashboardAno.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    // ========================================
    // ANÁLISE DA DIFERENÇA
    // ========================================
    console.log('=' .repeat(80))
    console.log('📊 ANÁLISE DA DIFERENÇA')
    console.log('=' .repeat(80))
    console.log('')
    
    const diferencaAtual = countAnalytics - countDashboard
    const diferencaSeClicar = countAnalytics - countDashboardAno
    
    console.log(`Analytics (último ano):           ${countAnalytics.toLocaleString('pt-BR').padStart(10)} documentos`)
    console.log(`Dashboard (último mês - PADRÃO):  ${countDashboard.toLocaleString('pt-BR').padStart(10)} documentos`)
    console.log(`Dashboard (último ano - BOTÃO):   ${countDashboardAno.toLocaleString('pt-BR').padStart(10)} documentos`)
    console.log('')
    console.log(`DIFERENÇA ATUAL (Analytics vs Dashboard padrão): ${diferencaAtual.toLocaleString('pt-BR')} documentos`)
    console.log(`DIFERENÇA SE CLICAR (Analytics vs Dashboard ano): ${diferencaSeClicar.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    if (diferencaAtual === 199) {
      console.log('✅ CONFIRMADO: A diferença de 199 é porque:')
      console.log('   - Analytics mostra "último ano" por padrão')
      console.log('   - Dashboard mostra "último mês" por padrão')
      console.log('')
      console.log('💡 SOLUÇÃO: Clicar no botão verde "Último ano" no Dashboard!')
    } else if (diferencaSeClicar === 0) {
      console.log('✅ CONFIRMADO: Quando clicar "Último ano" no Dashboard, os valores ficam iguais!')
    } else {
      console.log('⚠️  Há outra diferença além do período!')
    }
    console.log('')
    
    // ========================================
    // VERIFICAR PERÍODO DOS DADOS
    // ========================================
    console.log('📅 PERÍODO DOS DADOS NA BASE')
    console.log('-'.repeat(80))
    
    const maisAntiga = await collection.find({ DT_DOC: { $exists: true } })
      .sort({ DT_DOC: 1 })
      .limit(1)
      .toArray()
    
    const maisRecente = await collection.find({ DT_DOC: { $exists: true } })
      .sort({ DT_DOC: -1 })
      .limit(1)
      .toArray()
    
    if (maisAntiga.length > 0 && maisRecente.length > 0) {
      const dataInicio = new Date(maisAntiga[0].DT_DOC)
      const dataFim = new Date(maisRecente[0].DT_DOC)
      
      console.log(`Data mais antiga: ${dataInicio.toLocaleDateString('pt-BR')} ${dataInicio.toLocaleTimeString('pt-BR')}`)
      console.log(`Data mais recente: ${dataFim.toLocaleDateString('pt-BR')} ${dataFim.toLocaleTimeString('pt-BR')}`)
      console.log('')
      
      const diffDias = Math.floor((dataFim - dataInicio) / (1000 * 60 * 60 * 24))
      console.log(`Duração total dos dados: ${diffDias} dias`)
      console.log('')
      
      // Verificar se "último ano" pega todos os dados
      if (dataInicio >= new Date(dtIniAnalytics)) {
        console.log('✅ O filtro "último ano" pega TODOS os dados da base')
      } else {
        console.log('⚠️  O filtro "último ano" NÃO pega todos os dados')
        console.log(`   Há dados antes de ${dtIniAnalytics}`)
      }
      console.log('')
      
      // Verificar se "último mês" pega parte dos dados
      const docsMesAnterior = await collection.countDocuments({
        DT_DOC: {
          $lt: new Date(dtIniDashboard)
        }
      })
      
      if (docsMesAnterior > 0) {
        console.log(`⚠️  Há ${docsMesAnterior.toLocaleString('pt-BR')} documentos ANTES do último mês`)
        console.log('   Estes documentos NÃO aparecem no Dashboard com filtro padrão')
      }
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

compararPeriodos().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
