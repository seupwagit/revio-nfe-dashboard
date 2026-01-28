/**
 * Interface para resposta paginada
 * Padrão para todas as consultas que retornam dados paginados
 */

/**
 * Interface para informações de paginação
 */
export interface PaginationInfo {
  /** Página atual */
  page: number;
  /** Tamanho da página */
  pageSize: number;
  /** Total de registros */
  totalCount: number;
  /** Total de páginas */
  totalPages: number;
}

/**
 * Interface genérica para resposta paginada
 */
export interface PaginatedResponse<T> {
  /** Dados da página atual */
  data: T[];
  /** Informações de paginação */
  pagination: PaginationInfo;
}