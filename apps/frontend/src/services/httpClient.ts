/**
 * HTTP Client baseado em fetch API nativa
 * Substitui o axios com funcionalidade similar
 */

export interface HttpClientConfig {
  baseURL?: string
  headers?: Record<string, string>
  timeout?: number
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
}

export interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export class HttpClient {
  private config: HttpClientConfig

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL: '',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      ...config
    }
  }

  /**
   * Cria uma instância do HttpClient com configuração específica
   */
  static create(config: HttpClientConfig = {}): HttpClient {
    return new HttpClient(config)
  }

  /**
   * Constrói a URL completa com parâmetros de query
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    const baseUrl = this.config.baseURL || ''
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl
    }

    const urlObj = new URL(fullUrl)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value))
      }
    })

    return urlObj.toString()
  }

  /**
   * Executa uma requisição HTTP
   */
  private async request<T = any>(url: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      params,
      data,
      timeout = this.config.timeout
    } = config

    const fullUrl = this.buildUrl(url, params)
    
    const requestHeaders = {
      ...this.config.headers,
      ...headers
    }

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    }

    // Adicionar body para métodos que suportam
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      if (typeof data === 'object') {
        requestInit.body = JSON.stringify(data)
      } else {
        requestInit.body = data
      }
    }

    // Implementar timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(fullUrl, {
        ...requestInit,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      let responseData: T
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text() as any
      }

      if (!response.ok) {
        const error = new HttpError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          response.status,
          responseData
        )
        
        // Adicionar propriedades compatíveis com axios
        ;(error as any).response = {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          headers: response.headers
        }
        
        throw error
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new HttpError('Request timeout', 408)
        ;(timeoutError as any).code = 'ECONNABORTED'
        throw timeoutError
      }
      
      throw error
    }
  }

  /**
   * Requisição GET
   */
  async get<T = any>(url: string, config: Omit<RequestConfig, 'method' | 'data'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' })
  }

  /**
   * Requisição POST
   */
  async post<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'data'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', data })
  }

  /**
   * Requisição PUT
   */
  async put<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'data'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', data })
  }

  /**
   * Requisição DELETE
   */
  async delete<T = any>(url: string, config: Omit<RequestConfig, 'method' | 'data'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }

  /**
   * Requisição PATCH
   */
  async patch<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'data'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', data })
  }
}

/**
 * Classe de erro HTTP personalizada
 */
export class HttpError extends Error {
  public status: number
  public response?: any

  constructor(message: string, status: number, response?: any) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.response = response
  }
}

/**
 * Instância padrão do HttpClient
 */
export const httpClient = new HttpClient()

/**
 * Função para criar instância configurada (compatibilidade com axios.create)
 */
export const create = (config: HttpClientConfig) => HttpClient.create(config)

/**
 * Exportações para compatibilidade com axios
 */
export default {
  create,
  get: httpClient.get.bind(httpClient),
  post: httpClient.post.bind(httpClient),
  put: httpClient.put.bind(httpClient),
  delete: httpClient.delete.bind(httpClient),
  patch: httpClient.patch.bind(httpClient)
}