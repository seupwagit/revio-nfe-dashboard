/**
 * Interface para configuração de precedência por coleção
 * 
 * Define a hierarquia de precedência para configurações:
 * específico > global > padrão
 */
export interface CollectionConfigPrecedence {
  /** Nome da coleção */
  collection: string;
  
  /** Configuração específica da coleção (maior precedência) */
  specific?: {
    groupBy?: string;
    orderBy?: string;
    enabled?: boolean;
    source: 'environment';
    priority: 1;
  };
  
  /** Configuração global (precedência média) */
  global?: {
    enabled?: boolean;
    source: 'environment';
    priority: 2;
  };
  
  /** Configuração padrão (menor precedência) */
  default: {
    groupBy: string;
    orderBy: string;
    enabled: boolean;
    source: 'default';
    priority: 3;
  };
  
  /** Configuração final resolvida */
  resolved: {
    groupBy: string;
    orderBy: string;
    enabled: boolean;
    globalEnabled: boolean;
    source: 'specific' | 'global' | 'default';
    appliedPrecedence: Array<{
      level: 'specific' | 'global' | 'default';
      field: string;
      value: any;
      source: string;
    }>;
  };
}