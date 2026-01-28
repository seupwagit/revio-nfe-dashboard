import { useState } from 'react'
import { env } from '../config/env'

export default function TestHeaders() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testWithDifferentHeaders = async () => {
    setLoading(true)
    setResults([])

    const baseParams = new URLSearchParams({
      host: env.database.host,
      collection: env.database.collection,
      database: env.database.database,
      pg: '1',
      size: '5',
      dtIni: '2024-11-01',
      dtFin: '2024-11-27',
    })

    // Apenas headers permitidos pela API Revio (descobertos via erros CORS)
    const headerCombinations = [
      {
        name: '✅ Mínimo (Authorization + Content-Type)',
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
        }
      },
      {
        name: '✅ Recomendado (+ Accept)',
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      },
      {
        name: 'Sem Bearer (token direto)',
        headers: {
          'Authorization': env.api.bearerToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      },
      {
        name: 'Bearer lowercase',
        headers: {
          'Authorization': `bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      },
    ]

    for (const combo of headerCombinations) {
      try {
        const response = await fetch(`/api/WebView/Consultar?${baseParams.toString()}`, {
          method: 'GET',
          headers: combo.headers as any,
        })

        const data = await response.json()
        
        setResults(prev => [...prev, {
          name: combo.name,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: combo.headers,
          response: data
        }])
      } catch (error: any) {
        setResults(prev => [...prev, {
          name: combo.name,
          success: false,
          error: error.message
        }])
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🔐 Teste de Headers de Segurança</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Este teste vai tentar diferentes combinações de headers HTTP para descobrir
            quais "cabeçalhos de segurança" a API Revio está esperando.
          </p>
          <button
            onClick={testWithDifferentHeaders}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Testando...' : 'Iniciar Teste de Headers'}
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`rounded-lg shadow p-6 ${
                result.success ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {result.success ? '✅' : '❌'} {result.name}
                </h3>
                {result.status && (
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {result.status} {result.statusText}
                  </span>
                )}
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Headers Enviados:</h4>
                <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto text-xs">
                  {JSON.stringify(result.headers, null, 2)}
                </pre>
              </div>

              {result.response && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Resposta:</h4>
                  <pre className="bg-gray-900 text-yellow-400 p-3 rounded overflow-x-auto text-xs">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}

              {result.error && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm text-red-700 mb-2">Erro:</h4>
                  <p className="text-red-600 text-sm">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700">Testando combinações de headers...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
