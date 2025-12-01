import { useState, useEffect, useMemo, memo } from 'react'
import { useNF } from '../contexts/NFContext'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Calendar, TrendingUp, DollarSign, FileText, Filter, RefreshCw, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { validateDateRange } from '../utils/dateValidation'

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

type PeriodoType = '7d' | '30d' | '90d' | '12m' | 'custom'
type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

const COLORS = ['#0066CC', '#0052A3', '#00A3E0', '#00C9FF', '#7C3AED', '#EC4899']

export default function AnalyticsAPI() {
  const { notas, loading, setFiltros, setCollection } = useNF()
  const [periodo, setPeriodo] = useState<PeriodoType>('30d')
  const [collectionFiltro, setCollectionFiltro] = useState<CollectionType>('tbl_nfe_100')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erroData, setErroData] = useState<string | null>(null)

  // Aplicar filtros automaticamente quando período ou collection mudar
  useEffect(() => {
    if (periodo !== 'custom') {
      aplicarFiltros()
    }
  }, [periodo, collectionFiltro])

  const aplicarFiltros = () => {
    const hoje = new Date()
    let inicio = new Date()

    switch (periodo) {
      case '7d':
        inicio.setDate(hoje.getDate() - 7)
        break
      case '30d':
        inicio.setDate(hoje.getDate() - 30)
        break
      case '90d':
        inicio.setDate(hoje.getDate() - 90)
        break
      case '12m':
        inicio.setFullYear(hoje.getFullYear() - 1)
        break
      case 'custom':
        if (dataInicio && dataFim) {
          // Validar período máximo de 1 ano
          const validation = validateDateRange(dataInicio, dataFim, 365)
          if (!validation.valid) {
            setErroData(validation.message || 'Período inválido')
            return
          }
          
          setErroData(null)
          setFiltros({
            dataInicio,
            dataFim
          })
          return
        }
        return
    }

    const dtIni = inicio.toISOString().split('T')[0]
    const dtFin = hoje.toISOString().split('T')[0]

    setCollection(collectionFiltro)
    setFiltros({
      dataInicio: dtIni,
      dataFim: dtFin
    })
  }

  // Processar dados da API para gráficos
  const analyticsProcessado = useMemo(() => {
    if (!notas || notas.length === 0) return null

    setProcessando(true)
    const startTime = performance.now()

    const faturamentoPorDia: any = {}
    const emitentes: any = {}
    const tiposOperacao: any = {}
    const statusNotas: any = {}
    const evolucaoMensal: any = {}
    let totalValor = 0
    let maiorNota = 0
    let menorNota = Infinity

    // Processar todas as notas
    notas.forEach((nota: any) => {
      const valor = nota.valorTotal || 0
      totalValor += valor
      
      if (valor > maiorNota) maiorNota = valor
      if (valor > 0 && valor < menorNota) menorNota = valor

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
        emitentes[nomeEmitente] = { nome: nomeEmitente, valor: 0, quantidade: 0 }
      }
      emitentes[nomeEmitente].valor += valor
      emitentes[nomeEmitente].quantidade += 1

      // Tipos de operação
      const tipo = nota.tipoOperacao === '1' ? 'Saída' : nota.tipoOperacao === '0' ? 'Entrada' : 'Outros'
      if (!tiposOperacao[tipo]) {
        tiposOperacao[tipo] = { name: tipo, value: 0, quantidade: 0 }
      }
      tiposOperacao[tipo].value += valor
      tiposOperacao[tipo].quantidade += 1

      // Status
      const status = nota.protocolada === 'Sim' ? 'Protocolada' : 'Não Protocolada'
      if (!statusNotas[status]) {
        statusNotas[status] = { name: status, value: 0 }
      }
      statusNotas[status].value += 1

      // Evolução mensal
      try {
        const dataObj = new Date(nota.dataEmissao)
        if (!isNaN(dataObj.getTime())) {
          const mes = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`
          if (!evolucaoMensal[mes]) {
            evolucaoMensal[mes] = { mes, valor: 0, quantidade: 0 }
          }
          evolucaoMensal[mes].valor += valor
          evolucaoMensal[mes].quantidade += 1
        }
      } catch (e) {
        // Ignora datas inválidas
      }
    })

    const faturamentoDiario = Object.values(faturamentoPorDia)
      .sort((a: any, b: any) => a.data.localeCompare(b.data))
      .slice(-30)

    const topEmitentes = Object.values(emitentes)
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 10)

    const distribuicaoTipos = Object.values(tiposOperacao)
    const distribuicaoStatus = Object.values(statusNotas)
    const evolucao = Object.values(evolucaoMensal)
      .sort((a: any, b: any) => a.mes.localeCompare(b.mes))

    const mediaValor = totalValor / notas.length
    if (menorNota === Infinity) menorNota = 0

    const endTime = performance.now()
    console.log(`✅ Analytics API processado em ${(endTime - startTime).toFixed(2)}ms`)
    
    setProcessando(false)

    return {
      faturamentoDiario,
      topEmitentes,
      distribuicaoTipos,
      distribuicaoStatus,
      evolucao,
      stats: {
        totalNotas: notas.length,
        totalValor,
        mediaValor,
        maiorNota,
        menorNota
      }
    }
  }, [notas])

  if (loading || processando) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-revio-gray-600 text-lg font-semibold">
          {loading ? 'Carregando dados da API...' : 'Processando analytics...'}
        </p>
        <p className="mt-2 text-revio-gray-500 text-sm">
          Períodos maiores podem levar mais tempo. Aguarde...
        </p>
      </div>
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
          <h1 className="text-3xl font-bold text-revio-gray-800">Analytics API</h1>
          <p className="text-revio-gray-600 mt-1">Análise completa via API REST</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <span className="mr-2">🔌</span>
            Usando API REST
          </div>
        </div>
        <button
          onClick={aplicarFiltros}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-revio-primary" />
          <h2 className="text-lg font-bold text-revio-gray-800">Filtros</h2>
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

        {/* Mensagem de erro */}
        {erroData && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{erroData}</span>
          </div>
        )}

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
