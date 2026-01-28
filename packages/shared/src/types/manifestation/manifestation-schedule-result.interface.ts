/**
 * Resultado do agendamento de manifestações
 */
export interface ManifestationScheduleResult {
  /** Identificador único do agendamento */
  manifestationId: string;
  
  /** Total de chaves de acesso processadas */
  totalChaves: number;
  
  /** Número de duplicatas que foram ignoradas */
  duplicatesSkipped: number;
  
  /** Número de manifestações efetivamente agendadas */
  scheduledCount: number;
}