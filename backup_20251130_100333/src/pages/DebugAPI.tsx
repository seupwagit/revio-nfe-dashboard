import { useState } from 'react'
import { env } from '../config/env'

export default function DebugAPI() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, success: boolean, data: any) => {
    setTestResults(prev => [...prev, { test, success, data, timestamp: new Date().toISOString() }])
  }

  const testEnvVariables = () => {
    addResult('Variáveis de Ambiente', true, {
      'VITE_API_BASE_URL': env.api.baseUrl,
      'VITE_API_BEARER_TOKEN (primeiros 50 chars)': env.api.bearerToken.substring(0, 50) + '...',
      'VITE_API_BEARER_TOKEN (length)': env.api.bearerToken.length,
      'VITE_DB_HOST': env.database.host,
      'VITE_DB_DATABASE': env.database.database,
      'VITE_DB_COLLECTION': env.database.collection,
    })
  }

  const testDirectAPI = async () => {
    setLoading(true)
    try {
      const url = 'http://apinfe.revio.digital/api/WebView/Consultar'
      const params = new URLSearchParams({
        host: env.database.host,
        collection: env.database.collection,
        database: env.database.database,
        pg: '1',
        size: '10',
        dtIni: '2024-11-01',
        dtFin: '2024-11-27',
      })

      const fullUrl = `${url}?${params.toString()}`
      
      addResult('URL Completa', true, fullUrl)

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      addResult('Teste Direto API', response.ok, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      })
    } catch (error: any) {
      addResult('Teste Direto API', false, {
        error: error.message,
        stack: error.stack
      })
    }
    setLoading(false)
  }

  const testProxyAPI = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        host: env.database.host,
        collection: env.database.collection,
        database: env.database.database,
        pg: '1',
        size: '10',
        dtIni: '2024-11-01',
        dtFin: '2024-11-27',
      })

      const url = `/api/WebView/Consultar?${params.toString()}`
      
      addResult('URL via Proxy', true, url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      addResult('Teste via Proxy', response.ok, {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error: any) {
      addResult('Teste via Proxy', false, {
        error: error.message,
        stack: error.stack
      })
    }
    setLoading(false)
  }

  const testBearerFormats = async () => {
    setLoading(true)
    const formats = [
      { name: 'Bearer + token', value: `Bearer ${env.api.bearerToken}` },
      { name: 'bearer + token (lowercase)', value: `bearer ${env.api.bearerToken}` },
      { name: 'Token direto', value: env.api.bearerToken },
      { name: 'Bearer token + token', value: `Bearer token ${env.api.bearerToken}` },
    ]

    for (const format of formats) {
      try {
        const params = new URLSearchParams({
          host: env.database.host,
          collection: env.database.collection,
          database: env.database.database,
          pg: '1',
          size: '5',
          dtIni: '2024-11-01',
          dtFin: '2024-11-27',
        })

        const response = await fetch(`/api/WebView/Consultar?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': format.value,
            'Content-Type': 'application/json',
          }
        })

        const data = await response.json()
        
        addResult(`Formato: ${format.name}`, response.ok, {
          status: response.status,
          authHeader: format.value.substring(0, 70) + '...',
          response: data
        })
      } catch (error: any) {
        addResult(`Formato: ${format.name}`, false, error.message)
      }
    }
    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🔍 Debug API Revio</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Testes Disponíveis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testEnvVariables}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              1. Variáveis ENV
            </button>
            <button
              onClick={testDirectAPI}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              2. API Direta
            </button>
            <button
              onClick={testProxyAPI}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              3. Via Proxy
            </button>
            <button
              onClick={testBearerFormats}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              4. Formatos Bearer
            </button>
          </div>
          <button
            onClick={clearResults}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Limpar Resultados
          </button>
        </div>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`rounded-lg shadow p-6 ${
                result.success ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {result.success ? '✅' : '❌'} {result.test}
                </h3>
                <span className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700">Testando...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
