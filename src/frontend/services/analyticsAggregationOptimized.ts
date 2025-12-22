import { create } from './httpClient'
import { env } from '../config/env'
import { AggregatedAnalytics } from './analyticsAggregation'
import { getCacheKey, getFromCache, saveToCache } from './analyticsCache'

const api = create({
  baseURL: env.api.baseUrl,
  headers: {
    'Authorization': `Bearer ${env.api.bearerToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 90000 // 90 segundos por requisição (API pode demorar em períodos longos)
})

interface FiltrosAgregacao {
  collection: string
  dtIni: string
  dtFin: string
  cnpjEmit?: string
  cnpjDest?: string
}

interface ProgressCallback {
  (progress: number, partial: AggregatedAnalytics): void
}

/**
 * Busca períodos longos dividindo em chunks de 30 dias
 * Cada chunk é cacheado individualmente
 */
async function fetchInChunks(
  filtros: FiltrosAgregacao,
  pageSize: number,
  onProgress?: ProgressCallback
): Promise<AggregatedAnalytics> {
  console.log('📦 Iniciando busca em chunks de 30 dias')
  console.log(`📅 Período total: ${filtros.dtIni} até ${filtros.dtFin}`)
  
  const dtIniDate = new Date(filtros.dtIni)
  const dtFinDate = new Date(filtros.dtFin)
  const CHUNK_DAYS = 30
  
  const totalDias = Math.ceil((dtFinDate.getTime() - dtIniDate.getTime()) / (1000 * 60 * 60 * 24))
  console.log(`📆 Total de dias: ${totalDias}`)
  
  // Dividir em chunks
  const chunks: Array<{ dtIni: string; dtFin: string }> = []
  let currentStart = new Date(dtIniDate)
  
  while (currentStart <= dtFinDate) {
    const currentEnd = new Date(currentStart)
    currentEnd.setDate(currentEnd.getDate() + CHUNK_DAYS - 1) // -1 para não sobrepor
    
    if (currentEnd > dtFinDate) {
      currentEnd.setTime(dtFinDate.getTime())
    }
    
    const chunkDtIni = currentStart.toISOString().split('T')[0]
    const chunkDtFin = currentEnd.toISOString().split('T')[0]
    
    chunks.push({
      dtIni: chunkDtIni,
      dtFin: chunkDtFin
    })
    
    console.log(`📦 Chunk ${chunks.length}: ${chunkDtIni} até ${chunkDtFin}`)
    
    // Próximo chunk começa no dia seguinte ao fim deste
    currentStart = new Date(currentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
    
    // Evitar loop infinito
    if (chunks.length > 20) {
      console.error('⚠️ Limite de 20 chunks atingido, abortando')
      break
    }
    
    // Se o próximo chunk começaria depois do fim, parar
    if (currentStart > dtFinDate) {
      break
    }
  }
  
  console.log(`📊 Dividido em ${chunks.length} chunks de ~30 dias`)
  
  // Agregar resultados de todos os chunks
  const allResults: AggregatedAnalytics[] = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`\n🔄 Processando chunk ${i + 1}/${chunks.length}: ${chunk.dtIni} até ${chunk.dtFin}`)
    
    try {
      // Buscar chunk (vai usar cache se disponível)
      const chunkResult = await fetchAggregatedAnalyticsOptimized(
        { ...filtros, dtIni: chunk.dtIni, dtFin: chunk.dtFin },
        pageSize,
        undefined // Não passar callback para evitar updates parciais confusos
      )
      
      if (!chunkResult || chunkResult.stats.totalNotas === 0) {
        console.warn(`⚠️ Chunk ${i + 1} retornou 0 notas (possível timeout ou sem dados)`)
        // Não adicionar chunks vazios aos resultados
      } else {
        console.log(`✅ Chunk ${i + 1}: ${chunkResult.stats.totalNotas} notas, R$ ${chunkResult.stats.totalValor.toLocaleString('pt-BR')}`)
        allResults.push(chunkResult)
      }
      
      // Callback de progresso
      if (onProgress) {
        const progress = ((i + 1) / chunks.length) * 100
        // Mesclar resultados parciais
        const merged = mergeAnalytics(allResults)
        onProgress(progress, merged)
      }
      
    } catch (error: any) {
      console.error(`❌ Erro no chunk ${i + 1}:`, error.message)
      console.error(`   Período: ${chunk.dtIni} até ${chunk.dtFin}`)
      // Continua com próximo chunk mesmo com erro
    }
  }
  
  // Mesclar todos os resultados
  console.log(`\n🔀 Mesclando ${allResults.length} de ${chunks.length} chunks...`)
  
  const chunksFalhados = chunks.length - allResults.length
  if (chunksFalhados > 0) {
    console.warn(`⚠️ ${chunksFalhados} chunk(s) falharam ou retornaram 0 notas (timeout da API)`)
  }
  
  // Log de cada chunk antes de mesclar
  allResults.forEach((result, i) => {
    console.log(`  Chunk ${i + 1}: ${result.stats.totalNotas} notas, R$ ${result.stats.totalValor.toLocaleString('pt-BR')}`)
  })
  
  const finalResult = mergeAnalytics(allResults)
  
  // Salvar resultado final no cache
  const cacheKey = getCacheKey(filtros.collection, filtros.dtIni, filtros.dtFin)
  saveToCache(cacheKey, finalResult)
  
  console.log(`✅ Total final: ${finalResult.stats.totalNotas} notas, R$ ${finalResult.stats.totalValor.toLocaleString('pt-BR')}`)
  console.log(`📊 Chunks bem-sucedidos: ${allResults.length}/${chunks.length}`)
  
  if (chunksFalhados > 0) {
    console.warn(`⚠️ ATENÇÃO: Dados incompletos! ${chunksFalhados} período(s) não puderam ser carregados devido a timeout da API Revio.`)
  }
  
  return finalResult
}

/**
 * Mescla múltiplos resultados de analytics
 */
function mergeAnalytics(results: AggregatedAnalytics[]): AggregatedAnalytics {
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
  
  if (results.length === 1) {
    return results[0]
  }
  
  // Mesclar stats
  let totalNotas = 0
  let totalValor = 0
  let maiorNota = 0
  let menorNota = Infinity
  
  const faturamentoPorDia = new Map<string, { valor: number; quantidade: number }>()
  const emitentes = new Map<string, { valor: number; quantidade: number }>()
  const tiposOperacao = new Map<string, { valor: number; quantidade: number }>()
  const statusNotas = new Map<string, number>()
  const evolucaoMensal = new Map<string, { valor: number; quantidade: number }>()
  
  // Agregar todos os resultados
  results.forEach(result => {
    totalNotas += result.stats.totalNotas
    totalValor += result.stats.totalValor
    maiorNota = Math.max(maiorNota, result.stats.maiorNota)
    if (result.stats.menorNota > 0) {
      menorNota = Math.min(menorNota, result.stats.menorNota)
    }
    
    // Faturamento diário
    result.faturamentoDiario.forEach(item => {
      const existing = faturamentoPorDia.get(item.data) || { valor: 0, quantidade: 0 }
      existing.valor += item.valor
      existing.quantidade += item.quantidade
      faturamentoPorDia.set(item.data, existing)
    })
    
    // Emitentes
    result.topEmitentes.forEach(item => {
      const existing = emitentes.get(item.nome) || { valor: 0, quantidade: 0 }
      existing.valor += item.valor
      existing.quantidade += item.quantidade
      emitentes.set(item.nome, existing)
    })
    
    // Tipos
    result.distribuicaoTipos.forEach(item => {
      const existing = tiposOperacao.get(item.name) || { valor: 0, quantidade: 0 }
      existing.valor += item.value
      existing.quantidade += item.quantidade
      tiposOperacao.set(item.name, existing)
    })
    
    // Status
    result.distribuicaoStatus.forEach(item => {
      statusNotas.set(item.name, (statusNotas.get(item.name) || 0) + item.value)
    })
    
    // Evolução
    result.evolucao.forEach(item => {
      const existing = evolucaoMensal.get(item.mes) || { valor: 0, quantidade: 0 }
      existing.valor += item.valor
      existing.quantidade += item.quantidade
      evolucaoMensal.set(item.mes, existing)
    })
  })
  
  // Converter Maps para arrays
  const faturamentoDiario = Array.from(faturamentoPorDia.entries())
    .map(([data, values]) => ({ data, ...values }))
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-30)
  
  const topEmitentes = Array.from(emitentes.entries())
    .map(([nome, values]) => ({ nome, ...values }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
  
  const distribuicaoTipos = Array.from(tiposOperacao.entries())
    .map(([name, values]) => ({ name, value: values.valor, quantidade: values.quantidade }))
  
  const distribuicaoStatus = Array.from(statusNotas.entries())
    .map(([name, value]) => ({ name, value }))
  
  const evolucao = Array.from(evolucaoMensal.entries())
    .map(([mes, values]) => ({ mes, ...values }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
  
  const mediaValor = totalNotas > 0 ? totalValor / totalNotas : 0
  if (menorNota === Infinity) menorNota = 0
  
  return {
    stats: { totalNotas, totalValor, mediaValor, maiorNota, menorNota },
    faturamentoDiario,
    topEmitentes,
    distribuicaoTipos,
    distribuicaoStatus,
    evolucao
  }
}

/**
 * Versão otimizada com streaming e cache persistente
 * Mostra resultados parciais enquanto carrega
 */
export async function fetchAggregatedAnalyticsOptimized(
  filtros: FiltrosAgregacao,
  pageSize: number = 10000,
  onProgress?: ProgressCallback
): Promise<AggregatedAnalytics> {
  console.log('⚡ Iniciando agregação OTIMIZADA')
  console.log('📅 Período:', filtros.dtIni, 'até', filtros.dtFin)
  console.log('📦 PageSize:', pageSize)
  
  // Calcular dias do período
  const dtIniDate = new Date(filtros.dtIni)
  const dtFinDate = new Date(filtros.dtFin)
  const dias = Math.ceil((dtFinDate.getTime() - dtIniDate.getTime()) / (1000 * 60 * 60 * 24))
  console.log(`📆 Período de ${dias} dias`)
  
  const startTime = performance.now()
  const MAX_EXECUTION_TIME = 120000 // 120 segundos máximo (2 minutos)
  
  // Verificar cache persistente primeiro (pageSize não afeta resultado)
  const cacheKey = getCacheKey(filtros.collection, filtros.dtIni, filtros.dtFin)
  const cached = getFromCache(cacheKey)
  if (cached) {
    console.log('💾 Retornando dados do cache (instantâneo!)')
    return cached
  }
  
  // Se período > 45 dias, dividir em chunks de 30 dias
  if (dias > 45) {
    console.warn(`⚠️ Período longo (${dias} dias) - Dividindo em chunks de 30 dias`)
    return await fetchInChunks(filtros, pageSize, onProgress)
  }

  // Usar Maps para agregação (muito mais rápido que objetos)
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
  
  // Usar pageSize configurado desde a primeira página
  // Para períodos longos, páginas maiores são MUITO mais eficientes
  const firstPageSize = pageSize
  console.log(`📦 Usando pageSize: ${pageSize} registros por página`)
  
  // Contador para callback de progresso (não chamar a cada página)
  let paginasProcessadas = 0
  const PROGRESS_INTERVAL = 2 // Atualizar progresso a cada 2 páginas
  
  // Proteção contra loops infinitos e períodos muito longos
  const MAX_PAGES = 100 // Máximo de 100 páginas
  const MAX_RECORDS = 100000 // Máximo de 100k registros
  let pageSizeAtual = firstPageSize

  // Função para criar resultado parcial (OTIMIZADA)
  const createPartialResult = (): AggregatedAnalytics => {
    // Faturamento diário (últimos 30 dias) - otimizado
    const faturamentoDiario: any[] = []
    const sortedDates = Array.from(faturamentoPorDia.keys()).sort()
    const startIdx = Math.max(0, sortedDates.length - 30)
    for (let i = startIdx; i < sortedDates.length; i++) {
      const data = sortedDates[i]
      const values = faturamentoPorDia.get(data)!
      faturamentoDiario.push({ data, ...values })
    }

    // Top 10 emitentes - otimizado com heap parcial
    const topEmitentes: any[] = []
    for (const [nome, values] of emitentes.entries()) {
      topEmitentes.push({ nome, ...values })
      if (topEmitentes.length > 10) {
        // Manter apenas top 10 (mais eficiente que ordenar tudo)
        topEmitentes.sort((a, b) => b.valor - a.valor)
        topEmitentes.length = 10
      }
    }
    topEmitentes.sort((a, b) => b.valor - a.valor)

    // Distribuição de tipos (direto do Map)
    const distribuicaoTipos: any[] = []
    for (const [name, values] of tiposOperacao.entries()) {
      distribuicaoTipos.push({ name, value: values.valor, quantidade: values.quantidade })
    }

    // Status (direto do Map)
    const distribuicaoStatus: any[] = []
    for (const [name, value] of statusNotas.entries()) {
      distribuicaoStatus.push({ name, value })
    }

    // Evolução mensal (ordenado)
    const evolucao: any[] = []
    const sortedMonths = Array.from(evolucaoMensal.keys()).sort()
    for (const mes of sortedMonths) {
      const values = evolucaoMensal.get(mes)!
      evolucao.push({ mes, ...values })
    }

    const mediaValor = totalNotas > 0 ? totalValor / totalNotas : 0

    return {
      stats: {
        totalNotas,
        totalValor,
        mediaValor,
        maiorNota,
        menorNota: menorNota === Infinity ? 0 : menorNota
      },
      faturamentoDiario,
      topEmitentes,
      distribuicaoTipos,
      distribuicaoStatus,
      evolucao
    }
  }

  // Processar páginas
  while (hasMorePages) {
    // Proteção contra loops infinitos
    if (currentPage > MAX_PAGES) {
      console.warn(`⚠️ Limite de ${MAX_PAGES} páginas atingido, finalizando`)
      break
    }
    
    if (totalNotas >= MAX_RECORDS) {
      console.warn(`⚠️ Limite de ${MAX_RECORDS} registros atingido, finalizando`)
      break
    }
    
    // Proteção contra timeout
    const elapsed = performance.now() - startTime
    if (elapsed > MAX_EXECUTION_TIME) {
      console.warn(`⚠️ Timeout de ${MAX_EXECUTION_TIME/1000}s atingido, finalizando`)
      break
    }
    
    try {
      pageSizeAtual = currentPage === 1 ? firstPageSize : pageSize
      
      console.log(`🔄 Buscando página ${currentPage} (size: ${pageSizeAtual})...`)
      const requestStart = performance.now()
      
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
          size: pageSizeAtual
        }
      })
      
      const requestTime = ((performance.now() - requestStart) / 1000).toFixed(2)
      console.log(`✅ Resposta recebida em ${requestTime}s`)

      // Mapear resposta
      let items = response.data?.lista || response.data?.data || response.data?.items || response.data?.result || response.data?.notas || response.data
      
      if (!Array.isArray(items) && typeof response.data === 'object') {
        const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]))
        if (arrayKey) {
          items = response.data[arrayKey]
        }
      }

      const notas = Array.isArray(items) ? items : []

      console.log(`📄 Página ${currentPage}: ${notas.length} registros`)

      if (notas.length === 0) {
        console.log('✅ Nenhum registro retornado - fim da paginação')
        hasMorePages = false
        break
      }
      
      // Se retornou menos que o esperado, é a última página
      if (notas.length < pageSizeAtual) {
        console.log(`✅ Última página detectada (${notas.length} < ${pageSizeAtual})`)
      }

      // Agregar dados (SUPER OTIMIZADO)
      // Pré-alocar objetos para evitar criação repetida
      const batch = notas.length
      for (let i = 0; i < batch; i++) {
        const nota = notas[i]
        
        // Valor (conversão única)
        const valor = parseFloat(nota.VL_DOC || nota.valorTotal || 0)
        
        totalValor += valor
        totalNotas++

        // Min/Max (sem if aninhado)
        maiorNota = Math.max(maiorNota, valor)
        menorNota = Math.min(menorNota, valor)

        // Data (processar uma vez só)
        const dataEmissao = nota.DT_DOC || nota.dataEmissao || ''
        if (!dataEmissao) continue
        
        // Extrair data sem split (mais rápido)
        const data = dataEmissao.substring(0, 10)
        
        // Faturamento por dia (operação direta no Map)
        let diaData = faturamentoPorDia.get(data)
        if (!diaData) {
          diaData = { valor: 0, quantidade: 0 }
          faturamentoPorDia.set(data, diaData)
        }
        diaData.valor += valor
        diaData.quantidade++

        // Emitentes (operação direta)
        const nomeEmitente = nota.NOME_EMIT || nota.EMIT_XNOME || 'Sem nome'
        let emitenteData = emitentes.get(nomeEmitente)
        if (!emitenteData) {
          emitenteData = { valor: 0, quantidade: 0 }
          emitentes.set(nomeEmitente, emitenteData)
        }
        emitenteData.valor += valor
        emitenteData.quantidade++

        // Tipos de operação (lookup direto)
        const indOper = nota.IND_OPER || ''
        const tipo = indOper === '1' ? 'Saída' : indOper === '0' ? 'Entrada' : 'Outros'
        let tipoData = tiposOperacao.get(tipo)
        if (!tipoData) {
          tipoData = { valor: 0, quantidade: 0 }
          tiposOperacao.set(tipo, tipoData)
        }
        tipoData.valor += valor
        tipoData.quantidade++

        // Status (operação direta)
        const status = (nota.PROTOCOLADA || '') === 'Sim' ? 'Protocolada' : 'Não Protocolada'
        statusNotas.set(status, (statusNotas.get(status) || 0) + 1)

        // Evolução mensal (otimizado - sem try/catch)
        // Extrair ano-mês diretamente da string (YYYY-MM-DD)
        if (data.length >= 7) {
          const mes = data.substring(0, 7) // YYYY-MM
          let mesData = evolucaoMensal.get(mes)
          if (!mesData) {
            mesData = { valor: 0, quantidade: 0 }
            evolucaoMensal.set(mes, mesData)
          }
          mesData.valor += valor
          mesData.quantidade++
        }
      }

      // Callback de progresso (otimizado - não chamar toda hora)
      paginasProcessadas++
      if (onProgress && (paginasProcessadas % PROGRESS_INTERVAL === 0 || notas.length < pageSizeAtual)) {
        const partial = createPartialResult()
        const progress = notas.length < pageSizeAtual ? 100 : Math.min(95, currentPage * 15)
        onProgress(progress, partial)
      }

      // Verificar se há mais páginas
      if (notas.length < pageSizeAtual) {
        console.log(`✅ Fim da paginação (${notas.length} < ${pageSizeAtual})`)
        hasMorePages = false
      } else {
        console.log(`➡️  Continuando... (Total acumulado: ${totalNotas} notas)`)
      }

      currentPage++
      
      // Log de progresso a cada 5 páginas
      if (currentPage % 5 === 0) {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1)
        console.log(`📊 Progresso: ${currentPage} páginas, ${totalNotas} notas, ${elapsed}s`)
      }

    } catch (error: any) {
      console.error(`❌ Erro na página ${currentPage}:`, error.message)
      
      // Se for timeout ou erro de rede, para mas retorna o que tem
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        console.warn('⚠️ Timeout na requisição, retornando dados parciais')
      } else if (error.response?.status === 404) {
        console.log('✅ Fim dos registros (404)')
      } else {
        console.error('❌ Erro inesperado:', error)
      }
      
      hasMorePages = false
      break // Sai do loop imediatamente
    }
  }

  const result = createPartialResult()
  
  const endTime = performance.now()
  const tempoTotal = ((endTime - startTime) / 1000).toFixed(2)
  const notasPorSegundo = (totalNotas / parseFloat(tempoTotal)).toFixed(0)

  console.log('✅ Agregação OTIMIZADA concluída!')
  console.log(`⏱️  Tempo: ${tempoTotal}s`)
  console.log(`📊 Total de Notas: ${totalNotas.toLocaleString()}`)
  console.log(`💰 Valor Total: R$ ${totalValor.toLocaleString('pt-BR')}`)
  console.log(`⚡ Performance: ${notasPorSegundo} notas/segundo`)
  console.log(`📄 Páginas processadas: ${paginasProcessadas}`)
  console.log(`📋 Período: ${filtros.dtIni} até ${filtros.dtFin}`)

  // Salvar no cache persistente
  saveToCache(cacheKey, result)

  return result
}
