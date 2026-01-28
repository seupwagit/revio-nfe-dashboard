/**
 * Performance Metrics Interface
 */

export interface PerformanceMetrics {
  /** Total requests made */
  totalRequests: number;
  
  /** Successful requests */
  successfulRequests: number;
  
  /** Failed requests */
  failedRequests: number;
  
  /** Average response time */
  averageResponseTime: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** CPU usage percentage */
  cpuUsage: number;
  
  /** Last performance check */
  lastCheck: number;
}