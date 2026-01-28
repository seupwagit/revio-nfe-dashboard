/**
 * Interface para configuração de ordenação de NFe
 */
export interface OrderingConfig {
  enabled: boolean;
  fields: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
  defaultOrdering: string;
  lastUpdated: number;
}