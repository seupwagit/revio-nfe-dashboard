import { describe, expect, it } from 'vitest';
import { NFePrefixNormalizationError } from '../../errors/nfe-prefix-normalization-error.class';
import { NFePrefixNormalizer } from '../nfe-prefix-normalizer.class';

describe('NFePrefixNormalizer', () => {
  let normalizer: NFePrefixNormalizer;

  beforeEach(() => {
    normalizer = new NFePrefixNormalizer();
  });

  describe('normalizeKey', () => {
    it('should normalize key with NFe prefix correctly', () => {
      // Arrange
      const keyWithPrefix = 'NFe35200714200166000187550010000000046550000001';
      const expectedNormalizedKey = '35200714200166000187550010000000046550000001';

      // Act
      const result = normalizer.normalizeKey(keyWithPrefix);

      // Assert
      expect(result.originalKey).toBe(keyWithPrefix);
      expect(result.normalizedKey).toBe(expectedNormalizedKey);
      expect(result.hadPrefix).toBe(true);
    });

    it('should preserve key without NFe prefix', () => {
      // Arrange
      const keyWithoutPrefix = '35200714200166000187550010000000046550000001';

      // Act
      const result = normalizer.normalizeKey(keyWithoutPrefix);

      // Assert
      expect(result.originalKey).toBe(keyWithoutPrefix);
      expect(result.normalizedKey).toBe(keyWithoutPrefix);
      expect(result.hadPrefix).toBe(false);
    });

    it('should handle empty string correctly', () => {
      // Arrange
      const emptyKey = '';

      // Act
      const result = normalizer.normalizeKey(emptyKey);

      // Assert
      expect(result.originalKey).toBe(emptyKey);
      expect(result.normalizedKey).toBe(emptyKey);
      expect(result.hadPrefix).toBe(false);
    });

    it('should handle short keys without prefix', () => {
      // Arrange
      const shortKey = 'AB';

      // Act
      const result = normalizer.normalizeKey(shortKey);

      // Assert
      expect(result.originalKey).toBe(shortKey);
      expect(result.normalizedKey).toBe(shortKey);
      expect(result.hadPrefix).toBe(false);
    });

    it('should handle keys that start with "NF" but not "NFe"', () => {
      // Arrange
      const keyWithNF = 'NF35200714200166000187550010000000046550000001';

      // Act
      const result = normalizer.normalizeKey(keyWithNF);

      // Assert
      expect(result.originalKey).toBe(keyWithNF);
      expect(result.normalizedKey).toBe(keyWithNF);
      expect(result.hadPrefix).toBe(false);
    });

    it('should throw error for null input', () => {
      // Act & Assert
      expect(() => normalizer.normalizeKey(null as any)).toThrow(NFePrefixNormalizationError);
      expect(() => normalizer.normalizeKey(null as any)).toThrow('Chave não pode ser null ou undefined');
    });

    it('should throw error for undefined input', () => {
      // Act & Assert
      expect(() => normalizer.normalizeKey(undefined as any)).toThrow(NFePrefixNormalizationError);
      expect(() => normalizer.normalizeKey(undefined as any)).toThrow('Chave não pode ser null ou undefined');
    });

    it('should throw error for non-string input', () => {
      // Act & Assert
      expect(() => normalizer.normalizeKey(123 as any)).toThrow(NFePrefixNormalizationError);
      expect(() => normalizer.normalizeKey(123 as any)).toThrow('Tipo inválido para chave: esperado string, recebido number');
    });

    it('should throw error for key that is only "NFe"', () => {
      // Act & Assert
      expect(() => normalizer.normalizeKey('NFe')).toThrow(NFePrefixNormalizationError);
      expect(() => normalizer.normalizeKey('NFe')).toThrow('Chave contém apenas o prefixo "NFe" sem conteúdo adicional');
    });

    it('should handle keys with NFe prefix in middle', () => {
      // Arrange
      const keyWithNFeInMiddle = '123NFe456';

      // Act
      const result = normalizer.normalizeKey(keyWithNFeInMiddle);

      // Assert
      expect(result.originalKey).toBe(keyWithNFeInMiddle);
      expect(result.normalizedKey).toBe(keyWithNFeInMiddle);
      expect(result.hadPrefix).toBe(false);
    });

    it('should handle case sensitivity correctly', () => {
      // Arrange
      const keyWithLowerCase = 'nfe35200714200166000187550010000000046550000001';

      // Act
      const result = normalizer.normalizeKey(keyWithLowerCase);

      // Assert
      expect(result.originalKey).toBe(keyWithLowerCase);
      expect(result.normalizedKey).toBe(keyWithLowerCase);
      expect(result.hadPrefix).toBe(false);
    });
  });

  describe('shouldNormalize', () => {
    it('should return true for CHV_NFE field', () => {
      // Act
      const result = normalizer.shouldNormalize('CHV_NFE');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for other fields', () => {
      // Arrange
      const otherFields = ['CNPJ_EMIT', 'DT_DOC', 'PROTOCOLADA', 'VALOR_TOTAL', 'NOME_EMIT'];

      // Act & Assert
      otherFields.forEach(field => {
        expect(normalizer.shouldNormalize(field)).toBe(false);
      });
    });

    it('should return false for empty string', () => {
      // Act
      const result = normalizer.shouldNormalize('');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for case variations of CHV_NFE', () => {
      // Arrange
      const caseVariations = ['chv_nfe', 'Chv_Nfe', 'CHV_nfe', 'chv_NFE'];

      // Act & Assert
      caseVariations.forEach(field => {
        expect(normalizer.shouldNormalize(field)).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long keys with NFe prefix', () => {
      // Arrange
      const longKey = 'NFe' + '1'.repeat(100);
      const expectedNormalized = '1'.repeat(100);

      // Act
      const result = normalizer.normalizeKey(longKey);

      // Assert
      expect(result.originalKey).toBe(longKey);
      expect(result.normalizedKey).toBe(expectedNormalized);
      expect(result.hadPrefix).toBe(true);
    });

    it('should handle keys with special characters', () => {
      // Arrange
      const keyWithSpecialChars = 'NFe123-456_789@test';
      const expectedNormalized = '123-456_789@test';

      // Act
      const result = normalizer.normalizeKey(keyWithSpecialChars);

      // Assert
      expect(result.originalKey).toBe(keyWithSpecialChars);
      expect(result.normalizedKey).toBe(expectedNormalized);
      expect(result.hadPrefix).toBe(true);
    });

    it('should handle keys with unicode characters', () => {
      // Arrange
      const keyWithUnicode = 'NFe测试键值';
      const expectedNormalized = '测试键值';

      // Act
      const result = normalizer.normalizeKey(keyWithUnicode);

      // Assert
      expect(result.originalKey).toBe(keyWithUnicode);
      expect(result.normalizedKey).toBe(expectedNormalized);
      expect(result.hadPrefix).toBe(true);
    });
  });
});