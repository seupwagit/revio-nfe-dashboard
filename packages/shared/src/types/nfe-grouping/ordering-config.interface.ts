import { OrderingField } from './ordering-field.interface';

/**
 * Interface para configuração de ordenação
 */
export interface OrderingConfig {
  /** Lista de campos de ordenação com suas configurações */
  fields: OrderingField[];
  
  /** String de ordenação padrão */
  defaultOrdering: string;
  
  /** Se a ordenação está habilitada */
  enabled: boolean;
}