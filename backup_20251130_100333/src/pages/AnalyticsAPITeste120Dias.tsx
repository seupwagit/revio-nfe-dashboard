// 🧪 VERSÃO DE TESTE - 120 DIAS SEM CACHE
// Esta é uma versão experimental para testar performance com 120 dias
// Acumula dados em memória sem usar cache do streamingCache

import { useState, useEffect, useMemo, memo } from 'react'
import axios from 'axios'
import { env } from '../config/env'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Calendar, TrendingUp, DollarSign, FileText, Filter, RefreshCw, Zap } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

// Componentes de gráfico memoizados (mesmos do Analytics API)
const FaturamentoDiarioChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorValorTeste" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="data" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip 
        formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      />
      <Area type="monotone" dataKey="valor" stroke="#F59E0B" fillOpacity={1} fill="url(#colorValorTeste)" />
    </AreaChart>
  </ResponsiveContainer>
))

const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#7C3AED', '#EC4899']

type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

export default function AnalyticsAPITeste120Dias() {
  const [collectionFiltro, setCollectionFiltro] = useState<CollectionType>('tbl_nfe_100')
  const [loading, setLoading] = useState(false)
  const [notas, setNotas] = useState<any[]>([])
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, registros: 0 })
  const [tempoInicio, setTempoInicio] = useState<number>(0)
  const [tempoDecorrido, setTempoDecorrido] = useState<string>('')

  // Configuração do axios
  const api = axios.create({
    baseURL: env.api.baseUrl,
    headers: {
      'Authorization': `Bearer ${env.api.bearerToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  })

  const carregarDados120Dias = async () => {
    console.log('🧪 TESTE 120 DIAS - Iniciando...')
    const inicio = performance.now()
    setTempoInicio(inicio)
    setLoading(true)
    setNotas([])
    setProgresso({ atual: 0, total: 0, registros: 0 })

    try {
      // Calcular período de 120 dias
      const hoje = new Date()
      const dataInicio = new Date()
      dataInicio.setDate(hoje.getDate() - 120)

      const dtIni = dataInicio.toISOString().split('T')[0]
      const dtFin = hoje.toISOString().split('T')[0]

      console.log('📅 Período:', { dtIni, dtFin })

      // Acumulador em memória
      let todosRegistros: any[] = []
      let paginaAtual = 1
      let temMaisPaginas = true
      const pageSize = 10000 // Otimizado

      while (temMaisPaginas) {
        console.log(`📄 Buscando página ${paginaAtual}...`)

        const params = {
          host: env.database.host,
          collection: collectionFiltro,
          database: env.database.database,
          pg: paginaAtual,
          size: pageSize,
          dtIni,
          dtFin,
        }

        const response = await api.get('/WebView/Consultar', { params })
        const registrosPagina = mapApiResponse(response.data)

        console.log(`✅ Página ${paginaAtual}: ${registrosPagina.length} registros`)

        // Acumular em memória
        todosRegistros = [...todosRegistros, ...registrosPagina]

        // Atualizar progresso
        setProgresso({
          atual: paginaAtual,
          total: paginaAtual, // Não sabemos o total ainda
          registros: todosRegistros.length
        })

        // Atualizar estado parcial para mostrar progresso
        setNotas([...todosRegistros])

        // Atualizar tempo decorrido
        const tempoAtual = ((performance.now() - inicio) / 1000).toFixed(1)
        setTempoDecorrido(tempoAtual)

        // Verificar se tem mais páginas
        temMaisPaginas = registrosPagina.length >= pageSize
        paginaAtual++

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const fim = performance.now()
      const tempoTotal = ((fim - inicio) / 1000).toFixed(2)

      console.log('🎉 TESTE 120 DIAS - Concluído!')
      console.log(`📊 Total de registros: ${todosRegistros.length}`)
      console.log(`⏱️ Tempo total: ${tempoTotal}s`)
      console.log(`📄 Total de páginas: ${paginaAtual - 1}`)
      console.log(`⚡ Média: ${(todosRegistros.length / parseFloat(tempoTotal)).toFixed(0)} registros/segundo`)

      setNotas(todosRegistros)
      setTempoDecorrido(tempoTotal)
      setProgresso({
        atual: paginaAtual - 1,
        total: paginaAtual - 1,
        registros: todosRegistros.length
      })

    } catch (error: any) {
      console.error('❌ Erro no teste:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Mapear resposta da API
  const mapApiResponse = (data: any): any[] => {
    let items = data?.lista || data?.data || data?.items || data?.result || data?.notas || data
    
    if (!Array.isArray(items) && typeof data === 'object') {
      const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]))
      if (arrayKey) items = data[arrayKey]
    }
    
    if (!Array.isArray(items)) return []
    
    return items.map((item: any, index: number) => ({
      id: item._id || item.id || `temp-${index}`,
      numero: item.NUMERO || item.numero || '',
      dataEmissao: item.DT_DOC || item.dataEmissao || '',
      valorTotal: parseFloat(item.VL_DOC || item.valorTotal || 0),
      tipoOperacao: item.IND_OPER || item.tipoOperacao || '',
      protocolada: item.PROTOCOLADA || '',
      emitente: {
        razaoSocial: item.NOME_EMIT || item.razaoSocialEmit || '',
      },
    }))
  }

  // Processar analytics
  const analyticsProcessado = useMemo(() => {
    if (!notas || notas.length === 0) return null

    const faturamentoPorDia: any = {}
    const emitentes: any = {}
    const tiposOperacao: any = {}
    let totalValor = 0
    let maiorNota = 0

    notas.forEach((nota: any) => {
      const valor = nota.valorTotal || 0
      totalValor += valor
      if (valor > maiorNota) maiorNota = valor

      // Faturamento por dia
      const data = nota.dataEmissao?.split('T')[0] || 'Sem data'
      if (!faturamentoPorDia[data]) {
        faturamentoPorDia[data] = { data, valor: 0, quantidade: 0 }
      }
      faturamentoPorDia[data].valor += valor
      faturamentoPorDia[data].quantidade += 1

      // Emitentes
      const nomeEmitente = nota.emitente?.razaoSocial || 'Sem nome'
      if (!emitentes[nomeEmitente]) {
        emitentes[nomeEmitente] = { nome: nomeEmitente, valor: 0 }
      }
      emitentes[nomeEmitente].valor += valor

      // Tipos
      const tipo = nota.tipoOperacao === '1' ? 'Saída' : nota.tipoOperacao === '0' ? 'Entrada' : 'Outros'
      if (!tiposOperacao[tipo]) {
        tiposOperacao[tipo] = { name: tipo, value: 0, quantidade: 0 }
      }
      tiposOperacao[tipo].value += valor
      tiposOperacao[tipo].quantidade += 1
    })

    const faturamentoDiario = Object.values(faturamentoPorDia)
      .sort((a: any, b: any) => a.data.localeCompare(b.data))
      .slice(-30)

    const topEmitentes = Object.values(emitentes)
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 10)

    const distribuicaoTipos = Object.values(tiposOperacao)
    const mediaValor = totalValor / notas.length

    return {
      faturamentoDiario,
      topEmitentes,
      distribuicaoTipos,
      stats: {
        totalNotas: notas.length,
        totalValor,
        mediaValor,
        maiorNota
      }
    }
  }, [notas])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-orange-600 text-lg font-semibold">
          🧪 TESTE 120 DIAS - Acumulando em memória...
        </p>
        <p className="mt-2 text-gray-600 text-sm">
          SEM CACHE - Apenas acumulação em memória
        </p>
        
        {progresso.registros > 0 && (
          <div className="mt-4 bg-orange-50 border-2 border-orange-300 rounded-lg p-4 max-w-md">
            <p className="text-sm text-orange-800 font-semibold mb-2">
              📊 Progresso:
            </p>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• Página atual: {progresso.atual}</li>
              <li>• Registros acumulados: {progresso.registros.toLocaleString()}</li>
              <li>• Tempo decorrido: {tempoDecorrido}s</li>
              <li>• Velocidade: {tempoDecorrido ? Math.round(progresso.registros / parseFloat(tempoDecorrido)) : 0} reg/s</li>
            </ul>
          </div>
        )}

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Teste Experimental:</strong> Esta versão NÃO usa cache do streamingCache.
            Acumula tudo em memória para medir performance pura.
          </p>
        </div>
      </div>
    )
  }

  if (!analyticsProcessado) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
          <span className="text-3xl">🧪</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Teste 120 Dias</h3>
        <p className="text-gray-600 mb-4">Clique no botão abaixo para iniciar o teste</p>
        <button
          onClick={carregarDados120Dias}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center gap-2 mx-auto"
        >
          <Zap className="h-5 w-5" />
          Iniciar Teste 120 Dias
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🧪 Teste 120 Dias</h1>
          <p className="text-gray-600 mt-1">Acumulação em memória SEM cache</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              <Zap className="h-4 w-4 mr-2" />
              Teste Experimental
            </div>
            {tempoDecorrido && (
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                ⏱️ {tempoDecorrido}s
              </div>
            )}
            {analyticsProcessado && (
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                📊 {analyticsProcessado.stats.totalNotas.toLocaleString()} registros
              </div>
            )}
            <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              🚫 SEM CACHE
            </div>
          </div>
        </div>
        <button
          onClick={carregarDados120Dias}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refazer Teste
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Total</span>
          </div>
          <div className="text-3xl font-bold">{analyticsProcessado.stats.totalNotas.toLocaleString()}</div>
          <div className="text-sm opacity-80 mt-1">Documentos (120 dias)</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Faturamento</span>
          </div>
          <div className="text-3xl font-bold">
            {analyticsProcessado.stats.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm opacity-80 mt-1">Total</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Ticket Médio</span>
          </div>
          <div className="text-3xl font-bold">
            {analyticsProcessado.stats.mediaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm opacity-80 mt-1">Por documento</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Maior Nota</span>
          </div>
          <div className="text-3xl font-bold">
            {analyticsProcessado.stats.maiorNota.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm opacity-80 mt-1">Valor máximo</div>
        </div>
      </div>

      {/* Métricas do Teste */}
      <div className="card p-6 bg-orange-50 border-2 border-orange-300">
        <h3 className="text-lg font-bold text-orange-900 mb-4">📊 Métricas do Teste</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-orange-700 font-semibold">Tempo Total</p>
            <p className="text-2xl font-bold text-orange-900">{tempoDecorrido}s</p>
          </div>
          <div>
            <p className="text-orange-700 font-semibold">Páginas</p>
            <p className="text-2xl font-bold text-orange-900">{progresso.total}</p>
          </div>
          <div>
            <p className="text-orange-700 font-semibold">Registros</p>
            <p className="text-2xl font-bold text-orange-900">{progresso.registros.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-orange-700 font-semibold">Velocidade</p>
            <p className="text-2xl font-bold text-orange-900">
              {tempoDecorrido ? Math.round(progresso.registros / parseFloat(tempoDecorrido)) : 0} reg/s
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Faturamento Diário (últimos 30 dias)</h3>
          <FaturamentoDiarioChart data={analyticsProcessado.faturamentoDiario} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 Emitentes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsProcessado.topEmitentes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nome" type="category" width={150} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <Bar dataKey="valor" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
