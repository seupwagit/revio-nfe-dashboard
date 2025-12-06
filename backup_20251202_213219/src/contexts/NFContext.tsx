import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DashboardStats, Filtros } from '../types'
import { mongoApiService } from '../services/mongoApi'

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
      
      // Busca documentos via API REST (backend)
      const response = await mongoApiService.fetchDocuments({
        collection,
        dtIni: filtros.dataInicio,
        dtFim: filtros.dataFim,
        cnpjEmit: filtros.cnpjEmit,
        cnpjDest: filtros.cnpjDest,
        page: 1,
        size: 5000
      })
      
      const dados = response.data
      const { total, totalPages } = response.pagination
      
      // Busca contagem total
      const totalCount = await mongoApiService.countDocuments({
        collection,
        dtIni: filtros.dataInicio,
        dtFim: filtros.dataFim,
        cnpjEmit: filtros.cnpjEmit,
        cnpjDest: filtros.cnpjDest
      })
      
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Recebidos ${dados.length} registros da collection ${collection} em ${loadTime}s`)
      console.log(`⚡ Tempo de execução no backend: ${response.executionTime}ms`)
      
      setProgress(100)
      setCurrentPage(1)
      setTotalPages(totalPages)
      setNotas(dados)
      setTotalRegistros(totalCount)
      setStats(calcularStats(dados))
      setError(null)
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
