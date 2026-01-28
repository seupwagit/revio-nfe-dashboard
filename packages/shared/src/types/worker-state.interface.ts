/**
 * Enhanced Worker State Management Interface
 * Supports persistence and recovery across browser sessions
 * 
 * REFATORADO: Este arquivo agora re-exporta tipos organizados
 * seguindo as regras de organização de constantes e tipos.
 */

// Importar constantes diretamente
import { WorkerConstants } from '../constants/worker.constants';

// Re-exportar todos os tipos organizados com importações diretas
export * from './worker/authentication-state.interface';
export * from './worker/enhanced-worker-state.interface';
export * from './worker/log-level.type';
export * from './worker/monitoring-config.interface';
export * from './worker/monitoring-target.interface';
export * from './worker/performance-metrics.interface';
export * from './worker/persistence-state.interface';
export * from './worker/recovery-reason.type';
export * from './worker/recovery-state.interface';
export * from './worker/state-validation-result.interface';
export * from './worker/worker-state-base.interface';
export * from './worker/worker-status.type';

// Re-exportar constantes (compatibilidade com código existente)
export { WorkerConstants };

// Alias para compatibilidade com código existente
export const DEFAULT_MONITORING_CONFIG = WorkerConstants.DEFAULT_MONITORING_CONFIG;