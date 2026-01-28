import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { GroupingConfigManager } from '../GroupingConfigManager';

/**
 * Property-Based Tests para Controle Global e Precedência de Configurações
 * 
 * Feature: nfe-configurable-grouping, Property 6: Controle Global e Precedência de Configurações
 * 
 * Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * Para qualquer combinação de configurações globais e específicas por coleção,
 * o sistema deve respeitar a hierarquia de precedência (específico > global) e
 * aplicar mudanças dinamicamente sem reinicialização.
 */
describe('GroupingConfigManager - Global Precedence Properties', () => {
  let configManager: GroupingConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    configManager = new GroupingConfigManager();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should respect configuration precedence hierarchy', async () => {
    await fc.assert(fc.asyncProperty(
      // Gerador para configurações globais
      fc.record({
        globalEnabled: fc.boolean(),
        globalGroupBy: fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }).map(arr => [...new Set(arr)]), // Remove duplicatas
        globalOrderBy: fc.constantFrom('DT_DOC ASC', 'DT_DOC DESC', 'PROTOCOLADA ASC', 'PROTOCOLADA DESC')
      }),
      
      // Gerador para configurações específicas por coleção
      fc.record({
        collectionEnabled: fc.option(fc.boolean()),
        collectionGroupBy: fc.option(fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }).map(arr => [...new Set(arr)])), // Remove duplicatas
        collectionOrderBy: fc.option(fc.constantFrom('DT_DOC ASC', 'DT_DOC DESC', 'PROTOCOLADA ASC', 'PROTOCOLADA DESC'))
      }),
      
      // Nome da coleção
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100', 'tbl_cfe_100'),
      
      async (globalConfig, collectionConfig, collectionName) => {
        // Feature: nfe-configurable-grouping, Property 6: Controle Global e Precedência de Configurações
        
        // Limpar todas as variáveis de ambiente relacionadas primeiro
        const collectionUpper = collectionName.toUpperCase();
        delete process.env.NFE_GROUPING_ENABLED;
        delete process.env.NFE_GROUP_BY;
        delete process.env.NFE_ORDER_BY;
        delete process.env[`${collectionUpper}_GROUPING_ENABLED`];
        delete process.env[`${collectionUpper}_GROUP_BY`];
        delete process.env[`${collectionUpper}_ORDER_BY`];
        
        // Configurar variáveis globais
        process.env.NFE_GROUPING_ENABLED = globalConfig.globalEnabled.toString();
        process.env.NFE_GROUP_BY = globalConfig.globalGroupBy.join(',');
        process.env.NFE_ORDER_BY = globalConfig.globalOrderBy;
        
        // Configurar variáveis específicas da coleção (se definidas)
        if (collectionConfig.collectionEnabled !== null) {
          process.env[`${collectionUpper}_GROUPING_ENABLED`] = collectionConfig.collectionEnabled.toString();
        }
        if (collectionConfig.collectionGroupBy !== null) {
          process.env[`${collectionUpper}_GROUP_BY`] = collectionConfig.collectionGroupBy.join(',');
        }
        if (collectionConfig.collectionOrderBy !== null) {
          process.env[`${collectionUpper}_ORDER_BY`] = collectionConfig.collectionOrderBy;
        }
        
        // Obter configuração para a coleção
        configManager.refreshConfig(); // Limpar cache antes de obter configuração
        const config = configManager.getGroupingConfig(collectionName);
        const orderConfig = configManager.getOrderingConfig(collectionName);
        
        // Verificar precedência: configuração específica deve sobrescrever global
        if (collectionConfig.collectionEnabled !== null) {
          // Se configuração específica está definida, deve ser usada APENAS se global estiver habilitado
          if (globalConfig.globalEnabled) {
            expect(config.enabled).toBe(collectionConfig.collectionEnabled && config.groupByFields.length > 0);
          } else {
            // Se global está desabilitado, enabled deve ser false independente da configuração específica
            expect(config.enabled).toBe(false);
          }
        } else {
          // Se não há configuração específica, usar global
          expect(config.enabled).toBe(globalConfig.globalEnabled && config.groupByFields.length > 0);
        }
        
        if (collectionConfig.collectionGroupBy !== null) {
          // Configuração específica de agrupamento deve ser usada
          expect(config.groupByFields).toEqual(collectionConfig.collectionGroupBy);
        } else {
          // Configuração global deve ser usada
          expect(config.groupByFields).toEqual(globalConfig.globalGroupBy);
        }
        
        if (collectionConfig.collectionOrderBy !== null) {
          // Configuração específica de ordenação deve ser usada
          expect(orderConfig.defaultOrdering).toBe(collectionConfig.collectionOrderBy);
        } else {
          // Configuração global deve ser usada
          expect(orderConfig.defaultOrdering).toBe(globalConfig.globalOrderBy);
        }
        
        // Verificar que configuração global está sempre disponível
        expect(config.globalEnabled).toBe(globalConfig.globalEnabled);
        
        // Verificar que nome da coleção está correto
        expect(config.collection).toBe(collectionName);
      }
    ), { numRuns: 100 });
  });

  it('should apply configuration changes dynamically without restart', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 2 }).map(arr => [...new Set(arr)]), // Remove duplicatas
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 2 }).map(arr => [...new Set(arr)]), // Remove duplicatas
      
      async (collectionName, initialGroupBy, newGroupBy) => {
        // Feature: nfe-configurable-grouping, Property 6: Controle Global e Precedência de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        
        // Limpar variáveis de ambiente primeiro
        delete process.env.NFE_GROUPING_ENABLED;
        delete process.env.NFE_GROUP_BY;
        delete process.env.NFE_ORDER_BY;
        delete process.env[`${collectionUpper}_GROUPING_ENABLED`];
        delete process.env[`${collectionUpper}_GROUP_BY`];
        delete process.env[`${collectionUpper}_ORDER_BY`];
        
        // Configuração inicial
        process.env[`${collectionUpper}_GROUP_BY`] = initialGroupBy.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        
        // Obter configuração inicial
        configManager.refreshConfig(); // Limpar cache
        const initialConfig = configManager.getGroupingConfig(collectionName);
        expect(initialConfig.groupByFields).toEqual(initialGroupBy);
        
        // Alterar configuração dinamicamente
        process.env[`${collectionUpper}_GROUP_BY`] = newGroupBy.join(',');
        
        // Forçar refresh da configuração (simula mudança dinâmica)
        configManager.refreshConfig();
        
        // Obter nova configuração
        const newConfig = configManager.getGroupingConfig(collectionName);
        
        // Verificar que mudança foi aplicada sem reinicialização
        expect(newConfig.groupByFields).toEqual(newGroupBy);
        expect(newConfig.enabled).toBe(true);
        expect(newConfig.collection).toBe(collectionName);
      }
    ), { numRuns: 100 });
  });

  it('should handle global control switch correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.boolean(),
      fc.boolean(),
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      
      async (globalEnabled, collectionEnabled, collectionName) => {
        // Feature: nfe-configurable-grouping, Property 6: Controle Global e Precedência de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        
        // Limpar variáveis de ambiente primeiro
        delete process.env.NFE_GROUPING_ENABLED;
        delete process.env.NFE_GROUP_BY;
        delete process.env.NFE_ORDER_BY;
        delete process.env[`${collectionUpper}_GROUPING_ENABLED`];
        delete process.env[`${collectionUpper}_GROUP_BY`];
        delete process.env[`${collectionUpper}_ORDER_BY`];
        
        // Configurar controle global e específico
        process.env.NFE_GROUPING_ENABLED = globalEnabled.toString();
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = collectionEnabled.toString();
        process.env[`${collectionUpper}_GROUP_BY`] = 'CHV_NFE';
        
        configManager.refreshConfig(); // Limpar cache
        const config = configManager.getGroupingConfig(collectionName);
        
        // Verificar que controle global é respeitado
        expect(config.globalEnabled).toBe(globalEnabled);
        
        // Se global está desabilitado, configuração específica não deve ter efeito
        if (!globalEnabled) {
          expect(config.enabled).toBe(false);
        } else {
          // Se global está habilitado, configuração específica deve ser respeitada
          expect(config.enabled).toBe(collectionEnabled);
        }
      }
    ), { numRuns: 100 });
  });

  it('should isolate configuration changes between collections', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT'), { minLength: 1, maxLength: 2 }).map(arr => [...new Set(arr)]), // Remove duplicatas
      fc.array(fc.constantFrom('CHV_NFE', 'DT_DOC'), { minLength: 1, maxLength: 2 }).map(arr => [...new Set(arr)]), // Remove duplicatas
      
      async (collection1GroupBy, collection2GroupBy) => {
        // Feature: nfe-configurable-grouping, Property 6: Controle Global e Precedência de Configurações
        
        const collection1 = 'tbl_nfe_100';
        const collection2 = 'tbl_cte_100';
        
        // Limpar variáveis de ambiente primeiro
        delete process.env.NFE_GROUPING_ENABLED;
        delete process.env.NFE_GROUP_BY;
        delete process.env.NFE_ORDER_BY;
        delete process.env.TBL_NFE_100_GROUPING_ENABLED;
        delete process.env.TBL_NFE_100_GROUP_BY;
        delete process.env.TBL_NFE_100_ORDER_BY;
        delete process.env.TBL_CTE_100_GROUPING_ENABLED;
        delete process.env.TBL_CTE_100_GROUP_BY;
        delete process.env.TBL_CTE_100_ORDER_BY;
        
        // Configurar cada coleção independentemente
        process.env.TBL_NFE_100_GROUP_BY = collection1GroupBy.join(',');
        process.env.TBL_NFE_100_GROUPING_ENABLED = 'true';
        
        process.env.TBL_CTE_100_GROUP_BY = collection2GroupBy.join(',');
        process.env.TBL_CTE_100_GROUPING_ENABLED = 'true';
        
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        // Obter configurações
        configManager.refreshConfig(); // Limpar cache
        const config1 = configManager.getGroupingConfig(collection1);
        const config2 = configManager.getGroupingConfig(collection2);
        
        // Verificar isolamento entre coleções
        expect(config1.groupByFields).toEqual(collection1GroupBy);
        expect(config2.groupByFields).toEqual(collection2GroupBy);
        expect(config1.collection).toBe(collection1);
        expect(config2.collection).toBe(collection2);
        
        // Alterar configuração de uma coleção
        const newGroupBy = ['DT_DOC'];
        process.env.TBL_NFE_100_GROUP_BY = newGroupBy.join(',');
        configManager.refreshConfig();
        
        // Verificar que apenas a coleção alterada foi afetada
        const updatedConfig1 = configManager.getGroupingConfig(collection1);
        const unchangedConfig2 = configManager.getGroupingConfig(collection2);
        
        expect(updatedConfig1.groupByFields).toEqual(newGroupBy);
        expect(unchangedConfig2.groupByFields).toEqual(collection2GroupBy);
      }
    ), { numRuns: 100 });
  });
});