/**
 * Interface para mensagens de feedback do sistema
 */
export interface FeedbackMessage {
  /** Tipo da mensagem */
  type: 'success' | 'error' | 'info' | 'warning';
  
  /** Texto principal da mensagem */
  text: string;
  
  /** Detalhes adicionais (opcional) */
  details?: string;
}