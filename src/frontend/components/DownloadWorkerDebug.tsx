/**
 * Componente de Debug para Download Worker
 * 
 * Componente temporário para testar e diagnosticar problemas com o Web Worker
 */

import { useState } from 'react'
import { downloadMonitor } from '../services/DownloadMonitorService'

export function DownloadWorkerDebug() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testWorker = async () => {
    setIsLoading(true)
    setTestResult('Testando...')
    
    try {
      const result = await downloadMonitor.testWorkerCreation()
      
      if (result.success) {
        setTestResult('✅ Worker criado e funcionando corretamente!')
      } else {
        setTestResult(`❌ Falha no teste do worker: ${result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Erro durante teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatus = () => {
    const status = downloadMonitor.getStatus()
    return JSON.stringify(status, null, 2)
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md">
      <h3 className="font-bold text-sm mb-2">Download Worker Debug</h3>
      
      <div className="space-y-2">
        <button
          onClick={testWorker}
          disabled={isLoading}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testando...' : 'Testar Worker'}
        </button>
        
        {testResult && (
          <div className="text-xs p-2 bg-gray-100 rounded">
            {testResult}
          </div>
        )}
        
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">Status do Serviço</summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto">
            {getStatus()}
          </pre>
        </details>
      </div>
    </div>
  )
}