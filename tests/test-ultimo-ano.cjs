/**
 * Teste rápido: Último Ano
 */

const axios = require('axios')

const api = axios.create({
  baseURL: 'http://10.0.0.8:8080',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3M2Y5YjI4ZjE5YzI4MjI5YzI4MjI5YyIsImlhdCI6MTczMjEzMDYwMCwiZXhwIjoxNzMyMjE3MDAwfQ.Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Q',
    'Content-Type': 'application/json'
  },
  timeout: 90000
})

async function testarUltimoAno() {
  console.log('🧪 TESTANDO ÚLTIMO ANO\n')
  
  const hoje = new Date()
  const umAnoAtras = new Date(hoje)
  umAnoAtras.setFullYear(hoje.getFullYear() - 1)
  
  const dtIni = umAnoAtras.toISOString().split('T')[0]
  const dtFin = hoje.toISOString().split('T')[0]
  
  console.log(`📅 Período: ${dtIni} até ${dtFin}`)
  console.log(`📊 Dias: ${Math.ceil((hoje - umAnoAtras) / (1000 * 60 * 60 * 24))}`)
  console.log(`📦 Chunks esperados: ~${Math.ceil(365 / 30)}\n`)
  
  // Testar alguns chunks
  const chunks = [
    { dtIni, dtFin: addDays(dtIni, 29), nome: 'Chunk 1 (primeiros 30 dias)' },
    { dtIni: addDays(dtIni, 30), dtFin: addDays(dtIni, 59), nome: 'Chunk 2 (dias 31-60)' },
    { dtIni: addDays(dtIni, 330), dtFin, nome: 'Chunk 12 (últimos dias)' }
  ]
  
  let totalRegistros = 0
  
  for (const chunk of chunks) {
    try {
      console.log(`\n🔍 Testando ${chunk.nome}`)
      console.log(`   Período: ${chunk.dtIni} até ${chunk.dtFin}`)
      
      const response = await api.get('/WebView/Consultar', {
        params: {
          host: '10.0.0.8',
          database: 'C67624577000145',
          collection: 'tbl_nfe_100',
          dtIni: chunk.dtIni,
          dtFin: chunk.dtFin,
          pg: 1,
          size: 10000
        }
      })
      
      let items = response.data?.lista || response.data?.data || response.data?.items || response.data
      if (!Array.isArray(items) && typeof response.data === 'object') {
        const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]))
        if (arrayKey) items = response.data[arrayKey]
      }
      
      const registros = Array.isArray(items) ? items.length : 0
      totalRegistros += registros
      
      console.log(`   ✅ ${registros} registros`)
      
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`)
    }
  }
  
  console.log(`\n📊 TOTAL (3 chunks testados): ${totalRegistros} registros`)
  console.log(`📈 Estimativa para 12 chunks: ~${totalRegistros * 4} registros`)
}

function addDays(dateStr, days) {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

testarUltimoAno().catch(console.error)
