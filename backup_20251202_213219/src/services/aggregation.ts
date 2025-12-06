/**
 * Serviço de Agregação MongoDB
 * 
 * Usa agregações otimizadas do MongoDB para gráficos
 * Muito mais rápido que buscar todos os registros
 */

import axios from 'axios'

// Usar MongoDB Proxy (conexão direta ao MongoDB)
const aggregationApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export interface AggregationParams {
  collection: string
  dtIni: string
  dtFin: string
  cnpjEmit?: string
  cnpjDest?: string
}

export interface AnalyticsData {
  faturamentoDiario: Array<{
    data: string
    valor: number
    quantidade: number
  }>
  topEmitentes: Array<{
    nome: string
    valor: number
    quantidade: number
  }>
  distribuicaoTipos: Array<{
    name: string
    value: number
    quantidade: number
  }>
  distribuicaoStatus: Array<{
    name: string
    value: number
  }>
  evolucao: Array<{
    mes: string
    valor: number
    quantidade: number
  }>
  stats: {
    totalNotas: number
    totalValor: number
    mediaValor: number
    maiorNota: number
    menorNota: number
  }
}

/**
 * Busca dados agregados para Analytics
 * FALLBACK: Se MongoDB Proxy não estiver disponível, usa API REST + agregação local
 */
export async function fetchAnalyticsAggregation(
  params: AggregationParams
): Promise<AnalyticsData> {
  try {
    console.log('📊 Tentando MongoDB Proxy:', params)
    const startTime = performance.now()
    
    const response = await aggregationApi.post<{
      success: boolean
      data: AnalyticsData
      executionTime: number
    }>('/analytics/aggregate', params, {
      timeout: 30000 // 30 segundos para períodos longos
    })
    
    const endTime = performance.now()
    const clientTime = (endTime - startTime).toFixed(2)
    
    console.log(`✅ MongoDB Proxy: ${clientTime}ms (servidor: ${response.data.executionTime}ms)`)
    
    return response.data.data
  } catch (error: any) {
    console.warn('⚠️ MongoDB Proxy não disponível, usando API REST como fallback')
    
    // FALLBACK: Usar API REST + agregação local
    return await fetchAnalyticsViaAPI(params)
  }
}

/**
 * FALLBACK: Busca via API REST e agrega localmente
 */
async function fetchAnalyticsViaAPI(params: AggregationParams): Promise<AnalyticsData> {
  console.log('🔄 Usando API REST + agregação local')
  const startTime = performance.now()
  
  // Importar dinamicamente para evitar circular dependency
  const { fetchAggregatedAnalytics } = await import('./analyticsAggregation')
  
  const data = await fetchAggregatedAnalytics(
    {
      collection: params.collection,
      dtIni: params.dtIni,
      dtFin: params.dtFin,
      cnpjEmit: params.cnpjEmit,
      cnpjDest: params.cnpjDest
    },
    10000 // pageSize
  )
  
  const endTime = performance.now()
  console.log(`✅ API REST + agregação local: ${((endTime - startTime) / 1000).toFixed(2)}s`)
  
  return data
}

/**
 * Verifica se o servidor de agregação está disponível
 */
export async function checkAggregationServer(): Promise<boolean> {
  try {
    const response = await axios.get('/health')
    return response.data.status === 'ok'
  } catch {
    return false
  }
}
