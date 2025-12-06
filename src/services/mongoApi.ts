/**
 * Serviço de API MongoDB
 * 
 * Cliente HTTP que se comunica com o servidor proxy MongoDB (backend).
 * O frontend NÃO acessa o MongoDB diretamente - todas as operações
 * passam pelo servidor proxy que roda em Node.js.
 * 
 * @module mongoApi
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Configuração da API MongoDB
 */
export interface MongoApiConfig {
  /** URL base do servidor proxy MongoDB */
  baseURL: string;
  /** Timeout em milissegundos */
  timeout?: number;
}

/**
 * Opções para buscar documentos
 */
export interface FetchDocumentsOptions {
  /** Nome da collection */
  collection: string;
  /** Data inicial (ISO string) */
  dtIni?: string;
  /** Data final (ISO string) */
  dtFim?: string;
  /** CNPJ do emitente */
  cnpjEmit?: string;
  /** CNPJ do destinatário */
  cnpjDest?: string;
  /** Número da página (começa em 1) */
  page?: number;
  /** Tamanho da página */
  size?: number;
}

/**
 * Opções para agregação de analytics
 */
export interface AggregateAnalyticsOptions {
  /** Nome da collection */
  collection: string;
  /** Data inicial (ISO string) */
  dtIni: string;
  /** Data final (ISO string) */
  dtFim: string;
  /** CNPJ do emitente */
  cnpjEmit?: string;
  /** CNPJ do destinatário */
  cnpjDest?: string;
}

/**
 * Resposta de documentos paginados
 */
export interface DocumentsResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  executionTime: number;
}

/**
 * Resposta de contagem
 */
export interface CountResponse {
  success: boolean;
  count: number;
}

/**
 * Resposta de analytics
 */
export interface AnalyticsResponse {
  success: boolean;
  data: {
    faturamentoDiario: Array<{ data: string; valor: number; quantidade: number }>;
    topEmitentes: Array<{ nome: string; valor: number; quantidade: number }>;
    distribuicaoTipos: Array<{ name: string; value: number; quantidade: number }>;
    distribuicaoStatus: Array<{ name: string; value: number }>;
    evolucao: Array<{ mes: string; valor: number; quantidade: number }>;
    stats: {
      totalNotas: number;
      totalValor: number;
      mediaValor: number;
      maiorNota: number;
      menorNota: number;
    };
  };
  executionTime: number;
}

/**
 * Resposta de health check
 */
export interface HealthResponse {
  status: string;
  mongodb: string;
  database: string;
  mode: string;
}

/**
 * Serviço de API MongoDB
 * 
 * Cliente HTTP para comunicação com o servidor proxy MongoDB.
 * Todas as operações MongoDB são executadas no backend.
 */
export class MongoApiService {
  private client: AxiosInstance;

  constructor(config: MongoApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Interceptor para tratar erros HTTP
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('❌ Erro HTTP na API MongoDB:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
        
        // Se o backend retornou um erro estruturado, propagar
        if (error.response?.data) {
          throw new Error(error.response.data.error || error.response.data.message || error.message)
        }
        
        throw error
      }
    )
  }

  /**
   * Busca documentos com paginação
   * 
   * @param options Opções de busca
   * @returns Documentos paginados
   */
  async fetchDocuments(options: FetchDocumentsOptions): Promise<DocumentsResponse> {
    // Remover parâmetros undefined
    const params: any = {
      collection: options.collection,
      page: options.page || 1,
      size: options.size || 100
    }
    
    if (options.dtIni) params.dtIni = options.dtIni
    if (options.dtFim) params.dtFim = options.dtFim
    if (options.cnpjEmit) params.cnpjEmit = options.cnpjEmit
    if (options.cnpjDest) params.cnpjDest = options.cnpjDest
    
    const response = await this.client.get<DocumentsResponse>(`${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_MONGODB_PROXY_PORT!=''?':':''}${import.meta.env.VITE_MONGODB_PROXY_PORT}/api/documents`, { params });
    
    return response.data;
  }

  /**
   * Conta documentos que atendem aos filtros
   * 
   * @param options Opções de busca
   * @returns Contagem de documentos
   */
  async countDocuments(options: Omit<FetchDocumentsOptions, 'page' | 'size'>): Promise<number> {
    // Remover parâmetros undefined
    const params: any = {
      collection: options.collection
    }
    
    if (options.dtIni) params.dtIni = options.dtIni
    if (options.dtFim) params.dtFim = options.dtFim
    if (options.cnpjEmit) params.cnpjEmit = options.cnpjEmit
    if (options.cnpjDest) params.cnpjDest = options.cnpjDest
    
    const response = await this.client.get<CountResponse>(`${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_MONGODB_PROXY_PORT!=''?':':''}${import.meta.env.VITE_MONGODB_PROXY_PORT}/api/documents/count`, { params });
    
    return response.data.count;
  }

  /**
   * Executa agregação para analytics
   * 
   * @param options Opções de agregação
   * @returns Dados agregados para analytics
   */
  async aggregateAnalytics(options: AggregateAnalyticsOptions): Promise<AnalyticsResponse> {
    const response = await this.client.post<AnalyticsResponse>(`${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_MONGODB_PROXY_PORT!=''?':':''}${import.meta.env.VITE_MONGODB_PROXY_PORT}/api/aggregate/analytics`, {
      collection: options.collection,
      dtIni: options.dtIni,
      dtFim: options.dtFim,
      cnpjEmit: options.cnpjEmit,
      cnpjDest: options.cnpjDest
    });
    
    return response.data;
  }

  /**
   * Verifica saúde do servidor proxy
   * 
   * @returns Status do servidor
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }
}

/**
 * Instância global do serviço de API MongoDB
 * 
 * Configurada com a URL do servidor proxy a partir das variáveis de ambiente.
 */
export const mongoApiService = new MongoApiService({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_MONGODB_PROXY_PORT!=''?':':''}${import.meta.env.VITE_MONGODB_PROXY_PORT}`
});
