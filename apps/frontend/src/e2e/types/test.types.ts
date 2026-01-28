/**
 * Tipos TypeScript para Testes E2E
 * Baseado em .kiro/steering/code-quality-rules.md
 * Seguindo .kiro/steering/testing-environment-rules.md
 */

// Tipos para usuários de teste
export interface TestUser {
  readonly email: string;
  readonly password: string;
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface TestUsers {
  readonly ADMIN: TestUser;
  readonly MASTER: TestUser;
  readonly REGULAR_USER: TestUser;
}

// Tipos para telas de teste
export interface TestScreen {
  readonly name: string;
  readonly path: string;
  readonly testId: string;
  readonly description?: string;
  readonly requiresNFeData?: boolean;
  readonly hasFilters?: boolean;
}

// Tipos para dados de NFe de teste
export interface TestNFeData {
  readonly id: string;
  readonly numero: string;
  readonly serie: string;
  readonly chaveAcesso: string;
  readonly dataEmissao: string;
  readonly valorTotal: number;
  readonly status: 'autorizada' | 'cancelada' | 'processando';
  readonly emitente: TestEmitente;
  readonly destinatario: TestDestinatario;
  readonly produtos: readonly TestProduto[];
}

export interface TestEmitente {
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeFantasia?: string;
}

export interface TestDestinatario {
  readonly cnpj: string;
  readonly razaoSocial: string;
}

export interface TestProduto {
  readonly codigo: string;
  readonly descricao: string;
  readonly quantidade: number;
  readonly valorUnitario: number;
  readonly valorTotal: number;
}

// Tipos para resposta de API de teste
export interface TestApiResponse<T = any> {
  readonly success: boolean;
  readonly data: T;
  readonly pagination?: TestPagination;
  readonly metadata?: TestMetadata;
}

export interface TestPagination {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly itemsPerPage: number;
}

export interface TestMetadata {
  readonly collection: string;
  readonly queryTime: string;
  readonly lastUpdate: string;
  readonly groupingConfig?: TestGroupingConfig;
}

export interface TestGroupingConfig {
  readonly enabled: boolean;
  readonly strategy: string;
  readonly fields: readonly string[];
}

// Tipos para analytics de teste
export interface TestAnalyticsData {
  readonly summary: TestAnalyticsSummary;
  readonly statusBreakdown: Record<string, number>;
  readonly volumeOverTime: readonly TestVolumeData[];
  readonly topEmitters: readonly TestEmitterData[];
}

export interface TestAnalyticsSummary {
  readonly totalCount: number;
  readonly totalValue: number;
  readonly averageValue: number;
}

export interface TestVolumeData {
  readonly date: string;
  readonly count: number;
  readonly value: number;
}

export interface TestEmitterData {
  readonly name: string;
  readonly count: number;
  readonly value: number;
}

// Tipos para configuração de interceptadores
export interface TestInterceptorConfig {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly url: string;
  readonly response: any;
  readonly alias?: string;
  readonly statusCode?: number;
  readonly delay?: number;
}

// Tipos para configuração de testes de performance
export interface TestPerformanceConfig {
  readonly maxLoadTime: number;
  readonly maxMemoryIncrease: number;
  readonly maxWarnings: number;
}

// Constantes de teste
export const TEST_PERFORMANCE_LIMITS = {
  MAX_LOAD_TIME: 10000, // 10 segundos
  MAX_MEMORY_INCREASE: 50, // 50MB
  MAX_WARNINGS: 3,
  ACCEPTABLE_LOAD_TIME: 3000, // 3 segundos
  FAST_LOAD_TIME: 1500 // 1.5 segundos
} as const;

export const TEST_TIMEOUTS = {
  DEFAULT: 10000,
  EXTENDED: 15000,
  NETWORK: 30000,
  STABILITY: 500
} as const;

export const TEST_DATA_TESTIDS = {
  // Componentes principais
  DASHBOARD: 'stats-cards',
  ANALYTICS: 'analytics-charts',
  GRID_NFE: 'grid-nfe-simples',
  GRID_PAGINADA: 'grid-paginada',
  
  // Elementos de interface
  LOADING_SPINNER: 'loading-spinner',
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  
  // Filtros e controles
  DATA_INICIO: 'data-inicio',
  DATA_FIM: 'data-fim',
  APLICAR_FILTROS: 'aplicar-filtros',
  LIMPAR_FILTROS: 'limpar-filtros',
  
  // Coleções
  COLLECTION_NFE: 'collection-nfe',
  COLLECTION_SELECTOR: 'collection-selector',
  
  // Botões de ação
  VISUALIZAR_BUTTON: 'visualizar-button',
  EXPORTAR_BUTTON: 'exportar-button',
  RETRY_BUTTON: 'retry-button',
  
  // Modais
  DANFE_VIEWER_MODAL: 'danfe-viewer-modal',
  CLOSE_MODAL: 'close-modal',
  
  // Estados especiais
  EMPTY_STATE: 'empty-state',
  ERROR_BOUNDARY: 'error-boundary'
} as const;