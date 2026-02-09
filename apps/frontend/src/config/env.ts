// Configurações de ambiente centralizadas para o frontend
export const env = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    bearerToken: import.meta.env.VITE_API_BEARER_TOKEN || '',
    externalUrl: import.meta.env.VITE_EXTERNAL_API_URL || 'http://apinfe.revio.digital/api',
    revioApiUrl: import.meta.env.VITE_REVIO_API_URL || 'https://api.revio.com.br/api/v1',
    googleApiUrl: import.meta.env.VITE_GOOGLE_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
  },
  database: {
    host: import.meta.env.VITE_DB_HOST || 'localhost',
    database: import.meta.env.VITE_DB_DATABASE || 'revio_nfe',
    collection: import.meta.env.VITE_DB_COLLECTION || 'tbl_nfe_100',
  },
  defaults: {
    dashboardPageSize: Number(import.meta.env.VITE_DEFAULT_DASHBOARD_PAGE_SIZE) || 1000,
    page: Number(import.meta.env.VITE_DEFAULT_PAGE) || 1,
    maxDateRangeDays: Number(import.meta.env.VITE_MAX_DATE_RANGE_DAYS) || 365,
    analyticsPageSize: Number(import.meta.env.VITE_ANALYTICS_PAGE_SIZE) || 10000,
    maxPageSize: Number(import.meta.env.VITE_MAX_PAGE_SIZE) || 50000,
  }
}

// Validação de variáveis obrigatórias para o frontend
export function validateEnv() {
  const required = [
    { key: 'VITE_API_BASE_URL', value: env.api.baseUrl },
  ]

  const missing = required.filter(({ value }) => !value)
  
  if (missing.length > 0) {
    console.error('Variáveis de ambiente obrigatórias não configuradas:', 
      missing.map(({ key }) => key).join(', ')
    )
    return false
  }
  
  return true
}
