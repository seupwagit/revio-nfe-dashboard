export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between' | 'regex';

export interface FilterItem {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface DynamicFilters {
  filters: FilterItem[];
  logic?: 'and' | 'or';
}
