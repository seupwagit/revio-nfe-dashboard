import { Database } from 'lucide-react'

interface ContadorRegistrosProps {
  total: number
  exibindo: number
  loading?: boolean
}

export default function ContadorRegistros({ total, exibindo, loading }: ContadorRegistrosProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-revio-light to-blue-50 rounded-xl border-2 border-revio-accent">
      <div className="p-2 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-lg">
        <Database className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-revio-gray-500 uppercase tracking-wide">
          Registros
        </p>
        <p className="text-lg font-bold text-revio-gray-900">
          {loading ? (
            <span className="animate-pulse">Carregando...</span>
          ) : (
            <>
              <span className="text-revio-primary">{total.toLocaleString('pt-BR')}</span>
              {' '}encontrado(s)
              {exibindo < total && (
                <span className="text-sm font-normal text-revio-gray-600">
                  {' '}| Exibindo {exibindo.toLocaleString('pt-BR')}
                </span>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
