/**
 * Interface para campo de ordenação
 */
export interface OrderingField {
  field: string;
  direction: 1 | -1; // MongoDB sort direction
  priority: number;
}