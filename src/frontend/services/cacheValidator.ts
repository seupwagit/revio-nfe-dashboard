/**
 * 🔍 Validador Inteligente de Cache
 * Detecta e corrige automaticamente inconsistências nos dados em cache
 */

import { getAllCacheKeys, getFromCache, removeFromCache } from './analyticsCache'
import type { AnalyticsData } from './analyticsParallel'

export interface CacheInconsistency {
  tipo: 'periodo_maior_menos_dados' | 'dados_zerados' | 'dados_corrompidos'
  periodoProblema: string
  periodoReferencia?: string
  registrosProblema: number
  registrosReferencia?: number
  acao: 'limpar' | 'alertar'
  mensagem: string
}

/**
 * Calcula número de dias entre duas datas
 */
function calcularDias(dtIni: string, dtFin: string): number {
  const inicio = new Date(dtIni)
  const fim = new Date(dtFin)
  return Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Extrai informações do período da chave de cache
 */
function extrairInfoPeriodo(key: string): { collection: string; dtIni: string; dtFin: string; dias: number } | null {
  // Formato: analytics_tbl_nfe_100_2024-01-01_2024-12-31
  const match = key.match(/analytics_(.+?)_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/)
  if (!match) return null
  
  const [, collection, dtIni, dtFin] = match
  const dias = calcularDias(dtIni, dtFin)
  
  return { collection, dtIni, dtFin, dias }
}

/**
 * Verifica se um período está contido em outro
 */
function periodoContido(menor: { dtIni: string; dtFin: string }, maior: { dtIni: string; dtFin: string }): boolean {
  return menor.dtIni >= maior.dtIni && menor.dtFin <= maior.dtFin
}

/**
 * Valida cache e detecta inconsistências
 */
export function validarCache(): CacheInconsistency[] {
  const inconsistencias: CacheInconsistency[] = []
  const keys = getAllCacheKeys()
  
  // Agrupar por collection
  const porCollection = new Map<string, Array<{ key: string; info: any; dados: AnalyticsData }>>()
  
  for (const key of keys) {
    const info = extrairInfoPeriodo(key)
    if (!info) continue
    
    const dados = getFromCache(key) as AnalyticsData
    if (!dados) continue
    
    if (!porCollection.has(info.collection)) {
      porCollection.set(info.collection, [])
    }
    
    porCollection.get(info.collection)!.push({ key, info, dados })
  }
  
  // Validar cada collection
  for (const [, periodos] of porCollection.entries()) {
    // Ordenar por número de dias (menor para maior)
    periodos.sort((a, b) => a.info.dias - b.info.dias)
    
    // Verificar inconsistências
    for (let i = 0; i < periodos.length; i++) {
      const periodoAtual = periodos[i]
      const registrosAtual = periodoAtual.dados.stats.totalNotas
      
      // 1. Verificar se tem dados zerados
      if (registrosAtual === 0) {
        inconsistencias.push({
          tipo: 'dados_zerados',
          periodoProblema: `${periodoAtual.info.dtIni} até ${periodoAtual.info.dtFin} (${periodoAtual.info.dias} dias)`,
          registrosProblema: 0,
          acao: 'limpar',
          mensagem: `Cache com 0 registros detectado. Será limpo automaticamente.`
        })
        removeFromCache(periodoAtual.key)
        continue
      }
      
      // 2. Verificar se período maior tem menos dados que período menor
      for (let j = 0; j < i; j++) {
        const periodoMenor = periodos[j]
        const registrosMenor = periodoMenor.dados.stats.totalNotas
        
        // Se o período menor está contido no maior
        if (periodoContido(periodoMenor.info, periodoAtual.info)) {
          // Período maior DEVE ter >= registros que o menor
          if (registrosAtual < registrosMenor) {
            inconsistencias.push({
              tipo: 'periodo_maior_menos_dados',
              periodoProblema: `${periodoAtual.info.dtIni} até ${periodoAtual.info.dtFin} (${periodoAtual.info.dias} dias)`,
              periodoReferencia: `${periodoMenor.info.dtIni} até ${periodoMenor.info.dtFin} (${periodoMenor.info.dias} dias)`,
              registrosProblema: registrosAtual,
              registrosReferencia: registrosMenor,
              acao: 'limpar',
              mensagem: `⚠️ INCONSISTÊNCIA DETECTADA!\n\nPeríodo MAIOR tem MENOS dados:\n• ${periodoAtual.info.dias} dias: ${registrosAtual.toLocaleString()} registros\n• ${periodoMenor.info.dias} dias: ${registrosMenor.toLocaleString()} registros\n\n🔧 Cache corrompido será limpo automaticamente.`
            })
            
            // LIMPAR AUTOMATICAMENTE
            console.warn(`🗑️ Removendo cache corrompido: ${periodoAtual.key}`)
            removeFromCache(periodoAtual.key)
            
            // TAMBÉM LIMPAR O CACHE FINAL (se existir)
            const cacheKeyFinal = `analytics_${periodoAtual.info.collection}_${periodoAtual.info.dtIni}_${periodoAtual.info.dtFin}`
            console.warn(`🗑️ Removendo cache final: ${cacheKeyFinal}`)
            removeFromCache(cacheKeyFinal)
            
            // Marcar para não processar mais este período
            break
          }
        }
      }
      
      // 3. Verificar dados corrompidos (valores negativos, NaN, etc)
      if (
        periodoAtual.dados.stats.totalValor < 0 ||
        isNaN(periodoAtual.dados.stats.totalValor) ||
        periodoAtual.dados.stats.mediaValor < 0 ||
        isNaN(periodoAtual.dados.stats.mediaValor)
      ) {
        inconsistencias.push({
          tipo: 'dados_corrompidos',
          periodoProblema: `${periodoAtual.info.dtIni} até ${periodoAtual.info.dtFin}`,
          registrosProblema: registrosAtual,
          acao: 'limpar',
          mensagem: `Dados corrompidos detectados (valores inválidos). Será limpo automaticamente.`
        })
        removeFromCache(periodoAtual.key)
      }
    }
  }
  
  return inconsistencias
}

/**
 * Valida cache antes de buscar dados
 * Retorna true se encontrou e corrigiu problemas
 */
export function validarECorrigirCache(): { temProblemas: boolean; inconsistencias: CacheInconsistency[] } {
  console.log('🔍 Validando integridade do cache...')
  const inconsistencias = validarCache()
  
  if (inconsistencias.length > 0) {
    console.warn(`⚠️ ${inconsistencias.length} inconsistência(s) detectada(s) e corrigida(s):`)
    inconsistencias.forEach((inc, i) => {
      console.warn(`\n${i + 1}. ${inc.tipo}:`)
      console.warn(inc.mensagem)
    })
    return { temProblemas: true, inconsistencias }
  }
  
  console.log('✅ Cache validado - sem problemas detectados')
  return { temProblemas: false, inconsistencias: [] }
}
