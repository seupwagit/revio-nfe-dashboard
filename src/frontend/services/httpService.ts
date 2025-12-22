/**
 * HttpService - Serviço HTTP Centralizado
 * 
 * Wrapper para fetch API com interceptors, autenticação automática
 * e tratamento de erros centralizado integrado com sistema de notificações
 */

import { ErrorHandler } from './errorHandler';
import { storageService } from './storageService';

// Importar configuração de ambiente
const getDefaultBaseURL = () => {
  // Tentar obter da variável de ambiente, senão usar localhost como fallback
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
};

export interface HttpResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  includeAuth?: boolean
  showErrorNotification?: boolean
  errorContext?: string
}

export class HttpService {
  private _baseURL: string
  private defaultTimeout: number

  constructor(baseURL: string = getDefaultBaseURL(), timeout: number = 30000) {
    this._baseURL = baseURL
    this.defaultTimeout = timeout
  }

  /**
   * Obtém a base URL atual
   */
  get baseURL(): string {
    return this._baseURL
  }

  /**
   * Obtém token de autenticação de forma segura
   */
  private getAuthToken(): string | null {
    return storageService.getAuthToken()
  }

  /**
   * Prepara headers da requisição
   */
  private prepareHeaders(config: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers
    }

    // Incluir token de autenticação se solicitado (padrão: true)
    if (config.includeAuth !== false) {
      const token = this.getAuthToken()
      console.log('🔑 DEBUG: Token de autenticação:', token ? `${token.substring(0, 20)}...` : 'null')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      } else {
        console.warn('⚠️ DEBUG: Nenhum token de autenticação encontrado!')
      }
    }

    return headers
  }

  /**
   * Prepara corpo da requisição
   */
  private prepareBody(body: any): string | undefined {
    if (!body) return undefined
    
    if (typeof body === 'string') {
      return body
    }
    
    return JSON.stringify(body)
  }

  /**
   * Trata resposta da API
   */
  private async handleResponse<T>(response: Response, config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Se a resposta não é ok, tratar como erro
      if (!response.ok) {
        const errorResponse: HttpResponse<T> = {
          success: false,
          error: data.error || data.message || `Erro HTTP ${response.status}`,
          code: data.code || `HTTP_${response.status}`
        }

        // Exibir notificação de erro se configurado
        if (config.showErrorNotification !== false) {
          ErrorHandler.handleHttpError(errorResponse, config.errorContext)
        }

        // Disparar evento personalizado para erro 401
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized', {
            detail: { status: response.status, data }
          }))
        }

        return errorResponse
      }

      // Se a resposta tem formato padrão da API
      if (data && typeof data === 'object' && 'success' in data) {
        return data
      }

      // Resposta simples
      return {
        success: true,
        data
      }

    } catch (error) {
      console.error('Erro ao processar resposta:', error)
      const errorResponse: HttpResponse<T> = {
        success: false,
        error: 'Erro ao processar resposta do servidor',
        code: 'RESPONSE_PARSE_ERROR'
      }

      if (config.showErrorNotification !== false) {
        ErrorHandler.handleHttpError(errorResponse, config.errorContext)
      }

      return errorResponse
    }
  }

  /**
   * Executa requisição HTTP
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    try {
      const url = `${this._baseURL}${endpoint}`
      const timeout = config.timeout || this.defaultTimeout

      console.log('🌐 DEBUG: Fazendo requisição HTTP:', {
        url,
        method: config.method || 'GET',
        baseURL: this._baseURL,
        endpoint,
        timeout
      })

      // Configurar AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const fetchConfig: RequestInit = {
        method: config.method || 'GET',
        headers: this.prepareHeaders(config),
        body: this.prepareBody(config.body),
        signal: controller.signal
      }

      console.log('🌐 DEBUG: Configuração da requisição:', {
        method: fetchConfig.method,
        headers: fetchConfig.headers,
        hasBody: !!fetchConfig.body
      })

      const response = await fetch(url, fetchConfig)
      clearTimeout(timeoutId)

      console.log('📡 DEBUG: Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      return await this.handleResponse<T>(response, config)

    } catch (error: any) {
      console.error('❌ DEBUG: Erro na requisição HTTP:', error)

      let errorResponse: HttpResponse<T>

      if (error.name === 'AbortError') {
        errorResponse = {
          success: false,
          error: 'Timeout na requisição',
          code: 'REQUEST_TIMEOUT'
        }
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorResponse = {
          success: false,
          error: 'Erro de conexão com o servidor',
          code: 'CONNECTION_ERROR'
        }
      } else {
        errorResponse = {
          success: false,
          error: error.message || 'Erro desconhecido na requisição',
          code: 'REQUEST_ERROR'
        }
      }

      if (config.showErrorNotification !== false) {
        ErrorHandler.handleHttpError(errorResponse, config.errorContext)
      }

      return errorResponse
    }
  }

  /**
   * Requisição GET
   */
  async get<T>(endpoint: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  /**
   * Requisição POST
   */
  async post<T>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body })
  }

  /**
   * Requisição PUT
   */
  async put<T>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body })
  }

  /**
   * Requisição DELETE
   */
  async delete<T>(endpoint: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  /**
   * Requisição PATCH
   */
  async patch<T>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body })
  }

  /**
   * Requisição sem autenticação
   */
  async publicRequest<T>(endpoint: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, includeAuth: false })
  }

  /**
   * Upload de arquivo
   */
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value))
        })
      }

      const headers: Record<string, string> = {}
      
      // Incluir token de autenticação
      const token = this.getAuthToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${this._baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      })

      return await this.handleResponse<T>(response, config)

    } catch (error: any) {
      console.error('Erro no upload:', error)
      const errorResponse: HttpResponse<T> = {
        success: false,
        error: error.message || 'Erro no upload do arquivo',
        code: 'UPLOAD_ERROR'
      }

      if (config.showErrorNotification !== false) {
        ErrorHandler.handleHttpError(errorResponse, config.errorContext || 'Upload de arquivo')
      }

      return errorResponse
    }
  }

  /**
   * Download de arquivo
   */
  async downloadFile(endpoint: string, filename?: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this._baseURL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        const errorResponse = {
          success: false,
          error: `Erro no download: ${response.status}`,
          code: `HTTP_${response.status}`
        }

        if (config.showErrorNotification !== false) {
          ErrorHandler.handleHttpError(errorResponse, config.errorContext || 'Download de arquivo')
        }

        return {
          success: false,
          error: `Erro no download: ${response.status}`
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Exibir notificação de sucesso
      ErrorHandler.showSuccess('Download concluído com sucesso!', 'Download')

      return { success: true }

    } catch (error: any) {
      console.error('Erro no download:', error)
      const errorResponse = {
        success: false,
        error: error.message || 'Erro no download do arquivo',
        code: 'DOWNLOAD_ERROR'
      }

      if (config.showErrorNotification !== false) {
        ErrorHandler.handleHttpError(errorResponse, config.errorContext || 'Download de arquivo')
      }

      return {
        success: false,
        error: error.message || 'Erro no download do arquivo'
      }
    }
  }

  /**
   * Configura nova base URL
   */
  setBaseURL(baseURL: string): void {
    this._baseURL = baseURL
  }

  /**
   * Configura timeout padrão
   */
  setTimeout(timeout: number): void {
    this.defaultTimeout = timeout
  }
}

// Instância singleton usando configuração de ambiente
export const httpService = new HttpService(getDefaultBaseURL())

// Interceptor global para erros 401
window.addEventListener('auth:unauthorized', () => {
  console.warn('Token inválido ou expirado, redirecionando para login')
  
  // Limpar dados de autenticação de forma segura
  storageService.clearAuthData()
  
  // Redirecionar para login se não estiver já lá
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
})