/**
 * Testes de propriedade para GroupingConfigManager - Aplicação Correta de Configurações de Agrupamento
 * 
 * **Valida: Requisitos 1.1, 1.4, 1.5**
 * 
 * **Feature: nfe-configurable-grouping, Property 2: Aplicação Correta de Configurações de Agrupamento**
 */

// 1. Node.js built-ins

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)

// 4. Relative imports
import { GroupingConfigManager } from '../GroupingConfigManager';

describe('GroupingConfigManager - Propriedade: Aplicação Correta de Configurações de Agrupamento', () => {
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

  // Gerador de campos válidos para agrupamento (apenas tbl_nfe_100)
  const validGroupingFields = ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA'];
  const groupingFieldGenerator = fc.constantFrom(...validGroupingFields);
  
  // Gerador de combinações de campos (1-2 campos para simplicidade)
  const groupingFieldsArrayGenerator = fc.array(groupingFieldGenerator, { 
    minLength: 1, 
    maxLength: 2 
  }).map(fields => [...new Set(fields)]); // Remove duplicatas

  // Gerador de valores booleanos para configurações
  const booleanStringGenerator = fc.constantFrom('true', 'false');

  // ========== TESTES DE PROPRIEDADE ==========

  describe('Propriedade 2: Aplicação Correta de Configurações de Agrupamento', () => {
    it('deve aplicar configurações de agrupamento especificadas em variáveis de ambiente', () => {
      fc.assert(
        fc.property(
          groupingFieldsArrayGenerator,
          (groupByFields) => {
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
            
            // Configurar variáveis de ambiente específicas para este teste
            process.env.TBL_NFE_100_GROUP_BY = groupByFields.join(',');
            process.env.TBL_NFE_100_GROUPING_ENABLED = 'true';
            process.env.NFE_GROUPING_ENABLED = 'true';

            // Criar nova instância para garantir configuração limpa
            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Assert
            expect(config.groupByFields).toEqual(groupByFields);
            expect(config.enabled).toBe(true);
            expect(config.globalEnabled).toBe(true);
            expect(config.collection).toBe('tbl_nfe_100');
          }
        ),
        { numRuns: 15 }
      );
    });

    it('deve refletir mudanças de configuração em consultas subsequentes', () => {
      fc.assert(
        fc.property(
          groupingFieldsArrayGenerator,
          groupingFieldsArrayGenerator,
          (initialFields, newFields) => {
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
            process.env.TBL_NFE_100_GROUP_BY = initialFields.join(',');
            process.env.NFE_GROUPING_ENABLED = 'true';

            const testConfigManager = new GroupingConfigManager();

            // Act - Primeira consulta
            const initialConfig = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Arrange - Alterar configuração
            process.env.TBL_NFE_100_GROUP_BY = newFields.join(',');
            testConfigManager.refreshConfig();

            // Act - Segunda consulta
            const newConfig = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Assert - Configuração deve ter mudado
            expect(initialConfig.groupByFields).toEqual(initialFields);
            expect(newConfig.groupByFields).toEqual(newFields);
            
            // Se os campos são diferentes, as configurações devem ser diferentes
            if (JSON.stringify(initialFields.sort()) !== JSON.stringify(newFields.sort())) {
              expect(newConfig.groupByFields).not.toEqual(initialConfig.groupByFields);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve processar múltiplas chaves separadas por vírgula corretamente', () => {
      fc.assert(
        fc.property(
          groupingFieldsArrayGenerator,
          (fields) => {
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
            
            // Criar string com vírgulas e espaços extras
            const configString = fields.map(field => ` ${field} `).join(' , ');
            process.env.TBL_NFE_100_GROUP_BY = configString;
            process.env.NFE_GROUPING_ENABLED = 'true';

            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Assert - Campos devem ser parseados corretamente (sem espaços)
            expect(config.groupByFields).toEqual(fields);
            expect(config.enabled).toBe(true);
            
            // Assert - Não deve haver campos vazios
            config.groupByFields.forEach(field => {
              expect(field.trim()).toBe(field);
              expect(field.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve respeitar controle global de funcionalidade', () => {
      fc.assert(
        fc.property(
          groupingFieldsArrayGenerator,
          booleanStringGenerator,
          (groupByFields, globalEnabledValue) => {
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
            
            process.env.TBL_NFE_100_GROUP_BY = groupByFields.join(',');
            process.env.TBL_NFE_100_GROUPING_ENABLED = 'true';
            process.env.NFE_GROUPING_ENABLED = globalEnabledValue;

            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Assert - Global enabled deve ser interpretado corretamente
            const expectedGlobalEnabled = globalEnabledValue === 'true';
            expect(config.globalEnabled).toBe(expectedGlobalEnabled);
            
            // Assert - Configuração local deve estar sempre correta
            expect(config.groupByFields).toEqual(groupByFields);
            expect(config.enabled).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve usar configuração padrão quando variável não estiver definida', () => {
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

      // Configurar apenas global enabled
      process.env.NFE_GROUPING_ENABLED = 'true';

      const testConfigManager = new GroupingConfigManager();

      // Act
      const config = testConfigManager.getGroupingConfig('tbl_nfe_100');

      // Assert - Deve usar configuração padrão
      expect(config.groupByFields).toEqual(['CHV_NFE']); // Padrão definido no design
      expect(config.enabled).toBe(true);
      expect(config.globalEnabled).toBe(true);
      expect(config.collection).toBe('tbl_nfe_100');
    });

    it('deve desabilitar agrupamento quando configuração local estiver desabilitada', () => {
      fc.assert(
        fc.property(
          groupingFieldsArrayGenerator,
          booleanStringGenerator,
          (groupByFields, localEnabledValue) => {
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
            
            process.env.TBL_NFE_100_GROUP_BY = groupByFields.join(',');
            process.env.TBL_NFE_100_GROUPING_ENABLED = localEnabledValue;
            process.env.NFE_GROUPING_ENABLED = 'true';

            const testConfigManager = new GroupingConfigManager();

            // Act
            const config = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Assert
            const expectedLocalEnabled = localEnabledValue === 'true';
            expect(config.enabled).toBe(expectedLocalEnabled && groupByFields.length > 0);
            expect(config.globalEnabled).toBe(true);
            expect(config.groupByFields).toEqual(groupByFields);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve manter cache de configuração e invalidar quando necessário', () => {
      fc.assert(
        fc.property(
          groupingFieldsArrayGenerator,
          (initialFields) => {
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
            process.env.TBL_NFE_100_GROUP_BY = initialFields.join(',');
            process.env.NFE_GROUPING_ENABLED = 'true';

            const testConfigManager = new GroupingConfigManager();

            // Act - Primeira consulta (deve carregar do ambiente)
            const config1 = testConfigManager.getGroupingConfig('tbl_nfe_100');
            
            // Act - Segunda consulta imediata (deve usar cache)
            const config2 = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Assert - Configurações devem ser idênticas (cache funcionando)
            expect(config1.groupByFields).toEqual(config2.groupByFields);
            expect(config1.enabled).toBe(config2.enabled);
            expect(config1.globalEnabled).toBe(config2.globalEnabled);

            // Act - Forçar refresh do cache
            testConfigManager.refreshConfig();
            const config3 = testConfigManager.getGroupingConfig('tbl_nfe_100');

            // Assert - Configuração deve ser recarregada mas idêntica
            expect(config3.groupByFields).toEqual(initialFields);
            expect(config3.enabled).toBe(config1.enabled);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});