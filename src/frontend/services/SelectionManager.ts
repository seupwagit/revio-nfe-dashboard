/**
 * SelectionManager - Gerenciador de Seleção de Documentos
 * 
 * Gerencia a seleção de chaves de documentos no localStorage
 * para persistir entre navegações
 * Usa StorageService para manipulação segura do localStorage
 */

import { storageService } from './storageService'

const SELECTION_KEY = 'revio_selected_documents'

export interface DocumentSelection {
  chaves: Set<string>
  lastUpdated: Date
}

export class SelectionManager {
  private static instance: SelectionManager
  private selection: Set<string>
  private listeners: Array<(selection: Set<string>) => void> = []

  private constructor() {
    this.selection = new Set()
    this.loadFromStorage()
  }

  static getInstance(): SelectionManager {
    if (!SelectionManager.instance) {
      SelectionManager.instance = new SelectionManager()
    }
    return SelectionManager.instance
  }

  /**
   * Carrega seleção do localStorage de forma segura
   */
  private loadFromStorage(): void {
    try {
      const stored = storageService.getItem(SELECTION_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.chaves && Array.isArray(data.chaves)) {
          this.selection = new Set(data.chaves)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar seleção do localStorage:', error)
      this.selection = new Set()
    }
  }

  /**
   * Salva seleção no localStorage de forma segura
   */
  private saveToStorage(): void {
    try {
      const data = {
        chaves: Array.from(this.selection),
        lastUpdated: new Date().toISOString()
      }
      const success = storageService.setItem(SELECTION_KEY, JSON.stringify(data))
      if (!success) {
        console.warn('Falha ao salvar seleção no localStorage')
      }
    } catch (error) {
      console.error('Erro ao salvar seleção no localStorage:', error)
    }
  }

  /**
   * Adiciona uma chave à seleção
   */
  addChave(chave: string): void {
    if (chave && chave.length === 44) {
      this.selection.add(chave)
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Remove uma chave da seleção
   */
  removeChave(chave: string): void {
    if (this.selection.has(chave)) {
      this.selection.delete(chave)
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Verifica se uma chave está selecionada
   */
  isSelected(chave: string): boolean {
    return this.selection.has(chave)
  }

  /**
   * Alterna seleção de uma chave
   */
  toggleChave(chave: string): void {
    if (this.isSelected(chave)) {
      this.removeChave(chave)
    } else {
      this.addChave(chave)
    }
  }

  /**
   * Obtém todas as chaves selecionadas
   */
  getSelectedChaves(): string[] {
    return Array.from(this.selection)
  }

  /**
   * Obtém quantidade de chaves selecionadas
   */
  getSelectionCount(): number {
    return this.selection.size
  }

  /**
   * Limpa toda a seleção
   */
  clearSelection(): void {
    this.selection.clear()
    this.saveToStorage()
    this.notifyListeners()
  }

  /**
   * Seleciona múltiplas chaves
   */
  selectMultiple(chaves: string[]): void {
    let changed = false
    chaves.forEach(chave => {
      if (chave && chave.length === 44 && !this.selection.has(chave)) {
        this.selection.add(chave)
        changed = true
      }
    })

    if (changed) {
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Remove múltiplas chaves
   */
  removeMultiple(chaves: string[]): void {
    let changed = false
    chaves.forEach(chave => {
      if (this.selection.has(chave)) {
        this.selection.delete(chave)
        changed = true
      }
    })

    if (changed) {
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Adiciona listener para mudanças na seleção
   */
  addListener(callback: (selection: Set<string>) => void): void {
    this.listeners.push(callback)
  }

  /**
   * Remove listener
   */
  removeListener(callback: (selection: Set<string>) => void): void {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Notifica todos os listeners sobre mudanças
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(new Set(this.selection))
      } catch (error) {
        console.error('Erro ao notificar listener de seleção:', error)
      }
    })
  }

  /**
   * Obtém estatísticas da seleção
   */
  getSelectionStats(): {
    total: number
    lastUpdated: string | null
  } {
    try {
      const stored = storageService.getItem(SELECTION_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        return {
          total: this.selection.size,
          lastUpdated: data.lastUpdated || null
        }
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
    }

    return {
      total: this.selection.size,
      lastUpdated: null
    }
  }

  /**
   * Valida se todas as chaves selecionadas são válidas
   */
  validateSelection(): {
    valid: string[]
    invalid: string[]
  } {
    const valid: string[] = []
    const invalid: string[] = []

    this.selection.forEach(chave => {
      if (chave && typeof chave === 'string' && chave.length === 44) {
        valid.push(chave)
      } else {
        invalid.push(chave)
      }
    })

    // Remover chaves inválidas
    if (invalid.length > 0) {
      invalid.forEach(chave => this.selection.delete(chave))
      this.saveToStorage()
      this.notifyListeners()
    }

    return { valid, invalid }
  }
}

// Instância singleton
export const selectionManager = SelectionManager.getInstance()