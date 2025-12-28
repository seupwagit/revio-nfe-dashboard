/**
 * Serviço de Agregação MongoDB
 * 
 * Usa agregações otimizadas do MongoDB para gráficos
 * Conecta com o backend analytics API usando padrão de autenticação centralizado
 */

import { httpService } from './httpService'

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

interface AnalyticsResponse {
  success: boolean
  data: AnalyticsData
  executionTime: number
}

interface HealthResponse {
  success: boolean
  status: string
}

/**
 * Serviço de Agregação Analytics
 * 
 * Fornece métodos para buscar dados agregados via API usando autenticação padronizada.
 */
export class AggregationService {

  /**
   * Busca dados agregados para Analytics
   * Usa pipeline MongoDB otimizado via backend
   */
  public async fetchAnalyticsAggregation(params: AggregationParams): Promise<AnalyticsData> {
    try {
      console.log('📊 Buscando agregação MongoDB:', params)
      const startTime = performance.now()
      
      const response = await httpService.post<AnalyticsResponse>(
        '/api/analytics/aggregate',
        params,
        {
          errorContext: 'Analytics - Agregação de dados',
          timeout: 60000 // 60 segundos para agregações complexas
        }
      )
      
      const endTime = performance.now()
      const clientTime = (endTime - startTime).toFixed(2)
      
      if (!response.success) {
        console.error('❌ Erro na agregação:', response.error)
        throw new Error(response.error || 'Erro ao buscar dados de analytics')
      }

      // O httpService retorna a resposta do backend diretamente quando tem success: true
      const analyticsData = (response as any).data || response.data
      const executionTime = (response as any).executionTime || 0
      
      console.log(`✅ Agregação recebida em ${clientTime}ms (servidor: ${executionTime}ms)`)
      console.log('📊 Dados:', {
        faturamentoDiario: analyticsData.faturamentoDiario?.length || 0,
        topEmitentes: analyticsData.topEmitentes?.length || 0,
        totalNotas: analyticsData.stats?.totalNotas || 0
      })
      
      return analyticsData
      
    } catch (error: any) {
      console.error('❌ Erro na agregação:', error.message)
      
      // Tratamento específico de erros
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        throw new Error('Timeout na agregação - dados muito grandes ou consulta complexa')
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Sessão expirada. Faça login novamente.')
      } else if (error.message.includes('500')) {
        throw new Error('Erro interno do servidor. Tente novamente em alguns minutos.')
      } else if (error.message.includes('CONNECTION_ERROR')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.')
      }
      
      throw error
    }
  }

  /**
   * Verifica se o servidor de analytics está disponível
   */
  public async checkAnalyticsServer(): Promise<boolean> {
    try {
      const response = await httpService.get<HealthResponse>(
        '/api/health',
        {
          errorContext: 'Analytics - Verificação de saúde',
          showErrorNotification: false, // Não mostrar notificação para health check
          timeout: 5000 // 5 segundos para health check
        }
      )
      
      return response.success && (response as any).status === 'ok'
      
    } catch (error) {
      console.warn('⚠️ Servidor de analytics não disponível:', error)
      return false
    }
  }

  /**
   * Testa conectividade com a API de analytics
   */
  public async testConnection(): Promise<{ 
    success: boolean
    message: string
    responseTime?: number 
  }> {
    try {
      const startTime = performance.now()
      
      const isHealthy = await this.checkAnalyticsServer()
      
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      if (isHealthy) {
        return {
          success: true,
          message: 'Conexão com analytics estabelecida com sucesso',
          responseTime
        }
      } else {
        return {
          success: false,
          message: 'Servidor de analytics não está respondendo adequadamente',
          responseTime
        }
      }
      
    } catch (error: any) {
      return {
        success: false,
        message: `Erro na conexão: ${error.message}`
      }
    }
  }
}

/**
 * Instância global do serviço
 */
export const aggregationService = new AggregationService()

/**
 * Função de compatibilidade (mantida para não quebrar código existente)
 * @deprecated Use aggregationService.fetchAnalyticsAggregation() instead
 */
export async function fetchAnalyticsAggregation(params: AggregationParams): Promise<AnalyticsData> {
  return aggregationService.fetchAnalyticsAggregation(params)
}

/**
 * Função de compatibilidade (mantida para não quebrar código existente)
 * @deprecated Use aggregationService.checkAnalyticsServer() instead
 */
export async function checkAnalyticsServer(): Promise<boolean> {
  return aggregationService.checkAnalyticsServer()
}