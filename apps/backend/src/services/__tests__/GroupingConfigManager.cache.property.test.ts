import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { GroupingConfigManager } from '../GroupingConfigManager';

/**
 * Property-Based Tests para Cache Eficiente de Configurações
 * 
 * Feature: nfe-configurable-grouping, Property 10: Cache Eficiente de Configurações
 * 
 * Valida: Requisitos 9.5
 * 
 * Para qualquer configuração carregada do ambiente, o sistema deve cachear
 * o resultado pelo TTL especificado e reutilizar configurações cached para
 * evitar re-processamento desnecessário.
 */
describe('GroupingConfigManager - Cache Properties', () => {
  let configManager: GroupingConfigManager;
  let originalEnv: NodeJS.ProcessEnv;
  let dateNowSpy: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    configManager = new GroupingConfigManager();
    
    // Mock Date.now para controlar tempo
    dateNowSpy = vi.spyOn(Date, 'now');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should cache configuration results for specified TTL', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
      fc.integer({ min: 1000, max: 10000 }), // TTL em ms
      
      async (collectionName, groupByFields, cacheTTL) => {
        // Feature: nfe-configurable-grouping, Property 10: Cache Eficiente de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        const startTime = 1000000; // Tempo inicial fixo
        
        // Configurar ambiente
        process.env[`${collectionUpper}_GROUP_BY`] = groupByFields.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        // Simular tempo inicial
        dateNowSpy.mockReturnValue(startTime);
        
        // Primeira chamada - deve carregar do ambiente
        const config1 = configManager.getGroupingConfig(collectionName);
        expect(config1.groupByFields).toEqual(groupByFields);
        
        // Segunda chamada imediata - deve usar cache
        const config2 = configManager.getGroupingConfig(collectionName);
        expect(config2).toEqual(config1);
        
        // Alterar configuração no ambiente
        const newGroupByFields = ['DT_DOC'];
        process.env[`${collectionUpper}_GROUP_BY`] = newGroupByFields.join(',');
        
        // Terceira chamada ainda dentro do TTL - deve usar cache (configuração antiga)
        dateNowSpy.mockReturnValue(startTime + cacheTTL / 2);
        const config3 = configManager.getGroupingConfig(collectionName);
        expect(config3.groupByFields).toEqual(groupByFields); // Ainda a configuração antiga
        
        // Quarta chamada após TTL expirar - deve recarregar
        dateNowSpy.mockReturnValue(startTime + cacheTTL + 1000);
        const config4 = configManager.getGroupingConfig(collectionName);
        expect(config4.groupByFields).toEqual(newGroupByFields); // Nova configuração
      }
    ), { numRuns: 100 });
  });

  it('should avoid re-processing when configuration has not changed', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
      fc.integer({ min: 5, max: 20 }), // Número de chamadas
      
      async (collectionName, groupByFields, numCalls) => {
        // Feature: nfe-configurable-grouping, Property 10: Cache Eficiente de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        const startTime = 2000000;
        
        // Configurar ambiente
        process.env[`${collectionUpper}_GROUP_BY`] = groupByFields.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        dateNowSpy.mockReturnValue(startTime);
        
        // Fazer múltiplas chamadas
        const configs = [];
        for (let i = 0; i < numCalls; i++) {
          // Simular pequeno avanço no tempo (mas dentro do TTL)
          dateNowSpy.mockReturnValue(startTime + i * 100);
          configs.push(configManager.getGroupingConfig(collectionName));
        }
        
        // Todas as configurações devem ser idênticas (cache funcionando)
        for (let i = 1; i < configs.length; i++) {
          expect(configs[i]).toEqual(configs[0]);
          expect(configs[i].groupByFields).toEqual(groupByFields);
        }
        
        // Verificar que configuração é consistente
        expect(configs[0].enabled).toBe(true);
        expect(configs[0].collection).toBe(collectionName);
        expect(configs[0].globalEnabled).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('should handle cache invalidation correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT'), { minLength: 1, maxLength: 2 }),
      fc.array(fc.constantFrom('DT_DOC', 'PROTOCOLADA'), { minLength: 1, maxLength: 2 }),
      
      async (collectionName, initialFields, newFields) => {
        // Feature: nfe-configurable-grouping, Property 10: Cache Eficiente de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        const startTime = 3000000;
        
        // Configuração inicial
        process.env[`${collectionUpper}_GROUP_BY`] = initialFields.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        dateNowSpy.mockReturnValue(startTime);
        
        // Primeira chamada
        const config1 = configManager.getGroupingConfig(collectionName);
        expect(config1.groupByFields).toEqual(initialFields);
        
        // Alterar configuração
        process.env[`${collectionUpper}_GROUP_BY`] = newFields.join(',');
        
        // Forçar refresh do cache
        configManager.refreshConfig();
        
        // Nova chamada deve refletir mudança
        const config2 = configManager.getGroupingConfig(collectionName);
        expect(config2.groupByFields).toEqual(newFields);
        
        // Verificar que cache foi invalidado corretamente
        expect(config2.groupByFields).not.toEqual(config1.groupByFields);
        expect(config2.collection).toBe(collectionName);
        expect(config2.enabled).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('should maintain separate cache entries for different collections', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT'), { minLength: 1, maxLength: 2 }),
      fc.array(fc.constantFrom('DT_DOC', 'PROTOCOLADA'), { minLength: 1, maxLength: 2 }),
      
      async (nfeFields, cteFields) => {
        // Feature: nfe-configurable-grouping, Property 10: Cache Eficiente de Configurações
        
        const startTime = 4000000;
        
        // Configurar diferentes coleções
        process.env.TBL_NFE_100_GROUP_BY = nfeFields.join(',');
        process.env.TBL_NFE_100_GROUPING_ENABLED = 'true';
        process.env.TBL_CTE_100_GROUP_BY = cteFields.join(',');
        process.env.TBL_CTE_100_GROUPING_ENABLED = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        dateNowSpy.mockReturnValue(startTime);
        
        // Obter configurações para ambas as coleções
        const nfeConfig = configManager.getGroupingConfig('tbl_nfe_100');
        const cteConfig = configManager.getGroupingConfig('tbl_cte_100');
        
        // Verificar que configurações são independentes
        expect(nfeConfig.groupByFields).toEqual(nfeFields);
        expect(cteConfig.groupByFields).toEqual(cteFields);
        expect(nfeConfig.collection).toBe('tbl_nfe_100');
        expect(cteConfig.collection).toBe('tbl_cte_100');
        
        // Alterar configuração de uma coleção
        process.env.TBL_NFE_100_GROUP_BY = 'CHV_NFE';
        configManager.refreshConfig();
        
        // Verificar que apenas a coleção alterada foi afetada
        const updatedNfeConfig = configManager.getGroupingConfig('tbl_nfe_100');
        const unchangedCteConfig = configManager.getGroupingConfig('tbl_cte_100');
        
        expect(updatedNfeConfig.groupByFields).toEqual(['CHV_NFE']);
        expect(unchangedCteConfig.groupByFields).toEqual(cteFields);
      }
    ), { numRuns: 100 });
  });

  it('should handle concurrent access to cache efficiently', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
      fc.integer({ min: 3, max: 10 }), // Número de acessos concorrentes
      
      async (collectionName, groupByFields, concurrentAccess) => {
        // Feature: nfe-configurable-grouping, Property 10: Cache Eficiente de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        const startTime = 5000000;
        
        // Configurar ambiente
        process.env[`${collectionUpper}_GROUP_BY`] = groupByFields.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        dateNowSpy.mockReturnValue(startTime);
        
        // Simular acessos concorrentes
        const promises = Array.from({ length: concurrentAccess }, () =>
          Promise.resolve(configManager.getGroupingConfig(collectionName))
        );
        
        const results = await Promise.all(promises);
        
        // Todos os resultados devem ser idênticos
        for (let i = 1; i < results.length; i++) {
          expect(results[i]).toEqual(results[0]);
          expect(results[i].groupByFields).toEqual(groupByFields);
        }
        
        // Verificar consistência
        results.forEach(config => {
          expect(config.enabled).toBe(true);
          expect(config.collection).toBe(collectionName);
          expect(config.globalEnabled).toBe(true);
          expect(config.groupByFields).toEqual(groupByFields);
        });
      }
    ), { numRuns: 100 });
  });
});