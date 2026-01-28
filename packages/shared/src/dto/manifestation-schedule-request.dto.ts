/**
 * DTO para requisição de agendamento de manifestação
 */
export interface ManifestationScheduleRequestDTO {
  /** Tipo de manifestação selecionado */
  manifestationType: string;
  
  /** Array de chaves de acesso dos documentos NFe */
  chaves: string[];
}