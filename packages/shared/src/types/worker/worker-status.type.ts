/**
 * Worker Status Type
 */

export type WorkerStatus = 
  | 'initializing'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error'
  | 'recovering';