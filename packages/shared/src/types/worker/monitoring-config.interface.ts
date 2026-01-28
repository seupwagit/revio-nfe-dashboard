/**
 * Monitoring Configuration Interface
 */

import { LogLevel } from './log-level.type';

export interface MonitoringConfig {
  /** Base polling interval in milliseconds */
  basePollingInterval: number;
  
  /** Maximum polling interval */
  maxPollingInterval: number;
  
  /** Minimum polling interval */
  minPollingInterval: number;
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Backoff multiplier */
  backoffMultiplier: number;
  
  /** Maximum backoff time */
  maxBackoffTime: number;
  
  /** Enable adaptive polling */
  adaptivePolling: boolean;
  
  /** Tab visibility optimization */
  tabVisibilityOptimization: boolean;
  
  /** Resource optimization */
  resourceOptimization: boolean;
  
  /** Persist across sessions */
  persistAcrossSessions: boolean;
  
  /** State encryption */
  stateEncryption: boolean;
  
  /** Maximum state age */
  maxStateAge: number;
  
  /** Auto token refresh */
  autoTokenRefresh: boolean;
  
  /** Token refresh buffer */
  tokenRefreshBuffer: number;
  
  /** Max token refresh retries */
  maxTokenRefreshRetries: number;
  
  /** Logging level */
  logLevel: LogLevel;
  
  /** Enable performance metrics */
  enablePerformanceMetrics: boolean;
  
  /** Maximum log entries */
  maxLogEntries: number;
}