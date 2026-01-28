/**
 * Recovery Reason Type
 */

export type RecoveryReason = 
  | 'network_failure'
  | 'auth_failure'
  | 'worker_crash'
  | 'browser_refresh'
  | 'manual_restart';