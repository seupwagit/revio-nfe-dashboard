/**
 * Helpers para testes do NFeQueryInterceptor
 */

import { GroupingConfig } from '@fiscal/shared/types/grouping/grouping-config.interface';
import { OrderingConfig } from '@fiscal/shared/types/grouping/ordering-config.interface';

/**
 * Cria um objeto GroupingConfig válido para testes
 */
export function createTestGroupingConfig(overrides: Partial<GroupingConfig> = {}): GroupingConfig {
  return {
    enabled: true,
    globalEnabled: true,
    groupByFields: ['CHV_NFE'],
    collection: 'tbl_nfe_100',
    lastUpdated: Date.now(),
    source: 'test',
    ...overrides
  };
}

/**
 * Cria um objeto OrderingConfig válido para testes
 */
export function createTestOrderingConfig(overrides: Partial<OrderingConfig> = {}): OrderingConfig {
  return {
    enabled: true,
    fields: [{ field: 'DT_DOC', direction: 'DESC' as const }],
    defaultOrdering: 'DT_DOC DESC',
    lastUpdated: Date.now(),
    ...overrides
  };
}