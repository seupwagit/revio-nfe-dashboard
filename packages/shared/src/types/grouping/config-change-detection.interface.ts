/**
 * Interface para detecção de mudanças de configuração em tempo de execução
 * 
 * Permite monitorar alterações nas variáveis de ambiente
 * e aplicar mudanças dinamicamente sem reinicialização
 */
export interface ConfigChangeDetection {
  /** Configuração anterior */
  previous: {
    groupBy: string;
    orderBy: string;
    enabled: boolean;
    globalEnabled: boolean;
    timestamp: number;
    checksum: string;
  };
  
  /** Configuração atual */
  current: {
    groupBy: string;
    orderBy: string;
    enabled: boolean;
    globalEnabled: boolean;
    timestamp: number;
    checksum: string;
  };
  
  /** Mudanças detectadas */
  changes: Array<{
    field: 'groupBy' | 'orderBy' | 'enabled' | 'globalEnabled';
    previousValue: any;
    currentValue: any;
    changeType: 'added' | 'modified' | 'removed';
    impact: 'low' | 'medium' | 'high';
  }>;
  
  /** Se houve mudanças significativas */
  hasSignificantChanges: boolean;
  
  /** Ações recomendadas */
  recommendedActions: Array<{
    action: 'refresh_cache' | 'restart_service' | 'notify_admin' | 'log_change';
    priority: 'low' | 'medium' | 'high';
    reason: string;
  }>;
}