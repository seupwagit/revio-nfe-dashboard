import { Calendar } from 'lucide-react'

interface PeriodPresetsProps {
  onSelectPeriod: (days: number) => void
}

export default function PeriodPresets({ onSelectPeriod }: PeriodPresetsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* 7 dias - Azul */}
      <button
        onClick={() => onSelectPeriod(7)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200"
      >
        <Calendar className="w-3.5 h-3.5" />
        7 dias
      </button>

      {/* 15 dias - Índigo */}
      <button
        onClick={() => onSelectPeriod(15)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
      >
        <Calendar className="w-3.5 h-3.5" />
        15 dias
      </button>

      {/* 30 dias - Roxo */}
      <button
        onClick={() => onSelectPeriod(30)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200"
      >
        <Calendar className="w-3.5 h-3.5" />
        30 dias
      </button>

      {/* 60 dias - Rosa */}
      <button
        onClick={() => onSelectPeriod(60)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 bg-pink-100 text-pink-700 hover:bg-pink-200"
      >
        <Calendar className="w-3.5 h-3.5" />
        60 dias
      </button>

      {/* 90 dias - Laranja */}
      <button
        onClick={() => onSelectPeriod(90)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200"
      >
        <Calendar className="w-3.5 h-3.5" />
        90 dias
      </button>

      {/* Último ano - VERDE (DESTAQUE) */}
      <button
        onClick={() => onSelectPeriod(365)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300"
      >
        <Calendar className="w-3.5 h-3.5" />
        Último ano
      </button>
    </div>
  )
}
