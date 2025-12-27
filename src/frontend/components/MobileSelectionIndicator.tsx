/**
 * MobileSelectionIndicator - Indicador de Seleção para Mobile
 * 
 * Componente que aparece no topo da tela em dispositivos móveis
 * quando há itens selecionados, fornecendo feedback visual constante
 */

import { useState, useEffect } from 'react'
import { Check, X, Download } from 'lucide-react'
import { useSelection } from '../hooks/useSelection'

interface MobileSelectionIndicatorProps {
  /** Callback quando o usuário clica para fazer download */
  onDownloadClick?: () => void
  /** Se deve mostrar o botão de download */
  showDownloadButton?: boolean
}

export default function MobileSelectionIndicator({
  onDownloadClick,
  showDownloadButton = true
}: MobileSelectionIndicatorProps) {
  const { selectionCount, clearSelection } = useSelection()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Controlar visibilidade com animação
  useEffect(() => {
    if (selectionCount > 0) {
      setIsVisible(true)
      // Pequeno delay para animação
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      // Aguardar animação terminar antes de esconder
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [selectionCount])

  // Não renderizar se não há seleção
  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Backdrop para mobile */}
      <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none" />
      
      {/* Indicador principal */}
      <div className={`
        md:hidden fixed top-0 left-0 right-0 z-50
        bg-gradient-to-r from-blue-500 to-blue-600 text-white
        shadow-lg border-b border-blue-700
        transform transition-all duration-300 ease-out
        ${isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Informações de seleção */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {selectionCount} selecionado{selectionCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-100">
                Toque em download para continuar
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-2">
            {/* Botão de Download */}
            {showDownloadButton && onDownloadClick && (
              <button
                onClick={onDownloadClick}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Download</span>
              </button>
            )}

            {/* Botão de Limpar */}
            <button
              onClick={clearSelection}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barra de progresso animada */}
        <div className="h-1 bg-white/20">
          <div 
            className="h-full bg-white/40 transition-all duration-500 ease-out"
            style={{ 
              width: `${Math.min((selectionCount / 100) * 100, 100)}%` 
            }}
          />
        </div>
      </div>

      {/* Spacer para compensar o indicador fixo */}
      <div className={`
        md:hidden transition-all duration-300 ease-out
        ${isAnimating ? 'h-16' : 'h-0'}
      `} />
    </>
  )
}