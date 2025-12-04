import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  ColumnDef
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react'
import BuscaNatural from './BuscaNatural'

interface GridPaginadaInteligenteProps<T> {
  columns: ColumnDef<T, any>[]
  collection: 'nfe' | 'cte' | 'cfe'
  filtros: any
  initialPageSize?: number
}

export default function GridPaginadaInteligente<T>({
  columns,
  collection,
  filtros,
  initialPageSize = 1000
}: GridPaginadaInteligenteProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [paginaAtual, setPaginaAtual] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [loading, setLoading] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [buscaNatural, setBuscaNatural] = useState('')
  
  // Cache de páginas carregadas (key: `${pageSize}-${pagina}`)
  const [cache, setCache] = useState<Map<string, T[]>>(new Map())

  const totalPaginas = Math.ceil(totalRegistros / pageSize)

  // Buscar total de registros
  const buscarTotal = useCallback(async () => {
    try {
      const token = localStorage.getItem('revio_token')
      const cnpj = localStorage.getItem('revio_cnpj')
      
      if (!token || !cnpj) return

      const collectionMap: Record<string, string> = {
        nfe: 'NotasFiscais',
        cte: 'ConhecimentosTransporte',
        cfe: 'CuponsFiscais'
      }

      const url = `https://api.revio.com.br/api/v1/${collectionMap[collection]}/total`
      
      const params = new URLSearchParams()
      params.append('cnpj', cnpj)
      
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim)
      if (filtros.status) params.append('status', filtros.status)
      if (filtros.tipoOperacao) params.append('tipoOperacao', filtros.tipoOperacao)

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setTotalRegistros(result.total || 0)
      }
    } catch (error) {
      console.error('Erro ao buscar total:', error)
    }
  }, [collection, filtros])

  // Buscar dados de uma página específica
  const buscarPagina = useCallback(async (pagina: number, size: number) => {
    const cacheKey = `${size}-${pagina}`
    
    // Verificar cache primeiro
    if (cache.has(cacheKey)) {
      console.log(`📦 Usando cache para página ${pagina + 1}`)
      setData(cache.get(cacheKey)!)
      return
    }

    setLoading(true)
    console.log(`🔄 Carregando página ${pagina + 1} (${size} registros)...`)
    
    try {
      const token = localStorage.getItem('revio_token')
      const cnpj = localStorage.getItem('revio_cnpj')
      
      if (!token || !cnpj) {
        console.error('❌ Token ou CNPJ não encontrado')
        setLoading(false)
        return
      }

      const collectionMap: Record<string, string> = {
        nfe: 'NotasFiscais',
        cte: 'ConhecimentosTransporte',
        cfe: 'CuponsFiscais'
      }

      const url = `https://api.revio.com.br/api/v1/${collectionMap[collection]}`
      
      const params = new URLSearchParams()
      params.append('cnpj', cnpj)
      params.append('size', size.toString())
      params.append('skip', (pagina * size).toString())
      
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim)
      if (filtros.status) params.append('status', filtros.status)
      if (filtros.tipoOperacao) params.append('tipoOperacao', filtros.tipoOperacao)

      console.log(`📡 URL: ${url}?${params}`)

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        const dados = result.data || result.items || result || []
        
        console.log(`✅ Recebidos ${dados.length} registros`)
        
        // Atualizar cache
        setCache(prev => new Map(prev).set(cacheKey, dados))
        setData(dados)
      } else {
        console.error(`❌ Erro na resposta: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar página:', error)
    } finally {
      setLoading(false)
    }
  }, [collection, filtros, cache])

  // Buscar total ao montar ou quando filtros mudarem
  useEffect(() => {
    console.log('🔄 Filtros mudaram, buscando total...')
    buscarTotal()
    setCache(new Map()) // Limpar cache quando filtros mudarem
    setPaginaAtual(0)
  }, [collection, JSON.stringify(filtros)])

  // Buscar dados da página atual
  useEffect(() => {
    buscarPagina(paginaAtual, pageSize)
  }, [paginaAtual, pageSize, buscarPagina])
  
  // Mudar tamanho de página
  const mudarTamanhoPagina = (novoTamanho: number) => {
    console.log(`📏 Mudando tamanho de página para ${novoTamanho}`)
    setPageSize(novoTamanho)
    setCache(new Map()) // Limpar cache
    setPaginaAtual(0) // Voltar para primeira página
  }

  // Aplicar busca natural
  const dadosFiltrados = useMemo(() => {
    if (!buscaNatural.trim()) return data

    const termo = buscaNatural.toLowerCase()
    return data.filter((item: any) => {
      return Object.values(item).some(valor => 
        String(valor).toLowerCase().includes(termo)
      )
    })
  }, [data, buscaNatural])

  const table = useReactTable({
    data: dadosFiltrados,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: totalPaginas
  })

  const irParaPagina = (pagina: number) => {
    if (pagina >= 0 && pagina < totalPaginas) {
      setPaginaAtual(pagina)
    }
  }

  return (
    <div className="space-y-4">
      {/* Busca Natural */}
      <BuscaNatural
        onSearch={(filtros) => {
          // Aplicar filtros da busca natural
          console.log('Busca natural:', filtros);
        }}
        onClear={() => setBuscaNatural('')}
      />

      {/* Info e Controles */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div>
            Mostrando {totalRegistros > 0 ? paginaAtual * pageSize + 1 : 0} - {Math.min((paginaAtual + 1) * pageSize, totalRegistros)} de {totalRegistros.toLocaleString('pt-BR')} registros
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Registros por página:</label>
            <select
              value={pageSize}
              onChange={e => mudarTamanhoPagina(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
              disabled={loading}
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
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-revio-primary" />
                      <span className="text-gray-600">Carregando página {paginaAtual + 1}...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
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
            onClick={() => irParaPagina(0)}
            disabled={paginaAtual === 0 || loading}
            className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => irParaPagina(paginaAtual - 1)}
            disabled={paginaAtual === 0 || loading}
            className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => irParaPagina(paginaAtual + 1)}
            disabled={paginaAtual >= totalPaginas - 1 || loading}
            className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => irParaPagina(totalPaginas - 1)}
            disabled={paginaAtual >= totalPaginas - 1 || loading}
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
              if (!isNaN(pagina)) irParaPagina(pagina)
            }}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            disabled={loading}
          />
        </div>

        <div className="text-sm text-gray-600">
          {cache.size} {cache.size === 1 ? 'página' : 'páginas'} em cache
        </div>
      </div>
    </div>
  )
}
