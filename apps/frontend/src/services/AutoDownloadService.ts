/**
 * AutoDownloadService - Serviço de Download Automático
 * 
 * Gerencia o download automático de arquivos quando estão prontos,
 * incluindo limpeza do localStorage e atualização de status
 */

import { httpService } from './httpService'
import { selectionManager } from './SelectionManager'

export interface AutoDownloadOptions {
  downloadId: number
  link: string
  totalChaves: number
  processadas: number
}

export interface DownloadResult {
  success: boolean
  error?: string
  downloadId?: number
}

export class AutoDownloadService {
  private static instance: AutoDownloadService
  private downloadQueue: Set<number> = new Set()

  private constructor() {
    // Singleton
  }

  static getInstance(): AutoDownloadService {
    if (!AutoDownloadService.instance) {
      AutoDownloadService.instance = new AutoDownloadService()
    }
    return AutoDownloadService.instance
  }

  /**
   * Processa download automático
   * Fluxo: 1. Iniciar download → 2. Limpar chaves → 3. Atualizar status para '3' → 4. Finalizar
   */
  async processAutoDownload(options: AutoDownloadOptions): Promise<DownloadResult> {
    const { downloadId, link, totalChaves } = options

    try {
      console.log(`[AutoDownload] 🚀 Processando download ${downloadId} (${totalChaves} chaves)`)

      // Verificar se já está sendo processado
      if (this.downloadQueue.has(downloadId)) {
        console.log(`[AutoDownload] ⚠️ Download ${downloadId} já está sendo processado`)
        return { success: false, error: 'Download já está sendo processado' }
      }

      // Adicionar à fila
      this.downloadQueue.add(downloadId)

      // 1. Iniciar download do arquivo
      console.log(`[AutoDownload] 📥 Etapa 1/3: Iniciando download do arquivo...`)
      const downloadSuccess = await this.startFileDownload(link, downloadId)
      
      if (!downloadSuccess) {
        this.downloadQueue.delete(downloadId)
        return { success: false, error: 'Falha ao iniciar download do arquivo' }
      }

      // 2. Limpar chaves do localStorage (após iniciar download)
      console.log(`[AutoDownload] 🧹 Etapa 2/3: Limpando chaves selecionadas...`)
      await this.clearSelectedKeys()

      // 3. CRÍTICO: Atualizar status no backend para '3' (Iniciado)
      console.log(`[AutoDownload] 🔄 Etapa 3/3: Atualizando status na tabela tbl_nfe_dow...`)
      await this.updateDownloadStatus(downloadId)

      // 4. Remover da fila
      this.downloadQueue.delete(downloadId)

      console.log(`[AutoDownload] ✅ Download ${downloadId} processado com sucesso - Status atualizado para '3'`)
      
      return { 
        success: true, 
        downloadId 
      }

    } catch (error) {
      console.error(`[AutoDownload] ❌ Erro ao processar download ${downloadId}:`, error)
      this.downloadQueue.delete(downloadId)
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  /**
   * Inicia download do arquivo usando o link fornecido
   */
  private async startFileDownload(link: string, downloadId: number): Promise<boolean> {
    try {
      console.log(`[AutoDownload] Iniciando download do arquivo: ${link}`)

      // Criar elemento de link temporário para download
      const downloadLink = document.createElement('a')
      downloadLink.href = link
      downloadLink.download = `download_${downloadId}_${Date.now()}.zip`
      downloadLink.style.display = 'none'
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      console.log(`[AutoDownload] Download iniciado com sucesso`)
      return true

    } catch (error) {
      console.error('[AutoDownload] Erro ao iniciar download do arquivo:', error)
      return false
    }
  }

  /**
   * Limpa chaves selecionadas do localStorage
   */
  private async clearSelectedKeys(): Promise<void> {
    try {
      console.log('[AutoDownload] Limpando chaves selecionadas do localStorage')
      
      // Usar o SelectionManager para limpar seleção
      selectionManager.clearSelection()
      
      console.log('[AutoDownload] Chaves limpas com sucesso')

    } catch (error) {
      console.error('[AutoDownload] Erro ao limpar chaves:', error)
      // Não falhar o processo por causa disso
    }
  }

  /**
   * Atualiza status do download no backend para '3' (Iniciado)
   * Chamada obrigatória quando DOWNLOAD_READY é recebido e download é iniciado
   */
  private async updateDownloadStatus(downloadId: number): Promise<void> {
    try {
      console.log(`[AutoDownload] 🔄 Atualizando status do download ${downloadId} para '3' (Iniciado) na tabela tbl_nfe_dow`)

      const response = await httpService.put(`/api/downloads/${downloadId}/started`, undefined, {
        errorContext: `Atualização de status do download ${downloadId}`,
        showErrorNotification: true
      })

      if (!response || typeof response !== 'object') {
        console.error(`[AutoDownload] ❌ Resposta inválida ao atualizar status do download ${downloadId}:`, response)
        throw new Error('Resposta inválida do servidor')
      }

      console.log(`[AutoDownload] ✅ Status do download ${downloadId} atualizado para '3' com sucesso`)

    } catch (error) {
      console.error(`[AutoDownload] ❌ Erro crítico ao atualizar status do download ${downloadId}:`, error)
      // Re-lançar erro para que seja tratado no processamento principal
      throw error
    }
  }

  /**
   * Verifica se um download está sendo processado
   */
  isProcessing(downloadId: number): boolean {
    return this.downloadQueue.has(downloadId)
  }

  /**
   * Obtém lista de downloads sendo processados
   */
  getProcessingDownloads(): number[] {
    return Array.from(this.downloadQueue)
  }

  /**
   * Limpa fila de downloads (para casos de erro)
   */
  clearQueue(): void {
    console.log('[AutoDownload] Limpando fila de downloads')
    this.downloadQueue.clear()
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats(): {
    queueSize: number
    processingDownloads: number[]
  } {
    return {
      queueSize: this.downloadQueue.size,
      processingDownloads: Array.from(this.downloadQueue)
    }
  }
}

// Instância singleton
export const autoDownloadService = AutoDownloadService.getInstance()