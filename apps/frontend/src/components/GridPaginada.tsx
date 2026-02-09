import { FilterItem } from '@fiscal/shared'
import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Lock, Unlock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNF } from '../contexts/NFContext'
import BuscaNatural from './BuscaNatural'

// Função de filtro customizada para datas no formato brasileiro
const dateFilterFn: FilterFn<any> = (row, columnId, filterValue, _addMeta) => {
  if (!filterValue) return true
  
  const cellValue = row.getValue(columnId) as string
  if (!cellValue) return false
  
  try {
    const cellDate = new Date(cellValue)
    if (isNaN(cellDate.getTime())) return false
    
    // Formato brasileiro: dd/mm/aaaa
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
    const match = filterValue.match(dateRegex)
    
    if (match) {
      const dia = match[1].padStart(2, '0')
      const mes = match[2].padStart(2, '0')
      const ano = match[3]
      const filterDate = new Date(`${ano}-${mes}-${dia}`)
      
      // Suporta operadores: >01/12/2024, <31/12/2024, ou 01/12/2024 (exato)
      if (filterValue.startsWith('>')) {
        return cellDate > filterDate
      } else if (filterValue.startsWith('<')) {
        return cellDate < filterDate
      } else {
        // Comparação exata (mesmo dia)
        const cellDay = cellDate.toISOString().split('T')[0]
        const filterDay = filterDate.toISOString().split('T')[0]
        return cellDay === filterDay
      }
    }
    
    // Fallback: busca parcial no texto formatado
    const formattedDate = cellDate.toLocaleDateString('pt-BR')
    return formattedDate.includes(filterValue)
  } catch {
    return false
  }
}

// Função de filtro customizada para valores numéricos
const numberFilterFn: FilterFn<any> = (row, columnId, filterValue, _addMeta) => {
  if (!filterValue) return true
  
  const cellValue = row.getValue(columnId)
  if (cellValue === null || cellValue === undefined) return false
  
  const numValue = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue))
  if (isNaN(numValue)) return false
  
  // Suporta operadores: >1000, <5000, ou 1000 (exato)
  if (filterValue.startsWith('>')) {
    const threshold = parseFloat(filterValue.substring(1))
    return numValue > threshold
  } else if (filterValue.startsWith('<')) {
    const threshold = parseFloat(filterValue.substring(1))
    return numValue < threshold
  } else {
    const threshold = parseFloat(filterValue)
    if (isNaN(threshold)) {
      // Fallback: busca parcial no texto
      return numValue.toString().includes(filterValue)
    }
    return numValue === threshold
  }
}

interface GridPaginadaProps {
  data: any[]
  columns: ColumnDef<any, any>[]
  pageSize?: number
  hideBusca?: boolean // Nova propriedade para ocultar busca
}

export default function GridPaginada({ data, columns, pageSize = 50, hideBusca = false }: GridPaginadaProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [colunasFixas, setColunasFixas] = useState<Set<string>>(new Set(['numero']))
  const [mostrarFiltrosCabecalho, setMostrarFiltrosCabecalho] = useState(false)
  const [dadosFiltrados, setDadosFiltrados] = useState(data)
  const [usandoBuscaNatural, setUsandoBuscaNatural] = useState(false)
  const { filtros, setFiltros } = useNF()

  // Atualizar dados filtrados quando data mudar
  useEffect(() => {
    if (!usandoBuscaNatural) {
      setDadosFiltrados(data)
    }
  }, [data, usandoBuscaNatural])

  // Sincronizar filtros de coluna com o contexto para filtragem no servidor
  useEffect(() => {
    // Implementar debounce para evitar requisições a cada tecla
    const handler = setTimeout(() => {
      const dynamicFilters: FilterItem[] = columnFilters.map(f => {
        let operator: any = 'contains';
        let value = f.value;

        if (typeof value === 'string') {
          if (value.startsWith('>')) {
            operator = 'gte';
            value = value.substring(1).trim();
          } else if (value.startsWith('<')) {
            operator = 'lte';
            value = value.substring(1).trim();
          }
        }

        return {
          field: f.id,
          operator,
          value
        };
      });

      // Só atualiza se houver mudança real nos filtros dinâmicos para evitar loop
      const currentFiltersStr = JSON.stringify(dynamicFilters);
      const existingFiltersStr = JSON.stringify(filtros.dynamicFilters || []);

      if (currentFiltersStr !== existingFiltersStr) {
        console.log('🔄 Sincronizando filtros de coluna com o servidor (debounced):', dynamicFilters);
        setFiltros({
          ...filtros,
          dynamicFilters
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [columnFilters]);

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
    // Busca por empresa (emitente OU destinatário)
    if (filtros.empresa) {
      const termo = filtros.empresa.toLowerCase().trim()
      console.log('🎯 Filtrando por empresa (emitente OU destinatário):', termo)
      
      resultado = resultado.filter(item => {
        const emitRazao = item.emitente?.razaoSocial?.toLowerCase().trim() || ''
        const emitFantasia = item.emitente?.nomeFantasia?.toLowerCase().trim() || ''
        const destRazao = item.destinatario?.razaoSocial?.toLowerCase().trim() || ''
        const destNome = item.destinatario?.nome?.toLowerCase().trim() || ''
        
        const match = emitRazao.includes(termo) || 
                     emitFantasia.includes(termo) || 
                     destRazao.includes(termo) || 
                     destNome.includes(termo)
        
        if (match) {
          console.log('✅ Match empresa:', item.emitente?.razaoSocial || item.destinatario?.razaoSocial)
        }
        
        return match
      })
      
      console.log(`📊 Resultado após filtro empresa: ${resultado.length} registros`)
    }
    
    if (filtros.emitente) {
      const termo = filtros.emitente.toLowerCase().trim()
      console.log('🎯 Filtrando por emitente:', termo)
      
      resultado = resultado.filter(item => {
        const razaoSocial = item.emitente?.razaoSocial?.toLowerCase().trim() || ''
        const nomeFantasia = item.emitente?.nomeFantasia?.toLowerCase().trim() || ''
        const match = razaoSocial.includes(termo) || nomeFantasia.includes(termo)
        
        if (match) {
          console.log('✅ Match emitente:', item.emitente?.razaoSocial)
        }
        
        return match
      })
      
      console.log(`📊 Resultado após filtro emitente: ${resultado.length} registros`)
    }
    
    if (filtros.destinatario) {
      const termo = filtros.destinatario.toLowerCase().trim()
      console.log('🎯 Filtrando por destinatario:', termo)
      
      resultado = resultado.filter(item => {
        const razaoSocial = item.destinatario?.razaoSocial?.toLowerCase().trim() || ''
        const nome = item.destinatario?.nome?.toLowerCase().trim() || ''
        const match = razaoSocial.includes(termo) || nome.includes(termo)
        
        if (match) {
          console.log('✅ Match destinatario:', item.destinatario?.razaoSocial || item.destinatario?.nome)
        }
        
        return match
      })
      
      console.log(`📊 Resultado após filtro destinatario: ${resultado.length} registros`)
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
      console.log('📋 Primeiras 5 datas:', resultado.slice(0, 5).map(item => ({ numero: item.numero, dataEmissao: item.dataEmissao })))
      
      let matchCount = 0
      resultado = resultado.filter(item => {
        if (!item.dataEmissao) {
          return false
        }
        
        // Extrair apenas a data (YYYY-MM-DD) ignorando hora/timezone
        // Suporta formatos: "2025-12-01T00:00:00.000Z", "2025-12-01", etc.
        let dataEmissaoStr = item.dataEmissao
        if (typeof dataEmissaoStr === 'string') {
          dataEmissaoStr = dataEmissaoStr.split('T')[0] // Pega só YYYY-MM-DD
        } else if (dataEmissaoStr instanceof Date) {
          dataEmissaoStr = dataEmissaoStr.toISOString().split('T')[0]
        }
        
        // Comparar strings de data diretamente (mais confiável que Date objects)
        const dataInicioStr = filtros.dataInicio || '0000-00-00'
        const dataFimStr = filtros.dataFim || '9999-12-31'
        
        const passou = dataEmissaoStr >= dataInicioStr && dataEmissaoStr <= dataFimStr
        
        if (passou) {
          matchCount++
          if (matchCount <= 5) {
            console.log(`✅ Match #${matchCount}:`, { 
              numero: item.numero, 
              dataEmissao: dataEmissaoStr,
              filtroInicio: dataInicioStr,
              filtroFim: dataFimStr
            })
          }
        }
        
        return passou
      })
      
      console.log(`📊 Resultado após filtro data: ${resultado.length} registros (${matchCount} matches)`)
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
    filterFns: {
      dateFilter: dateFilterFn,
      numberFilter: numberFilterFn,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      // Aplicar filtro customizado baseado no tipo de coluna
      if (columnId === 'dataEmissao') {
        return dateFilterFn(row, columnId, filterValue, {} as any)
      }
      if (columnId === 'valorTotal' || columnId.includes('valor')) {
        return numberFilterFn(row, columnId, filterValue, {} as any)
      }
      // Filtro padrão para texto
      const cellValue = row.getValue(columnId)
      return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase())
    },
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
      {/* Busca Natural - Ocultar se hideBusca for true */}
      {!hideBusca && (
        <BuscaNatural onSearch={handleBuscaNatural} onClear={handleClearBusca} />
      )}

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
                {headerGroup.headers.map((header) => {
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
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
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
                {table.getHeaderGroups()[0].headers.map((header) => {
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
                        <div className="relative group">
                          <input
                            key={`filter-input-${header.id}`}
                            id={`filter-input-${header.id}`}
                            type="text"
                            value={(header.column.getFilterValue() ?? '') as string}
                            onChange={(e) => {
                              header.column.setFilterValue(e.target.value)
                            }}
                            placeholder={header.id === 'dataEmissao' ? 'dd/mm/aaaa' : `Filtrar ${header.id}...`}
                            className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            title={
                              header.id === 'dataEmissao' 
                                ? 'Digite: 01/12/2024 ou >01/12/2024 ou <31/12/2024' 
                                : header.id === 'valorTotal' || header.id.includes('valor')
                                ? 'Digite: 1000 ou >1000 ou <5000'
                                : 'Digite texto para buscar (parcial)'
                            }
                          />
                          {/* Tooltip */}
                          <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-30 w-48 p-2 text-xs bg-gray-900 text-white rounded shadow-lg">
                            {header.id === 'dataEmissao' ? (
                              <>
                                <strong>Data:</strong><br/>
                                • 01/12/2024 (exata)<br/>
                                • &gt;01/12/2024 (depois)<br/>
                                • &lt;31/12/2024 (antes)
                              </>
                            ) : header.id === 'valorTotal' || header.id.includes('valor') ? (
                              <>
                                <strong>Valor:</strong><br/>
                                • 1000 (exato)<br/>
                                • &gt;1000 (maior)<br/>
                                • &lt;5000 (menor)
                              </>
                            ) : (
                              <>
                                <strong>Texto:</strong><br/>
                                Busca parcial<br/>
                                (contém o texto)
                              </>
                            )}
                          </div>
                        </div>
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
                {row.getVisibleCells().map((cell) => {
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
