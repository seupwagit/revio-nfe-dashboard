import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { env } from '../config/env'
import { fiscalDocumentsService } from '../services/fiscalDocuments'
import { DashboardStats, Filtros } from '../types'

export type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

// Funções para datas padrão (ÚLTIMO ANO - 365 dias)
export const getDefaultStartDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 1)
  return date.toISOString().split('T')[0]
}

export const getDefaultEndDate = () => {
  return new Date().toISOString().split('T')[0]
}

interface NFContextType {

  notas: any[]
  stats: DashboardStats
  loading: boolean
  progress: number
  currentPage: number
  totalPages: number
  error: any
  filtros: Filtros
  totalRegistros: number
  collection: CollectionType
  usandoCache: boolean
  isUpdating: boolean
  setFiltros: (filtros: Filtros) => void
  setCollection: (collection: CollectionType) => void
  recarregar: (opcoes?: { addStats?: boolean }) => void
}

const NFContext = createContext<NFContextType | undefined>(undefined)

/**
 * Calcula estatísticas dos documentos
 */
function calcularStats(dados: any[]): DashboardStats {
  const stats = {
    totalNotas: dados.length,
    valorTotal: dados.reduce((sum, doc) => sum + (doc.valorTotal || doc.VL_DOC || 0), 0),
    valorTotalEntradas: dados.filter(doc => (doc.tipoOperacao || doc.IND_OPER) === '0').reduce((sum, doc) => sum + (doc.valorTotal || doc.VL_DOC || 0), 0),
    valorTotalSaidas: dados.filter(doc => (doc.tipoOperacao || doc.IND_OPER) === '1').reduce((sum, doc) => sum + (doc.valorTotal || doc.VL_DOC || 0), 0),
    totalICMS: dados.reduce((sum, doc) => sum + (doc.totais?.valorICMS || doc.VL_ICMS || 0), 0),
    totalIPI: dados.reduce((sum, doc) => sum + (doc.totais?.valorIPI || doc.VL_IPI || 0), 0),
    totalPIS: dados.reduce((sum, doc) => sum + (doc.totais?.valorPIS || doc.VL_PIS || 0), 0),
    totalCOFINS: dados.reduce((sum, doc) => sum + (doc.totais?.valorCOFINS || doc.VL_COFINS || 0), 0),
    valorFrete: dados.reduce((sum, doc) => sum + (doc.totais?.valorFrete || doc.VL_FRT || 0), 0),
    valorSeguro: dados.reduce((sum, doc) => sum + (doc.totais?.valorSeguro || doc.VL_SEG || 0), 0),
    valorDesconto: dados.reduce((sum, doc) => sum + (doc.totais?.valorDesconto || doc.VL_DESC || 0), 0),
    notasAutorizadas: dados.filter(doc => (doc.status || doc.STATUS) === 'autorizada').length,
    notasCanceladas: dados.filter(doc => (doc.status || doc.STATUS) === 'cancelada').length,
    qtdEntradas: dados.filter(doc => (doc.tipoOperacao || doc.IND_OPER) === '0').length,
    qtdSaidas: dados.filter(doc => (doc.tipoOperacao || doc.IND_OPER) === '1').length,
    maiorNota: dados.length > 0 ? Math.max(...dados.map(d => d.valorTotal || d.VL_DOC || 0)) : 0,
    menorNota: dados.length > 0 ? Math.min(...dados.map(d => d.valorTotal || d.VL_DOC || 0)) : 0,
    notasHoje: 0,
    notasUltimos7Dias: 0,
    notasUltimos30Dias: 0
  };
  return stats;
}

export function NFProvider({ children }: { children: ReactNode }) {
  const [notas, setNotas] = useState<any[]>([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [stats, setStats] = useState<DashboardStats>({
    totalNotas: 0,
    valorTotal: 0,
    valorTotalEntradas: 0,
    valorTotalSaidas: 0,
    totalICMS: 0,
    totalIPI: 0,
    totalPIS: 0,
    totalCOFINS: 0,
    valorFrete: 0,
    valorSeguro: 0,
    valorDesconto: 0,
    notasAutorizadas: 0,
    notasCanceladas: 0,
    qtdEntradas: 0,
    qtdSaidas: 0,
    maiorNota: 0,
    menorNota: 0,
    notasHoje: 0,
    notasUltimos7Dias: 0,
    notasUltimos30Dias: 0
  })
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<any>(null)
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: getDefaultStartDate(),
    dataFim: getDefaultEndDate()
  })
  const [collection, setCollection] = useState<CollectionType>('tbl_nfe_100')
  const [usandoCache, setUsandoCache] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const carregarDados = async (opcoes: { addStats?: boolean } = {}) => {
    const { addStats = false } = opcoes
    const startTime = Date.now()
    
    // Se for uma atualização de filtros dinâmicos, não mostramos o loading global (que trava a UI)
    const isDynamicRefresh = !!(filtros.dynamicFilters && filtros.dynamicFilters.length > 0)
    
    if (isDynamicRefresh) {
      setIsUpdating(true)
    } else {
      setLoading(true)
    }
    
    setProgress(0)
    setCurrentPage(0)
    setTotalPages(0)
    setError(null)
    setUsandoCache(false)
    
    console.log('📊 Carregando dados da collection:', collection)
    console.log('📋 Filtros:', filtros)
    
    try {
      console.log('🔍 Buscando documentos via API REST...')
      console.log('🔍 DEBUG: Parâmetros da busca:', {
        collection,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        cnpjEmit: filtros.cnpjEmit,
        cnpjDest: filtros.cnpjDest
      })
      
      // Busca documentos via API REST (backend)
      // LIMITE SEGURO - evita erro 500 no backend
      console.log('🚀 DEBUG: Iniciando fetchDocuments...')
      const response = await fiscalDocumentsService.fetchDocuments({
        collection,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        cnpjEmit: filtros.cnpjEmit,
        cnpjDest: filtros.cnpjDest,
        dynamicFilters: filtros.dynamicFilters,
        page: 1,
        pageSize: env.defaults.dashboardPageSize  // Limite configurado via .env
      }, (current, total, data) => {
        // Callback de progresso
        const progressPercent = Math.round((current / total) * 100)
        setProgress(progressPercent)
        setCurrentPage(current)
        setTotalPages(total)
        console.log('📊 DEBUG: Progresso callback:', { current, total, dataLength: data?.length })
      })
      
      console.log('📊 DEBUG: Response completa do fiscalDocumentsService:', response)
      
      // Validar resposta da API
      if (!response) {
        console.error('❌ DEBUG: Resposta vazia da API')
        throw new Error('Resposta vazia da API')
      }
      
      const dados = Array.isArray(response) ? response : []
      
      console.log('📊 DEBUG: Dados recebidos da API:', {
        quantidade: dados.length,
        tipo: typeof dados,
        isArray: Array.isArray(dados),
        primeiraNota: dados[0]
      })
      
      console.log('🔢 Buscando contagem total...')
      console.log('🚀 DEBUG: Iniciando fetchCount...')
      const totalCount = await fiscalDocumentsService.fetchCount({
        collection,
        dataInicio: filtros.dataInicio, // Adicionado dataInicio
        dataFim: filtros.dataFim,
        cnpjEmit: filtros.cnpjEmit,
        cnpjDest: filtros.cnpjDest,
        dynamicFilters: filtros.dynamicFilters
      })
      
      console.log('📊 DEBUG: Total count recebido:', totalCount)
      
      // Busca estatísticas agregadas para o dashboard APENAS se solicitado
      let dashboardStats = stats
      if (addStats) {
        console.log('📊 Buscando estatísticas agregadas...')
        dashboardStats = await fiscalDocumentsService.fetchStats({
          collection,
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
          cnpjEmit: filtros.cnpjEmit,
          cnpjDest: filtros.cnpjDest,
          status: filtros.status,
          dynamicFilters: filtros.dynamicFilters
        })
      } else {
        console.log('⏭️ Ignorando busca de stats (otimização de grid)')
        // Se não buscamos do backend, calculamos o básico dos dados já carregados para não ficar zerado
        dashboardStats = calcularStats(dados)
      }
      
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Recebidos ${dados.length} registros e estatísticas em ${loadTime}s`)
      
      setProgress(100)
      setCurrentPage(1)
      setTotalPages(Math.ceil(totalCount / env.defaults.dashboardPageSize) || 1)
      setNotas(dados)
      setTotalRegistros(totalCount)
      setStats(dashboardStats)
      setError(null)
      
      console.log('✅ DEBUG: Estado atualizado com sucesso')
      console.log('✅ DEBUG: Estado final:', {
        notasLength: dados.length,
        totalRegistros: totalCount,
        stats: calcularStats(dados)
      })
    } catch (err: any) {
      console.error('❌ Erro ao carregar notas:', err)
      
      // Verifica se é erro de conexão com o backend
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError({
          status: 503,
          message: 'Servidor MongoDB Proxy não está rodando. Execute: npm run mongodb-proxy',
          data: { hint: 'Verifique se o servidor proxy está ativo na porta 3000' }
        })
      } else {
        setError({
          status: err.response?.status,
          message: err.message,
          data: err.response?.data
        })
      }
      
      setNotas([])
      setTotalRegistros(0)
      setProgress(0)
    } finally {
      setLoading(false)
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    carregarDados({ addStats: false })
  }, [filtros, collection])

  return (
    <NFContext.Provider value={{ 
      notas, 
      stats, 
      loading,
      progress,
      currentPage,
      totalPages,
      error,
      filtros,
      totalRegistros,
      collection,
      usandoCache,
      isUpdating,
      setFiltros,
      setCollection,
      recarregar: (opcoes) => carregarDados(opcoes) 
    }}>
      {children}
    </NFContext.Provider>
  )
}

export function useNF() {
  const context = useContext(NFContext)
  if (!context) {
    throw new Error('useNF deve ser usado dentro de NFProvider')
  }
  return context
}
