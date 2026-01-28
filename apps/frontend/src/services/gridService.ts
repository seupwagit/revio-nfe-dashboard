/**
 * 🚀 Serviço Otimizado para Grids
 * Busca com cache inteligente e validação automática
 */

import { env } from '../config/env'
import { getFromGridCache, getGridCacheKey, saveToGridCache } from './gridCache'
import { httpService } from './httpService'

// Interface para resposta da API do grid
interface GridResponse {
  lista?: any[]
  data?: any[]
  items?: any[]
  [key: string]: any
}

export interface GridFiltros {
  collection: string
  dtIni: string
  dtFin: string
  cnpjEmit?: string
  cnpjDest?: string
  [key: string]: any
}

export interface GridProgressInfo {
  etapa: 'validando' | 'buscando' | 'processando' | 'concluido'
  progresso: number
  paginaAtual: number
  totalPaginas: number
  registrosAcumulados: number
  tempoDecorrido: number
  usandoCache: boolean
}

export async function fetchGridData<T>(
  filtros: GridFiltros,
  pageSize: number = 10000,
  onProgress?: (info: GridProgressInfo) => void
): Promise<T[]> {
  const startTime = performance.now()
  
  // Verificar cache
  onProgress?.({
    etapa: 'validando',
    progresso: 0,
    paginaAtual: 0,
    totalPaginas: 0,
    registrosAcumulados: 0,
    tempoDecorrido: 0,
    usandoCache: false
  })
  
  const cacheKey = getGridCacheKey(filtros.collection, filtros.dtIni, filtros.dtFin, filtros)
  const cached = getFromGridCache<T>(cacheKey)
  
  if (cached) {
    onProgress?.({
      etapa: 'concluido',
      progresso: 100,
      paginaAtual: 1,
      totalPaginas: 1,
      registrosAcumulados: cached.length,
      tempoDecorrido: (performance.now() - startTime) / 1000,
      usandoCache: true
    })
    return cached
  }
  
  // Buscar da API
  console.log(`🔍 Buscando dados da grid: ${filtros.collection}`)
  console.log(`📅 Período: ${filtros.dtIni} até ${filtros.dtFin}`)
  
  const allData: T[] = []
  let currentPage = 1
  let hasMorePages = true
  let totalPaginas = 0
  
  onProgress?.({
    etapa: 'buscando',
    progresso: 10,
    paginaAtual: 0,
    totalPaginas: 0,
    registrosAcumulados: 0,
    tempoDecorrido: (performance.now() - startTime) / 1000,
    usandoCache: false
  })
  
  while (hasMorePages && currentPage <= 100) {
    try {
      const params = new URLSearchParams({
        host: env.database.host,
        database: env.database.database,
        collection: filtros.collection,
        dtIni: filtros.dtIni,
        dtFin: filtros.dtFin,
        pg: currentPage.toString(),
        size: pageSize.toString()
      })

      if (filtros.cnpjEmit) params.append('cnpjEmit', filtros.cnpjEmit)
      if (filtros.cnpjDest) params.append('cnpjDest', filtros.cnpjDest)

      const response = await httpService.get<GridResponse>(`/WebView/Consultar?${params.toString()}`, {
        timeout: 90000
      })
      
      if (!response.success) {
        throw new Error('Resposta inválida do servidor')
      }

      let items = response.lista || response.data || response.items || response
      if (!Array.isArray(items) && response && typeof response === 'object') {
        const arrayKey = Object.keys(response).find(key => Array.isArray(response[key]))
        if (arrayKey) items = response[arrayKey]
      }
      
      const registros = Array.isArray(items) ? items : []
      
      if (registros.length === 0) {
        hasMorePages = false
        break
      }
      
      allData.push(...registros)
      
      // Estimar total de páginas
      if (totalPaginas === 0 && registros.length === pageSize) {
        totalPaginas = Math.ceil(allData.length * 1.5 / pageSize) // Estimativa conservadora
      }
      
      const progresso = totalPaginas > 0 
        ? Math.min(90, 10 + (currentPage / totalPaginas) * 80)
        : Math.min(90, 10 + (currentPage * 5))
      
      onProgress?.({
        etapa: 'buscando',
        progresso,
        paginaAtual: currentPage,
        totalPaginas: totalPaginas || currentPage,
        registrosAcumulados: allData.length,
        tempoDecorrido: (performance.now() - startTime) / 1000,
        usandoCache: false
      })
      
      console.log(`📄 Página ${currentPage}: ${registros.length} registros (total: ${allData.length})`)
      
      if (registros.length < pageSize) {
        hasMorePages = false
      }
      
      currentPage++
      
    } catch (error) {
      console.error(`❌ Erro na página ${currentPage}:`, error)
      hasMorePages = false
    }
  }
  
  // Processar dados
  onProgress?.({
    etapa: 'processando',
    progresso: 95,
    paginaAtual: currentPage - 1,
    totalPaginas: currentPage - 1,
    registrosAcumulados: allData.length,
    tempoDecorrido: (performance.now() - startTime) / 1000,
    usandoCache: false
  })
  
  console.log(`✅ Total de registros: ${allData.length}`)
  
  // Salvar no cache
  saveToGridCache(cacheKey, allData, filtros.collection, filtros)
  
  // Concluído
  const tempoTotal = (performance.now() - startTime) / 1000
  onProgress?.({
    etapa: 'concluido',
    progresso: 100,
    paginaAtual: currentPage - 1,
    totalPaginas: currentPage - 1,
    registrosAcumulados: allData.length,
    tempoDecorrido: tempoTotal,
    usandoCache: false
  })
  
  console.log(`⏱️ Tempo total: ${tempoTotal.toFixed(2)}s`)
  
  return allData
}
