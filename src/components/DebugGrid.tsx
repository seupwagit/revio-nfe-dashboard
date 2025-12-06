/**
 * Componente de Debug para Grid
 * Mostra informações sobre o estado dos dados
 */

import { useNF } from '../contexts/NFContext'

export default function DebugGrid() {
  const { notas, loading, error, totalRegistros, collection } = useNF()

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">🐛 Debug Grid</h3>
      <div className="space-y-1 text-sm">
        <div><strong>Collection:</strong> {collection}</div>
        <div><strong>Loading:</strong> {loading ? '✅ Sim' : '❌ Não'}</div>
        <div><strong>Error:</strong> {error ? `❌ ${error.message}` : '✅ Nenhum'}</div>
        <div><strong>Total Registros (API):</strong> {totalRegistros}</div>
        <div><strong>Notas no Estado:</strong> {notas.length}</div>
        <div><strong>Tipo de notas:</strong> {typeof notas}</div>
        <div><strong>É Array?:</strong> {Array.isArray(notas) ? '✅ Sim' : '❌ Não'}</div>
        {notas.length > 0 && (
          <>
            <div><strong>Primeira nota:</strong></div>
            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(notas[0], null, 2)}
            </pre>
          </>
        )}
        {notas.length === 0 && !loading && (
          <div className="text-red-600 font-bold mt-2">
            ⚠️ Array de notas está vazio!
          </div>
        )}
      </div>
    </div>
  )
}
