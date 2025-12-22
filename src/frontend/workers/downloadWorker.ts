/**
 * Download Worker - Web Worker para Monitoramento Global de Downloads
 * 
 * Worker que monitora downloads em background, fazendo polling
 * a cada 30 segundos para verificar downloads prontos
 */

// Tipos para comunicação com o worker
export interface WorkerMessage {
  type: 'INIT' | 'START_MONITORING' | 'STOP_MONITORING' | 'CHECK_NOW' | 'SHUTDOWN'
  payload?: any
}

export interface WorkerResponse {
  type: 'READY' | 'DOWNLOAD_READY' | 'ERROR' | 'STATUS'
  payload?: any
}

// Estado do worker
let isMonitoring = false
let monitoringInterval: number | null = null
let usrCodigo: string | null = null
let authToken: string | null = null
let baseURL = self.location.origin.includes('localhost') 
  ? 'http://localhost:3001' 
  : (self as any).VITE_API_BASE_URL || 'http://localhost:3001'

// Configurações
const POLLING_INTERVAL = 30000 // 30 segundos
const MAX_RETRIES = 3

/**
 * Faz requisição para verificar downloads prontos
 */
async function checkReadyDownloads(): Promise<any[]> {
  if (!usrCodigo || !authToken) {
    throw new Error('Usuário não configurado')
  }

  let retries = 0
  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(`${baseURL}/api/downloads/ready`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expirado')
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Erro na resposta da API')
      }

      return data.data?.readyDownloads || []

    } catch (error) {
      retries++
      console.error(`[DownloadWorker] Tentativa ${retries} falhou:`, error)
      
      if (retries >= MAX_RETRIES) {
        throw error
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * retries))
    }
  }

  return []
}

/**
 * Inicia monitoramento
 */
function startMonitoring() {
  if (isMonitoring || !usrCodigo) {
    return
  }

  isMonitoring = true
  
  console.log(`[DownloadWorker] Iniciando monitoramento para usuário ${usrCodigo}`)

  // Verificação inicial
  checkDownloads()

  // Configurar polling
  monitoringInterval = setInterval(() => {
    checkDownloads()
  }, POLLING_INTERVAL) as unknown as number
}

/**
 * Para monitoramento
 */
function stopMonitoring() {
  if (!isMonitoring) {
    return
  }

  isMonitoring = false
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }

  console.log('[DownloadWorker] Monitoramento parado')
}

/**
 * Verifica downloads prontos
 */
async function checkDownloads() {
  if (!isMonitoring) {
    return
  }

  try {
    const readyDownloads = await checkReadyDownloads()
    
    if (readyDownloads.length > 0) {
      console.log(`[DownloadWorker] ${readyDownloads.length} downloads prontos encontrados`)
      
      // Notificar thread principal sobre cada download pronto
      readyDownloads.forEach(download => {
        const response: WorkerResponse = {
          type: 'DOWNLOAD_READY',
          payload: {
            downloadId: download.id,
            link: download.link,
            totalChaves: download.totalChaves,
            processadas: download.processadas
          }
        }
        
        self.postMessage(response)
      })
    }

  } catch (error) {
    console.error('[DownloadWorker] Erro ao verificar downloads:', error)
    
    const response: WorkerResponse = {
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }
    }
    
    self.postMessage(response)

    // Se erro de autenticação, parar monitoramento
    if (error instanceof Error && error.message.includes('Token expirado')) {
      stopMonitoring()
    }
  }
}

/**
 * Processa mensagens do thread principal
 */
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { type, payload } = event.data

  switch (type) {
    case 'INIT':
      console.log('[DownloadWorker] Inicializando worker')
      
      // Configurar parâmetros
      if (payload?.usrCodigo) {
        usrCodigo = payload.usrCodigo
      }
      if (payload?.authToken) {
        authToken = payload.authToken
      }
      if (payload?.baseURL) {
        baseURL = payload.baseURL
      }

      // Confirmar inicialização
      const readyResponse: WorkerResponse = {
        type: 'READY',
        payload: {
          usrCodigo,
          pollingInterval: POLLING_INTERVAL
        }
      }
      self.postMessage(readyResponse)
      break

    case 'START_MONITORING':
      console.log('[DownloadWorker] Comando para iniciar monitoramento')
      startMonitoring()
      break

    case 'STOP_MONITORING':
      console.log('[DownloadWorker] Comando para parar monitoramento')
      stopMonitoring()
      break

    case 'CHECK_NOW':
      console.log('[DownloadWorker] Verificação manual solicitada')
      if (usrCodigo && authToken) {
        checkDownloads()
      }
      break

    case 'SHUTDOWN':
      console.log('[DownloadWorker] Encerrando worker')
      stopMonitoring()
      self.close()
      break

    default:
      console.warn('[DownloadWorker] Tipo de mensagem desconhecido:', type)
  }
}

// Confirmar que worker está carregado
console.log('[DownloadWorker] Worker carregado e pronto')