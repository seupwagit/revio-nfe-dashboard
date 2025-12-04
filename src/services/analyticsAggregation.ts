import axios from 'axios'
import { env } from '../config/env'

const api = axios.create({
  baseURL: env.api.baseUrl,
  headers: {
    'Authorization': `Bearer ${env.api.bearerToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

export interface AggregatedAnalytics {
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

interface FiltrosAgregacao {
  collection: string
  dtIni: string
  dtFin: string
  cnpjEmit?: string
  cnpjDest?: string
}

/**
 * Busca dados paginados da API e agrega localmente
 * Mais eficiente que trazer todos os dados de uma vez
 */
export async function fetchAggregatedAnalytics(
  filtros: FiltrosAgregacao,
  pageSize: number = 10000
): Promise<AggregatedAnalytics> {
  console.log('📊 Iniciando agregação paginada via API')
  console.log('Filtros:', filtros)
  console.log('Page Size:', pageSize)

  const startTime = performance.now()
  
  // Otimização: usar pageSize menor para primeira página (mais rápido)
  const firstPageSize = Math.min(pageSize, 1000)

  // Estruturas para agregação
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
  let pageSizeAtual = firstPageSize

  // Paginar e agregar
  while (hasMorePages) {
    try {
      // Usar pageSize menor na primeira página para resposta mais rápida
      pageSizeAtual = currentPage === 1 ? firstPageSize : pageSize
      console.log(`📄 Buscando página ${currentPage} (${pageSizeAtual} registros)...`)

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

      // Mapear resposta da API (mesmo formato que api.ts)
      let items = response.data?.lista || response.data?.data || response.data?.items || response.data?.result || response.data?.notas || response.data
      
      if (!Array.isArray(items) && typeof response.data === 'object') {
        const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]))
        if (arrayKey) {
          items = response.data[arrayKey]
        }
      }

      const notas = Array.isArray(items) ? items : []

      console.log(`✅ Página ${currentPage}: ${notas.length} registros`)

      if (notas.length === 0) {
        hasMorePages = false
        break
      }

      // Se retornou menos que o pageSize atual, não há mais páginas
      if (notas.length < pageSizeAtual) {
        hasMorePages = false
      }

      // Agregar dados desta página
      notas.forEach((nota: any) => {
        // Usar campos da API Revio
        const valor = parseFloat(nota.VL_DOC || nota.valorTotal || 0)
        totalValor += valor
        totalNotas++

        // Maior e menor nota
        if (valor > maiorNota) maiorNota = valor
        if (valor > 0 && valor < menorNota) menorNota = valor

        // Faturamento por dia
        const dataEmissao = nota.DT_DOC || nota.dataEmissao || ''
        const data = dataEmissao.split('T')[0] || 'Sem data'
        const diaData = faturamentoPorDia.get(data) || { valor: 0, quantidade: 0 }
        diaData.valor += valor
        diaData.quantidade += 1
        faturamentoPorDia.set(data, diaData)

        // Emitentes
        const nomeEmitente = nota.EMIT_XNOME || nota.emitente?.razaoSocial || 'Sem nome'
        const emitenteData = emitentes.get(nomeEmitente) || { valor: 0, quantidade: 0 }
        emitenteData.valor += valor
        emitenteData.quantidade += 1
        emitentes.set(nomeEmitente, emitenteData)

        // Tipos de operação
        const indOper = nota.IND_OPER || nota.tipoOperacao || ''
        const tipo = indOper === '1' ? 'Saída' : indOper === '0' ? 'Entrada' : 'Outros'
        const tipoData = tiposOperacao.get(tipo) || { valor: 0, quantidade: 0 }
        tipoData.valor += valor
        tipoData.quantidade += 1
        tiposOperacao.set(tipo, tipoData)

        // Status
        const protocolada = nota.PROTOCOLADA || nota.protocolada || ''
        const status = protocolada === 'Sim' ? 'Protocolada' : 'Não Protocolada'
        statusNotas.set(status, (statusNotas.get(status) || 0) + 1)

        // Evolução mensal
        try {
          const dataObj = new Date(dataEmissao)
          if (!isNaN(dataObj.getTime())) {
            const mes = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`
            const mesData = evolucaoMensal.get(mes) || { valor: 0, quantidade: 0 }
            mesData.valor += valor
            mesData.quantidade += 1
            evolucaoMensal.set(mes, mesData)
          }
        } catch (e) {
          // Ignora datas inválidas
        }
      })

      // Próxima página
      currentPage++

      // Log de progresso
      console.log(`📊 Total acumulado: ${totalNotas} notas, R$ ${totalValor.toLocaleString('pt-BR')}`)

    } catch (error: any) {
      console.error(`❌ Erro na página ${currentPage}:`, error.message)
      hasMorePages = false
    }
  }

  // Processar resultados finais
  const faturamentoDiario = Array.from(faturamentoPorDia.entries())
    .map(([data, values]) => ({ data, ...values }))
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-30) // Últimos 30 dias

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

  const endTime = performance.now()
  const tempoTotal = ((endTime - startTime) / 1000).toFixed(2)

  console.log('✅ Agregação concluída!')
  console.log(`⏱️  Tempo total: ${tempoTotal}s`)
  console.log(`📊 Total de notas: ${totalNotas}`)
  console.log(`💰 Valor total: R$ ${totalValor.toLocaleString('pt-BR')}`)
  console.log(`📄 Páginas processadas: ${currentPage - 1}`)

  return {
    stats: {
      totalNotas,
      totalValor,
      mediaValor,
      maiorNota,
      menorNota
    },
    faturamentoDiario,
    topEmitentes,
    distribuicaoTipos,
    distribuicaoStatus,
    evolucao
  }
}
