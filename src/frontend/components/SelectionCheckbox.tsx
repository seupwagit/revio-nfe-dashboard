/**
 * SelectionCheckbox - Componente de Checkbox para Seleção
 * 
 * Checkbox integrado com o sistema de seleção de documentos
 */

import { useCallback } from 'react'
import { Check } from 'lucide-react'
import { useSelection } from '../hooks/useSelection'

interface SelectionCheckboxProps {
  chave: string
  disabled?: boolean
  className?: string
}

export default function SelectionCheckbox({ 
  chave, 
  disabled = false, 
  className = '' 
}: SelectionCheckboxProps) {
  const { isSelected, toggleChave } = useSelection()
  
  const checked = isSelected(chave)

  const handleChange = useCallback(() => {
    if (!disabled && chave) {
      toggleChave(chave)
    }
  }, [chave, disabled, toggleChave])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleChange()
    }
  }, [handleChange])

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleChange}
        onKeyDown={handleKeyDown}
        className={`
          w-5 h-5 rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-revio-primary focus:ring-offset-1
          ${checked 
            ? 'bg-gradient-to-br from-revio-primary to-revio-secondary border-revio-primary text-white' 
            : 'bg-white border-revio-gray-300 hover:border-revio-primary'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-sm'
          }
        `}
        title={checked ? 'Remover da seleção' : 'Adicionar à seleção'}
      >
        {checked && (
          <Check className="h-3 w-3 mx-auto" strokeWidth={3} />
        )}
      </button>
    </div>
  )
}

/**
 * Componente de cabeçalho para seleção em massa
 */
interface SelectionHeaderProps {
  chaves: string[]
  disabled?: boolean
  className?: string
}

export function SelectionHeader({ 
  chaves, 
  disabled = false, 
  className = '' 
}: SelectionHeaderProps) {
  const { selectedChaves, selectMultiple, removeMultiple } = useSelection()

  // Verificar quantas chaves da página atual estão selecionadas
  const currentPageSelected = chaves.filter(chave => selectedChaves.has(chave))
  const allSelected = currentPageSelected.length === chaves.length && chaves.length > 0
  const someSelected = currentPageSelected.length > 0 && currentPageSelected.length < chaves.length

  const handleToggleAll = useCallback(() => {
    if (disabled || chaves.length === 0) return

    if (allSelected) {
      // Desmarcar todas da página atual
      removeMultiple(chaves)
    } else {
      // Marcar todas da página atual
      selectMultiple(chaves)
    }
  }, [chaves, allSelected, disabled, selectMultiple, removeMultiple])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggleAll()
    }
  }, [handleToggleAll])

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={allSelected ? 'true' : someSelected ? 'mixed' : 'false'}
        disabled={disabled || chaves.length === 0}
        onClick={handleToggleAll}
        onKeyDown={handleKeyDown}
        className={`
          w-5 h-5 rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-revio-primary focus:ring-offset-1
          ${allSelected 
            ? 'bg-gradient-to-br from-revio-primary to-revio-secondary border-revio-primary text-white' 
            : someSelected
            ? 'bg-gradient-to-br from-revio-primary/50 to-revio-secondary/50 border-revio-primary text-white'
            : 'bg-white border-revio-gray-300 hover:border-revio-primary'
          }
          ${disabled || chaves.length === 0
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-sm'
          }
        `}
        title={
          allSelected 
            ? 'Desmarcar todas desta página' 
            : someSelected
            ? 'Marcar todas desta página'
            : 'Marcar todas desta página'
        }
      >
        {allSelected && (
          <Check className="h-3 w-3 mx-auto" strokeWidth={3} />
        )}
        {someSelected && !allSelected && (
          <div className="w-2 h-0.5 bg-white mx-auto" />
        )}
      </button>
    </div>
  )
}