/**
 * Serviço de Documentos Fiscais
 * 
 * API pública para consulta de documentos fiscais (NF-e, CF-e, CT-e).
 * Substitui o api.ts anterior, usando MongoDB direto ao invés de REST API.
 * 
 * @module fiscalDocuments
 */

import { MongoQueryService, QueryOptions } from './mongoQuery';
import { DocumentMapperService, DocumentType } from './documentMapper';
import { MongoCacheService } from './mongoCache';
import { mongoConnectionService } from './mongoConnection';
import { DocumentoFiscal, DashboardStats } from '../types';

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
  database?: string;
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
 * Fornece métodos para buscar, contar e agregar documentos fiscais.
 */
export class FiscalDocumentsService {
  private queryService: MongoQueryService;
  private mapperService: DocumentMapperService;
  private cacheService: MongoCacheService;

  constructor(
    queryService: MongoQueryService,
    mapperService: DocumentMapperService,
    cacheService: MongoCacheService
  ) {
    this.queryService = queryService;
    this.mapperService = mapperService;
    this.cacheService = cacheService;
  }

  /**
   * Busca documentos fiscais
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
      collection = import.meta.env.VITE_DB_COLLECTION || 'tbl_nfe_100',
      database,
      page = 1,
      pageSize = parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '5000')
    } = options;

    // Monta filtro MongoDB
    const filter: any = {};
    
    if (dataInicio || dataFim) {
      filter.DT_DOC = {};
      if (dataInicio) filter.DT_DOC.$gte = new Date(dataInicio);
      if (dataFim) filter.DT_DOC.$lte = new Date(dataFim);
    }
    
    if (cnpjEmit) filter.CNPJ_EMIT = cnpjEmit;
    if (cnpjDest) filter.CNPJ_DEST = cnpjDest;
    if (status) filter.PROTOCOLADA = status === 'autorizada' ? 'Sim' : 'Não';

    const queryOptions: QueryOptions = {
      collection,
      database,
      filter,
      sort: { DT_DOC: -1 },
      skip: (page - 1) * pageSize,
      limit: pageSize
    };

    // Verifica cache
    const cacheKey = this.cacheService.getCacheKey(queryOptions);
    const cached = this.cacheService.getFromCache(cacheKey);

    if (cached?.complete) {
      onProgress?.(1, 1, cached.data, true);
      return cached.data;
    }

    // Busca do MongoDB
    const result = await this.queryService.find(queryOptions);
    
    // Mapeia documentos
    const docType = this.getDocumentType(collection);
    const mapped = this.mapperService.mapDocuments(result.data, docType);

    // Atualiza cache
    this.cacheService.updateCache(cacheKey, mapped, !result.hasMore, queryOptions);

    // Notifica progresso
    onProgress?.(result.page, Math.ceil(result.total / pageSize), mapped, false);

    return mapped;
  }

  /**
   * Conta documentos
   */
  public async fetchCount(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<number> {
    const {
      dataInicio,
      dataFim,
      cnpjEmit,
      cnpjDest,
      status,
      collection = import.meta.env.VITE_DB_COLLECTION || 'tbl_nfe_100',
      database
    } = options;

    const filter: any = {};
    
    if (dataInicio || dataFim) {
      filter.DT_DOC = {};
      if (dataInicio) filter.DT_DOC.$gte = new Date(dataInicio);
      if (dataFim) filter.DT_DOC.$lte = new Date(dataFim);
    }
    
    if (cnpjEmit) filter.CNPJ_EMIT = cnpjEmit;
    if (cnpjDest) filter.CNPJ_DEST = cnpjDest;
    if (status) filter.PROTOCOLADA = status === 'autorizada' ? 'Sim' : 'Não';

    return await this.queryService.count({
      collection,
      database,
      filter
    });
  }

  /**
   * Busca estatísticas do dashboard
   */
  public async fetchStats(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<DashboardStats> {
    const {
      dataInicio,
      dataFim,
      collection = import.meta.env.VITE_DB_COLLECTION || 'tbl_nfe_100',
      database
    } = options;

    const matchFilter: any = {};
    
    if (dataInicio || dataFim) {
      matchFilter.DT_DOC = {};
      if (dataInicio) matchFilter.DT_DOC.$gte = new Date(dataInicio);
      if (dataFim) matchFilter.DT_DOC.$lte = new Date(dataFim);
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalNotas: { $sum: 1 },
          valorTotal: { $sum: '$VL_DOC' },
          notasAutorizadas: {
            $sum: { $cond: [{ $eq: ['$PROTOCOLADA', 'Sim'] }, 1, 0] }
          },
          notasCanceladas: {
            $sum: { $cond: [{ $eq: ['$PROTOCOLADA', 'Não'] }, 1, 0] }
          }
        }
      }
    ];

    const results = await this.queryService.aggregate<any>(pipeline, {
      collection,
      database
    });

    if (results.length === 0) {
      return {
        totalNotas: 0,
        valorTotal: 0,
        notasAutorizadas: 0,
        notasCanceladas: 0
      };
    }

    return results[0];
  }

  /**
   * Determina tipo de documento pela collection
   */
  private getDocumentType(collection: string): DocumentType {
    if (collection.includes('nfe')) return 'nfe';
    if (collection.includes('cfe')) return 'cfe';
    if (collection.includes('cte')) return 'cte';
    return 'nfe';
  }
}

/**
 * Instância global do serviço
 */
export const fiscalDocumentsService = new FiscalDocumentsService(
  new MongoQueryService(mongoConnectionService),
  new DocumentMapperService(),
  new MongoCacheService()
);
