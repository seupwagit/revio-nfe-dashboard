import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { Filter, Lock, Unlock } from 'lucide-react'
import { useState } from 'react'

interface GridAvancadaProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  pageSize?: number
}

export default function GridAvancada<T>({ data, columns, pageSize = 50 }: GridAvancadaProps<T>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [colunasFixas, setColunasFixas] = useState<Set<string>>(new Set(['numero']))
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize
      }
    }
  })

  const toggleColunaFixa = (columnId: string) => {
    setColunasFixas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnId)) {
        newSet.delete(columnId)
      } else {
        newSet.add(columnId)
      }
      return newSet
    })
  }

  const getLeftPosition = (columnId: string, headers: any[]) => {
    let left = 0
    for (const header of headers) {
      if (header.id === columnId) break
      if (colunasFixas.has(header.id)) {
        left += header.getSize()
      }
    }
    return left
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
        </button>
        
        <div className="text-sm text-gray-600">
          Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} de{' '}
          {table.getFilteredRowModel().rows.length} registros
          {columnFilters.length > 0 && ` (${data.length} total)`}
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto relative" style={{ maxHeight: '70vh' }}>
          <table className="min-w-max w-full">
            <thead className="bg-gradient-to-r from-revio-primary to-revio-secondary text-white sticky top-0 z-20">
              {table.getHeaderGroups().map(headerGroup => (
                <>
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isFixed = colunasFixas.has(header.id)
                      const leftPos = isFixed ? getLeftPosition(header.id, headerGroup.headers) : 0
                      
                      return (
                        <th
                          key={header.id}
                          className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isFixed ? 'sticky bg-revio-primary z-30' : ''
                          }`}
                          style={{
                            minWidth: header.column.columnDef.size,
                            ...(isFixed ? { left: `${leftPos}px`, boxShadow: '2px 0 5px rgba(0,0,0,0.1)' } : {})
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            <button
                              onClick={() => toggleColunaFixa(header.id)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                              title={isFixed ? 'Descongelar coluna' : 'Congelar coluna'}
                            >
                              {isFixed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                  
                  {/* Linha de filtros */}
                  {mostrarFiltros && (
                    <tr key={`${headerGroup.id}-filter`}>
                      {headerGroup.headers.map(header => {
                        const isFixed = colunasFixas.has(header.id)
                        const leftPos = isFixed ? getLeftPosition(header.id, headerGroup.headers) : 0
                        
                        return (
                          <th
                            key={`${header.id}-filter`}
                            className={`px-3 py-2 ${isFixed ? 'sticky bg-revio-primary z-30' : ''}`}
                            style={{
                              minWidth: header.column.columnDef.size,
                              ...(isFixed ? { left: `${leftPos}px`, boxShadow: '2px 0 5px rgba(0,0,0,0.1)' } : {})
                            }}
                          >
                            {header.column.getCanFilter() && (
                              <input
                                type="text"
                                value={(header.column.getFilterValue() ?? '') as string}
                                onChange={e => header.column.setFilterValue(e.target.value)}
                                placeholder="Filtrar..."
                                className="w-full px-2 py-1 text-xs border border-white/30 rounded bg-white/10 text-white placeholder-white/60 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none"
                              />
                            )}
                          </th>
                        )
                      })}
                    </tr>
                  )}
                </>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                  {row.getVisibleCells().map(cell => {
                    const isFixed = colunasFixas.has(cell.column.id)
                    const leftPos = isFixed ? getLeftPosition(cell.column.id, row.getAllCells().map(c => c.column)) : 0
                    
                    return (
                      <td
                        key={cell.id}
                        className={`px-3 py-2 text-sm ${isFixed ? 'sticky bg-white z-10' : ''}`}
                        style={{
                          minWidth: cell.column.columnDef.size,
                          ...(isFixed ? { left: `${leftPos}px`, boxShadow: '2px 0 5px rgba(0,0,0,0.05)' } : {})
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação Avançada */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Info e controle de tamanho */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </div>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {[10, 20, 50, 100, 200, 500].map(size => (
                  <option key={size} value={size}>
                    {size} por página
                  </option>
                ))}
              </select>
            </div>

            {/* Navegação */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Primeira
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-4 py-2 bg-revio-primary text-white rounded hover:bg-revio-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
              >
                Anterior
              </button>
              
              {/* Ir para página */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ir para:</span>
                <input
                  type="number"
                  min={1}
                  max={table.getPageCount()}
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  onChange={e => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0
                    table.setPageIndex(page)
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                />
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-4 py-2 bg-revio-primary text-white rounded hover:bg-revio-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
              >
                Próxima
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Última
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
