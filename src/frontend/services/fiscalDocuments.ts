/**
 * Serviço de Documentos Fiscais
 * 
 * API pública para consulta de documentos fiscais (NF-e, CF-e, CT-e).
 * Comunica-se com o backend via HTTP API.
 * 
 * @module fiscalDocuments
 */

import { DocumentoFiscal, DashboardStats } from '../types';
import { httpService } from './httpService';

interface DocumentsResponse {
  success: boolean;
  data: DocumentoFiscal[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  executionTime: number;
}

interface CountResponse {
  success: boolean;
  count: number;
}

interface StatsResponse {
  stats: DashboardStats;
}

/**
 * Opções de busca de documentos
 */
export interface FetchOptions {
  dataInicio?: string;
  dataFim?: string;
  cnpjEmit?: string;
  cnpjDest?: string;
  status?: string;
  collection?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Callback de progresso
 */
export type ProgressCallback = (
  current: number,
  total: number,
  data: any[],
  fromCache?: boolean
) => void;

/**
 * Serviço de Documentos Fiscais
 * 
 * Fornece métodos para buscar, contar e agregar documentos fiscais via API.
 */
export class FiscalDocumentsService {

  /**
   * Busca documentos fiscais via API
   */
  public async fetchDocuments(
    options: FetchOptions,
    onProgress?: ProgressCallback
  ): Promise<DocumentoFiscal[]> {
    const {
      dataInicio,
      dataFim,
      cnpjEmit,
      cnpjDest,
      status,
      collection = 'tbl_nfe_100',
      page = 1,
      pageSize = 500
    } = options;

    const params = new URLSearchParams();
    
    // Map frontend parameter names to backend expected names
    if (dataInicio) params.append('dtIni', dataInicio);
    if (dataFim) params.append('dtFim', dataFim);
    if (cnpjEmit) params.append('cnpjEmit', cnpjEmit);
    if (cnpjDest) params.append('cnpjDest', cnpjDest);
    if (status) params.append('status', status);
    if (collection) params.append('collection', collection);
    params.append('page', page.toString());
    params.append('size', pageSize.toString()); // Backend expects 'size', not 'pageSize'

    const url = `/api/documents?${params.toString()}`;
    console.log('🔍 DEBUG: Fazendo requisição para:', url);
    console.log('🔍 DEBUG: Parâmetros:', Object.fromEntries(params));

    const response = await httpService.get<DocumentsResponse>(url);
    
    console.log('📊 DEBUG: Response do httpService:', response);
    
    if (!response.success) {
      console.error('❌ DEBUG: Erro na resposta:', response.error);
      throw new Error(response.error || 'Erro ao buscar documentos');
    }

    console.log('📊 DEBUG: Dados extraídos da resposta:', {
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : 'null',
      dataArray: (response as any).data,
      dataArrayLength: (response as any).data?.length,
      pagination: (response as any).pagination,
      fullResponse: response
    });

    // O httpService retorna a resposta do backend diretamente quando tem success: true
    // Então response é na verdade { success: true, data: [...], pagination: {...} }
    const documents = (response as any).data || [];
    const pagination = (response as any).pagination || {};

    // Notifica progresso
    onProgress?.(
      pagination.page || 1, 
      pagination.totalPages || 1, 
      documents, 
      false
    );

    return documents;
  }

  /**
   * Conta documentos via API
   */
  public async fetchCount(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<number> {
    const {
      dataInicio,
      dataFim,
      cnpjEmit,
      cnpjDest,
      status,
      collection = 'tbl_nfe_100'
    } = options;

    const params = new URLSearchParams();
    
    // Map frontend parameter names to backend expected names
    if (dataInicio) params.append('dtIni', dataInicio);
    if (dataFim) params.append('dtFim', dataFim);
    if (cnpjEmit) params.append('cnpjEmit', cnpjEmit);
    if (cnpjDest) params.append('cnpjDest', cnpjDest);
    if (status) params.append('status', status);
    if (collection) params.append('collection', collection);

    const url = `/api/documents/count?${params.toString()}`;
    console.log('🔢 DEBUG: Fazendo requisição de count para:', url);
    console.log('🔢 DEBUG: Parâmetros count:', Object.fromEntries(params));

    const response = await httpService.get<CountResponse>(url);
    
    console.log('📊 DEBUG: Response do count:', response);
    
    if (!response.success) {
      console.error('❌ DEBUG: Erro na resposta do count:', response.error);
      throw new Error(response.error || 'Erro ao contar documentos');
    }

    // O httpService retorna a resposta do backend diretamente quando tem success: true
    // Então response é na verdade { success: true, count: 5200 }
    const count = (response as any).count || 0;
    console.log('📊 DEBUG: Count extraído da resposta:', count);

    return count;
  }

  /**
   * Busca estatísticas do dashboard via API
   */
  public async fetchStats(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<DashboardStats> {
    const {
      dataInicio,
      dataFim,
      collection = 'tbl_nfe_100'
    } = options;

    const params = new URLSearchParams();
    
    // Map frontend parameter names to backend expected names
    if (dataInicio) params.append('dtIni', dataInicio);
    if (dataFim) params.append('dtFim', dataFim);
    if (collection) params.append('collection', collection);

    const response = await httpService.get<StatsResponse>(`/api/documents/stats?${params.toString()}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erro ao buscar estatísticas');
    }

    return response.data?.stats || {} as DashboardStats;
  }
}

/**
 * Instância global do serviço
 */
export const fiscalDocumentsService = new FiscalDocumentsService();
