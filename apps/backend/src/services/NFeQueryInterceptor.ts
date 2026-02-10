/**
 * NFeQueryInterceptor - Interceptador de Consultas NFe
 * 
 * Responsável por interceptar consultas MongoDB para aplicar agrupamento configurável
 * de documentos NFe, preservando compatibilidade com código existente
 */

// 1. Node.js built-ins
import { NFE_GROUPING_DEFAULTS, NFE_GROUPING_LOG_PREFIXES, NFE_GROUPING_SUPPORTED_COLLECTIONS } from '@fiscal/shared/constants/nfe-grouping.constants';
import { QueryInterceptionError } from '@fiscal/shared/errors/query-interception-error.class';
import { InterceptionContext } from '@fiscal/shared/types/grouping/interception-context.interface';
import { InterceptionResult } from '@fiscal/shared/types/grouping/interception-result.interface';
import { Db, MongoClient } from 'mongodb';

// 4. Relative imports
import { DocumentTransformer } from '../utils/DocumentTransformer';
import { logger } from '../utils/logger';
import { GroupingConfigManager } from './GroupingConfigManager';
import { NFePrefixNormalizer } from './NFePrefixNormalizer';
import { OrderingProcessor } from './OrderingProcessor';

export class NFeQueryInterceptor {
  private static instance: NFeQueryInterceptor;
  private groupingManager: GroupingConfigManager;
  private prefixNormalizer: NFePrefixNormalizer;
  private orderingProcessor: OrderingProcessor;
  private mongoClient?: MongoClient;

  /**
   * Construtor que suporta injeção de dependências para testes
   */
  constructor(
    groupingManager?: GroupingConfigManager,
    prefixNormalizer?: NFePrefixNormalizer,
    orderingProcessor?: OrderingProcessor
  ) {
    this.groupingManager = groupingManager || new GroupingConfigManager();
    this.prefixNormalizer = prefixNormalizer || new NFePrefixNormalizer();
    this.orderingProcessor = orderingProcessor || new OrderingProcessor();
  }

  /**
   * Singleton pattern para garantir única instância
   */
  static getInstance(): NFeQueryInterceptor {
    if (!NFeQueryInterceptor.instance) {
      NFeQueryInterceptor.instance = new NFeQueryInterceptor();
    }
    return NFeQueryInterceptor.instance;
  }

  /**
   * Define cliente MongoDB para execução de consultas
   */
  setMongoClient(client: MongoClient): void {
    this.mongoClient = client;
  }

  /**
   * Intercepta e processa consulta MongoDB
   */
  async intercept(collection: string, query: any, options: any = {}, db?: Db): Promise<InterceptionResult> {
    const startTime = Date.now();
    const interceptId = `${collection}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🚀 Iniciando interceptação`, {
        interceptId,
        collection,
        querySize: JSON.stringify(query).length,
        optionsSize: JSON.stringify(options).length,
        timestamp: new Date().toISOString()
      });

      // Verificar se deve interceptar esta coleção
      if (!this.shouldIntercept(collection)) {
        logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} ⏭️ Interceptação ignorada`, {
          interceptId,
          collection,
          reason: 'Coleção não suportada',
          supportedCollections: NFE_GROUPING_SUPPORTED_COLLECTIONS,
          processingTime: Date.now() - startTime
        });
        return await this.executeOriginalQuery(collection, query, options, db);
      }

      // Obter configurações com timing
      const configStartTime = Date.now();
      const groupingConfig = this.groupingManager.getGroupingConfig(collection);
      const orderingConfig = this.groupingManager.getOrderingConfig(collection);
      const configTime = Date.now() - configStartTime;

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} ⚙️ Configurações obtidas`, {
        interceptId,
        collection,
        configTime,
        groupingEnabled: groupingConfig.enabled,
        globalEnabled: groupingConfig.globalEnabled,
        groupByFields: groupingConfig.groupByFields,
        orderingEnabled: orderingConfig.enabled,
        configSource: groupingConfig.source
      });

      // Verificar se agrupamento está habilitado
      if (!groupingConfig.enabled || !groupingConfig.globalEnabled) {
        logger.info(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} ⏭️ Agrupamento desabilitado`, {
          interceptId,
          collection,
          enabled: groupingConfig.enabled,
          globalEnabled: groupingConfig.globalEnabled,
          reason: !groupingConfig.enabled ? 'Agrupamento local desabilitado' : 'Agrupamento global desabilitado',
          processingTime: Date.now() - startTime
        });
        return await this.executeOriginalQuery(collection, query, options, db);
      }

      // Construir contexto de interceptação
      const context: InterceptionContext = {
        collection,
        originalQuery: query,
        groupingConfig,
        orderingConfig
      };

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔄 Consulta interceptada para agrupamento`, {
        interceptId,
        collection,
        groupByFields: groupingConfig.groupByFields,
        originalQueryFields: Object.keys(query),
        optionsProvided: Object.keys(options),
        normalizationRequired: groupingConfig.groupByFields.includes('CHV_NFE'),
        configTime
      });

      // Construir pipeline de agregação com timing
      const pipelineStartTime = Date.now();
      const pipeline = this.buildAggregationPipeline(context, options);
      const pipelineTime = Date.now() - pipelineStartTime;

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔧 Pipeline construído`, {
        interceptId,
        collection,
        pipelineStages: pipeline.length,
        stageTypes: pipeline.map(stage => Object.keys(stage)[0]),
        pipelineTime
      });

      // Executar agregação com timing detalhado
      const aggregationStartTime = Date.now();
      const results = await this.executeAggregation(collection, pipeline, db);
      const aggregationTime = Date.now() - aggregationStartTime;

      // Transformar resultados com timing
      const transformStartTime = Date.now();
      const transformedResults = this.transformResults(results, context);
      const transformTime = Date.now() - transformStartTime;

      const totalProcessingTime = Date.now() - startTime;

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} ✅ Agrupamento executado com sucesso`, {
        interceptId,
        collection,
        groupCount: results.length,
        totalDocuments: transformedResults.reduce((sum: number, group: any) => sum + (group.count || 1), 0),
        processingTime: totalProcessingTime,
        breakdown: {
          configTime,
          pipelineTime,
          aggregationTime,
          transformTime
        },
        performance: {
          documentsPerMs: transformedResults.reduce((sum: number, group: any) => sum + (group.count || 1), 0) / Math.max(totalProcessingTime, 1),
          avgGroupSize: transformedResults.reduce((sum: number, group: any) => sum + (group.count || 1), 0) / Math.max(results.length, 1)
        }
      });

      return {
        success: true,
        data: transformedResults,
        metadata: {
          grouped: true,
          groupCount: results.length,
          totalDocuments: transformedResults.reduce((sum: number, group: any) => sum + (group.count || 1), 0),
          processingTime: totalProcessingTime,
          cacheUsed: false, // TODO: Implementar cache
          normalizationApplied: groupingConfig.groupByFields.includes('CHV_NFE'),
          fallbackUsed: false,
          interceptId,
          breakdown: {
            configTime,
            pipelineTime,
            aggregationTime,
            transformTime
          }
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro durante interceptação`, {
        interceptId,
        collection,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        processingTime,
        query: JSON.stringify(query),
        options: JSON.stringify(options)
      });

      // Fallback para consulta original
      logger.warn(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔄 Executando fallback para consulta original`, {
        interceptId,
        collection,
        reason: 'Erro na interceptação'
      });
      
      const fallbackResult = await this.executeOriginalQuery(collection, query, options, db);
      fallbackResult.metadata.fallbackUsed = true;
      fallbackResult.metadata.interceptId = interceptId;
      
      return fallbackResult;
    }
  }

  /**
   * Constrói e retorna os estágios de pipeline para agrupamento e ordenação
   */
  public getGroupingStages(collection: string, query: any, options: any = {}): any[] {
    const groupingConfig = this.groupingManager.getGroupingConfig(collection);
    const orderingConfig = this.groupingManager.getOrderingConfig(collection);

    const context: InterceptionContext = {
      collection,
      originalQuery: query,
      groupingConfig,
      orderingConfig
    };

    const pipeline = this.buildAggregationPipeline(context, { ...options, skipMatch: true });
    
    // Remove skip/limit se existirem, pois para estágios de agrupamento queremos flexibilidade
    return pipeline.filter(stage => !stage.$skip && !stage.$limit);
  }

  /**
   * Constrói pipeline de agregação MongoDB
   */
  private buildAggregationPipeline(context: InterceptionContext, options: any = {}): any[] {
    const pipeline: any[] = [];
    const isChvNfeGroup = context.groupingConfig.groupByFields.includes('CHV_NFE');
    const isNFeCollection = context.collection === 'tbl_nfe_100';

    try {
      // 1. Aplicar filtros da consulta original (pode ser pulado se o chamador quiser explicitamente)
      if (!options.skipMatch && Object.keys(context.originalQuery).length > 0) {
        pipeline.push({ $match: context.originalQuery });
      }

      // 2. STATUS_MANIFESTACAO (Apenas para NF-e)
      // Conforme especificação: join com tbl_proc_evento_nfe, CStat=135, TpEvento de manifestação
      if (isNFeCollection) {
        // Estágio para criar campo de join sem o prefixo "NFe"
        pipeline.push({
          $addFields: {
            chvJoin: {
              $cond: [
                { $eq: [{ $substrBytes: ["$CHV_NFE", 0, 3] }, "NFe"] },
                { $substrBytes: ["$CHV_NFE", 3, 44] },
                "$CHV_NFE"
              ]
            }
          }
        });

        // Lookup para buscar o último evento de manifestação autorizado
        pipeline.push({
          $lookup: {
            from: "tbl_proc_evento_nfe",
            let: { ch: "$chvJoin" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$ChNFe", "$$ch"] },
                      { $eq: ["$CStat", 135] },
                      { $in: ["$TpEvento", ["210200", "210210", "210220", "210240"]] }
                    ]
                  }
                }
              },
              { $sort: { DhRegEvento: -1 } },
              { $limit: 1 },
              { $project: { DescEvento: 1, _id: 0 } }
            ],
            as: "manif"
          }
        });

        // Extrair o resultado do lookup para a raiz como STATUS_MANIFESTACAO
        pipeline.push({
          $addFields: {
            STATUS_MANIFESTACAO: {
              $ifNull: [
                { $arrayElemAt: ["$manif.DescEvento", 0] },
                ""
              ]
            }
          }
        });

        // Limpar campos auxiliares
        pipeline.push({ $project: { manif: 0, chvJoin: 0 } });
      }

      // 3. Aplicar ordenação PRÉ-agrupamento (define quem é o "primeiro" do grupo)
      let sortStage: any;
      if (options.sort && Object.keys(options.sort).length > 0) {
        sortStage = { $sort: options.sort };
      } else if (context.orderingConfig.enabled) {
        try {
          const orderingFields = this.orderingProcessor.parseOrderingConfig(context.orderingConfig.defaultOrdering);
          sortStage = this.orderingProcessor.buildSortStage(orderingFields);
        } catch (error) {
          logger.warn(`${NFE_GROUPING_LOG_PREFIXES.WARNING} ⚠️ Ordenação malformatada, usando fallback`, { error });
          sortStage = { $sort: { DT_DOC: -1, PROTOCOLADA: -1 } };
        }
      }

      if (sortStage) {
        pipeline.push(sortStage);
      }

      // 3. Normalizar chaves CHV_NFE se necessário
      if (isChvNfeGroup) {
        const normalizationStages = this.prefixNormalizer.createNormalizationPipeline();
        pipeline.push(...normalizationStages);
      }

      // 4. Agrupar documentos
      const groupId: any = {};
      context.groupingConfig.groupByFields.forEach((field: string) => {
        if (field === 'CHV_NFE') {
          groupId.CHV_NFE_NORMALIZED = '$CHV_NFE_NORMALIZED';
        } else {
          groupId[field] = `$${field}`;
        }
      });

      pipeline.push({
        $group: {
          _id: groupId,
          doc: { $first: isChvNfeGroup ? '$ORIGINAL_DOC' : '$$ROOT' },
          count: { $sum: 1 }
        }
      });

      // 5. Achatamento (ReplaceRoot) - O documento original volta para a raiz
      pipeline.push({ $replaceRoot: { newRoot: '$doc' } });

      // 6. Aplicar ordenação PÓS-agrupamento (define a ordem final da lista)
      if (sortStage) {
        pipeline.push(sortStage);
      }

      // 7. Aplicar skip/limit
      if (options.skip && options.skip > 0) pipeline.push({ $skip: options.skip });
      if (options.limit && options.limit > 0) pipeline.push({ $limit: options.limit });

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔧 Pipeline final construído`, {
        collection: context.collection,
        stages: pipeline.map(s => Object.keys(s)[0])
      });

      return pipeline;

    } catch (error) {
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro ao construir pipeline`, {
        error: error instanceof Error ? error.message : String(error),
        collection: context.collection
      });
      throw new QueryInterceptionError('Falha na construção do pipeline de agregação');
    }
  }

  public async executeAggregation(collection: string, pipeline: any[], db?: Db): Promise<any[]> {
    const aggregationId = `${collection}-agg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const timeout = parseInt(process.env.NFE_GROUPING_AGGREGATION_TIMEOUT_MS || NFE_GROUPING_DEFAULTS.AGGREGATION_TIMEOUT_MS.toString());

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🚀 Iniciando agregação MongoDB`, {
        aggregationId,
        collection,
        pipelineStages: pipeline.length,
        timeout
      });

      const mongoDb = db || this.mongoClient?.db();
      if (!mongoDb) {
        throw new QueryInterceptionError('Banco de dados ou Cliente MongoDB não configurado');
      }

      const mongoCollection = mongoDb.collection(collection);

      const aggregationStartTime = Date.now();
      const results = await mongoCollection.aggregate(pipeline, {
        maxTimeMS: timeout,
        allowDiskUse: true
      }).toArray();
      const aggregationTime = Date.now() - aggregationStartTime;

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 📊 Agregação executada com sucesso`, {
        aggregationId,
        collection,
        resultCount: results.length,
        aggregationTime
      });

      return results;

    } catch (error) {
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro na execução da agregação`, {
        aggregationId,
        collection,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new QueryInterceptionError('Falha na execução da agregação MongoDB');
    }
  }

  /**
   * Transforma resultados para garantir conformidade com interface esperada
   */
  private transformResults(results: any[], context: InterceptionContext): any[] {
    const transformId = `${context.collection}-transform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔄 Iniciando transformação de resultados`, {
        transformId,
        collection: context.collection,
        inputResultCount: results.length
      });

      const transformedResults = results.map((doc) => {
        if (!doc) return doc;
        
        // Aplicar transformação de aninhamento (DocumentTransformer)
        // Isso reconstrói 'totais', 'emitente' e 'destinatario' a partir de campos planos
        return DocumentTransformer.nestDocument(doc);
      });

      const transformTime = Date.now() - startTime;

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} ✅ Transformação concluída`, {
        transformId,
        collection: context.collection,
        outputCount: transformedResults.length,
        transformTime
      });

      return transformedResults;

    } catch (error) {
      const transformTime = Date.now() - startTime;
      
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro na transformação de resultados`, {
        transformId,
        collection: context.collection,
        error: error instanceof Error ? error.message : String(error),
        resultsCount: results.length,
        transformTime
      });
      throw new QueryInterceptionError('Falha na transformação dos resultados');
    }
  }

  /**
   * Executa consulta original com ordenação universal aplicada
   */
  public async executeOriginalQuery(collection: string, query: any, options: any, db?: Db): Promise<InterceptionResult> {
    const startTime = Date.now();
    const queryId = `${collection}-original-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (!this.mongoClient) {
        throw new QueryInterceptionError('Cliente MongoDB não configurado');
      }

      const mongoDb = db || this.mongoClient?.db();
      if (!mongoDb) {
        throw new QueryInterceptionError('Banco de dados ou Cliente MongoDB não configurado');
      }
      
      const mongoCollection = mongoDb.collection(collection);

      // Determinar ordenação universal
      let sort = options.sort;
      if (!sort || Object.keys(sort).length === 0) {
        const orderingConfig = this.groupingManager.getOrderingConfig(collection);
        if (orderingConfig.enabled) {
          try {
            const orderingFields = this.orderingProcessor.parseOrderingConfig(orderingConfig.defaultOrdering);
            sort = {};
            orderingFields.forEach(f => { sort[f.field] = f.direction; });
          } catch (error) {
            logger.warn(`${NFE_GROUPING_LOG_PREFIXES.WARNING} ⚠️ Ordenação malformatada no find(), usando fallback`, { error });
            sort = { DT_DOC: -1, PROTOCOLADA: -1 };
          }
        }
      }

      const timeout = parseInt(process.env.NFE_GROUPING_QUERY_TIMEOUT_MS || NFE_GROUPING_DEFAULTS.QUERY_TIMEOUT_MS.toString());

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔍 Executando consulta original`, {
        queryId,
        collection,
        sort,
        timeout
      });

      const cursor = mongoCollection.find(query, {
        maxTimeMS: timeout
      });

      if (sort && Object.keys(sort).length > 0) {
        cursor.sort(sort);
      }

      if (options.skip) cursor.skip(options.skip);
      if (options.limit) cursor.limit(options.limit);

      const results = await cursor.toArray();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: results,
        metadata: {
          grouped: false,
          groupCount: 0,
          totalDocuments: results.length,
          processingTime,
          cacheUsed: false,
          normalizationApplied: false,
          fallbackUsed: false,
          queryId
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro na consulta original`, {
        queryId,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });
      throw new QueryInterceptionError('Falha na execução da consulta original');
    }
  }

  /**
   * Verifica se deve interceptar consulta para esta coleção
   */
  public shouldIntercept(collection: string): boolean {
    return NFE_GROUPING_SUPPORTED_COLLECTIONS.includes(collection as any);
  }

  /**
   * Obtém estatísticas de interceptação
   */
  getInterceptionStats(): {
    supportedCollections: string[];
    globalEnabled: boolean;
    configCacheSize: number;
  } {
    return {
      supportedCollections: [...NFE_GROUPING_SUPPORTED_COLLECTIONS],
      globalEnabled: this.groupingManager.isGloballyEnabled(),
      configCacheSize: 0 // TODO: Implementar contagem de cache
    };
  }

  /**
   * Força atualização de configurações
   */
  refreshConfigurations(): void {
    this.groupingManager.refreshConfig();
    logger.info(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} 🔄 Configurações atualizadas`);
  }
}