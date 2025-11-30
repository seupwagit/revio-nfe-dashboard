import { useState, useEffect } from 'react'
import { useNF } from '../contexts/NFContext'
import { Calendar, Search, X, Info } from 'lucide-react'

// Funções para datas padrão (último mês)
const getDefaultStartDate = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

const getDefaultEndDate = () => {
  return new Date().toISOString().split('T')[0]
}

export default function FiltroNotas() {
  const { filtros, setFiltros } = useNF()
  
  // Inicializa com datas padrão se não houver filtros
  const [dataInicio, setDataInicio] = useState(filtros.dataInicio || getDefaultStartDate())
  const [dataFim, setDataFim] = useState(filtros.dataFim || getDefaultEndDate())
  const [cnpjEmit, setCnpjEmit] = useState(filtros.cnpjEmit || '')
  const [cnpjDest, setCnpjDest] = useState(filtros.cnpjDest || '')

  // Aplica filtros padrão ao carregar
  useEffect(() => {
    if (!filtros.dataInicio && !filtros.dataFim) {
      setFiltros({
        dataInicio: getDefaultStartDate(),
        dataFim: getDefaultEndDate()
      })
    }
  }, [])

  const aplicarFiltros = () => {
    setFiltros({
      ...filtros,
      dataInicio,
      dataFim,
      cnpjEmit: cnpjEmit || undefined,
      cnpjDest: cnpjDest || undefined
    })
  }

  const limparFiltros = () => {
    const defaultStart = getDefaultStartDate()
    const defaultEnd = getDefaultEndDate()
    
    setDataInicio(defaultStart)
    setDataFim(defaultEnd)
    setCnpjEmit('')
    setCnpjDest('')
    
    setFiltros({
      dataInicio: defaultStart,
      dataFim: defaultEnd
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Filtros
        </h3>
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          <Info className="w-3 h-3" />
          <span>Período padrão: Último mês</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            Data Início
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            Data Fim
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            CNPJ Emitente
          </label>
          <input
            type="text"
            value={cnpjEmit}
            onChange={(e) => setCnpjEmit(e.target.value)}
            placeholder="00.000.000/0000-00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            CNPJ Destinatário
          </label>
          <input
            type="text"
            value={cnpjDest}
            onChange={(e) => setCnpjDest(e.target.value)}
            placeholder="00.000.000/0000-00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={aplicarFiltros}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Aplicar Filtros
        </button>
        <button
          onClick={limparFiltros}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Limpar
        </button>
      </div>
    </div>
  )
}
