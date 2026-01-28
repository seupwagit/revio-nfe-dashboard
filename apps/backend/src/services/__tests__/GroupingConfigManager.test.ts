// 1. Node.js built-ins
import { performance } from 'perf_hooks';

// 2. External libraries
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// 3. Internal packages (workspace)
import {
    NFE_GROUPING_DEFAULTS,
    NFE_GROUPING_ENV_VARS
} from '@fiscal/shared/constants/nfe-grouping.constants';
import { GroupingConfigurationError } from '@fiscal/shared/errors/grouping-configuration-error.class';

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';

describe('GroupingConfigManager', () => {
  let configManager: GroupingConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original
    originalEnv = { ...process.env };
    
    // Limpar variáveis de ambiente relacionadas
    Object.values(NFE_GROUPING_ENV_VARS).forEach(envVar => {
      delete process.env[envVar];
    });
    
    // Obter nova instância (limpar singleton para testes)
    (GroupingConfigManager as any).instance = undefined;
    configManager = GroupingConfigManager.getInstance();
  });

  afterEach(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
    
    // Limpar cache
    configManager.refreshConfig();
  });

  describe('getInstance', () => {
    it('deve retornar sempre a mesma instância (singleton)', () => {
      const instance1 = GroupingConfigManager.getInstance();
      const instance2 = GroupingConfigManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getGroupingConfig', () => {
    it('deve retornar configuração padrão quando variáveis não estão definidas', () => {
      const config = configManager.getGroupingConfig('tbl_nfe_100');
      
      expect(config).toEqual({
        enabled: true,
        groupByFields: [NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD],
        collection: 'tbl_nfe_100',
        globalEnabled: true,
        lastUpdated: expect.any(Number),
        source: 'default'
      });
    });

    it('deve carregar configuração do ambiente quando definida', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE,CNPJ_EMIT';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'true';
      
      const config = configManager.getGroupingConfig('tbl_nfe_100');
      
      expect(config.groupByFields).toEqual(['CHV_NFE', 'CNPJ_EMIT']);
      expect(config.enabled).toBe(true);
      expect(config.source).toBe('environment');
    });

    it('deve desabilitar agrupamento quando configuração está vazia', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = '';
      
      const config = configManager.getGroupingConfig('tbl_nfe_100');
      
      expect(config.enabled).toBe(false);
      expect(config.groupByFields).toEqual([]);
    });

    it('deve respeitar configuração global desabilitada', () => {
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'true';
      
      const config = configManager.getGroupingConfig('tbl_nfe_100');
      
      expect(config.globalEnabled).toBe(false);
    });

    it('deve usar cache na segunda chamada', () => {
      const startTime = performance.now();
      
      // Primeira chamada
      const config1 = configManager.getGroupingConfig('tbl_nfe_100');
      const firstCallTime = performance.now() - startTime;
      
      // Segunda chamada (deve usar cache)
      const secondStartTime = performance.now();
      const config2 = configManager.getGroupingConfig('tbl_nfe_100');
      const secondCallTime = performance.now() - secondStartTime;
      
      expect(config1).toEqual(config2);
      expect(secondCallTime).toBeLessThan(firstCallTime);
    });

    it('deve lançar erro para campos de agrupamento inválidos', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CAMPO_INVALIDO';
      
      expect(() => {
        configManager.getGroupingConfig('tbl_nfe_100');
      }).toThrow(GroupingConfigurationError);
    });

    it('deve lançar erro para coleção não suportada', () => {
      expect(() => {
        configManager.getGroupingConfig('colecao_inexistente');
      }).toThrow(GroupingConfigurationError);
    });

    it('deve filtrar campos vazios da configuração', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE, , CNPJ_EMIT,  ';
      
      const config = configManager.getGroupingConfig('tbl_nfe_100');
      
      expect(config.groupByFields).toEqual(['CHV_NFE', 'CNPJ_EMIT']);
    });
  });

  describe('getOrderingConfig', () => {
    it('deve retornar configuração de ordenação padrão', () => {
      const config = configManager.getOrderingConfig('tbl_nfe_100');
      
      expect(config.defaultOrdering).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
      expect(config.enabled).toBe(true);
      expect(config.fields).toEqual([
        { field: 'DT_DOC', direction: 'DESC' },
        { field: 'PROTOCOLADA', direction: 'DESC' }
      ]);
    });

    it('deve carregar configuração de ordenação do ambiente', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ORDER_BY] = 'CHV_NFE ASC, VALOR_TOTAL DESC';
      
      const config = configManager.getOrderingConfig('tbl_nfe_100');
      
      expect(config.fields).toEqual([
        { field: 'CHV_NFE', direction: 'ASC' },
        { field: 'VALOR_TOTAL', direction: 'DESC' }
      ]);
    });

    it('deve usar configuração padrão para campos inválidos', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ORDER_BY] = 'CAMPO_INVALIDO ASC';
      
      const config = configManager.getOrderingConfig('tbl_nfe_100');
      
      // Deve usar configuração padrão quando há erro
      expect(config.defaultOrdering).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
      expect(config.fields).toEqual([
        { field: 'DT_DOC', direction: 'DESC' },
        { field: 'PROTOCOLADA', direction: 'DESC' }
      ]);
    });

    it('deve usar DESC como direção padrão quando não especificada', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ORDER_BY] = 'DT_DOC, PROTOCOLADA ASC';
      
      const config = configManager.getOrderingConfig('tbl_nfe_100');
      
      expect(config.fields).toEqual([
        { field: 'DT_DOC', direction: 'DESC' },
        { field: 'PROTOCOLADA', direction: 'ASC' }
      ]);
    });
  });

  describe('isGloballyEnabled', () => {
    it('deve retornar true por padrão', () => {
      expect(configManager.isGloballyEnabled()).toBe(true);
    });

    it('deve retornar false quando explicitamente desabilitado', () => {
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';
      
      expect(configManager.isGloballyEnabled()).toBe(false);
    });

    it('deve retornar false quando definido como "0"', () => {
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = '0';
      
      expect(configManager.isGloballyEnabled()).toBe(false);
    });

    it('deve retornar true para outros valores', () => {
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'true';
      expect(configManager.isGloballyEnabled()).toBe(true);
      
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = '1';
      expect(configManager.isGloballyEnabled()).toBe(true);
      
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'yes';
      expect(configManager.isGloballyEnabled()).toBe(true);
    });
  });

  describe('validateGroupingFields', () => {
    it('deve validar campos corretos para tbl_nfe_100', () => {
      const validFields = ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'];
      
      expect(configManager.validateGroupingFields(validFields, 'tbl_nfe_100')).toBe(true);
    });

    it('deve rejeitar campos inválidos', () => {
      const invalidFields = ['CHV_NFE', 'CAMPO_INEXISTENTE'];
      
      expect(configManager.validateGroupingFields(invalidFields, 'tbl_nfe_100')).toBe(false);
    });

    it('deve retornar false para coleção não suportada', () => {
      const fields = ['CHV_NFE'];
      
      expect(configManager.validateGroupingFields(fields, 'colecao_inexistente')).toBe(false);
    });
  });

  describe('refreshConfig', () => {
    it('deve limpar cache e forçar recarregamento', () => {
      // Carregar configuração inicial
      const config1 = configManager.getGroupingConfig('tbl_nfe_100');
      
      // Alterar ambiente
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CNPJ_EMIT';
      
      // Sem refresh, deve usar cache
      const config2 = configManager.getGroupingConfig('tbl_nfe_100');
      expect(config2.groupByFields).toEqual(config1.groupByFields);
      
      // Com refresh, deve carregar nova configuração
      configManager.refreshConfig();
      const config3 = configManager.getGroupingConfig('tbl_nfe_100');
      expect(config3.groupByFields).toEqual(['CNPJ_EMIT']);
    });
  });

  describe('getCacheStats', () => {
    it('deve retornar estatísticas do cache', () => {
      // Carregar algumas configurações
      configManager.getGroupingConfig('tbl_nfe_100');
      configManager.getOrderingConfig('tbl_nfe_100');
      
      const stats = configManager.getCacheStats();
      
      expect(stats).toEqual({
        configCache: {
          size: 1,
          entries: expect.arrayContaining([
            expect.objectContaining({
              key: 'grouping_tbl_nfe_100',
              accessCount: expect.any(Number),
              age: expect.any(Number)
            })
          ])
        },
        orderingCache: {
          size: 1,
          entries: expect.arrayContaining([
            expect.objectContaining({
              key: 'ordering_tbl_nfe_100',
              accessCount: expect.any(Number),
              age: expect.any(Number)
            })
          ])
        },
        ttl: expect.any(Number)
      });
    });

    it('deve rastrear contadores de acesso', () => {
      // Acessar configuração múltiplas vezes
      configManager.getGroupingConfig('tbl_nfe_100');
      configManager.getGroupingConfig('tbl_nfe_100');
      configManager.getGroupingConfig('tbl_nfe_100');
      
      const stats = configManager.getCacheStats();
      const configEntry = stats.configCache.entries.find(e => e.key === 'grouping_tbl_nfe_100');
      
      expect(configEntry?.accessCount).toBe(3);
    });
  });

  describe('configuração de TTL do cache', () => {
    it('deve usar TTL do ambiente quando definido', () => {
      process.env[NFE_GROUPING_ENV_VARS.CACHE_TTL] = '30000';
      
      // Criar nova instância para pegar novo TTL
      (GroupingConfigManager as any).instance = undefined;
      const newManager = GroupingConfigManager.getInstance();
      
      const stats = newManager.getCacheStats();
      expect(stats.ttl).toBe(30000);
    });

    it('deve usar TTL padrão quando não definido', () => {
      const stats = configManager.getCacheStats();
      expect(stats.ttl).toBe(NFE_GROUPING_DEFAULTS.CONFIG_CACHE_TTL_MS);
    });
  });

  describe('tratamento de erros', () => {
    it('deve lançar erro específico para configuração inválida', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CAMPO_INVALIDO,OUTRO_INVALIDO';
      
      expect(() => {
        configManager.getGroupingConfig('tbl_nfe_100');
      }).toThrow(GroupingConfigurationError);
    });

    it('deve incluir detalhes do erro na mensagem', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CAMPO_INVALIDO';
      
      try {
        configManager.getGroupingConfig('tbl_nfe_100');
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(GroupingConfigurationError);
        expect((error as Error).message).toContain('tbl_nfe_100');
        expect((error as Error).message).toContain('CAMPO_INVALIDO');
      }
    });
  });

  describe('performance', () => {
    it('deve ter performance adequada para carregamento inicial', () => {
      const startTime = performance.now();
      
      configManager.getGroupingConfig('tbl_nfe_100');
      
      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(50); // Menos de 50ms
    });

    it('deve ter performance excelente para acesso via cache', () => {
      // Carregar configuração inicial
      configManager.getGroupingConfig('tbl_nfe_100');
      
      // Medir acesso via cache
      const startTime = performance.now();
      configManager.getGroupingConfig('tbl_nfe_100');
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(5); // Menos de 5ms
    });
  });
});