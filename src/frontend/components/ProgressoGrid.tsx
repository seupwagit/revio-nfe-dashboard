import { memo } from 'react'
import { Loader2, CheckCircle, Database, TrendingUp, AlertTriangle } from 'lucide-react'

interface ProgressoGridProps {
  etapa: 'validando' | 'buscando' | 'processando' | 'concluido'
  progresso: number
  paginaAtual: number
  totalPaginas: number
  registrosAcumulados: number
  tempoDecorrido: number
  usandoCache: boolean
  collection: string
}

const ProgressoGrid = memo(({ 
  etapa, 
  progresso, 
  paginaAtual,
  totalPaginas,
  registrosAcumulados,
  tempoDecorrido,
  usandoCache,
  collection
}: ProgressoGridProps) => {
  
  const getEtapaInfo = () => {
    switch (etapa) {
      case 'validando':
        return { icon: AlertTriangle, text: 'Validando cache...', color: 'yellow' }
      case 'buscando':
        return { icon: Database, text: 'Buscando dados...', color: 'blue' }
      case 'processando':
        return { icon: TrendingUp, text: 'Processando...', color: 'purple' }
      case 'concluido':
        return { icon: CheckCircle, text: 'Concluído!', color: 'green' }
    }
  }

  const { icon: Icon, text, color } = getEtapaInfo()
  
  const collectionName = collection === 'tbl_nfe_100' ? 'NF-e' : 
                        collection === 'tbl_cfe_100' ? 'CF-e' : 'CT-e'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${
            color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
            color === 'blue' ? 'from-blue-500 to-blue-600' :
            color === 'purple' ? 'from-purple-500 to-purple-600' :
            'from-green-500 to-green-600'
          }`}>
            {etapa === 'concluido' ? (
              <Icon className="w-8 h-8 text-white" />
            ) : (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{text}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {usandoCache ? `💾 Usando cache - ${collectionName}` : `🚀 Carregando ${collectionName}`}
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Progresso</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {progresso}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progresso}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          {/* Páginas */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-1">Páginas</div>
            <div className="text-2xl font-bold text-blue-900">
              {paginaAtual}/{totalPaginas || '?'}
            </div>
          </div>

          {/* Registros */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
            <div className="text-xs font-semibold text-purple-700 mb-1">Registros</div>
            <div className="text-2xl font-bold text-purple-900">
              {registrosAcumulados.toLocaleString()}
            </div>
          </div>

          {/* Tempo */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            <div className="text-xs font-semibold text-green-700 mb-1">Tempo</div>
            <div className="text-2xl font-bold text-green-900">
              {tempoDecorrido.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Dicas */}
        {etapa === 'buscando' && !usandoCache && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Os dados serão salvos em cache para acesso rápido!
            </p>
          </div>
        )}

        {etapa === 'concluido' && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Sucesso:</strong> {registrosAcumulados.toLocaleString()} registros carregados!
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

ProgressoGrid.displayName = 'ProgressoGrid'

export default ProgressoGrid
