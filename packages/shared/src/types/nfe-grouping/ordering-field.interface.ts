/**
 * Interface para campo de ordenação com direção e prioridade
 */
export interface OrderingField {
  /** Nome do campo para ordenação */
  field: string;
  
  /** Direção da ordenação (1 para ASC, -1 para DESC no MongoDB) */
  direction: 1 | -1;
  
  /** Prioridade da ordenação (menor número = maior prioridade) */
  priority: number;
}