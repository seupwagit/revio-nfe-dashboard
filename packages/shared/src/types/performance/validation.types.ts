/**
 * Validation Types for Input Performance Optimization
 * 
 * Defines types for synchronous validation engine that runs before network calls.
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

export interface ValidationRule {
  id: string;
  validate: (input: string) => boolean;
  errorMessage: string;
  priority?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedValue: string;
  timestamp: number;
}

export interface ValidationEngineConfig {
  rules: ValidationRule[];
  stopOnFirstError?: boolean;
}

export type ValidationRuleType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'custom';

export interface BuiltInValidationRule extends ValidationRule {
  type: ValidationRuleType;
  params?: Record<string, any>;
}
