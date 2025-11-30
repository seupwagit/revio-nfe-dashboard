import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'emerald' | 'red' | 'purple' | 'orange'
}

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    emerald: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    emerald: 'bg-emerald-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100'
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  }

  return (
    <div className="card p-6 hover:shadow-revio-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-revio-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-revio-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBgClasses[color]}`}>
          <Icon className={`h-6 w-6 ${iconColorClasses[color]}`} />
        </div>
      </div>
      <div className="mt-4 h-1 rounded-full bg-revio-gray-100 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${colorClasses[color]} w-full animate-pulse`}></div>
      </div>
    </div>
  )
}
