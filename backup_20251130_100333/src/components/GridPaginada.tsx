import { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Lock, Unlock } from 'lucide-react'
import BuscaNatural from './BuscaNatural'

interface GridPaginadaProps {
  data: any[]
  columns: ColumnDef<any, any>[]
  pageSize?: number
}

export default function GridPaginada({ data, columns, pageSize = 1000 }: GridPaginadaProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [colunasFixas, setColunasFixas] = useState<Set<string>>(new Set(['numero']))
  const [mostrarFiltrosCabecalho, setMostrarFiltrosCabecalho] = useState(false)
  const [dadosFiltrados, setDadosFiltrados] = useState(data)
  const [usandoBuscaNatural, setUsandoBuscaNatural] = useState(false)

  // Atualizar dados filtrados quando data mudar
  useEffect(() => {
    if (!usandoBuscaNatural) {
      setDadosFiltrados(data)
    }
  }, [data, usandoBuscaNatural])

  const handleBuscaNatural = (filtros: any) => {
    setUsandoBuscaNatural(true)
    setColumnFilters([]) // Limpar filtros de coluna quando usar busca natural
    let resultado = [...data]

    console.log('🔍 Filtros recebidos:', filtros)
    console.log('📊 Amostra de dados (primeiro item):', data[0])

    // Aplicar filtros
    if (filtros.tipoOperacao) {
      console.log('🎯 Filtrando por tipoOperacao:', filtros.tipoOperacao)
      console.log('📋 Valores únicos de tipoOperacao nos dados:', [...new Set(data.map(item => item.tipoOperacao))])
      
      resultado = resultado.filter(item => {
        const tipoItem = item.tipoOperacao?.toString().toLowerCase()
        const tipoFiltro = filtros.tipoOperacao.toLowerCase()
        
        // Aceita múltiplos formatos: "entrada", "0", "Entrada"
        const match = tipoItem === tipoFiltro || 
                     (tipoFiltro === 'entrada' && (tipoItem === '0' || tipoItem === 'entrada')) ||
                     (tipoFiltro === 'saída' && (tipoItem === '1' || tipoItem === 'saída' || tipoItem === 'saida'))
        
        if (match) {
          console.log('✅ Match encontrado:', item.numero, item.tipoOperacao)
        }
        
        return match
      })
      
      console.log(`📊 Resultado após filtro: ${resultado.length} de ${data.length} registros`)
    }
    if (filtros.naturezaOperacao) {
      resultado = resultado.filter(item => 
        item.naturezaOperacao?.toLowerCase().includes(filtros.naturezaOperacao.toLowerCase())
      )
    }
    if (filtros.protocolada) {
      resultado = resultado.filter(item => 
        item.protocolada?.toLowerCase() === filtros.protocolada.toLowerCase()
      )
    }
    if (filtros.statusManifestacao) {
      resultado = resultado.filter(item => 
        item.statusManifestacao?.toLowerCase().includes(filtros.statusManifestacao.toLowerCase())
      )
    }
    if (filtros.serie) {
      resultado = resultado.filter(item => item.serie?.toString() === filtros.serie)
    }
    if (filtros.modelo) {
      resultado = resultado.filter(item => item.modelo?.toString() === filtros.modelo)
    }
    if (filtros.valorMin !== undefined) {
      resultado = resultado.filter(item => (item.valorTotal || 0) >= filtros.valorMin)
    }
    if (filtros.valorMax !== undefined) {
      resultado = resultado.filter(item => (item.valorTotal || 0) <= filtros.valorMax)
    }
    // Filtros de impostos específicos
    if (filtros.valorICMSMin !== undefined) {
      resultado = resultado.filter(item => (item.totais?.valorICMS || 0) >= filtros.valorICMSMin)
    }
    if (filtros.valorIPIMin !== undefined) {
      resultado = resultado.filter(item => (item.totais?.valorIPI || 0) >= filtros.valorIPIMin)
    }
    if (filtros.valorPISMin !== undefined) {
      resultado = resultado.filter(item => (item.totais?.valorPIS || 0) >= filtros.valorPISMin)
    }
    if (filtros.valorCOFINSMin !== undefined) {
      resultado = resultado.filter(item => (item.totais?.valorCOFINS || 0) >= filtros.valorCOFINSMin)
    }
    if (filtros.valorFreteMin !== undefined) {
      resultado = resultado.filter(item => (item.totais?.valorFrete || 0) >= filtros.valorFreteMin)
    }
    if (filtros.valorSeguroMin !== undefined) {
      resultado = resultado.filter(item => (item.totais?.valorSeguro || 0) >= filtros.valorSeguroMin)
    }
    if (filtros.valorDescontoMin !== undefined) {
      resultado = resultado.filter(item => (item.totais?.valorDesconto || 0) >= filtros.valorDescontoMin)
    }
    if (filtros.status) {
      resultado = resultado.filter(item => item.status?.toLowerCase() === filtros.status.toLowerCase())
    }
    if (filtros.cnpj) {
      resultado = resultado.filter(item => 
        item.emitente?.cnpj?.includes(filtros.cnpj) || 
        item.destinatario?.cnpj?.includes(filtros.cnpj)
      )
    }
    if (filtros.numero) {
      resultado = resultado.filter(item => item.numero?.toString().includes(filtros.numero))
    }
    if (filtros.emitente) {
      resultado = resultado.filter(item => 
        item.emitente?.razaoSocial?.toLowerCase().includes(filtros.emitente.toLowerCase()) ||
        item.emitente?.nomeFantasia?.toLowerCase().includes(filtros.emitente.toLowerCase())
      )
    }
    if (filtros.destinatario) {
      resultado = resultado.filter(item => 
        item.destinatario?.razaoSocial?.toLowerCase().includes(filtros.destinatario.toLowerCase()) ||
        item.destinatario?.nome?.toLowerCase().includes(filtros.destinatario.toLowerCase())
      )
    }
    if (filtros.uf) {
      resultado = resultado.filter(item => 
        item.emitente?.uf?.toUpperCase() === filtros.uf ||
        item.destinatario?.uf?.toUpperCase() === filtros.uf
      )
    }
    if (filtros.municipio) {
      resultado = resultado.filter(item => 
        item.emitente?.municipio?.toLowerCase().includes(filtros.municipio.toLowerCase()) ||
        item.destinatario?.municipio?.toLowerCase().includes(filtros.municipio.toLowerCase())
      )
    }
    if (filtros.dataInicio && filtros.dataFim) {
      resultado = resultado.filter(item => {
        const dataEmissao = new Date(item.dataEmissao)
        const inicio = new Date(filtros.dataInicio)
        const fim = new Date(filtros.dataFim)
        return dataEmissao >= inicio && dataEmissao <= fim
      })
    }
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase()
      resultado = resultado.filter(item => 
        JSON.stringify(item).toLowerCase().includes(busca)
      )
    }

    setDadosFiltrados(resultado)
  }

  const handleClearBusca = () => {
    setUsandoBuscaNatural(false)
    setDadosFiltrados(data)
    setColumnFilters([]) // Limpar filtros de coluna também
  }

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

  const table = useReactTable({
    data: usandoBuscaNatural ? dadosFiltrados : data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const totalPages = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalRecords = dadosFiltrados.length
  const startRecord = table.getState().pagination.pageIndex * pageSize + 1
  const endRecord = Math.min(startRecord + pageSize - 1, totalRecords)

  return (
    <div className="space-y-4">
      {/* Busca Natural */}
      <BuscaNatural onSearch={handleBuscaNatural} onClear={handleClearBusca} />

      {/* Info e Busca Tradicional */}
      <div className="flex justify-between items-center gap-4">
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-bold">{startRecord}</span> a <span className="font-bold">{endRecord}</span> de{' '}
          <span className="font-bold">{totalRecords.toLocaleString('pt-BR')}</span> registros
          {dadosFiltrados.length < data.length && (
            <span className="ml-2 text-purple-600 font-semibold">
              (filtrado de {data.length.toLocaleString('pt-BR')})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMostrarFiltrosCabecalho(!mostrarFiltrosCabecalho)
              if (!mostrarFiltrosCabecalho) {
                // Ao ativar filtros de coluna, desativar busca natural
                setUsandoBuscaNatural(false)
                setDadosFiltrados(data)
              }
            }}
            className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 text-sm font-semibold ${
              mostrarFiltrosCabecalho
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Mostrar/ocultar filtros no cabeçalho"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {columnFilters.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {columnFilters.length}
              </span>
            )}
          </button>
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Busca rápida..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 relative">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isFixed = colunasFixas.has(header.id)
                  const leftPos = isFixed ? getLeftPosition(header.id, headerGroup.headers) : undefined
                  
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition-colors ${
                        isFixed ? 'sticky z-20 shadow-lg' : ''
                      }`}
                      style={{ 
                        width: header.getSize(),
                        left: isFixed ? `${leftPos}px` : undefined,
                        backgroundColor: isFixed ? '#1e40af' : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center justify-between gap-2">
                          <div 
                            className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleColunaFixa(header.id)
                            }}
                            className="p-1 hover:bg-blue-800 rounded transition-colors"
                            title={isFixed ? 'Descongelar coluna' : 'Congelar coluna'}
                          >
                            {isFixed ? (
                              <Unlock className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
            {mostrarFiltrosCabecalho && (
              <tr>
                {table.getHeaderGroups()[0].headers.map((header, index) => {
                  const isFixed = colunasFixas.has(header.id)
                  const leftPos = isFixed ? getLeftPosition(header.id, table.getHeaderGroups()[0].headers) : undefined
                  
                  return (
                    <th
                      key={`filter-${header.id}`}
                      className={`px-2 py-2 bg-blue-500 ${isFixed ? 'sticky z-20' : ''}`}
                      style={{ 
                        left: isFixed ? `${leftPos}px` : undefined,
                      }}
                    >
                      {header.column.getCanFilter() ? (
                        <input
                          type="text"
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={(e) => {
                            header.column.setFilterValue(e.target.value)
                          }}
                          placeholder={`Filtrar...`}
                          className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                      ) : null}
                    </th>
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                {row.getVisibleCells().map((cell, index) => {
                  const isFixed = colunasFixas.has(cell.column.id)
                  const leftPos = isFixed ? getLeftPosition(cell.column.id, row.getVisibleCells().map(c => c.column)) : undefined
                  
                  return (
                    <td 
                      key={cell.id} 
                      className={`px-4 py-3 text-sm text-gray-900 ${isFixed ? 'sticky z-10 bg-white shadow-md' : ''}`}
                      style={{ 
                        left: isFixed ? `${leftPos}px` : undefined,
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

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Primeira página"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-700 px-4">
            Página <span className="font-bold">{currentPage}</span> de <span className="font-bold">{totalPages}</span>
          </span>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Próxima página"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Última página"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Ir para página:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            defaultValue={currentPage}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Registros por página:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[100, 500, 1000, 2000, 5000].map((size) => (
              <option key={size} value={size}>
                {size.toLocaleString('pt-BR')}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
