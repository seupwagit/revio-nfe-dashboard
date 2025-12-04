import { useState, useEffect, memo } from 'react'
import { type AggregatedAnalytics } from '../services/analyticsAggregation'
import { fetchAggregatedAnalyticsOptimized } from '../services/analyticsAggregationOptimized'
import { clearCache, cleanOldCache } from '../services/analyticsCache'
import { env } from '../config/env'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Calendar, TrendingUp, DollarSign, FileText, Filter, RefreshCw, Zap } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

// Componentes de gráfico memoizados
const FaturamentoDiarioChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorValorAgg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="data" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip 
        formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      />
      <Area type="monotone" dataKey="valor" stroke="#7C3AED" fillOpacity={1} fill="url(#colorValorAgg)" />
    </AreaChart>
  </ResponsiveContainer>
))

const EvolucaoMensalChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
      <Tooltip />
      <Legend />
      <Line yAxisId="left" type="monotone" dataKey="valor" stroke="#7C3AED" strokeWidth={2} name="Valor (R$)" />
      <Line yAxisId="right" type="monotone" dataKey="quantidade" stroke="#EC4899" strokeWidth={2} name="Quantidade" />
    </LineChart>
  </ResponsiveContainer>
))

const TopEmitentesChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} layout="vertical">
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" tick={{ fontSize: 12 }} />
      <YAxis dataKey="nome" type="category" width={150} tick={{ fontSize: 10 }} />
      <Tooltip 
        formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      />
      <Bar dataKey="valor" fill="#7C3AED" />
    </BarChart>
  </ResponsiveContainer>
))

const DistribuicaoTiposChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={(entry: any) => `${entry.name}: ${entry.quantidade}`}
        outerRadius={100}
        dataKey="value"
      >
        {data.map((_: any, index: number) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
))

const StatusNotasChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#7C3AED">
        {data.map((_: any, index: number) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
))

type PeriodoType = '7d' | '30d' | '60d' | '90d' | '12m' | 'custom'
type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

const COLORS = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444']

export default function AnalyticsAPIAgregado() {
  const [periodo, setPeriodo] = useState<PeriodoType>('30d')
  const [collectionFiltro, setCollectionFiltro] = useState<CollectionType>('tbl_nfe_100')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AggregatedAnalytics | null>(null)
  const [pageSize, setPageSize] = useState(env.defaults.analyticsPageSize)
  const [tempoProcessamento, setTempoProcessamento] = useState<string>('')
  const [ultimaConsulta, setUltimaConsulta] = useState<string>('')
  const [progresso, setProgresso] = useState<number>(0)
  const [usandoCache, setUsandoCache] = useState<boolean>(false)

  // Limpar cache antigo ao montar
  useEffect(() => {
    cleanOldCache()
  }, [])

  // Aplicar filtros automaticamente (com debounce)
  useEffect(() => {
    console.log('🔔 Filtros mudaram:', { periodo, collectionFiltro, pageSize })
    if (periodo !== 'custom') {
      const timer = setTimeout(() => {
        console.log('⏰ Debounce concluído, carregando dados...')
        carregarDados()
      }, 300) // Aguarda 300ms antes de executar
      
      return () => {
        console.log('🚫 Timer cancelado (novo filtro)')
        clearTimeout(timer)
      }
    } else {
      console.log('⚠️ Período custom, aguardando aplicação manual')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, collectionFiltro, pageSize])

  const carregarDados = async () => {
    console.log('🔄 carregarDados chamado', { periodo, collectionFiltro, pageSize })
    const startTime = performance.now()

    try {
      const hoje = new Date()
      let inicio = new Date()

      switch (periodo) {
        case '7d':
          inicio.setDate(hoje.getDate() - 7)
          break
        case '30d':
          inicio.setDate(hoje.getDate() - 30)
          break
        case '60d':
          inicio.setDate(hoje.getDate() - 60)
          break
        case '90d':
          inicio.setDate(hoje.getDate() - 90)
          break
        case '12m':
          inicio.setFullYear(hoje.getFullYear() - 1)
          break
        case 'custom':
          if (!dataInicio || !dataFim) {
            console.log('⚠️ Período custom sem datas')
            return
          }
          inicio = new Date(dataInicio)
          break
      }

      const dtIni = inicio.toISOString().split('T')[0]
      const dtFin = periodo === 'custom' && dataFim ? dataFim : hoje.toISOString().split('T')[0]

      console.log('📅 Período calculado:', { dtIni, dtFin })

      // Cache simples - evita requisições duplicadas
      const chaveConsulta = `${collectionFiltro}-${dtIni}-${dtFin}-${pageSize}`
      if (chaveConsulta === ultimaConsulta && analytics) {
        console.log('💾 Usando dados em cache (memória)')
        return
      }

      console.log('🚀 Iniciando busca...')
      setLoading(true)
      setUltimaConsulta(chaveConsulta)
      setProgresso(0)
      setUsandoCache(false)

      const data = await fetchAggregatedAnalyticsOptimized(
        {
          collection: collectionFiltro,
          dtIni,
          dtFin
        },
        pageSize,
        (progress, partial) => {
          // Atualizar com dados parciais (streaming)
          setProgresso(progress)
          setAnalytics(partial)
        }
      )

      setAnalytics(data)
      setProgresso(100)
      
      // Verificar se veio do cache
      const tempoMs = performance.now() - startTime
      if (tempoMs < 100) {
        setUsandoCache(true)
      }

      const endTime = performance.now()
      setTempoProcessamento(((endTime - startTime) / 1000).toFixed(2))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    carregarDados()
  }

  if (loading) {
    // Calcular dias do período
    const hoje = new Date()
    let inicio = new Date()
    switch (periodo) {
      case '7d': inicio.setDate(hoje.getDate() - 7); break
      case '30d': inicio.setDate(hoje.getDate() - 30); break
      case '60d': inicio.setDate(hoje.getDate() - 60); break
      case '90d': inicio.setDate(hoje.getDate() - 90); break
      case '12m': inicio.setFullYear(hoje.getFullYear() - 1); break
    }
    const dias = Math.ceil((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-revio-gray-600 text-lg font-semibold">
          Agregando dados via API...
        </p>
        <p className="mt-2 text-revio-gray-500 text-sm">
          Período: {dias} dias | PageSize: {pageSize.toLocaleString()}
        </p>
        {dias > 60 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Período longo:</strong> A API pode demorar até 2 minutos para processar {dias} dias de dados.
            </p>
          </div>
        )}
        
        {/* Barra de progresso */}
        {progresso > 0 && progresso < 100 && (
          <div className="mt-4 w-64">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-purple-600 h-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-xs text-center mt-2 text-gray-600">{progresso}%</p>
          </div>
        )}

        {/* Mostrar dados parciais se disponível */}
        {analytics && progresso < 100 && (
          <div className="mt-4 text-sm text-gray-600">
            📊 {analytics.stats.totalNotas.toLocaleString()} registros processados...
          </div>
        )}

        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md">
          <p className="text-sm text-purple-800">
            ⚡ <strong>Modo Otimizado:</strong> Agregação com streaming e cache persistente
          </p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-xl font-bold text-revio-gray-800 mb-2">Sem dados para análise</h3>
        <p className="text-revio-gray-600">Selecione um período e collection para visualizar os gráficos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-revio-gray-800">Analytics API Agregado</h1>
          <p className="text-revio-gray-600 mt-1">Agregação otimizada via paginação</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              <Zap className="h-4 w-4 mr-2" />
              Agregação Paginada
            </div>
            {tempoProcessamento && (
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                ⏱️ {tempoProcessamento}s
              </div>
            )}
            {analytics && (
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                📊 {analytics.stats.totalNotas.toLocaleString()} registros
              </div>
            )}
            {usandoCache && (
              <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                💾 Cache
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={aplicarFiltros}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          <button
            onClick={() => {
              const removed = clearCache()
              setUltimaConsulta('')
              if (removed > 0) {
                alert(`✅ Cache limpo com sucesso!\n\n${removed} item(ns) removido(s) do cache.`)
              } else {
                alert('ℹ️ Cache já estava vazio.')
              }
              aplicarFiltros()
            }}
            className="btn-secondary flex items-center gap-2 text-xs"
            title="Limpar cache e recarregar"
          >
            🗑️ Limpar Cache
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-revio-primary" />
          <h2 className="text-lg font-bold text-revio-gray-800">Filtros</h2>
        </div>

        {/* Preseleções Rápidas */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
            Períodos Rápidos
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeriodo('7d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                periodo === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => setPeriodo('30d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                periodo === '30d'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setPeriodo('60d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                periodo === '60d'
                  ? 'bg-pink-600 text-white'
                  : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
              }`}
            >
              60 dias
            </button>
            <button
              onClick={() => setPeriodo('90d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                periodo === '90d'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              90 dias ⚠️
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
              Período
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoType)}
              className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="60d">Últimos 60 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="12m">Último ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              value={collectionFiltro}
              onChange={(e) => setCollectionFiltro(e.target.value as CollectionType)}
              className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary"
            >
              <option value="tbl_nfe_100">NF-e</option>
              <option value="tbl_cfe_100">CF-e</option>
              <option value="tbl_cte_100">CT-e</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
              Tamanho da Página
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary"
            >
              <option value="1000">1.000 registros</option>
              <option value="5000">5.000 registros</option>
              <option value="10000">10.000 registros</option>
              <option value="20000">20.000 registros</option>
            </select>
          </div>

          {periodo === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary"
                />
              </div>
            </>
          )}
        </div>

        {periodo === 'custom' && (
          <div className="mt-4">
            <button
              onClick={aplicarFiltros}
              disabled={!dataInicio || !dataFim || loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Filter className="h-4 w-4" />
              Aplicar Filtros
            </button>
          </div>
        )}

        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-sm text-purple-800 mb-2">
            ⚡ <strong>Otimizações Ativas:</strong>
          </p>
          <ul className="text-xs text-purple-700 space-y-1 ml-4">
            <li>• Agregação durante paginação ({pageSize.toLocaleString()} registros/página)</li>
            <li>• Cache persistente (60 minutos)</li>
            <li>• Streaming de resultados parciais</li>
            <li>• Divisão automática em chunks para períodos longos</li>
          </ul>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Total</span>
          </div>
          <div className="text-3xl font-bold">{analytics.stats.totalNotas.toLocaleString()}</div>
          <div className="text-sm opacity-80 mt-1">Documentos</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Faturamento</span>
          </div>
          <div className="text-3xl font-bold">
            {analytics.stats.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm opacity-80 mt-1">Total</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Ticket Médio</span>
          </div>
          <div className="text-3xl font-bold">
            {analytics.stats.mediaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm opacity-80 mt-1">Por documento</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Maior Nota</span>
          </div>
          <div className="text-3xl font-bold">
            {analytics.stats.maiorNota.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm opacity-80 mt-1">Valor máximo</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Faturamento Diário</h3>
          <FaturamentoDiarioChart data={analytics.faturamentoDiario} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Evolução Mensal</h3>
          <EvolucaoMensalChart data={analytics.evolucao} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Top 10 Emitentes por Valor</h3>
          <TopEmitentesChart data={analytics.topEmitentes} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Distribuição por Tipo de Operação</h3>
          <DistribuicaoTiposChart data={analytics.distribuicaoTipos} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Status das Notas</h3>
        <StatusNotasChart data={analytics.distribuicaoStatus} />
      </div>
    </div>
  )
}
