/**
 * Monitoring Target Interface
 */

export interface MonitoringTarget {
  /** Target identifier */
  id: string;
  
  /** Target type */
  type: 'download' | 'status' | 'health';
  
  /** Target URL or endpoint */
  endpoint: string;
  
  /** Last check timestamp */
  lastCheck: number;
  
  /** Check interval in milliseconds */
  interval: number;
  
  /** Whether target is active */
  active: boolean;
  
  /** Target-specific configuration */
  config?: Record<string, any>;
}