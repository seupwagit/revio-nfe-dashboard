import { useState, useEffect } from 'react'
import { streamingCache } from '../services/streamingCache'
import { Database, Trash2, RefreshCw } from 'lucide-react'

export default function CacheStats() {
  const [stats, setStats] = useState({
    entries: 0,
    totalRecords: 0,
    completeEntries: 0,
    partialEntries: 0
  })
  const [mostrar, setMostrar] = useState(false)

  const atualizarStats = () => {
    setStats(streamingCache.getStats())
  }

  useEffect(() => {
    atualizarStats()
    const interval = setInterval(atualizarStats, 2000)
    return () => clearInterval(interval)
  }, [])

  const limparCache = () => {
    if (confirm('Tem certeza que deseja limpar todo o cache? Isso pode deixar as próximas consultas mais lentas.')) {
      streamingCache.clearAll()
      atualizarStats()
    }
  }

  if (!mostrar) {
    return (
      <button
        onClick={() => setMostrar(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Ver estatísticas do cache"
      >
        <Database className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-600 rounded-lg shadow-xl p-4 w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Cache do Sistema
        </h3>
        <button
          onClick={() => setMostrar(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Consultas em cache:</span>
          <span className="font-semibold">{stats.entries}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Registros em cache:</span>
          <span className="font-semibold">{stats.totalRecords.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Completas:</span>
          <span className="font-semibold text-green-600">{stats.completeEntries}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Parciais:</span>
          <span className="font-semibold text-yellow-600">{stats.partialEntries}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
        <button
          onClick={atualizarStats}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
        <button
          onClick={limparCache}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-semibold"
        >
          <Trash2 className="w-4 h-4" />
          Limpar
        </button>
      </div>

      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
        💡 O cache acelera consultas repetidas. Dados são mantidos por 30 minutos.
      </div>
    </div>
  )
}
