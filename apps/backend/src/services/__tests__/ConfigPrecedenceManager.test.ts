// 1. Node.js built-ins
// (nenhum built-in necessário)

// 2. External libraries
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// 3. Internal packages (workspace)
import { NFE_GROUPING_DEFAULTS, NFE_GROUPING_ENV_VARS } from '@fiscal/shared/constants/nfe-grouping.constants';

// 4. Relative imports
import { ConfigPrecedenceManager } from '../ConfigPrecedenceManager';

describe('ConfigPrecedenceManager', () => {
  let precedenceManager: ConfigPrecedenceManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original
    originalEnv = { ...process.env };
    
    // Limpar variáveis de ambiente relacionadas
    delete process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED];
    delete process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY];
    delete process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ORDER_BY];
    delete process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED];
    
    // Obter nova instância
    precedenceManager = ConfigPrecedenceManager.getInstance();
    precedenceManager.clearConfigurationHistory();
  });

  afterEach(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
  });

  describe('resolveConfigurationPrecedence', () => {
    it('deve usar configuração padrão quando nenhuma variável de ambiente está definida', () => {
      const result = precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');

      expect(result.collection).toBe('tbl_nfe_100');
      expect(result.specific).toBeUndefined();
      expect(result.global).toBeUndefined();
      expect(result.default).toEqual({
        groupBy: NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD,
        orderBy: NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY,
        enabled: true,
        source: 'default',
        priority: 3
      });
      expect(result.resolved.source).toBe('default');
      expect(result.resolved.groupBy).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD);
      expect(result.resolved.orderBy).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
    });

    it('deve usar configuração global quando definida', () => {
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';

      const result = precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');

      expect(result.global).toEqual({
        enabled: false,
        source: 'environment',
        priority: 2
      });
      expect(result.resolved.globalEnabled).toBe(false);
      expect(result.resolved.appliedPrecedence).toContainEqual({
        level: 'global',
        field: 'globalEnabled',
        value: false,
        source: 'environment'
      });
    });

    it('deve usar configuração específica da coleção quando definida', () => {
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CNPJ_EMIT,DT_DOC';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ORDER_BY] = 'DT_DOC ASC';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'true';

      const result = precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');

      expect(result.specific).toEqual({
        groupBy: 'CNPJ_EMIT,DT_DOC',
        orderBy: 'DT_DOC ASC',
        enabled: true,
        source: 'environment',
        priority: 1
      });
      expect(result.resolved.source).toBe('specific');
      expect(result.resolved.groupBy).toBe('CNPJ_EMIT,DT_DOC');
      expect(result.resolved.orderBy).toBe('DT_DOC ASC');
      expect(result.resolved.enabled).toBe(true);
    });

    it('deve aplicar precedência correta: específico > global > padrão', () => {
      // Configurar todas as camadas
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'true';

      const result = precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');

      // Específico deve ter precedência para groupBy e enabled
      expect(result.resolved.groupBy).toBe('CHV_NFE'); // específico
      expect(result.resolved.enabled).toBe(true); // específico
      expect(result.resolved.globalEnabled).toBe(false); // global
      expect(result.resolved.orderBy).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY); // padrão

      // Verificar precedência aplicada
      const appliedPrecedence = result.resolved.appliedPrecedence;
      expect(appliedPrecedence).toContainEqual({
        level: 'specific',
        field: 'groupBy',
        value: 'CHV_NFE',
        source: 'environment'
      });
      expect(appliedPrecedence).toContainEqual({
        level: 'specific',
        field: 'enabled',
        value: true,
        source: 'environment'
      });
      expect(appliedPrecedence).toContainEqual({
        level: 'global',
        field: 'globalEnabled',
        value: false,
        source: 'environment'
      });
    });

    it('deve tratar valores falsy corretamente', () => {
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = '0';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'false';

      const result = precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');

      expect(result.global?.enabled).toBe(false);
      expect(result.specific?.enabled).toBe(false);
      expect(result.resolved.enabled).toBe(false);
      expect(result.resolved.globalEnabled).toBe(false);
    });
  });

  describe('detectRuntimeConfigurationChanges', () => {
    it('deve retornar null quando não há configuração anterior', () => {
      const changes = precedenceManager.detectRuntimeConfigurationChanges('tbl_nfe_100');
      expect(changes).toBeNull();
    });

    it('deve detectar mudanças em configuração existente', () => {
      // Primeira configuração - definir enabled explicitamente
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'true';
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');

      // Alterar configuração
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CNPJ_EMIT';
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'false';

      const changes = precedenceManager.detectRuntimeConfigurationChanges('tbl_nfe_100');

      expect(changes).not.toBeNull();
      expect(changes!.hasSignificantChanges).toBe(true);
      expect(changes!.changes).toHaveLength(2);
      
      // Verificar mudança em groupBy
      expect(changes!.changes).toContainEqual({
        field: 'groupBy',
        previousValue: 'CHV_NFE',
        currentValue: 'CNPJ_EMIT',
        changeType: 'modified',
        impact: 'high'
      });
      
      // Verificar mudança em enabled
      expect(changes!.changes).toContainEqual({
        field: 'enabled',
        previousValue: true,
        currentValue: false,
        changeType: 'modified',
        impact: 'high'
      });
    });

    it('deve recomendar ações apropriadas para mudanças significativas', () => {
      // Primeira configuração
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'true';
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');

      // Desabilitar agrupamento
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_ENABLED] = 'false';

      const changes = precedenceManager.detectRuntimeConfigurationChanges('tbl_nfe_100');

      expect(changes!.recommendedActions).toContainEqual({
        action: 'refresh_cache',
        priority: 'high',
        reason: 'Mudanças significativas detectadas na configuração'
      });
      
      expect(changes!.recommendedActions).toContainEqual({
        action: 'log_change',
        priority: 'medium',
        reason: 'Registrar mudanças para auditoria'
      });
    });
  });

  describe('checkAllCollectionsForChanges', () => {
    it('deve detectar mudanças em múltiplas coleções', () => {
      // Configurar múltiplas coleções
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CHV_NFE';
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_200');

      // Alterar configurações
      process.env[NFE_GROUPING_ENV_VARS.TBL_NFE_100_GROUP_BY] = 'CNPJ_EMIT';
      process.env[NFE_GROUPING_ENV_VARS.GLOBAL_ENABLED] = 'false';

      const allChanges = precedenceManager.checkAllCollectionsForChanges();

      expect(allChanges.size).toBeGreaterThan(0);
      
      // Verificar se mudanças foram detectadas para tbl_nfe_100
      const tblNfe100Changes = allChanges.get('tbl_nfe_100');
      expect(tblNfe100Changes).toBeDefined();
      expect(tblNfe100Changes!.hasSignificantChanges).toBe(true);
    });

    it('deve retornar mapa vazio quando não há mudanças', () => {
      // Configurar sem mudanças
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');
      
      const allChanges = precedenceManager.checkAllCollectionsForChanges();
      expect(allChanges.size).toBe(0);
    });
  });

  describe('getConfigurationHistory', () => {
    it('deve retornar histórico de configurações', () => {
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_200');

      const history = precedenceManager.getConfigurationHistory();
      
      expect(history.size).toBe(2);
      expect(history.has('tbl_nfe_100')).toBe(true);
      expect(history.has('tbl_nfe_200')).toBe(true);
    });
  });

  describe('clearConfigurationHistory', () => {
    it('deve limpar histórico de configurações', () => {
      precedenceManager.resolveConfigurationPrecedence('tbl_nfe_100');
      expect(precedenceManager.getConfigurationHistory().size).toBe(1);

      precedenceManager.clearConfigurationHistory();
      expect(precedenceManager.getConfigurationHistory().size).toBe(0);
    });
  });
});