import { ManifestationType } from '../types/manifestation/manifestation-type.interface';

/**
 * DTO para resposta da listagem de tipos de manifestação
 */
export interface ManifestationTypesResponseDTO {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  
  /** Lista de tipos de manifestação disponíveis */
  data?: ManifestationType[];
  
  /** Mensagem de erro (quando falha) */
  error?: string;
  
  /** Código do erro para tratamento específico */
  errorCode?: string;
}