/**
 * Recovery State Interface
 */

import { RecoveryReason } from './recovery-reason.type';

export interface RecoveryState {
  /** Number of recovery attempts */
  attempts: number;
  
  /** Last recovery timestamp */
  lastRecovery: number;
  
  /** Recovery reason */
  reason?: RecoveryReason;
  
  /** Whether auto-recovery is enabled */
  autoRecovery: boolean;
  
  /** Backoff multiplier for recovery attempts */
  backoffMultiplier: number;
}