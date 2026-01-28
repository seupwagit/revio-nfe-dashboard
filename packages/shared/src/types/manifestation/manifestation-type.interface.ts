/**
 * Interface para tipos de manifestação disponíveis no sistema
 * Baseada na tabela tbl_tipo_manifestacao do SQL Server
 */
export interface ManifestationType {
  /** Identificador único do tipo de manifestação */
  id: string;
  
  /** Código do tipo de manifestação (ex: "210200", "210210") */
  codigo: string;
  
  /** Descrição do tipo de manifestação */
  descricao: string;
  
  /** Indica se o tipo está ativo no sistema */
  ativo: boolean;
  
  /** Ordem de exibição (opcional) */
  ordem?: number;
}