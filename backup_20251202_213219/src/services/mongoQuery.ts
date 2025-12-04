/**
 * Serviço de Queries MongoDB
 * 
 * Fornece uma camada de abstração sobre o driver MongoDB para executar queries,
 * contagens, agregações e outras operações de leitura.
 * 
 * Características:
 * - Abstração sobre driver MongoDB
 * - Suporte para paginação eficiente
 * - Contagem otimizada (estimatedDocumentCount vs countDocuments)
 * - Queries read-only (sem operações de escrita)
 * - Mapeamento automático de resultados
 * 
 * @module mongoQuery
 */

import { Filter, Document, Sort, FindOptions } from 'mongodb';
import { MongoConnectionService } from './mongoConnection';

/**
 * Opções para queries MongoDB
 */
export interface QueryOptions {
  /** Nome da collection */
  collection: string;
  /** Nome da database (opcional, usa a database atual se não especificado) */
  database?: string;
  /** Filtro MongoDB */
  filter?: Filter<Document>;
  /** Projeção de campos */
  projection?: Document;
  /** Ordenação */
  sort?: Sort;
  /** Número de documentos para pular (paginação) */
  skip?: number;
  /** Número máximo de documentos para retornar */
  limit?: number;
}

/**
 * Resultado de uma query paginada
 */
export interface QueryResult<T> {
  /** Dados retornados */
  data: T[];
  /** Total de documentos (estimado ou exato) */
  total: number;
  /** Página atual */
  page: number;
  /** Tamanho da página */
  pageSize: number;
  /** Indica se há mais páginas */
  hasMore: boolean;
}

/**
 * Serviço de Queries MongoDB
 * 
 * Executa queries de leitura no MongoDB com suporte para paginação,
 * filtros, ordenação e agregações.
 * 
 * @example
 * ```typescript
 * const queryService = new MongoQueryService(connectionService);
 * 
 * // Buscar documentos com paginação
 * const result = await queryService.find({
 *   collection: 'tbl_nfe_100',
 *   filter: { PROTOCOLADA: 'Sim' },
 *   sort: { DT_DOC: -1 },
 *   skip: 0,
 *   limit: 100
 * });
 * ```
 */
export class MongoQueryService {
  private connection: MongoConnectionService;

  /**
   * Cria um novo serviço de queries
   * 
   * @param connection Serviço de conexão MongoDB
   */
  constructor(connection: MongoConnectionService) {
    this.connection = connection;
  }

  /**
   * Busca documentos com paginação
   * 
   * Executa uma query find() no MongoDB e retorna resultados paginados.
   * 
   * @param options Opções da query
   * @returns Resultado paginado
   * 
   * @example
   * ```typescript
   * const result = await queryService.find<NotaFiscal>({
   *   collection: 'tbl_nfe_100',
   *   filter: { 
   *     DT_DOC: { 
   *       $gte: new Date('2024-01-01'),
   *       $lte: new Date('2024-12-31')
   *     }
   *   },
   *   sort: { DT_DOC: -1 },
   *   skip: 0,
   *   limit: 100
   * });
   * 
   * console.log(`Encontrados ${result.total} documentos`);
   * console.log(`Página ${result.page}, ${result.data.length} itens`);
   * ```
   */
  public async find<T = Document>(options: QueryOptions): Promise<QueryResult<T>> {
    const {
      collection,
      database,
      filter = {},
      projection,
      sort,
      skip = 0,
      limit = 100
    } = options;

    try {
      // Troca database se necessário
      if (database && database !== this.connection.getCurrentDatabase()) {
        await this.connection.switchDatabase(database);
      }

      const coll = this.connection.getCollection(collection);

      // Conta total de documentos (usa estratégia otimizada)
      const total = await this.count({
        collection,
        database,
        filter
      });

      // Busca documentos
      const findOptions: FindOptions = {
        projection,
        sort,
        skip,
        limit
      };

      const cursor = coll.find(filter, findOptions);
      const data = await cursor.toArray() as T[];

      // Calcula informações de paginação
      const page = Math.floor(skip / limit) + 1;
      const pageSize = limit;
      const hasMore = skip + data.length < total;

      return {
        data,
        total,
        page,
        pageSize,
        hasMore
      };
    } catch (error) {
      console.error('❌ MongoDB Query Error:', error);
      throw new Error(
        `Erro ao executar query na collection "${collection}": ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Busca um único documento
   * 
   * @param options Opções da query
   * @returns Documento encontrado ou null
   * 
   * @example
   * ```typescript
   * const nota = await queryService.findOne<NotaFiscal>({
   *   collection: 'tbl_nfe_100',
   *   filter: { CHV_NFE: '35240746751590000195550010000234951126416616' }
   * });
   * 
   * if (nota) {
   *   console.log('Nota encontrada:', nota.NUM_DOC);
   * }
   * ```
   */
  public async findOne<T = Document>(options: QueryOptions): Promise<T | null> {
    const {
      collection,
      database,
      filter = {},
      projection
    } = options;

    try {
      // Troca database se necessário
      if (database && database !== this.connection.getCurrentDatabase()) {
        await this.connection.switchDatabase(database);
      }

      const coll = this.connection.getCollection(collection);
      const result = await coll.findOne(filter, { projection });

      return result as T | null;
    } catch (error) {
      console.error('❌ MongoDB FindOne Error:', error);
      throw new Error(
        `Erro ao buscar documento na collection "${collection}": ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Conta documentos usando estratégia otimizada
   * 
   * - Se não houver filtros: usa estimatedDocumentCount() (rápido)
   * - Se houver filtros: usa countDocuments() (preciso)
   * 
   * @param options Opções da contagem
   * @returns Número de documentos
   * 
   * @example
   * ```typescript
   * // Contagem rápida (sem filtros)
   * const total = await queryService.count({
   *   collection: 'tbl_nfe_100'
   * });
   * 
   * // Contagem precisa (com filtros)
   * const autorizadas = await queryService.count({
   *   collection: 'tbl_nfe_100',
   *   filter: { PROTOCOLADA: 'Sim' }
   * });
   * ```
   */
  public async count(
    options: Omit<QueryOptions, 'projection' | 'sort' | 'skip' | 'limit'>
  ): Promise<number> {
    const { collection, database, filter } = options;

    try {
      // Troca database se necessário
      if (database && database !== this.connection.getCurrentDatabase()) {
        await this.connection.switchDatabase(database);
      }

      const coll = this.connection.getCollection(collection);

      // Se não houver filtros, usa estimatedDocumentCount (mais rápido)
      if (!filter || Object.keys(filter).length === 0) {
        return await this.estimatedCount(collection, database);
      }

      // Com filtros, usa countDocuments (mais preciso)
      return await coll.countDocuments(filter);
    } catch (error) {
      console.error('❌ MongoDB Count Error:', error);
      throw new Error(
        `Erro ao contar documentos na collection "${collection}": ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Conta documentos usando estimatedDocumentCount (rápido mas aproximado)
   * 
   * Usa metadados da collection para retornar contagem rápida.
   * Ideal para paginação quando não há filtros aplicados.
   * 
   * @param collection Nome da collection
   * @param database Nome da database (opcional)
   * @returns Contagem estimada de documentos
   * 
   * @example
   * ```typescript
   * const total = await queryService.estimatedCount('tbl_nfe_100');
   * console.log(`Aproximadamente ${total} documentos`);
   * ```
   */
  public async estimatedCount(
    collection: string,
    database?: string
  ): Promise<number> {
    try {
      // Troca database se necessário
      if (database && database !== this.connection.getCurrentDatabase()) {
        await this.connection.switchDatabase(database);
      }

      const coll = this.connection.getCollection(collection);
      return await coll.estimatedDocumentCount();
    } catch (error) {
      console.error('❌ MongoDB EstimatedCount Error:', error);
      throw new Error(
        `Erro ao estimar contagem na collection "${collection}": ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Executa uma agregação MongoDB
   * 
   * Permite executar pipelines de agregação complexos para análises,
   * transformações e cálculos sobre os dados.
   * 
   * @param pipeline Pipeline de agregação
   * @param options Opções da agregação
   * @returns Resultados da agregação
   * 
   * @example
   * ```typescript
   * // Calcular total de vendas por mês
   * const stats = await queryService.aggregate([
   *   {
   *     $match: {
   *       TIPO: 'Emitida',
   *       DT_DOC: {
   *         $gte: new Date('2024-01-01'),
   *         $lte: new Date('2024-12-31')
   *       }
   *     }
   *   },
   *   {
   *     $group: {
   *       _id: { $month: '$DT_DOC' },
   *       total: { $sum: '$VL_DOC' },
   *       count: { $sum: 1 }
   *     }
   *   },
   *   {
   *     $sort: { _id: 1 }
   *   }
   * ], {
   *   collection: 'tbl_nfe_100'
   * });
   * ```
   */
  public async aggregate<T = Document>(
    pipeline: Document[],
    options: Omit<QueryOptions, 'filter' | 'projection' | 'sort' | 'skip' | 'limit'>
  ): Promise<T[]> {
    const { collection, database } = options;

    try {
      // Troca database se necessário
      if (database && database !== this.connection.getCurrentDatabase()) {
        await this.connection.switchDatabase(database);
      }

      const coll = this.connection.getCollection(collection);
      const cursor = coll.aggregate(pipeline);
      const results = await cursor.toArray();

      return results as T[];
    } catch (error) {
      console.error('❌ MongoDB Aggregate Error:', error);
      throw new Error(
        `Erro ao executar agregação na collection "${collection}": ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Executa explain em uma query para análise de performance
   * 
   * Útil para verificar se a query está usando índices corretamente.
   * 
   * @param options Opções da query
   * @returns Plano de execução da query
   * 
   * @example
   * ```typescript
   * const explain = await queryService.explain({
   *   collection: 'tbl_nfe_100',
   *   filter: { DT_DOC: { $gte: new Date('2024-01-01') } }
   * });
   * 
   * console.log('Índices usados:', explain.queryPlanner.winningPlan);
   * ```
   */
  public async explain(options: QueryOptions): Promise<Document> {
    const {
      collection,
      database,
      filter = {},
      projection,
      sort,
      skip,
      limit
    } = options;

    try {
      // Troca database se necessário
      if (database && database !== this.connection.getCurrentDatabase()) {
        await this.connection.switchDatabase(database);
      }

      const coll = this.connection.getCollection(collection);

      const findOptions: FindOptions = {
        projection,
        sort,
        skip,
        limit
      };

      const cursor = coll.find(filter, findOptions);
      const explanation = await cursor.explain();

      return explanation;
    } catch (error) {
      console.error('❌ MongoDB Explain Error:', error);
      throw new Error(
        `Erro ao executar explain na collection "${collection}": ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }
}

/**
 * Cria uma instância do serviço de queries
 * 
 * @param connection Serviço de conexão MongoDB
 * @returns Serviço de queries configurado
 * 
 * @example
 * ```typescript
 * import { mongoConnectionService } from './mongoConnection';
 * import { createMongoQueryService } from './mongoQuery';
 * 
 * const queryService = createMongoQueryService(mongoConnectionService);
 * const result = await queryService.find({ collection: 'tbl_nfe_100' });
 * ```
 */
export function createMongoQueryService(
  connection: MongoConnectionService
): MongoQueryService {
  return new MongoQueryService(connection);
}
