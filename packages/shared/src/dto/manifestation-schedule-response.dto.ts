import { ManifestationScheduleResult } from '../types/manifestation/manifestation-schedule-result.interface';

/**
 * DTO para resposta de agendamento de manifestação
 */
export interface ManifestationScheduleResponseDTO {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  
  /** Dados do resultado (quando sucesso) */
  data?: ManifestationScheduleResult;
  
  /** Mensagem de erro (quando falha) */
  error?: string;
  
  /** Código do erro para tratamento específico */
  errorCode?: string;
}