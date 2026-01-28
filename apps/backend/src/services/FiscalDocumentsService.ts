/**
 * FiscalDocumentsService - Serviço de Documentos Fiscais
 * 
 * Responsável por operações de busca e contagem de documentos fiscais
 * com suporte ao sistema de agrupamento configurável por CHV_NFE
 */

// 1. Node.js built-ins

// 2. External libraries
import { Db, MongoClient } from 'mongodb';

// 3. Internal packages (workspace)
import { NFE_GROUPING_LOG_PREFIXES } from '@fiscal/shared/constants/nfe-grouping.constants';

// 4. Relative imports
import { logger } from '../utils/logger';
import { databaseRouter } from './DatabaseRouter';
import { NFeQueryInterceptor } from './NFeQueryInterceptor';

export interface FiscalDocument {
  _id?: string
  CHV_NFE?: string
  DT_DOC?: string
  VL_DOC?: number
  NM_EMIT?: string
  [key: string]: any
}

export interface FetchDocumentsParams {
  collection: string
  filter?: Record<string, any>
  sort?: Record<string, 1 | -1>
  limit?: number
  skip?: number
}

export interface FetchCountParams {
  collection: string
  filter?: Record<string, any>
}

export interface FiscalDocumentsStats {
  totalDocuments: number
  groupedDocuments: number
  processingTime: number
  cacheHitRate: number
}

export class FiscalDocumentsService {
  private queryInterceptor: NFeQueryInterceptor;

  constructor(client?: MongoClient, db?: Db) {
    this.queryInterceptor = NFeQueryInterceptor.getInstance();
    if (client) {
      this.queryInterceptor.setMongoClient(client);
    }
  }

  async fetchDocuments(params: FetchDocumentsParams): Promise<FiscalDocument[]> {
    const startTime = Date.now();
    
    try {
      const { collection, filter = {}, sort = { DT_DOC: -1 }, limit = 100, skip = 0 } = params;
      
      logger.info(`${NFE_GROUPING_LOG_PREFIXES.SERVICE} 📄 Buscando documentos fiscais`, {
        collection,
        filter,
        limit,
        skip
      });

      // Obter conexão MongoDB dinamicamente se não houver um cliente fixo setado no interceptador
      const mongoConnection = await databaseRouter.getTransparentMongoConnection();
      if (mongoConnection.db) {
        this.queryInterceptor.setMongoClient(mongoConnection.getClient() as any);
      }

      // Usar interceptador para aplicar agrupamento configurável
      if (!mongoConnection.db) {
        logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Database não encontrada na conexão MongoDB`);
        throw new Error('Banco de dados não disponível na conexão MongoDB');
      }

      const result = await this.queryInterceptor.intercept(collection, filter, {
        sort,
        limit,
        skip
      }, mongoConnection.db);

      const processingTime = Date.now() - startTime;

      if (result.metadata.grouped) {
        logger.info(`${NFE_GROUPING_LOG_PREFIXES.SERVICE} ✅ Documentos agrupados retornados`, {
          collection,
          groupCount: result.metadata.groupCount,
          totalDocuments: result.metadata.totalDocuments,
          processingTime: result.metadata.processingTime,
          serviceProcessingTime: processingTime,
          normalizationApplied: result.metadata.normalizationApplied,
          fallbackUsed: result.metadata.fallbackUsed
        });
      } else {
        logger.info(`${NFE_GROUPING_LOG_PREFIXES.SERVICE} ✅ Documentos retornados sem agrupamento`, {
          collection,
          documentCount: result.data.length,
          processingTime: result.metadata.processingTime,
          serviceProcessingTime: processingTime,
          fallbackUsed: result.metadata.fallbackUsed
        });
      }

      return result.data;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro ao buscar documentos fiscais`, {
        error: error instanceof Error ? error.message : String(error),
        params,
        processingTime
      });
      throw error;
    }
  }

  async fetchCount(params: FetchCountParams): Promise<number> {
    const startTime = Date.now();
    
    try {
      const { collection, filter = {} } = params;
      
      logger.info(`${NFE_GROUPING_LOG_PREFIXES.SERVICE} 🔢 Contando documentos fiscais`, {
        collection,
        filter
      });

      // Para contagem, usar consulta direta otimizada
      // Roteamento automático de base de dados
      const mongoConnection = await databaseRouter.getTransparentMongoConnection();
      if (!mongoConnection.db) {
        throw new Error('Banco de dados não disponível na conexão MongoDB');
      }

      const coll = mongoConnection.db.collection(collection);
      const count = await coll.countDocuments(filter);

      const processingTime = Date.now() - startTime;

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.SERVICE} ✅ Contagem concluída`, {
        collection,
        count,
        processingTime
      });
      
      return count;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro ao contar documentos fiscais`, {
        error: error instanceof Error ? error.message : String(error),
        params,
        processingTime
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas agregadas para o dashboard
   */
  async fetchDashboardStats(params: FetchCountParams): Promise<{
    totalNotas: number,
    valorTotal: number,
    notasAutorizadas: number,
    notasCanceladas: number
  }> {
    const startTime = Date.now();
    
    try {
      const { collection, filter = {} } = params;
      
      // Roteamento automático de base de dados
      const mongoConnection = await databaseRouter.getTransparentMongoConnection();
      if (!mongoConnection.db) {
        throw new Error('Banco de dados não disponível na conexão MongoDB');
      }

      const coll = mongoConnection.db.collection(collection);
      
      // Usar o interceptador para garantir que as estatísticas considerem o agrupamento (deduplicação)
      const aggregationResult = await this.queryInterceptor.executeAggregation(collection, [
        { $match: filter },
        { 
          $group: {
            _id: null,
            totalNotas: { $sum: 1 },
            valorTotal: { $sum: { $ifNull: ['$VL_DOC', { $ifNull: ['$VALOR_TOTAL', 0] }] } },
            notasAutorizadas: { 
              $sum: { 
                $cond: [
                  { $or: [
                    { $eq: ['$STATUS', 'autorizada'] },
                    { $eq: ['$STATUS', '100'] },
                    { $eq: ['$STATUS', 'Autorizada'] },
                    { $eq: ['$PROTOCOLADA', 'Sim'] }
                  ]}, 
                  1, 0
                ] 
              } 
            },
            notasCanceladas: { 
              $sum: { 
                $cond: [
                  { $or: [
                    { $eq: ['$STATUS', 'cancelada'] },
                    { $eq: ['$STATUS', '101'] },
                    { $eq: ['$STATUS', 'Cancelada'] }
                  ]}, 
                  1, 0
                ] 
              } 
            }
          }
        }
      ], mongoConnection.db);

      const stats = aggregationResult[0] || {
        totalNotas: 0,
        valorTotal: 0,
        notasAutorizadas: 0,
        notasCanceladas: 0
      };

      const processingTime = Date.now() - startTime;

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.SERVICE} ✅ Estatísticas agregadas com sucesso`, {
        collection,
        stats,
        processingTime
      });
      
      return {
        totalNotas: stats.totalNotas,
        valorTotal: stats.valorTotal,
        notasAutorizadas: stats.notasAutorizadas,
        notasCanceladas: stats.notasCanceladas
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro ao agregar estatísticas`, {
        error: error instanceof Error ? error.message : String(error),
        params,
        processingTime
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas do serviço de documentos fiscais
   */
  getServiceStats(): FiscalDocumentsStats {
    return {
      totalDocuments: 0,
      groupedDocuments: 0,
      processingTime: 0,
      cacheHitRate: 0
    };
  }

  /**
   * Força atualização das configurações de agrupamento
   */
  refreshGroupingConfigurations(): void {
    logger.info(`${NFE_GROUPING_LOG_PREFIXES.SERVICE} 🔄 Atualizando configurações de agrupamento`);
    this.queryInterceptor.refreshConfigurations();
  }

  /**
   * Verifica se o agrupamento está habilitado globalmente
   */
  isGroupingEnabled(): boolean {
    const stats = this.queryInterceptor.getInterceptionStats();
    return stats.globalEnabled;
  }

  /**
   * Lista coleções suportadas para agrupamento
   */
  getSupportedCollections(): string[] {
    const stats = this.queryInterceptor.getInterceptionStats();
    return stats.supportedCollections;
  }
}

// Função factory para criar instância com dependências corretas (opcionais para testes)
export function createFiscalDocumentsService(client?: MongoClient, db?: Db): FiscalDocumentsService {
  return new FiscalDocumentsService(client, db);
}

// Exportar instância para uso nos testes e rotas
// A conexão será resolvida dinamicamente via DatabaseRouter
export const fiscalDocumentsService = new FiscalDocumentsService();