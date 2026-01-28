/**
 * Resultado da interceptação de consulta
 */
export interface InterceptionResult {
  /** Indica se a interceptação foi bem-sucedida */
  success: boolean;
  
  /** Dados resultantes da consulta (agrupados ou originais) */
  data: any[];
  
  /** Metadados sobre o processamento */
  metadata: {
    /** Indica se agrupamento foi aplicado */
    grouped: boolean;
    
    /** Número de grupos criados (se agrupado) */
    groupCount: number;
    
    /** Número total de documentos processados */
    totalDocuments: number;
    
    /** Tempo de processamento em milissegundos */
    processingTime: number;
    
    /** Configurações aplicadas */
    appliedConfig?: {
      groupByFields?: string[];
      orderByFields?: string[];
      normalizedPrefixes?: boolean;
    };
  };
  
  /** Erro se a interceptação falhou */
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}