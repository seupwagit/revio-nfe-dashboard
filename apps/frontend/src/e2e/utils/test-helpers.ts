/**
 * Utilitários para Testes E2E
 * Baseado em .kiro/steering/code-quality-rules.md
 * Seguindo .kiro/steering/testing-environment-rules.md
 */

// Relative imports
import type {
    TestInterceptorConfig,
    TestPerformanceConfig,
    TestScreen
} from '../types/test.types';
import {
    TEST_PERFORMANCE_LIMITS,
    TEST_TIMEOUTS
} from '../types/test.types';

/**
 * Classe utilitária para helpers de teste E2E
 */
export class TestHelpers {
  /**
   * Configura interceptadores de API padrão para testes NFe
   */
  static setupDefaultInterceptors(): void {
    cy.log('[HELPERS] 🔧 Configurando interceptadores padrão');
    
    const interceptors: TestInterceptorConfig[] = [
      {
        method: 'GET',
        url: '**/api/documents**',
        response: { fixture: 'nfe-sample-data.json' },
        alias: 'getNFeData'
      },
      {
        method: 'GET',
        url: '**/api/analytics/**',
        response: { fixture: 'analytics-data.json' },
        alias: 'getAnalytics'
      },
      {
        method: 'GET',
        url: '**/api/auth/me',
        response: {
          body: {
            success: true,
            user: {
              id: '1',
              name: 'Admin User',
              email: 'divino@grupochama.com.br',
              role: 'admin'
            }
          }
        },
        alias: 'getUser'
      }
    ];
    
    interceptors.forEach(config => {
      cy.intercept(config.method, config.url, config.response).as(config.alias || 'apiCall');
    });
    
    cy.log('[HELPERS] ✅ Interceptadores configurados');
  }

  /**
   * Configura interceptador para simular erro de rede
   */
  static setupNetworkErrorInterceptor(): void {
    cy.log('[HELPERS] 🌐 Configurando interceptador de erro de rede');
    
    cy.intercept('GET', '**/api/documents**', { 
      forceNetworkError: true 
    }).as('networkError');
    
    cy.log('[HELPERS] ✅ Interceptador de erro configurado');
  }

  /**
   * Configura interceptador para simular erro de servidor
   */
  static setupServerErrorInterceptor(statusCode: number = 500): void {
    cy.log(`[HELPERS] 🚨 Configurando interceptador de erro ${statusCode}`);
    
    cy.intercept('GET', '**/api/documents**', {
      statusCode,
      body: { error: 'Internal Server Error' }
    }).as('serverError');
    
    cy.log('[HELPERS] ✅ Interceptador de erro de servidor configurado');
  }

  /**
   * Aguarda carregamento completo de uma tela NFe
   */
  static waitForNFeScreenLoad(screen: TestScreen): void {
    cy.log(`[HELPERS] ⏳ Aguardando carregamento de ${screen.name}`);
    
    // Aguardar carregamento básico
    cy.waitForLoad();
    
    // Aguardar elemento principal da tela
    cy.get(`[data-testid="${screen.testId}"]`, { 
      timeout: TEST_TIMEOUTS.EXTENDED 
    }).should('be.visible');
    
    // Se a tela requer dados NFe, aguardar carregamento específico
    if (screen.requiresNFeData) {
      cy.waitForNFeData();
      cy.verifyNFeDataLoaded();
    }
    
    cy.log(`[HELPERS] ✅ ${screen.name} carregada completamente`);
  }

  /**
   * Aplica filtros de data em telas que suportam
   */
  static applyDateFilters(dataInicio: string, dataFim: string): void {
    cy.log(`[HELPERS] 📅 Aplicando filtros de data: ${dataInicio} a ${dataFim}`);
    
    cy.get('[data-testid="data-inicio"]')
      .should('be.visible')
      .clear()
      .type(dataInicio);
    
    cy.get('[data-testid="data-fim"]')
      .should('be.visible')
      .clear()
      .type(dataFim);
    
    cy.get('[data-testid="aplicar-filtros"]')
      .should('be.visible')
      .click();
    
    cy.waitForLoad();
    
    cy.log('[HELPERS] ✅ Filtros de data aplicados');
  }

  /**
   * Limpa filtros aplicados
   */
  static clearFilters(): void {
    cy.log('[HELPERS] 🧹 Limpando filtros');
    
    cy.get('[data-testid="limpar-filtros"]')
      .should('be.visible')
      .click();
    
    cy.waitForLoad();
    
    cy.log('[HELPERS] ✅ Filtros limpos');
  }

  /**
   * Verifica se não há erros de console críticos
   */
  static verifyNoConsoleErrors(): void {
    cy.log('[HELPERS] 🔍 Verificando ausência de erros de console');
    
    cy.get('@consoleError').should('not.have.been.called');
    
    cy.log('[HELPERS] ✅ Nenhum erro de console detectado');
  }

  /**
   * Verifica warnings de console dentro do limite aceitável
   */
  static verifyConsoleWarningsWithinLimit(maxWarnings: number = 3): void {
    cy.log(`[HELPERS] ⚠️ Verificando warnings de console (limite: ${maxWarnings})`);
    
    cy.get('@consoleWarn').then((stub: any) => {
      if (stub && stub.getCalls) {
        const calls = stub.getCalls();
        const warningCount = calls.length;
        
        cy.log(`[HELPERS] 📊 ${warningCount} warnings encontrados`);
        expect(warningCount).to.be.lessThan(maxWarnings + 1);
      }
    });
    
    cy.log('[HELPERS] ✅ Warnings dentro do limite aceitável');
  }

  /**
   * Mede performance de carregamento de tela
   */
  static measureScreenPerformance(
    screenName: string, 
    config: TestPerformanceConfig = {
      maxLoadTime: TEST_PERFORMANCE_LIMITS.MAX_LOAD_TIME,
      maxMemoryIncrease: TEST_PERFORMANCE_LIMITS.MAX_MEMORY_INCREASE,
      maxWarnings: TEST_PERFORMANCE_LIMITS.MAX_WARNINGS
    }
  ): void {
    cy.log(`[HELPERS] ⚡ Medindo performance de ${screenName}`);
    
    const startTime = Date.now();
    
    cy.then(() => {
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      cy.log(`[HELPERS] 📊 ${screenName} - Tempo de carregamento: ${loadTime}ms`);
      
      // Verificar se tempo está dentro do limite
      expect(loadTime).to.be.lessThan(config.maxLoadTime);
      
      // Classificar performance
      if (loadTime < TEST_PERFORMANCE_LIMITS.FAST_LOAD_TIME) {
        cy.log(`[HELPERS] 🚀 ${screenName} - Performance excelente: ${loadTime}ms`);
      } else if (loadTime < TEST_PERFORMANCE_LIMITS.ACCEPTABLE_LOAD_TIME) {
        cy.log(`[HELPERS] ✅ ${screenName} - Performance boa: ${loadTime}ms`);
      } else {
        cy.log(`[HELPERS] ⚠️ ${screenName} - Performance aceitável: ${loadTime}ms`);
      }
    });
  }

  /**
   * Verifica consistência de dados entre diferentes telas
   */
  static verifyDataConsistency(
    sourceElement: string, 
    targetElement: string, 
    tolerance: number = 100
  ): void {
    cy.log('[HELPERS] 🔄 Verificando consistência de dados');
    
    let sourceValue: number;
    
    cy.get(sourceElement)
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        sourceValue = parseInt(text.replace(/\D/g, ''), 10);
        cy.log(`[HELPERS] 📊 Valor origem: ${sourceValue}`);
      });
    
    cy.get(targetElement)
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const targetValue = parseInt(text.replace(/\D/g, ''), 10);
        cy.log(`[HELPERS] 📊 Valor destino: ${targetValue}`);
        
        const difference = Math.abs(sourceValue - targetValue);
        cy.log(`[HELPERS] 📊 Diferença: ${difference} (tolerância: ${tolerance})`);
        
        expect(difference).to.be.lessThan(tolerance);
      });
    
    cy.log('[HELPERS] ✅ Dados consistentes');
  }

  /**
   * Simula erro JavaScript para testar tratamento
   */
  static simulateJavaScriptError(errorMessage: string = 'Simulated test error'): void {
    cy.log(`[HELPERS] ⚠️ Simulando erro JavaScript: ${errorMessage}`);
    
    cy.window().then((win) => {
      try {
        win.eval(`throw new Error("${errorMessage}")`);
      } catch (error) {
        cy.log('[HELPERS] ⚠️ Erro simulado injetado para teste');
      }
    });
  }

  /**
   * Verifica se aplicação se recupera graciosamente de erros
   */
  static verifyGracefulErrorRecovery(mainElementTestId: string): void {
    cy.log('[HELPERS] 🛡️ Verificando recuperação graciosa de erros');
    
    // Verificar se aplicação ainda funciona
    cy.get(`[data-testid="${mainElementTestId}"]`)
      .should('be.visible');
    
    // Verificar se não há error boundary ativo
    cy.get('[data-testid="error-boundary"]')
      .should('not.exist');
    
    cy.log('[HELPERS] ✅ Aplicação se recuperou graciosamente');
  }

  /**
   * Verifica uso de memória dentro dos limites
   */
  static verifyMemoryUsage(
    initialMemory: number, 
    maxIncrease: number = TEST_PERFORMANCE_LIMITS.MAX_MEMORY_INCREASE
  ): void {
    cy.log('[HELPERS] 💾 Verificando uso de memória');
    
    cy.window().then((win) => {
      if (win.performance && (win.performance as any).memory) {
        const currentMemory = (win.performance as any).memory.usedJSHeapSize;
        const memoryIncrease = (currentMemory - initialMemory) / 1024 / 1024;
        
        cy.log(`[HELPERS] 💾 Aumento de memória: ${memoryIncrease.toFixed(2)} MB`);
        
        expect(memoryIncrease).to.be.lessThan(maxIncrease);
        
        cy.log('[HELPERS] ✅ Uso de memória dentro dos limites');
      } else {
        cy.log('[HELPERS] ℹ️ API de memória não disponível');
      }
    });
  }

  /**
   * Executa teste de acessibilidade básico
   */
  static verifyBasicAccessibility(): void {
    cy.log('[HELPERS] ♿ Verificando acessibilidade básica');
    
    // Verificar se há elementos com aria-labels apropriados
    cy.get('button').each(($button) => {
      const hasAriaLabel = $button.attr('aria-label') || $button.text().trim();
      expect(hasAriaLabel).to.exist;
    });
    
    // Verificar contraste básico (elementos visíveis devem ter texto)
    cy.get('[data-testid]').each(($element) => {
      if ($element.is(':visible')) {
        const hasContent = $element.text().trim() || $element.attr('aria-label');
        if (!hasContent && !$element.find('*').length) {
          cy.log(`[HELPERS] ⚠️ Elemento sem conteúdo: ${$element.attr('data-testid')}`);
        }
      }
    });
    
    cy.log('[HELPERS] ✅ Verificação de acessibilidade concluída');
  }
}

/**
 * Constantes para telas NFe de teste
 */
export const NFE_TEST_SCREENS: readonly TestScreen[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    testId: 'stats-cards',
    description: 'Tela principal com estatísticas',
    requiresNFeData: false,
    hasFilters: false
  },
  {
    name: 'Analytics',
    path: '/analytics',
    testId: 'analytics-charts',
    description: 'Tela de análises e gráficos',
    requiresNFeData: false,
    hasFilters: true
  },
  {
    name: 'Documentos Fiscais',
    path: '/documentos-fiscais',
    testId: 'collection-nfe',
    description: 'Tela de documentos fiscais',
    requiresNFeData: true,
    hasFilters: true
  },
  {
    name: 'Grid NFe Simples',
    path: '/grid-nfe',
    testId: 'grid-paginada',
    description: 'Grid simples de NFe',
    requiresNFeData: true,
    hasFilters: true
  },
  {
    name: 'Notas Fiscais Unificada',
    path: '/notas-fiscais-unificada',
    testId: 'collection-selector',
    description: 'Tela unificada de notas fiscais',
    requiresNFeData: true,
    hasFilters: true
  }
] as const;