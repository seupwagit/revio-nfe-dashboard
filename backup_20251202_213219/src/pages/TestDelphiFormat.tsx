import { useState } from 'react'
import axios from 'axios'
import { env } from '../config/env'

export default function TestDelphiFormat() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [collection, setCollection] = useState('tbl_nfe_100')

  const testExactDelphiFormat = async () => {
    setLoading(true)
    try {
      // Replica EXATAMENTE o formato da aplicação Delphi
      const url = 'http://apinfe.revio.digital/api/WebView/Consultar'
      
      const params = {
        host: '10.0.0.8',
        database: 'C67624577000145',
        collection: collection,
        cnpjEmit: '', // Vazio como no Delphi
        cnpjDest: '', // Vazio como no Delphi
        dtIni: '2024-11-01',
        dtFin: '2024-11-27',
        pg: 1,
        size: 10
      }

      console.log('🔄 Testando com formato Delphi:')
      console.log('URL:', url)
      console.log('Params:', params)
      console.log('Token (50 chars):', env.api.bearerToken.substring(0, 50))

      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })

      setResult({
        success: true,
        collection,
        status: response.status,
        statusText: response.statusText,
        totalRecords: Array.isArray(response.data) ? response.data.length : 
                      response.data?.data?.length || 
                      response.data?.length || 0,
        data: response.data,
        headers: response.headers
      })
    } catch (error: any) {
      console.error('❌ Erro:', error)
      setResult({
        success: false,
        collection,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          params: error.config?.params,
          headers: error.config?.headers
        }
      })
    }
    setLoading(false)
  }

  const testViaProxy = async () => {
    setLoading(true)
    try {
      // Testa via proxy local
      const params = {
        host: '10.0.0.8',
        database: 'C67624577000145',
        collection: collection,
        cnpjEmit: '',
        cnpjDest: '',
        dtIni: '2024-11-01',
        dtFin: '2024-11-27',
        pg: 1,
        size: 10
      }

      console.log('🔄 Testando via PROXY:')
      console.log('Params:', params)

      const response = await axios.get('/WebView/Consultar', {
        params,
        headers: {
          'Authorization': `Bearer ${env.api.bearerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })

      setResult({
        success: true,
        collection,
        method: 'PROXY',
        status: response.status,
        statusText: response.statusText,
        totalRecords: Array.isArray(response.data) ? response.data.length : 
                      response.data?.data?.length || 
                      response.data?.length || 0,
        data: response.data,
        headers: response.headers
      })
    } catch (error: any) {
      console.error('❌ Erro:', error)
      setResult({
        success: false,
        collection,
        method: 'PROXY',
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🎯 Teste Formato Delphi</h1>
        <p className="text-gray-600 mb-8">
          Replicando EXATAMENTE o formato da aplicação Delphi que funciona
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuração</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection (tabela):
            </label>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tbl_nfe_100">tbl_nfe_100 (Notas Fiscais Eletrônicas)</option>
              <option value="tbl_cfe_100">tbl_cfe_100 (Cupons Fiscais Eletrônicos)</option>
            </select>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Parâmetros que serão enviados:</h3>
            <pre className="text-sm text-blue-700">
{`host: 10.0.0.8
database: C67624577000145
collection: ${collection}
cnpjEmit: (vazio)
cnpjDest: (vazio)
dtIni: 2024-11-01
dtFin: 2024-11-27
pg: 1
size: 10`}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={testExactDelphiFormat}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
            >
              🎯 Testar HTTP Direto
            </button>
            <button
              onClick={testViaProxy}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              🔄 Testar Via Proxy
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-lg shadow-lg p-6 ${
            result.success ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {result.success ? '✅ FUNCIONOU!' : '❌ ERRO'}
              </h3>
              <div className="text-right">
                <div className={`px-4 py-2 rounded font-bold text-lg ${
                  result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {result.status} {result.statusText}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Collection: {result.collection}
                </div>
              </div>
            </div>

            {result.success && result.totalRecords !== undefined && (
              <div className="mb-4 p-4 bg-green-100 rounded">
                <h4 className="font-semibold text-green-800 mb-2">
                  📊 Total de registros: {result.totalRecords}
                </h4>
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
                <h4 className="font-semibold text-gray-700 mb-2">Resposta da API:</h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {result.config && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Configuração da Requisição:</h4>
                <pre className="bg-gray-900 text-yellow-400 p-4 rounded overflow-x-auto text-sm">
                  {JSON.stringify(result.config, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700 font-semibold">Testando...</p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">💡 Sobre as Collections</h3>
          <ul className="text-yellow-700 space-y-2">
            <li><strong>tbl_nfe_100:</strong> Notas Fiscais Eletrônicas (NF-e)</li>
            <li><strong>tbl_cfe_100:</strong> Cupons Fiscais Eletrônicos (CF-e/SAT)</li>
          </ul>
          <p className="mt-4 text-yellow-700">
            A aplicação Delphi usa <strong>tbl_cfe_100</strong>. Se você quer notas fiscais, use <strong>tbl_nfe_100</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
