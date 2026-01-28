import { ManifestationStatus } from './manifestation-status.type';

/**
 * Interface para registros de manifestação
 * Baseada na tabela tbl_manifestacao do SQL Server
 */
export interface ManifestationRecord {
  /** Identificador único do registro de manifestação */
  id: string;
  
  /** Código do usuário que agendou a manifestação */
  usrCodigo: string;
  
  /** Tipo de manifestação selecionado */
  tipoManifestacao: string;
  
  /** Chave de acesso do documento NFe (44 caracteres) */
  chaveAcesso: string;
  
  /** Status atual da manifestação */
  status: ManifestationStatus;
  
  /** Data e hora do agendamento */
  dataAgendamento: Date;
  
  /** Data e hora do processamento (quando concluído) */
  dataProcessamento?: Date;
  
  /** IP de origem da requisição */
  ipOrigem?: string;
  
  /** Observações adicionais sobre a manifestação */
  observacoes?: string;
  
  /** Data de criação do registro */
  createdAt: Date;
  
  /** Data da última atualização */
  updatedAt: Date;
}