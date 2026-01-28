import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import BuscaNaturalSimples from './BuscaNaturalSimples'

interface GridPaginadaLocalProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  initialPageSize?: number
  hideBusca?: boolean // Nova propriedade para ocultar busca
}

export default function GridPaginadaLocal<T>({
  data,
  columns,
  initialPageSize = 1000,
  hideBusca = false
}: GridPaginadaLocalProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [filtrosLLM, setFiltrosLLM] = useState<any>({})
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Aplicar filtros LLM
  const dadosFiltrados = useMemo(() => {
    if (Object.keys(filtrosLLM).length === 0) return data

    return data.filter((item: any) => {
      // Tipo de operação
      if (filtrosLLM.tipoOperacao !== undefined) {
        if (item.tipoOperacao !== filtrosLLM.tipoOperacao) return false
      }

      // NOVO: Tipo Doc (coluna "TIPO DOC" da grid)
      if (filtrosLLM.tipoDoc) {
        const tipoItem = item.tipo?.toLowerCase().trim()
        const tipoFiltro = filtrosLLM.tipoDoc.toLowerCase().trim()
        if (tipoItem !== tipoFiltro && !tipoItem?.includes(tipoFiltro)) return false
      }

      // Valor total
      if (filtrosLLM.valorMin !== undefined) {
        if (!item.valorTotal || item.valorTotal < filtrosLLM.valorMin) return false
      }
      if (filtrosLLM.valorMax !== undefined) {
        if (!item.valorTotal || item.valorTotal > filtrosLLM.valorMax) return false
      }

      // Status
      if (filtrosLLM.status) {
        if (item.status?.toLowerCase() !== filtrosLLM.status.toLowerCase()) return false
      }

      // Protocolada
      if (filtrosLLM.protocolada) {
        if (item.protocolada !== filtrosLLM.protocolada) return false
      }

      // ICMS
      if (filtrosLLM.icmsMin !== undefined) {
        if (!item.totais?.valorICMS || item.totais.valorICMS < filtrosLLM.icmsMin) return false
      }

      // IPI
      if (filtrosLLM.ipiMin !== undefined) {
        if (!item.totais?.valorIPI || item.totais.valorIPI < filtrosLLM.ipiMin) return false
      }

      // PIS
      if (filtrosLLM.pisMin !== undefined) {
        if (!item.totais?.valorPIS || item.totais.valorPIS < filtrosLLM.pisMin) return false
      }

      // COFINS
      if (filtrosLLM.cofinsMin !== undefined) {
        if (!item.totais?.valorCOFINS || item.totais.valorCOFINS < filtrosLLM.cofinsMin) return false
      }

      // Frete
      if (filtrosLLM.freteMin !== undefined) {
        if (!item.totais?.valorFrete || item.totais.valorFrete < filtrosLLM.freteMin) return false
      }

      // Emitente/Destinatário (busca por nome)
      if (filtrosLLM.emitente) {
        const termo = filtrosLLM.emitente.toLowerCase()
        const emitenteMatch = item.emitente?.razaoSocial?.toLowerCase().includes(termo) ||
                             item.emitente?.nomeFantasia?.toLowerCase().includes(termo)
        const destinatarioMatch = item.destinatario?.razaoSocial?.toLowerCase().includes(termo) ||
                                 item.destinatario?.nome?.toLowerCase().includes(termo)
        if (!emitenteMatch && !destinatarioMatch) return false
      }

      // Destinatário específico
      if (filtrosLLM.destinatario) {
        const termo = filtrosLLM.destinatario.toLowerCase()
        const match = item.destinatario?.razaoSocial?.toLowerCase().includes(termo) ||
                     item.destinatario?.nome?.toLowerCase().includes(termo)
        if (!match) return false
      }

      // UF
      if (filtrosLLM.uf) {
        const ufMatch = item.emitente?.uf === filtrosLLM.uf || item.destinatario?.uf === filtrosLLM.uf
        if (!ufMatch) return false
      }

      // Município
      if (filtrosLLM.municipio) {
        const termo = filtrosLLM.municipio.toLowerCase()
        const municipioMatch = item.emitente?.municipio?.toLowerCase().includes(termo) ||
                              item.destinatario?.municipio?.toLowerCase().includes(termo)
        if (!municipioMatch) return false
      }

      // CNPJ
      if (filtrosLLM.cnpj) {
        const cnpjMatch = item.emitente?.cnpj?.includes(filtrosLLM.cnpj) ||
                         item.destinatario?.cnpj?.includes(filtrosLLM.cnpj) ||
                         item.destinatario?.cpfCnpj?.includes(filtrosLLM.cnpj)
        if (!cnpjMatch) return false
      }

      // Número da nota
      if (filtrosLLM.numero) {
        if (item.numero?.toString() !== filtrosLLM.numero) return false
      }

      // Série
      if (filtrosLLM.serie) {
        if (item.serie?.toString() !== filtrosLLM.serie) return false
      }

      // Modelo
      if (filtrosLLM.modelo) {
        if (item.modelo?.toString() !== filtrosLLM.modelo) return false
      }

      return true
    })
  }, [data, filtrosLLM])

  const table = useReactTable({
    data: dadosFiltrados,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: 0,
        pageSize
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: initialPageSize
      }
    }
  })

  const mudarTamanhoPagina = (novoTamanho: number) => {
    setPageSize(novoTamanho)
    table.setPageSize(novoTamanho)
    table.setPageIndex(0)
  }

  const totalRegistros = dadosFiltrados.length
  const paginaAtual = table.getState().pagination.pageIndex
  const totalPaginas = table.getPageCount()
  const inicio = paginaAtual * pageSize + 1
  const fim = Math.min((paginaAtual + 1) * pageSize, totalRegistros)

  const handleSearch = (filtros: any) => {
    console.log('🔍 Aplicando filtros LLM:', filtros)
    setFiltrosLLM(filtros)
    table.setPageIndex(0) // Voltar para primeira página ao filtrar
  }

  const handleClear = () => {
    console.log('🧹 Limpando filtros LLM')
    setFiltrosLLM({})
    table.setPageIndex(0)
  }

  return (
    <div className="space-y-4">
      {/* Busca Natural com LLM - Ocultar se hideBusca for true */}
      {!hideBusca && (
        <BuscaNaturalSimples
          onSearch={handleSearch}
          onClear={handleClear}
        />
      )}

      {/* Info e Controles */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div>
            Mostrando {totalRegistros > 0 ? inicio : 0} - {fim} de {totalRegistros.toLocaleString('pt-BR')} registros
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Registros por página:</label>
            <select
              value={pageSize}
              onChange={e => mudarTamanhoPagina(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1.000</option>
              <option value={2000}>2.000</option>
              <option value={5000}>5.000</option>
            </select>
          </div>
        </div>
        <div>
          Página {paginaAtual + 1} de {totalPaginas || 1}
        </div>
      </div>

      {/* Tabela */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-revio-primary text-white sticky top-0 z-10">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ir para página:</span>
          <input
            type="number"
            min={1}
            max={totalPaginas}
            value={paginaAtual + 1}
            onChange={e => {
              const pagina = parseInt(e.target.value) - 1
              if (!isNaN(pagina) && pagina >= 0 && pagina < totalPaginas) {
                table.setPageIndex(pagina)
              }
            }}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        <div className="text-sm text-gray-600">
          Total: {data.length.toLocaleString('pt-BR')} registros carregados
        </div>
      </div>
    </div>
  )
}
