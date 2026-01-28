/**
 * DTO para atualização de status de manifestação
 */
export interface ManifestationUpdateStatusRequestDTO {
  /** Novo status da manifestação */
  status: string;
  
  /** Observações sobre a atualização (opcional) */
  notes?: string;
}