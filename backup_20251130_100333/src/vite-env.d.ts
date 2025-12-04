/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_BEARER_TOKEN: string
  readonly VITE_DB_HOST: string
  readonly VITE_DB_DATABASE: string
  readonly VITE_DB_COLLECTION: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_DEFAULT_PAGE: string
  readonly VITE_MAX_DATE_RANGE_DAYS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
