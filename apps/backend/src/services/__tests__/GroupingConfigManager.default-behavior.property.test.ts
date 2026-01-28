/**
 * Testes de propriedade para GroupingConfigManager - Comportamento Padrão com Configurações Ausentes
 * 
 * **Valida: Requisitos 1.3, 3.2**
 * 
 * **Feature: nfe-configurable-grouping, Property 3: Comportamento Padrão com Configurações Ausentes**
 */

// 1. Node.js built-ins

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)
import { NFE_GROUPING_DEFAULTS } from '@fiscal/shared/constants/nfe-grouping.constants';

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';

describe('GroupingConfigManager - Propriedade: Comportamento Padrão com Configurações Ausentes', () => {
  let configManager: GroupingConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original completo
    originalEnv = { ...process.env };
    
    // Limpar TODAS as variáveis de ambiente relacionadas ao agrupamento
    const envKeysToDelete = Object.keys(process.env).filter(key => 
      key.includes('NFE_GROUPING') || 
      key.includes('TBL_NFE_100') ||
      key.includes('GROUP_BY') ||
      key.includes('GROUPING_ENABLED')
    );
    
    envKeysToDelete.forEach(key => {
      delete process.env[key];
    });
    
    // Criar nova instância do manager para cada teste
    configManager = new GroupingConfigManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpar cache do manager antes de restaurar ambiente
    configManager.refreshConfig();
    
    // Restaurar ambiente original completamente
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // ========== GERADORES FAST-CHECK OTIMIZADOS ==========

  // Gerador de nomes de coleções válidas
  const collectionNameGenerator = fc.constantFrom('tbl_nfe_100', 'tbl_cte_100', 'tbl_cfe_100');
  
  // Gerador de estados de configuração global (undefined, true, false)
  const globalStateGenerator = fc.constantFrom(undefined, 'true', 'false');
  
  // Gerador de configurações específicas ausentes/inválidas
  const missingConfigGenerator = fc.constantFrom(undefined, '', '   ', 'invalid_field');

  // ========== TESTES DE PROPRIEDADE ==========

  describe('Propriedade 3: Comportamento Padrão com Configurações Ausentes', () => {
    it('deve usar configuração padrão quando variáveis específicas estão ausentes', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          globalStateGenerator,
          (collection, globalState) => {
            // Arrange - Garantir ambiente limpo
            const envKeysToDelete = Object.keys(process.env).filter(key => 
              key.includes('NFE_GROUPING') || 
              key.includes('TBL_NFE_100') ||
              key.includes('GROUP_BY') ||
              key.includes('GROUPING_ENABLED')
            );
            
            envKeysToDelete.forEach(key => {
              delete process.env[key];
            });

            // Configurar apenas estado global se definido
            if (globalState !== undefined) {
              process.env.NFE_GROUPING_ENABLED = globalState;
            }

            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig(collection);

            // Assert - Deve usar configuração padrão
            expect(config.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
            expect(config.collection).toBe(collection);
            
            // Global enabled deve refletir o estado configurado ou padrão
            const expectedGlobalEnabled = globalState === 'false' ? false : true;
            expect(config.globalEnabled).toBe(expectedGlobalEnabled);
            
            // Enabled local deve ser true quando há campos válidos
            expect(config.enabled).toBe(true);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('deve manter comportamento consistente com configurações inválidas', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          missingConfigGenerator,
          (collection, invalidConfig) => {
            // Arrange - Garantir ambiente limpo
            const envKeysToDelete = Object.keys(process.env).filter(key => 
              key.includes('NFE_GROUPING') || 
              key.includes('TBL_NFE_100') ||
              key.includes('GROUP_BY') ||
              key.includes('GROUPING_ENABLED')
            );
            
            envKeysToDelete.forEach(key => {
              delete process.env[key];
            });

            // Configurar variável inválida se definida
            if (invalidConfig !== undefined) {
              const collectionUpper = collection.toUpperCase();
              process.env[`${collectionUpper}_GROUP_BY`] = invalidConfig;
            }
            
            process.env.NFE_GROUPING_ENABLED = 'true';

            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig(collection);

            // Assert - Comportamento deve ser previsível
            if (invalidConfig === undefined || invalidConfig.trim() === '') {
              // Configuração ausente ou vazia -> usar padrão
              expect(config.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
              expect(config.enabled).toBe(true);
            } else if (invalidConfig === 'invalid_field') {
              // Campo inválido -> ainda deve processar mas pode gerar warnings
              expect(config.groupByFields).toEqual(['invalid_field']);
              expect(config.enabled).toBe(true);
            }
            
            // Para configurações que resultam em arrays vazios, enabled deve ser false
            if (config.groupByFields.length === 0) {
              expect(config.enabled).toBe(false);
            }
            
            expect(config.globalEnabled).toBe(true);
            expect(config.collection).toBe(collection);
          }
        ),
        { numRuns: 12 }
      );
    });

    it('deve aplicar configuração padrão de ordenação quando ausente', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          (collection) => {
            // Arrange - Garantir ambiente limpo
            const envKeysToDelete = Object.keys(process.env).filter(key => 
              key.includes('NFE_GROUPING') || 
              key.includes('TBL_NFE_100') ||
              key.includes('ORDER_BY') ||
              key.includes('GROUPING_ENABLED')
            );
            
            envKeysToDelete.forEach(key => {
              delete process.env[key];
            });

            process.env.NFE_GROUPING_ENABLED = 'true';

            const testConfigManager = new GroupingConfigManager();

            // Act
            const orderingConfig = testConfigManager.getOrderingConfig(collection);

            // Assert - Deve usar configuração padrão de ordenação
            expect(orderingConfig.defaultOrdering).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
            expect(orderingConfig.enabled).toBe(true);
            expect(orderingConfig.fields.length).toBeGreaterThan(0);
            
            // Verificar que campos padrão foram parseados corretamente
            const expectedFields = NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY.split(',').length;
            expect(orderingConfig.fields.length).toBe(expectedFields);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve desabilitar funcionalidade quando globalmente desabilitada', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          (collection) => {
            // Arrange - Garantir ambiente limpo
            const envKeysToDelete = Object.keys(process.env).filter(key => 
              key.includes('NFE_GROUPING') || 
              key.includes('TBL_NFE_100') ||
              key.includes('GROUP_BY') ||
              key.includes('GROUPING_ENABLED')
            );
            
            envKeysToDelete.forEach(key => {
              delete process.env[key];
            });

            // Desabilitar globalmente
            process.env.NFE_GROUPING_ENABLED = 'false';

            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig(collection);

            // Assert - Global deve estar desabilitado
            expect(config.globalEnabled).toBe(false);
            
            // Configuração local ainda deve ter valores padrão
            expect(config.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
            expect(config.enabled).toBe(true); // Local enabled independe do global
            expect(config.collection).toBe(collection);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve manter cache consistente com configurações padrão', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          (collection) => {
            // Arrange - Garantir ambiente limpo
            const envKeysToDelete = Object.keys(process.env).filter(key => 
              key.includes('NFE_GROUPING') || 
              key.includes('TBL_NFE_100') ||
              key.includes('GROUP_BY') ||
              key.includes('GROUPING_ENABLED')
            );
            
            envKeysToDelete.forEach(key => {
              delete process.env[key];
            });

            process.env.NFE_GROUPING_ENABLED = 'true';

            const testConfigManager = new GroupingConfigManager();

            // Act - Múltiplas consultas para testar cache
            const config1 = testConfigManager.getGroupingConfig(collection);
            const config2 = testConfigManager.getGroupingConfig(collection);
            const config3 = testConfigManager.getGroupingConfig(collection);

            // Assert - Todas as configurações devem ser idênticas (cache funcionando)
            expect(config1.groupByFields).toEqual(config2.groupByFields);
            expect(config2.groupByFields).toEqual(config3.groupByFields);
            
            expect(config1.enabled).toBe(config2.enabled);
            expect(config2.enabled).toBe(config3.enabled);
            
            expect(config1.globalEnabled).toBe(config2.globalEnabled);
            expect(config2.globalEnabled).toBe(config3.globalEnabled);
            
            // Todas devem usar configuração padrão
            expect(config1.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
            expect(config1.enabled).toBe(true);
            expect(config1.globalEnabled).toBe(true);
          }
        ),
        { numRuns: 8 }
      );
    });

    it('deve detectar mudanças de configuração global dinamicamente', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          globalStateGenerator,
          globalStateGenerator,
          (collection, initialGlobalState, newGlobalState) => {
            // Arrange - Garantir ambiente limpo
            const envKeysToDelete = Object.keys(process.env).filter(key => 
              key.includes('NFE_GROUPING') || 
              key.includes('TBL_NFE_100') ||
              key.includes('GROUP_BY') ||
              key.includes('GROUPING_ENABLED')
            );
            
            envKeysToDelete.forEach(key => {
              delete process.env[key];
            });

            // Configuração inicial
            if (initialGlobalState !== undefined) {
              process.env.NFE_GROUPING_ENABLED = initialGlobalState;
            }

            const testConfigManager = new GroupingConfigManager();

            // Act - Primeira consulta
            const initialConfig = testConfigManager.getGroupingConfig(collection);

            // Arrange - Alterar configuração global
            if (newGlobalState !== undefined) {
              process.env.NFE_GROUPING_ENABLED = newGlobalState;
            } else {
              delete process.env.NFE_GROUPING_ENABLED;
            }
            
            testConfigManager.refreshConfig();

            // Act - Segunda consulta
            const newConfig = testConfigManager.getGroupingConfig(collection);

            // Assert - Configuração global deve ter mudado
            const expectedInitialGlobal = initialGlobalState === 'false' ? false : true;
            const expectedNewGlobal = newGlobalState === 'false' ? false : true;
            
            expect(initialConfig.globalEnabled).toBe(expectedInitialGlobal);
            expect(newConfig.globalEnabled).toBe(expectedNewGlobal);
            
            // Configurações locais devem permanecer padrão
            expect(initialConfig.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
            expect(newConfig.groupByFields).toEqual([NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD]);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve validar que configuração padrão é sempre válida', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          (collection) => {
            // Arrange - Garantir ambiente completamente limpo
            const envKeysToDelete = Object.keys(process.env).filter(key => 
              key.includes('NFE_GROUPING') || 
              key.includes('TBL_NFE_100') ||
              key.includes('GROUP_BY') ||
              key.includes('GROUPING_ENABLED')
            );
            
            envKeysToDelete.forEach(key => {
              delete process.env[key];
            });

            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig(collection);

            // Assert - Configuração padrão deve sempre ser válida
            expect(config.groupByFields).toBeDefined();
            expect(config.groupByFields.length).toBeGreaterThan(0);
            expect(config.groupByFields[0]).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_GROUP_BY_FIELD);
            
            // Campos não devem estar vazios
            config.groupByFields.forEach(field => {
              expect(field).toBeDefined();
              expect(field.length).toBeGreaterThan(0);
              expect(field.trim()).toBe(field);
            });
            
            // Configuração deve estar habilitada por padrão
            expect(config.enabled).toBe(true);
            expect(config.collection).toBe(collection);
            
            // Source deve indicar que é padrão
            expect(config.source).toBe('default');
          }
        ),
        { numRuns: 12 }
      );
    });
  });
});