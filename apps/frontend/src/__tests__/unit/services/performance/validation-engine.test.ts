/**
 * Unit Tests for ValidationEngine
 * 
 * Tests synchronous validation logic, rule management, and built-in rules.
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import type { ValidationRule } from '@fiscal/shared/types/performance';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationEngine, ValidationRuleFactory } from '../../../../services/performance/validation-engine.service';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  describe('Core Validation', () => {
    it('should validate input with no rules as valid', () => {
      const result = engine.validate('test input');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedValue).toBe('test input');
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should validate input against registered rules', () => {
      const rule: ValidationRule = {
        id: 'test-rule',
        validate: (input) => input.length > 5,
        errorMessage: 'Input too short'
      };

      engine.addRule(rule);
      
      const validResult = engine.validate('valid input');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = engine.validate('test');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Input too short');
    });

    it('should validate input against custom rules passed to validate()', () => {
      const customRule: ValidationRule = {
        id: 'custom-rule',
        validate: (input) => input.includes('test'),
        errorMessage: 'Must contain "test"'
      };

      const validResult = engine.validate('test input', [customRule]);
      expect(validResult.isValid).toBe(true);

      const invalidResult = engine.validate('invalid', [customRule]);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Must contain "test"');
    });

    it('should combine registered and custom rules', () => {
      const registeredRule: ValidationRule = {
        id: 'registered',
        validate: (input) => input.length > 3,
        errorMessage: 'Too short'
      };

      const customRule: ValidationRule = {
        id: 'custom',
        validate: (input) => input.includes('test'),
        errorMessage: 'Must contain test'
      };

      engine.addRule(registeredRule);

      const result = engine.validate('ab', [customRule]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Too short');
      expect(result.errors).toContain('Must contain test');
    });

    it('should execute rules in priority order (highest first)', () => {
      const executionOrder: string[] = [];

      const lowPriorityRule: ValidationRule = {
        id: 'low',
        validate: (_input) => {
          executionOrder.push('low');
          return false;
        },
        errorMessage: 'Low priority error',
        priority: 10
      };

      const highPriorityRule: ValidationRule = {
        id: 'high',
        validate: (_input) => {
          executionOrder.push('high');
          return false;
        },
        errorMessage: 'High priority error',
        priority: 100
      };

      engine.addRule(lowPriorityRule);
      engine.addRule(highPriorityRule);

      engine.validate('test');

      expect(executionOrder).toEqual(['high', 'low']);
    });

    it('should stop on first error when configured', () => {
      const engineWithStopOnFirst = new ValidationEngine({
        rules: [],
        stopOnFirstError: true
      });

      const rule1: ValidationRule = {
        id: 'rule1',
        validate: () => false,
        errorMessage: 'Error 1',
        priority: 100
      };

      const rule2: ValidationRule = {
        id: 'rule2',
        validate: () => false,
        errorMessage: 'Error 2',
        priority: 90
      };

      engineWithStopOnFirst.addRule(rule1);
      engineWithStopOnFirst.addRule(rule2);

      const result = engineWithStopOnFirst.validate('test');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Error 1');
    });

    it('should handle validation rule exceptions gracefully', () => {
      const throwingRule: ValidationRule = {
        id: 'throwing',
        validate: () => {
          throw new Error('Validation failed');
        },
        errorMessage: 'Should not see this'
      };

      engine.addRule(throwingRule);

      const result = engine.validate('test');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Validation error in rule "throwing"');
      expect(result.errors[0]).toContain('Validation failed');
    });

    it('should complete validation within 16ms frame budget', () => {
      // Add multiple rules to test performance
      for (let i = 0; i < 10; i++) {
        engine.addRule({
          id: `rule-${i}`,
          validate: (input) => input.length > i,
          errorMessage: `Error ${i}`
        });
      }

      const startTime = performance.now();
      engine.validate('test input with reasonable length');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(16);
    });

    it('should warn when validation exceeds frame budget', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a slow validation rule
      const slowRule: ValidationRule = {
        id: 'slow',
        validate: (_input) => {
          // Simulate slow validation (> 16ms)
          const start = Date.now();
          while (Date.now() - start < 20) {
            // Busy wait
          }
          return true;
        },
        errorMessage: 'Slow rule'
      };

      engine.addRule(slowRule);
      engine.validate('test');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[VALIDATION] ⚠️ Validation took')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Rule Management', () => {
    it('should add a rule', () => {
      const rule: ValidationRule = {
        id: 'test-rule',
        validate: () => true,
        errorMessage: 'Test error'
      };

      engine.addRule(rule);

      expect(engine.hasRule('test-rule')).toBe(true);
      expect(engine.getRuleCount()).toBe(1);
    });

    it('should remove a rule', () => {
      const rule: ValidationRule = {
        id: 'test-rule',
        validate: () => true,
        errorMessage: 'Test error'
      };

      engine.addRule(rule);
      expect(engine.hasRule('test-rule')).toBe(true);

      engine.removeRule('test-rule');
      expect(engine.hasRule('test-rule')).toBe(false);
      expect(engine.getRuleCount()).toBe(0);
    });

    it('should replace rule with same id', () => {
      const rule1: ValidationRule = {
        id: 'test-rule',
        validate: () => true,
        errorMessage: 'Error 1'
      };

      const rule2: ValidationRule = {
        id: 'test-rule',
        validate: () => false,
        errorMessage: 'Error 2'
      };

      engine.addRule(rule1);
      engine.addRule(rule2);

      expect(engine.getRuleCount()).toBe(1);

      const result = engine.validate('test');
      expect(result.errors[0]).toBe('Error 2');
    });

    it('should get all rules', () => {
      const rule1: ValidationRule = {
        id: 'rule1',
        validate: () => true,
        errorMessage: 'Error 1'
      };

      const rule2: ValidationRule = {
        id: 'rule2',
        validate: () => true,
        errorMessage: 'Error 2'
      };

      engine.addRule(rule1);
      engine.addRule(rule2);

      const rules = engine.getRules();
      expect(rules).toHaveLength(2);
      expect(rules.map(r => r.id)).toContain('rule1');
      expect(rules.map(r => r.id)).toContain('rule2');
    });

    it('should clear all rules', () => {
      engine.addRule({
        id: 'rule1',
        validate: () => true,
        errorMessage: 'Error 1'
      });

      engine.addRule({
        id: 'rule2',
        validate: () => true,
        errorMessage: 'Error 2'
      });

      expect(engine.getRuleCount()).toBe(2);

      engine.clearRules();

      expect(engine.getRuleCount()).toBe(0);
      expect(engine.getRules()).toHaveLength(0);
    });
  });

  describe('Built-in Rules', () => {
    describe('Required Rule', () => {
      it('should validate required field', () => {
        const rule = ValidationRuleFactory.required();
        engine.addRule(rule);

        expect(engine.validate('test').isValid).toBe(true);
        expect(engine.validate('').isValid).toBe(false);
        expect(engine.validate('   ').isValid).toBe(false);
      });

      it('should use custom error message', () => {
        const rule = ValidationRuleFactory.required('Custom required message');
        engine.addRule(rule);

        const result = engine.validate('');
        expect(result.errors[0]).toBe('Custom required message');
      });
    });

    describe('MinLength Rule', () => {
      it('should validate minimum length', () => {
        const rule = ValidationRuleFactory.minLength(5);
        engine.addRule(rule);

        expect(engine.validate('12345').isValid).toBe(true);
        expect(engine.validate('123456').isValid).toBe(true);
        expect(engine.validate('1234').isValid).toBe(false);
      });

      it('should use custom error message', () => {
        const rule = ValidationRuleFactory.minLength(5, 'Too short!');
        engine.addRule(rule);

        const result = engine.validate('123');
        expect(result.errors[0]).toBe('Too short!');
      });
    });

    describe('MaxLength Rule', () => {
      it('should validate maximum length', () => {
        const rule = ValidationRuleFactory.maxLength(10);
        engine.addRule(rule);

        expect(engine.validate('12345').isValid).toBe(true);
        expect(engine.validate('1234567890').isValid).toBe(true);
        expect(engine.validate('12345678901').isValid).toBe(false);
      });
    });

    describe('Pattern Rule', () => {
      it('should validate against regex pattern', () => {
        const rule = ValidationRuleFactory.pattern(/^\d+$/, 'Must be numeric');
        engine.addRule(rule);

        expect(engine.validate('12345').isValid).toBe(true);
        expect(engine.validate('abc').isValid).toBe(false);
        expect(engine.validate('123abc').isValid).toBe(false);
      });
    });

    describe('Email Rule', () => {
      it('should validate email format', () => {
        const rule = ValidationRuleFactory.email();
        engine.addRule(rule);

        expect(engine.validate('test@example.com').isValid).toBe(true);
        expect(engine.validate('user.name+tag@example.co.uk').isValid).toBe(true);
        expect(engine.validate('invalid').isValid).toBe(false);
        expect(engine.validate('invalid@').isValid).toBe(false);
        expect(engine.validate('@example.com').isValid).toBe(false);
      });
    });

    describe('Numeric Rule', () => {
      it('should validate numeric input', () => {
        const rule = ValidationRuleFactory.numeric();
        engine.addRule(rule);

        expect(engine.validate('123').isValid).toBe(true);
        expect(engine.validate('123.45').isValid).toBe(true);
        expect(engine.validate('-123').isValid).toBe(true);
        expect(engine.validate('abc').isValid).toBe(false);
        expect(engine.validate('').isValid).toBe(false);
      });
    });

    describe('Range Rule', () => {
      it('should validate numeric range', () => {
        const rule = ValidationRuleFactory.range(1, 100);
        engine.addRule(rule);

        expect(engine.validate('1').isValid).toBe(true);
        expect(engine.validate('50').isValid).toBe(true);
        expect(engine.validate('100').isValid).toBe(true);
        expect(engine.validate('0').isValid).toBe(false);
        expect(engine.validate('101').isValid).toBe(false);
        expect(engine.validate('abc').isValid).toBe(false);
      });
    });

    describe('Custom Rule', () => {
      it('should create custom validation rule', () => {
        const rule = ValidationRuleFactory.custom(
          'contains-test',
          (input) => input.includes('test'),
          'Must contain "test"',
          75
        );

        engine.addRule(rule);

        expect(engine.validate('test input').isValid).toBe(true);
        expect(engine.validate('invalid').isValid).toBe(false);
        expect(rule.priority).toBe(75);
      });
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should validate with multiple rules', () => {
      engine.addRule(ValidationRuleFactory.required());
      engine.addRule(ValidationRuleFactory.minLength(3));
      engine.addRule(ValidationRuleFactory.maxLength(20));
      engine.addRule(ValidationRuleFactory.pattern(/^[a-zA-Z0-9]+$/));

      expect(engine.validate('test123').isValid).toBe(true);
      expect(engine.validate('').isValid).toBe(false);
      expect(engine.validate('ab').isValid).toBe(false);
      expect(engine.validate('a'.repeat(25)).isValid).toBe(false);
      expect(engine.validate('test@123').isValid).toBe(false);
    });

    it('should validate email with additional constraints', () => {
      engine.addRule(ValidationRuleFactory.required());
      engine.addRule(ValidationRuleFactory.email());
      engine.addRule(ValidationRuleFactory.maxLength(50));

      expect(engine.validate('user@example.com').isValid).toBe(true);
      expect(engine.validate('').isValid).toBe(false);
      expect(engine.validate('invalid').isValid).toBe(false);
      expect(engine.validate('a'.repeat(40) + '@example.com').isValid).toBe(false);
    });

    it('should collect all errors when not stopping on first', () => {
      engine.addRule(ValidationRuleFactory.required());
      engine.addRule(ValidationRuleFactory.minLength(5));
      engine.addRule(ValidationRuleFactory.pattern(/^\d+$/));

      const result = engine.validate('');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
