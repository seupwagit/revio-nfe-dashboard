/**
 * Validation Engine Service
 * 
 * Synchronous validation engine that runs before network calls.
 * Ensures all validation completes within the 16ms frame budget.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 * Properties: 2 (Validation Precedes Network Calls), 3 (Validation Rule Updates Are Local)
 */

import type {
    ValidationEngineConfig,
    ValidationResult,
    ValidationRule
} from '@fiscal/shared/types/performance';

export class ValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();
  private stopOnFirstError: boolean;

  constructor(config?: ValidationEngineConfig) {
    this.stopOnFirstError = config?.stopOnFirstError ?? false;
    
    if (config?.rules) {
      config.rules.forEach(rule => this.addRule(rule));
    }
  }

  /**
   * Validate input against all registered rules
   * MUST be synchronous and complete within 16ms
   */
  validate(input: string, customRules?: ValidationRule[]): ValidationResult {
    const startTime = performance.now();
    const errors: string[] = [];
    
    // Combine registered rules with custom rules
    const allRules = [
      ...Array.from(this.rules.values()),
      ...(customRules || [])
    ];

    // Sort by priority (higher priority first)
    const sortedRules = allRules.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA;
    });

    // Execute validation rules
    for (const rule of sortedRules) {
      try {
        const isValid = rule.validate(input);
        
        if (!isValid) {
          errors.push(rule.errorMessage);
          
          if (this.stopOnFirstError) {
            break;
          }
        }
      } catch (error) {
        // Validation rule threw an error - treat as validation failure
        errors.push(`Validation error in rule "${rule.id}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (this.stopOnFirstError) {
          break;
        }
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Warn if validation took too long (should be < 16ms)
    if (duration > 16) {
      console.warn(`[VALIDATION] ⚠️ Validation took ${duration.toFixed(2)}ms (> 16ms frame budget)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedValue: input,
      timestamp: Date.now()
    };
  }

  /**
   * Add a validation rule
   * Local operation - no network calls
   */
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a validation rule
   * Local operation - no network calls
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Check if a rule exists
   */
  hasRule(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  /**
   * Get all registered rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  /**
   * Get rule count
   */
  getRuleCount(): number {
    return this.rules.size;
  }
}

/**
 * Built-in validation rule factory
 * Creates common validation rules
 */
export class ValidationRuleFactory {
  /**
   * Create a required field rule
   */
  static required(errorMessage: string = 'This field is required'): ValidationRule {
    return {
      id: 'required',
      validate: (input: string) => input.trim().length > 0,
      errorMessage,
      priority: 100 // High priority
    };
  }

  /**
   * Create a minimum length rule
   */
  static minLength(minLength: number, errorMessage?: string): ValidationRule {
    return {
      id: `minLength-${minLength}`,
      validate: (input: string) => input.length >= minLength,
      errorMessage: errorMessage || `Minimum length is ${minLength} characters`,
      priority: 90
    };
  }

  /**
   * Create a maximum length rule
   */
  static maxLength(maxLength: number, errorMessage?: string): ValidationRule {
    return {
      id: `maxLength-${maxLength}`,
      validate: (input: string) => input.length <= maxLength,
      errorMessage: errorMessage || `Maximum length is ${maxLength} characters`,
      priority: 90
    };
  }

  /**
   * Create a pattern matching rule
   */
  static pattern(pattern: RegExp, errorMessage: string = 'Invalid format'): ValidationRule {
    return {
      id: `pattern-${pattern.source}`,
      validate: (input: string) => pattern.test(input),
      errorMessage,
      priority: 80
    };
  }

  /**
   * Create an email validation rule
   */
  static email(errorMessage: string = 'Invalid email address'): ValidationRule {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      id: 'email',
      validate: (input: string) => emailPattern.test(input),
      errorMessage,
      priority: 80
    };
  }

  /**
   * Create a numeric validation rule
   */
  static numeric(errorMessage: string = 'Must be a number'): ValidationRule {
    return {
      id: 'numeric',
      validate: (input: string) => !isNaN(Number(input)) && input.trim() !== '',
      errorMessage,
      priority: 80
    };
  }

  /**
   * Create a range validation rule
   */
  static range(min: number, max: number, errorMessage?: string): ValidationRule {
    return {
      id: `range-${min}-${max}`,
      validate: (input: string) => {
        const num = Number(input);
        return !isNaN(num) && num >= min && num <= max;
      },
      errorMessage: errorMessage || `Value must be between ${min} and ${max}`,
      priority: 80
    };
  }

  /**
   * Create a custom validation rule
   */
  static custom(
    id: string,
    validateFn: (input: string) => boolean,
    errorMessage: string,
    priority: number = 50
  ): ValidationRule {
    return {
      id,
      validate: validateFn,
      errorMessage,
      priority
    };
  }
}

/**
 * Singleton instance for global use
 */
export const validationEngine = new ValidationEngine();
