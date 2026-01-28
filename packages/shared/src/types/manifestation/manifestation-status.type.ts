/**
 * Status possíveis para uma manifestação agendada
 */
export type ManifestationStatus = 
  | 'AGENDADO'     // Manifestação foi agendada mas ainda não processada
  | 'PROCESSANDO'  // Manifestação está sendo processada
  | 'CONCLUIDO'    // Manifestação foi processada com sucesso
  | 'ERRO'         // Erro durante o processamento da manifestação
  | 'CANCELADO';   // Manifestação foi cancelada pelo usuário ou sistema