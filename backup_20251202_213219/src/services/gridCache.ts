/**
 * 🗄️ Cache Genérico para Grids
 * Funciona com qualquer collection (NF-e, CF-e, CT-e)
 */

const CACHE_PREFIX = 'grid_cache_'
const CACHE_DURATION = 90 * 60 * 1000 // 90 minutos

interface CacheEntry<T> {
  data: T[]
  timestamp: number
  key: string
  collection: string
  filtros: any
}

export function getGridCacheKey(
  collection: string,
  dtIni: string,
  dtFin: string,
  filtros?: any
): string {
  const filtrosStr = filtros ? JSON.stringify(filtros) : ''
  return `${collection}_${dtIni}_${dtFin}_${filtrosStr}`
}

export function saveToGridCache<T>(
  key: string,
  data: T[],
  collection: string,
  filtros?: any
): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
      collection,
      filtros: filtros || {}
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
    console.log(`💾 Grid cache salvo: ${key} (${data.length} registros)`)
  } catch (error) {
    console.warn('⚠️ Erro ao salvar grid cache:', error)
  }
}

export function getFromGridCache<T>(key: string): T[] | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key)
    
    if (!cached) {
      console.log('💾 Grid cache não encontrado:', key)
      return null
    }

    const entry: CacheEntry<T> = JSON.parse(cached)
    const age = Date.now() - entry.timestamp

    if (age > CACHE_DURATION) {
      localStorage.removeItem(CACHE_PREFIX + key)
      console.log('🗑️ Grid cache expirado, removido')
      return null
    }

    console.log(`💾 Grid cache encontrado (${(age / 1000).toFixed(0)}s atrás, ${entry.data.length} registros)`)
    return entry.data
  } catch (error) {
    console.warn('⚠️ Erro ao ler grid cache:', error)
    return null
  }
}

export function clearGridCache(collection?: string): number {
  try {
    const keys = Object.keys(localStorage)
    let removed = 0
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        if (!collection) {
          // Limpar tudo
          localStorage.removeItem(key)
          removed++
        } else {
          // Limpar apenas da collection específica
          try {
            const cached = localStorage.getItem(key)
            if (cached) {
              const entry = JSON.parse(cached)
              if (entry.collection === collection) {
                localStorage.removeItem(key)
                removed++
              }
            }
          } catch (e) {
            // Remove cache corrompido
            localStorage.removeItem(key)
            removed++
          }
        }
      }
    })
    
    console.log(`🗑️ Grid cache limpo: ${removed} item(ns) removido(s)`)
    return removed
  } catch (error) {
    console.warn('⚠️ Erro ao limpar grid cache:', error)
    return 0
  }
}

export function getGridCacheInfo(collection?: string): { count: number; size: number; items: any[] } {
  let count = 0
  let size = 0
  const items: any[] = []

  try {
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        const item = localStorage.getItem(key)
        if (item) {
          try {
            const entry = JSON.parse(item)
            
            if (!collection || entry.collection === collection) {
              count++
              size += item.length
              
              const age = Date.now() - entry.timestamp
              const remaining = CACHE_DURATION - age
              
              items.push({
                key: key.replace(CACHE_PREFIX, ''),
                collection: entry.collection,
                registros: entry.data?.length || 0,
                idade: Math.floor(age / 1000),
                expiraEm: Math.floor(remaining / 1000),
                tamanho: item.length
              })
            }
          } catch (e) {
            // Ignora cache corrompido
          }
        }
      }
    })
  } catch (error) {
    console.warn('⚠️ Erro ao obter info do grid cache:', error)
  }

  return { count, size, items }
}

export function removeFromGridCache(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
    console.log(`🗑️ Grid cache removido: ${key}`)
  } catch (error) {
    console.warn('⚠️ Erro ao remover grid cache:', error)
  }
}

export function getAllGridCacheKeys(): string[] {
  try {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(CACHE_PREFIX))
      .map(key => key.replace(CACHE_PREFIX, ''))
  } catch (error) {
    console.warn('⚠️ Erro ao obter chaves do grid cache:', error)
    return []
  }
}
