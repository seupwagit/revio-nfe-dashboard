/**
 * Serviço de Documentos Fiscais
 * 
 * API pública para consulta de documentos fiscais (NF-e, CF-e, CT-e).
 * Comunica-se com o backend via HTTP API.
 * 
 * @module fiscalDocuments
 */

import { FilterItem } from '@fiscal/shared';
import { DashboardStats, DocumentoFiscal } from '../types';
import { httpService } from './httpService';

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
  dynamicFilters?: FilterItem[];
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
    if (dataFim) params.append('dtFin', dataFim);
    if (cnpjEmit) params.append('cnpjEmit', cnpjEmit);
    if (cnpjDest) params.append('cnpjDest', cnpjDest);
    if (status) params.append('status', status);
    if (collection) params.append('collection', collection);
    if (options.dynamicFilters && options.dynamicFilters.length > 0) {
      params.append('filters', JSON.stringify(options.dynamicFilters));
    }
    params.append('page', page.toString());
    params.append('size', pageSize.toString()); // Backend expects 'size', not 'pageSize'

    const url = `/api/documents?${params.toString()}`;
    console.log('🔍 DEBUG: Fazendo requisição para:', url);
    console.log('🔍 DEBUG: Parâmetros:', Object.fromEntries(params));

    const response = await httpService.get<any>(url);
    
    console.log('📊 DEBUG: Response do httpService:', response);
    
    if (!response || typeof response !== 'object') {
      console.error('❌ DEBUG: Resposta inválida:', response);
      throw new Error('Resposta inválida do servidor');
    }

    // O backend agora retorna { success, data, pagination }
    const documents = response.data || [];
    const pagination = response.pagination || {};

    console.log('📊 DEBUG: Dados extraídos da resposta:', {
      documentsLength: documents.length,
      pagination,
      fullResponse: response
    });

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
    if (dataFim) params.append('dtFin', dataFim);
    if (cnpjEmit) params.append('cnpjEmit', cnpjEmit);
    if (cnpjDest) params.append('cnpjDest', cnpjDest);
    if (status) params.append('status', status);
    if (collection) params.append('collection', collection);
    if (options.dynamicFilters && options.dynamicFilters.length > 0) {
      params.append('filters', JSON.stringify(options.dynamicFilters));
    }

    const url = `/api/documents/count?${params.toString()}`;
    console.log('🔢 DEBUG: Fazendo requisição de count para:', url);
    console.log('🔢 DEBUG: Parâmetros count:', Object.fromEntries(params));

    const response = await httpService.get<any>(url);
    
    console.log('📊 DEBUG: Response do count:', response);
    
    if (!response || typeof response !== 'object') {
      console.error('❌ DEBUG: Resposta inválida do count:', response);
      throw new Error('Resposta inválida do servidor');
    }

    // O httpService retorna a resposta do backend diretamente
    const count = response.count || 0;
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
      cnpjEmit,
      cnpjDest,
      status,
      collection = 'tbl_nfe_100'
    } = options;

    const params = new URLSearchParams();
    
    // Map frontend parameter names to backend expected names
    if (dataInicio) params.append('dtIni', dataInicio);
    if (dataFim) params.append('dtFin', dataFim);
    if (cnpjEmit) params.append('cnpjEmit', cnpjEmit);
    if (cnpjDest) params.append('cnpjDest', cnpjDest);
    if (status) params.append('status', status);
    if (collection) params.append('collection', collection);
    if (options.dynamicFilters && options.dynamicFilters.length > 0) {
      params.append('filters', JSON.stringify(options.dynamicFilters));
    }

    const response = await httpService.get<any>(`/api/documents/stats?${params.toString()}`);
    
    if (!response || typeof response !== 'object') {
      throw new Error('Resposta inválida do servidor');
    }

    return response.stats || {} as DashboardStats;
  }
}

/**
 * Instância global do serviço
 */
export const fiscalDocumentsService = new FiscalDocumentsService();
