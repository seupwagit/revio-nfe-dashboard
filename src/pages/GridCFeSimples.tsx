import { useMemo } from 'react'
import { useNF } from '../contexts/NFContext'
import { createColumnHelper } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ExportarExcel from '../components/ExportarExcel'
import GridAvancada from '../components/GridAvancada'

const columnHelper = createColumnHelper<any>()

export default function GridCFeSimples() {
  const { notas, loading } = useNF()

  const columns = useMemo(() => [
    // Identificação
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => <span className="font-mono text-xs">{info.getValue() || '-'}</span>,
      size: 250
    }),
    columnHelper.accessor('chaveAcesso', {
      header: 'Chave CF-e',
      cell: info => <span className="font-mono text-xs">{info.getValue() || '-'}</span>,
      size: 350
    }),
    columnHelper.accessor('numero', {
      header: 'Número',
      cell: info => <span className="font-semibold">{info.getValue() || '-'}</span>,
      size: 100
    }),
    columnHelper.accessor('numeroSAT', {
      header: 'Número SAT',
      cell: info => <span className="font-mono text-sm">{info.getValue() || '-'}</span>,
      size: 120
    }),
    columnHelper.accessor('serie', {
      header: 'Série',
      cell: info => <span>{info.getValue() || '-'}</span>,
      size: 80
    }),
    
    // Datas e Status
    columnHelper.accessor('dataEmissao', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="whitespace-nowrap">
          Data Emissão <ArrowUpDown className="inline w-4 h-4" />
        </button>
      ),
      cell: info => {
        const date = info.getValue()
        if (!date) return '-'
        try {
          const d = new Date(date)
          return <span className="whitespace-nowrap">{isNaN(d.getTime()) ? date : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR')}</span>
        } catch {
          return <span className="whitespace-nowrap">{date}</span>
        }
      },
      size: 180
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const val = info.getValue()
        const colors: Record<string, string> = {
          'autorizada': 'bg-green-100 text-green-800',
          'processando': 'bg-yellow-100 text-yellow-800',
          'cancelada': 'bg-red-100 text-red-800'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[val as string] || 'bg-gray-100 text-gray-800'}`}>
            {val || '-'}
          </span>
        )
      },
      size: 120
    }),
    
    // Valores
    columnHelper.accessor('valorTotal', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="whitespace-nowrap">
          Valor Total <ArrowUpDown className="inline w-4 h-4" />
        </button>
      ),
      cell: info => {
        const valor = info.getValue()
        return (
          <span className="font-semibold text-revio-primary whitespace-nowrap">
            {typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
          </span>
        )
      },
      size: 130
    }),
    columnHelper.accessor('totais.valorICMS', {
      header: 'ICMS',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 110
    }),
    columnHelper.accessor('totais.valorPIS', {
      header: 'PIS',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 110
    }),
    columnHelper.accessor('totais.valorCOFINS', {
      header: 'COFINS',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 110
    }),
    columnHelper.accessor('totais.descontos', {
      header: 'Descontos',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 110
    }),
    columnHelper.accessor('totais.acrescimos', {
      header: 'Acréscimos',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 110
    }),
    
    // Emitente
    columnHelper.accessor('emitente.cnpj', {
      header: 'CNPJ Emitente',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('emitente.razaoSocial', {
      header: 'Razão Social Emitente',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 300
    }),
    columnHelper.accessor('emitente.ie', {
      header: 'IE Emitente',
      cell: info => <span className="text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 130
    }),
    
    // Destinatário
    columnHelper.accessor('destinatario.cpfCnpj', {
      header: 'CPF/CNPJ Destinatário',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 160
    }),
    columnHelper.accessor('destinatario.nome', {
      header: 'Nome Destinatário',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 250
    }),
    
    // Pagamento
    columnHelper.accessor('pagamento.forma', {
      header: 'Forma Pagamento',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('pagamento.valor', {
      header: 'Valor Pago',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 120
    }),
    
    // Informações Adicionais
    columnHelper.accessor('tipo', {
      header: 'Tipo',
      cell: info => <span className="text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 100
    }),
    columnHelper.accessor('origem', {
      header: 'Origem',
      cell: info => <span className="text-xs max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 200
    }),
  ], [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (notas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
          <span className="text-3xl">🧾</span>
        </div>
        <h3 className="text-xl font-bold text-revio-gray-800 mb-2">Nenhum CF-e encontrado</h3>
        <p className="text-revio-gray-600 mb-4">
          Não há cupons fiscais eletrônicos no período selecionado.
        </p>
        <p className="text-sm text-revio-gray-500">
          Esta collection pode não ter dados no banco de dados ou o período selecionado não possui movimentação.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-revio-gray-800">Grid CF-e (Cupom Fiscal Eletrônico)</h2>
          <p className="text-sm text-revio-gray-600 mt-1">
            {notas.length} {notas.length === 1 ? 'cupom encontrado' : 'cupons encontrados'}
          </p>
        </div>
        <ExportarExcel dados={notas} nomeArquivo="cupons-fiscais-cfe" />
      </div>

      <GridAvancada
        data={notas}
        columns={columns}
        pageSize={20}
      />
    </div>
  )
}
