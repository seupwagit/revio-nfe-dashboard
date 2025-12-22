// Utilitário de debug para desenvolvimento

export function logApiCall(endpoint: string, params: any, response: any) {
  console.group(`🔍 API Call: ${endpoint}`)
  console.log('📤 Parâmetros:', params)
  console.log('📥 Resposta:', response)
  console.log('📊 Tipo de resposta:', typeof response)
  console.log('📋 É array?:', Array.isArray(response))
  if (response && typeof response === 'object') {
    console.log('🔑 Chaves:', Object.keys(response))
  }
  console.groupEnd()
}

export function logError(context: string, error: any) {
  console.group(`❌ Erro: ${context}`)
  console.error('Mensagem:', error.message)
  console.error('Status:', error.response?.status)
  console.error('Dados:', error.response?.data)
  console.error('Config:', error.config)
  console.groupEnd()
}
