/**
 * Sistema de Cache Incremental com Streaming
 * 
 * Permite buscar dados em chunks (páginas) e ir acumulando no cache do navegador,
 * atualizando a UI progressivamente conforme os dados chegam.
 */

interface CacheEntry {
  data: any[]
  timestamp: number
  complete: boolean // Se a busca foi completada
  totalPages: number
  currentPage: number
}

interface StreamingOptions {
  onProgress?: (current: number, total: number, data: any[]) => void
  onComplete?: (data: any[]) => void
  onError?: (error: Error) => void
}

class StreamingCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutos (mais longo para dados acumulados)
  
  /**
   * Gera chave única para o cache baseada nos filtros
   */
  getCacheKey(filtros: any): string {
    return JSON.stringify({
      collection: filtros.collection,
      dtIni: filtros.dataInicio,
      dtFin: filtros.dataFim,
      cnpjEmit: filtros.cnpjEmit,
      cnpjDest: filtros.cnpjDest
    })
  }
  
  /**
   * Verifica se há dados em cache (mesmo que parciais)
   */
  getFromCache(key: string): CacheEntry | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    // Se expirou, remove
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }
    
    return cached
  }
  
  /**
   * Salva ou atualiza dados no cache
   */
  updateCache(key: string, newData: any[], page: number, isComplete: boolean, totalPages: number) {
    const existing = this.cache.get(key)
    
    if (existing) {
      // Acumula dados
      const allData = [...existing.data, ...newData]
      this.cache.set(key, {
        data: allData,
        timestamp: Date.now(),
        complete: isComplete,
        totalPages,
        currentPage: page
      })
      console.log(`💾 Cache atualizado: ${allData.length} registros (página ${page}/${totalPages})`)
    } else {
      // Primeira página
      this.cache.set(key, {
        data: newData,
        timestamp: Date.now(),
        complete: isComplete,
        totalPages,
        currentPage: page
      })
      console.log(`💾 Cache criado: ${newData.length} registros (página ${page}/${totalPages})`)
    }
  }
  
  /**
   * Busca dados com streaming incremental
   */
  async fetchWithStreaming(
    fetchFn: (page: number) => Promise<{ data: any[], hasMore: boolean }>,
    cacheKey: string,
    options: StreamingOptions = {}
  ): Promise<any[]> {
    const { onProgress, onComplete, onError } = options
    
    // Verifica cache primeiro
    const cached = this.getFromCache(cacheKey)
    if (cached?.complete) {
      console.log(`💾 Retornando ${cached.data.length} registros do cache (completo)`)
      onComplete?.(cached.data)
      return cached.data
    }
    
    // Se tem cache parcial, retorna imediatamente e continua buscando
    if (cached && !cached.complete) {
      console.log(`💾 Cache parcial encontrado: ${cached.data.length} registros`)
      onProgress?.(cached.currentPage, cached.totalPages, cached.data)
    }
    
    try {
      let page = cached ? cached.currentPage + 1 : 1
      let allData = cached ? [...cached.data] : []
      let hasMore = true
      let totalPages = 0
      
      while (hasMore) {
        console.log(`📄 Buscando página ${page}...`)
        
        const result = await fetchFn(page)
        const newData = result.data
        
        if (newData.length === 0) {
          hasMore = false
          break
        }
        
        // Acumula dados
        allData = [...allData, ...newData]
        hasMore = result.hasMore
        totalPages = hasMore ? page + 1 : page
        
        // Atualiza cache incrementalmente
        this.updateCache(cacheKey, newData, page, !hasMore, totalPages)
        
        // Notifica progresso
        onProgress?.(page, totalPages, allData)
        
        console.log(`✅ Página ${page}: ${newData.length} registros (total: ${allData.length})`)
        
        if (hasMore) {
          page++
          // Pequena pausa para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log(`✅ Busca completa: ${allData.length} registros em ${page} páginas`)
      onComplete?.(allData)
      
      return allData
      
    } catch (error) {
      console.error('❌ Erro no streaming:', error)
      onError?.(error as Error)
      throw error
    }
  }
  
  /**
   * Limpa cache expirado
   */
  cleanExpired() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache limpo: ${cleaned} entradas removidas`)
    }
  }
  
  /**
   * Limpa todo o cache
   */
  clearAll() {
    this.cache.clear()
    console.log('🧹 Cache completamente limpo')
  }
  
  /**
   * Estatísticas do cache
   */
  getStats() {
    let totalRecords = 0
    let completeEntries = 0
    let partialEntries = 0
    
    for (const entry of this.cache.values()) {
      totalRecords += entry.data.length
      if (entry.complete) completeEntries++
      else partialEntries++
    }
    
    return {
      entries: this.cache.size,
      totalRecords,
      completeEntries,
      partialEntries
    }
  }
}

// Instância singleton
export const streamingCache = new StreamingCache()

// Limpar cache expirado a cada 5 minutos
setInterval(() => {
  streamingCache.cleanExpired()
}, 5 * 60 * 1000)
