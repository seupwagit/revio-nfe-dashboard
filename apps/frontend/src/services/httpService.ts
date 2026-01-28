// OBRIGATÓRIO: Serviço HTTP centralizado conforme steering rules
// TODAS as chamadas de API devem usar este serviço
import { ERROR_CODES } from '@fiscal/shared/constants/error-codes';
import { DEFAULT_RETRY_CONFIG } from '@fiscal/shared/constants/retry-config';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryOn?: readonly number[];
  showRetryButton?: boolean;
}

interface RequestConfig {
  retry?: RetryConfig;
  timeout?: number;
  skipAuth?: boolean;
  includeAuth?: boolean;
  errorContext?: string;
  showErrorNotification?: boolean;
  showSuccessMessage?: boolean;
}

export interface HttpResponse {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
  message?: string;
  status?: number;
  isNetworkError?: boolean;
}

class HttpService {
  private defaultRetryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;
  public readonly baseURL: string;

  constructor() {
    // Set base URL based on environment
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 
                   (import.meta.env.DEV ? 'http://localhost:4001' : '');
    
    console.log('🌐 HttpService initialized with baseURL:', this.baseURL);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('revio_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= config.maxRetries!; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Não fazer retry em erros de autenticação ou validação
        if (error.status && ![...config.retryOn!].includes(error.status)) {
          throw error;
        }
        
        // Última tentativa
        if (attempt === config.maxRetries) {
          break;
        }
        
        // Exponential backoff com jitter
        const delay = config.retryDelay! * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay;
        await this.delay(delay + jitter);
      }
    }
    
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T>(
    method: string,
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config.retry };
    
    // Construct full URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const operation = async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.skipAuth || config.includeAuth === false ? {} : this.getAuthHeaders())
      };

      const controller = new AbortController();
      const timeoutId = config.timeout ? 
        setTimeout(() => controller.abort(), config.timeout) : null;

      try {
        console.log(`🌐 HTTP ${method} ${fullUrl}`);
        
        const response = await fetch(fullUrl, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // 🔒 Disparar evento de não autorizado para AuthContext interceptar
          if (response.status === 401) {
            console.warn('[httpService] 🔒 Token inválido detectado, disparando evento auth:unauthorized');
            window.dispatchEvent(new CustomEvent('auth:unauthorized', {
              detail: {
                status: response.status,
                code: errorData.error?.code || 'UNAUTHORIZED',
                message: errorData.error?.message || 'Token inválido ou expirado'
              }
            }));
          }
          
          throw {
            status: response.status,
            message: errorData.error?.message || 'Erro na requisição',
            code: errorData.error?.code || ERROR_CODES.NETWORK_ERROR,
            isNetworkError: response.status >= 500
          };
        }

        // Para requisições HEAD ou sem conteúdo, não tentar parsear JSON
        if (method.toUpperCase() === 'HEAD' || response.status === 204) {
          return null as any;
        }

        const text = await response.text();
        if (!text) return null as any;

        try {
          return JSON.parse(text);
        } catch (error) {
          console.warn('[httpService] Failed to parse JSON response:', error);
          return text as any;
        }
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw {
            status: 408,
            message: 'Timeout na requisição',
            code: ERROR_CODES.TIMEOUT_ERROR,
            isNetworkError: true
          };
        }
        
        throw error;
      }
    };

    try {
      return await this.executeWithRetry(operation, retryConfig);
    } catch (error: any) {
      // Log do erro com contexto
      console.error('HTTP Request failed:', {
        method,
        url: fullUrl,
        error: error.message,
        context: config.errorContext,
        attempt: 'final'
      });
      
      throw error;
    }
  }

  // Métodos de conveniência
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  head<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('HEAD', url, undefined, config);
  }

  /**
   * Special method for requests that return a Blob (like PDFs)
   */
  async postBlob(url: string, data?: any, config: RequestConfig = {}): Promise<Blob> {
    const retryConfig = { ...this.defaultRetryConfig, ...config.retry };
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const operation = async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.skipAuth || config.includeAuth === false ? {} : this.getAuthHeaders())
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.error?.message || 'Erro na requisição de binário',
          code: errorData.error?.code || ERROR_CODES.NETWORK_ERROR
        };
      }

      return await response.blob();
    };

    return await this.executeWithRetry(operation, retryConfig);
  }

  // Método para requisições públicas (sem autenticação)
  publicRequest<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, { ...config, includeAuth: false });
  }

  // Método para upload de arquivos
  async uploadFile<T>(
    url: string, 
    file: File, 
    additionalData: Record<string, any> = {},
    config?: RequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Adicionar dados extras ao FormData
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const retryConfig = { ...this.defaultRetryConfig, ...config?.retry };
    
    const operation = async () => {
      const headers: Record<string, string> = {
        ...(config?.skipAuth || config?.includeAuth === false ? {} : this.getAuthHeaders())
        // Não definir Content-Type para FormData (browser define automaticamente)
      };

      const controller = new AbortController();
      const timeoutId = config?.timeout ? 
        setTimeout(() => controller.abort(), config.timeout) : null;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            status: response.status,
            message: errorData.error?.message || 'Erro no upload',
            code: errorData.error?.code || ERROR_CODES.NETWORK_ERROR,
            isNetworkError: response.status >= 500
          };
        }

        return response.json();
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw {
            status: 408,
            message: 'Timeout no upload',
            code: ERROR_CODES.TIMEOUT_ERROR,
            isNetworkError: true
          };
        }
        
        throw error;
      }
    };

    try {
      return await this.executeWithRetry(operation, retryConfig);
    } catch (error: any) {
      console.error('File upload failed:', {
        url,
        fileName: file.name,
        fileSize: file.size,
        error: error.message,
        context: config?.errorContext
      });
      
      throw error;
    }
  }
}

export const httpService = new HttpService();