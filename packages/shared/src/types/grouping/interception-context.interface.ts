/**
 * Interface para contexto de interceptação de consulta
 */
import { GroupingConfig } from './grouping-config.interface';
import { OrderingConfig } from './ordering-config.interface';

export interface InterceptionContext {
  collection: string;
  originalQuery: any;
  groupingConfig: GroupingConfig;
  orderingConfig: OrderingConfig;
}