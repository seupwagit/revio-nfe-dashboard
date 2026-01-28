/**
 * Worker Constants
 */

import { MonitoringConfig } from '../types/worker/monitoring-config.interface';

export class WorkerConstants {
  static readonly DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
    basePollingInterval: 30000,
    maxPollingInterval: 300000,
    minPollingInterval: 5000,
    maxRetries: 3,
    backoffMultiplier: 2,
    maxBackoffTime: 600000,
    adaptivePolling: true,
    tabVisibilityOptimization: true,
    resourceOptimization: true,
    persistAcrossSessions: true,
    stateEncryption: true,
    maxStateAge: 86400000,
    autoTokenRefresh: true,
    tokenRefreshBuffer: 300000,
    maxTokenRefreshRetries: 3,
    logLevel: 'info',
    enablePerformanceMetrics: true,
    maxLogEntries: 1000
  } as const;

  static readonly POLLING = {
    BASE_INTERVAL: 30000,
    MAX_INTERVAL: 300000,
    MIN_INTERVAL: 5000,
    MAX_RETRIES: 3,
    BACKOFF_MULTIPLIER: 2,
    MAX_BACKOFF_TIME: 600000
  } as const;

  static readonly STATE = {
    MAX_AGE: 86400000,        // 24 horas
    TOKEN_REFRESH_BUFFER: 300000,  // 5 minutos
    MAX_TOKEN_REFRESH_RETRIES: 3,
    MAX_LOG_ENTRIES: 1000
  } as const;
}