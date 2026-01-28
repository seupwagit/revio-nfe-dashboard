/**
 * useSelection - Hook para gerenciar seleção de documentos
 * 
 * Hook React que integra com o SelectionManager para
 * gerenciar estado de seleção de documentos
 */

import { useState, useEffect, useCallback } from 'react'
import { selectionManager } from '../services/SelectionManager'

export function useSelection() {
  const [selectedChaves, setSelectedChaves] = useState<Set<string>>(new Set())
  const [selectionCount, setSelectionCount] = useState(0)

  // Atualizar estado quando seleção mudar
  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedChaves(new Set(newSelection))
    setSelectionCount(newSelection.size)
  }, [])

  useEffect(() => {
    // Carregar seleção inicial
    const initialSelection = new Set(selectionManager.getSelectedChaves())
    setSelectedChaves(initialSelection)
    setSelectionCount(initialSelection.size)

    // Adicionar listener
    selectionManager.addListener(handleSelectionChange)

    // Cleanup
    return () => {
      selectionManager.removeListener(handleSelectionChange)
    }
  }, [handleSelectionChange])

  // Funções de controle
  const addChave = useCallback((chave: string) => {
    selectionManager.addChave(chave)
  }, [])

  const removeChave = useCallback((chave: string) => {
    selectionManager.removeChave(chave)
  }, [])

  const toggleChave = useCallback((chave: string) => {
    selectionManager.toggleChave(chave)
  }, [])

  const isSelected = useCallback((chave: string) => {
    return selectionManager.isSelected(chave)
  }, [])

  const clearSelection = useCallback(() => {
    selectionManager.clearSelection()
  }, [])

  const selectMultiple = useCallback((chaves: string[]) => {
    selectionManager.selectMultiple(chaves)
  }, [])

  const removeMultiple = useCallback((chaves: string[]) => {
    selectionManager.removeMultiple(chaves)
  }, [])

  const getSelectedChaves = useCallback(() => {
    return selectionManager.getSelectedChaves()
  }, [])

  const validateSelection = useCallback(() => {
    return selectionManager.validateSelection()
  }, [])

  const getSelectionStats = useCallback(() => {
    return selectionManager.getSelectionStats()
  }, [])

  return {
    // Estado
    selectedChaves,
    selectionCount,
    hasSelection: selectionCount > 0,

    // Funções de controle
    addChave,
    removeChave,
    toggleChave,
    isSelected,
    clearSelection,
    selectMultiple,
    removeMultiple,
    getSelectedChaves,
    validateSelection,
    getSelectionStats
  }
}