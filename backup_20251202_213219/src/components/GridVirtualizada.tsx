/**
 * 🚀 Grid Virtualizada - Performance para Grandes Volumes
 * Renderiza apenas linhas visíveis, suporta milhares de registros
 */

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Database, AlertCircle } from 'lucide-react'

interface GridVirtualizadaProps {
  data: any[]
  columns: Array<{ key: string; header: string; width?: number; render?: (value: any, row: any) => React.ReactNode }>
  pageSize?: number
  rowHeight?: number
}

export default function GridVirtualizada({ 
  data, 
  columns, 
  pageSize = 100,
  rowHeight = 40 
}: GridVirtualizadaProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = currentPage * pageSize
  const endIndex = Math.min(startIndex + pageSize, data.length)
  const currentData = data.slice(startIndex, endIndex)
  
  // Virtualização: calcular quais linhas estão visíveis
  const containerHeight = 600 // Altura do container
  const visibleStart = Math.floor(scrollTop / rowHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / rowHeight) + 5, // +5 para buffer
    currentData.length
  )
  
  const visibleData = currentData.slice(visibleStart, visibleEnd)
  const offsetY = visibleStart * rowHeight
  const totalHeight = currentData.length * rowHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Aviso se muitos dados
  const mostrarAviso = data.length > 10000

  return (
    <div className="space-y-4">
      {/* Aviso de Performance */}
      {mostrarAviso && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                Grande volume de dados ({data.length.toLocaleString()} registros)
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                Usando virtualização para melhor performance. Navegue pelas páginas para ver todos os dados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info e Paginação */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-bold">{startIndex + 1}</span> a{' '}
          <span className="font-bold">{endIndex}</span> de{' '}
          <span className="font-bold">{data.length.toLocaleString()}</span> registros
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Primeira página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm font-semibold px-4">
            Página {currentPage + 1} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Virtualizada */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto rounded-lg border border-gray-200"
        style={{ height: `${containerHeight}px` }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody 
              className="bg-white divide-y divide-gray-200"
              style={{ transform: `translateY(${offsetY}px)` }}
            >
              {visibleData.map((row, i) => (
                <tr 
                  key={visibleStart + i}
                  className="hover:bg-blue-50 transition-colors"
                  style={{ height: `${rowHeight}px` }}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-2 text-sm text-gray-900">
                      {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info de Performance */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span>Renderizando {visibleData.length} de {currentData.length} linhas</span>
        </div>
        <div>
          <span>Página {currentPage + 1}/{totalPages}</span>
        </div>
      </div>
    </div>
  )
}
