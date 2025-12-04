/**
 * Serviço de Agregação MongoDB
 * 
 * Usa agregações otimizadas do MongoDB para gráficos
 * Muito mais rápido que buscar todos os registros
 */

import axios from 'axios'

const aggregationApi = axios.create({
  baseURL: 'http://localhost:3002/api',
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
 * Usa pipeline MongoDB otimizado
 */
export async function fetchAnalyticsAggregation(
  params: AggregationParams
): Promise<AnalyticsData> {
  try {
    console.log('📊 Buscando agregação MongoDB:', params)
    const startTime = performance.now()
    
    const response = await aggregationApi.post<{
      success: boolean
      data: AnalyticsData
      executionTime: number
    }>('/aggregate/analytics', params)
    
    const endTime = performance.now()
    const clientTime = (endTime - startTime).toFixed(2)
    
    console.log(`✅ Agregação recebida em ${clientTime}ms (servidor: ${response.data.executionTime}ms)`)
    console.log('📊 Dados:', {
      faturamentoDiario: response.data.data.faturamentoDiario.length,
      topEmitentes: response.data.data.topEmitentes.length,
      totalNotas: response.data.data.stats.totalNotas
    })
    
    return response.data.data
  } catch (error: any) {
    console.error('❌ Erro na agregação:', error.message)
    
    // Se o servidor de agregação não estiver disponível, retorna dados vazios
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.warn('⚠️ Servidor de agregação não disponível. Inicie com: node aggregation-server.cjs')
    }
    
    throw error
  }
}

/**
 * Verifica se o servidor de agregação está disponível
 */
export async function checkAggregationServer(): Promise<boolean> {
  try {
    const response = await axios.get('http://localhost:3002/health')
    return response.data.status === 'ok'
  } catch {
    return false
  }
}
