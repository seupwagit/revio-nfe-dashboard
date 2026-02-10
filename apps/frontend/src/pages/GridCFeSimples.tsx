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

export default function GridCFeSimples() {
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
    console.log(`[GridCFeSimples] Opening document viewer for: ${documentId}`)
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
    columnHelper.accessor('_id', {
      header: 'ID',
      cell: info => <span className="font-mono text-xs">{info.getValue() || '-'}</span>,
      size: 250
    }),
    columnHelper.accessor('CHV_CFe', {
      header: 'Chave CF-e',
      cell: info => <span className="font-mono text-xs">{info.getValue() || '-'}</span>,
      size: 350
    }),
    columnHelper.accessor('NUM_DOC', {
      header: 'Número',
      cell: info => <span className="font-semibold">{info.getValue() || '-'}</span>,
      size: 100
    }),
    columnHelper.accessor('DT_DOC', {
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
          return <span className="whitespace-nowrap">{isNaN(d.getTime()) ? date : d.toLocaleDateString('pt-BR')}</span>
        } catch {
          return <span className="whitespace-nowrap">{date}</span>
        }
      },
      filterFn: 'dateFilter' as any,
      size: 150
    }),
    columnHelper.accessor('HR_EMI', {
      header: 'Hora',
      cell: info => <span>{info.getValue() || '-'}</span>,
      size: 80
    }),
    
    // Valores
    columnHelper.accessor('VL_DOC', {
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
    columnHelper.accessor('VL_MERC', {
      header: 'Valor Mercadoria',
      cell: info => <span className="whitespace-nowrap">{typeof info.getValue() === 'number' ? info.getValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>,
      size: 130
    }),
    columnHelper.accessor('VL_DESC', {
      header: 'Desconto',
      cell: info => <span className="whitespace-nowrap">{typeof info.getValue() === 'number' ? info.getValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>,
      size: 110
    }),
    columnHelper.accessor('VL_ICMS', {
      header: 'ICMS',
      cell: info => <span className="whitespace-nowrap">{typeof info.getValue() === 'number' ? info.getValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>,
      size: 110
    }),
    columnHelper.accessor('VL_PIS', {
      header: 'PIS',
      cell: info => <span className="whitespace-nowrap">{typeof info.getValue() === 'number' ? info.getValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>,
      size: 110
    }),
    columnHelper.accessor('VL_COFINS', {
      header: 'COFINS',
      cell: info => <span className="whitespace-nowrap">{typeof info.getValue() === 'number' ? info.getValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>,
      size: 110
    }),
    
    // Emitente
    columnHelper.accessor('CNPJ_EMIT', {
      header: 'CNPJ Emitente',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || '-'}</span>,
      size: 150
    }),
    columnHelper.accessor('NOME_EMIT', {
      header: 'Nome Emitente',
      cell: info => <span className="max-w-xs truncate block">{info.getValue() || '-'}</span>,
      size: 250
    }),
    
    // Destinatário
    columnHelper.accessor('CNPJ_DEST', {
      header: 'CNPJ Destinatário',
      cell: info => <span className="font-mono text-sm whitespace-nowrap">{info.getValue() || info.row.original.CPF_DEST || '-'}</span>,
      size: 160
    }),
    columnHelper.accessor('NOME_DEST', {
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
          <span className="text-3xl">🧾</span>
        </div>
        <h3 className="text-xl font-bold text-revio-gray-800 mb-2">Nenhum CF-e encontrado</h3>
        <p className="text-revio-gray-600 mb-4">
          Não há cupons fiscais eletrônicos no período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-revio-gray-800">Grid CF-e</h2>
          <p className="text-sm text-revio-gray-600 mt-1">
            {notas.length.toLocaleString('pt-BR')} {notas.length === 1 ? 'cupom encontrado' : 'cupons encontrados'}
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
          <ExportarExcel dados={notas} nomeArquivo="cupons-fiscais-cfe" />
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
        data-testid="grid-cfe"
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
