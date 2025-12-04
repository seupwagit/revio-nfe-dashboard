import { useState } from 'react'
import { useNF } from '../contexts/NFContext'
import { Search, Filter, RefreshCw, FileText } from 'lucide-react'
import NotaCard from '../components/NotaCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ContadorRegistros from '../components/ContadorRegistros'


export default function NotasFiscais() {
  const { notas, loading, filtros, totalRegistros, setFiltros, recarregar } = useNF()
  const [busca, setBusca] = useState(filtros.busca || '')
  const [statusFiltro, setStatusFiltro] = useState(filtros.status || '')

  const aplicarFiltros = () => {
    setFiltros({
      ...filtros,
      busca: busca || undefined,
      status: statusFiltro || undefined
    })
  }

  const limparFiltros = () => {
    setBusca('')
    setStatusFiltro('')
    setFiltros({})
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-revio-primary to-revio-secondary bg-clip-text text-transparent">
            Notas Fiscais
          </h2>
          <p className="text-revio-gray-600 mt-2 font-medium">
            Visualização em cards com filtros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ContadorRegistros 
            total={totalRegistros} 
            exibindo={notas.length}
            loading={loading}
          />
          <button
            onClick={recarregar}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-lg">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-revio-gray-900">Filtros de Busca</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-revio-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Número, emitente..."
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-revio-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="input-field"
            >
              <option value="">Todos</option>
              <option value="autorizada">Autorizada</option>
              <option value="cancelada">Cancelada</option>
              <option value="denegada">Denegada</option>
              <option value="processando">Processando</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={aplicarFiltros}
              className="btn-primary flex-1"
            >
              Aplicar
            </button>
            <button
              onClick={limparFiltros}
              className="btn-secondary"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Notas */}
      {loading ? (
        <LoadingSpinner />
      ) : notas.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-revio-light rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-10 w-10 text-revio-primary" />
          </div>
          <h3 className="text-lg font-bold text-revio-gray-900 mb-2">Nenhuma nota encontrada</h3>
          <p className="text-revio-gray-600">Tente ajustar os filtros ou realizar uma nova busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notas.map((nota) => (
            <NotaCard key={nota.id} nota={nota} />
          ))}
        </div>
      )}
    </div>
  )
}
