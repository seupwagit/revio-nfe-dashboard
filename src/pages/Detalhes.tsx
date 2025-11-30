import { useParams, useNavigate } from 'react-router-dom'
import { useNF } from '../contexts/NFContext'
import { ArrowLeft, Building2, User, Package, FileText } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Detalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notas, loading } = useNF()

  const nota = notas.find(n => n.id === id)

  if (loading) return <LoadingSpinner />

  if (!nota) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600">Nota fiscal não encontrada</p>
        <button
          onClick={() => navigate('/notas')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar
        </button>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/notas')}
        className="flex items-center gap-2 text-revio-gray-600 hover:text-revio-primary font-semibold transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Voltar
      </button>

      <div className="card p-8">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-revio-gray-900">
                NF-e {nota.numero}/{nota.serie}
              </h2>
              <p className="text-revio-gray-600 mt-1 font-medium">{formatDate(nota.dataEmissao)}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-revio ${
            nota.status === 'autorizada' ? 'bg-green-100 text-green-700' :
            nota.status === 'cancelada' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {nota.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-revio-gray-900">Emitente</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-bold text-revio-gray-900">{nota.emitente.razaoSocial}</p>
              {nota.emitente.nomeFantasia && (
                <p className="text-revio-gray-700">{nota.emitente.nomeFantasia}</p>
              )}
              <p className="text-revio-gray-600 font-mono">CNPJ: {nota.emitente.cnpj}</p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-revio-gray-900">Destinatário</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-bold text-revio-gray-900">{nota.destinatario.razaoSocial}</p>
              <p className="text-revio-gray-600 font-mono">CNPJ: {nota.destinatario.cnpj}</p>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-revio-gray-100 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-revio-gray-900 text-lg">Itens da Nota</h3>
          </div>
          <div className="overflow-x-auto rounded-xl border-2 border-revio-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-revio-primary to-revio-secondary text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase">Código</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase">Descrição</th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase">Qtd</th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase">Valor Unit.</th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-revio-gray-200 bg-white">
                {nota.itens.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-revio-light transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-revio-gray-900">{item.codigo}</td>
                    <td className="px-4 py-4 text-sm text-revio-gray-900">{item.descricao}</td>
                    <td className="px-4 py-4 text-sm text-revio-gray-900 text-right">{item.quantidade}</td>
                    <td className="px-4 py-4 text-sm text-revio-gray-900 text-right">{formatCurrency(item.valorUnitario)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-revio-gray-900 text-right">{formatCurrency(item.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200">
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-sm font-bold text-revio-gray-900 text-right">Total da Nota</td>
                  <td className="px-4 py-4 text-lg font-bold text-green-700 text-right">{formatCurrency(nota.valorTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="border-t-2 border-revio-gray-100 mt-8 pt-8">
          <h3 className="font-bold text-revio-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-revio-primary to-revio-secondary rounded-full"></div>
            Chave de Acesso
          </h3>
          <div className="p-4 bg-gradient-to-br from-revio-light to-blue-50 rounded-xl border-2 border-revio-accent">
            <code className="block text-sm font-mono text-revio-gray-900 break-all font-semibold">
              {nota.chaveAcesso}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
