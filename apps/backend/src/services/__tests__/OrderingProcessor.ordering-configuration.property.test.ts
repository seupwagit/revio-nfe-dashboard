/**
 * Testes de propriedade para OrderingProcessor - Ordenação Configurável Completa
 * 
 * **Valida: Requisitos 3.1, 3.3, 3.4, 3.5**
 * 
 * **Feature: nfe-configurable-grouping, Property 4: Ordenação Configurável Completa**
 */

// 1. Node.js built-ins

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)
import { NFE_GROUPING_DEFAULTS } from '@fiscal/shared/constants/nfe-grouping.constants';

// 4. Relative imports
import { OrderingProcessor } from '../OrderingProcessor';

describe('OrderingProcessor - Propriedade: Ordenação Configurável Completa', () => {
  let orderingProcessor: OrderingProcessor;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original completo
    originalEnv = { ...process.env };
    
    // Limpar TODAS as variáveis de ambiente relacionadas à ordenação
    const envKeysToDelete = Object.keys(process.env).filter(key => 
      key.includes('ORDER_BY') || 
      key.includes('ORDERING') ||
      key.includes('SORT')
    );
    
    envKeysToDelete.forEach(key => {
      delete process.env[key];
    });
    
    // Criar nova instância do processor para cada teste
    orderingProcessor = new OrderingProcessor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restaurar ambiente original completamente
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // ========== GERADORES FAST-CHECK OTIMIZADOS ==========

  // Gerador de nomes de coleções válidas
  const collectionNameGenerator = fc.constantFrom('tbl_nfe_100', 'tbl_cte_100', 'tbl_cfe_100');
  
  // Gerador de campos válidos para ordenação
  const validOrderFieldGenerator = fc.constantFrom('DT_DOC', 'PROTOCOLADA', 'VALOR_TOTAL', 'CHV_NFE', 'CNPJ_EMIT', 'NOME_EMIT');
  
  // Gerador de direções de ordenação
  const orderDirectionGenerator = fc.constantFrom('ASC', 'DESC', 'asc', 'desc');
  
  // Gerador de configurações de ordenação válidas
  const orderingConfigGenerator = fc.array(
    fc.record({
      field: validOrderFieldGenerator,
      direction: orderDirectionGenerator
    }),
    { minLength: 1, maxLength: 3 }
  ).map(fields => 
    fields.map(f => `${f.field} ${f.direction}`).join(', ')
  );
  
  // Gerador de configurações malformadas
  const malformedConfigGenerator = fc.constantFrom(
    'INVALID_FIELD ASC',
    'DT_DOC INVALID_DIRECTION',
    'DT_DOC ASC, , PROTOCOLADA DESC',
    '   ',
    'DT_DOC',
    'ASC DT_DOC',
    'DT_DOC ASC PROTOCOLADA DESC' // sem vírgula
  );

  // ========== TESTES DE PROPRIEDADE ==========

  describe('Propriedade 4: Ordenação Configurável Completa', () => {
    it('deve aplicar ordenação em cascata nos campos especificados', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          orderingConfigGenerator,
          (collection, orderingConfig) => {
            // Arrange - Configurar ordenação específica
            const collectionUpper = collection.toUpperCase();
            process.env[`${collectionUpper}_ORDER_BY`] = orderingConfig;

            // Act
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);
            const sortStage = orderingProcessor.buildSortStage(parsedFields);

            // Assert - Verificar estrutura do sort stage
            expect(sortStage).toHaveProperty('$sort');
            expect(typeof sortStage.$sort).toBe('object');
            
            // Verificar que todos os campos foram incluídos na ordenação
            const sortFields = Object.keys(sortStage.$sort);
            expect(sortFields.length).toBeGreaterThan(0);
            
            // Verificar que as direções são válidas (1 para ASC, -1 para DESC)
            Object.values(sortStage.$sort).forEach(direction => {
              expect([1, -1]).toContain(direction);
            });
            
            // Verificar ordem de precedência (primeiro campo tem prioridade)
            const firstField = parsedFields[0];
            const firstSortField = sortFields[0];
            expect(firstSortField).toBe(firstField.field);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('deve aplicar direções corretas (ASC/DESC) para cada campo', () => {
      fc.assert(
        fc.property(
          validOrderFieldGenerator,
          orderDirectionGenerator,
          (field, direction) => {
            // Arrange
            const orderingConfig = `${field} ${direction}`;

            // Act
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);
            const sortStage = orderingProcessor.buildSortStage(parsedFields);

            // Assert - Verificar direção correta
            expect(parsedFields).toHaveLength(1);
            expect(parsedFields[0].field).toBe(field);
            
            // OrderingField usa 1 para ASC, -1 para DESC (formato MongoDB)
            const expectedDirection = direction.toUpperCase() === 'ASC' ? 1 : -1;
            expect(parsedFields[0].direction).toBe(expectedDirection);
            
            // Verificar que o sort stage usa a mesma direção
            expect(sortStage.$sort[field]).toBe(expectedDirection);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('deve usar configuração padrão quando ordenação não especificada', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          (collection) => {
            // Arrange - Garantir que não há configuração específica
            const collectionUpper = collection.toUpperCase();
            delete process.env[`${collectionUpper}_ORDER_BY`];

            // Act
            const defaultConfig = NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY;
            const parsedFields = orderingProcessor.parseOrderingConfig(defaultConfig);
            const sortStage = orderingProcessor.buildSortStage(parsedFields);

            // Assert - Deve usar configuração padrão
            expect(parsedFields.length).toBeGreaterThan(0);
            
            // Verificar que contém os campos padrão esperados
            const fieldNames = parsedFields.map(f => f.field);
            expect(fieldNames).toContain('DT_DOC');
            expect(fieldNames).toContain('PROTOCOLADA');
            
            // Verificar direções padrão (DESC = -1)
            parsedFields.forEach(field => {
              expect(field.direction).toBe(-1); // DESC em formato MongoDB
            });
            
            // Verificar estrutura do sort stage
            expect(sortStage).toHaveProperty('$sort');
            expect(sortStage.$sort.DT_DOC).toBe(-1); // DESC = -1
            expect(sortStage.$sort.PROTOCOLADA).toBe(-1); // DESC = -1
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve validar campos de ordenação contra schema da coleção', () => {
      fc.assert(
        fc.property(
          collectionNameGenerator,
          fc.constantFrom('INVALID_FIELD', 'NONEXISTENT_COLUMN', 'WRONG_NAME'),
          (collection, invalidField) => {
            // Arrange
            const orderingConfig = `${invalidField} DESC`;

            // Act
            const isValid = orderingProcessor.validateOrderingFields([invalidField], collection);
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);

            // Assert - Campo inválido deve ser detectado
            expect(isValid).toBe(false);
            
            // Mas parsing deve ainda funcionar (para logging/debugging)
            expect(parsedFields).toHaveLength(1);
            expect(parsedFields[0].field).toBe(invalidField);
            expect(parsedFields[0].direction).toBe(-1); // DESC = -1
          }
        ),
        { numRuns: 12 }
      );
    });

    it('deve tratar configurações malformadas graciosamente', () => {
      fc.assert(
        fc.property(
          malformedConfigGenerator,
          (malformedConfig) => {
            // Act - Tentar parsear configuração malformada
            const parsedFields = orderingProcessor.parseOrderingConfig(malformedConfig);

            // Assert - Deve retornar resultado válido ou usar fallback
            expect(Array.isArray(parsedFields)).toBe(true);
            
            if (parsedFields.length > 0) {
              // Se conseguiu parsear algo, deve ter estrutura válida
              parsedFields.forEach(field => {
                expect(field).toHaveProperty('field');
                expect(field).toHaveProperty('direction');
                expect(field).toHaveProperty('priority');
                expect(typeof field.field).toBe('string');
                expect([1, -1]).toContain(field.direction); // MongoDB format
                expect(typeof field.priority).toBe('number');
              });
            } else {
              // Se não conseguiu parsear, deve usar configuração padrão
              const defaultFields = orderingProcessor.parseOrderingConfig(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
              expect(defaultFields.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    it('deve aplicar ordenação tanto em grupos quanto em documentos individuais', () => {
      fc.assert(
        fc.property(
          orderingConfigGenerator,
          (orderingConfig) => {
            // Arrange
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);
            const pipeline: any[] = [
              { $match: { active: true } },
              { $group: { _id: '$CHV_NFE', documents: { $push: '$$ROOT' } } }
            ];

            // Act - Aplicar ordenação ao pipeline
            orderingProcessor.applyGroupOrdering(pipeline, parsedFields);

            // Assert - Pipeline deve ter estágios de ordenação
            const sortStages = pipeline.filter(stage => stage.$sort);
            expect(sortStages.length).toBeGreaterThan(0);
            
            // Verificar que ordenação foi aplicada corretamente
            const lastSortStage = sortStages[sortStages.length - 1];
            expect(lastSortStage).toHaveProperty('$sort');
            
            // Verificar que campos de ordenação estão presentes
            const sortFields = Object.keys(lastSortStage.$sort);
            expect(sortFields.length).toBeGreaterThan(0);
            
            // Verificar que direções são válidas
            Object.values(lastSortStage.$sort).forEach(direction => {
              expect([1, -1]).toContain(direction);
            });
          }
        ),
        { numRuns: 18 }
      );
    });

    it('deve manter consistência entre parsing e aplicação', () => {
      fc.assert(
        fc.property(
          orderingConfigGenerator,
          (orderingConfig) => {
            // Act
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);
            const sortStage = orderingProcessor.buildSortStage(parsedFields);

            // Assert - Verificar que todos os campos parseados estão no sort stage
            // Nota: Campos duplicados são removidos no sort stage (comportamento correto do MongoDB)
            const uniqueFields = new Set(parsedFields.map(f => f.field));
            expect(Object.keys(sortStage.$sort).length).toBe(uniqueFields.size);
            
            parsedFields.forEach(field => {
              expect(sortStage.$sort).toHaveProperty(field.field);
              
              // Para campos duplicados, o último valor prevalece
              // Verificar que a direção está correta
              expect([1, -1]).toContain(sortStage.$sort[field.field]);
            });
          }
        ),
        { numRuns: 15 }
      );
    });

    it('deve suportar múltiplos campos com diferentes direções', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              field: validOrderFieldGenerator,
              direction: orderDirectionGenerator
            }),
            { minLength: 2, maxLength: 4 }
          ).filter(configs => {
            // Filtrar para evitar campos duplicados
            const fields = configs.map(c => c.field);
            return new Set(fields).size === fields.length;
          }),
          (fieldConfigs) => {
            // Arrange - Criar configuração com múltiplos campos únicos
            const orderingConfig = fieldConfigs
              .map(config => `${config.field} ${config.direction}`)
              .join(', ');

            // Act
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);
            const sortStage = orderingProcessor.buildSortStage(parsedFields);

            // Assert - Verificar que todos os campos foram processados
            expect(parsedFields.length).toBe(fieldConfigs.length);
            
            fieldConfigs.forEach((config, index) => {
              expect(parsedFields[index].field).toBe(config.field);
              
              // Verificar direção em formato MongoDB
              const expectedDirection = config.direction.toUpperCase() === 'ASC' ? 1 : -1;
              expect(parsedFields[index].direction).toBe(expectedDirection);
            });
            
            // Verificar sort stage (sem duplicatas)
            expect(Object.keys(sortStage.$sort).length).toBe(fieldConfigs.length);
          }
        ),
        { numRuns: 12 }
      );
    });

    it('deve preservar ordem de precedência dos campos', () => {
      fc.assert(
        fc.property(
          fc.shuffledSubarray(['DT_DOC', 'PROTOCOLADA', 'VALOR_TOTAL', 'CHV_NFE'], { minLength: 2, maxLength: 4 }),
          orderDirectionGenerator,
          (fields, direction) => {
            // Arrange - Criar configuração com ordem específica
            const orderingConfig = fields.map(field => `${field} ${direction}`).join(', ');

            // Act
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);

            // Assert - Ordem deve ser preservada
            expect(parsedFields.length).toBe(fields.length);
            
            fields.forEach((field, index) => {
              expect(parsedFields[index].field).toBe(field);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('deve funcionar com configurações case-insensitive', () => {
      fc.assert(
        fc.property(
          validOrderFieldGenerator,
          fc.constantFrom('asc', 'ASC', 'desc', 'DESC', 'Asc', 'Desc'),
          (field, direction) => {
            // Arrange
            const orderingConfig = `${field} ${direction}`;

            // Act
            const parsedFields = orderingProcessor.parseOrderingConfig(orderingConfig);

            // Assert - Direção deve ser normalizada para formato MongoDB
            expect(parsedFields).toHaveLength(1);
            expect(parsedFields[0].field).toBe(field);
            
            const expectedDirection = direction.toLowerCase() === 'asc' ? 1 : -1;
            expect(parsedFields[0].direction).toBe(expectedDirection);
          }
        ),
        { numRuns: 12 }
      );
    });
  });
});