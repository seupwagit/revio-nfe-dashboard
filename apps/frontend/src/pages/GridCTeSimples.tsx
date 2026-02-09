import { createColumnHelper } from '@tanstack/react-table'
import { ArrowUpDown, Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import DANFEViewer from '../components/DANFEViewer'
import ExportarExcel from '../components/ExportarExcel'
import FloatingDownloadButton from '../components/FloatingDownloadButton'
import GridPaginada from '../components/GridPaginada'
import LoadingSpinner from '../components/LoadingSpinner'
import SelectionCheckbox, { SelectionHeader } from '../components/SelectionCheckbox'
import { useNF } from '../contexts/NFContext'

const columnHelper = createColumnHelper<any>()

export default function GridCTeSimples() {
  const { notas, loading, isUpdating, usandoCache } = useNF()

  // State for DANFE viewer
  const [danfeViewer, setDanfeViewer] = useState<{
    isOpen: boolean;
    documentId: string;
    documentData: any;
  }>({
    isOpen: false,
    documentId: '',
    documentData: null
  })

  // Handle DANFE viewer open
  const handleVisualizarClick = (rowData: any) => {
    const documentId = rowData.id || rowData._id;
    console.log(`[GridCTeSimples] Opening document viewer for: ${documentId}`)
    setDanfeViewer({
      isOpen: true,
      documentId,
      documentData: rowData
    })
  }

  // Handle DANFE viewer close
  const handleDanfeClose = () => {
    setDanfeViewer({
      isOpen: false,
      documentId: '',
      documentData: null
    })
  }

  const columns = useMemo(() => [
    // Coluna de Seleção
    columnHelper.display({
      id: 'select',
      header: () => (
        <SelectionHeader 
          chaves={notas.map((nota, index) => nota.chaveAcesso || `row-${index}`)} 
        />
      ),
      cell: ({ row }) => {
        const chave = row.original.chaveAcesso || `row-${row.index}`
        
        return (
          <SelectionCheckbox 
            chave={chave}
            disabled={false}
          />
        )
      },
      size: 50,
      enableSorting: false
    }),

    // Coluna de Ações
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const documentId = row.original.id || row.original._id
        const hasValidId = documentId && typeof documentId === 'string' && documentId.trim().length > 0
        
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleVisualizarClick(row.original)}
              disabled={!hasValidId}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                hasValidId
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={hasValidId ? 'Visualizar Documento' : 'ID do documento não disponível'}
            >
              <Eye className="w-3 h-3 mr-1" />
              Visualizar
            </button>
          </div>
        )
      },
      size: 100,
      enableSorting: false
    }),
    
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
      filterFn: 'dateFilter' as any,
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
        const translatedVal = val === 'autorizada' ? 'Autorizada' : 
                               val === 'cancelada' ? 'Cancelada' : 
                               val === 'processando' ? 'Processando' : val
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[val as string] || 'bg-gray-100 text-gray-800'}`}>
            {translatedVal || '-'}
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
      filterFn: 'numberFilter' as any,
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
    
    // Tomador
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
  ], [handleVisualizarClick])

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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-revio-gray-800">Grid CT-e</h2>
          <p className="text-sm text-revio-gray-600 mt-1">
            {notas.length.toLocaleString('pt-BR')} {notas.length === 1 ? 'conhecimento encontrado' : 'conhecimentos encontrados'}
            {usandoCache && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                💾 Cache
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full md:w-auto">
          {isUpdating && (
            <div className="flex items-center gap-2 text-revio-primary animate-pulse mr-4">
              <LoadingSpinner size="sm" showText={false} />
              <span className="text-xs font-semibold">Atualizando...</span>
            </div>
          )}
          <ExportarExcel dados={notas} nomeArquivo="conhecimentos-transporte-cte" />
        </div>
      </div>

      {/* Botão de Download Flutuante - Sempre visível no topo */}
      <FloatingDownloadButton 
        stickyTop={true}
        topOffset={0}
        className="mb-4"
      />

      <GridPaginada
        data={notas}
        columns={columns}
        pageSize={50}
        hideBusca={true}
        data-testid="grid-cte"
      />

      {/* Document Viewer Modal */}
      <DANFEViewer
        isOpen={danfeViewer.isOpen}
        documentId={danfeViewer.documentId}
        documentData={danfeViewer.documentData}
        onClose={handleDanfeClose}
      />
    </div>
  )
}
