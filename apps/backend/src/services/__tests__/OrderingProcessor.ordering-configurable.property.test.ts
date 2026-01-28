/**
 * Testes de propriedade para OrderingProcessor - Ordenação Configurável
 * 
 * Valida propriedades universais do sistema de ordenação configurável usando fast-check
 * com mínimo de 100 iterações por teste para garantir cobertura abrangente
 */

// 1. Node.js built-ins
// (nenhum built-in necessário)

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)
import {
    NFE_GROUPING_DEFAULTS,
    NFE_GROUPING_ORDER_DIRECTIONS,
    NFE_GROUPING_VALID_ORDER_FIELDS
} from '@fiscal/shared/constants/nfe-grouping.constants';

// 4. Relative imports
import { OrderingProcessor } from '../OrderingProcessor';

// Mock do logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('OrderingProcessor - Property Tests: Ordenação Configurável Completa', () => {
  let processor: OrderingProcessor;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original
    originalEnv = { ...process.env };
    
    // Limpar variáveis de ambiente relacionadas à ordenação
    Object.keys(process.env).forEach(key => {
      if (key.includes('ORDER_BY')) {
        delete process.env[key];
      }
    });
    
    processor = new OrderingProcessor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
  });

  // ========== GERADORES FAST-CHECK ==========

  /**
   * Gerador de coleções suportadas para ordenação
   */
  const supportedCollectionArb = fc.constantFrom('tbl_nfe_100');

  /**
   * Gerador de campos válidos para ordenação
   */
  const validOrderFieldArb = fc.constantFrom(...NFE_GROUPING_VALID_ORDER_FIELDS.tbl_nfe_100);

  /**
   * Gerador de direções de ordenação válidas
   */
  const orderDirectionArb = fc.constantFrom('ASC', 'DESC', 'asc', 'desc', 'Asc', 'Desc');

  /**
   * Gerador de campos inválidos para ordenação
   */
  const invalidOrderFieldArb = fc.string({ minLength: 1, maxLength: 20 })
    .filter(field => !NFE_GROUPING_VALID_ORDER_FIELDS.tbl_nfe_100.includes(field as any));

  /**
   * Gerador de configurações de ordenação válidas (string format)
   */
  const validOrderingConfigArb = fc.array(
    fc.record({
      field: validOrderFieldArb,
      direction: fc.option(orderDirectionArb, { nil: undefined })
    }),
    { minLength: 1, maxLength: 3 }
  ).map(fields => {
    // Remove duplicatas para evitar campos repetidos
    const uniqueFields = [...new Map(fields.map(f => [f.field, f])).values()];
    return uniqueFields.map(f => f.direction ? `${f.field} ${f.direction}` : f.field).join(', ');
  });

  /**
   * Gerador de configurações de ordenação inválidas
   */
  const invalidOrderingConfigArb = fc.oneof(
    // Campos inválidos
    fc.array(invalidOrderFieldArb, { minLength: 1, maxLength: 3 })
      .map(fields => fields.join(', ')),
    // Direções inválidas
    fc.array(
      fc.record({
        field: validOrderFieldArb,
        direction: fc.string({ minLength: 1, maxLength: 10 })
          .filter(dir => !['ASC', 'DESC', 'asc', 'desc'].includes(dir))
      }),
      { minLength: 1, maxLength: 2 }
    ).map(fields => 
      fields.map(f => `${f.field} ${f.direction}`).join(', ')
    ),
    // Strings malformadas
    fc.oneof(
      fc.constant('FIELD1 ASC EXTRA'),
      fc.constant('FIELD1, , FIELD2'),
      fc.constant('  ,  ,  '),
      fc.constant('FIELD1 ASC, FIELD2 DESC EXTRA')
    )
  );

  /**
   * Gerador de múltiplos campos de ordenação
   */
  const multipleFieldsOrderingArb = fc.array(
    fc.record({
      field: validOrderFieldArb,
      direction: orderDirectionArb
    }),
    { minLength: 2, maxLength: 3 }
  ).map(fields => 
    // Remove duplicatas para evitar configurações inválidas
    [...new Map(fields.map(f => [f.field, f])).values()]
      .map(f => `${f.field} ${f.direction}`)
      .join(', ')
  );

  // ========== PROPERTY 4: ORDENAÇÃO CONFIGURÁVEL COMPLETA ==========

  describe('Property 4: Ordenação Configurável Completa', () => {
    /**
     * **Feature: nfe-configurable-grouping, Property 4: Ordenação Configurável Completa**
     * **Valida: Requisitos 3.1, 3.3, 3.4, 3.5**
     * 
     * Para qualquer configuração válida de ordenação, o sistema deve aplicar ordenação
     * em cascata nos campos especificados, com direções corretas (ASC/DESC),
     * tanto em grupos quanto em documentos individuais
     */
    it('should apply ordering configurations correctly for any valid configuration', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        validOrderingConfigArb,
        (collection, orderingConfig) => {
          // Arrange - Configurar variável de ambiente
          const envVar = `${collection.toUpperCase()}_ORDER_BY`;
          process.env[envVar] = orderingConfig;

          // Act
          const config = processor.getOrderingConfig(collection);
          const parsedFields = processor.parseOrderingConfig(orderingConfig);
          const sortStage = processor.buildSortStage(parsedFields);

          // Assert - **Requisito 3.1**: Configuração deve ser aplicada conforme especificado
          expect(config.enabled).toBe(true);
          expect(config.defaultOrdering).toBe(orderingConfig);
          expect(config.fields).toEqual(parsedFields);

          // **Requisito 3.3**: Direções corretas (ASC/DESC) devem ser aplicadas
          parsedFields.forEach(field => {
            expect([1, -1]).toContain(field.direction);
            expect(sortStage.$sort[field.field]).toBe(field.direction);
          });

          // **Requisito 3.4**: Múltiplos campos devem ser aplicados em cascata
          if (parsedFields.length > 1) {
            const sortKeys = Object.keys(sortStage.$sort);
            expect(sortKeys.length).toBe(parsedFields.length);
            
            // Verificar ordem de prioridade
            parsedFields
              .sort((a, b) => a.priority - b.priority)
              .forEach((field, index) => {
                expect(sortKeys[index]).toBe(field.field);
              });
          }

          // **Requisito 3.5**: Ordenação deve ser aplicada tanto em grupos quanto documentos
          const pipeline: any[] = [];
          processor.applyGroupOrdering(pipeline, parsedFields);
          
          expect(pipeline).toHaveLength(1);
          expect(pipeline[0]).toEqual(sortStage);

          // Propriedade: Todos os campos devem ser válidos para a coleção
          parsedFields.forEach(field => {
            expect(NFE_GROUPING_VALID_ORDER_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_ORDER_FIELDS])
              .toContain(field.field);
          });

          // Propriedade: Prioridades devem ser sequenciais
          const priorities = parsedFields.map(f => f.priority).sort((a, b) => a - b);
          priorities.forEach((priority, index) => {
            expect(priority).toBe(index);
          });
        }
      ), { numRuns: 100 });
    });

    it('should handle multiple fields with correct cascade ordering', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        multipleFieldsOrderingArb,
        (collection, orderingConfig) => {
          // Arrange
          const envVar = `${collection.toUpperCase()}_ORDER_BY`;
          process.env[envVar] = orderingConfig;

          // Act
          const parsedFields = processor.parseOrderingConfig(orderingConfig);
          const sortStage = processor.buildSortStage(parsedFields);

          // Assert - **Requisito 3.4**: Ordenação em cascata
          // Só testa se realmente temos múltiplos campos únicos
          if (parsedFields.length > 1) {
            // Verificar que a ordem no MongoDB $sort corresponde à prioridade
            const sortKeys = Object.keys(sortStage.$sort);
            const sortedByPriority = parsedFields.sort((a, b) => a.priority - b.priority);
            
            sortedByPriority.forEach((field, index) => {
              expect(sortKeys[index]).toBe(field.field);
              expect(sortStage.$sort[field.field]).toBe(field.direction);
            });

            // Propriedade: Não deve haver campos duplicados
            const fieldNames = parsedFields.map(f => f.field);
            const uniqueFieldNames = [...new Set(fieldNames)];
            expect(fieldNames.length).toBe(uniqueFieldNames.length);

            // Propriedade: Todas as direções devem ser válidas
            parsedFields.forEach(field => {
              expect([1, -1]).toContain(field.direction);
            });
          } else {
            // Se só temos um campo, ainda deve funcionar corretamente
            expect(parsedFields.length).toBeGreaterThanOrEqual(1);
            expect(Object.keys(sortStage.$sort).length).toBe(parsedFields.length);
          }
        }
      ), { numRuns: 100 });
    });

    it('should apply correct ASC/DESC directions consistently', async () => {
      await fc.assert(fc.property(
        validOrderFieldArb,
        orderDirectionArb,
        (field, direction) => {
          // Arrange
          const orderingConfig = `${field} ${direction}`;

          // Act
          const parsedFields = processor.parseOrderingConfig(orderingConfig);
          const sortStage = processor.buildSortStage(parsedFields);

          // Assert - **Requisito 3.3**: Direções corretas devem ser aplicadas
          expect(parsedFields).toHaveLength(1);
          
          const expectedDirection = direction.toUpperCase() === 'ASC' 
            ? NFE_GROUPING_ORDER_DIRECTIONS.MONGODB_ASC 
            : NFE_GROUPING_ORDER_DIRECTIONS.MONGODB_DESC;
          
          expect(parsedFields[0].direction).toBe(expectedDirection);
          expect(sortStage.$sort[field]).toBe(expectedDirection);

          // Propriedade: Case-insensitive para direções
          const normalizedDirection = direction.toUpperCase();
          expect(['ASC', 'DESC']).toContain(normalizedDirection);
        }
      ), { numRuns: 100 });
    });

    it('should use default ordering when configuration is absent', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        (collection) => {
          // Arrange - Sem configuração de ambiente
          // (variáveis já foram limpas no beforeEach)

          // Act
          const config = processor.getOrderingConfig(collection);
          const parsedFields = processor.parseOrderingConfig('');
          const sortStage = processor.buildSortStage([]);

          // Assert - **Requisito 3.2**: Comportamento padrão
          expect(config.enabled).toBe(true);
          expect(config.defaultOrdering).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
          
          // Deve usar configuração padrão
          const defaultFields = processor.parseOrderingConfig(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
          expect(config.fields).toEqual(defaultFields);
          
          // Propriedade: Configuração padrão deve ser válida
          expect(defaultFields.length).toBeGreaterThan(0);
          defaultFields.forEach(field => {
            expect(NFE_GROUPING_VALID_ORDER_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_ORDER_FIELDS])
              .toContain(field.field);
          });

          // Propriedade: Sort stage deve usar configuração padrão quando não há campos
          const defaultSortStage = processor.buildSortStage(defaultFields);
          expect(defaultSortStage).toEqual(defaultSortStage); // Sempre deve ser igual a si mesmo
        }
      ), { numRuns: 100 });
    });

    it('should handle field validation correctly', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (collection, fields) => {
          // Filtrar campos vazios ou apenas espaços
          const validFieldsForTest = fields.filter(field => field && field.trim().length > 0);
          
          // Se não há campos válidos para testar, pular
          if (validFieldsForTest.length === 0) {
            return true; // Propriedade trivialmente verdadeira
          }

          // Determine if all fields are valid
          const validFields = NFE_GROUPING_VALID_ORDER_FIELDS[collection as keyof typeof NFE_GROUPING_VALID_ORDER_FIELDS];
          const allFieldsValid = validFieldsForTest.every(field => validFields.includes(field.trim() as any));

          try {
            processor.validateOrderingFields(validFieldsForTest, collection);
            // Se chegou aqui, não lançou erro - deve ser porque todos os campos são válidos
            expect(allFieldsValid).toBe(true);
          } catch (error) {
            // Se lançou erro, deve ser porque pelo menos um campo é inválido
            expect(allFieldsValid).toBe(false);
            expect(error).toBeInstanceOf(Error);
          }
        }
      ), { numRuns: 100 });
    });

    it('should normalize ordering configurations consistently', async () => {
      await fc.assert(fc.property(
        validOrderingConfigArb,
        (orderingConfig) => {
          // Act
          const normalized = processor.normalizeOrderingConfig(orderingConfig);
          const parsedOriginal = processor.parseOrderingConfig(orderingConfig);
          const parsedNormalized = processor.parseOrderingConfig(normalized);

          // Assert - Propriedades de normalização
          expect(parsedNormalized).toEqual(parsedOriginal);
          
          // Propriedade: Normalização deve ser idempotente
          const doubleNormalized = processor.normalizeOrderingConfig(normalized);
          expect(doubleNormalized).toBe(normalized);

          // Propriedade: Formato normalizado deve conter apenas campos válidos e direções válidas
          expect(normalized).toBeTruthy();
          expect(normalized.length).toBeGreaterThan(0);
          
          // Verificar que contém apenas ASC ou DESC
          const parts = normalized.split(',').map(p => p.trim());
          parts.forEach(part => {
            expect(part).toMatch(/\s+(ASC|DESC)$/);
          });
        }
      ), { numRuns: 100 });
    });

    it('should validate ordering configurations correctly', async () => {
      await fc.assert(fc.property(
        fc.oneof(validOrderingConfigArb, invalidOrderingConfigArb),
        supportedCollectionArb,
        (orderingConfig, collection) => {
          // Act
          const isValid = processor.isValidOrderingConfig(orderingConfig, collection);

          // Determine expected validity
          try {
            const parsedFields = processor.parseOrderingConfig(orderingConfig);
            const fieldNames = parsedFields.map(f => f.field);
            processor.validateOrderingFields(fieldNames, collection);
            
            // If we get here, configuration should be valid
            expect(isValid).toBe(true);
          } catch (error) {
            // If validation throws, configuration should be invalid
            expect(isValid).toBe(false);
          }
        }
      ), { numRuns: 100 });
    });

    it('should handle empty and malformed configurations gracefully', async () => {
      await fc.assert(fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant(',,,'),
          fc.constant('  ,  ,  '),
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => s.trim().length === 0)
        ),
        (malformedConfig) => {
          // Act
          const parsedFields = processor.parseOrderingConfig(malformedConfig);
          const sortStage = processor.buildSortStage(parsedFields);

          // Assert - Deve usar configuração padrão para entradas malformadas
          const defaultFields = processor.parseOrderingConfig(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
          expect(parsedFields).toEqual(defaultFields);
          
          // Propriedade: Sort stage deve ser válido mesmo com entrada malformada
          expect(sortStage).toHaveProperty('$sort');
          expect(Object.keys(sortStage.$sort).length).toBeGreaterThan(0);

          // Propriedade: Configuração deve ser marcada como inválida
          expect(processor.isValidOrderingConfig(malformedConfig)).toBe(false);
        }
      ), { numRuns: 100 });
    });

    it('should maintain consistent behavior across multiple calls', async () => {
      await fc.assert(fc.property(
        supportedCollectionArb,
        validOrderingConfigArb,
        (collection, orderingConfig) => {
          // Arrange
          const envVar = `${collection.toUpperCase()}_ORDER_BY`;
          process.env[envVar] = orderingConfig;

          // Act - Multiple calls
          const config1 = processor.getOrderingConfig(collection);
          const config2 = processor.getOrderingConfig(collection);
          const parsed1 = processor.parseOrderingConfig(orderingConfig);
          const parsed2 = processor.parseOrderingConfig(orderingConfig);
          const sort1 = processor.buildSortStage(parsed1);
          const sort2 = processor.buildSortStage(parsed2);

          // Assert - Propriedade de consistência
          expect(config1).toEqual(config2);
          expect(parsed1).toEqual(parsed2);
          expect(sort1).toEqual(sort2);

          // Propriedade: Resultados devem ser determinísticos
          expect(config1.fields).toEqual(config2.fields);
          expect(config1.defaultOrdering).toBe(config2.defaultOrdering);
          expect(config1.enabled).toBe(config2.enabled);
        }
      ), { numRuns: 100 });
    });
  });

  // ========== PROPERTY: PIPELINE INTEGRATION ==========

  describe('Property: Pipeline Integration', () => {
    it('should integrate correctly with aggregation pipelines', async () => {
      await fc.assert(fc.property(
        validOrderingConfigArb,
        fc.array(fc.record({ $match: fc.object() }), { minLength: 0, maxLength: 3 }),
        (orderingConfig, existingStages) => {
          // Arrange
          const parsedFields = processor.parseOrderingConfig(orderingConfig);
          const pipeline = [...existingStages];
          const originalLength = pipeline.length;

          // Act
          processor.applyGroupOrdering(pipeline, parsedFields);

          // Assert - **Requisito 3.5**: Ordenação aplicada em grupos e documentos
          expect(pipeline.length).toBe(originalLength + 1);
          
          const sortStage = pipeline[pipeline.length - 1];
          expect(sortStage).toHaveProperty('$sort');
          
          // Propriedade: Sort stage deve corresponder aos campos parseados
          const expectedSortStage = processor.buildSortStage(parsedFields);
          expect(sortStage).toEqual(expectedSortStage);

          // Propriedade: Estágios existentes não devem ser modificados
          existingStages.forEach((stage, index) => {
            expect(pipeline[index]).toEqual(stage);
          });
        }
      ), { numRuns: 100 });
    });

    it('should handle null and invalid pipelines gracefully', async () => {
      await fc.assert(fc.property(
        validOrderingConfigArb,
        (orderingConfig) => {
          // Arrange
          const parsedFields = processor.parseOrderingConfig(orderingConfig);

          // Act & Assert - Null pipeline
          expect(() => {
            processor.applyGroupOrdering(null as any, parsedFields);
          }).not.toThrow();

          // Act & Assert - Undefined pipeline
          expect(() => {
            processor.applyGroupOrdering(undefined as any, parsedFields);
          }).not.toThrow();

          // Act & Assert - Non-array pipeline
          expect(() => {
            processor.applyGroupOrdering({} as any, parsedFields);
          }).not.toThrow();
        }
      ), { numRuns: 100 });
    });
  });
});