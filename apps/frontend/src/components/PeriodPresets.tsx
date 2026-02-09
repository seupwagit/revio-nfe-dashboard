import { Calendar } from 'lucide-react';

interface PeriodPresetsProps {
  onSelectPeriod: (days: number) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

export default function PeriodPresets({ onSelectPeriod, currentStartDate, currentEndDate }: PeriodPresetsProps) {
  const isActive = (days: number) => {
    const fim = new Date()
    const inicio = new Date()
    
    // Garantir que estamos comparando apenas a parte da data (AAAA-MM-DD)
    // usando a mesma lógica de geração de strings do sistema
    if (days === 365) {
      inicio.setFullYear(fim.getFullYear() - 1)
    } else {
      inicio.setDate(fim.getDate() - days)
    }
    
    const dtIni = inicio.toISOString().split('T')[0]
    const dtFim = fim.toISOString().split('T')[0]
    
    const isMatched = currentStartDate === dtIni && currentEndDate === dtFim
    
    return isMatched
  }

  const getButtonStyle = (days: number, activeClass: string, inactiveClass: string) => {
    return `px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 ${
      isActive(days) ? activeClass : inactiveClass
    }`
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* 7 dias - Azul */}
      <button
        onClick={() => onSelectPeriod(7)}
        className={getButtonStyle(7, "bg-blue-600 text-white shadow-md ring-2 ring-blue-300", "bg-blue-100 text-blue-700 hover:bg-blue-200")}
      >
        <Calendar className="w-3.5 h-3.5" />
        7 dias
      </button>

      {/* 15 dias - Índigo */}
      <button
        onClick={() => onSelectPeriod(15)}
        className={getButtonStyle(15, "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300", "bg-indigo-100 text-indigo-700 hover:bg-indigo-200")}
      >
        <Calendar className="w-3.5 h-3.5" />
        15 dias
      </button>

      {/* 30 dias - Roxo */}
      <button
        onClick={() => onSelectPeriod(30)}
        className={getButtonStyle(30, "bg-purple-600 text-white shadow-md ring-2 ring-purple-300", "bg-purple-100 text-purple-700 hover:bg-purple-200")}
      >
        <Calendar className="w-3.5 h-3.5" />
        30 dias
      </button>

      {/* 60 dias - Rosa */}
      <button
        onClick={() => onSelectPeriod(60)}
        className={getButtonStyle(60, "bg-pink-600 text-white shadow-md ring-2 ring-pink-300", "bg-pink-100 text-pink-700 hover:bg-pink-200")}
      >
        <Calendar className="w-3.5 h-3.5" />
        60 dias
      </button>

      {/* 90 dias - Laranja */}
      <button
        onClick={() => onSelectPeriod(90)}
        className={getButtonStyle(90, "bg-orange-600 text-white shadow-md ring-2 ring-orange-300", "bg-orange-100 text-orange-700 hover:bg-orange-200")}
      >
        <Calendar className="w-3.5 h-3.5" />
        90 dias
      </button>

      {/* Último ano - VERDE (DESTAQUE) */}
      <button
        onClick={() => onSelectPeriod(365)}
        className={getButtonStyle(365, "bg-green-600 text-white shadow-md ring-2 ring-green-300", "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300")}
      >
        <Calendar className="w-3.5 h-3.5" />
        Último ano
      </button>
    </div>
  )
}
