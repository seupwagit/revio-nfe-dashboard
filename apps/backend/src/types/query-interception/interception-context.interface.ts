import { GroupingConfig } from '@fiscal/shared/types/grouping/grouping-config.interface';
import { OrderingConfig } from '@fiscal/shared/types/grouping/ordering-config.interface';

/**
 * Contexto de interceptação de consulta para agrupamento configurável
 */
export interface InterceptionContext {
  /** Nome da coleção sendo consultada */
  collection: string;
  
  /** Consulta original do MongoDB */
  originalQuery: any;
  
  /** Configuração de agrupamento aplicável */
  groupingConfig: GroupingConfig;
  
  /** Configuração de ordenação aplicável */
  orderingConfig: OrderingConfig;
  
  /** Opções adicionais da consulta original */
  options?: any;
  
  /** Timestamp de início da interceptação */
  startTime?: number;
}