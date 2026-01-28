/**
 * ManifestationTypeService - Serviço de Tipos de Manifestação
 * 
 * Responsável por gerenciar tipos de manifestação disponíveis no sistema
 * com cache inteligente e integração com roteamento de banco de dados
 */

// 1. Node.js built-ins
import { performance } from 'perf_hooks';

// 2. External libraries
import { PrismaClient } from '@prisma/client';

// 3. Internal packages (workspace)
import { ManifestationConstants } from '@fiscal/shared/constants/manifestation.constants';
import { ManifestationType } from '@fiscal/shared/types/manifestation';

// 4. Relative imports (mesmo diretório/subdiretórios)
import { createLogger } from '../utils/logger';
import { databaseRouter } from './DatabaseRouter';

/**
 * Interface para entrada de cache de tipos de manifestação
 */
interface ManifestationTypeCacheEntry {
  data: ManifestationType[];
  createdAt: Date;
  lastAccessed: Date;
  usrCodigo: string;
}

/**
 * Interface para resultado de operação do serviço
 */
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Interface para estatísticas do cache
 */
interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

/**
 * Serviço para gerenciamento de tipos de manifestação
 * Implementa cache inteligente e integração com sistema de roteamento de banco
 */
export class ManifestationTypeService {
  private cache: Map<string, ManifestationTypeCacheEntry> = new Map();
  private readonly logger = createLogger('ManifestationTypeService');
  private hits: number = 0;
  private misses: number = 0;
  private readonly maxCacheEntries: number = 100;

  constructor() {
    // Configurar limpeza periódica do cache (a cada 5 minutos)
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, ManifestationConstants.CACHE.MANIFESTATION_TYPES_TTL);

    this.logger.info('ManifestationTypeService inicializado', {
      maxCacheEntries: this.maxCacheEntries,
      cacheTTL: ManifestationConstants.CACHE.MANIFESTATION_TYPES_TTL
    });
  }

  /**
   * Obtém tipos de manifestação disponíveis para um usuário
   * Implementa cache inteligente com TTL
   */
  async getAvailableTypes(usrCodigo: string): Promise<ServiceResult<ManifestationType[]>> {
    const startTime = performance.now();
    
    try {
      this.logger.debug('Buscando tipos de manifestação', { usrCodigo });

      // Verificar cache primeiro
      const cachedTypes = this.getCachedTypes(usrCodigo);
      if (cachedTypes) {
        this.hits++;
        const duration = performance.now() - startTime;
        
        this.logger.info('Cache hit para tipos de manifestação', {
          usrCodigo,
          typesCount: cachedTypes.length,
          duration: `${duration.toFixed(2)}ms`
        });

        return {
          success: true,
          data: cachedTypes
        };
      }

      // Cache miss - buscar do banco de dados
      this.misses++;
      const types = await this.fetchTypesFromDatabase(usrCodigo);
      
      if (!types.success) {
        return types;
      }

      // Armazenar no cache
      this.setCachedTypes(usrCodigo, types.data!);
      
      const duration = performance.now() - startTime;
      this.logger.info('Tipos de manifestação carregados do banco', {
        usrCodigo,
        typesCount: types.data!.length,
        duration: `${duration.toFixed(2)}ms`
      });

      return types;

    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error('Erro ao obter tipos de manifestação', {
        usrCodigo,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: 'Erro interno ao carregar tipos de manifestação',
        errorCode: ManifestationConstants.ERROR_CODES.SYSTEM_ERROR
      };
    }
  }

  /**
   * Valida se um tipo de manifestação é válido para um usuário
   */
  async validateManifestationType(typeId: string, usrCodigo: string): Promise<ServiceResult<boolean>> {
    try {
      this.logger.debug('Validando tipo de manifestação', { typeId, usrCodigo });

      // Validar formato do typeId
      if (!typeId || !ManifestationConstants.REGEX.TYPE_CODE.test(typeId)) {
        this.logger.warn('Formato inválido de tipo de manifestação', { typeId, usrCodigo });
        return {
          success: false,
          error: 'Formato de tipo de manifestação inválido',
          errorCode: ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID
        };
      }

      // Obter tipos disponíveis
      const typesResult = await this.getAvailableTypes(usrCodigo);
      if (!typesResult.success) {
        return {
          success: false,
          error: typesResult.error,
          errorCode: typesResult.errorCode
        };
      }

      // Verificar se o tipo existe e está ativo
      const isValid = typesResult.data!.some(type => 
        type.codigo === typeId && type.ativo
      );

      this.logger.debug('Resultado da validação de tipo', { 
        typeId, 
        usrCodigo, 
        isValid 
      });

      return {
        success: true,
        data: isValid
      };

    } catch (error) {
      this.logger.error('Erro ao validar tipo de manifestação', {
        typeId,
        usrCodigo,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: 'Erro interno na validação do tipo',
        errorCode: ManifestationConstants.ERROR_CODES.SYSTEM_ERROR
      };
    }
  }

  /**
   * Limpa cache para um usuário específico
   */
  clearUserCache(usrCodigo: string): void {
    const cacheKey = this.generateCacheKey(usrCodigo);
    const deleted = this.cache.delete(cacheKey);
    
    if (deleted) {
      this.logger.info('Cache limpo para usuário', { usrCodigo });
    }
  }

  /**
   * Limpa todo o cache
   */
  clearAllCache(): void {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    
    this.logger.info('Cache completamente limpo', { entriesCleared: entriesCount });
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;

    if (entries.length > 0) {
      const sortedByCreation = entries.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );
      oldestEntry = sortedByCreation[0].createdAt;
      newestEntry = sortedByCreation[sortedByCreation.length - 1].createdAt;
    }

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.hits,
      totalMisses: this.misses,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Busca tipos de manifestação do banco de dados
   */
  private async fetchTypesFromDatabase(usrCodigo: string): Promise<ServiceResult<ManifestationType[]>> {
    try {
      // Obter conexão SQL usando roteamento transparente
      const prisma = await databaseRouter.getCurrentSqlConnection();
      
      if (!prisma) {
        this.logger.error('Conexão SQL não disponível', { usrCodigo });
        return {
          success: false,
          error: 'Conexão com banco de dados não disponível',
          errorCode: ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR
        };
      }

      // Executar query com timeout
      const queryPromise = this.executeTypesQuery(prisma);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout na consulta de tipos de manifestação'));
        }, ManifestationConstants.TIMEOUTS.TYPE_VALIDATION);
      });

      const rawTypes = await Promise.race([queryPromise, timeoutPromise]);

      this.logger.debug('Resultado bruto da query de tipos', { 
        count: rawTypes.length,
        sample: rawTypes.length > 0 ? Object.keys(rawTypes[0]) : []
      });

      // Converter para formato da interface com fallback para case-insensitivity
      const types: ManifestationType[] = rawTypes.map(type => {
        // SQL Server pode retornar chaves em maiúsculas ou minúsculas dependendo do driver/config
        const id = type.id ?? type.ID ?? type.Id;
        const codigo = type.codigo ?? type.CODIGO ?? type.Codigo;
        const descricao = type.descricao ?? type.DESCRICAO ?? type.Descricao;
        const ativo = type.ativo ?? type.ATIVO ?? type.Ativo;
        const ordem = type.ordem ?? type.ORDEM ?? type.Ordem;

        return {
          id: String(id),
          codigo: String(codigo || ''),
          descricao: String(descricao || ''),
          ativo: ativo === true || ativo === 1 || String(ativo).toLowerCase() === 'true',
          ordem: ordem !== undefined && ordem !== null ? Number(ordem) : undefined
        };
      });

      // Filtrar apenas tipos ativos e ordenar
      const activeTypes = types
        .filter(type => type.ativo && type.codigo)
        .sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

      this.logger.debug('Tipos de manifestação carregados do banco', {
        usrCodigo,
        totalTypes: types.length,
        activeTypes: activeTypes.length
      });

      return {
        success: true,
        data: activeTypes
      };

    } catch (error) {
      this.logger.error('Erro na consulta ao banco de dados', {
        usrCodigo,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: 'Erro ao consultar tipos de manifestação no banco',
        errorCode: ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR
      };
    }
  }

  /**
   * Executa a query para buscar tipos de manifestação
   */
  private async executeTypesQuery(prisma: PrismaClient): Promise<any[]> {
    try {
      // Tentar query rica baseada no novo schema (Prisma)
      return await prisma.$queryRaw`
        SELECT 
          ID as id,
          CODIGO as codigo,
          DESCRICAO as descricao,
          ATIVO as ativo,
          ORDEM as ordem
        FROM tbl_tipo_manifestacao
        WHERE ATIVO = 1
        ORDER BY ORDEM ASC, DESCRICAO ASC
      `;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Se o erro for de coluna inválida (207), tentar fallback legado
      if (errorMessage.includes('207') || errorMessage.includes('column') || errorMessage.includes('invalid')) {
        this.logger.warn('Schema novo não detectado, tentando fallback para estrutura legada', {
          database: 'fallback_detectado'
        });

        try {
          // Fallback para estrutura: id (int), tipo (varchar)
          return await prisma.$queryRaw`
            SELECT 
              id as id,
              id as codigo,
              tipo as descricao,
              1 as ativo,
              id as ordem
            FROM tbl_tipo_manifestacao
          `;
        } catch (fallbackError) {
          this.logger.error('Falha também no fallback legado', { 
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          });
          throw error; // Re-throw o erro original se o fallback também falhar
        }
      }
      
      throw error;
    }
  }

  /**
   * Gera chave de cache para um usuário
   */
  private generateCacheKey(usrCodigo: string): string {
    return `${ManifestationConstants.CACHE.TYPES_CACHE_KEY}_${usrCodigo}`;
  }

  /**
   * Obtém tipos do cache se válidos
   */
  private getCachedTypes(usrCodigo: string): ManifestationType[] | null {
    const cacheKey = this.generateCacheKey(usrCodigo);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Verificar se o cache expirou
    const now = new Date();
    const age = now.getTime() - entry.createdAt.getTime();
    
    if (age > ManifestationConstants.CACHE.MANIFESTATION_TYPES_TTL) {
      this.cache.delete(cacheKey);
      this.logger.debug('Cache expirado removido', { usrCodigo, age });
      return null;
    }

    // Atualizar último acesso
    entry.lastAccessed = now;
    
    return entry.data;
  }

  /**
   * Armazena tipos no cache
   */
  private setCachedTypes(usrCodigo: string, types: ManifestationType[]): void {
    const cacheKey = this.generateCacheKey(usrCodigo);
    const now = new Date();

    // Verificar se precisa fazer espaço no cache
    if (this.cache.size >= this.maxCacheEntries) {
      this.evictOldestEntry();
    }

    const entry: ManifestationTypeCacheEntry = {
      data: types,
      createdAt: now,
      lastAccessed: now,
      usrCodigo
    };

    this.cache.set(cacheKey, entry);
    
    this.logger.debug('Tipos armazenados no cache', {
      usrCodigo,
      typesCount: types.length,
      cacheSize: this.cache.size
    });
  }

  /**
   * Remove entrada mais antiga do cache (LRU)
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      
      this.logger.debug('Entrada mais antiga removida do cache', {
        evictedUser: entry?.usrCodigo,
        lastAccessed: new Date(oldestTime).toISOString()
      });
    }
  }

  /**
   * Limpa entradas expiradas do cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.createdAt.getTime();
      if (age > ManifestationConstants.CACHE.MANIFESTATION_TYPES_TTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      this.logger.info('Limpeza de cache executada', {
        expiredEntries: expiredKeys.length,
        remainingEntries: this.cache.size
      });
    }
  }
}

// Export singleton instance
export const manifestationTypeService = new ManifestationTypeService();