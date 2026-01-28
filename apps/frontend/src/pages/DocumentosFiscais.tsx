import { Building2, Calendar, FileText, Filter, Receipt, Truck, X } from 'lucide-react'
import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import StreamingProgress from '../components/StreamingProgress'
import { useNF } from '../contexts/NFContext'
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

  function getDefaultStartDate(): string {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)  // Último ano, não último mês
    return date.toISOString().split('T')[0]
  }

  function getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0]
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
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const fim = new Date()
                    const inicio = new Date()
                    inicio.setDate(inicio.getDate() - 7)
                    setDataInicio(inicio.toISOString().split('T')[0])
                    setDataFim(fim.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  7 dias
                </button>
                <button
                  onClick={() => {
                    const fim = new Date()
                    const inicio = new Date()
                    inicio.setDate(inicio.getDate() - 15)
                    setDataInicio(inicio.toISOString().split('T')[0])
                    setDataFim(fim.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  15 dias
                </button>
                <button
                  onClick={() => {
                    const fim = new Date()
                    const inicio = new Date()
                    inicio.setDate(inicio.getDate() - 30)
                    setDataInicio(inicio.toISOString().split('T')[0])
                    setDataFim(fim.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  30 dias
                </button>
                <button
                  onClick={() => {
                    const fim = new Date()
                    const inicio = new Date()
                    inicio.setDate(inicio.getDate() - 60)
                    setDataInicio(inicio.toISOString().split('T')[0])
                    setDataFim(fim.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-pink-100 text-pink-700 hover:bg-pink-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  60 dias
                </button>
                <button
                  onClick={() => {
                    const fim = new Date()
                    const inicio = new Date()
                    inicio.setDate(inicio.getDate() - 90)
                    setDataInicio(inicio.toISOString().split('T')[0])
                    setDataFim(fim.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  90 dias
                </button>
                <button
                  onClick={() => {
                    const fim = new Date()
                    const inicio = new Date()
                    inicio.setFullYear(inicio.getFullYear() - 1)
                    setDataInicio(inicio.toISOString().split('T')[0])
                    setDataFim(fim.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Último ano
                </button>
              </div>
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

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Use os filtros de data para consultar períodos específicos. 
                Os filtros de CNPJ são opcionais e podem ser usados para buscar documentos de empresas específicas.
              </p>
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
