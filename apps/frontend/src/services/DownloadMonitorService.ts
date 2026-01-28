/**
 * DownloadMonitorService - Serviço de Monitoramento Global de Downloads
 * 
 * Serviço singleton que gerencia o Web Worker para monitoramento
 * global de downloads em background
 */

import type { WorkerMessage, WorkerResponse } from '../workers/downloadWorker'

export interface DownloadReadyCallback {
  (download: {
    downloadId: number
    link: string
    totalChaves: number
    processadas: number
  }): void
}

export interface DownloadErrorCallback {
  (error: { message: string; timestamp: string }): void
}

export class DownloadMonitorService {
  private static instance: DownloadMonitorService
  private worker: Worker | null = null
  private isInitialized = false
  private isMonitoring = false
  private usrCodigo: string | null = null
  
  // Callbacks
  private downloadReadyCallbacks: DownloadReadyCallback[] = []
  private errorCallbacks: DownloadErrorCallback[] = []

  private constructor() {
    // Singleton
  }

  static getInstance(): DownloadMonitorService {
    if (!DownloadMonitorService.instance) {
      DownloadMonitorService.instance = new DownloadMonitorService()
    }
    return DownloadMonitorService.instance
  }

  /**
   * Inicializa o serviço com dados do usuário
   */
  async initialize(usrCodigo: string, authToken: string, baseURL?: string): Promise<void> {
    try {
      console.log('[DownloadMonitor] Iniciando inicialização do serviço...')
      console.log('[DownloadMonitor] Parâmetros:', { 
        usrCodigo, 
        hasToken: !!authToken, 
        tokenLength: authToken?.length,
        baseURL 
      })
      
      // Usar baseURL fornecido ou obter da variável de ambiente
      const apiBaseURL = baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      console.log('[DownloadMonitor] URL da API:', apiBaseURL)
      
      this.usrCodigo = usrCodigo

      // Criar worker se não existir
      if (!this.worker) {
        console.log('[DownloadMonitor] Criando worker...')
        this.createWorker()
        console.log('[DownloadMonitor] Worker criado, estado:', !!this.worker)
      }

      // Verificar se worker foi criado com sucesso
      if (!this.worker) {
        throw new Error('Falha ao criar Web Worker')
      }

      // Inicializar worker com dados reais (não teste)
      const message: WorkerMessage = {
        type: 'INIT',
        payload: {
          usrCodigo,
          authToken,
          baseURL: apiBaseURL
        }
      }

      console.log('[DownloadMonitor] Enviando mensagem INIT para worker:', message)
      this.worker.postMessage(message)

      // Aguardar confirmação de inicialização
      console.log('[DownloadMonitor] Aguardando worker ficar pronto...')
      await this.waitForWorkerReady()
      
      this.isInitialized = true
      console.log('[DownloadMonitor] Serviço inicializado com sucesso')

    } catch (error) {
      console.error('[DownloadMonitor] Erro ao inicializar:', error)
      this.isInitialized = false
      throw error
    }
  }

  /**
   * Cria o Web Worker
   */
  private createWorker(): void {
    try {
      console.log('[DownloadMonitor] Tentando criar worker...')
      
      // Verificar se Web Workers são suportados
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers não são suportados neste navegador')
      }

      // Usar apenas o worker JavaScript da pasta public
      const workerUrl = '/downloadWorker.js'
      console.log('[DownloadMonitor] Usando URL do worker:', workerUrl)
      
      // Criar worker sem type: 'module' para evitar problemas de MIME type
      this.worker = new Worker(workerUrl)

      // Configurar listener de mensagens
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        console.log('[DownloadMonitor] Mensagem recebida do worker:', event.data)
        this.handleWorkerMessage(event.data)
      }

      // Configurar listener de erros
      this.worker.onerror = (error) => {
        console.error('[DownloadMonitor] Erro no worker:', error)
        console.error('[DownloadMonitor] Detalhes do erro:', {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno
        })
        this.notifyError({
          message: `Erro no Web Worker: ${error.message || 'Erro desconhecido'}`,
          timestamp: new Date().toISOString()
        })
      }

      // Configurar listener de erros não capturados
      this.worker.onmessageerror = (error) => {
        console.error('[DownloadMonitor] Erro de mensagem no worker:', error)
        this.notifyError({
          message: 'Erro de comunicação com o Web Worker',
          timestamp: new Date().toISOString()
        })
      }

      console.log('[DownloadMonitor] Worker criado com sucesso')

    } catch (error) {
      console.error('[DownloadMonitor] Erro ao criar worker:', error)
      throw error
    }
  }

  /**
   * Aguarda worker estar pronto
   */
  private waitForWorkerReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[DownloadMonitor] Aguardando worker ficar pronto...')
      
      const timeout = setTimeout(() => {
        console.error('[DownloadMonitor] Timeout aguardando worker (5s)')
        reject(new Error('Timeout aguardando worker ficar pronto'))
      }, 5000)

      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        console.log('[DownloadMonitor] Mensagem recebida durante espera:', event.data)
        
        if (event.data.type === 'READY') {
          console.log('[DownloadMonitor] Worker confirmou que está pronto!')
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', handleMessage)
          resolve()
        }
      }

      const handleError = (error: ErrorEvent) => {
        console.error('[DownloadMonitor] Erro durante espera do worker:', error)
        clearTimeout(timeout)
        this.worker?.removeEventListener('message', handleMessage)
        this.worker?.removeEventListener('error', handleError)
        reject(new Error(`Erro no worker durante inicialização: ${error.message}`))
      }

      this.worker?.addEventListener('message', handleMessage)
      this.worker?.addEventListener('error', handleError)
    })
  }

  /**
   * Processa mensagens do worker
   */
  private handleWorkerMessage(response: WorkerResponse): void {
    switch (response.type) {
      case 'READY':
        console.log('[DownloadMonitor] Worker pronto:', response.payload)
        break

      case 'DOWNLOAD_READY':
        console.log('[DownloadMonitor] Download pronto:', response.payload)
        this.notifyDownloadReady(response.payload)
        break

      case 'ERROR':
        console.error('[DownloadMonitor] Erro do worker:', response.payload)
        this.notifyError(response.payload)
        break

      case 'STATUS':
        console.log('[DownloadMonitor] Status do worker:', response.payload)
        break

      default:
        console.warn('[DownloadMonitor] Tipo de resposta desconhecido:', response.type)
    }
  }

  /**
   * Inicia monitoramento
   */
  startMonitoring(): void {
    if (!this.isInitialized) {
      console.warn('[DownloadMonitor] Serviço não inicializado')
      return
    }

    if (this.isMonitoring) {
      console.log('[DownloadMonitor] Monitoramento já está ativo')
      return
    }

    console.log('[DownloadMonitor] Iniciando monitoramento')
    
    const message: WorkerMessage = {
      type: 'START_MONITORING'
    }

    this.worker?.postMessage(message)
    this.isMonitoring = true
  }

  /**
   * Para monitoramento
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    console.log('[DownloadMonitor] Parando monitoramento')
    
    const message: WorkerMessage = {
      type: 'STOP_MONITORING'
    }

    this.worker?.postMessage(message)
    this.isMonitoring = false
  }

  /**
   * Força verificação imediata
   */
  checkNow(): void {
    if (!this.isInitialized) {
      console.warn('[DownloadMonitor] Serviço não inicializado')
      return
    }

    const message: WorkerMessage = {
      type: 'CHECK_NOW'
    }

    this.worker?.postMessage(message)
  }

  /**
   * Verifica downloads pendentes ao inicializar
   */
  async checkPendingDownloads(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[DownloadMonitor] Serviço não inicializado')
      return
    }

    console.log('[DownloadMonitor] Verificando downloads pendentes')
    this.checkNow()
  }

  /**
   * Encerra o serviço
   */
  shutdown(): void {
    console.log('[DownloadMonitor] Encerrando serviço')
    
    this.stopMonitoring()

    if (this.worker) {
      const message: WorkerMessage = {
        type: 'SHUTDOWN'
      }
      
      this.worker.postMessage(message)
      this.worker.terminate()
      this.worker = null
    }

    this.isInitialized = false
    this.usrCodigo = null
    
    // Limpar callbacks
    this.downloadReadyCallbacks = []
    this.errorCallbacks = []
  }

  /**
   * Adiciona callback para download pronto
   */
  onDownloadReady(callback: DownloadReadyCallback): void {
    this.downloadReadyCallbacks.push(callback)
  }

  /**
   * Remove callback de download pronto
   */
  removeDownloadReadyCallback(callback: DownloadReadyCallback): void {
    const index = this.downloadReadyCallbacks.indexOf(callback)
    if (index > -1) {
      this.downloadReadyCallbacks.splice(index, 1)
    }
  }

  /**
   * Adiciona callback para erros
   */
  onError(callback: DownloadErrorCallback): void {
    this.errorCallbacks.push(callback)
  }

  /**
   * Remove callback de erro
   */
  removeErrorCallback(callback: DownloadErrorCallback): void {
    const index = this.errorCallbacks.indexOf(callback)
    if (index > -1) {
      this.errorCallbacks.splice(index, 1)
    }
  }

  /**
   * Notifica callbacks sobre download pronto
   */
  private notifyDownloadReady(download: any): void {
    this.downloadReadyCallbacks.forEach(callback => {
      try {
        callback(download)
      } catch (error) {
        console.error('[DownloadMonitor] Erro ao notificar callback:', error)
      }
    })
  }

  /**
   * Notifica callbacks sobre erros
   */
  private notifyError(error: any): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('[DownloadMonitor] Erro ao notificar callback de erro:', err)
      }
    })
  }

  /**
   * Obtém status do serviço
   */
  getStatus(): {
    isInitialized: boolean
    isMonitoring: boolean
    usrCodigo: string | null
    hasWorker: boolean
  } {
    return {
      isInitialized: this.isInitialized,
      isMonitoring: this.isMonitoring,
      usrCodigo: this.usrCodigo,
      hasWorker: this.worker !== null
    }
  }
}

// Instância singleton
export const downloadMonitor = DownloadMonitorService.getInstance()