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
  onProgress?: (current: number, total: number, data: any[], fromCache?: boolean) => void
  onComplete?: (data: any[]) => void
  onError?: (error: Error) => void
}

class StreamingCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 90 * 60 * 1000 // 90 minutos (mais longo para dados acumulados)
  
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
    if (!cached) {
      console.log('❌ Cache MISS: chave não encontrada')
      return null
    }
    
    const age = Date.now() - cached.timestamp
    const ageMinutes = Math.floor(age / (60 * 1000))
    const remainingMinutes = Math.floor((this.CACHE_DURATION - age) / (60 * 1000))
    
    // Se expirou, remove
    if (age > this.CACHE_DURATION) {
      console.log(`⏰ Cache EXPIRADO (${ageMinutes} minutos): removendo`)
      this.cache.delete(key)
      return null
    }
    
    console.log(`✅ Cache HIT! Idade: ${ageMinutes} min, Resta: ${remainingMinutes} min, Registros: ${cached.data.length}, Completo: ${cached.complete}`)
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
        timestamp: Date.now(), // Atualiza timestamp para renovar o cache
        complete: isComplete,
        totalPages,
        currentPage: page
      })
      console.log(`💾 Cache ATUALIZADO: ${allData.length} registros (página ${page}/${totalPages}, completo: ${isComplete})`)
      console.log(`⏰ Cache válido por mais 90 minutos a partir de agora`)
    } else {
      // Primeira página
      this.cache.set(key, {
        data: newData,
        timestamp: Date.now(),
        complete: isComplete,
        totalPages,
        currentPage: page
      })
      console.log(`💾 Cache CRIADO: ${newData.length} registros (página ${page}/${totalPages}, completo: ${isComplete})`)
      console.log(`⏰ Cache válido por 90 minutos`)
    }
    
    // Log do tamanho total do cache
    console.log(`📊 Total em cache: ${this.cache.size} chaves`)
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
      console.log(`💾 ✅ CACHE HIT! Retornando ${cached.data.length} registros do cache (completo)`)
      onProgress?.(cached.currentPage, cached.totalPages, cached.data, true)
      onComplete?.(cached.data)
      return cached.data
    }
    
    // Se tem cache parcial, retorna imediatamente e continua buscando
    if (cached && !cached.complete) {
      console.log(`💾 Cache parcial encontrado: ${cached.data.length} registros`)
      onProgress?.(cached.currentPage, cached.totalPages, cached.data, true)
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
        
        // Notifica progresso (não é do cache, é nova busca)
        onProgress?.(page, totalPages, allData, false)
        
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
    let kept = 0
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      const ageMinutes = Math.floor(age / (60 * 1000))
      
      if (age > this.CACHE_DURATION) {
        console.log(`🗑️ Removendo cache expirado (${ageMinutes} minutos): ${key.substring(0, 100)}...`)
        this.cache.delete(key)
        cleaned++
      } else {
        const remainingMinutes = Math.floor((this.CACHE_DURATION - age) / (60 * 1000))
        console.log(`✅ Mantendo cache (${ageMinutes} min, resta ${remainingMinutes} min): ${entry.data.length} registros`)
        kept++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache limpo: ${cleaned} entradas removidas, ${kept} mantidas`)
    } else if (kept > 0) {
      console.log(`✅ Cache OK: ${kept} entradas válidas (nenhuma expirada)`)
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
  
  /**
   * Debug: mostra todas as entradas do cache
   */
  debugCache() {
    console.group('🔍 DEBUG CACHE')
    console.log(`Total de chaves: ${this.cache.size}`)
    console.log(`Duração do cache: ${this.CACHE_DURATION / (60 * 1000)} minutos`)
    
    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - entry.timestamp
      const ageMinutes = Math.floor(age / (60 * 1000))
      const remainingMinutes = Math.floor((this.CACHE_DURATION - age) / (60 * 1000))
      
      console.log(`\n📦 Chave: ${key.substring(0, 100)}...`)
      console.log(`   Registros: ${entry.data.length}`)
      console.log(`   Completo: ${entry.complete}`)
      console.log(`   Idade: ${ageMinutes} minutos`)
      console.log(`   Resta: ${remainingMinutes} minutos`)
      console.log(`   Páginas: ${entry.currentPage}/${entry.totalPages}`)
    }
    
    console.groupEnd()
  }
}

// Instância singleton
export const streamingCache = new StreamingCache()

// Limpar cache expirado a cada 30 minutos (não precisa ser tão frequente)
// Cache dura 90 minutos, então verificar a cada 30 min é suficiente
setInterval(() => {
  console.log('🔍 Verificando cache expirado...')
  streamingCache.cleanExpired()
}, 30 * 60 * 1000) // 30 minutos

// Log inicial
console.log('💾 StreamingCache inicializado: duração 90 minutos, limpeza a cada 30 minutos')

// Expor no window para debug no console
if (typeof window !== 'undefined') {
  (window as any).debugCache = () => streamingCache.debugCache()
  console.log('💡 Use window.debugCache() no console para ver o status do cache')
}
