/**
 * Rate Limit Types for Input Performance Optimization
 * 
 * Defines types for backend rate limiting middleware.
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Request, Response } from 'express';

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
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
