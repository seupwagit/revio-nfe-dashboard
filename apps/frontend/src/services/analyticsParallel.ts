/**
 * ⚡ Analytics com Paralelização e Feedback Visual
 * Busca chunks em paralelo com callbacks de progresso detalhados
 */

import { env } from '../config/env'
import { getCacheKey, getFromCache, saveToCache } from './analyticsCache'
import { validarECorrigirCache, type CacheInconsistency } from './cacheValidator'
import { create } from './httpClient'

const api = create({
  baseURL: env.api.baseUrl,
  headers: {
    'Authorization': `Bearer ${env.api.bearerToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 90000
})

export interface AnalyticsData {
  stats: {
    totalNotas: number
    totalValor: number
    mediaValor: number
    maiorNota: number
    menorNota: number
  }
  faturamentoDiario: Array<{ data: string; valor: number; quantidade: number }>
  topEmitentes: Array<{ nome: string; valor: number; quantidade: number }>
  distribuicaoTipos: Array<{ name: string; value: number; quantidade: number }>
  distribuicaoStatus: Array<{ name: string; value: number }>
  evolucao: Array<{ mes: string; valor: number; quantidade: number }>
}

export interface ProgressInfo {
  etapa: 'preparando' | 'validando' | 'buscando' | 'processando' | 'concluido'
  progresso: number
  chunksTotal: number
  chunksProcessados: number
  registrosAcumulados: number
  tempoDecorrido: number
  velocidade: number
  estimativaRestante: number
  usandoCache: boolean
  dadosParciais?: AnalyticsData
  cacheInconsistencias?: CacheInconsistency[]
}

interface Filtros {
  collection: string
  dtIni: string
  dtFin: string
  cnpjEmit?: string
  cnpjDest?: string
}

function createChunks(dtIni: string, dtFin: string, chunkDays: number = 30) {
  const dtIniDate = new Date(dtIni)
  const dtFinDate = new Date(dtFin)
  const chunks: Array<{ dtIni: string; dtFin: string }> = []
  
  let currentStart = new Date(dtIniDate)
  
  while (currentStart <= dtFinDate) {
    const currentEnd = new Date(currentStart)
    currentEnd.setDate(currentEnd.getDate() + chunkDays - 1)
    
    if (currentEnd > dtFinDate) {
      currentEnd.setTime(dtFinDate.getTime())
    }
    
    chunks.push({
      dtIni: currentStart.toISOString().split('T')[0],
      dtFin: currentEnd.toISOString().split('T')[0]
    })
    
    currentStart = new Date(currentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
    
    // Parar apenas quando passar da data final
    if (currentStart > dtFinDate) break
    
    // Proteção contra loop infinito (máximo 50 chunks = ~4 anos)
    if (chunks.length >= 50) {
      console.warn('⚠️ Limite de 50 chunks atingido. Período muito longo!')
      break
    }
  }
  
  console.log(`📦 Criados ${chunks.length} chunks de ${chunkDays} dias para período ${dtIni} até ${dtFin}`)
  return chunks
}

async function fetchChunk(filtros: Filtros, pageSize: number): Promise<AnalyticsData | null> {
  const chunkKey = getCacheKey(filtros.collection, filtros.dtIni, filtros.dtFin)
  const cached = getFromCache(chunkKey)
  
  if (cached) {
    return cached as AnalyticsData
  }
  
  try {
    const faturamentoPorDia = new Map<string, { valor: number; quantidade: number }>()
    const emitentes = new Map<string, { valor: number; quantidade: number }>()
    const tiposOperacao = new Map<string, { valor: number; quantidade: number }>()
    const statusNotas = new Map<string, number>()
    const evolucaoMensal = new Map<string, { valor: number; quantidade: number }>()

    let totalValor = 0
    let totalNotas = 0
    let maiorNota = 0
    let menorNota = Infinity
    let currentPage = 1
    let hasMorePages = true

    // Limite de 100 páginas por chunk (com pageSize 10000 = até 1M registros por chunk)
    while (hasMorePages && currentPage <= 100) {
      const response = await api.get('/WebView/Consultar', {
        params: {
          host: '10.0.0.8',
          database: 'C67624577000145',
          collection: filtros.collection,
          dtIni: filtros.dtIni,
          dtFin: filtros.dtFin,
          cnpjEmit: filtros.cnpjEmit,
          cnpjDest: filtros.cnpjDest,
          pg: currentPage,
          size: pageSize
        }
      })

      let items = response.data?.lista || response.data?.data || response.data?.items || response.data
      if (!Array.isArray(items) && typeof response.data === 'object') {
        const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]))
        if (arrayKey) items = response.data[arrayKey]
      }

      const notas = Array.isArray(items) ? items : []
      
      if (notas.length === 0) break

      for (const nota of notas) {
        const valor = parseFloat(nota.VL_DOC || nota.valorTotal || 0)
        totalValor += valor
        totalNotas++
        maiorNota = Math.max(maiorNota, valor)
        menorNota = Math.min(menorNota, valor)

        const dataEmissao = nota.DT_DOC || nota.dataEmissao || ''
        if (!dataEmissao) continue
        
        const data = dataEmissao.substring(0, 10)
        
        let diaData = faturamentoPorDia.get(data)
        if (!diaData) {
          diaData = { valor: 0, quantidade: 0 }
          faturamentoPorDia.set(data, diaData)
        }
        diaData.valor += valor
        diaData.quantidade++

        const nomeEmitente = nota.NOME_EMIT || nota.EMIT_XNOME || 'Sem nome'
        let emitenteData = emitentes.get(nomeEmitente)
        if (!emitenteData) {
          emitenteData = { valor: 0, quantidade: 0 }
          emitentes.set(nomeEmitente, emitenteData)
        }
        emitenteData.valor += valor
        emitenteData.quantidade++

        const indOper = nota.IND_OPER || ''
        const tipo = indOper === '1' ? 'Saída' : indOper === '0' ? 'Entrada' : 'Outros'
        let tipoData = tiposOperacao.get(tipo)
        if (!tipoData) {
          tipoData = { valor: 0, quantidade: 0 }
          tiposOperacao.set(tipo, tipoData)
        }
        tipoData.valor += valor
        tipoData.quantidade++

        const status = (nota.PROTOCOLADA || '') === 'Sim' ? 'Protocolada' : 'Não Protocolada'
        statusNotas.set(status, (statusNotas.get(status) || 0) + 1)

        if (data.length >= 7) {
          const mes = data.substring(0, 7)
          let mesData = evolucaoMensal.get(mes)
          if (!mesData) {
            mesData = { valor: 0, quantidade: 0 }
            evolucaoMensal.set(mes, mesData)
          }
          mesData.valor += valor
          mesData.quantidade++
        }
      }

      if (notas.length < pageSize) hasMorePages = false
      currentPage++
    }

    console.log(`📊 Chunk ${filtros.dtIni} até ${filtros.dtFin}: ${totalNotas} registros em ${currentPage - 1} páginas`)

    const result: AnalyticsData = {
      stats: {
        totalNotas,
        totalValor,
        mediaValor: totalNotas > 0 ? totalValor / totalNotas : 0,
        maiorNota,
        menorNota: menorNota === Infinity ? 0 : menorNota
      },
      faturamentoDiario: Array.from(faturamentoPorDia.entries())
        .map(([data, values]) => ({ data, ...values }))
        .sort((a, b) => a.data.localeCompare(b.data)),
      topEmitentes: Array.from(emitentes.entries())
        .map(([nome, values]) => ({ nome, ...values }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10),
      distribuicaoTipos: Array.from(tiposOperacao.entries())
        .map(([name, values]) => ({ name, value: values.valor, quantidade: values.quantidade })),
      distribuicaoStatus: Array.from(statusNotas.entries())
        .map(([name, value]) => ({ name, value })),
      evolucao: Array.from(evolucaoMensal.entries())
        .map(([mes, values]) => ({ mes, ...values }))
        .sort((a, b) => a.mes.localeCompare(b.mes))
    }

    saveToCache(chunkKey, result as any)
    return result
  } catch (error) {
    console.error('Erro no chunk:', error)
    return null
  }
}

function mergeAnalytics(results: AnalyticsData[]): AnalyticsData {
  if (results.length === 0) {
    return {
      stats: { totalNotas: 0, totalValor: 0, mediaValor: 0, maiorNota: 0, menorNota: 0 },
      faturamentoDiario: [],
      topEmitentes: [],
      distribuicaoTipos: [],
      distribuicaoStatus: [],
      evolucao: []
    }
  }
  
  if (results.length === 1) return results[0]
  
  let totalNotas = 0
  let totalValor = 0
  let maiorNota = 0
  let menorNota = Infinity
  
  const faturamentoPorDia = new Map<string, { valor: number; quantidade: number }>()
  const emitentes = new Map<string, { valor: number; quantidade: number }>()
  const tiposOperacao = new Map<string, { valor: number; quantidade: number }>()
  const statusNotas = new Map<string, number>()
  const evolucaoMensal = new Map<string, { valor: number; quantidade: number }>()
  
  results.forEach(result => {
    totalNotas += result.stats.totalNotas
    totalValor += result.stats.totalValor
    maiorNota = Math.max(maiorNota, result.stats.maiorNota)
    if (result.stats.menorNota > 0) {
      menorNota = Math.min(menorNota, result.stats.menorNota)
    }
    
    result.faturamentoDiario.forEach(item => {
      const existing = faturamentoPorDia.get(item.data) || { valor: 0, quantidade: 0 }
      existing.valor += item.valor
      existing.quantidade += item.quantidade
      faturamentoPorDia.set(item.data, existing)
    })
    
    result.topEmitentes.forEach(item => {
      const existing = emitentes.get(item.nome) || { valor: 0, quantidade: 0 }
      existing.valor += item.valor
      existing.quantidade += item.quantidade
      emitentes.set(item.nome, existing)
    })
    
    result.distribuicaoTipos.forEach(item => {
      const existing = tiposOperacao.get(item.name) || { valor: 0, quantidade: 0 }
      existing.valor += item.value
      existing.quantidade += item.quantidade
      tiposOperacao.set(item.name, existing)
    })
    
    result.distribuicaoStatus.forEach(item => {
      statusNotas.set(item.name, (statusNotas.get(item.name) || 0) + item.value)
    })
    
    result.evolucao.forEach(item => {
      const existing = evolucaoMensal.get(item.mes) || { valor: 0, quantidade: 0 }
      existing.valor += item.valor
      existing.quantidade += item.quantidade
      evolucaoMensal.set(item.mes, existing)
    })
  })
  
  return {
    stats: {
      totalNotas,
      totalValor,
      mediaValor: totalNotas > 0 ? totalValor / totalNotas : 0,
      maiorNota,
      menorNota: menorNota === Infinity ? 0 : menorNota
    },
    faturamentoDiario: Array.from(faturamentoPorDia.entries())
      .map(([data, values]) => ({ data, ...values }))
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-30),
    topEmitentes: Array.from(emitentes.entries())
      .map(([nome, values]) => ({ nome, ...values }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10),
    distribuicaoTipos: Array.from(tiposOperacao.entries())
      .map(([name, values]) => ({ name, value: values.valor, quantidade: values.quantidade })),
    distribuicaoStatus: Array.from(statusNotas.entries())
      .map(([name, value]) => ({ name, value })),
    evolucao: Array.from(evolucaoMensal.entries())
      .map(([mes, values]) => ({ mes, ...values }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
  }
}

export async function fetchAnalyticsParallel(
  filtros: Filtros,
  pageSize: number = 10000,
  onProgress?: (info: ProgressInfo) => void
): Promise<AnalyticsData> {
  const startTime = performance.now()
  
  // 🔍 VALIDAR CACHE AUTOMATICAMENTE
  onProgress?.({
    etapa: 'validando',
    progresso: 0,
    chunksTotal: 0,
    chunksProcessados: 0,
    registrosAcumulados: 0,
    tempoDecorrido: 0,
    velocidade: 0,
    estimativaRestante: 0,
    usandoCache: false
  })
  
  const validacao = validarECorrigirCache()
  
  if (validacao.temProblemas) {
    console.warn('⚠️ Cache corrompido detectado e limpo automaticamente!')
    onProgress?.({
      etapa: 'validando',
      progresso: 5,
      chunksTotal: 0,
      chunksProcessados: 0,
      registrosAcumulados: 0,
      tempoDecorrido: (performance.now() - startTime) / 1000,
      velocidade: 0,
      estimativaRestante: 0,
      usandoCache: false,
      cacheInconsistencias: validacao.inconsistencias
    })
    
    // Aguardar 2 segundos para usuário ver a mensagem
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Verificar cache final
  const cacheKey = getCacheKey(filtros.collection, filtros.dtIni, filtros.dtFin)
  const cached = getFromCache(cacheKey)
  if (cached) {
    onProgress?.({
      etapa: 'concluido',
      progresso: 100,
      chunksTotal: 1,
      chunksProcessados: 1,
      registrosAcumulados: (cached as AnalyticsData).stats.totalNotas,
      tempoDecorrido: 0.1,
      velocidade: 0,
      estimativaRestante: 0,
      usandoCache: true
    })
    return cached as AnalyticsData
  }
  
  // Preparando
  onProgress?.({
    etapa: 'preparando',
    progresso: 5,
    chunksTotal: 0,
    chunksProcessados: 0,
    registrosAcumulados: 0,
    tempoDecorrido: (performance.now() - startTime) / 1000,
    velocidade: 0,
    estimativaRestante: 0,
    usandoCache: false
  })
  
  const dtIniDate = new Date(filtros.dtIni)
  const dtFinDate = new Date(filtros.dtFin)
  const dias = Math.ceil((dtFinDate.getTime() - dtIniDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Busca direta se período curto
  if (dias <= 30) {
    onProgress?.({
      etapa: 'buscando',
      progresso: 50,
      chunksTotal: 1,
      chunksProcessados: 0,
      registrosAcumulados: 0,
      tempoDecorrido: (performance.now() - startTime) / 1000,
      velocidade: 0,
      estimativaRestante: 0,
      usandoCache: false
    })
    
    const result = await fetchChunk(filtros, pageSize)
    if (!result) throw new Error('Falha ao buscar dados')
    
    saveToCache(cacheKey, result as any)
    
    onProgress?.({
      etapa: 'concluido',
      progresso: 100,
      chunksTotal: 1,
      chunksProcessados: 1,
      registrosAcumulados: result.stats.totalNotas,
      tempoDecorrido: (performance.now() - startTime) / 1000,
      velocidade: result.stats.totalNotas / ((performance.now() - startTime) / 1000),
      estimativaRestante: 0,
      usandoCache: false
    })
    
    return result
  }
  
  // Dividir em chunks
  const chunks = createChunks(filtros.dtIni, filtros.dtFin, 30)
  
  onProgress?.({
    etapa: 'buscando',
    progresso: 10,
    chunksTotal: chunks.length,
    chunksProcessados: 0,
    registrosAcumulados: 0,
    tempoDecorrido: (performance.now() - startTime) / 1000,
    velocidade: 0,
    estimativaRestante: 0,
    usandoCache: false
  })
  
  // Buscar chunks em paralelo com rastreamento correto
  let chunksCompletados = 0
  const resultados: (AnalyticsData | null)[] = new Array(chunks.length).fill(null)
  
  console.log(`\n🚀 INICIANDO BUSCA PARALELA`)
  console.log(`📅 Período total: ${filtros.dtIni} até ${filtros.dtFin}`)
  console.log(`📦 Total de chunks: ${chunks.length}`)
  console.log(`📊 Chunks criados:`)
  chunks.forEach((chunk, i) => {
    const dias = Math.ceil((new Date(chunk.dtFin).getTime() - new Date(chunk.dtIni).getTime()) / (1000 * 60 * 60 * 24))
    console.log(`  ${i + 1}. ${chunk.dtIni} até ${chunk.dtFin} (${dias} dias)`)
  })
  console.log('')
  
  const chunkPromises = chunks.map(async (chunk, index) => {
    try {
      console.log(`📦 Buscando chunk ${index + 1}/${chunks.length}: ${chunk.dtIni} até ${chunk.dtFin}`)
      
      const result = await fetchChunk(
        { ...filtros, dtIni: chunk.dtIni, dtFin: chunk.dtFin },
        pageSize
      )
      
      if (result) {
        console.log(`✅ Chunk ${index + 1} completo: ${result.stats.totalNotas} registros, R$ ${result.stats.totalValor.toLocaleString('pt-BR')}`)
      } else {
        console.warn(`⚠️ Chunk ${index + 1} retornou null`)
      }
      
      // Incrementar contador de forma segura
      chunksCompletados++
      resultados[index] = result
      
      // Calcular progresso: 10% inicial + 85% para chunks + 5% para merge
      const progresso = 10 + Math.round((chunksCompletados / chunks.length) * 85)
      const tempoDecorrido = (performance.now() - startTime) / 1000
      
      // Calcular registros acumulados de todos os resultados até agora
      const registrosAcumulados = resultados
        .filter(r => r !== null)
        .reduce((sum, r) => sum + (r?.stats.totalNotas || 0), 0)
      
      console.log(`📊 Progresso: ${chunksCompletados}/${chunks.length} chunks, ${registrosAcumulados.toLocaleString()} registros acumulados`)
      
      onProgress?.({
        etapa: 'buscando',
        progresso,
        chunksTotal: chunks.length,
        chunksProcessados: chunksCompletados,
        registrosAcumulados,
        tempoDecorrido,
        velocidade: registrosAcumulados / tempoDecorrido,
        estimativaRestante: (tempoDecorrido / chunksCompletados) * (chunks.length - chunksCompletados),
        usandoCache: false
      })
      
      return result
    } catch (error) {
      console.error(`❌ Erro no chunk ${index + 1}:`, error)
      chunksCompletados++
      resultados[index] = null
      return null
    }
  })
  
  await Promise.all(chunkPromises)
  const validResults = resultados.filter(r => r !== null) as AnalyticsData[]
  
  console.log(`\n🔀 Mesclando ${validResults.length} chunks válidos de ${chunks.length} totais`)
  validResults.forEach((result, i) => {
    console.log(`  Chunk ${i + 1}: ${result.stats.totalNotas} registros, R$ ${result.stats.totalValor.toLocaleString('pt-BR')}`)
  })
  
  // Processando (mesclando resultados)
  const registrosTotal = validResults.reduce((sum, r) => sum + r.stats.totalNotas, 0)
  console.log(`📊 Total antes do merge: ${registrosTotal.toLocaleString()} registros`)
  onProgress?.({
    etapa: 'processando',
    progresso: 96,
    chunksTotal: chunks.length,
    chunksProcessados: chunks.length,
    registrosAcumulados: registrosTotal,
    tempoDecorrido: (performance.now() - startTime) / 1000,
    velocidade: registrosTotal / ((performance.now() - startTime) / 1000),
    estimativaRestante: 0,
    usandoCache: false
  })
  
  const finalResult = mergeAnalytics(validResults)
  
  console.log(`✅ Resultado final após merge: ${finalResult.stats.totalNotas.toLocaleString()} registros, R$ ${finalResult.stats.totalValor.toLocaleString('pt-BR')}`)
  console.log(`📈 Faturamento diário: ${finalResult.faturamentoDiario.length} dias`)
  console.log(`🏢 Top emitentes: ${finalResult.topEmitentes.length} empresas`)
  console.log(`📊 Evolução mensal: ${finalResult.evolucao.length} meses`)
  
  // Salvando no cache
  onProgress?.({
    etapa: 'processando',
    progresso: 98,
    chunksTotal: chunks.length,
    chunksProcessados: chunks.length,
    registrosAcumulados: finalResult.stats.totalNotas,
    tempoDecorrido: (performance.now() - startTime) / 1000,
    velocidade: finalResult.stats.totalNotas / ((performance.now() - startTime) / 1000),
    estimativaRestante: 0,
    usandoCache: false
  })
  
  saveToCache(cacheKey, finalResult as any)
  
  // Concluído (só chega a 100% aqui!)
  const tempoTotal = (performance.now() - startTime) / 1000
  onProgress?.({
    etapa: 'concluido',
    progresso: 100,
    chunksTotal: chunks.length,
    chunksProcessados: chunks.length,
    registrosAcumulados: finalResult.stats.totalNotas,
    tempoDecorrido: tempoTotal,
    velocidade: finalResult.stats.totalNotas / tempoTotal,
    estimativaRestante: 0,
    usandoCache: false,
    dadosParciais: finalResult
  })
  
  return finalResult
}
