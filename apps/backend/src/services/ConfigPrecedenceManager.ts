// 1. Node.js built-ins
import { createHash } from 'crypto';

// 2. External libraries
// (nenhuma biblioteca externa necessária)

// 3. Internal packages (workspace)
import {
    NFE_GROUPING_DEFAULTS,
    NFE_GROUPING_ENV_VARS,
    NFE_GROUPING_LOG_MESSAGES,
    NFE_GROUPING_LOG_PREFIXES
} from '@fiscal/shared/constants/nfe-grouping.constants';
import { CollectionConfigPrecedence } from '@fiscal/shared/types/grouping/collection-config-precedence.interface';
import { ConfigChangeDetection } from '@fiscal/shared/types/grouping/config-change-detection.interface';

// 4. Relative imports
import { logger } from '../utils/logger';

/**
 * Gerenciador de precedência de configurações por coleção
 * 
 * Implementa hierarquia de precedência:
 * 1. Configuração específica da coleção (maior precedência)
 * 2. Configuração global (precedência média)
 * 3. Configuração padrão (menor precedência)
 * 
 * Responsável por:
 * - Resolver precedência entre configurações
 * - Detectar mudanças em tempo de execução
 * - Aplicar configurações dinamicamente
 * - Registrar mudanças com logging estruturado
 */
export class ConfigPrecedenceManager {
  private static instance: ConfigPrecedenceManager;
  private configHistory = new Map<string, CollectionConfigPrecedence>();
  private lastEnvironmentCheck = new Map<string, string>();
  
  private constructor() {
    logger.info(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} 🚀 ConfigPrecedenceManager inicializado`, {
      supportedPrecedence: ['specific', 'global', 'default'],
      changeDetectionEnabled: true
    });
  }

  /**
   * Obtém instância singleton do gerenciador
   */
  static getInstance(): ConfigPrecedenceManager {
    if (!ConfigPrecedenceManager.instance) {
      ConfigPrecedenceManager.instance = new ConfigPrecedenceManager();
    }
    return ConfigPrecedenceManager.instance;
  }

  /**
   * Resolve configuração com precedência para uma coleção
   */
  resolveConfigurationPrecedence(collection: string): CollectionConfigPrecedence {
    const startTime = Date.now();
    
    // Construir configuração com precedência
    const precedenceConfig = this.buildPrecedenceConfiguration(collection);
    
    // Detectar mudanças se configuração anterior existe
    const changeDetection = this.detectConfigurationChanges(collection, precedenceConfig);
    
    // Aplicar mudanças se necessário
    if (changeDetection.hasSignificantChanges) {
      this.applyConfigurationChanges(collection, changeDetection);
    }
    
    // Armazenar configuração atual no histórico
    this.configHistory.set(collection, precedenceConfig);
    
    const processingTime = Date.now() - startTime;
    
    logger.info(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} ✅ Precedência de configuração resolvida`, {
      collection,
      resolvedSource: precedenceConfig.resolved.source,
      appliedPrecedence: precedenceConfig.resolved.appliedPrecedence,
      hasChanges: changeDetection.hasSignificantChanges,
      changeCount: changeDetection.changes.length,
      processingTime: `${processingTime}ms`
    });
    
    return precedenceConfig;
  }

  /**
   * Detecta mudanças de configuração em tempo de execução
   */
  detectRuntimeConfigurationChanges(collection: string): ConfigChangeDetection | null {
    const currentConfig = this.configHistory.get(collection);
    if (!currentConfig) {
      return null;
    }
    
    const newConfig = this.buildPrecedenceConfiguration(collection);
    return this.detectConfigurationChanges(collection, newConfig);
  }

  /**
   * Força verificação de mudanças em todas as coleções
   */
  checkAllCollectionsForChanges(): Map<string, ConfigChangeDetection> {
    const changes = new Map<string, ConfigChangeDetection>();
    
    for (const [collection] of this.configHistory) {
      const changeDetection = this.detectRuntimeConfigurationChanges(collection);
      if (changeDetection && changeDetection.hasSignificantChanges) {
        changes.set(collection, changeDetection);
      }
    }
    
    if (changes.size > 0) {
      logger.info(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} 🔄 Mudanças detectadas em ${changes.size} coleções`, {
        collections: Array.from(changes.keys()),
        totalChanges: Array.from(changes.values()).reduce((sum, change) => sum + change.changes.length, 0)
      });
    }
    
    return changes;
  }

  /**
   * Obtém histórico de configurações
   */
  getConfigurationHistory(): Map<string, CollectionConfigPrecedence> {
    return new Map(this.configHistory);
  }

  /**
   * Limpa histórico de configurações
   */
  clearConfigurationHistory(): void {
    const historySize = this.configHistory.size;
    this.configHistory.clear();
    this.lastEnvironmentCheck.clear();
    
    logger.info(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} 🗑️ Histórico de configurações limpo`, {
      clearedEntries: historySize
    });
  }

  /**
   * Constrói configuração com precedência para uma coleção
   */
  private buildPrecedenceConfiguration(collection: string): CollectionConfigPrecedence {
    const collectionUpper = collection.toUpperCase();
    
    // Configuração padrão (menor precedência)
    const defaultConfig = {
      groupBy: NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD,
      orderBy: NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY,
      enabled: true,
      source: 'default' as const,
      priority: 3 as const
    };
    
    // Configuração global (precedência média)
    const globalEnabled = process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED];
    const globalConfig = globalEnabled !== undefined ? {
      enabled: globalEnabled !== 'false' && globalEnabled !== '0',
      source: 'environment' as const,
      priority: 2 as const
    } : undefined;
    
    // Configuração específica da coleção (maior precedência)
    const groupByVar = `${collectionUpper}_GROUP_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
    const orderByVar = `${collectionUpper}_ORDER_BY` as keyof typeof NFE_GROUPING_ENV_VARS;
    const enabledVar = `${collectionUpper}_GROUPING_ENABLED` as keyof typeof NFE_GROUPING_ENV_VARS;
    
    const specificGroupBy = process.env[NFE_GROUPING_ENV_VARS[groupByVar]];
    const specificOrderBy = process.env[NFE_GROUPING_ENV_VARS[orderByVar]];
    const specificEnabled = process.env[NFE_GROUPING_ENV_VARS[enabledVar]];
    
    const specificConfig = (specificGroupBy !== undefined || 
                           specificOrderBy !== undefined || 
                           specificEnabled !== undefined) ? {
      ...(specificGroupBy !== undefined && { groupBy: specificGroupBy }),
      ...(specificOrderBy !== undefined && { orderBy: specificOrderBy }),
      ...(specificEnabled !== undefined && { 
        enabled: specificEnabled !== 'false' && specificEnabled !== '0' 
      }),
      source: 'environment' as const,
      priority: 1 as const
    } : undefined;
    
    // Resolver configuração final aplicando precedência
    const resolved = this.resolveWithPrecedence(
      collection,
      specificConfig,
      globalConfig,
      defaultConfig
    );
    
    return {
      collection,
      specific: specificConfig,
      global: globalConfig,
      default: defaultConfig,
      resolved
    };
  }

  /**
   * Resolve configuração final aplicando regras de precedência
   */
  private resolveWithPrecedence(
    collection: string,
    specific: any,
    global: any,
    defaultConfig: any
  ): CollectionConfigPrecedence['resolved'] {
    const appliedPrecedence: Array<{
      level: 'specific' | 'global' | 'default';
      field: string;
      value: any;
      source: string;
    }> = [];
    
    // Resolver groupBy (específico > padrão)
    let groupBy: string;
    let groupBySource: 'specific' | 'global' | 'default';
    
    if (specific?.groupBy !== undefined) {
      groupBy = specific.groupBy;
      groupBySource = 'specific';
      appliedPrecedence.push({
        level: 'specific',
        field: 'groupBy',
        value: groupBy,
        source: specific.source
      });
    } else {
      groupBy = defaultConfig.groupBy;
      groupBySource = 'default';
      appliedPrecedence.push({
        level: 'default',
        field: 'groupBy',
        value: groupBy,
        source: defaultConfig.source
      });
    }
    
    // Resolver orderBy (específico > padrão)
    let orderBy: string;
    let orderBySource: 'specific' | 'global' | 'default';
    
    if (specific?.orderBy !== undefined) {
      orderBy = specific.orderBy;
      orderBySource = 'specific';
      appliedPrecedence.push({
        level: 'specific',
        field: 'orderBy',
        value: orderBy,
        source: specific.source
      });
    } else {
      orderBy = defaultConfig.orderBy;
      orderBySource = 'default';
      appliedPrecedence.push({
        level: 'default',
        field: 'orderBy',
        value: orderBy,
        source: defaultConfig.source
      });
    }
    
    // Resolver enabled (específico > global > padrão)
    let enabled: boolean;
    let enabledSource: 'specific' | 'global' | 'default';
    
    if (specific?.enabled !== undefined) {
      enabled = specific.enabled;
      enabledSource = 'specific';
      appliedPrecedence.push({
        level: 'specific',
        field: 'enabled',
        value: enabled,
        source: specific.source
      });
    } else if (global?.enabled !== undefined) {
      enabled = global.enabled;
      enabledSource = 'global';
      appliedPrecedence.push({
        level: 'global',
        field: 'enabled',
        value: enabled,
        source: global.source
      });
    } else {
      enabled = defaultConfig.enabled;
      enabledSource = 'default';
      appliedPrecedence.push({
        level: 'default',
        field: 'enabled',
        value: enabled,
        source: defaultConfig.source
      });
    }
    
    // Resolver globalEnabled (global > padrão)
    let globalEnabled: boolean;
    
    if (global?.enabled !== undefined) {
      globalEnabled = global.enabled;
      appliedPrecedence.push({
        level: 'global',
        field: 'globalEnabled',
        value: globalEnabled,
        source: global.source
      });
    } else {
      globalEnabled = true; // Padrão é habilitado
      appliedPrecedence.push({
        level: 'default',
        field: 'globalEnabled',
        value: globalEnabled,
        source: 'default'
      });
    }
    
    // Determinar fonte principal baseada na precedência mais alta usada
    const source = enabledSource === 'specific' ? 'specific' :
                  enabledSource === 'global' ? 'global' : 'default';
    
    return {
      groupBy,
      orderBy,
      enabled,
      globalEnabled,
      source,
      appliedPrecedence
    };
  }

  /**
   * Detecta mudanças entre configurações
   */
  private detectConfigurationChanges(
    collection: string,
    newConfig: CollectionConfigPrecedence
  ): ConfigChangeDetection {
    const previousConfig = this.configHistory.get(collection);
    const currentTime = Date.now();
    
    // Se não há configuração anterior, não há mudanças
    if (!previousConfig) {
      return {
        previous: {
          groupBy: '',
          orderBy: '',
          enabled: false,
          globalEnabled: false,
          timestamp: 0,
          checksum: ''
        },
        current: {
          groupBy: newConfig.resolved.groupBy,
          orderBy: newConfig.resolved.orderBy,
          enabled: newConfig.resolved.enabled,
          globalEnabled: newConfig.resolved.globalEnabled,
          timestamp: currentTime,
          checksum: this.calculateConfigChecksum(newConfig.resolved)
        },
        changes: [],
        hasSignificantChanges: false,
        recommendedActions: []
      };
    }
    
    const previous = {
      groupBy: previousConfig.resolved.groupBy,
      orderBy: previousConfig.resolved.orderBy,
      enabled: previousConfig.resolved.enabled,
      globalEnabled: previousConfig.resolved.globalEnabled,
      timestamp: currentTime,
      checksum: this.calculateConfigChecksum(previousConfig.resolved)
    };
    
    const current = {
      groupBy: newConfig.resolved.groupBy,
      orderBy: newConfig.resolved.orderBy,
      enabled: newConfig.resolved.enabled,
      globalEnabled: newConfig.resolved.globalEnabled,
      timestamp: currentTime,
      checksum: this.calculateConfigChecksum(newConfig.resolved)
    };
    
    const changes: ConfigChangeDetection['changes'] = [];
    
    // Detectar mudanças em cada campo
    if (previous.groupBy !== current.groupBy) {
      changes.push({
        field: 'groupBy',
        previousValue: previous.groupBy,
        currentValue: current.groupBy,
        changeType: current.groupBy ? 'modified' : 'removed',
        impact: 'high'
      });
    }
    
    if (previous.orderBy !== current.orderBy) {
      changes.push({
        field: 'orderBy',
        previousValue: previous.orderBy,
        currentValue: current.orderBy,
        changeType: current.orderBy ? 'modified' : 'removed',
        impact: 'medium'
      });
    }
    
    if (previous.enabled !== current.enabled) {
      changes.push({
        field: 'enabled',
        previousValue: previous.enabled,
        currentValue: current.enabled,
        changeType: 'modified',
        impact: 'high'
      });
    }
    
    if (previous.globalEnabled !== current.globalEnabled) {
      changes.push({
        field: 'globalEnabled',
        previousValue: previous.globalEnabled,
        currentValue: current.globalEnabled,
        changeType: 'modified',
        impact: 'high'
      });
    }
    
    const hasSignificantChanges = changes.some(change => change.impact === 'high');
    
    // Determinar ações recomendadas
    const recommendedActions: ConfigChangeDetection['recommendedActions'] = [];
    
    if (hasSignificantChanges) {
      recommendedActions.push({
        action: 'refresh_cache',
        priority: 'high',
        reason: 'Mudanças significativas detectadas na configuração'
      });
      
      recommendedActions.push({
        action: 'log_change',
        priority: 'medium',
        reason: 'Registrar mudanças para auditoria'
      });
    }
    
    if (changes.length > 0) {
      recommendedActions.push({
        action: 'notify_admin',
        priority: 'low',
        reason: 'Notificar administrador sobre mudanças de configuração'
      });
    }
    
    return {
      previous,
      current,
      changes,
      hasSignificantChanges,
      recommendedActions
    };
  }

  /**
   * Aplica mudanças de configuração
   */
  private applyConfigurationChanges(
    collection: string,
    changeDetection: ConfigChangeDetection
  ): void {
    logger.info(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} 🔄 Aplicando mudanças de configuração`, {
      collection,
      changes: changeDetection.changes.map(change => ({
        field: change.field,
        from: change.previousValue,
        to: change.currentValue,
        impact: change.impact
      })),
      recommendedActions: changeDetection.recommendedActions
    });
    
    // Executar ações recomendadas
    changeDetection.recommendedActions.forEach(action => {
      switch (action.action) {
        case 'refresh_cache':
          // Cache será atualizado automaticamente na próxima consulta
          logger.debug(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} 🔄 Cache será atualizado`, {
            collection,
            reason: action.reason
          });
          break;
          
        case 'log_change':
          logger.info(`${NFE_GROUPING_LOG_PREFIXES.CONFIG} 📝 ${NFE_GROUPING_LOG_MESSAGES.CONFIG_REFRESHED}`, {
            collection,
            changeDetails: changeDetection.changes,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'notify_admin':
          logger.warn(`${NFE_GROUPING_LOG_PREFIXES.WARNING} ⚠️ Mudança de configuração detectada`, {
            collection,
            changes: changeDetection.changes.length,
            highImpactChanges: changeDetection.changes.filter(c => c.impact === 'high').length
          });
          break;
      }
    });
  }

  /**
   * Calcula checksum da configuração para detecção de mudanças
   */
  private calculateConfigChecksum(config: any): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return createHash('md5').update(configString).digest('hex');
  }
}