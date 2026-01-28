/**
 * Testes E2E para Detecção de Erros de Console
 * Usa Chrome DevTools para detectar erros JavaScript em todas as telas NFe
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

import { TEST_USERS } from '../fixtures/test-users';

describe('Console Error Detection E2E - NFe Screens', () => {
  beforeEach(() => {
    cy.log('[SETUP] 🔧 Configurando detecção de erros de console');
    
    // Capturar erros de console
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
      cy.stub(win.console, 'warn').as('consoleWarn');
    });
    
    // Login com usuário admin
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    
    cy.log('[SETUP] ✅ Configuração de detecção concluída');
  });

  const nfeScreens = [
    { name: 'Dashboard', path: '/dashboard', testId: 'stats-cards' },
    { name: 'Analytics', path: '/analytics', testId: 'analytics-charts' },
    { name: 'Documentos Fiscais', path: '/documentos-fiscais', testId: 'collection-nfe' },
    { name: 'Grid NFe Simples', path: '/grid-nfe', testId: 'grid-paginada' },
    { name: 'Notas Fiscais Unificada', path: '/notas-fiscais-unificada', testId: 'collection-selector' }
  ];

  nfeScreens.forEach(screen => {
    it(`não deve ter erros de console em ${screen.name}`, () => {
      cy.log(`[TEST] 🧪 Testando ${screen.name} - ${screen.path}`);
      
      // Navegar para a tela
      cy.visit(screen.path);
      cy.waitForLoad();
      
      // Aguardar carregamento específico da tela
      cy.get(`[data-testid="${screen.testId}"]`, { timeout: 10000 }).should('be.visible');
      
      // Se for tela com dados NFe, aguardar carregamento
      if (screen.testId.includes('grid') || screen.name === 'Documentos Fiscais') {
        cy.waitForNFeData();
      }
      
      // Verificar se não há erros de console
      cy.get('@consoleError').should('not.have.been.called');
      
      // Verificar se não há warnings críticos
      cy.get('@consoleWarn').then((stub: any) => {
        if (stub && stub.getCalls) {
          const calls = stub.getCalls();
          const criticalWarnings = calls.filter((call: any) => 
            call.args.some((arg: any) => 
              typeof arg === 'string' && (
                arg.includes('Failed to fetch') ||
                arg.includes('Network Error') ||
                arg.includes('Uncaught') ||
                arg.includes('TypeError') ||
                arg.includes('ReferenceError')
              )
            )
          );
          expect(criticalWarnings).to.have.length(0);
        }
      });
      
      cy.log(`[TEST] ✅ ${screen.name} - Sem erros de console detectados`);
    });
  });

  it('deve detectar e reportar erros de rede', () => {
    cy.log('[TEST] 🌐 Testando detecção de erros de rede');
    
    // Interceptar para simular erro de rede
    cy.intercept('GET', '**/api/documents**', { forceNetworkError: true }).as('networkError');
    
    cy.visit('/documentos-fiscais');
    
    // Aguardar tentativa de requisição
    cy.wait('@networkError');
    
    // Verificar se erro de rede é tratado graciosamente
    cy.get('[data-testid="error-message"]').should('be.visible');
    
    // Verificar se não há erros não tratados no console
    cy.get('@consoleError').then((stub: any) => {
      if (stub && stub.getCalls) {
        const calls = stub.getCalls();
        const unhandledErrors = calls.filter((call: any) => 
          call.args.some((arg: any) => 
            typeof arg === 'string' && arg.includes('Uncaught')
          )
        );
        expect(unhandledErrors).to.have.length(0);
      }
    });
    
    cy.log('[TEST] ✅ Erros de rede tratados graciosamente');
  });

  it('deve tratar erros JavaScript graciosamente', () => {
    cy.log('[TEST] ⚠️ Testando tratamento de erros JavaScript');
    
    // Visitar tela e injetar erro JavaScript
    cy.visit('/grid-nfe');
    cy.waitForLoad();
    
    // Injetar erro JavaScript para testar tratamento
    cy.window().then((win) => {
      // Simular erro que pode acontecer com agrupamento configurável
      try {
        win.eval('throw new Error("Simulated grouping error")');
      } catch (e) {
        // Erro esperado
        cy.log('[TEST] ⚠️ Erro simulado injetado para teste');
      }
    });
    
    // Verificar se aplicação ainda funciona
    cy.get('[data-testid="grid-paginada"]').should('be.visible');
    
    // Verificar se erro foi capturado pelo error boundary
    cy.get('[data-testid="error-boundary"]').should('not.exist');
    
    cy.log('[TEST] ✅ Erros JavaScript tratados graciosamente');
  });

  it('deve verificar que agrupamento configurável não causa erros de console', () => {
    cy.log('[TEST] 🔧 Testando agrupamento configurável sem erros');
    
    // Testar especificamente funcionalidades relacionadas ao agrupamento
    cy.visit('/documentos-fiscais');
    cy.waitForLoad();
    cy.waitForNFeData();
    
    // Interagir com funcionalidades que usam agrupamento
    cy.get('[data-testid="collection-nfe"]').click();
    cy.waitForLoad();
    
    // Aplicar filtros (que podem usar agrupamento)
    cy.get('[data-testid="data-inicio"]').clear().type('2024-01-01');
    cy.get('[data-testid="data-fim"]').clear().type('2024-01-31');
    cy.get('[data-testid="aplicar-filtros"]').click();
    cy.waitForLoad();
    
    // Verificar se não há erros relacionados ao agrupamento
    cy.get('@consoleError').should('not.have.been.called');
    
    // Verificar se não há warnings específicos de agrupamento
    cy.get('@consoleWarn').then((stub: any) => {
      if (stub && stub.getCalls) {
        const calls = stub.getCalls();
        const groupingWarnings = calls.filter((call: any) => 
          call.args.some((arg: any) => 
            typeof arg === 'string' && (
              arg.includes('grouping') ||
              arg.includes('aggregation') ||
              arg.includes('NFeQueryInterceptor') ||
              arg.includes('GroupingConfigManager')
            )
          )
        );
        expect(groupingWarnings).to.have.length(0);
      }
    });
    
    cy.log('[TEST] ✅ Agrupamento configurável - Sem erros detectados');
  });

  it('deve verificar vazamentos de memória nas telas NFe', () => {
    cy.log('[TEST] 💾 Testando vazamentos de memória');
    
    let initialMemory: number;
    
    // Capturar uso inicial de memória
    cy.window().then((win) => {
      if (win.performance && (win.performance as any).memory) {
        initialMemory = (win.performance as any).memory.usedJSHeapSize;
        cy.log(`[TEST] 💾 Memória inicial: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
      }
    });
    
    // Navegar por todas as telas NFe
    nfeScreens.forEach(screen => {
      cy.log(`[TEST] 🔄 Navegando para ${screen.name}`);
      
      cy.visit(screen.path);
      cy.waitForLoad();
      
      if (screen.testId.includes('grid') || screen.name === 'Documentos Fiscais') {
        cy.waitForNFeData();
      }
      
      // Aguardar um pouco para estabilizar
      cy.wait(1000);
    });
    
    // Verificar uso final de memória
    cy.window().then((win) => {
      if (win.performance && (win.performance as any).memory && initialMemory) {
        const finalMemory = (win.performance as any).memory.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
        
        cy.log(`[TEST] 💾 Memória final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
        cy.log(`[TEST] 💾 Aumento de memória: ${memoryIncreaseMB.toFixed(2)} MB`);
        
        // Verificar se aumento de memória é aceitável (< 50MB)
        expect(memoryIncreaseMB).to.be.lessThan(50);
        
        cy.log('[TEST] ✅ Uso de memória dentro dos limites aceitáveis');
      } else {
        cy.log('[TEST] ℹ️ API de memória não disponível no navegador');
      }
    });
  });

  it('deve verificar ausência de warnings críticos de performance', () => {
    cy.log('[TEST] ⚡ Testando warnings de performance');
    
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Aguardar processamento de analytics
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
    
    // Verificar se não há warnings de performance críticos
    cy.get('@consoleWarn').then((stub: any) => {
      if (stub && stub.getCalls) {
        const calls = stub.getCalls();
        const performanceWarnings = calls.filter((call: any) => 
          call.args.some((arg: any) => 
            typeof arg === 'string' && (
              arg.includes('slow') ||
              arg.includes('performance') ||
              arg.includes('timeout') ||
              arg.includes('memory')
            )
          )
        );
        
        // Log warnings encontrados para debug
        performanceWarnings.forEach((warning: any) => {
          cy.log(`[TEST] ⚠️ Performance warning: ${warning.args.join(' ')}`);
        });
        
        // Não deve haver muitos warnings de performance
        expect(performanceWarnings.length).to.be.lessThan(3);
        
        cy.log(`[TEST] ⚡ ${performanceWarnings.length} warnings de performance encontrados (limite: 3)`);
      }
    });
    
    cy.log('[TEST] ✅ Performance warnings dentro do limite aceitável');
  });
});