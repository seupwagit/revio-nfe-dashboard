import { useState, useEffect, memo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Calendar, TrendingUp, DollarSign, FileText, Filter, RefreshCw, Zap, Database } from 'lucide-react'
import CollectionSelector from '../components/CollectionSelector'
import ProgressoAnalytics from '../components/ProgressoAnalytics'
import CacheManager from '../components/CacheManager'
import { fetchAnalyticsParallel, type AnalyticsData, type ProgressInfo } from '../services/analyticsParallel'

// Componentes de gráfico memoizados
const FaturamentoDiarioChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorValorAPI" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#0066CC" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#0066CC" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="data" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip 
        formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      />
      <Area type="monotone" dataKey="valor" stroke="#0066CC" fillOpacity={1} fill="url(#colorValorAPI)" />
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
      <Line yAxisId="left" type="monotone" dataKey="valor" stroke="#0066CC" strokeWidth={2} name="Valor (R$)" />
      <Line yAxisId="right" type="monotone" dataKey="quantidade" stroke="#7C3AED" strokeWidth={2} name="Quantidade" />
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
      <Bar dataKey="valor" fill="#0066CC" />
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
      <Bar dataKey="value" fill="#0066CC">
        {data.map((_: any, index: number) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
))

type PeriodoType = '7d' | '30d' | '60d' | '90d' | '12m' | 'custom'
type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

const COLORS = ['#0066CC', '#0052A3', '#00A3E0', '#00C9FF', '#7C3AED', '#EC4899']

export default function AnalyticsAPI() {
  const [periodo, setPeriodo] = useState<PeriodoType>('30d')
  const [collectionFiltro, setCollectionFiltro] = useState<CollectionType>('tbl_nfe_100')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null)
  const [tempoTotal, setTempoTotal] = useState<string>('')
  const [mostrarCacheManager, setMostrarCacheManager] = useState(false)
  const [cacheInconsistencias, setCacheInconsistencias] = useState<any[]>([])

  // Aplicar filtros automaticamente quando período ou collection mudar
  useEffect(() => {
    if (periodo !== 'custom') {
      carregarDados()
    }
  }, [periodo, collectionFiltro])

  const carregarDados = async () => {
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
        if (!dataInicio || !dataFim) return
        inicio = new Date(dataInicio)
        break
    }

    const dtIni = inicio.toISOString().split('T')[0]
    const dtFin = periodo === 'custom' && dataFim ? dataFim : hoje.toISOString().split('T')[0]

    setLoading(true)
    setProgressInfo(null)
    setCacheInconsistencias([])

    try {
      const result = await fetchAnalyticsParallel(
        {
          collection: collectionFiltro,
          dtIni,
          dtFin
        },
        10000,
        (info) => {
          setProgressInfo(info)
          if (info.cacheInconsistencias) {
            setCacheInconsistencias(info.cacheInconsistencias)
          }
          if (info.dadosParciais) {
            setAnalytics(info.dadosParciais)
          }
        }
      )

      setAnalytics(result)
      setTempoTotal(progressInfo?.tempoDecorrido.toFixed(2) || '0')
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setProgressInfo(null), 2000) // Mantém modal por 2s após concluir
    }
  }

  const aplicarFiltros = () => {
    carregarDados()
  }

  // Dados já vêm processados do serviço paralelo
  const analyticsProcessado = analytics

  // Modal de progresso
  if (progressInfo && loading) {
    return (
      <ProgressoAnalytics
        etapa={progressInfo.etapa}
        progresso={progressInfo.progresso}
        chunksTotal={progressInfo.chunksTotal}
        chunksProcessados={progressInfo.chunksProcessados}
        registrosAcumulados={progressInfo.registrosAcumulados}
        tempoDecorrido={progressInfo.tempoDecorrido}
        velocidade={progressInfo.velocidade}
        estimativaRestante={progressInfo.estimativaRestante}
        usandoCache={progressInfo.usandoCache}
        cacheInconsistencias={cacheInconsistencias}
      />
    )
  }

  if (!analyticsProcessado) {
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
          <h1 className="text-3xl font-bold text-revio-gray-800">Analytics API ⚡ Otimizado</h1>
          <p className="text-revio-gray-600 mt-1">Análise paralela com feedback em tempo real</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-semibold">
              <Zap className="h-4 w-4 mr-2" />
              Modo Paralelo
            </div>
            {tempoTotal && (
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                ⏱️ {tempoTotal}s
              </div>
            )}
            {analyticsProcessado && (
              <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                📊 {analyticsProcessado.stats.totalNotas.toLocaleString()} registros
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarCacheManager(true)}
            className="px-4 py-2 bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 rounded-lg transition-colors font-semibold flex items-center gap-2"
            title="Gerenciar cache"
          >
            <Database className="h-4 w-4" />
            Cache
          </button>
          <button
            onClick={aplicarFiltros}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>
      
      {/* Cache Manager Modal */}
      {mostrarCacheManager && (
        <CacheManager onClose={() => setMostrarCacheManager(false)} />
      )}

      {/* Collection Selector */}
      <CollectionSelector value={collectionFiltro} onChange={(col) => setCollectionFiltro(col as CollectionType)} />

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Total</span>
          </div>
          <div className="text-3xl font-bold">{analyticsProcessado.stats.totalNotas}</div>
          <div className="text-sm opacity-80 mt-1">Documentos</div>
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

        <div className="card p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Faturamento Diário</h3>
          <FaturamentoDiarioChart data={analyticsProcessado.faturamentoDiario} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Evolução Mensal</h3>
          <EvolucaoMensalChart data={analyticsProcessado.evolucao} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Top 10 Emitentes por Valor</h3>
          <TopEmitentesChart data={analyticsProcessado.topEmitentes} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Distribuição por Tipo de Operação</h3>
          <DistribuicaoTiposChart data={analyticsProcessado.distribuicaoTipos} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Status das Notas</h3>
        <StatusNotasChart data={analyticsProcessado.distribuicaoStatus} />
      </div>
    </div>
  )
}
