const axios = require('axios')
require('dotenv').config()

const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000
})

async function fetchChunk(dtIni, dtFin, chunkNum, totalChunks) {
  console.log(`\n🔄 Chunk ${chunkNum}/${totalChunks}: ${dtIni} até ${dtFin}`)
  
  try {
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
    
    console.log(`✅ Chunk ${chunkNum}: ${registros} registros em ${elapsed}s`)
    
    return { success: true, registros, tempo: elapsed }
    
  } catch (error) {
    console.error(`❌ Chunk ${chunkNum} FALHOU:`, error.message)
    return { success: false, registros: 0, tempo: 0 }
  }
}

async function testarChunks(dias, label) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`🧪 TESTE: ${label} (${dias} dias) - MÉTODO DE CHUNKS`)
  console.log('='.repeat(70))
  
  const hoje = new Date()
  const inicio = new Date()
  inicio.setDate(hoje.getDate() - dias)
  
  const dtIni = inicio.toISOString().split('T')[0]
  const dtFin = hoje.toISOString().split('T')[0]
  
  console.log(`📅 Período total: ${dtIni} até ${dtFin}`)
  
  // Dividir em chunks de 30 dias
  const CHUNK_DAYS = 30
  const chunks = []
  let currentStart = new Date(inicio)
  
  while (currentStart <= hoje) {
    const currentEnd = new Date(currentStart)
    currentEnd.setDate(currentEnd.getDate() + CHUNK_DAYS - 1)
    
    if (currentEnd > hoje) {
      currentEnd.setTime(hoje.getTime())
    }
    
    chunks.push({
      dtIni: currentStart.toISOString().split('T')[0],
      dtFin: currentEnd.toISOString().split('T')[0]
    })
    
    currentStart = new Date(currentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
    
    if (currentStart > hoje || chunks.length > 20) break
  }
  
  console.log(`📦 Dividido em ${chunks.length} chunks de ~30 dias`)
  
  // Buscar cada chunk
  const startTotal = Date.now()
  let totalRegistros = 0
  let chunksOk = 0
  let chunksFalha = 0
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const result = await fetchChunk(chunk.dtIni, chunk.dtFin, i + 1, chunks.length)
    
    if (result.success) {
      totalRegistros += result.registros
      chunksOk++
    } else {
      chunksFalha++
    }
  }
  
  const tempoTotal = ((Date.now() - startTotal) / 1000).toFixed(2)
  
  console.log(`\n${'='.repeat(70)}`)
  console.log(`📊 RESULTADO FINAL:`)
  console.log(`   Total de registros: ${totalRegistros.toLocaleString()}`)
  console.log(`   Chunks bem-sucedidos: ${chunksOk}/${chunks.length}`)
  console.log(`   Chunks falhados: ${chunksFalha}`)
  console.log(`   Tempo total: ${tempoTotal}s`)
  console.log(`   Status: ${chunksFalha === 0 ? '✅ SUCESSO' : '⚠️ PARCIAL'}`)
  console.log('='.repeat(70))
  
  return { totalRegistros, chunksOk, chunksFalha, tempoTotal }
}

async function main() {
  console.log('🚀 TESTE DE SOLUÇÃO COM CHUNKS')
  console.log('Objetivo: Verificar se dividir em chunks resolve o problema de 90 dias\n')
  
  // Teste 1: 60 dias (baseline - deve funcionar em 2 chunks)
  await testarChunks(60, '60 DIAS (baseline)')
  
  // Teste 2: 90 dias (problema original - deve funcionar em 3 chunks)
  await testarChunks(90, '90 DIAS (problema resolvido)')
  
  // Teste 3: 120 dias (teste extremo - deve funcionar em 4 chunks)
  await testarChunks(120, '120 DIAS (teste extremo)')
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ TODOS OS TESTES CONCLUÍDOS')
  console.log('='.repeat(70))
  console.log('\n💡 Se todos os chunks foram bem-sucedidos, a solução está funcionando!')
}

main().catch(console.error)
