import { useMemo } from 'react'
import { useNF } from '../contexts/NFContext'
import { createColumnHelper } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ExportarExcel from '../components/ExportarExcel'
import GridAvancada from '../components/GridAvancada'

const columnHelper = createColumnHelper<any>()

export default function GridCTeSimples() {
  const { notas, loading } = useNF()

  const columns = useMemo(() => [
    // Identificação
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => <span className="font-mono text-xs">{info.getValue() || '-'}</span>,
      size: 250
    }),
    columnHelper.accessor('chaveAcesso', {
      header: 'Chave CT-e',
      cell: info => <span className="font-mono text-xs">{info.getValue() || '-'}</span>,
      size: 350
    }),
    columnHelper.accessor('numero', {
      header: 'Número',
      cell: info => <span className="font-semibold">{info.getValue() || '-'}</span>,
      size: 100
    }),
    columnHelper.accessor('serie', {
      header: 'Série',
      cell: info => <span>{info.getValue() || '-'}</span>,
      size: 80
    }),
    columnHelper.accessor('modelo', {
      header: 'Modelo',
      cell: info => <span>{info.getValue() || '-'}</span>,
      size: 80
    }),
    columnHelper.accessor('tipoServico', {
      header: 'Tipo Serviço',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 120
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
    columnHelper.accessor('valores.servico', {
      header: 'Valor Serviço',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 130
    }),
    columnHelper.accessor('valores.receber', {
      header: 'Valor a Receber',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 140
    }),
    columnHelper.accessor('valores.icms', {
      header: 'ICMS',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 110
    }),
    columnHelper.accessor('valores.baseCalculo', {
      header: 'Base Cálculo',
      cell: info => {
        const valor = info.getValue()
        return <span className="whitespace-nowrap">{typeof valor === 'number' ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
      },
      size: 130
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
    
    // Tomador
    columnHelper.accessor('tomador.tipo', {
      header: 'Tipo Tomador',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 120
    }),
    columnHelper.accessor('tomador.cnpj', {
      header: 'CNPJ Tomador',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('tomador.razaoSocial', {
      header: 'Razão Social Tomador',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 300
    }),
    columnHelper.accessor('tomador.ie', {
      header: 'IE Tomador',
      cell: info => <span className="text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 130
    }),
    
    // Remetente
    columnHelper.accessor('remetente.cnpj', {
      header: 'CNPJ Remetente',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('remetente.razaoSocial', {
      header: 'Razão Social Remetente',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 300
    }),
    columnHelper.accessor('remetente.municipio', {
      header: 'Município Remetente',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('remetente.uf', {
      header: 'UF Remetente',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 80
    }),
    
    // Destinatário
    columnHelper.accessor('destinatario.cnpj', {
      header: 'CNPJ Destinatário',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('destinatario.razaoSocial', {
      header: 'Razão Social Destinatário',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 300
    }),
    
    // Expedidor
    columnHelper.accessor('expedidor.cnpj', {
      header: 'CNPJ Expedidor',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('expedidor.razaoSocial', {
      header: 'Razão Social Expedidor',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 300
    }),
    
    // Recebedor
    columnHelper.accessor('recebedor.cnpj', {
      header: 'CNPJ Recebedor',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('recebedor.razaoSocial', {
      header: 'Razão Social Recebedor',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 300
    }),
    
    // Carga
    columnHelper.accessor('carga.produto', {
      header: 'Produto',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 200
    }),
    columnHelper.accessor('carga.peso', {
      header: 'Peso',
      cell: info => <span className="text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 100
    }),
    columnHelper.accessor('carga.volume', {
      header: 'Volume',
      cell: info => <span className="text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 100
    }),
    columnHelper.accessor('carga.unidade', {
      header: 'Unidade',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 100
    }),
    
    // Rodoviário
    columnHelper.accessor('rodoviario.rntrc', {
      header: 'RNTRC',
      cell: info => <span className="font-mono text-sm">{info.getValue() || '-'}</span>,
      size: 120
    }),
    columnHelper.accessor('rodoviario.veiculo.placa', {
      header: 'Placa Veículo',
      cell: info => <span className="font-mono text-sm">{info.getValue() || '-'}</span>,
      size: 120
    }),
    columnHelper.accessor('rodoviario.veiculo.uf', {
      header: 'UF Veículo',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 80
    }),
    columnHelper.accessor('rodoviario.motorista.cpf', {
      header: 'CPF Motorista',
      cell: info => <span className="font-mono text-sm">{info.getValue() || '-'}</span>,
      size: 130
    }),
    columnHelper.accessor('rodoviario.motorista.nome', {
      header: 'Nome Motorista',
      cell: info => <span className="text-sm">{info.getValue() || '-'}</span>,
      size: 200
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
          <span className="text-3xl">🚚</span>
        </div>
        <h3 className="text-xl font-bold text-revio-gray-800 mb-2">Nenhum CT-e encontrado</h3>
        <p className="text-revio-gray-600 mb-4">
          Não há conhecimentos de transporte eletrônicos no período selecionado.
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
          <h2 className="text-2xl font-bold text-revio-gray-800">Grid CT-e (Conhecimento de Transporte Eletrônico)</h2>
          <p className="text-sm text-revio-gray-600 mt-1">
            {notas.length} {notas.length === 1 ? 'conhecimento encontrado' : 'conhecimentos encontrados'}
          </p>
        </div>
        <ExportarExcel dados={notas} nomeArquivo="conhecimentos-transporte-cte" />
      </div>

      <GridAvancada
        data={notas}
        columns={columns}
        pageSize={20}
      />
    </div>
  )
}
