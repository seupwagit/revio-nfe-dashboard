import { Download, CheckCircle } from 'lucide-react'

interface StreamingProgressProps {
  current: number
  total: number
  records: number
  isComplete: boolean
}

export default function StreamingProgress({ current, total, records, isComplete }: StreamingProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  
  if (isComplete) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-fade-in">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-green-800">
            ✅ Carregamento completo!
          </p>
          <p className="text-sm text-green-700 mt-1">
            {records.toLocaleString('pt-BR')} registros carregados com sucesso
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <Download className="w-7 h-7 text-white animate-bounce" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-blue-900">
            Carregando dados...
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Página {current} de {total} • {records.toLocaleString('pt-BR')} registros
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-700">
              {percentage}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Barra de progresso */}
      <div className="relative">
        <div className="w-full h-4 bg-blue-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-500 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>
        {/* Texto do percentual na barra */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  )
}
