/**
 * Download Worker - Web Worker para Monitoramento Global de Downloads
 * 
 * Worker que monitora downloads em background, fazendo polling
 * a cada 30 segundos para verificar downloads prontos
 */

// Estado do worker
let isMonitoring = false
let monitoringInterval = null
let usrCodigo = null
let authToken = null

// Configurar baseURL de forma mais robusta
let baseURL
try {
  // Tentar obter da variável de ambiente do worker
  baseURL = self.VITE_API_BASE_URL || 'http://localhost:3001'
  
  // Se estiver em localhost, usar porta 3001
  if (self.location.origin.includes('localhost')) {
    baseURL = 'http://localhost:3001'
  }
} catch (error) {
  console.warn('[DownloadWorker] Erro ao configurar baseURL inicial:', error)
  baseURL = 'http://localhost:3001'
}

console.log('[DownloadWorker] BaseURL inicial configurado:', baseURL)

// Configurações
const POLLING_INTERVAL = 30000 // 30 segundos
const MAX_RETRIES = 3

/**
 * Faz requisição para verificar downloads prontos
 */
async function checkReadyDownloads() {
  if (!usrCodigo || !authToken) {
    throw new Error('Usuário não configurado')
  }

  console.log('[DownloadWorker] Fazendo requisição para:', `${baseURL}/api/downloads/ready`)

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

      console.log('[DownloadWorker] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expirado')
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[DownloadWorker] Dados recebidos:', data)
      
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
      const delay = 1000 * retries
      console.log(`[DownloadWorker] Aguardando ${delay}ms antes da próxima tentativa...`)
      await new Promise(resolve => setTimeout(resolve, delay))
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
  }, POLLING_INTERVAL)
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
    console.log('[DownloadWorker] Monitoramento não está ativo, pulando verificação')
    return
  }

  if (!usrCodigo || !authToken) {
    console.warn('[DownloadWorker] Parâmetros não configurados:', { 
      hasUsrCodigo: !!usrCodigo, 
      hasAuthToken: !!authToken,
      baseURL 
    })
    return
  }

  try {
    console.log('[DownloadWorker] Verificando downloads para usuário:', usrCodigo)
    const readyDownloads = await checkReadyDownloads()
    
    if (readyDownloads.length > 0) {
      console.log(`[DownloadWorker] ${readyDownloads.length} downloads prontos encontrados`)
      
      // Notificar thread principal sobre cada download pronto
      readyDownloads.forEach(download => {
        const response = {
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
    } else {
      console.log('[DownloadWorker] Nenhum download pronto encontrado')
    }

  } catch (error) {
    console.error('[DownloadWorker] Erro ao verificar downloads:', error)
    
    const response = {
      type: 'ERROR',
      payload: {
        message: error.message || 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }
    }
    
    self.postMessage(response)

    // Se erro de autenticação, parar monitoramento
    if (error.message && error.message.includes('Token expirado')) {
      console.warn('[DownloadWorker] Token expirado, parando monitoramento')
      stopMonitoring()
    }
  }
}

/**
 * Processa mensagens do thread principal
 */
self.onmessage = function(event) {
  console.log('[DownloadWorker] Mensagem recebida:', event.data)
  
  const { type, payload } = event.data

  switch (type) {
    case 'INIT':
      console.log('[DownloadWorker] Inicializando worker com payload:', payload)
      
      // Configurar parâmetros (ignorar se for teste)
      if (payload?.test) {
        console.log('[DownloadWorker] Payload de teste detectado, enviando READY')
      } else {
        // Configuração real
        if (payload?.usrCodigo) {
          usrCodigo = payload.usrCodigo
          console.log('[DownloadWorker] usrCodigo configurado:', usrCodigo)
        }
        if (payload?.authToken) {
          authToken = payload.authToken
          console.log('[DownloadWorker] authToken configurado (length):', authToken?.length || 0)
        }
        if (payload?.baseURL) {
          baseURL = payload.baseURL
          console.log('[DownloadWorker] baseURL configurado:', baseURL)
        }
      }

      // Confirmar inicialização
      const readyResponse = {
        type: 'READY',
        payload: {
          usrCodigo,
          pollingInterval: POLLING_INTERVAL
        }
      }
      
      console.log('[DownloadWorker] Enviando resposta READY:', readyResponse)
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
      } else {
        console.warn('[DownloadWorker] Não é possível verificar: usrCodigo ou authToken ausentes')
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
console.log('[DownloadWorker] Worker JavaScript carregado e pronto para receber mensagens')

// Adicionar handler para erros não capturados
self.onerror = function(error) {
  console.error('[DownloadWorker] Erro não capturado no worker:', error)
  
  const errorResponse = {
    type: 'ERROR',
    payload: {
      message: `Erro não capturado: ${error instanceof ErrorEvent ? error.message : String(error)}`,
      timestamp: new Date().toISOString()
    }
  }
  
  self.postMessage(errorResponse)
}

// Adicionar handler para promises rejeitadas
self.addEventListener('unhandledrejection', function(event) {
  console.error('[DownloadWorker] Promise rejeitada não tratada:', event.reason)
  
  const errorResponse = {
    type: 'ERROR',
    payload: {
      message: `Promise rejeitada: ${event.reason}`,
      timestamp: new Date().toISOString()
    }
  }
  
  self.postMessage(errorResponse)
})