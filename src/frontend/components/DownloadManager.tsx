/**
 * DownloadManager - Componente de Gerenciamento de Downloads
 * 
 * Exibe botão de download quando há itens selecionados
 * e gerencia o processo de agendamento de downloads
 */

import { useState } from 'react'
import { Download, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useSelection } from '../hooks/useSelection'
import { httpService } from '../services/httpService'
import { useAuth } from '../contexts/AuthContext'

interface DownloadManagerProps {
  className?: string
}

interface DownloadResponse {
  downloadId: string
  message?: string
}

export default function DownloadManager({ className = '' }: DownloadManagerProps) {
  const { selectionCount, getSelectedChaves, clearSelection } = useSelection()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  // Não exibir se não há seleção
  if (selectionCount === 0) {
    return null
  }

  const handleDownload = async () => {
    if (!user) {
      setMessage({
        type: 'error',
        text: 'Usuário não autenticado'
      })
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)

      const chaves = getSelectedChaves()
      
      if (chaves.length === 0) {
        setMessage({
          type: 'error',
          text: 'Nenhum documento selecionado'
        })
        return
      }

      // Validar chaves
      const invalidChaves = chaves.filter(chave => !chave || chave.length !== 44)
      if (invalidChaves.length > 0) {
        setMessage({
          type: 'error',
          text: `${invalidChaves.length} chaves inválidas encontradas`
        })
        return
      }

      // Agendar download
      const response = await httpService.post<DownloadResponse>('/api/downloads/schedule', {
        chaves: chaves
      })

      if (!response.success) {
        setMessage({
          type: 'error',
          text: response.error || 'Erro ao agendar download'
        })
        return
      }

      // Sucesso
      setMessage({
        type: 'success',
        text: `Download agendado com sucesso! ID: ${response.data?.downloadId}`
      })

      // Limpar seleção após 2 segundos
      setTimeout(() => {
        clearSelection()
        setMessage(null)
      }, 3000)

    } catch (error) {
      console.error('Erro ao agendar download:', error)
      setMessage({
        type: 'error',
        text: 'Erro interno ao agendar download'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const dismissMessage = () => {
    setMessage(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botão de Download */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-revio border border-revio-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-lg flex items-center justify-center">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-revio-gray-800">
              {selectionCount} documento{selectionCount !== 1 ? 's' : ''} selecionado{selectionCount !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-revio-gray-500">
              Clique para agendar o download
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-revio-primary to-revio-secondary text-white rounded-lg hover:shadow-revio transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Agendando...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Confirmar Download</span>
            </>
          )}
        </button>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : message.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-3">
            {message.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {message.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            {message.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
            <span className="font-medium">{message.text}</span>
          </div>
          
          <button
            onClick={dismissMessage}
            className="p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="text-xs text-revio-gray-500 bg-revio-light p-3 rounded-lg">
        <p>
          💡 <strong>Dica:</strong> Após agendar o download, você será notificado automaticamente 
          quando o arquivo estiver pronto, mesmo navegando entre páginas.
        </p>
      </div>
    </div>
  )
}