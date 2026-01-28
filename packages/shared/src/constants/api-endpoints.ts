/**
 * API Endpoints Constants - Shared between frontend and backend
 * 
 * Centralized definition of all API endpoints to ensure consistency
 * and prevent typos in endpoint URLs
 */

export const API_ENDPOINTS = {
  DANFE: {
    PDF: '/api/danfe/pdf',
    STATUS: '/api/danfe/status',
    HEALTH: '/api/danfe/health',
    TEST: '/api/danfe/test',
    CACHE: {
      STATS: '/api/danfe/cache/stats',
      CLEAR: '/api/danfe/cache/clear',
      DELETE: '/api/danfe/cache'
    },
    TEMP: {
      FILES: '/api/danfe/temp/files',
      CLEANUP: '/api/danfe/temp/cleanup'
    }
  },
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY: '/api/auth/verify'
  },
  ANALYTICS: {
    BASE: '/api/analytics',
    DASHBOARD: '/api/analytics/dashboard',
    REPORTS: '/api/analytics/reports'
  },
  DOWNLOADS: {
    BASE: '/api/downloads',
    STATUS: '/api/downloads/status',
    CANCEL: '/api/downloads/cancel'
  },
  HEALTH: '/api/health',
  STATUS: '/api/status'
} as const;

/**
 * Helper functions to build endpoint URLs with parameters
 */
export const buildEndpoint = {
  danfePdf: (documentId: string) => `${API_ENDPOINTS.DANFE.PDF}/${documentId}`,
  danfeStatus: (documentId: string) => `${API_ENDPOINTS.DANFE.STATUS}/${documentId}`,
  danfeCacheDelete: (documentId: string) => `${API_ENDPOINTS.DANFE.CACHE.DELETE}/${documentId}`,
} as const;

/**
 * HTTP Methods constants
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD'
} as const;

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];

/**
 * Standard HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];