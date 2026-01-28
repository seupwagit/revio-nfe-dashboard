import { Calendar, DollarSign, FileText, Filter, RefreshCw, TrendingUp } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import { fetchAnalyticsAggregation, type AnalyticsData } from '../services/aggregation'

type PeriodoType = '7d' | '30d' | '60d' | '90d' | '12m' | 'custom'
type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

const COLORS = ['#0066CC', '#0052A3', '#00A3E0', '#00C9FF', '#7C3AED', '#EC4899']

// Componentes de gráfico memoizados
const FaturamentoDiarioChart = memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#0066CC" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#0066CC" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="data" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
      <Area type="monotone" dataKey="valor" stroke="#0066CC" fillOpacity={1} fill="url(#colorValor)" />
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
      <Tooltip formatter={(value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
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

export default function Analytics() {
  const [periodo, setPeriodo] = useState<PeriodoType>('30d')
  const [collectionFiltro, setCollectionFiltro] = useState<CollectionType>('tbl_nfe_100')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  // Carregar dados (usa API REST automaticamente via fallback)
  const carregarDados = useCallback(async () => {
    console.log('🔄 [Analytics] Iniciando carregamento de dados:', { periodo, dataInicio, dataFim, collectionFiltro })
    
    setLoading(true)
    setError(null)
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
            console.log('❌ [Analytics] Período personalizado sem datas completas:', { dataInicio, dataFim })
            setError('Selecione as datas de início e fim para o período personalizado')
            return
          }
          inicio = new Date(dataInicio)
          console.log('📅 [Analytics] Usando período personalizado:', { dataInicio, dataFim })
          break
      }

      const dtIni = inicio.toISOString().split('T')[0]
      const dtFin = periodo === 'custom' && dataFim ? dataFim : hoje.toISOString().split('T')[0]

      console.log('📊 [Analytics] Parâmetros da requisição:', {
        collection: collectionFiltro,
        dtIni,
        dtFin,
        periodo
      })

      const data = await fetchAnalyticsAggregation({
        collection: collectionFiltro,
        dtIni,
        dtFin
      })
      
      console.log('✅ [Analytics] Dados recebidos:', {
        totalNotas: data.stats?.totalNotas || 0,
        totalValor: data.stats?.totalValor || 0,
        faturamentoDiario: data.faturamentoDiario?.length || 0
      })
      
       setAnalytics(data)
      setIsFirstLoad(false)
    } catch (error) {
      console.error('❌ [Analytics] Erro ao carregar agregação:', error)
      setAnalytics(null)
      
      // Definir mensagem de erro amigável
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setError('Sessão expirada. Faça login novamente.')
        } else if (error.message.includes('500')) {
          setError('Erro interno do servidor. Tente novamente em alguns minutos.')
        } else if (error.message.includes('fetch')) {
          setError('Não foi possível conectar ao servidor. Verifique sua conexão.')
        } else {
          setError(`Erro ao carregar dados: ${error.message}`)
        }
      } else {
        setError('Erro desconhecido ao carregar dados.')
      }
    } finally {
      setLoading(false)
    }
  }, [periodo, collectionFiltro, dataInicio, dataFim])

  // Auto-carregar quando mudar filtros
  useEffect(() => {
    // Não recarregar no primeiro render (já carrega no useEffect inicial)
    if (isFirstLoad) return
    
    // Para período custom, só carrega se tiver as duas datas
    if (periodo === 'custom') {
      if (dataInicio && dataFim) {
        console.log('🔄 Carregando dados para período personalizado:', { dataInicio, dataFim })
        carregarDados()
      } else {
        console.log('⏳ Aguardando seleção de datas para período personalizado')
        setAnalytics(null) // Limpa dados enquanto aguarda
      }
    } else {
      console.log('🔄 Carregando dados para período predefinido:', periodo)
      carregarDados()
    }
  }, [periodo, collectionFiltro, dataInicio, dataFim, carregarDados, isFirstLoad])

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-revio-gray-600 text-lg font-semibold">Carregando dados...</p>
        <p className="mt-2 text-revio-gray-500 text-sm">Agregando dados via MongoDB...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        {error ? (
          <div className="inline-flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Erro ao carregar dados</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={carregarDados}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="inline-flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-revio-gray-800 mb-2">Sem dados para análise</h3>
            <p className="text-revio-gray-600">Selecione um período para visualizar os gráficos.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-revio-gray-800">Analytics & Insights</h1>
          <p className="text-revio-gray-600 mt-1">Análise completa dos seus documentos fiscais</p>
        </div>
        <button
          onClick={() => {
            console.log('🔄 Botão Atualizar clicado')
            carregarDados()
          }}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-revio-primary" />
          <h2 className="text-lg font-bold text-revio-gray-800">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Período */}
          <div>
            <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
              Período
            </label>
            <select
              value={periodo}
              onChange={(e) => {
                const novoPeriodo = e.target.value as PeriodoType
                console.log('📅 Período alterado:', novoPeriodo)
                setPeriodo(novoPeriodo)
                
                // Se selecionou personalizado, definir datas padrão (últimos 30 dias)
                if (novoPeriodo === 'custom' && (!dataInicio || !dataFim)) {
                  const hoje = new Date()
                  const trintaDiasAtras = new Date()
                  trintaDiasAtras.setDate(hoje.getDate() - 30)
                  
                  const dataInicioDefault = trintaDiasAtras.toISOString().split('T')[0]
                  const dataFimDefault = hoje.toISOString().split('T')[0]
                  
                  console.log('📅 Definindo datas padrão:', { dataInicioDefault, dataFimDefault })
                  setDataInicio(dataInicioDefault)
                  setDataFim(dataFimDefault)
                }
              }}
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

          {/* Collection */}
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

          {/* Datas personalizadas */}
          {periodo === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    console.log('📅 Data início alterada:', e.target.value)
                    setDataInicio(e.target.value)
                  }}
                  max={new Date().toISOString().split('T')[0]} // Não permitir datas futuras
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
                  onChange={(e) => {
                    console.log('📅 Data fim alterada:', e.target.value)
                    setDataFim(e.target.value)
                  }}
                  min={dataInicio || undefined} // Data fim não pode ser menor que início
                  max={new Date().toISOString().split('T')[0]} // Não permitir datas futuras
                  className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary"
                />
              </div>
            </>
          )}
        </div>

        {/* Botão Aplicar (apenas para custom) */}
        {periodo === 'custom' && (
          <div className="mt-4">
            <div className="flex gap-3 mb-3">
              <button
                onClick={carregarDados}
                disabled={!dataInicio || !dataFim || loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Filter className="h-4 w-4" />
                Aplicar Filtros
              </button>
              <button
                onClick={() => {
                  setDataInicio('')
                  setDataFim('')
                  setPeriodo('30d')
                }}
                className="btn-secondary flex items-center gap-2"
              >
                Limpar
              </button>
            </div>
            {(!dataInicio || !dataFim) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Selecione as datas de início e fim, depois clique em "Aplicar Filtros"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Total</span>
          </div>
          <div className="text-3xl font-bold">{analytics.stats.totalNotas}</div>
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

        <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
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

      {/* Status */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-revio-gray-800 mb-4">Status das Notas</h3>
        <StatusNotasChart data={analytics.distribuicaoStatus} />
      </div>

      {/* Indicador de modo otimizado */}
      <div className="card p-4 bg-green-50 border border-green-200">
        <p className="text-sm text-green-800">
          ⚡ <strong>Modo Otimizado:</strong> Usando agregações MongoDB diretas para máxima performance
        </p>
      </div>
    </div>
  )
}
