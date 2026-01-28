// 1. Node.js built-ins
// (nenhum built-in necessário)

// 2. External libraries
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// 3. Internal packages (workspace)
import { NFE_GROUPING_DEFAULTS, NFE_GROUPING_ENV_VARS } from '@fiscal/shared/constants/nfe-grouping.constants';
import { GroupingConfigurationError } from '@fiscal/shared/errors/grouping-configuration-error.class';

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';

describe('GroupingConfigManager - Precedência de Configurações', () => {
  let configManager: GroupingConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original
    originalEnv = { ...process.env };
    
    // Limpar variáveis de ambiente relacionadas
    delete process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED];
    delete process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY];
    delete process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ORDER_BY];
    delete process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED];
    delete process.env[NFE_GROUPING_ENV_VARS.CACHE_TTL];
    
    // Obter nova instância
    configManager = GroupingConfigManager.getInstance();
    configManager.refreshConfig();
  });

  afterEach(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
  });

  describe('getGroupingConfig com precedência', () => {
    it('deve usar configuração padrão quando nenhuma variável está definida', () => {
      const config = configManager.getGroupingConfig('tbl_nfe_100');

      expect(config.enabled).toBe(true);
      expect(config.globalEnabled).toBe(true);
      expect(config.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
      expect(config.collection).toBe('tbl_nfe_100');
      expect(config.source).toBe('default');
    });

    it('deve aplicar configuração específica da coleção com precedência sobre global', () => {
      // Configurar global e específico
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CNPJ_EMIT,DT_DOC';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'true';

      const config = configManager.getGroupingConfig('tbl_nfe_100');

      // Específico deve ter precedência
      expect(config.enabled).toBe(true); // específico
      expect(config.globalEnabled).toBe(false); // global
      expect(config.groupByFields).toEqual(['CNPJ_EMIT', 'DT_DOC']); // específico
      expect(config.source).toBe('environment');
    });

    it('deve usar configuração global quando específica não está definida', () => {
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';

      const config = configManager.getGroupingConfig('tbl_nfe_100');

      expect(config.enabled).toBe(true); // padrão (específico não definido)
      expect(config.globalEnabled).toBe(false); // global
      expect(config.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]); // padrão
    });

    it('deve detectar mudanças de configuração em tempo de execução', () => {
      // Primeira configuração
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      const config1 = configManager.getGroupingConfig('tbl_nfe_100');
      expect(config1.groupByFields).toEqual(['CHV_NFE']);

      // Alterar configuração
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CNPJ_EMIT';
      
      // Detectar mudanças
      const changes = configManager.detectConfigurationChanges('tbl_nfe_100');
      expect(changes).not.toBeNull();
      expect(changes!.hasSignificantChanges).toBe(true);

      // Nova configuração deve refletir mudanças
      const config2 = configManager.getGroupingConfig('tbl_nfe_100');
      expect(config2.groupByFields).toEqual(['CNPJ_EMIT']);
    });

    it('deve invalidar cache quando mudanças significativas são detectadas', () => {
      // Configuração inicial
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      const config1 = configManager.getGroupingConfig('tbl_nfe_100');

      // Alterar configuração (mudança significativa)
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'false';
      
      // Cache deve ser invalidado automaticamente
      const config2 = configManager.getGroupingConfig('tbl_nfe_100');
      expect(config2.enabled).toBe(false);
    });

    it('deve manter cache quando não há mudanças', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      
      // Primeira chamada
      const config1 = configManager.getGroupingConfig('tbl_nfe_100');
      
      // Segunda chamada (deve usar cache)
      const config2 = configManager.getGroupingConfig('tbl_nfe_100');
      
      // Deve ser a mesma instância (cache hit)
      expect(config1).toBe(config2);
    });

    it('deve validar campos de agrupamento específicos da coleção', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'INVALID_FIELD';

      expect(() => {
        configManager.getGroupingConfig('tbl_nfe_100');
      }).toThrow(GroupingConfigurationError);
    });

    it('deve processar múltiplos campos de agrupamento corretamente', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE, CNPJ_EMIT , DT_DOC';

      const config = configManager.getGroupingConfig('tbl_nfe_100');

      expect(config.groupByFields).toEqual(['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC']);
      expect(config.enabled).toBe(true);
    });

    it('deve desabilitar agrupamento quando campos estão vazios', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = '';

      const config = configManager.getGroupingConfig('tbl_nfe_100');

      expect(config.enabled).toBe(false);
      expect(config.groupByFields).toEqual([]);
    });
  });

  describe('detectAllConfigurationChanges', () => {
    it('deve detectar mudanças em múltiplas coleções', () => {
      // Configurar múltiplas coleções
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      configManager.getGroupingConfig('tbl_nfe_100');
      configManager.getGroupingConfig('tbl_nfe_200'); // Coleção fictícia para teste

      // Alterar configuração global (afeta todas)
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';

      const allChanges = configManager.detectAllConfigurationChanges();
      expect(allChanges.size).toBeGreaterThan(0);
    });
  });

  describe('getConfigurationPrecedenceHistory', () => {
    it('deve retornar histórico de precedência', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';
      
      configManager.getGroupingConfig('tbl_nfe_100');
      
      const history = configManager.getConfigurationPrecedenceHistory();
      expect(history.size).toBe(1);
      
      const tblNfe100History = history.get('tbl_nfe_100');
      expect(tblNfe100History).toBeDefined();
      expect(tblNfe100History!.resolved.source).toBe('specific');
      expect(tblNfe100History!.resolved.appliedPrecedence.length).toBeGreaterThan(0);
    });
  });

  describe('refreshConfig com precedência', () => {
    it('deve detectar mudanças antes de limpar cache', () => {
      // Configuração inicial
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      configManager.getGroupingConfig('tbl_nfe_100');

      // Alterar configuração
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CNPJ_EMIT';

      // Refresh deve detectar mudanças
      configManager.refreshConfig();

      // Nova configuração deve refletir mudanças
      const config = configManager.getGroupingConfig('tbl_nfe_100');
      expect(config.groupByFields).toEqual(['CNPJ_EMIT']);
    });
  });

  describe('integração com OrderingConfig', () => {
    it('deve aplicar precedência também para configuração de ordenação', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ORDER_BY] = 'DT_DOC ASC, VALOR_TOTAL DESC';

      const orderingConfig = configManager.getOrderingConfig('tbl_nfe_100');

      expect(orderingConfig.enabled).toBe(true);
      expect(orderingConfig.fields).toEqual([
        { field: 'DT_DOC', direction: 'ASC' },
        { field: 'VALOR_TOTAL', direction: 'DESC' }
      ]);
      expect(orderingConfig.defaultOrdering).toBe('DT_DOC ASC, VALOR_TOTAL DESC');
    });
  });
});