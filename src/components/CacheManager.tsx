import { useState, useEffect } from 'react'
import { Database, Trash2, Clock, HardDrive, X, Info } from 'lucide-react'
import { getCacheInfo, clearCache } from '../services/analyticsCache'

interface CacheManagerProps {
  onClose: () => void
}

export default function CacheManager({ onClose }: CacheManagerProps) {
  const [cacheInfo, setCacheInfo] = useState({ count: 0, size: 0 })
  const [cacheItems, setCacheItems] = useState<Array<{ key: string; timestamp: number; size: number }>>([])

  useEffect(() => {
    loadCacheInfo()
  }, [])

  const loadCacheInfo = () => {
    const info = getCacheInfo()
    setCacheInfo(info)

    // Listar itens do cache
    const items: Array<{ key: string; timestamp: number; size: number }> = []
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith('analytics_cache_')) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item)
            items.push({
              key: key.replace('analytics_cache_', ''),
              timestamp: parsed.timestamp,
              size: item.length
            })
          }
        } catch (e) {
          // Ignora itens corrompidos
        }
      }
    })

    items.sort((a, b) => b.timestamp - a.timestamp)
    setCacheItems(items)
  }

  const handleClearCache = () => {
    if (confirm('Tem certeza que deseja limpar todo o cache? Isso fará com que as próximas consultas sejam mais lentas.')) {
      const removed = clearCache()
      alert(`✅ Cache limpo com sucesso!\n\n${removed} item(ns) removido(s).`)
      loadCacheInfo()
    }
  }

  const handleClearItem = (key: string) => {
    localStorage.removeItem('analytics_cache_' + key)
    loadCacheInfo()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatAge = (timestamp: number) => {
    const age = Date.now() - timestamp
    const minutes = Math.floor(age / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atrás`
    if (hours > 0) return `${hours}h atrás`
    if (minutes > 0) return `${minutes}min atrás`
    return 'agora'
  }

  const formatExpiry = (timestamp: number) => {
    const CACHE_DURATION = 60 * 60 * 1000 // 60 minutos
    const expiresAt = timestamp + CACHE_DURATION
    const remaining = expiresAt - Date.now()
    const minutes = Math.floor(remaining / (1000 * 60))

    if (remaining <= 0) return '⚠️ Expirado'
    if (minutes < 5) return `⏰ ${minutes}min restantes`
    return `✅ ${minutes}min restantes`
  }

  const parseKey = (key: string) => {
    // Formato: collection_dtIni_dtFin
    const parts = key.split('_')
    if (parts.length >= 3) {
      return {
        collection: parts[0],
        dtIni: parts[1],
        dtFin: parts[2]
      }
    }
    return { collection: key, dtIni: '', dtFin: '' }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Gerenciador de Cache</h2>
                <p className="text-blue-100 text-sm mt-1">Visualize e gerencie o cache de analytics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b-2 border-blue-200">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Database className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Itens</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{cacheInfo.count}</div>
            <div className="text-xs text-gray-600 mt-1">períodos salvos</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Tamanho</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatSize(cacheInfo.size)}</div>
            <div className="text-xs text-gray-600 mt-1">de 5 MB disponíveis</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Duração</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">60min</div>
            <div className="text-xs text-gray-600 mt-1">tempo de vida</div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start gap-2 text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              O cache armazena resultados de consultas por <strong>60 minutos</strong>. 
              Consultas repetidas no mesmo período são instantâneas!
            </p>
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6">
          {cacheItems.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Cache vazio</p>
              <p className="text-gray-500 text-sm mt-2">
                Faça uma consulta para começar a usar o cache
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cacheItems.map((item, index) => {
                const parsed = parseKey(item.key)
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                            {parsed.collection}
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatAge(item.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 font-mono">
                          {parsed.dtIni} até {parsed.dtFin}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-gray-600">
                            📦 {formatSize(item.size)}
                          </span>
                          <span className={`font-semibold ${
                            formatExpiry(item.timestamp).includes('Expirado') ? 'text-red-600' :
                            formatExpiry(item.timestamp).includes('⏰') ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {formatExpiry(item.timestamp)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClearItem(item.key)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remover este item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>Dica:</strong> O cache acelera consultas repetidas em até 900x!
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-semibold"
            >
              Fechar
            </button>
            {cacheItems.length > 0 && (
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Tudo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
