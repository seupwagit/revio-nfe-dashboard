/**
 * Interface para configuração de agrupamento de NFe
 */
export interface GroupingConfig {
  enabled: boolean;
  globalEnabled: boolean;
  groupByFields: string[];
  collection: string;
  lastUpdated: number;
  source: string; // Fonte da configuração (environment, default, etc.)
}