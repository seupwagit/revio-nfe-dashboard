/**
 * Interface para entrada de cache de configuração
 * 
 * Define a estrutura de dados armazenados no cache
 * incluindo TTL e metadados de controle
 */
export interface ConfigCacheEntry<T> {
  /** Dados da configuração */
  data: T;
  
  /** Timestamp de expiração do cache */
  expiry: number;
  
  /** Timestamp de criação da entrada */
  createdAt: number;
  
  /** Chave de identificação da entrada */
  key: string;
  
  /** Número de acessos à entrada */
  accessCount?: number;
  
  /** Último acesso à entrada */
  lastAccessed?: number;
}