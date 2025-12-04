/**
 * Sistema de Cache para Queries MongoDB
 * 
 * Adaptado do streamingCache.ts para trabalhar com queries MongoDB diretas.
 * Armazena resultados de queries para evitar consultas repetidas ao banco.
 * 
 * Características:
 * - Cache de 90 minutos
 * - Limpeza automática de entradas expiradas
 * - Suporte para cache parcial e completo
 * - Chaves baseadas em hash de filtros
 * 
 * @module mongoCache
 */

import { QueryOptions } from './mongoQuery';

/**
 * Entrada do cache
 */
export interface CacheEntry {
  /** Dados armazenados */
  data: any[];
  /** Timestamp de criação */
  timestamp: number;
  /** Se a busca foi completada */
  complete: boolean;
  /** Query que gerou estes dados */
  query: Partial<QueryOptions>;
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  /** Número de entradas no cache */
  entries: number;
  /** Total de registros armazenados */
  totalRecords: number;
  /** Entradas completas */
  completeEntries: number;
  /** Entradas parciais */
  partialEntries: number;
}

/**
 * Serviço de Cache MongoDB
 * 
 * Gerencia cache de resultados de queries MongoDB.
 * 
 * @example
 * ```typescript
 * const cache = new MongoCacheService();
 * 
 * const key = cache.getCacheKey({ collection: 'tbl_nfe_100', filter: {...} });
 * const cached = cache.getFromCache(key);
 * 
 * if (!cached) {
 *   const data = await queryService.find(...);
 *   cache.updateCache(key, data, true);
 * }
 * ```
 */
export class MongoCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION: number;

  /**
   * Cria um novo serviço de cache
   * 
   * @param cacheDurationMinutes Duração do cache em minutos (padrão: 90)
   */
  constructor(cacheDurationMinutes: number = 90) {
    this.CACHE_DURATION = cacheDurationMinutes * 60 * 1000;
    console.log(`💾 MongoCache inicializado: duração ${cacheDurationMinutes} minutos`);
  }

  /**
   * Gera chave única para o cache baseada nas opções de query
   * 
   * Inclui: collection, database, filtros, ordenação
   * 
   * @param options Opções da query MongoDB
   * @returns Chave do cache
   * 
   * @example
   * ```typescript
   * const key = cache.getCacheKey({
   *   collection: 'tbl_nfe_100',
   *   filter: { DT_DOC: { $gte: new Date('2024-01-01') } },
   *   sort: { DT_DOC: -1 }
   * });
   * ```
   */
  public getCacheKey(options: Partial<QueryOptions>): string {
    const { collection, database, filter, sort } = options;
    
    return JSON.stringify({
      collection,
      database,
      filter,
      sort
    });
  }

  /**
   * Busca dados no cache
   * 
   * Verifica se há dados em cache e se ainda estão válidos.
   * Remove automaticamente entradas expiradas.
   * 
   * @param key Chave do cache
   * @returns Entrada do cache ou null se não encontrado/expirado
   * 
   * @example
   * ```typescript
   * const cached = cache.getFromCache(key);
   * if (cached) {
   *   console.log(`Cache hit! ${cached.data.length} registros`);
   *   return cached.data;
   * }
   * ```
   */
  public getFromCache(key: string): CacheEntry | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      console.log('❌ Cache MISS: chave não encontrada');
      return null;
    }

    const age = Date.now() - cached.timestamp;
    const ageMinutes = Math.floor(age / (60 * 1000));
    const remainingMinutes = Math.floor((this.CACHE_DURATION - age) / (60 * 1000));

    // Se expirou, remove
    if (age > this.CACHE_DURATION) {
      console.log(`⏰ Cache EXPIRADO (${ageMinutes} minutos): removendo`);
      this.cache.delete(key);
      return null;
    }

    console.log(
      `✅ Cache HIT! Idade: ${ageMinutes} min, Resta: ${remainingMinutes} min, ` +
      `Registros: ${cached.data.length}, Completo: ${cached.complete}`
    );
    
    return cached;
  }

  /**
   * Atualiza ou cria entrada no cache
   * 
   * @param key Chave do cache
   * @param data Dados a armazenar
   * @param complete Se a busca foi completada
   * @param query Query que gerou estes dados (opcional)
   * 
   * @example
   * ```typescript
   * const result = await queryService.find({ collection: 'tbl_nfe_100' });
   * cache.updateCache(key, result.data, true);
   * ```
   */
  public updateCache(
    key: string,
    data: any[],
    complete: boolean,
    query?: Partial<QueryOptions>
  ): void {
    const existing = this.cache.get(key);

    if (existing) {
      // Acumula dados se já existir
      const allData = [...existing.data, ...data];
      this.cache.set(key, {
        data: allData,
        timestamp: Date.now(), // Renova o cache
        complete,
        query: query || existing.query
      });
      console.log(
        `💾 Cache ATUALIZADO: ${allData.length} registros (completo: ${complete})`
      );
      console.log(`⏰ Cache válido por mais ${this.CACHE_DURATION / (60 * 1000)} minutos`);
    } else {
      // Cria nova entrada
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        complete,
        query: query || {}
      });
      console.log(
        `💾 Cache CRIADO: ${data.length} registros (completo: ${complete})`
      );
      console.log(`⏰ Cache válido por ${this.CACHE_DURATION / (60 * 1000)} minutos`);
    }

    console.log(`📊 Total em cache: ${this.cache.size} chaves`);
  }

  /**
   * Limpa entradas expiradas do cache
   * 
   * Remove automaticamente todas as entradas que ultrapassaram
   * o tempo de duração configurado.
   * 
   * @example
   * ```typescript
   * cache.clearExpired();
   * ```
   */
  public clearExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    let kept = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      const ageMinutes = Math.floor(age / (60 * 1000));

      if (age > this.CACHE_DURATION) {
        console.log(
          `🗑️ Removendo cache expirado (${ageMinutes} minutos): ` +
          `${key.substring(0, 100)}...`
        );
        this.cache.delete(key);
        cleaned++;
      } else {
        const remainingMinutes = Math.floor((this.CACHE_DURATION - age) / (60 * 1000));
        console.log(
          `✅ Mantendo cache (${ageMinutes} min, resta ${remainingMinutes} min): ` +
          `${entry.data.length} registros`
        );
        kept++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache limpo: ${cleaned} entradas removidas, ${kept} mantidas`);
    } else if (kept > 0) {
      console.log(`✅ Cache OK: ${kept} entradas válidas (nenhuma expirada)`);
    }
  }

  /**
   * Limpa todo o cache
   * 
   * Remove todas as entradas, independente de estarem expiradas ou não.
   * 
   * @example
   * ```typescript
   * cache.clearAll();
   * console.log('Cache completamente limpo');
   * ```
   */
  public clearAll(): void {
    this.cache.clear();
    console.log('🧹 Cache completamente limpo');
  }

  /**
   * Obtém estatísticas do cache
   * 
   * @returns Estatísticas do cache
   * 
   * @example
   * ```typescript
   * const stats = cache.getStats();
   * console.log(`Cache: ${stats.entries} entradas, ${stats.totalRecords} registros`);
   * ```
   */
  public getStats(): CacheStats {
    let totalRecords = 0;
    let completeEntries = 0;
    let partialEntries = 0;

    for (const entry of this.cache.values()) {
      totalRecords += entry.data.length;
      if (entry.complete) {
        completeEntries++;
      } else {
        partialEntries++;
      }
    }

    return {
      entries: this.cache.size,
      totalRecords,
      completeEntries,
      partialEntries
    };
  }

  /**
   * Debug: mostra todas as entradas do cache
   * 
   * Útil para desenvolvimento e troubleshooting.
   * 
   * @example
   * ```typescript
   * cache.debugCache();
   * ```
   */
  public debugCache(): void {
    console.group('🔍 DEBUG MONGO CACHE');
    console.log(`Total de chaves: ${this.cache.size}`);
    console.log(`Duração do cache: ${this.CACHE_DURATION / (60 * 1000)} minutos`);

    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - entry.timestamp;
      const ageMinutes = Math.floor(age / (60 * 1000));
      const remainingMinutes = Math.floor((this.CACHE_DURATION - age) / (60 * 1000));

      console.log(`\n📦 Chave: ${key.substring(0, 100)}...`);
      console.log(`   Registros: ${entry.data.length}`);
      console.log(`   Completo: ${entry.complete}`);
      console.log(`   Idade: ${ageMinutes} minutos`);
      console.log(`   Resta: ${remainingMinutes} minutos`);
      console.log(`   Query:`, entry.query);
    }

    console.groupEnd();
  }
}

/**
 * Instância global do serviço de cache
 * 
 * Configurada com duração de 90 minutos (padrão).
 * 
 * @example
 * ```typescript
 * import { mongoCacheService } from './mongoCache';
 * 
 * const key = mongoCacheService.getCacheKey({ collection: 'tbl_nfe_100' });
 * const cached = mongoCacheService.getFromCache(key);
 * ```
 */
export const mongoCacheService = new MongoCacheService(
  parseInt(import.meta.env.VITE_CACHE_DURATION_MINUTES || '90')
);

// Limpar cache expirado a cada 30 minutos
setInterval(() => {
  console.log('🔍 Verificando cache expirado...');
  mongoCacheService.clearExpired();
}, 30 * 60 * 1000);

// Expor no window para debug no console
if (typeof window !== 'undefined') {
  (window as any).debugMongoCache = () => mongoCacheService.debugCache();
  console.log('💡 Use window.debugMongoCache() no console para ver o status do cache');
}
