/**
 * StorageService - Gerenciamento Seguro de LocalStorage
 * 
 * Centraliza o acesso ao localStorage com proteção especial para dados de autenticação
 * Previne remoção acidental do token de autenticação
 */

// Chaves protegidas que não podem ser removidas por operações de limpeza genéricas
const PROTECTED_KEYS = [
  'revio_auth_token',
  'revio_user_data'
] as const;

// Prefixos de cache que podem ser limpos
const CACHE_PREFIXES = [
  'revio_grid_cache_',
  'revio_analytics_cache_',
  'revio_selection_'
] as const;

export class StorageService {
  /**
   * Obtém item do localStorage de forma segura
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Erro ao ler do localStorage (${key}):`, error);
      return null;
    }
  }

  /**
   * Define item no localStorage de forma segura
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Erro ao salvar no localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Remove item do localStorage de forma segura
   * ATENÇÃO: Não remove chaves protegidas (token de autenticação)
   */
  static removeItem(key: string): boolean {
    // Verificar se é uma chave protegida
    if (this.isProtectedKey(key)) {
      console.warn(`Tentativa de remover chave protegida bloqueada: ${key}`);
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Erro ao remover do localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Verifica se uma chave é protegida
   */
  static isProtectedKey(key: string): boolean {
    return PROTECTED_KEYS.includes(key as any);
  }

  /**
   * Verifica se uma chave é de cache
   */
  static isCacheKey(key: string): boolean {
    return CACHE_PREFIXES.some(prefix => key.startsWith(prefix));
  }

  /**
   * Limpa apenas caches, preservando dados de autenticação
   */
  static clearCache(): number {
    try {
      const keys = Object.keys(localStorage);
      let removed = 0;

      keys.forEach(key => {
        // Apenas remover se for cache e não for protegido
        if (this.isCacheKey(key) && !this.isProtectedKey(key)) {
          try {
            localStorage.removeItem(key);
            removed++;
          } catch (error) {
            console.error(`Erro ao remover cache (${key}):`, error);
          }
        }
      });

      console.log(`🗑️ ${removed} entradas de cache removidas`);
      return removed;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return 0;
    }
  }

  /**
   * Limpa cache de um prefixo específico
   */
  static clearCacheByPrefix(prefix: string): number {
    try {
      const keys = Object.keys(localStorage);
      let removed = 0;

      keys.forEach(key => {
        if (key.startsWith(prefix) && !this.isProtectedKey(key)) {
          try {
            localStorage.removeItem(key);
            removed++;
          } catch (error) {
            console.error(`Erro ao remover cache (${key}):`, error);
          }
        }
      });

      console.log(`🗑️ ${removed} entradas de cache removidas (prefixo: ${prefix})`);
      return removed;
    } catch (error) {
      console.error('Erro ao limpar cache por prefixo:', error);
      return 0;
    }
  }

  /**
   * Limpa TUDO do localStorage (incluindo autenticação)
   * USAR COM EXTREMO CUIDADO - Apenas para logout
   */
  static clearAll(): void {
    try {
      localStorage.clear();
      console.log('🗑️ LocalStorage completamente limpo');
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }

  /**
   * Obtém todas as chaves do localStorage
   */
  static getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Erro ao obter chaves do localStorage:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas do localStorage
   */
  static getStats(): {
    totalKeys: number;
    protectedKeys: number;
    cacheKeys: number;
    totalSize: number;
  } {
    try {
      const keys = Object.keys(localStorage);
      let totalSize = 0;
      let protectedKeys = 0;
      let cacheKeys = 0;

      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }

        if (this.isProtectedKey(key)) {
          protectedKeys++;
        }

        if (this.isCacheKey(key)) {
          cacheKeys++;
        }
      });

      return {
        totalKeys: keys.length,
        protectedKeys,
        cacheKeys,
        totalSize
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalKeys: 0,
        protectedKeys: 0,
        cacheKeys: 0,
        totalSize: 0
      };
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS DE AUTENTICAÇÃO ====================

  /**
   * Obtém token de autenticação
   */
  static getAuthToken(): string | null {
    return this.getItem('revio_auth_token');
  }

  /**
   * Define token de autenticação
   */
  static setAuthToken(token: string): boolean {
    return this.setItem('revio_auth_token', token);
  }

  /**
   * Obtém dados do usuário
   */
  static getUserData(): any | null {
    try {
      const data = this.getItem('revio_user_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      return null;
    }
  }

  /**
   * Define dados do usuário
   */
  static setUserData(userData: any): boolean {
    try {
      return this.setItem('revio_user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
      return false;
    }
  }

  /**
   * Remove dados de autenticação (apenas para logout)
   */
  static clearAuthData(): void {
    try {
      // Remover diretamente, ignorando proteção (apenas para logout)
      localStorage.removeItem('revio_auth_token');
      localStorage.removeItem('revio_user_data');
      console.log('🔓 Dados de autenticação removidos');
    } catch (error) {
      console.error('Erro ao remover dados de autenticação:', error);
    }
  }

  /**
   * Verifica se o token está expirado
   */
  static isTokenExpired(): boolean {
    try {
      const token = this.getAuthToken();
      if (!token) return true;

      // Decodificar payload do JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp < currentTime;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true;
    }
  }

  /**
   * Obtém tempo restante do token em segundos
   */
  static getTokenTimeRemaining(): number {
    try {
      const token = this.getAuthToken();
      if (!token) return 0;

      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return Math.max(0, payload.exp - currentTime);
    } catch (error) {
      console.error('Erro ao calcular tempo restante do token:', error);
      return 0;
    }
  }
}

// Exportar instância singleton
export const storageService = StorageService;
