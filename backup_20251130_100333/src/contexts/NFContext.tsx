import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DashboardStats, Filtros } from '../types'
import { fetchNotasFiscais, fetchContador, calcularStats } from '../services/api'

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
  setFiltros: (filtros: Filtros) => void
  setCollection: (collection: CollectionType) => void
  recarregar: () => void
}

const NFContext = createContext<NFContextType | undefined>(undefined)

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

  const carregarDados = async () => {
    setLoading(true)
    setProgress(0)
    setCurrentPage(0)
    setTotalPages(0)
    setError(null)
    console.log('📊 Carregando dados da collection:', collection)
    console.log('📋 Filtros:', filtros)
    try {
      const filtrosComCollection = { ...filtros, collection }
      console.log('🔍 Buscando com streaming incremental:', filtrosComCollection)
      
      // Busca com streaming - atualiza UI conforme dados chegam
      const dados = await fetchNotasFiscais(
        filtrosComCollection,
        (current, total, partialData) => {
          // Atualiza UI progressivamente
          console.log(`📊 Atualizando UI: ${partialData.length} registros (página ${current}/${total})`)
          setCurrentPage(current)
          setTotalPages(total)
          setProgress(total > 0 ? Math.round((current / total) * 100) : 0)
          setNotas(partialData)
          setStats(calcularStats(partialData))
        }
      )
      
      // Busca total em paralelo (rápido)
      const total = await fetchContador(filtrosComCollection)
      
      console.log(`✅ Recebidos ${dados.length} registros da collection ${collection}`)
      setProgress(100)
      setNotas(dados)
      setTotalRegistros(total)
      setStats(calcularStats(dados))
      setError(null)
    } catch (err: any) {
      console.error('❌ Erro ao carregar notas:', err)
      setError({
        status: err.response?.status,
        message: err.message,
        data: err.response?.data
      })
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
