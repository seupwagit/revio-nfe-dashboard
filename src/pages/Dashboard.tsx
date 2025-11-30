import { useNF } from '../contexts/NFContext'
import { TrendingUp, FileText, CheckCircle, XCircle, DollarSign, AlertTriangle, Package, Truck, Receipt, Calendar, BarChart3, PieChart, Activity } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import CollectionSelector from '../components/CollectionSelector'
import { useMemo } from 'react'

export default function Dashboard() {
  const { stats, loading, collection, setCollection, notas } = useNF()
  
  // Calcular indicadores fiscais avançados
  const indicadoresFiscais = useMemo(() => {
    if (!notas || notas.length === 0) {
      return {
        valorTotalEntradas: 0, valorTotalSaidas: 0, saldoOperacional: 0,
        totalICMS: 0, totalIPI: 0, totalPIS: 0, totalCOFINS: 0, cargaTributaria: 0,
        ticketMedio: 0, maiorNota: 0, menorNota: 0,
        qtdEntradas: 0, qtdSaidas: 0,
        notasHoje: 0, notasUltimos7Dias: 0, notasUltimos30Dias: 0,
        taxaAutorizacao: 0, taxaCancelamento: 0, notasPendentes: 0,
        valorFrete: 0, valorDesconto: 0, valorSeguro: 0,
        pesoTotal: 0, volumeTotal: 0, qtdViagens: 0,
        qtdCupons: 0, ticketMedioCupom: 0
      }
    }
    
    const hoje = new Date()
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    let valorEntradas = 0, valorSaidas = 0, totalICMS = 0, totalIPI = 0, totalPIS = 0, totalCOFINS = 0
    let qtdEntradas = 0, qtdSaidas = 0, notasHoje = 0, notasUltimos7Dias = 0, notasUltimos30Dias = 0
    let valorFrete = 0, valorDesconto = 0, valorSeguro = 0, pesoTotal = 0, volumeTotal = 0
    let valores: number[] = []
    
    notas.forEach(nota => {
      const valor = nota.valorTotal || 0
      valores.push(valor)
      
      if (nota.tipoOperacao === '0') { valorEntradas += valor; qtdEntradas++ }
      else if (nota.tipoOperacao === '1') { valorSaidas += valor; qtdSaidas++ }
      
      if (nota.totais) {
        totalICMS += nota.totais.valorICMS || 0
        totalIPI += nota.totais.valorIPI || 0
        totalPIS += nota.totais.valorPIS || 0
        totalCOFINS += nota.totais.valorCOFINS || 0
        valorFrete += nota.totais.valorFrete || 0
        valorDesconto += nota.totais.valorDesconto || 0
        valorSeguro += nota.totais.valorSeguro || 0
      }
      
      if (nota.carga) {
        pesoTotal += nota.carga.peso || 0
        volumeTotal += nota.carga.volume || 0
      }
      
      const dataEmissao = new Date(nota.dataEmissao)
      if (dataEmissao.toDateString() === hoje.toDateString()) notasHoje++
      if (dataEmissao >= seteDiasAtras) notasUltimos7Dias++
      if (dataEmissao >= trintaDiasAtras) notasUltimos30Dias++
    })
    
    const valorTotal = stats.valorTotal || 0
    const totalNotas = stats.totalNotas || 0
    const totalImpostos = totalICMS + totalIPI + totalPIS + totalCOFINS
    
    return {
      valorTotalEntradas: valorEntradas, valorTotalSaidas: valorSaidas,
      saldoOperacional: valorSaidas - valorEntradas,
      totalICMS, totalIPI, totalPIS, totalCOFINS,
      cargaTributaria: valorTotal > 0 ? (totalImpostos / valorTotal) * 100 : 0,
      ticketMedio: totalNotas > 0 ? valorTotal / totalNotas : 0,
      maiorNota: valores.length > 0 ? Math.max(...valores) : 0,
      menorNota: valores.length > 0 ? Math.min(...valores) : 0,
      qtdEntradas, qtdSaidas, notasHoje, notasUltimos7Dias, notasUltimos30Dias,
      taxaAutorizacao: totalNotas > 0 ? (stats.notasAutorizadas / totalNotas) * 100 : 0,
      taxaCancelamento: totalNotas > 0 ? (stats.notasCanceladas / totalNotas) * 100 : 0,
      notasPendentes: totalNotas - stats.notasAutorizadas - stats.notasCanceladas,
      valorFrete, valorDesconto, valorSeguro, pesoTotal, volumeTotal,
      qtdViagens: notas.filter(n => n.rodoviario).length,
      qtdCupons: collection === 'tbl_cfe_100' ? totalNotas : 0,
      ticketMedioCupom: collection === 'tbl_cfe_100' && totalNotas > 0 ? valorTotal / totalNotas : 0
    }
  }, [notas, stats, collection])

  if (loading) return <LoadingSpinner />

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  
  const formatPercent = (value: number) => `${value.toFixed(1)}%`
  
  const getTipoDocumento = () => {
    if (collection === 'tbl_nfe_100') return 'NF-e'
    if (collection === 'tbl_cfe_100') return 'CF-e'
    if (collection === 'tbl_cte_100') return 'CT-e'
    return 'Documentos'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-revio-primary to-revio-secondary bg-clip-text text-transparent">
            Dashboard Fiscal
          </h2>
          <p className="text-revio-gray-600 mt-2 font-medium">Indicadores gerenciais e fiscais - {getTipoDocumento()}</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-revio-primary to-revio-secondary rounded-lg text-white text-sm font-semibold shadow-revio">
            <Calendar className="inline h-4 w-4 mr-2" />
            Atualizado agora
          </div>
        </div>
      </div>

      {/* Collection Selector */}
      <CollectionSelector value={collection} onChange={setCollection} />


      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total de Documentos" value={stats.totalNotas.toString()} icon={FileText} color="blue" />
        <StatsCard title="Valor Total" value={formatCurrency(stats.valorTotal)} icon={TrendingUp} color="green" />
        <StatsCard title="Autorizados" value={stats.notasAutorizadas.toString()} icon={CheckCircle} color="emerald" />
        <StatsCard title="Cancelados" value={stats.notasCanceladas.toString()} icon={XCircle} color="red" />
      </div>

      {/* Indicadores Contextualizados por Collection */}
      {collection === 'tbl_nfe_100' && (
        <>
          {/* NF-e: Indicadores Comerciais e Fiscais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Fluxo Operacional</h3>
                <Activity className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Entradas ({indicadoresFiscais.qtdEntradas})</span>
                  <span className="font-bold text-blue-600">{formatCurrency(indicadoresFiscais.valorTotalEntradas)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Saídas ({indicadoresFiscais.qtdSaidas})</span>
                  <span className="font-bold text-green-600">{formatCurrency(indicadoresFiscais.valorTotalSaidas)}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-revio-gray-700">Saldo Operacional</span>
                    <span className={`font-bold ${indicadoresFiscais.saldoOperacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(indicadoresFiscais.saldoOperacional)}
                    </span>
                  </div>
                  <p className="text-xs text-revio-gray-500 mt-1">
                    {indicadoresFiscais.saldoOperacional >= 0 ? '✓ Saldo positivo' : '⚠ Saldo negativo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Carga Tributária</h3>
                <DollarSign className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">ICMS</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.totalICMS)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">IPI</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.totalIPI)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">PIS/COFINS</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.totalPIS + indicadoresFiscais.totalCOFINS)}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-revio-gray-700">% sobre Faturamento</span>
                    <span className="font-bold text-orange-600">{formatPercent(indicadoresFiscais.cargaTributaria)}</span>
                  </div>
                  <p className="text-xs text-revio-gray-500 mt-1">
                    {indicadoresFiscais.cargaTributaria > 15 ? '⚠ Carga alta' : '✓ Carga normal'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Custos Operacionais</h3>
                <Package className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Frete</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.valorFrete)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Seguro</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.valorSeguro)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Descontos</span>
                  <span className="font-semibold text-green-600">{formatCurrency(indicadoresFiscais.valorDesconto)}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-revio-gray-700">Total Custos</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(indicadoresFiscais.valorFrete + indicadoresFiscais.valorSeguro)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {collection === 'tbl_cte_100' && (
        <>
          {/* CT-e: Indicadores de Transporte e Logística */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Volume de Transporte</h3>
                <Truck className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Viagens Realizadas</span>
                  <span className="font-bold text-blue-600">{indicadoresFiscais.qtdViagens}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Peso Total (kg)</span>
                  <span className="font-semibold text-revio-gray-800">{indicadoresFiscais.pesoTotal.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Volume Total</span>
                  <span className="font-semibold text-revio-gray-800">{indicadoresFiscais.volumeTotal.toLocaleString('pt-BR')}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-revio-gray-700">Peso Médio/Viagem</span>
                    <span className="font-bold text-purple-600">
                      {indicadoresFiscais.qtdViagens > 0 
                        ? (indicadoresFiscais.pesoTotal / indicadoresFiscais.qtdViagens).toFixed(2) 
                        : 0} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Receita de Frete</h3>
                <DollarSign className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Faturamento Total</span>
                  <span className="font-bold text-green-600">{formatCurrency(stats.valorTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Ticket Médio</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.ticketMedio)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Maior Frete</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.maiorNota)}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-revio-gray-700">Receita/Viagem</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(indicadoresFiscais.qtdViagens > 0 ? stats.valorTotal / indicadoresFiscais.qtdViagens : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Eficiência Operacional</h3>
                <BarChart3 className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Taxa Autorização</span>
                  <span className="font-bold text-green-600">{formatPercent(indicadoresFiscais.taxaAutorizacao)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Taxa Cancelamento</span>
                  <span className="font-bold text-red-600">{formatPercent(indicadoresFiscais.taxaCancelamento)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Pendentes</span>
                  <span className="font-semibold text-orange-600">{indicadoresFiscais.notasPendentes}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <p className="text-xs text-revio-gray-500">
                    {indicadoresFiscais.taxaAutorizacao > 95 ? '✓ Excelente performance' : '⚠ Revisar processos'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {collection === 'tbl_cfe_100' && (
        <>
          {/* CF-e: Indicadores de Varejo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Performance de Vendas</h3>
                <Receipt className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Cupons Emitidos</span>
                  <span className="font-bold text-blue-600">{indicadoresFiscais.qtdCupons}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Faturamento</span>
                  <span className="font-bold text-green-600">{formatCurrency(stats.valorTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Ticket Médio</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.ticketMedioCupom)}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <p className="text-xs text-revio-gray-500">
                    {indicadoresFiscais.ticketMedioCupom > 50 ? '✓ Ticket acima da média' : '💡 Oportunidade de upsell'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Análise Temporal</h3>
                <Calendar className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Vendas Hoje</span>
                  <span className="font-bold text-blue-600">{indicadoresFiscais.notasHoje}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Últimos 7 dias</span>
                  <span className="font-semibold text-revio-gray-800">{indicadoresFiscais.notasUltimos7Dias}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Últimos 30 dias</span>
                  <span className="font-semibold text-revio-gray-800">{indicadoresFiscais.notasUltimos30Dias}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-revio-gray-700">Média Diária (30d)</span>
                    <span className="font-bold text-purple-600">
                      {(indicadoresFiscais.notasUltimos30Dias / 30).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-revio-gray-800">Impostos Varejo</h3>
                <PieChart className="h-5 w-5 text-revio-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">ICMS</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.totalICMS)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">PIS/COFINS</span>
                  <span className="font-semibold text-revio-gray-800">{formatCurrency(indicadoresFiscais.totalPIS + indicadoresFiscais.totalCOFINS)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-revio-gray-600">Carga Tributária</span>
                  <span className="font-bold text-orange-600">{formatPercent(indicadoresFiscais.cargaTributaria)}</span>
                </div>
                <div className="pt-2 border-t border-revio-gray-200">
                  <p className="text-xs text-revio-gray-500">
                    Impacto: {formatCurrency((stats.valorTotal * indicadoresFiscais.cargaTributaria) / 100)} em impostos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {/* Indicadores Gerais (Todos os tipos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-lg font-bold text-revio-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-revio-primary to-revio-secondary rounded-full mr-3"></div>
            Análise de Valores
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-revio-light rounded-lg">
              <span className="text-revio-gray-700 font-medium">Ticket Médio</span>
              <span className="font-bold text-revio-primary">{formatCurrency(indicadoresFiscais.ticketMedio)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-revio-light rounded-lg">
              <span className="text-revio-gray-700 font-medium">Maior Documento</span>
              <span className="font-bold text-green-600">{formatCurrency(indicadoresFiscais.maiorNota)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-revio-light rounded-lg">
              <span className="text-revio-gray-700 font-medium">Menor Documento</span>
              <span className="font-bold text-blue-600">{formatCurrency(indicadoresFiscais.menorNota)}</span>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center">
                <span className="text-purple-700 font-medium">Amplitude de Valores</span>
                <span className="font-bold text-purple-700">
                  {formatCurrency(indicadoresFiscais.maiorNota - indicadoresFiscais.menorNota)}
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Diferença entre maior e menor documento
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-revio-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-revio-primary to-revio-secondary rounded-full mr-3"></div>
            Status e Qualidade
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-revio-light rounded-lg">
              <span className="text-revio-gray-700 font-medium">Taxa de Autorização</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-revio-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                    style={{ width: `${indicadoresFiscais.taxaAutorizacao}%` }}
                  ></div>
                </div>
                <span className="font-bold text-revio-gray-900 min-w-[3rem] text-right">
                  {formatPercent(indicadoresFiscais.taxaAutorizacao)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-revio-light rounded-lg">
              <span className="text-revio-gray-700 font-medium">Taxa de Cancelamento</span>
              <span className="font-bold text-red-600">{formatPercent(indicadoresFiscais.taxaCancelamento)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-revio-light rounded-lg">
              <span className="text-revio-gray-700 font-medium">Documentos Pendentes</span>
              <span className="font-bold text-orange-600">{indicadoresFiscais.notasPendentes}</span>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                {indicadoresFiscais.taxaAutorizacao > 95 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Excelente qualidade operacional</span>
                  </>
                ) : indicadoresFiscais.taxaAutorizacao > 85 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">Atenção: revisar processos</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-semibold text-red-700">Crítico: ação imediata necessária</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Análise Temporal */}
      <div className="card p-5">
        <h3 className="text-lg font-bold text-revio-gray-900 mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-revio-primary to-revio-secondary rounded-full mr-3"></div>
          Evolução Temporal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Hoje</span>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{indicadoresFiscais.notasHoje}</p>
            <p className="text-xs text-blue-600 mt-1">documentos emitidos</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">Últimos 7 dias</span>
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700">{indicadoresFiscais.notasUltimos7Dias}</p>
            <p className="text-xs text-purple-600 mt-1">
              média de {(indicadoresFiscais.notasUltimos7Dias / 7).toFixed(1)}/dia
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Últimos 30 dias</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700">{indicadoresFiscais.notasUltimos30Dias}</p>
            <p className="text-xs text-green-600 mt-1">
              média de {(indicadoresFiscais.notasUltimos30Dias / 30).toFixed(1)}/dia
            </p>
          </div>
        </div>
      </div>

      {/* Alertas e Recomendações */}
      <div className="card p-5 bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200">
        <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Insights e Recomendações
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-orange-700">
              <strong>💡 Carga Tributária:</strong> {formatPercent(indicadoresFiscais.cargaTributaria)} do faturamento
              {indicadoresFiscais.cargaTributaria > 15 && ' - Considere revisão de regime tributário'}
            </p>
            <p className="text-sm text-orange-700">
              <strong>📊 Performance:</strong> Taxa de autorização de {formatPercent(indicadoresFiscais.taxaAutorizacao)}
              {indicadoresFiscais.taxaAutorizacao < 95 && ' - Revisar processos de emissão'}
            </p>
          </div>
          <div className="space-y-2">
            {collection === 'tbl_nfe_100' && indicadoresFiscais.saldoOperacional < 0 && (
              <p className="text-sm text-orange-700">
                <strong>⚠️ Atenção:</strong> Saldo operacional negativo - Entradas superiores às saídas
              </p>
            )}
            {indicadoresFiscais.notasPendentes > 0 && (
              <p className="text-sm text-orange-700">
                <strong>📋 Pendências:</strong> {indicadoresFiscais.notasPendentes} documentos aguardando processamento
              </p>
            )}
            {indicadoresFiscais.taxaCancelamento > 5 && (
              <p className="text-sm text-orange-700">
                <strong>🔄 Cancelamentos:</strong> Taxa de {formatPercent(indicadoresFiscais.taxaCancelamento)} - Acima do ideal
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
