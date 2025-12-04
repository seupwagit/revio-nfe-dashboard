/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Declaração de módulo para react-dom/client
declare module 'react-dom/client' {
  import { ReactNode } from 'react'
  
  export interface Root {
    render(children: ReactNode): void
    unmount(): void
  }
  
  export interface RootOptions {
    identifierPrefix?: string
    onRecoverableError?: (error: Error) => void
  }
  
  export function createRoot(
    container: Element | DocumentFragment,
    options?: RootOptions
  ): Root
  
  export function hydrateRoot(
    container: Element | Document,
    initialChildren: ReactNode,
    options?: RootOptions
  ): Root
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_BEARER_TOKEN: string
  readonly VITE_DB_HOST: string
  readonly VITE_DB_DATABASE: string
  readonly VITE_DB_COLLECTION: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_DEFAULT_PAGE: string
  readonly VITE_MAX_DATE_RANGE_DAYS: string
  readonly VITE_DEFAULT_DATE_RANGE_DAYS: string
  readonly VITE_ANALYTICS_PAGE_SIZE: string
  readonly VITE_MONGODB_PROXY_PORT: string
  readonly VITE_CACHE_DURATION_MINUTES: string
  readonly VITE_MONGODB_CONNECTION_STRING: string
  readonly VITE_API_GOOGLE_GEMINI: string
  readonly VITE_QUERY_TIMEOUT_MS: string
  readonly VITE_MAX_PAGE_SIZE: string
  readonly VITE_S3_ENDPOINT: string
  readonly VITE_S3_ACCESS_KEY: string
  readonly VITE_S3_SECRET_KEY: string
  readonly VITE_S3_BUCKET: string
  readonly VITE_S3_REGION: string
  readonly VITE_DB_SERVER: string
  readonly VITE_DB_USER: string
  readonly VITE_DB_PASSWORD: string
  readonly VITE_PORT: string
  readonly VITE_AGGREGATION_PORT: string
  readonly VITE_PUBLIC_BUILDER_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
