import { ManifestationRecord } from '../types/manifestation/manifestation-record.interface';
import { PaginatedResponse } from '../types/paginated-response.interface';

/**
 * DTO para resposta de consulta de status de manifestações
 */
export interface ManifestationStatusResponseDTO {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  
  /** Dados paginados das manifestações */
  data?: PaginatedResponse<ManifestationRecord>;
  
  /** Mensagem de erro (quando falha) */
  error?: string;
  
  /** Código do erro para tratamento específico */
  errorCode?: string;
}