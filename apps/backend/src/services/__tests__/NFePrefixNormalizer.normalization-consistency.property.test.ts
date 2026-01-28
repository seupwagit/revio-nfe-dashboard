/**
 * Testes de propriedade para NFePrefixNormalizer - Normalização Consistente de Chaves
 * 
 * **Valida: Requisitos 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * **Feature: nfe-configurable-grouping, Property 1: Normalização Consistente de Chaves NFe**
 */

// 1. Node.js built-ins

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)

// 4. Relative imports
import { NFePrefixNormalizer } from '../NFePrefixNormalizer';

describe('NFePrefixNormalizer - Propriedade: Normalização Consistente de Chaves', () => {
  let normalizer: NFePrefixNormalizer;

  beforeEach(() => {
    normalizer = new NFePrefixNormalizer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== GERADORES FAST-CHECK OTIMIZADOS ==========

  // Gerador de chave NFe válida (44 dígitos) - usando strings fixas para performance
  const validNFeKeys = [
    '12345678901234567890123456789012345678901234',
    '98765432109876543210987654321098765432109876',
    '11111111111111111111111111111111111111111111',
    '22222222222222222222222222222222222222222222',
    '33333333333333333333333333333333333333333333',
    '44444444444444444444444444444444444444444444',
    '55555555555555555555555555555555555555555555'
  ];

  const nfeKeyGenerator = fc.constantFrom(...validNFeKeys);
  const nfeWithPrefixGenerator = nfeKeyGenerator.map(key => `NFe${key}`);
  const nfeWithoutPrefixGenerator = nfeKeyGenerator;
  const mixedNFeKeysGenerator = fc.oneof(nfeWithPrefixGenerator, nfeWithoutPrefixGenerator);

  // ========== TESTES DE PROPRIEDADE ==========

  describe('Propriedade 1: Normalização Consistente de Chaves NFe', () => {
    it('deve remover prefixo "NFe" de chaves que o possuem', () => {
      fc.assert(
        fc.property(nfeWithPrefixGenerator, (nfeKeyWithPrefix) => {
          // Arrange
          const expectedNormalizedKey = nfeKeyWithPrefix.substring(3);

          // Act
          const result = normalizer.normalizeKey(nfeKeyWithPrefix);

          // Assert
          expect(result.normalizedKey).toBe(expectedNormalizedKey);
          expect(result.normalizedKey).not.toMatch(/^NFe/);
          expect(result.normalizedKey).toHaveLength(44);
          expect(result.hadPrefix).toBe(true);
          expect(result.originalKey).toBe(nfeKeyWithPrefix);
        }),
        { numRuns: 20 }
      );
    });

    it('deve manter chaves sem prefixo "NFe" inalteradas', () => {
      fc.assert(
        fc.property(nfeWithoutPrefixGenerator, (nfeKeyWithoutPrefix) => {
          // Act
          const result = normalizer.normalizeKey(nfeKeyWithoutPrefix);

          // Assert
          expect(result.normalizedKey).toBe(nfeKeyWithoutPrefix);
          expect(result.normalizedKey).toHaveLength(44);
          expect(result.hadPrefix).toBe(false);
          expect(result.originalKey).toBe(nfeKeyWithoutPrefix);
        }),
        { numRuns: 20 }
      );
    });

    it('deve ser idempotente (aplicar normalização duas vezes = mesmo resultado)', () => {
      fc.assert(
        fc.property(mixedNFeKeysGenerator, (nfeKey) => {
          // Act - Primeira normalização
          const firstResult = normalizer.normalizeKey(nfeKey);
          
          // Act - Segunda normalização (da chave já normalizada)
          const secondResult = normalizer.normalizeKey(firstResult.normalizedKey);

          // Assert - Resultado deve ser idêntico
          expect(secondResult.normalizedKey).toBe(firstResult.normalizedKey);
          expect(secondResult.hadPrefix).toBe(false); // Chave já normalizada não tem prefixo
        }),
        { numRuns: 20 }
      );
    });

    it('deve tratar chaves equivalentes como idênticas após normalização', () => {
      fc.assert(
        fc.property(nfeKeyGenerator, (baseKey) => {
          // Arrange - Criar par de chaves: uma com prefixo, outra sem
          const keyWithPrefix = `NFe${baseKey}`;
          const keyWithoutPrefix = baseKey;

          // Act
          const resultWithPrefix = normalizer.normalizeKey(keyWithPrefix);
          const resultWithoutPrefix = normalizer.normalizeKey(keyWithoutPrefix);

          // Assert - Chaves normalizadas devem ser idênticas
          expect(resultWithPrefix.normalizedKey).toBe(resultWithoutPrefix.normalizedKey);
          expect(resultWithPrefix.normalizedKey).toBe(baseKey);
          expect(resultWithoutPrefix.normalizedKey).toBe(baseKey);
          
          // Assert - Metadados devem refletir diferenças originais
          expect(resultWithPrefix.hadPrefix).toBe(true);
          expect(resultWithoutPrefix.hadPrefix).toBe(false);
          expect(resultWithPrefix.originalKey).toBe(keyWithPrefix);
          expect(resultWithoutPrefix.originalKey).toBe(keyWithoutPrefix);
        }),
        { numRuns: 20 }
      );
    });

    it('deve gerar pipeline MongoDB válido e determinístico', () => {
      // Act
      const pipeline1 = normalizer.createNormalizationPipeline();
      const pipeline2 = normalizer.createNormalizationPipeline();

      // Assert - Pipeline deve ser determinístico
      expect(pipeline1).toEqual(pipeline2);
      
      // Assert - Pipeline deve ter estrutura correta
      expect(pipeline1).toHaveLength(1);
      expect(pipeline1[0]).toHaveProperty('$addFields');
      expect(pipeline1[0].$addFields).toHaveProperty('CHV_NFE_NORMALIZED');
      
      // Assert - Pipeline deve usar operadores MongoDB válidos
      const addFieldsStage = pipeline1[0].$addFields;
      expect(addFieldsStage.CHV_NFE_NORMALIZED).toHaveProperty('$cond');
      expect(addFieldsStage.CHV_NFE_NORMALIZED.$cond).toHaveLength(3);
    });

    it('deve processar lotes de chaves de forma consistente', () => {
      fc.assert(
        fc.property(fc.array(mixedNFeKeysGenerator, { minLength: 1, maxLength: 10 }), (keys) => {
          // Act - Processar lote
          const batchResults = normalizer.normalizeBatch(keys);
          
          // Act - Processar individualmente
          const individualResults = new Map();
          keys.forEach(key => {
            individualResults.set(key, normalizer.normalizeKey(key));
          });

          // Assert - Resultados devem ser idênticos
          expect(batchResults.size).toBe(individualResults.size);
          
          keys.forEach(key => {
            const batchResult = batchResults.get(key);
            const individualResult = individualResults.get(key);
            
            expect(batchResult).toEqual(individualResult);
          });
        }),
        { numRuns: 15 }
      );
    });
  });
});