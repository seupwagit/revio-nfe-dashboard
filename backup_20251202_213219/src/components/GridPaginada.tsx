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

export default function GridPaginada({ data, columns, pageSize = 50 }: GridPaginadaProps) {
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

    console.log('=' .repeat(60))
    console.log('🔍 BUSCA NATURAL INICIADA')
    console.log('=' .repeat(60))
    console.log('📋 Filtros recebidos:', JSON.stringify(filtros, null, 2))
    console.log('📊 Total de registros disponíveis:', data.length)
    console.log('📊 Amostra de dados (primeiro item):', JSON.stringify(data[0], null, 2))
    console.log('📊 Amostra de dados (segundo item):', JSON.stringify(data[1], null, 2))

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
    
    // NOVO: Filtro por Tipo Doc (coluna "TIPO DOC" da grid)
    if (filtros.tipoDoc) {
      console.log('🎯 Filtrando por tipoDoc:', filtros.tipoDoc)
      console.log('📋 Valores únicos de tipo nos dados:', [...new Set(data.map(item => item.tipo))])
      
      const tipoFiltro = filtros.tipoDoc.toLowerCase().trim()
      resultado = resultado.filter(item => {
        const tipoItem = item.tipo?.toLowerCase().trim()
        const match = tipoItem === tipoFiltro || tipoItem?.includes(tipoFiltro)
        
        if (match) {
          console.log('✅ Match tipoDoc:', item.numero, item.tipo)
        }
        
        return match
      })
      
      console.log(`📊 Resultado após filtro tipoDoc: ${resultado.length} registros`)
    }
    
    if (filtros.naturezaOperacao) {
      const termo = filtros.naturezaOperacao.toLowerCase().trim()
      resultado = resultado.filter(item => 
        item.naturezaOperacao?.toLowerCase().trim().includes(termo)
      )
    }
    if (filtros.protocolada) {
      const termo = filtros.protocolada.toLowerCase().trim()
      resultado = resultado.filter(item => {
        const valor = item.protocolada?.toLowerCase().trim()
        return valor === termo || 
               valor?.includes(termo) ||
               termo.includes(valor)
      })
    }
    if (filtros.statusManifestacao) {
      const termo = filtros.statusManifestacao.toLowerCase().trim()
      resultado = resultado.filter(item => 
        item.statusManifestacao?.toLowerCase().trim().includes(termo)
      )
    }
    if (filtros.serie) {
      const termo = filtros.serie.toString().trim()
      resultado = resultado.filter(item => item.serie?.toString().trim() === termo)
    }
    if (filtros.modelo) {
      const termo = filtros.modelo.toString().trim()
      resultado = resultado.filter(item => item.modelo?.toString().trim() === termo)
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
      console.log('🎯 Filtrando por status:', filtros.status)
      console.log('📊 Total de registros ANTES do filtro:', resultado.length)
      console.log('📋 Valores únicos de status nos dados:', [...new Set(data.map(item => item.status))])
      console.log('📋 Primeiros 5 status:', data.slice(0, 5).map(item => ({ numero: item.numero, status: item.status })))
      
      let matchCount = 0
      resultado = resultado.filter(item => {
        const statusItem = item.status?.toLowerCase().trim()
        const statusFiltro = filtros.status.toLowerCase().trim()
        
        console.log(`🔍 Comparando: "${statusItem}" com "${statusFiltro}"`)
        
        // Aceita match exato ou parcial
        const match = statusItem === statusFiltro || 
                     statusItem?.includes(statusFiltro) ||
                     statusFiltro.includes(statusItem)
        
        if (match) {
          matchCount++
          console.log(`✅ Match #${matchCount}:`, item.numero, `"${item.status}"`)
        }
        
        return match
      })
      
      console.log(`📊 Resultado após filtro status: ${resultado.length} de ${data.length} registros`)
      console.log(`📊 Total de matches encontrados: ${matchCount}`)
    }
    if (filtros.cnpj) {
      const termo = filtros.cnpj.trim()
      resultado = resultado.filter(item => 
        item.emitente?.cnpj?.includes(termo) || 
        item.destinatario?.cnpj?.includes(termo) ||
        item.destinatario?.cpfCnpj?.includes(termo)
      )
    }
    if (filtros.numero) {
      const termo = filtros.numero.trim()
      resultado = resultado.filter(item => item.numero?.toString().includes(termo))
    }
    if (filtros.emitente) {
      const termo = filtros.emitente.toLowerCase().trim()
      resultado = resultado.filter(item => 
        item.emitente?.razaoSocial?.toLowerCase().trim().includes(termo) ||
        item.emitente?.nomeFantasia?.toLowerCase().trim().includes(termo)
      )
    }
    if (filtros.destinatario) {
      const termo = filtros.destinatario.toLowerCase().trim()
      resultado = resultado.filter(item => 
        item.destinatario?.razaoSocial?.toLowerCase().trim().includes(termo) ||
        item.destinatario?.nome?.toLowerCase().trim().includes(termo)
      )
    }
    if (filtros.uf) {
      const termo = filtros.uf.toUpperCase().trim()
      resultado = resultado.filter(item => 
        item.emitente?.uf?.toUpperCase().trim() === termo ||
        item.destinatario?.uf?.toUpperCase().trim() === termo
      )
    }
    if (filtros.municipio) {
      const termo = filtros.municipio.toLowerCase().trim()
      resultado = resultado.filter(item => 
        item.emitente?.municipio?.toLowerCase().trim().includes(termo) ||
        item.destinatario?.municipio?.toLowerCase().trim().includes(termo)
      )
    }
    // Filtro de data (pode ter só início, só fim, ou ambos)
    if (filtros.dataInicio || filtros.dataFim) {
      console.log('📅 Filtrando por data:', { dataInicio: filtros.dataInicio, dataFim: filtros.dataFim })
      console.log('📋 Primeiras 3 datas:', resultado.slice(0, 3).map(item => ({ numero: item.numero, dataEmissao: item.dataEmissao })))
      
      resultado = resultado.filter(item => {
        if (!item.dataEmissao) return false
        
        const dataEmissao = new Date(item.dataEmissao)
        
        // Se tem data início, verificar se é >= início
        if (filtros.dataInicio) {
          const inicio = new Date(filtros.dataInicio)
          if (dataEmissao < inicio) {
            return false
          }
        }
        
        // Se tem data fim, verificar se é <= fim
        if (filtros.dataFim) {
          const fim = new Date(filtros.dataFim)
          // Adicionar 23:59:59 ao fim do dia
          fim.setHours(23, 59, 59, 999)
          if (dataEmissao > fim) {
            return false
          }
        }
        
        return true
      })
      
      console.log(`📊 Resultado após filtro data: ${resultado.length} registros`)
    }
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase().trim()
      resultado = resultado.filter(item => 
        JSON.stringify(item).toLowerCase().includes(busca)
      )
    }

    console.log('=' .repeat(60))
    console.log('✅ BUSCA NATURAL CONCLUÍDA')
    console.log('📊 Registros ANTES dos filtros:', data.length)
    console.log('📊 Registros DEPOIS dos filtros:', resultado.length)
    console.log('📊 Filtros aplicados:', Object.keys(filtros).join(', '))
    console.log('=' .repeat(60))
    
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
                          key={`filter-input-${header.id}`}
                          id={`filter-input-${header.id}`}
                          type="text"
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={(e) => {
                            header.column.setFilterValue(e.target.value)
                          }}
                          placeholder={`Filtrar ${header.id}...`}
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
            {[25, 50, 100, 250, 500].map((size) => (
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
