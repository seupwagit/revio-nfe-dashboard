import { OrderingField } from './ordering-field.interface';

/**
 * Interface para configuração de ordenação
 * 
 * Define a configuração completa de ordenação para uma coleção
 */
export interface OrderingConfig {
  /** Lista de campos de ordenação */
  fields: OrderingField[];
  
  /** String de ordenação padrão */
  defaultOrdering: string;
  
  /** Se a ordenação está habilitada */
  enabled: boolean;
  
  /** Nome da coleção */
  collection: string;
}