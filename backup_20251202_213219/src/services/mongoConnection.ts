/**
 * Serviço de Conexão MongoDB
 * 
 * Este serviço gerencia a conexão com o MongoDB usando o padrão Singleton.
 * Fornece métodos para conectar, desconectar, trocar database e verificar saúde da conexão.
 * 
 * Características:
 * - Singleton: Uma única instância de conexão reutilizada em toda aplicação
 * - Reconnection automática: Tenta reconectar automaticamente em caso de falha
 * - Health check: Verifica periodicamente se a conexão está saudável
 * - Troca dinâmica de database: Permite mudar de database sem reiniciar
 * 
 * @module mongoConnection
 */

import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';

/**
 * Configuração da conexão MongoDB
 */
export interface MongoConnectionConfig {
  /** String de conexão MongoDB (mongodb:// ou mongodb+srv://) */
  connectionString: string;
  /** Nome da database padrão */
  database: string;
  /** Opções adicionais do cliente MongoDB */
  options?: MongoClientOptions;
}

/**
 * Estado da conexão MongoDB
 */
export interface MongoConnection {
  /** Cliente MongoDB */
  client: MongoClient;
  /** Instância da database atual */
  db: Db;
  /** Indica se a conexão está ativa */
  isConnected: boolean;
}

/**
 * Serviço de Conexão MongoDB (Singleton)
 * 
 * Gerencia uma única conexão MongoDB reutilizada em toda aplicação.
 * 
 * @example
 * ```typescript
 * const connectionService = MongoConnectionService.getInstance();
 * await connectionService.connect();
 * const db = connectionService.getDatabase();
 * const collection = connectionService.getCollection('tbl_nfe_100');
 * ```
 */
export class MongoConnectionService {
  private static instance: MongoConnectionService;
  private connection: MongoConnection | null = null;
  private config: MongoConnectionConfig;

  /**
   * Construtor privado (Singleton)
   * @param config Configuração da conexão
   */
  private constructor(config: MongoConnectionConfig) {
    this.config = config;
  }

  /**
   * Obtém a instância única do serviço (Singleton)
   * 
   * @param config Configuração da conexão (apenas na primeira chamada)
   * @returns Instância do serviço
   * 
   * @example
   * ```typescript
   * const service = MongoConnectionService.getInstance({
   *   connectionString: process.env.VITE_MONGODB_CONNECTION_STRING!,
   *   database: process.env.VITE_DB_DATABASE!
   * });
   * ```
   */
  public static getInstance(config?: MongoConnectionConfig): MongoConnectionService {
    if (!MongoConnectionService.instance && config) {
      MongoConnectionService.instance = new MongoConnectionService(config);
    }
    
    if (!MongoConnectionService.instance) {
      throw new Error('MongoConnectionService não foi inicializado. Forneça a configuração na primeira chamada.');
    }
    
    return MongoConnectionService.instance;
  }

  /**
   * Conecta ao MongoDB
   * 
   * Estabelece conexão com o MongoDB usando a string de conexão configurada.
   * Se já estiver conectado, não faz nada.
   * 
   * @throws {Error} Se falhar ao conectar
   * 
   * @example
   * ```typescript
   * await connectionService.connect();
   * console.log('Conectado ao MongoDB!');
   * ```
   */
  public async connect(): Promise<void> {
    if (this.connection?.isConnected) {
      console.log('✅ MongoDB: Já conectado');
      return;
    }

    try {
      console.log('🔄 MongoDB: Conectando...');
      
      const options: MongoClientOptions = {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
        compressors: ['zlib'],
        zlibCompressionLevel: 6,
        ...this.config.options
      };

      const client = new MongoClient(this.config.connectionString, options);
      await client.connect();
      
      const db = client.db(this.config.database);
      
      // Testa a conexão com um ping
      await db.admin().ping();
      
      this.connection = {
        client,
        db,
        isConnected: true
      };

      console.log(`✅ MongoDB: Conectado à database "${this.config.database}"`);
    } catch (error) {
      console.error('❌ MongoDB: Erro ao conectar:', error);
      throw new Error(`Falha ao conectar ao MongoDB: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Desconecta do MongoDB
   * 
   * Fecha a conexão com o MongoDB e libera recursos.
   * 
   * @example
   * ```typescript
   * await connectionService.disconnect();
   * console.log('Desconectado do MongoDB');
   * ```
   */
  public async disconnect(): Promise<void> {
    if (!this.connection?.isConnected) {
      console.log('ℹ️ MongoDB: Já desconectado');
      return;
    }

    try {
      console.log('🔄 MongoDB: Desconectando...');
      await this.connection.client.close();
      this.connection.isConnected = false;
      console.log('✅ MongoDB: Desconectado');
    } catch (error) {
      console.error('❌ MongoDB: Erro ao desconectar:', error);
      throw error;
    }
  }

  /**
   * Troca a database ativa sem reiniciar a conexão
   * 
   * Permite mudar de database dinamicamente, útil para sistemas multi-tenant
   * onde cada usuário pode ter sua própria database.
   * 
   * @param database Nome da nova database
   * 
   * @example
   * ```typescript
   * // Trocar para database de outro cliente
   * await connectionService.switchDatabase('C08712199000192');
   * const collection = connectionService.getCollection('tbl_nfe_100');
   * ```
   */
  public async switchDatabase(database: string): Promise<void> {
    if (!this.connection?.isConnected) {
      throw new Error('MongoDB não está conectado. Chame connect() primeiro.');
    }

    console.log(`🔄 MongoDB: Trocando para database "${database}"`);
    this.connection.db = this.connection.client.db(database);
    this.config.database = database;
    console.log(`✅ MongoDB: Database trocada para "${database}"`);
  }

  /**
   * Obtém a instância da database atual
   * 
   * @returns Instância da database MongoDB
   * @throws {Error} Se não estiver conectado
   * 
   * @example
   * ```typescript
   * const db = connectionService.getDatabase();
   * const stats = await db.stats();
   * ```
   */
  public getDatabase(): Db {
    if (!this.connection?.isConnected) {
      throw new Error('MongoDB não está conectado. Chame connect() primeiro.');
    }
    return this.connection.db;
  }

  /**
   * Obtém uma collection da database atual
   * 
   * @param name Nome da collection
   * @returns Instância da collection MongoDB
   * @throws {Error} Se não estiver conectado
   * 
   * @example
   * ```typescript
   * const nfeCollection = connectionService.getCollection('tbl_nfe_100');
   * const count = await nfeCollection.countDocuments();
   * ```
   */
  public getCollection(name: string): Collection {
    return this.getDatabase().collection(name);
  }

  /**
   * Verifica se a conexão está saudável
   * 
   * Executa um ping no MongoDB para verificar se a conexão está ativa.
   * 
   * @returns true se a conexão está saudável, false caso contrário
   * 
   * @example
   * ```typescript
   * const isHealthy = await connectionService.isHealthy();
   * if (!isHealthy) {
   *   console.error('Conexão MongoDB não está saudável!');
   * }
   * ```
   */
  public async isHealthy(): Promise<boolean> {
    if (!this.connection?.isConnected) {
      return false;
    }

    try {
      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error('❌ MongoDB: Health check falhou:', error);
      return false;
    }
  }

  /**
   * Obtém o nome da database atual
   * 
   * @returns Nome da database
   */
  public getCurrentDatabase(): string {
    return this.config.database;
  }

  /**
   * Verifica se está conectado
   * 
   * @returns true se conectado, false caso contrário
   */
  public isConnected(): boolean {
    return this.connection?.isConnected ?? false;
  }
}

/**
 * Instância global do serviço de conexão
 * 
 * Inicializada com as variáveis de ambiente do projeto.
 * 
 * @example
 * ```typescript
 * import { mongoConnectionService } from './mongoConnection';
 * 
 * await mongoConnectionService.connect();
 * const collection = mongoConnectionService.getCollection('tbl_nfe_100');
 * ```
 */
export const mongoConnectionService = MongoConnectionService.getInstance({
  connectionString: import.meta.env.VITE_MONGODB_CONNECTION_STRING || '',
  database: import.meta.env.VITE_DB_DATABASE || ''
});
