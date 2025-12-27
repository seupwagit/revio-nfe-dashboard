/**
 * FloatingDownloadButton - Botão de Download Flutuante
 * 
 * Componente que aparece quando há seleção na grid e fica sempre visível.
 * Comportamento inteligente:
 * - Aparece no topo da área de conteúdo quando há itens selecionados
 * - Fica fixo (sticky) no topo quando o usuário rola a página
 * - Responsivo para desktop e mobile
 * - Sempre visível quando há seleção ativa
 */

import { useState, useEffect } from 'react'
import { Download, Loader2, CheckCircle, AlertCircle, X, ChevronDown } from 'lucide-react'
import { useSelection } from '../hooks/useSelection'
import { httpService } from '../services/httpService'
import { useAuth } from '../contexts/AuthContext'

interface FloatingDownloadButtonProps {
  /** Classe CSS adicional */
  className?: string
  /** Se deve aparecer no topo da página (sticky) */
  stickyTop?: boolean
  /** Offset do topo quando sticky */
  topOffset?: number
}

interface DownloadResponse {
  downloadId: string
  message?: string
}

export default function FloatingDownloadButton({
  className = '',
  stickyTop = true,
  topOffset = 0
}: FloatingDownloadButtonProps) {
  const { selectionCount, getSelectedChaves, clearSelection } = useSelection()
  const { user } = useAuth()
  
  // Estados do componente
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  // Auto-expandir quando há nova seleção
  useEffect(() => {
    if (selectionCount > 0) {
      setIsExpanded(true)
    }
  }, [selectionCount])

  /**
   * Handler do download
   */
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
        text: `Download agendado! ID: ${response.data?.downloadId}`
      })

      // Limpar seleção após 3 segundos
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

  /**
   * Dismiss da mensagem
   */
  const dismissMessage = () => {
    setMessage(null)
  }

  /**
   * Toggle da expansão
   */
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Não renderizar se não há seleção
  if (selectionCount === 0) {
    return null
  }

  const containerClasses = `
    ${stickyTop ? 'sticky' : 'relative'}
    ${stickyTop ? `top-${topOffset}` : ''}
    z-50 w-full
    transition-all duration-300 ease-in-out
    animate-fade-in
    ${className}
  `

  return (
    <div className={containerClasses} style={stickyTop ? { top: `${topOffset}px` } : undefined}>
      {/* Container principal */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-b border-blue-700">
        {/* Header sempre visível */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Informações de seleção */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Download className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm md:text-base">
                {selectionCount} documento{selectionCount !== 1 ? 's' : ''} selecionado{selectionCount !== 1 ? 's' : ''}
              </h3>
              <p className="text-xs md:text-sm text-blue-100">
                {isExpanded ? 'Clique em download para continuar' : 'Toque para expandir opções'}
              </p>
            </div>
          </div>

          {/* Ações principais */}
          <div className="flex items-center space-x-2">
            {/* Botão de Download (sempre visível) */}
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="flex items-center space-x-1 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Agendando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden md:inline">Confirmar Download</span>
                  <span className="md:hidden">Download</span>
                </>
              )}
            </button>

            {/* Botão de expandir/colapsar */}
            <button
              onClick={toggleExpanded}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors md:hidden"
              aria-label={isExpanded ? 'Recolher' : 'Expandir'}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Botão de limpar seleção */}
            <button
              onClick={clearSelection}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo expandido */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          {/* Mensagem de Feedback */}
          {message && (
            <div className="px-4 pb-3">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border-green-400/30 text-green-100'
                  : message.type === 'error'
                  ? 'bg-red-500/20 border-red-400/30 text-red-100'
                  : 'bg-blue-500/20 border-blue-400/30 text-blue-100'
              }`}>
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {message.type === 'success' && <CheckCircle className="h-4 w-4 text-green-300 flex-shrink-0" />}
                  {message.type === 'error' && <AlertCircle className="h-4 w-4 text-red-300 flex-shrink-0" />}
                  {message.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-300 flex-shrink-0" />}
                  <span className="font-medium text-sm truncate">{message.text}</span>
                </div>
                
                <button
                  onClick={dismissMessage}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Informações adicionais (apenas desktop) */}
          <div className="hidden md:block px-4 pb-3">
            <div className="text-xs text-blue-100 bg-white/10 p-3 rounded-lg">
              <p>
                💡 <strong>Dica:</strong> Após agendar o download, você será notificado automaticamente 
                quando o arquivo estiver pronto, mesmo navegando entre páginas.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de progresso visual */}
        <div className="h-1 bg-white/20">
          <div 
            className="h-full bg-white/40 transition-all duration-500 ease-out"
            style={{ 
              width: `${Math.min((selectionCount / 10) * 100, 100)}%` 
            }}
          />
        </div>
      </div>
    </div>
  )
}