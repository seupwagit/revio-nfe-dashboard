import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DashboardStats, Filtros } from '../types'
import { fiscalDocumentsService } from '../services/fiscalDocuments'

export type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

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
  setFiltros: (filtros: Filtros) => void
  setCollection: (collection: CollectionType) => void
  recarregar: () => void
}

const NFContext = createContext<NFContextType | undefined>(undefined)

/**
 * Calcula estatísticas dos documentos
 */
function calcularStats(dados: any[]): DashboardStats {
  return {
    totalNotas: dados.length,
    valorTotal: dados.reduce((sum, doc) => sum + (doc.valorTotal || 0), 0),
    notasAutorizadas: dados.filter(doc => doc.status === 'autorizada').length,
    notasCanceladas: dados.filter(doc => doc.status === 'cancelada').length
  }
}

export function NFProvider({ children }: { children: ReactNode }) {
  const [notas, setNotas] = useState<any[]>([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [stats, setStats] = useState<DashboardStats>({
    totalNotas: 0,
    valorTotal: 0,
    notasAutorizadas: 0,
    notasCanceladas: 0
  })
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<any>(null)
  const [filtros, setFiltros] = useState<Filtros>({})
  const [collection, setCollection] = useState<CollectionType>('tbl_nfe_100')
  const [usandoCache, setUsandoCache] = useState(false)

  const carregarDados = async () => {
    const startTime = Date.now()
    setLoading(true)
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
      // SEM LIMITE - busca TODOS os documentos do período
      console.log('🚀 DEBUG: Iniciando fetchDocuments...')
      const response = await fiscalDocumentsService.fetchDocuments({
        collection,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        cnpjEmit: filtros.cnpjEmit,
        cnpjDest: filtros.cnpjDest,
        page: 1,
        pageSize: 999999  // Sem limite - busca todos os documentos
      }, (current, total, data) => {
        // Callback de progresso
        const progressPercent = Math.round((current / total) * 100)
        setProgress(progressPercent)
        setCurrentPage(current)
        setTotalPages(total)
        console.log('📊 DEBUG: Progresso callback:', { current, total, dataLength: data?.length })
      })
      
      console.log('📊 DEBUG: Response completa do fiscalDocumentsService:', response)
      console.log('📊 DEBUG: Tipo da response:', typeof response)
      console.log('📊 DEBUG: É array?', Array.isArray(response))
      
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
        primeiraNota: dados[0],
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : 'null'
      })
      
      // Busca contagem total
      console.log('🔢 Buscando contagem total...')
      console.log('🚀 DEBUG: Iniciando fetchCount...')
      const totalCount = await fiscalDocumentsService.fetchCount({
        collection,
        dataFim: filtros.dataFim,
        cnpjEmit: filtros.cnpjEmit,
        cnpjDest: filtros.cnpjDest
      })
      
      console.log('📊 DEBUG: Total count recebido:', totalCount)
      console.log('📊 DEBUG: Tipo do totalCount:', typeof totalCount)
      
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Recebidos ${dados.length} registros da collection ${collection} em ${loadTime}s`)
      
      console.log('📊 DEBUG: Setando estado:', {
        dadosLength: dados.length,
        totalCount
      })
      
      setProgress(100)
      setCurrentPage(1)
      setTotalPages(Math.ceil(totalCount / 999999) || 1)
      setNotas(dados)
      setTotalRegistros(totalCount)
      setStats(calcularStats(dados))
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
    }
  }

  useEffect(() => {
    carregarDados()
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
      setFiltros,
      setCollection,
      recarregar: carregarDados 
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
