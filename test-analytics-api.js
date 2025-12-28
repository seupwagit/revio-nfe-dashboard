/**
 * Teste rápido da API de Analytics
 * Execute: node test-analytics-api.js
 */

const API_BASE_URL = 'http://localhost:3000/api'

async function testAnalyticsAPI() {
  try {
    console.log('🧪 Testando API de Analytics...')
    
    // Simular dados de teste
    const testData = {
      collection: 'tbl_nfe_100',
      dtIni: '2024-11-01',
      dtFin: '2024-12-27'
    }
    
    console.log('📊 Enviando requisição:', testData)
    
    const response = await fetch(`${API_BASE_URL}/analytics/aggregate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Em produção, você precisaria de um token válido
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📡 Status da resposta:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na resposta:', errorText)
      return
    }
    
    const result = await response.json()
    
    console.log('✅ Resposta recebida:')
    console.log('  - Success:', result.success)
    console.log('  - Execution Time:', result.executionTime + 'ms')
    console.log('  - Total Notas:', result.data?.stats?.totalNotas || 0)
    console.log('  - Total Valor:', result.data?.stats?.totalValor || 0)
    console.log('  - Faturamento Diário:', result.data?.faturamentoDiario?.length || 0, 'registros')
    console.log('  - Top Emitentes:', result.data?.topEmitentes?.length || 0, 'registros')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    
    if (error.message.includes('fetch')) {
      console.error('💡 Dica: Verifique se o servidor está rodando em http://localhost:3000')
    }
  }
}

// Executar teste
testAnalyticsAPI()