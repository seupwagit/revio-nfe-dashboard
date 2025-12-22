import { useNavigate } from 'react-router-dom'
import { NotaFiscal } from '../types'
import { ChevronRight, Building2, User, Calendar, DollarSign } from 'lucide-react'

interface NotaCardProps {
  nota: NotaFiscal
}

export default function NotaCard({ nota }: NotaCardProps) {
  const navigate = useNavigate()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div
      onClick={() => navigate(`/notas/${nota.id}`)}
      className="card p-6 hover:scale-[1.02] cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-revio-gray-900">
                NF-e {nota.numero}/{nota.serie}
              </h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                nota.status === 'autorizada' ? 'bg-green-100 text-green-700' :
                nota.status === 'cancelada' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {nota.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-revio-light rounded-lg">
                <Building2 className="h-4 w-4 text-revio-primary" />
              </div>
              <div className="text-sm flex-1">
                <p className="text-revio-gray-500 font-medium mb-1">Emitente</p>
                <p className="font-semibold text-revio-gray-900 truncate">{nota.emitente.razaoSocial}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-revio-light rounded-lg">
                <User className="h-4 w-4 text-revio-primary" />
              </div>
              <div className="text-sm flex-1">
                <p className="text-revio-gray-500 font-medium mb-1">Destinatário</p>
                <p className="font-semibold text-revio-gray-900 truncate">{nota.destinatario.razaoSocial}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-revio-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-revio-gray-400" />
              <span className="text-sm text-revio-gray-600">{formatDate(nota.dataEmissao)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">{formatCurrency(nota.valorTotal)}</span>
            </div>
          </div>
        </div>

        <ChevronRight className="h-6 w-6 text-revio-gray-300 group-hover:text-revio-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4" />
      </div>
    </div>
  )
}
