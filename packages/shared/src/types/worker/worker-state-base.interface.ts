/**
 * Base Worker State Interface
 */

import { MonitoringConfig } from './monitoring-config.interface';
import { WorkerStatus } from './worker-status.type';

export interface WorkerStateBase {
  /** Unique identifier for the worker instance */
  workerId: string;
  
  /** Current operational status */
  status: WorkerStatus;
  
  /** Timestamp when state was last updated */
  lastUpdated: number;
  
  /** Current configuration */
  config: MonitoringConfig;
}