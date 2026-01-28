import { memo } from 'react'
import { Loader2, CheckCircle, Clock, Zap, Database, TrendingUp, AlertTriangle } from 'lucide-react'
import type { CacheInconsistency } from '../services/cacheValidator'

interface ProgressoAnalyticsProps {
  etapa: 'preparando' | 'validando' | 'buscando' | 'processando' | 'concluido'
  progresso: number
  chunksTotal: number
  chunksProcessados: number
  registrosAcumulados: number
  tempoDecorrido: number
  velocidade: number
  estimativaRestante: number
  usandoCache: boolean
  cacheInconsistencias?: CacheInconsistency[]
}

const ProgressoAnalytics = memo(({ 
  etapa, 
  progresso, 
  chunksTotal, 
  chunksProcessados,
  registrosAcumulados,
  tempoDecorrido,
  velocidade,
  estimativaRestante,
  usandoCache,
  cacheInconsistencias
}: ProgressoAnalyticsProps) => {
  
  const getEtapaInfo = () => {
    switch (etapa) {
      case 'validando':
        return { icon: AlertTriangle, text: 'Validando cache...', color: 'yellow' }
      case 'preparando':
        return { icon: Clock, text: 'Preparando consulta...', color: 'blue' }
      case 'buscando':
        return { icon: Database, text: 'Buscando dados da API...', color: 'purple' }
      case 'processando':
        return { icon: TrendingUp, text: 'Processando analytics...', color: 'orange' }
      case 'concluido':
        return { icon: CheckCircle, text: 'Concluído!', color: 'green' }
    }
  }

  const { icon: Icon, text, color } = getEtapaInfo()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${
            color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
            color === 'blue' ? 'from-blue-500 to-blue-600' :
            color === 'purple' ? 'from-purple-500 to-purple-600' :
            color === 'orange' ? 'from-orange-500 to-orange-600' :
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
              {usandoCache ? '💾 Usando cache para acelerar' : '🚀 Modo paralelo ativado'}
            </p>
          </div>
        </div>

        {/* Barra de Progresso Principal */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Progresso Geral</span>
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

        {/* Métricas em Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Chunks */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-1">Chunks</div>
            <div className="text-2xl font-bold text-blue-900">
              {chunksProcessados}/{chunksTotal}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {chunksTotal > 0 ? Math.round((chunksProcessados / chunksTotal) * 100) : 0}% completo
            </div>
          </div>

          {/* Registros */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
            <div className="text-xs font-semibold text-purple-700 mb-1">Registros</div>
            <div className="text-2xl font-bold text-purple-900">
              {registrosAcumulados.toLocaleString()}
            </div>
            <div className="text-xs text-purple-600 mt-1">acumulados</div>
          </div>

          {/* Tempo */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
            <div className="text-xs font-semibold text-orange-700 mb-1">Tempo</div>
            <div className="text-2xl font-bold text-orange-900">
              {tempoDecorrido.toFixed(1)}s
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {estimativaRestante > 0 ? `~${estimativaRestante.toFixed(0)}s restantes` : 'finalizando...'}
            </div>
          </div>

          {/* Velocidade */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            <div className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Velocidade
            </div>
            <div className="text-2xl font-bold text-green-900">
              {velocidade.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-1">reg/s</div>
          </div>
        </div>

        {/* Barra de Chunks Individual */}
        {chunksTotal > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">Chunks Processados</div>
            <div className="flex gap-2">
              {Array.from({ length: chunksTotal }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    i < chunksProcessados
                      ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-200'
                      : i === chunksProcessados
                      ? 'bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                  title={`Chunk ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Alertas de Cache Corrompido */}
        {cacheInconsistencias && cacheInconsistencias.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg space-y-2">
            <p className="text-sm font-bold text-yellow-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Cache Corrompido Detectado e Limpo Automaticamente
            </p>
            {cacheInconsistencias.map((inc, i) => (
              <div key={i} className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded">
                <strong>{inc.tipo === 'periodo_maior_menos_dados' ? '⚠️ Inconsistência:' : '🗑️ Limpeza:'}</strong>
                <div className="mt-1 whitespace-pre-line">{inc.mensagem}</div>
              </div>
            ))}
            <p className="text-xs text-yellow-700 mt-2">
              ✅ Buscando dados atualizados da API...
            </p>
          </div>
        )}

        {/* Dicas */}
        {etapa === 'buscando' && !cacheInconsistencias && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Os chunks estão sendo buscados em paralelo para máxima velocidade!
            </p>
          </div>
        )}

        {etapa === 'concluido' && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Sucesso:</strong> Dados processados e salvos no cache para acesso rápido!
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

ProgressoAnalytics.displayName = 'ProgressoAnalytics'

export default ProgressoAnalytics
