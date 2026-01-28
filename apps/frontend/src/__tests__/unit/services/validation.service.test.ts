/**
 * Unit Tests for ValidationEngine
 * 
 * Tests validation logic, rule management, and built-in rules.
 * 
 * Validates: Requirements 2.1, 2.4
 */

import type { ValidationRule } from '@fiscal/shared/types/performance';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    BUILT_IN_RULES,
    createEmailValidator,
    createSearchValidator,
    createValidationEngine,
    ValidationEngine
} from '../../../services/performance/validation.service';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  describe('Core Functionality', () => {
    it('should validate empty input with no rules', () => {
      const result = engine.validate('');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.validatedValue).toBe('');
    });

    it('should validate non-empty input with no rules', () => {
      const result = engine.validate('test input');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.validatedValue).toBe('test input');
    });

    it('should add and execute a custom rule', () => {
      const customRule: ValidationRule = {
        id: 'custom-test',
        validate: (input: string) => input === 'valid',
        errorMessage: 'Input must be "valid"'
      };

      engine.addRule(customRule);
      
      const validResult = engine.validate('valid');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);

      const invalidResult = engine.validate('invalid');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Input must be "valid"');
    });

    it('should remove a rule by ID', () => {
      const rule = BUILT_IN_RULES.required();
      engine.addRule(rule);
      
      expect(engine.hasRule('required')).toBe(true);
      
      engine.removeRule('required');
      
      expect(engine.hasRule('required')).toBe(false);
      
      const result = engine.validate('');
      expect(result.isValid).toBe(true);
    });

    it('should execute multiple rules', () => {
      engine.addRule(BUILT_IN_RULES.required());
      engine.addRule(BUILT_IN_RULES.minLength(3));
      engine.addRule(BUILT_IN_RULES.maxLength(10));

      const tooShort = engine.validate('ab');
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors).toHaveLength(1);
      expect(tooShort.errors[0]).toContain('Mínimo de 3');

      const tooLong = engine.validate('12345678901');
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors).toHaveLength(1);
      expect(tooLong.errors[0]).toContain('Máximo de 10');

      const valid = engine.validate('valid');
      expect(valid.isValid).toBe(true);
      expect(valid.errors).toEqual([]);
    });

    it('should handle rule that throws error', () => {
      const throwingRule: ValidationRule = {
        id: 'throwing-rule',
        validate: () => {
          throw new Error('Rule error');
        },
        errorMessage: 'Should not see this'
      };

      engine.addRule(throwingRule);
      
      const result = engine.validate('test');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Erro de validação');
    });

    it('should throw error when adding invalid rule', () => {
      expect(() => {
        engine.addRule({} as ValidationRule);
      }).toThrow('Invalid rule');
    });
  });

  describe('Rule Management', () => {
    it('should check if rule exists', () => {
      expect(engine.hasRule('required')).toBe(false);
      
      engine.addRule(BUILT_IN_RULES.required());
      
      expect(engine.hasRule('required')).toBe(true);
    });

    it('should get all rules', () => {
      engine.addRule(BUILT_IN_RULES.required());
      engine.addRule(BUILT_IN_RULES.minLength(5));
      
      const rules = engine.getRules();
      
      expect(rules).toHaveLength(2);
      expect(rules.map(r => r.id)).toContain('required');
      expect(rules.map(r => r.id)).toContain('minLength-5');
    });

    it('should clear all rules', () => {
      engine.addRule(BUILT_IN_RULES.required());
      engine.addRule(BUILT_IN_RULES.minLength(5));
      
      expect(engine.getRuleCount()).toBe(2);
      
      engine.clearRules();
      
      expect(engine.getRuleCount()).toBe(0);
      expect(engine.getRules()).toEqual([]);
    });

    it('should get rule count', () => {
      expect(engine.getRuleCount()).toBe(0);
      
      engine.addRule(BUILT_IN_RULES.required());
      expect(engine.getRuleCount()).toBe(1);
      
      engine.addRule(BUILT_IN_RULES.minLength(5));
      expect(engine.getRuleCount()).toBe(2);
    });
  });

  describe('Built-in Rules', () => {
    describe('required', () => {
      it('should fail for empty string', () => {
        engine.addRule(BUILT_IN_RULES.required());
        
        const result = engine.validate('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Campo obrigatório');
      });

      it('should fail for whitespace only', () => {
        engine.addRule(BUILT_IN_RULES.required());
        
        const result = engine.validate('   ');
        expect(result.isValid).toBe(false);
      });

      it('should pass for non-empty string', () => {
        engine.addRule(BUILT_IN_RULES.required());
        
        const result = engine.validate('test');
        expect(result.isValid).toBe(true);
      });
    });

    describe('minLength', () => {
      it('should fail when input is too short', () => {
        engine.addRule(BUILT_IN_RULES.minLength(5));
        
        const result = engine.validate('test');
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Mínimo de 5');
      });

      it('should pass when input meets minimum', () => {
        engine.addRule(BUILT_IN_RULES.minLength(5));
        
        const result = engine.validate('tests');
        expect(result.isValid).toBe(true);
      });

      it('should pass when input exceeds minimum', () => {
        engine.addRule(BUILT_IN_RULES.minLength(5));
        
        const result = engine.validate('testing');
        expect(result.isValid).toBe(true);
      });
    });

    describe('maxLength', () => {
      it('should fail when input is too long', () => {
        engine.addRule(BUILT_IN_RULES.maxLength(5));
        
        const result = engine.validate('testing');
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Máximo de 5');
      });

      it('should pass when input meets maximum', () => {
        engine.addRule(BUILT_IN_RULES.maxLength(5));
        
        const result = engine.validate('tests');
        expect(result.isValid).toBe(true);
      });

      it('should pass when input is below maximum', () => {
        engine.addRule(BUILT_IN_RULES.maxLength(5));
        
        const result = engine.validate('test');
        expect(result.isValid).toBe(true);
      });
    });

    describe('pattern', () => {
      it('should fail when input does not match pattern', () => {
        engine.addRule(BUILT_IN_RULES.pattern(/^\d+$/, 'Apenas números'));
        
        const result = engine.validate('abc123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Apenas números');
      });

      it('should pass when input matches pattern', () => {
        engine.addRule(BUILT_IN_RULES.pattern(/^\d+$/, 'Apenas números'));
        
        const result = engine.validate('12345');
        expect(result.isValid).toBe(true);
      });
    });

    describe('email', () => {
      it('should fail for invalid email', () => {
        engine.addRule(BUILT_IN_RULES.email());
        
        const invalidEmails = [
          'invalid',
          'invalid@',
          '@invalid.com',
          'invalid@com',
          'invalid @test.com'
        ];

        for (const email of invalidEmails) {
          const result = engine.validate(email);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Email inválido');
        }
      });

      it('should pass for valid email', () => {
        engine.addRule(BUILT_IN_RULES.email());
        
        const validEmails = [
          'test@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk'
        ];

        for (const email of validEmails) {
          const result = engine.validate(email);
          expect(result.isValid).toBe(true);
        }
      });
    });

    describe('numeric', () => {
      it('should fail for non-numeric input', () => {
        engine.addRule(BUILT_IN_RULES.numeric());
        
        const result = engine.validate('abc123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Apenas números são permitidos');
      });

      it('should pass for numeric input', () => {
        engine.addRule(BUILT_IN_RULES.numeric());
        
        const result = engine.validate('12345');
        expect(result.isValid).toBe(true);
      });
    });

    describe('alphanumeric', () => {
      it('should fail for input with special characters', () => {
        engine.addRule(BUILT_IN_RULES.alphanumeric());
        
        const result = engine.validate('test-123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Apenas letras e números são permitidos');
      });

      it('should pass for alphanumeric input', () => {
        engine.addRule(BUILT_IN_RULES.alphanumeric());
        
        const result = engine.validate('test123');
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Factory Functions', () => {
    it('should create engine with rules', () => {
      const engine = createValidationEngine([
        BUILT_IN_RULES.required(),
        BUILT_IN_RULES.minLength(3)
      ]);

      expect(engine.getRuleCount()).toBe(2);
      
      const result = engine.validate('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should create search validator', () => {
      const validator = createSearchValidator(3);

      expect(validator.getRuleCount()).toBe(3);
      
      const tooShort = validator.validate('ab');
      expect(tooShort.isValid).toBe(false);

      const valid = validator.validate('search query');
      expect(valid.isValid).toBe(true);
    });

    it('should create email validator', () => {
      const validator = createEmailValidator();

      expect(validator.getRuleCount()).toBe(2);
      
      const invalid = validator.validate('invalid-email');
      expect(invalid.isValid).toBe(false);

      const valid = validator.validate('test@example.com');
      expect(valid.isValid).toBe(true);
    });
  });
});
