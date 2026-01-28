/**
 * DTO para consulta de status de manifestações
 */
export interface ManifestationStatusQueryDTO {
  /** Tipo de manifestação para filtrar (opcional) */
  manifestationType?: string;
  
  /** Status para filtrar (opcional) */
  status?: string;
  
  /** Data inicial para filtrar (formato ISO) */
  dateFrom?: string;
  
  /** Data final para filtrar (formato ISO) */
  dateTo?: string;
  
  /** Página para paginação */
  page?: number;
  
  /** Tamanho da página */
  pageSize?: number;
}