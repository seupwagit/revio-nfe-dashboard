import { Building2, Calendar, FileText, Filter, Info, Receipt, Truck, X } from 'lucide-react'
import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import PeriodPresets from '../components/PeriodPresets'
import StreamingProgress from '../components/StreamingProgress'
import { getDefaultEndDate, getDefaultStartDate, useNF } from '../contexts/NFContext'
import GridCFeSimples from './GridCFeSimples'
import GridCTeSimples from './GridCTeSimples'
import GridNFeSimples from './GridNFeSimples'

type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

export default function DocumentosFiscais() {
  const { setFiltros, filtros, loading, progress, currentPage, totalPages, notas, collection, setCollection } = useNF()
  const [collectionAtiva, setCollectionAtiva] = useState<CollectionType>(collection)
  const [mostrarFiltros, setMostrarFiltros] = useState(true)
  
  // Estados dos filtros
  const [dataInicio, setDataInicio] = useState(filtros.dataInicio || getDefaultStartDate())
  const [dataFim, setDataFim] = useState(filtros.dataFim || getDefaultEndDate())
  const [cnpjEmit, setCnpjEmit] = useState(filtros.cnpjEmit || '')
  const [cnpjDest, setCnpjDest] = useState(filtros.cnpjDest || '')

  const collections = [
    {
      id: 'tbl_nfe_100' as CollectionType,
      nome: 'NF-e',
      descricao: 'Notas Fiscais Eletrônicas',
      icon: FileText,
      cor: 'from-blue-500 to-blue-600'
    },
    {
      id: 'tbl_cfe_100' as CollectionType,
      nome: 'CF-e',
      descricao: 'Cupons Fiscais Eletrônicos',
      icon: Receipt,
      cor: 'from-green-500 to-green-600'
    },
    {
      id: 'tbl_cte_100' as CollectionType,
      nome: 'CT-e',
      descricao: 'Conhecimentos de Transporte',
      icon: Truck,
      cor: 'from-purple-500 to-purple-600'
    }
  ]

  const handleCollectionChange = (newCollection: CollectionType) => {
    console.log('🔄 Mudando collection de', collectionAtiva, 'para', newCollection)
    setCollectionAtiva(newCollection)
    setCollection(newCollection)
  }

  const handleAplicarFiltros = () => {
    setFiltros({
      dataInicio,
      dataFim,
      cnpjEmit: cnpjEmit.replace(/\D/g, ''),
      cnpjDest: cnpjDest.replace(/\D/g, '')
    })
  }

  const handleLimparFiltros = () => {
    const inicio = getDefaultStartDate()
    const fim = getDefaultEndDate()
    setDataInicio(inicio)
    setDataFim(fim)
    setCnpjEmit('')
    setCnpjDest('')
    setFiltros({
      dataInicio: inicio,
      dataFim: fim,
      cnpjEmit: '',
      cnpjDest: ''
    })
  }


  return (
    <div className="space-y-6">
      {/* Seletor de Collections */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-revio-gray-800 mb-4">Tipo de Documento Fiscal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collections.map((col) => {
            const Icon = col.icon
            const isActive = collectionAtiva === col.id
            return (
              <button
                key={col.id}
                onClick={() => handleCollectionChange(col.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-revio-primary bg-gradient-to-br from-revio-light to-white shadow-revio'
                    : 'border-revio-gray-200 hover:border-revio-primary hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${col.cor} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-revio-gray-800">{col.nome}</h3>
                    <p className="text-sm text-revio-gray-600">{col.descricao}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-revio-gray-800 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Consulta
            <div className="relative group ml-1">
              <div className="p-1 hover:bg-revio-light rounded-full cursor-help transition-colors">
                <Info className="h-4 w-4 text-revio-primary" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-revio-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="font-bold mb-1">💡 Dica de Consulta</div>
                Use os filtros de data para consultar períodos específicos. 
                Os filtros de CNPJ são opcionais e podem ser usados para buscar documentos de empresas específicas.
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-revio-gray-800 rotate-45"></div>
              </div>
            </div>
          </h2>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="text-revio-primary hover:text-revio-secondary transition-colors"
          >
            {mostrarFiltros ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          </button>
        </div>

        {mostrarFiltros && (
          <div className="space-y-4">
            {/* Preseleções Rápidas */}
            <div>
              <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                Períodos Rápidos
              </label>
              <PeriodPresets 
                currentStartDate={dataInicio}
                currentEndDate={dataFim}
                onSelectPeriod={(days) => {
                  const fim = new Date()
                  const inicio = new Date()
                  if (days === 365) {
                    inicio.setFullYear(fim.getFullYear() - 1)
                  } else {
                    inicio.setDate(fim.getDate() - days)
                  }
                  setDataInicio(inicio.toISOString().split('T')[0])
                  setDataFim(fim.toISOString().split('T')[0])
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Data Início */}
              <div>
                <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary focus:border-transparent"
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data Fim
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary focus:border-transparent"
                />
              </div>

              {/* CNPJ Emitente */}
              <div>
                <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  CNPJ Emitente
                </label>
                <input
                  type="text"
                  value={cnpjEmit}
                  onChange={(e) => setCnpjEmit(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary focus:border-transparent"
                />
              </div>

              {/* CNPJ Destinatário */}
              <div>
                <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  CNPJ Destinatário
                </label>
                <input
                  type="text"
                  value={cnpjDest}
                  onChange={(e) => setCnpjDest(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 border border-revio-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleAplicarFiltros}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    Aplicar Filtros
                  </>
                )}
              </button>
              <button
                onClick={handleLimparFiltros}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Barra de Progresso */}
      {loading && progress > 0 && progress < 100 && (
        <StreamingProgress 
          current={currentPage}
          total={totalPages}
          records={notas.length}
          isComplete={false}
        />
      )}

      {/* Grid Correspondente */}
      <div className="card p-6">
        {collectionAtiva === 'tbl_nfe_100' && <GridNFeSimples />}
        {collectionAtiva === 'tbl_cfe_100' && <GridCFeSimples />}
        {collectionAtiva === 'tbl_cte_100' && <GridCTeSimples />}
      </div>
    </div>
  )
}
