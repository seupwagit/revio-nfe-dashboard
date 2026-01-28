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
        pipelineTime,
        estimatedComplexity: this.calculatePipelineComplexity(pipeline)
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
   * Calcula a complexidade estimada do pipeline de agregação
   */
  private calculatePipelineComplexity(pipeline: any[]): string {
    let complexity = 0;
    
    pipeline.forEach(stage => {
      const stageType = Object.keys(stage)[0];
      switch (stageType) {
        case '$match':
          complexity += 1;
          break;
        case '$addFields':
          complexity += 2;
          break;
        case '$group':
          complexity += 5; // Operação mais custosa
          break;
        case '$sort':
          complexity += 3;
          break;
        case '$skip':
        case '$limit':
          complexity += 1;
          break;
        default:
          complexity += 2;
      }
    });

    if (complexity <= 5) return 'low';
    if (complexity <= 10) return 'medium';
    if (complexity <= 15) return 'high';
    return 'very-high';
  }

  /**
   * Constrói pipeline de agregação MongoDB
   */
  private buildAggregationPipeline(context: InterceptionContext, options: any = {}): any[] {
    const pipeline: any[] = [];

    try {
      // 1. Aplicar filtros da consulta original
      if (Object.keys(context.originalQuery).length > 0) {
        pipeline.push({ $match: context.originalQuery });
      }

      // 2. Normalizar chaves CHV_NFE se necessário
      if (context.groupingConfig.groupByFields.includes('CHV_NFE')) {
        const normalizationStages = this.prefixNormalizer.createNormalizationPipeline();
        pipeline.push(...normalizationStages);
      }

      // 3. Agrupar documentos
      const groupStage = this.buildGroupStage(context.groupingConfig);
      pipeline.push(groupStage);

      // 4. Aplicar ordenação
      if (options.sort) {
        pipeline.push({ $sort: options.sort });
      } else if (context.orderingConfig.enabled && context.orderingConfig.fields.length > 0) {
        const orderingFields = this.orderingProcessor.parseOrderingConfig(context.orderingConfig.defaultOrdering);
        const sortStage = this.orderingProcessor.buildSortStage(orderingFields);
        pipeline.push(sortStage);
      }

      // 5. Aplicar skip se especificado
      if (options.skip && options.skip > 0) {
        pipeline.push({ $skip: options.skip });
      }

      // 6. Aplicar limit se especificado
      if (options.limit && options.limit > 0) {
        pipeline.push({ $limit: options.limit });
      }

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔧 Pipeline construído`, {
        collection: context.collection,
        stagesCount: pipeline.length,
        stages: pipeline.map((stage, index) => `${index + 1}. ${Object.keys(stage)[0]}`),
        options
      });

      return pipeline;

    } catch (error) {
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro ao construir pipeline`, {
        error: error instanceof Error ? error.message : String(error),
        context,
        options
      });
      throw new QueryInterceptionError('Falha na construção do pipeline de agregação');
    }
  }

  /**
   * Constrói stage de agrupamento
   */
  private buildGroupStage(groupingConfig: any): any {
    const groupId: any = {};

    // Construir _id do grupo baseado nos campos de agrupamento
    groupingConfig.groupByFields.forEach((field: string) => {
      if (field === 'CHV_NFE') {
        groupId.CHV_NFE_NORMALIZED = '$CHV_NFE_NORMALIZED';
      } else {
        groupId[field] = `$${field}`;
      }
    });

    return {
      $group: {
        _id: groupId,
        documents: { $push: '$$ROOT' },
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$VL_DOC', 0] } },
        latestDocument: { $last: '$$ROOT' },
        originalKeys: { $addToSet: '$CHV_NFE' },
        hasNFePrefix: {
          $max: {
            $cond: [
              { $eq: [{ $substr: ['$CHV_NFE', 0, 3] }, 'NFe'] },
              true,
              false
            ]
          }
        }
      }
    };
  }

  public async executeAggregation(collection: string, pipeline: any[], db?: Db): Promise<any[]> {
    const aggregationId = `${collection}-agg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🚀 Iniciando agregação MongoDB`, {
        aggregationId,
        collection,
        pipelineStages: pipeline.length,
        stageTypes: pipeline.map(stage => Object.keys(stage)[0]),
        timeout: NFE_GROUPING_DEFAULTS.AGGREGATION_TIMEOUT_MS,
        estimatedComplexity: this.calculatePipelineComplexity(pipeline)
      });

      const mongoDb = db || this.mongoClient?.db();
      if (!mongoDb) {
        throw new QueryInterceptionError('Banco de dados ou Cliente MongoDB não configurado');
      }

      const mongoCollection = mongoDb.collection(collection);

      const aggregationStartTime = Date.now();
      const results = await mongoCollection.aggregate(pipeline, {
        maxTimeMS: NFE_GROUPING_DEFAULTS.AGGREGATION_TIMEOUT_MS,
        allowDiskUse: true
      }).toArray();
      const aggregationTime = Date.now() - aggregationStartTime;

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 📊 Agregação executada com sucesso`, {
        aggregationId,
        collection,
        pipelineStages: pipeline.length,
        resultCount: results.length,
        aggregationTime,
        performance: {
          resultsPerMs: results.length / Math.max(aggregationTime, 1),
          avgResultSize: results.length > 0 ? JSON.stringify(results[0]).length : 0
        }
      });

      return results;

    } catch (error) {
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro na execução da agregação`, {
        aggregationId,
        collection,
        pipelineStages: pipeline.length,
        stageTypes: pipeline.map(stage => Object.keys(stage)[0]),
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timeout: NFE_GROUPING_DEFAULTS.AGGREGATION_TIMEOUT_MS
      });
      throw new QueryInterceptionError('Falha na execução da agregação MongoDB');
    }
  }

  /**
   * Transforma resultados agrupados para formato esperado
   */
  private transformResults(results: any[], context: InterceptionContext): any[] {
    const transformId = `${context.collection}-transform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔄 Iniciando transformação de resultados`, {
        transformId,
        collection: context.collection,
        inputResultCount: results.length,
        groupByFields: context.groupingConfig.groupByFields
      });

      const transformedResults = results.map((group, index) => {
        const mapNota = (doc: any) => {
          if (!doc) return doc;
          return {
            ...doc,
            // Identificação
            id: doc._id?.toString() || doc.id,
            chaveAcesso: doc.CHV_NFE || doc.chaveAcesso,
            numero: doc.NUM_DOC || doc.NUMERO || doc.numero,
            serie: doc.SERIE || doc.serie,
            modelo: doc.MODELO || doc.modelo,
            
            // Datas e Status
            dataEmissao: doc.DT_DOC || doc.dataEmissao,
            status: doc.status || doc.STATUS || (doc.PROTOCOLADA === 'Sim' ? 'autorizada' : 'pendente'),
            protocolada: doc.PROTOCOLADA || (doc.status === 'autorizada' ? 'Sim' : 'Não'),
            
            // Operação
            tipo: doc.tipo || 'NF-e',
            tipoOperacao: String(doc.tipoOperacao ?? doc.IND_OPER ?? (doc.CNPJ_EMIT === doc.CNPJ_BASE ? '1' : '0')),
            naturezaOperacao: doc.NAT_OP || doc.NAT_OPER || doc.naturezaOperacao,
            
            // Valores
            valorTotal: Number(doc.valorTotal ?? doc.VL_DOC ?? doc.VALOR_TOTAL ?? 0),
            totais: {
              baseCalculo: Number(doc.totais?.baseCalculo ?? doc.VL_BC_ICMS ?? doc.VL_BC ?? doc.V_BC ?? 0),
              valorICMS: Number(doc.totais?.valorICMS ?? doc.VL_ICMS ?? doc.VALOR_ICMS ?? doc.V_ICMS ?? 0),
              valorIPI: Number(doc.totais?.valorIPI ?? doc.VL_IPI ?? doc.VALOR_IPI ?? doc.V_IPI ?? 0),
              valorPIS: Number(doc.totais?.valorPIS ?? doc.VL_PIS ?? doc.VALOR_PIS ?? doc.V_PIS ?? 0),
              valorCOFINS: Number(doc.totais?.valorCOFINS ?? doc.VL_COFINS ?? doc.VALOR_COFINS ?? doc.V_COFINS ?? 0),
              valorFrete: Number(doc.totais?.valorFrete ?? doc.VL_FRETE ?? doc.VALOR_FRETE ?? doc.V_FRETE ?? 0),
              valorSeguro: Number(doc.totais?.valorSeguro ?? doc.VL_SEG ?? doc.VL_SEGURO ?? doc.VALOR_SEGURO ?? doc.V_SEG ?? 0),
              valorDesconto: Number(doc.totais?.valorDesconto ?? doc.VL_DESC ?? doc.VALOR_DESCONTO ?? doc.V_DESC ?? 0),
              valorOutros: Number(doc.totais?.valorOutros ?? doc.VL_OUTRO ?? doc.VL_OUTROS ?? doc.V_OUTRO ?? 0)
            },
            
            // Emitente
            emitente: {
              cnpj: doc.emitente?.cnpj || doc.CNPJ_EMIT || doc.CPF_EMIT || '',
              razaoSocial: doc.emitente?.razaoSocial || doc.NOME_EMIT || doc.RAZAO_EMIT || '',
              nomeFantasia: doc.emitente?.nomeFantasia || doc.FANTASIA_EMIT || doc.NOME_EMIT || '',
              ie: doc.emitente?.ie || doc.IE_EMIT || doc.IE || '',
              endereco: doc.emitente?.endereco || doc.END_EMIT || '',
              municipio: doc.emitente?.municipio || doc.MUN_EMIT || '',
              uf: doc.emitente?.uf || doc.UF_EMIT || ''
            },
            
            // Destinatário
            destinatario: {
              cnpj: doc.destinatario?.cnpj || doc.CNPJ_DEST || doc.CPF_DEST || '',
              cpfCnpj: doc.destinatario?.cpfCnpj || doc.CPF_CNPJ_DEST || doc.CNPJ_DEST || doc.CPF_DEST || '',
              razaoSocial: doc.destinatario?.razaoSocial || doc.NOME_DEST || doc.RAZAO_DEST || '',
              nome: doc.destinatario?.nome || doc.NOME_DEST || doc.RAZAO_DEST || '',
              ie: doc.destinatario?.ie || doc.IE_DEST || '',
              endereco: doc.destinatario?.endereco || doc.END_DEST || '',
              municipio: doc.destinatario?.municipio || doc.MUN_DEST || '',
              uf: doc.destinatario?.uf || doc.UF_DEST || ''
            },
            
            // Carga (CT-e)
            carga: {
              produto: doc.carga?.produto || doc.infCarga?.proPred || doc.PREV_FRETE || '',
              peso: Number(doc.carga?.peso || doc.infCarga?.vCarga || doc.PESO_L || doc.PESO_B || 0),
              volume: Number(doc.carga?.volume || doc.infCarga?.qCarga || doc.Q_VOL || 0),
              unidade: doc.carga?.unidade || doc.infCarga?.cUnid || ''
            },
            
            // Valores (CT-e)
            valores: {
              servico: Number(doc.valores?.servico || doc.vPrest?.vTPrest || 0),
              receber: Number(doc.valores?.receber || doc.vPrest?.vRec || 0),
              icms: Number(doc.valores?.icms || doc.imp?.ICMS?.vICMS || 0),
              baseCalculo: Number(doc.valores?.baseCalculo || doc.imp?.ICMS?.vBC || 0)
            },
            
            // Transporte
            transporte: {
              modalidade: doc.transporte?.modalidade || doc.MOD_FRETE || '',
              transportadora: {
                cnpj: doc.transporte?.transportadora?.cnpj || doc.TRANSP_CNPJ || '',
                razaoSocial: doc.transporte?.transportadora?.razaoSocial || doc.TRANSP_NOME || ''
              },
              veiculo: {
                placa: doc.transporte?.veiculo?.placa || doc.VEIC_PLACA || doc.rodo?.veic?.placa || '',
                uf: doc.transporte?.veiculo?.uf || doc.VEIC_UF || doc.rodo?.veic?.UF || ''
              }
            }
          };
        };

        // Se há apenas um documento no grupo, retornar o documento diretamente
        if (group.count === 1 && group.documents && group.documents.length === 1) {
          logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 📄 Grupo ${index + 1}: documento único`, {
            transformId,
            groupId: group._id,
            documentId: group.documents[0]._id
          });
          return mapNota(group.documents[0]);
        }

        // Para múltiplos documentos, retornar estrutura agrupada compatível com o frontend
        logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 📦 Grupo ${index + 1}: múltiplos documentos`, {
          transformId,
          groupId: group._id,
          documentCount: group.count,
          totalValue: group.totalValue,
          hasNFePrefix: group.hasNFePrefix
        });

        const mappedLatest = mapNota(group.latestDocument);

        return {
          ...mappedLatest, // Espalha campos do documento (id, valor, etc) na raiz para o Grid
          _id: group._id,  // Mantém _id do grupo para o MongoDB
          documents: (group.documents || []).map(mapNota),
          count: group.count || 0,
          totalValue: group.totalValue || 0,
          latestDocument: mappedLatest,
          metadata: {
            isGroup: true,
            hasNFePrefix: group.hasNFePrefix || false,
            originalKeys: group.originalKeys || [],
            groupedBy: context.groupingConfig.groupByFields
          }
        };
      });

      const transformTime = Date.now() - startTime;

      logger.info(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} ✅ Transformação concluída`, {
        transformId,
        collection: context.collection,
        inputCount: results.length,
        outputCount: transformedResults.length,
        transformTime,
        singleDocumentGroups: transformedResults.filter(r => !r.documents).length,
        multiDocumentGroups: transformedResults.filter(r => r.documents).length
      });

      return transformedResults;

    } catch (error) {
      const transformTime = Date.now() - startTime;
      
      logger.error(`${NFE_GROUPING_LOG_PREFIXES.ERROR} ❌ Erro na transformação de resultados`, {
        transformId,
        collection: context.collection,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        resultsCount: results.length,
        transformTime
      });
      throw new QueryInterceptionError('Falha na transformação dos resultados');
    }
  }

  /**
   * Executa consulta original sem agrupamento
   */
  public async executeOriginalQuery(collection: string, query: any, options: any, db?: Db): Promise<InterceptionResult> {
    const startTime = Date.now();
    const queryId = `${collection}-original-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (!this.mongoClient) {
        throw new QueryInterceptionError('Cliente MongoDB não configurado');
      }

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} 🔍 Executando consulta original`, {
        queryId,
        collection,
        queryFields: Object.keys(query),
        optionsProvided: Object.keys(options),
        timeout: NFE_GROUPING_DEFAULTS.QUERY_TIMEOUT_MS
      });
      
      const mongoDb = db || this.mongoClient?.db();
      if (!mongoDb) {
        throw new QueryInterceptionError('Banco de dados ou Cliente MongoDB não configurado');
      }
      
      const mongoCollection = mongoDb.collection(collection);

      const results = await mongoCollection.find(query, {
        ...options,
        maxTimeMS: NFE_GROUPING_DEFAULTS.QUERY_TIMEOUT_MS
      }).toArray();

      const processingTime = Date.now() - startTime;

      logger.debug(`${NFE_GROUPING_LOG_PREFIXES.INTERCEPTION} ✅ Consulta original executada`, {
        queryId,
        collection,
        resultCount: results.length,
        processingTime,
        avgDocumentSize: results.length > 0 ? JSON.stringify(results[0]).length : 0
      });

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
        collection,
        query: JSON.stringify(query),
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        processingTime
      });
      throw new QueryInterceptionError('Falha na execução da consulta original');
    }
  }

  /**
   * Verifica se deve interceptar consulta para esta coleção
   */
  private shouldIntercept(collection: string): boolean {
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