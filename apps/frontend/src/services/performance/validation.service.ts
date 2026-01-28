/**
 * Validation Engine Service
 * 
 * Provides synchronous input validation before network calls.
 * All validation is performed locally without async operations.
 * 
 * Validates: Requirements 2.1, 2.4
 */

import type {
    ValidationResult,
    ValidationRule
} from '@fiscal/shared/types/performance';

/**
 * Built-in validation rules
 */
export const BUILT_IN_RULES = {
  /**
   * Validates minimum length
   */
  minLength: (min: number): ValidationRule => ({
    id: `minLength-${min}`,
    validate: (input: string) => input.length >= min,
    errorMessage: `Mínimo de ${min} caracteres necessário`
  }),

  /**
   * Validates maximum length
   */
  maxLength: (max: number): ValidationRule => ({
    id: `maxLength-${max}`,
    validate: (input: string) => input.length <= max,
    errorMessage: `Máximo de ${max} caracteres permitido`
  }),

  /**
   * Validates required field (non-empty)
   */
  required: (): ValidationRule => ({
    id: 'required',
    validate: (input: string) => input.trim().length > 0,
    errorMessage: 'Campo obrigatório'
  }),

  /**
   * Validates pattern matching
   */
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    id: `pattern-${regex.source}`,
    validate: (input: string) => regex.test(input),
    errorMessage: message
  }),

  /**
   * Validates email format
   */
  email: (): ValidationRule => ({
    id: 'email',
    validate: (input: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input);
    },
    errorMessage: 'Email inválido'
  }),

  /**
   * Validates numeric input
   */
  numeric: (): ValidationRule => ({
    id: 'numeric',
    validate: (input: string) => /^\d+$/.test(input),
    errorMessage: 'Apenas números são permitidos'
  }),

  /**
   * Validates alphanumeric input
   */
  alphanumeric: (): ValidationRule => ({
    id: 'alphanumeric',
    validate: (input: string) => /^[a-zA-Z0-9]+$/.test(input),
    errorMessage: 'Apenas letras e números são permitidos'
  })
};

/**
 * ValidationEngine Implementation
 * 
 * Performs synchronous validation of user input before network calls.
 * Supports built-in rules and custom rules.
 */
export class ValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();

  /**
   * Validates input against all registered rules
   * 
   * @param input - The input string to validate
   * @returns ValidationResult with isValid flag and error messages
   */
  validate(input: string): ValidationResult {
    const errors: string[] = [];

    // Execute all validation rules
    for (const rule of this.rules.values()) {
      try {
        const isValid = rule.validate(input);
        if (!isValid) {
          errors.push(rule.errorMessage);
        }
      } catch (error) {
        // If a rule throws, treat as validation failure
        errors.push(`Erro de validação: ${rule.id}`);
        console.error(`[ValidationEngine] Rule ${rule.id} threw error:`, error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedValue: input,
      timestamp: Date.now()
    };
  }

  /**
   * Adds a validation rule
   * 
   * @param rule - The validation rule to add
   */
  addRule(rule: ValidationRule): void {
    if (!rule.id || !rule.validate || !rule.errorMessage) {
      throw new Error('Invalid rule: must have id, validate, and errorMessage');
    }

    this.rules.set(rule.id, rule);
  }

  /**
   * Removes a validation rule by ID
   * 
   * @param ruleId - The ID of the rule to remove
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Checks if a rule exists
   * 
   * @param ruleId - The ID of the rule to check
   * @returns true if rule exists
   */
  hasRule(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  /**
   * Gets all registered rules
   * 
   * @returns Array of all validation rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Clears all validation rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  /**
   * Gets the count of registered rules
   * 
   * @returns Number of rules
   */
  getRuleCount(): number {
    return this.rules.size;
  }
}

/**
 * Factory function to create a ValidationEngine with common rules
 * 
 * @param rules - Array of validation rules to initialize with
 * @returns Configured ValidationEngine instance
 */
export function createValidationEngine(rules: ValidationRule[] = []): ValidationEngine {
  const engine = new ValidationEngine();
  
  for (const rule of rules) {
    engine.addRule(rule);
  }
  
  return engine;
}

/**
 * Utility to create a search input validator
 * 
 * @param minLength - Minimum search query length (default: 2)
 * @returns ValidationEngine configured for search
 */
export function createSearchValidator(minLength: number = 2): ValidationEngine {
  return createValidationEngine([
    BUILT_IN_RULES.required(),
    BUILT_IN_RULES.minLength(minLength),
    BUILT_IN_RULES.maxLength(100)
  ]);
}

/**
 * Utility to create an email validator
 * 
 * @returns ValidationEngine configured for email
 */
export function createEmailValidator(): ValidationEngine {
  return createValidationEngine([
    BUILT_IN_RULES.required(),
    BUILT_IN_RULES.email()
  ]);
}
