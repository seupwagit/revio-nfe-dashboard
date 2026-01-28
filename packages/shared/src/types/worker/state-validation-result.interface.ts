/**
 * State Validation Result Interface
 */

export interface StateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  migrationNeeded: boolean;
}