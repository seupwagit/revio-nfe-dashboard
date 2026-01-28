/**
 * Enhanced Worker State Interface
 */

import { AuthenticationState } from './authentication-state.interface';
import { MonitoringTarget } from './monitoring-target.interface';
import { PerformanceMetrics } from './performance-metrics.interface';
import { PersistenceState } from './persistence-state.interface';
import { RecoveryState } from './recovery-state.interface';
import { WorkerStateBase } from './worker-state-base.interface';

export interface EnhancedWorkerState extends WorkerStateBase {
  /** Persistence and recovery fields */
  persistence: PersistenceState;
  
  /** Recovery information */
  recovery: RecoveryState;
  
  /** Performance metrics */
  metrics: PerformanceMetrics;
  
  /** Authentication state */
  auth: AuthenticationState;
  
  /** Current monitoring targets */
  targets: MonitoringTarget[];
}