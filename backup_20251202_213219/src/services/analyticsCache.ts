/**
 * Cache persistente para Analytics
 * Armazena resultados no LocalStorage para acesso instantâneo
 */

import { AggregatedAnalytics } from './analyticsAggregation'

const CACHE_PREFIX = 'analytics_cache_'
const CACHE_DURATION = 60 * 60 * 1000 // 60 minutos (1 hora)

interface CacheEntry {
  data: AggregatedAnalytics
  timestamp: number
  key: string
}

export function getCacheKey(collection: string, dtIni: string, dtFin: string): string {
  // PageSize não afeta o resultado final, apenas a velocidade de busca
  // Então não incluímos na chave do cache
  return `${collection}_${dtIni}_${dtFin}`
}

export function saveToCache(key: string, data: AggregatedAnalytics): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      key
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
    console.log('💾 Dados salvos no cache persistente')
  } catch (error) {
    console.warn('⚠️ Erro ao salvar cache:', error)
  }
}

export function getFromCache(key: string): AggregatedAnalytics | null {
  try {
    // APENAS cache exato - não reutilizar períodos diferentes
    const cached = localStorage.getItem(CACHE_PREFIX + key)
    
    if (!cached) {
      console.log('💾 Cache não encontrado para:', key)
      return null
    }

    const entry: CacheEntry = JSON.parse(cached)
    const age = Date.now() - entry.timestamp

    if (age > CACHE_DURATION) {
      localStorage.removeItem(CACHE_PREFIX + entry.key)
      console.log('🗑️ Cache expirado, removido')
      return null
    }

    console.log(`💾 Cache EXATO encontrado (${(age / 1000).toFixed(0)}s atrás)`)
    return entry.data
  } catch (error) {
    console.warn('⚠️ Erro ao ler cache:', error)
    return null
  }
}

export function clearCache(): number {
  try {
    const keys = Object.keys(localStorage)
    let removed = 0
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
        removed++
      }
    })
    console.log(`🗑️ Cache limpo: ${removed} item(ns) removido(s)`)
    return removed
  } catch (error) {
    console.warn('⚠️ Erro ao limpar cache:', error)
    return 0
  }
}

export function getCacheInfo(): { count: number; size: number } {
  let count = 0
  let size = 0

  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        count++
        const item = localStorage.getItem(key)
        if (item) {
          size += item.length
        }
      }
    })
  } catch (error) {
    console.warn('⚠️ Erro ao obter info do cache:', error)
  }

  return { count, size }
}

/**
 * Pré-carrega períodos comuns em background
 */
export function prefetchCommonPeriods(collection: string): void {
  const hoje = new Date()
  const periodos = [
    { dias: 7, nome: '7 dias' },
    { dias: 30, nome: '30 dias' },
    { dias: 90, nome: '90 dias' }
  ]

  periodos.forEach(({ dias, nome }) => {
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - dias)
    
    const dtIni = inicio.toISOString().split('T')[0]
    const dtFin = hoje.toISOString().split('T')[0]
    const key = getCacheKey(collection, dtIni, dtFin)
    
    // Verificar se já está em cache
    if (!getFromCache(key)) {
      console.log(`🔄 Pré-carregando ${nome} em background...`)
      // Aqui você pode disparar uma requisição em background
      // Por enquanto apenas logamos
    }
  })
}

/**
 * Limpa caches antigos automaticamente
 */
export function cleanOldCache(): void {
  try {
    const keys = Object.keys(localStorage)
    let removed = 0
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached)
            const age = Date.now() - entry.timestamp
            
            if (age > CACHE_DURATION) {
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
    })
    
    if (removed > 0) {
      console.log(`🗑️ ${removed} cache(s) antigo(s) removido(s)`)
    }
  } catch (error) {
    console.warn('⚠️ Erro ao limpar cache antigo:', error)
  }
}

/**
 * Retorna todas as chaves de cache
 */
export function getAllCacheKeys(): string[] {
  try {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(CACHE_PREFIX))
      .map(key => key.replace(CACHE_PREFIX, ''))
  } catch (error) {
    console.warn('⚠️ Erro ao obter chaves do cache:', error)
    return []
  }
}

/**
 * Remove um item específico do cache
 */
export function removeFromCache(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
    console.log(`🗑️ Cache removido: ${key}`)
  } catch (error) {
    console.warn('⚠️ Erro ao remover cache:', error)
  }
}
