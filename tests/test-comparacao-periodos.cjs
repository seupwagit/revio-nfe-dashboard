const axios = require('axios')
require('dotenv').config()

const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000 // 2 minutos
})

async function testarPeriodo(dias, label) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 TESTANDO: ${label} (${dias} dias)`)
  console.log('='.repeat(60))
  
  const hoje = new Date()
  const inicio = new Date()
  inicio.setDate(hoje.getDate() - dias)
  
  const dtIni = inicio.toISOString().split('T')[0]
  const dtFin = hoje.toISOString().split('T')[0]
  
  console.log(`📅 Período: ${dtIni} até ${dtFin}`)
  
  try {
    // Buscar primeira página para ver quantos registros vêm
    console.log('\n🔍 Buscando primeira página (size=20000)...')
    const start = Date.now()
    
    const response = await api.get('/WebView/Consultar', {
      params: {
        host: '10.0.0.8',
        database: 'C67624577000145',
        collection: 'tbl_nfe_100',
        dtIni,
        dtFin,
        pg: 1,
        size: 20000
      }
    })
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(2)
    
    let items = response.data?.lista || response.data?.data || response.data?.items || response.data
    if (!Array.isArray(items)) {
      const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]))
      if (arrayKey) items = response.data[arrayKey]
    }
    
    const registros = Array.isArray(items) ? items.length : 0
    
    console.log(`✅ Primeira página: ${registros} registros em ${elapsed}s`)
    
    // Estimar total
    if (registros === 20000) {
      console.log('⚠️  Provavelmente há mais páginas (retornou exatamente 20.000)')
      
      // Buscar segunda página
      console.log('\n🔍 Buscando segunda página...')
      const start2 = Date.now()
      const response2 = await api.get('/WebView/Consultar', {
        params: {
          host: '10.0.0.8',
          database: 'C67624577000145',
          collection: 'tbl_nfe_100',
          dtIni,
          dtFin,
          pg: 2,
          size: 20000
        }
      })
      const elapsed2 = ((Date.now() - start2) / 1000).toFixed(2)
      
      let items2 = response2.data?.lista || response2.data?.data || response2.data?.items || response2.data
      if (!Array.isArray(items2)) {
        const arrayKey = Object.keys(response2.data).find(key => Array.isArray(response2.data[key]))
        if (arrayKey) items2 = response2.data[arrayKey]
      }
      
      const registros2 = Array.isArray(items2) ? items2.length : 0
      console.log(`✅ Segunda página: ${registros2} registros em ${elapsed2}s`)
      
      const totalEstimado = registros + registros2
      const paginasEstimadas = registros2 === 20000 ? '3+' : '2'
      
      console.log(`\n📊 ESTIMATIVA:`)
      console.log(`   Total (mínimo): ${totalEstimado.toLocaleString()} registros`)
      console.log(`   Páginas: ${paginasEstimadas}`)
      console.log(`   Tempo total estimado: ${(parseFloat(elapsed) + parseFloat(elapsed2)).toFixed(2)}s`)
      
    } else {
      console.log(`\n📊 TOTAL: ${registros.toLocaleString()} registros em 1 página`)
      console.log(`   Tempo total: ${elapsed}s`)
    }
    
  } catch (error) {
    console.error(`❌ ERRO:`, error.message)
    if (error.code === 'ECONNABORTED') {
      console.error('   Timeout! A API demorou mais de 60 segundos')
    }
  }
}

async function main() {
  console.log('🚀 TESTE DE COMPARAÇÃO DE PERÍODOS')
  console.log('Objetivo: Verificar quantos registros existem em cada período\n')
  
  await testarPeriodo(60, '60 DIAS (funciona)')
  await testarPeriodo(90, '90 DIAS (trava)')
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ TESTE CONCLUÍDO')
  console.log('='.repeat(60))
}

main().catch(console.error)
