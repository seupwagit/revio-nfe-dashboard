import { Calendar } from 'lucide-react'

interface PeriodPresetsProps {
  onSelectPeriod: (days: number) => void
}

export default function PeriodPresets({ onSelectPeriod }: PeriodPresetsProps) {
  const presets = [
    { label: '7 dias', days: 7, color: 'blue' },
    { label: '15 dias', days: 15, color: 'indigo' },
    { label: '30 dias', days: 30, color: 'purple' },
    { label: '60 dias', days: 60, color: 'pink' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.days}
          onClick={() => onSelectPeriod(preset.days)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 bg-${preset.color}-100 text-${preset.color}-700 hover:bg-${preset.color}-200 flex items-center gap-1.5`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {preset.label}
        </button>
      ))}
    </div>
  )
}
