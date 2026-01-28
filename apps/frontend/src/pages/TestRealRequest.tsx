import { useState } from 'react'
import { httpClient } from '../services/httpClient'
import { env } from '../config/env'

export default function TestRealRequest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDirectHTTP = async () => {
    setLoading(true)
    try {
      // Teste 1: HTTP direto (sem proxy)
      const response = await httpClient.get(`${env.api.externalUrl}/WebView/Consultar`, {
        params: {
          host: '10.0.0.8',
          collection: 'tbl_nfe_100',
          database: 'C67624577000145',
          pg: 1,
          size: 5,
          dtIni: '2024-11-01',
          dtFin: '2024-11-27',
        },
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })

      setResult({
        success: true,
        protocol: 'HTTP',
        status: response.status,
        data: response.data,
        headers: response.headers
      })
    } catch (error: any) {
      setResult({
        success: false,
        protocol: 'HTTP',
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
    }
    setLoading(false)
  }

  const testDirectHTTPS = async () => {
    setLoading(true)
    try {
      // Teste 2: HTTPS direto (sem proxy)
      const response = await httpClient.get(`${env.api.externalUrl.replace('http:', 'https:')}/WebView/Consultar`, {
        params: {
          host: '10.0.0.8',
          collection: 'tbl_nfe_100',
          database: 'C67624577000145',
          pg: 1,
          size: 5,
          dtIni: '2024-11-01',
          dtFin: '2024-11-27',
        },
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })

      setResult({
        success: true,
        protocol: 'HTTPS',
        status: response.status,
        data: response.data,
        headers: response.headers
      })
    } catch (error: any) {
      setResult({
        success: false,
        protocol: 'HTTPS',
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
    }
    setLoading(false)
  }

  const testViaProxy = async () => {
    setLoading(true)
    try {
      // Teste 3: Via proxy local
      const response = await httpClient.get('/WebView/Consultar', {
        params: {
          host: '10.0.0.8',
          collection: 'tbl_nfe_100',
          database: 'C67624577000145',
          pg: 1,
          size: 5,
          dtIni: '2024-11-01',
          dtFin: '2024-11-27',
        },
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })

      setResult({
        success: true,
        protocol: 'PROXY',
        status: response.status,
        data: response.data,
        headers: response.headers
      })
    } catch (error: any) {
      setResult({
        success: false,
        protocol: 'PROXY',
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
    }
    setLoading(false)
  }

  const testWithCURL = () => {
    const curlCommand = `curl -X GET "${env.api.externalUrl}/WebView/Consultar?host=10.0.0.8&collection=tbl_nfe_100&database=C67624577000145&pg=1&size=5&dtIni=2024-11-01&dtFin=2024-11-27" \\
  -H "Authorization: Bearer ${env.api.bearerToken.substring(0, 50)}..." \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json"`

    navigator.clipboard.writeText(curlCommand)
    alert('Comando cURL copiado! Cole no terminal para testar diretamente.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🔬 Teste de Requisição Real</h1>
        <p className="text-gray-600 mb-8">
          Testando diferentes protocolos e métodos para descobrir o que funciona
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Testes Disponíveis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testDirectHTTP}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              HTTP Direto
            </button>
            <button
              onClick={testDirectHTTPS}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
            >
              HTTPS Direto
            </button>
            <button
              onClick={testViaProxy}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              Via Proxy
            </button>
            <button
              onClick={testWithCURL}
              className="bg-gray-600 text-white px-4 py-3 rounded hover:bg-gray-700 font-semibold"
            >
              📋 Copiar cURL
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-lg shadow-lg p-6 ${
            result.success ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {result.success ? '✅ SUCESSO!' : '❌ FALHOU'}
              </h3>
              <span className="px-4 py-2 rounded font-bold text-lg bg-gray-200">
                {result.protocol}
              </span>
            </div>

            {result.status && (
              <div className="mb-4">
                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                  result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  Status: {result.status}
                </span>
              </div>
            )}

            {result.error && (
              <div className="mb-4 p-4 bg-red-100 rounded">
                <h4 className="font-semibold text-red-800 mb-2">Erro:</h4>
                <p className="text-red-700">{result.error}</p>
              </div>
            )}

            {result.data && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Resposta:</h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {result.headers && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Headers da Resposta:</h4>
                <pre className="bg-gray-900 text-yellow-400 p-4 rounded overflow-x-auto text-sm">
                  {JSON.stringify(result.headers, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700">Testando...</p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">💡 Dica</h3>
          <p className="text-yellow-700">
            Compare os resultados destes testes com a aplicação que está funcionando.
            Veja qual protocolo (HTTP/HTTPS) e método (direto/proxy) ela usa.
          </p>
        </div>
      </div>
    </div>
  )
}
