/**
 * Configuração de Validação para Testes E2E
 * Baseado em .kiro/steering/code-quality-rules.md
 * Seguindo .kiro/steering/testing-environment-rules.md
 */

// Relative imports
import type { TestPerformanceConfig } from '../types/test.types';

/**
 * Configurações de performance para diferentes tipos de tela
 */
export const PERFORMANCE_CONFIGS: Record<string, TestPerformanceConfig> = {
  dashboard: {
    maxLoadTime: 5000, // Dashboard deve carregar em até 5s
    maxMemoryIncrease: 30, // Máximo 30MB de aumento
    maxWarnings: 2 // Máximo 2 warnings
  },
  analytics: {
    maxLoadTime: 8000, // Analytics pode demorar mais (gráficos)
    maxMemoryIncrease: 40, // Máximo 40MB (gráficos consomem mais)
    maxWarnings: 3 // Máximo 3 warnings
  },
  grid: {
    maxLoadTime: 6000, // Grids com dados podem demorar mais
    maxMemoryIncrease: 35, // Máximo 35MB
    maxWarnings: 2 // Máximo 2 warnings
  },
  default: {
    maxLoadTime: 10000, // Padrão: 10 segundos
    maxMemoryIncrease: 50, // Padrão: 50MB
    maxWarnings: 3 // Padrão: 3 warnings
  }
} as const;

/**
 * Configurações de timeout para diferentes operações
 */
export const TIMEOUT_CONFIGS = {
  // Timeouts básicos
  DEFAULT_COMMAND: 10000,
  EXTENDED_WAIT: 15000,
  NETWORK_REQUEST: 30000,
  
  // Timeouts específicos por operação
  LOGIN: 10000,
  PAGE_LOAD: 15000,
  DATA_LOAD: 20000,
  EXPORT: 30000,
  
  // Timeouts de estabilização
  STABILITY_WAIT: 500,
  ANIMATION_WAIT: 1000,
  DEBOUNCE_WAIT: 300
} as const;

/**
 * Seletores padronizados para elementos de teste
 */
export const TEST_SELECTORS = {
  // Estados de carregamento
  LOADING: '[data-testid="loading-spinner"]',
  ERROR: '[data-testid="error-message"]',
  SUCCESS: '[data-testid="success-message"]',
  EMPTY_STATE: '[data-testid="empty-state"]',
  
  // Elementos de navegação
  USER_MENU: '[data-testid="user-menu"]',
  MAIN_NAVIGATION: '[data-testid="main-navigation"]',
  BREADCRUMB: '[data-testid="breadcrumb"]',
  
  // Formulários e filtros
  DATE_START: '[data-testid="data-inicio"]',
  DATE_END: '[data-testid="data-fim"]',
  APPLY_FILTERS: '[data-testid="aplicar-filtros"]',
  CLEAR_FILTERS: '[data-testid="limpar-filtros"]',
  
  // Grids e tabelas
  DATA_GRID: '[data-testid="grid-nfe-simples"]',
  PAGINATED_GRID: '[data-testid="grid-paginada"]',
  TABLE_ROWS: 'tbody tr',
  
  // Botões de ação
  EXPORT_BUTTON: 'button:contains("Exportar")',
  VISUALIZE_BUTTON: 'button:contains("Visualizar")',
  RETRY_BUTTON: '[data-testid="retry-button"]',
  
  // Modais
  DANFE_MODAL: '[data-testid="danfe-viewer-modal"]',
  CLOSE_MODAL: '[data-testid="close-modal"]',
  
  // Indicadores específicos
  DOCUMENT_TYPE: '[data-testid="document-type-indicator"]',
  COLLECTION_FILTER: '[data-testid="collection-filter"]',
  TOTAL_NFE: '[data-testid="total-nfe"]',
  TOTAL_DOCUMENTS: '[data-testid="total-documents"]'
} as const;

/**
 * Mensagens de erro esperadas para validação
 */
export const EXPECTED_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão',
  SERVER_ERROR: 'Erro interno do servidor',
  VALIDATION_ERROR: 'Dados inválidos',
  PERMISSION_ERROR: 'Acesso negado',
  NOT_FOUND: 'Não encontrado'
} as const;

/**
 * Configurações de interceptadores de API
 */
export const API_INTERCEPTOR_CONFIGS = {
  NFE_DATA: {
    method: 'GET' as const,
    url: '**/api/documents**',
    fixture: 'nfe-sample-data.json',
    alias: 'getNFeData'
  },
  ANALYTICS_DATA: {
    method: 'GET' as const,
    url: '**/api/analytics/**',
    fixture: 'analytics-data.json',
    alias: 'getAnalytics'
  },
  USER_DATA: {
    method: 'GET' as const,
    url: '**/api/auth/me',
    response: {
      success: true,
      user: {
        id: '1',
        name: 'Admin User',
        email: 'divino@grupochama.com.br',
        role: 'admin'
      }
    },
    alias: 'getUser'
  }
} as const;

/**
 * Configurações de validação de acessibilidade
 */
export const ACCESSIBILITY_CONFIGS = {
  // Elementos que devem ter aria-label
  REQUIRED_ARIA_ELEMENTS: [
    'button',
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'select'
  ],
  
  // Elementos que devem ter texto visível
  REQUIRED_TEXT_ELEMENTS: [
    'button',
    'a',
    'label'
  ],
  
  // Contraste mínimo (simplificado)
  MIN_CONTRAST_RATIO: 4.5
} as const;

/**
 * Configurações de validação de performance
 */
export const PERFORMANCE_THRESHOLDS = {
  // Tempos de carregamento (ms)
  EXCELLENT_LOAD_TIME: 1500,
  GOOD_LOAD_TIME: 3000,
  ACCEPTABLE_LOAD_TIME: 5000,
  MAX_LOAD_TIME: 10000,
  
  // Uso de memória (MB)
  LOW_MEMORY_INCREASE: 20,
  MODERATE_MEMORY_INCREASE: 35,
  HIGH_MEMORY_INCREASE: 50,
  
  // Warnings de console
  NO_WARNINGS: 0,
  FEW_WARNINGS: 2,
  ACCEPTABLE_WARNINGS: 3,
  
  // Métricas de rede
  MAX_REQUESTS_PER_PAGE: 20,
  MAX_TOTAL_TRANSFER_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_REQUEST_TIME: 2000 // 2 segundos
} as const;

/**
 * Configurações de retry para operações instáveis
 */
export const RETRY_CONFIGS = {
  // Número de tentativas
  DEFAULT_RETRIES: 3,
  NETWORK_RETRIES: 5,
  FLAKY_TEST_RETRIES: 2,
  
  // Delays entre tentativas (ms)
  SHORT_DELAY: 1000,
  MEDIUM_DELAY: 2000,
  LONG_DELAY: 5000
} as const;

/**
 * Validador de configuração de teste
 */
export class TestConfigValidator {
  /**
   * Valida se uma configuração de performance é válida
   */
  static validatePerformanceConfig(config: TestPerformanceConfig): boolean {
    return (
      config.maxLoadTime > 0 &&
      config.maxLoadTime <= PERFORMANCE_THRESHOLDS.MAX_LOAD_TIME &&
      config.maxMemoryIncrease > 0 &&
      config.maxMemoryIncrease <= PERFORMANCE_THRESHOLDS.HIGH_MEMORY_INCREASE &&
      config.maxWarnings >= 0 &&
      config.maxWarnings <= PERFORMANCE_THRESHOLDS.ACCEPTABLE_WARNINGS
    );
  }

  /**
   * Obtém configuração de performance para um tipo de tela
   */
  static getPerformanceConfig(screenType: string): TestPerformanceConfig {
    const config = PERFORMANCE_CONFIGS[screenType] || PERFORMANCE_CONFIGS.default;
    
    if (!this.validatePerformanceConfig(config)) {
      throw new Error(`[CONFIG] ❌ Configuração de performance inválida para ${screenType}`);
    }
    
    return config;
  }

  /**
   * Valida se um seletor de teste é válido
   */
  static validateTestSelector(selector: string): boolean {
    // Verificar se é um seletor data-testid válido
    const dataTestIdPattern = /^\[data-testid="[\w-]+"\]$/;
    const buttonContainsPattern = /^button:contains\(".+"\)$/;
    const generalSelectorPattern = /^[\w\s\[\]="':.-]+$/;
    
    return (
      dataTestIdPattern.test(selector) ||
      buttonContainsPattern.test(selector) ||
      generalSelectorPattern.test(selector)
    );
  }

  /**
   * Obtém timeout apropriado para uma operação
   */
  static getTimeout(operation: keyof typeof TIMEOUT_CONFIGS): number {
    const timeout = TIMEOUT_CONFIGS[operation];
    
    if (!timeout || timeout <= 0) {
      throw new Error(`[CONFIG] ❌ Timeout inválido para operação: ${operation}`);
    }
    
    return timeout;
  }
}

/**
 * Utilitário para logging estruturado de testes
 */
export class TestLogger {
  /**
   * Log de início de teste
   */
  static testStart(testName: string, context?: Record<string, any>): void {
    const message = `[TEST] 🧪 Iniciando: ${testName}`;
    cy.log(message, context);
  }

  /**
   * Log de sucesso de teste
   */
  static testSuccess(testName: string, metrics?: Record<string, any>): void {
    const message = `[TEST] ✅ Sucesso: ${testName}`;
    cy.log(message, metrics);
  }

  /**
   * Log de falha de teste
   */
  static testFailure(testName: string, error: string): void {
    const message = `[TEST] ❌ Falha: ${testName} - ${error}`;
    cy.log(message);
  }

  /**
   * Log de performance
   */
  static performance(operation: string, duration: number, threshold: number): void {
    const status = duration <= threshold ? '🚀' : duration <= threshold * 1.5 ? '✅' : '⚠️';
    const message = `[PERF] ${status} ${operation}: ${duration}ms (limite: ${threshold}ms)`;
    cy.log(message);
  }

  /**
   * Log de validação
   */
  static validation(item: string, isValid: boolean, details?: string): void {
    const status = isValid ? '✅' : '❌';
    const message = `[VALID] ${status} ${item}${details ? ` - ${details}` : ''}`;
    cy.log(message);
  }
}