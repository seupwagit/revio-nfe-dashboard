// Configurações de ambiente centralizadas
export const env = {
  api: {
    // Em produção, usa /api (proxy do nginx). Em dev, pode usar a URL completa
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    bearerToken: import.meta.env.VITE_API_BEARER_TOKEN || '',
  },
  database: {
    host: import.meta.env.VITE_DB_HOST || '10.0.0.8',
    database: import.meta.env.VITE_DB_DATABASE || '',
    collection: import.meta.env.VITE_DB_COLLECTION || '',
  },
  defaults: {
    pageSize: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 500,
    page: Number(import.meta.env.VITE_DEFAULT_PAGE) || 1,
    maxDateRangeDays: Number(import.meta.env.VITE_MAX_DATE_RANGE_DAYS) || 365,
  }
}

// Validação de variáveis obrigatórias
export function validateEnv() {
  const required = [
    { key: 'VITE_DB_HOST', value: env.database.host },
    { key: 'VITE_DB_DATABASE', value: env.database.database },
    { key: 'VITE_DB_COLLECTION', value: env.database.collection },
    { key: 'VITE_API_BEARER_TOKEN', value: env.api.bearerToken },
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
