// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify'
  },
  DANFE: {
    PDF: '/api/danfe/pdf',
    STATUS: '/api/danfe/status'
  },
  ANALYTICS: {
    BASE: '/api/analytics',
    SUMMARY: '/api/analytics/summary'
  },
  DOWNLOADS: {
    BASE: '/api/downloads',
    STATUS: '/api/downloads/status'
  },
  HEALTH: '/api/health'
} as const;

// Endpoint builders
export const buildEndpoint = {
  danfePdf: (documentId: string) => `/api/danfe/pdf/${documentId}`,
  danfeStatus: (documentId: string) => `/api/danfe/status/${documentId}`,
  analyticsData: (userId: string) => `/api/analytics/${userId}`,
  downloadStatus: (downloadId: string) => `/api/downloads/status/${downloadId}`
};