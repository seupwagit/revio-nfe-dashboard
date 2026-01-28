/**
 * State Validation and Migration Utilities
 * Handles validation and migration of worker state data
 */

import {
    DEFAULT_MONITORING_CONFIG,
    EnhancedWorkerState,
    LogLevel,
    StateValidationResult,
    WorkerStatus
} from '../types/worker-state.interface';

/**
 * Current state version for migration tracking
 */
export const CURRENT_STATE_VERSION = '1.0.0';

/**
 * Validates enhanced worker state structure and data
 */
export function validateWorkerState(state: any): StateValidationResult {
  const result: StateValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    migrationNeeded: false
  };

  // Check if state exists
  if (!state) {
    result.isValid = false;
    result.errors.push('State is null or undefined');
    return result;
  }

  // Validate required fields
  const requiredFields = ['workerId', 'status', 'lastUpdated', 'config'];
  for (const field of requiredFields) {
    if (!(field in state)) {
      result.isValid = false;
      result.errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate workerId
  if (state.workerId && typeof state.workerId !== 'string') {
    result.isValid = false;
    result.errors.push('workerId must be a string');
  }

  // Validate status
  const validStatuses: WorkerStatus[] = [
    'initializing', 'running', 'paused', 'stopped', 'error', 'recovering'
  ];
  if (state.status && !validStatuses.includes(state.status)) {
    result.isValid = false;
    result.errors.push(`Invalid status: ${state.status}`);
  }

  // Validate timestamps
  if (state.lastUpdated && !isValidTimestamp(state.lastUpdated)) {
    result.isValid = false;
    result.errors.push('lastUpdated must be a valid timestamp');
  }

  // Validate persistence state
  if (state.persistence) {
    validatePersistenceState(state.persistence, result);
  }

  // Validate recovery state
  if (state.recovery) {
    validateRecoveryState(state.recovery, result);
  }

  // Validate configuration
  if (state.config) {
    validateConfiguration(state.config, result);
  }

  // Check for version migration
  if (state.persistence?.version !== CURRENT_STATE_VERSION) {
    result.migrationNeeded = true;
    result.warnings.push(`State version ${state.persistence?.version || 'unknown'} needs migration to ${CURRENT_STATE_VERSION}`);
  }

  // Check state age
  if (state.persistence?.expiresAt && Date.now() > state.persistence.expiresAt) {
    result.isValid = false;
    result.errors.push('State has expired');
  }

  return result;
}

/**
 * Validates persistence state structure
 */
function validatePersistenceState(persistence: any, result: StateValidationResult): void {
  if (typeof persistence.enabled !== 'boolean') {
    result.errors.push('persistence.enabled must be a boolean');
    result.isValid = false;
  }

  if (persistence.lastSaved && !isValidTimestamp(persistence.lastSaved)) {
    result.errors.push('persistence.lastSaved must be a valid timestamp');
    result.isValid = false;
  }

  if (persistence.version && typeof persistence.version !== 'string') {
    result.errors.push('persistence.version must be a string');
    result.isValid = false;
  }

  if (persistence.expiresAt && !isValidTimestamp(persistence.expiresAt)) {
    result.errors.push('persistence.expiresAt must be a valid timestamp');
    result.isValid = false;
  }
}

/**
 * Validates recovery state structure
 */
function validateRecoveryState(recovery: any, result: StateValidationResult): void {
  if (typeof recovery.attempts !== 'number' || recovery.attempts < 0) {
    result.errors.push('recovery.attempts must be a non-negative number');
    result.isValid = false;
  }

  if (recovery.lastRecovery && !isValidTimestamp(recovery.lastRecovery)) {
    result.errors.push('recovery.lastRecovery must be a valid timestamp');
    result.isValid = false;
  }

  if (typeof recovery.autoRecovery !== 'boolean') {
    result.errors.push('recovery.autoRecovery must be a boolean');
    result.isValid = false;
  }

  if (typeof recovery.backoffMultiplier !== 'number' || recovery.backoffMultiplier <= 0) {
    result.errors.push('recovery.backoffMultiplier must be a positive number');
    result.isValid = false;
  }
}

/**
 * Validates configuration structure
 */
function validateConfiguration(config: any, result: StateValidationResult): void {
  const numericFields = [
    'basePollingInterval', 'maxPollingInterval', 'minPollingInterval',
    'maxRetries', 'backoffMultiplier', 'maxBackoffTime',
    'maxStateAge', 'tokenRefreshBuffer', 'maxTokenRefreshRetries',
    'maxLogEntries'
  ];

  for (const field of numericFields) {
    if (config[field] !== undefined && (typeof config[field] !== 'number' || config[field] < 0)) {
      result.errors.push(`config.${field} must be a non-negative number`);
      result.isValid = false;
    }
  }

  const booleanFields = [
    'adaptivePolling', 'tabVisibilityOptimization', 'resourceOptimization',
    'persistAcrossSessions', 'stateEncryption', 'autoTokenRefresh',
    'enablePerformanceMetrics'
  ];

  for (const field of booleanFields) {
    if (config[field] !== undefined && typeof config[field] !== 'boolean') {
      result.errors.push(`config.${field} must be a boolean`);
      result.isValid = false;
    }
  }

  // Validate log level
  const validLogLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  if (config.logLevel && !validLogLevels.includes(config.logLevel)) {
    result.errors.push(`config.logLevel must be one of: ${validLogLevels.join(', ')}`);
    result.isValid = false;
  }

  // Validate interval relationships
  if (config.minPollingInterval && config.maxPollingInterval && 
      config.minPollingInterval > config.maxPollingInterval) {
    result.errors.push('config.minPollingInterval cannot be greater than maxPollingInterval');
    result.isValid = false;
  }

  if (config.basePollingInterval && config.minPollingInterval && 
      config.basePollingInterval < config.minPollingInterval) {
    result.warnings.push('config.basePollingInterval is less than minPollingInterval');
  }

  if (config.basePollingInterval && config.maxPollingInterval && 
      config.basePollingInterval > config.maxPollingInterval) {
    result.warnings.push('config.basePollingInterval is greater than maxPollingInterval');
  }
}

/**
 * Migrates state from older versions to current version
 */
export function migrateWorkerState(state: any): EnhancedWorkerState {
  // Create a copy to avoid mutating original
  const migratedState = JSON.parse(JSON.stringify(state));

  // Ensure all required fields exist with defaults
  if (!migratedState.workerId) {
    migratedState.workerId = generateWorkerId();
  }

  if (!migratedState.status) {
    migratedState.status = 'initializing';
  }

  if (!migratedState.lastUpdated) {
    migratedState.lastUpdated = Date.now();
  }

  if (!migratedState.config) {
    migratedState.config = { ...DEFAULT_MONITORING_CONFIG };
  } else {
    // Merge with defaults to ensure all config fields exist
    migratedState.config = { ...DEFAULT_MONITORING_CONFIG, ...migratedState.config };
  }

  // Ensure persistence state exists
  if (!migratedState.persistence) {
    migratedState.persistence = {
      enabled: true,
      lastSaved: Date.now(),
      version: CURRENT_STATE_VERSION,
      expiresAt: Date.now() + DEFAULT_MONITORING_CONFIG.maxStateAge
    };
  } else {
    migratedState.persistence.version = CURRENT_STATE_VERSION;
    if (!migratedState.persistence.expiresAt) {
      migratedState.persistence.expiresAt = Date.now() + DEFAULT_MONITORING_CONFIG.maxStateAge;
    }
  }

  // Ensure recovery state exists
  if (!migratedState.recovery) {
    migratedState.recovery = {
      attempts: 0,
      lastRecovery: 0,
      autoRecovery: true,
      backoffMultiplier: DEFAULT_MONITORING_CONFIG.backoffMultiplier
    };
  }

  // Ensure metrics exist
  if (!migratedState.metrics) {
    migratedState.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastCheck: Date.now()
    };
  }

  // Ensure auth state exists
  if (!migratedState.auth) {
    migratedState.auth = {
      isAuthenticated: false,
      refreshAttempts: 0,
      autoRefresh: DEFAULT_MONITORING_CONFIG.autoTokenRefresh
    };
  }

  // Ensure targets array exists
  if (!migratedState.targets) {
    migratedState.targets = [];
  }

  return migratedState as EnhancedWorkerState;
}

/**
 * Generates a unique worker ID
 */
function generateWorkerId(): string {
  return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates if a value is a valid timestamp
 */
function isValidTimestamp(value: any): boolean {
  return typeof value === 'number' && 
         value > 0 && 
         value <= Date.now() + (365 * 24 * 60 * 60 * 1000); // Not more than 1 year in future
}

/**
 * Creates a new enhanced worker state with defaults
 */
export function createDefaultWorkerState(): EnhancedWorkerState {
  const now = Date.now();
  
  return {
    workerId: generateWorkerId(),
    status: 'initializing',
    lastUpdated: now,
    config: { ...DEFAULT_MONITORING_CONFIG },
    persistence: {
      enabled: true,
      lastSaved: now,
      version: CURRENT_STATE_VERSION,
      expiresAt: now + DEFAULT_MONITORING_CONFIG.maxStateAge
    },
    recovery: {
      attempts: 0,
      lastRecovery: 0,
      autoRecovery: true,
      backoffMultiplier: DEFAULT_MONITORING_CONFIG.backoffMultiplier
    },
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastCheck: now
    },
    auth: {
      isAuthenticated: false,
      refreshAttempts: 0,
      autoRefresh: DEFAULT_MONITORING_CONFIG.autoTokenRefresh
    },
    targets: []
  };
}