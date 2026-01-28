/**
 * Rate Limit Types for Input Performance Optimization
 * 
 * Defines types for backend rate limiting middleware.
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

/**
 * Interfaces locais para evitar dependência direta do express no pacote shared
 */
export interface GenericRequest {
  ip?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

export interface GenericResponse {
  status: (code: number) => GenericResponse;
  send: (body: any) => GenericResponse;
  json: (body: any) => GenericResponse;
  [key: string]: any;
}

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: GenericRequest) => string;
  handler?: (req: GenericRequest, res: GenericResponse) => void;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitEntry {
  key: string;
  requests: number[];
  windowStart: number;
  windowEnd: number;
  blocked: boolean;
}

export interface RateLimitStats {
  requests: number;
  remaining: number;
  resetTime: number;
  limit: number;
}

export interface RateLimitViolation {
  ip: string;
  endpoint: string;
  timestamp: number;
  requestCount: number;
  limit: number;
}
