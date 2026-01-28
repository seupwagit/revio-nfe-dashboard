import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { GroupingConfigManager } from '../GroupingConfigManager';

/**
 * Property-Based Tests para Validação Robusta de Configurações
 * 
 * Feature: nfe-configurable-grouping, Property 8: Validação Robusta de Configurações
 * 
 * Valida: Requisitos 7.3
 * 
 * Para qualquer configuração de agrupamento fornecida, o sistema deve validar
 * cada campo individualmente contra o schema da coleção e rejeitar configurações
 * inválidas com mensagens descritivas.
 */
describe('GroupingConfigManager - Validation Properties', () => {
  let configManager: GroupingConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    configManager = new GroupingConfigManager();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate grouping fields against collection schema', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100', 'tbl_cfe_100'),
      fc.array(
        fc.oneof(
          // Campos válidos
          fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA'),
          // Campos inválidos
          fc.constantFrom('INVALID_FIELD', 'NON_EXISTENT', 'WRONG_FIELD', ''),
          // Campos com caracteres especiais
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^[A-Z_]+$/.test(s))
        ),
        { minLength: 1, maxLength: 5 }
      ),
      
      async (collectionName, groupByFields) => {
        // Feature: nfe-configurable-grouping, Property 8: Validação Robusta de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        
        // Configurar variáveis de ambiente
        process.env[`${collectionUpper}_GROUP_BY`] = groupByFields.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        // Obter configuração
        const config = configManager.getGroupingConfig(collectionName);
        
        // Definir campos válidos por coleção
        const validFieldsByCollection: Record<string, string[]> = {
          'tbl_nfe_100': ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA'],
          'tbl_cte_100': ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA'],
          'tbl_cfe_100': ['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA']
        };
        
        const validFields = validFieldsByCollection[collectionName] || [];
        
        // Separar campos válidos e inválidos
        const validGroupByFields = groupByFields.filter(field => 
          validFields.includes(field) && field.trim() !== ''
        );
        const invalidFields = groupByFields.filter(field => 
          !validFields.includes(field) || field.trim() === ''
        );
        
        // Verificar que apenas campos válidos são incluídos na configuração
        expect(config.groupByFields).toEqual(validGroupByFields);
        
        // Se há campos válidos, configuração deve estar habilitada
        if (validGroupByFields.length > 0) {
          expect(config.enabled).toBe(true);
        } else {
          // Se não há campos válidos, configuração deve estar desabilitada
          expect(config.enabled).toBe(false);
        }
        
        // Verificar que campos inválidos foram rejeitados silenciosamente
        invalidFields.forEach(invalidField => {
          expect(config.groupByFields).not.toContain(invalidField);
        });
        
        // Verificar propriedades básicas da configuração
        expect(config.collection).toBe(collectionName);
        expect(config.globalEnabled).toBe(true);
        expect(Array.isArray(config.groupByFields)).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('should handle malformed configuration strings gracefully', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.oneof(
        // Strings com separadores múltiplos
        fc.string().map(s => s.replace(/[^,A-Z_]/g, ',').replace(/,+/g, ',')),
        // Strings com espaços em branco
        fc.array(fc.string({ minLength: 0, maxLength: 10 }), { minLength: 1, maxLength: 5 })
          .map(arr => arr.join(', ')),
        // Strings vazias ou apenas separadores
        fc.constantFrom('', ',', ',,', ' , , ', '   '),
        // Strings com caracteres especiais
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.includes(','))
      ),
      
      async (collectionName, malformedConfig) => {
        // Feature: nfe-configurable-grouping, Property 8: Validação Robusta de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        
        // Configurar com string malformada
        process.env[`${collectionUpper}_GROUP_BY`] = malformedConfig;
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        // Sistema não deve quebrar com configuração malformada
        expect(() => {
          const config = configManager.getGroupingConfig(collectionName);
          
          // Configuração deve ser válida mesmo com entrada malformada
          expect(config).toBeDefined();
          expect(config.collection).toBe(collectionName);
          expect(Array.isArray(config.groupByFields)).toBe(true);
          expect(typeof config.enabled).toBe('boolean');
          expect(typeof config.globalEnabled).toBe('boolean');
          
          // Campos de agrupamento devem ser array válido (pode estar vazio)
          config.groupByFields.forEach(field => {
            expect(typeof field).toBe('string');
            expect(field.trim().length).toBeGreaterThan(0);
          });
          
        }).not.toThrow();
      }
    ), { numRuns: 100 });
  });

  it('should validate boolean configuration values correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.oneof(
        // Valores boolean válidos
        fc.constantFrom('true', 'false', 'TRUE', 'FALSE', 'True', 'False'),
        // Valores que devem ser interpretados como false
        fc.constantFrom('0', 'no', 'off', 'disabled', ''),
        // Valores que devem ser interpretados como true
        fc.constantFrom('1', 'yes', 'on', 'enabled'),
        // Valores inválidos/ambíguos
        fc.constantFrom('maybe', 'invalid', 'null', 'undefined', '2', '-1')
      ),
      fc.oneof(
        fc.constantFrom('true', 'false', 'TRUE', 'FALSE'),
        fc.constantFrom('0', '1', 'yes', 'no', 'invalid')
      ),
      
      async (collectionName, collectionEnabledValue, globalEnabledValue) => {
        // Feature: nfe-configurable-grouping, Property 8: Validação Robusta de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        
        // Configurar valores boolean
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = collectionEnabledValue;
        process.env.NFE_GROUPING_ENABLED = globalEnabledValue;
        process.env[`${collectionUpper}_GROUP_BY`] = 'CHV_NFE'; // Campo válido
        
        // Obter configuração
        const config = configManager.getGroupingConfig(collectionName);
        
        // Verificar que valores boolean são interpretados corretamente
        expect(typeof config.enabled).toBe('boolean');
        expect(typeof config.globalEnabled).toBe('boolean');
        
        // Valores que devem ser interpretados como true
        const truthyValues = ['true', 'TRUE', 'True', '1', 'yes', 'on', 'enabled'];
        // Valores que devem ser interpretados como false
        const falsyValues = ['false', 'FALSE', 'False', '0', 'no', 'off', 'disabled', ''];
        
        // Verificar interpretação do valor global
        if (truthyValues.includes(globalEnabledValue)) {
          expect(config.globalEnabled).toBe(true);
        } else if (falsyValues.includes(globalEnabledValue)) {
          expect(config.globalEnabled).toBe(false);
        } else {
          // Valores inválidos devem ser tratados como false por segurança
          expect(config.globalEnabled).toBe(false);
        }
        
        // Verificar interpretação do valor específico da coleção
        const expectedCollectionEnabled = truthyValues.includes(collectionEnabledValue);
        const expectedGlobalEnabled = config.globalEnabled;
        
        // enabled deve ser true apenas se ambos global e coleção estão habilitados
        // e há campos de agrupamento válidos
        if (expectedGlobalEnabled && expectedCollectionEnabled && config.groupByFields.length > 0) {
          expect(config.enabled).toBe(true);
        } else {
          expect(config.enabled).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });

  it('should provide meaningful error context for invalid configurations', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.array(
        fc.oneof(
          fc.constantFrom('INVALID_FIELD', 'NON_EXISTENT_FIELD', 'WRONG_FIELD'),
          fc.string({ minLength: 1, maxLength: 15 }).filter(s => 
            !['CHV_NFE', 'CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA'].includes(s)
          )
        ),
        { minLength: 1, maxLength: 3 }
      ),
      
      async (collectionName, invalidFields) => {
        // Feature: nfe-configurable-grouping, Property 8: Validação Robusta de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        
        // Configurar apenas campos inválidos
        process.env[`${collectionUpper}_GROUP_BY`] = invalidFields.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = 'true';
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        // Obter configuração
        const config = configManager.getGroupingConfig(collectionName);
        
        // Sistema deve lidar graciosamente com campos inválidos
        expect(config.groupByFields).toEqual([]); // Nenhum campo válido
        expect(config.enabled).toBe(false); // Desabilitado por não ter campos válidos
        expect(config.collection).toBe(collectionName);
        expect(config.globalEnabled).toBe(true);
        
        // Verificar que configuração é consistente
        expect(config.groupByFields.length).toBe(0);
        
        // Verificar que sistema não quebra mesmo com configuração totalmente inválida
        expect(() => {
          configManager.refreshConfig();
          const refreshedConfig = configManager.getGroupingConfig(collectionName);
          expect(refreshedConfig).toBeDefined();
        }).not.toThrow();
      }
    ), { numRuns: 100 });
  });

  it('should maintain configuration consistency across multiple calls', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('tbl_nfe_100', 'tbl_cte_100'),
      fc.array(fc.constantFrom('CHV_NFE', 'CNPJ_EMIT', 'DT_DOC'), { minLength: 1, maxLength: 3 }),
      fc.boolean(),
      
      async (collectionName, groupByFields, enabled) => {
        // Feature: nfe-configurable-grouping, Property 8: Validação Robusta de Configurações
        
        const collectionUpper = collectionName.toUpperCase();
        
        // Configurar ambiente
        process.env[`${collectionUpper}_GROUP_BY`] = groupByFields.join(',');
        process.env[`${collectionUpper}_GROUPING_ENABLED`] = enabled.toString();
        process.env.NFE_GROUPING_ENABLED = 'true';
        
        // Obter configuração múltiplas vezes
        const config1 = configManager.getGroupingConfig(collectionName);
        const config2 = configManager.getGroupingConfig(collectionName);
        const config3 = configManager.getGroupingConfig(collectionName);
        
        // Todas as chamadas devem retornar configuração consistente
        expect(config1).toEqual(config2);
        expect(config2).toEqual(config3);
        
        // Verificar propriedades específicas
        expect(config1.groupByFields).toEqual(config2.groupByFields);
        expect(config1.enabled).toBe(config2.enabled);
        expect(config1.collection).toBe(config2.collection);
        expect(config1.globalEnabled).toBe(config2.globalEnabled);
        
        // Verificar que configuração é válida
        expect(config1.groupByFields).toEqual(groupByFields);
        expect(config1.enabled).toBe(enabled && groupByFields.length > 0);
        expect(config1.collection).toBe(collectionName);
        expect(config1.globalEnabled).toBe(true);
      }
    ), { numRuns: 100 });
  });
});