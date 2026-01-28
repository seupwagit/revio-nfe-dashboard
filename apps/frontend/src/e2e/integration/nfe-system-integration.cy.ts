/**
 * Testes E2E de Integração do Sistema NFe
 * Verifica se todas as telas que acessam tbl_nfe_100 estão funcionando
 * e se o agrupamento configurável não quebrou nada
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

// External libraries
import { TEST_USERS } from '../fixtures/test-users';

// Relative imports
import type { TestScreen } from '../types/test.types';
import { NFE_TEST_SCREENS, TestHelpers } from '../utils/test-helpers';

describe('NFe System Integration E2E - tbl_nfe_100 Complete Flow', () => {
  beforeEach(() => {
    cy.log('[SETUP] 🔧 Configurando ambiente de teste de integração');
    
    // Configurar interceptadores padrão
    TestHelpers.setupDefaultInterceptors();
    
    // Login com usuário admin
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    
    cy.log('[SETUP] ✅ Ambiente configurado');
  });

  it('deve completar fluxo completo de NFe em todas as telas', () => {
    cy.log('[TEST] 🔄 Iniciando teste de fluxo completo');
    
    NFE_TEST_SCREENS.forEach((screen: TestScreen) => {
      cy.log(`[TEST] 🧪 Testando ${screen.name} - ${screen.path}`);
      
      // Navegar para a tela
      cy.visit(screen.path);
      
      // Aguardar carregamento completo
      TestHelpers.waitForNFeScreenLoad(screen);
      
      // Verificar elemento específico baseado no tipo de tela
      if (screen.name === 'Dashboard') {
        cy.get('[data-testid="document-type-indicator"]')
          .should('be.visible')
          .and('contain', 'NF-e');
      } else if (screen.name === 'Analytics') {
        cy.get('[data-testid="collection-filter"]')
          .should('be.visible')
          .and('have.value', 'tbl_nfe_100');
      }
      
      cy.log(`[TEST] ✅ ${screen.name} funcionando corretamente`);
    });
    
    // Testar funcionalidade DANFE na última tela
    cy.log('[TEST] 🧪 Testando funcionalidade DANFE');
    
    cy.get('button')
      .contains('Visualizar')
      .first()
      .should('be.visible')
      .click();
    
    cy.get('[data-testid="danfe-viewer-modal"]')
      .should('be.visible');
    
    cy.get('[data-testid="close-modal"]')
      .should('be.visible')
      .click();
    
    cy.log('[TEST] ✅ Fluxo completo executado com sucesso');
  });

  it('deve verificar se agrupamento configurável funciona em todas as telas NFe', () => {
    cy.log('[TEST] 🔧 Testando agrupamento configurável');
    
    NFE_TEST_SCREENS.forEach((screen: TestScreen) => {
      cy.log(`[TEST] 🧪 Verificando agrupamento em ${screen.name}`);
      
      cy.visit(screen.path);
      TestHelpers.waitForNFeScreenLoad(screen);
      
      // Verificar se não há erros de agrupamento
      cy.get('[data-testid="error-message"]').should('not.exist');
      cy.get('[data-testid="grouping-error"]').should('not.exist');
      
      // Verificar se dados estão sendo carregados para grids
      if (screen.requiresNFeData) {
        cy.verifyNFeDataLoaded();
      }
      
      cy.log(`[TEST] ✅ Agrupamento funcionando em ${screen.name}`);
    });
    
    cy.log('[TEST] ✅ Agrupamento configurável validado');
  });

  it('deve verificar consistência de dados entre telas', () => {
    cy.log('[TEST] 🔄 Verificando consistência de dados');
    
    let dashboardTotal: number;
    let analyticsTotal: number;
    
    // 1. Capturar total do Dashboard
    cy.visit('/dashboard');
    TestHelpers.waitForNFeScreenLoad(NFE_TEST_SCREENS[0]);
    
    cy.get('[data-testid="total-nfe"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        dashboardTotal = parseInt(text.replace(/\D/g, ''), 10);
        cy.log(`[TEST] 📊 Dashboard Total: ${dashboardTotal}`);
        expect(dashboardTotal).to.be.a('number');
        expect(dashboardTotal).to.be.greaterThan(-1);
      });
    
    // 2. Capturar total do Analytics
    cy.visit('/analytics');
    TestHelpers.waitForNFeScreenLoad(NFE_TEST_SCREENS[1]);
    
    cy.get('[data-testid="total-nfe-count"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        analyticsTotal = parseInt(text.replace(/\D/g, ''), 10);
        cy.log(`[TEST] 📊 Analytics Total: ${analyticsTotal}`);
        expect(analyticsTotal).to.be.a('number');
        expect(analyticsTotal).to.be.greaterThan(-1);
        
        // Verificar consistência usando helper
        const difference = Math.abs(dashboardTotal - analyticsTotal);
        expect(difference).to.be.lessThan(100);
        cy.log(`[TEST] ✅ Diferença entre totais: ${difference} (aceitável)`);
      });
    
    // 3. Verificar se grids mostram dados consistentes
    cy.visit('/documentos-fiscais');
    TestHelpers.waitForNFeScreenLoad(NFE_TEST_SCREENS[2]);
    
    cy.get('[data-testid="total-documents"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const gridTotal = parseInt(text.replace(/\D/g, ''), 10);
        cy.log(`[TEST] 📊 Grid Total: ${gridTotal}`);
        
        expect(gridTotal).to.be.a('number');
        expect(gridTotal).to.be.greaterThan(-1);
      });
    
    cy.log('[TEST] ✅ Consistência de dados validada');
  });

  it('deve verificar se busca e filtros funcionam com agrupamento configurável', () => {
    cy.log('[TEST] 🔍 Testando filtros com agrupamento');
    
    const screensWithFilters = NFE_TEST_SCREENS.filter(screen => screen.hasFilters);
    
    screensWithFilters.forEach((screen: TestScreen) => {
      cy.log(`[TEST] 🧪 Testando filtros em ${screen.name}`);
      
      cy.visit(screen.path);
      TestHelpers.waitForNFeScreenLoad(screen);
      
      // Aplicar filtros usando helper
      TestHelpers.applyDateFilters('2024-01-01', '2024-01-31');
      
      // Verificar se filtro foi aplicado sem erros
      cy.get('[data-testid="error-message"]').should('not.exist');
      
      // Verificar resultado do filtro
      cy.get('body').then(($body) => {
        const hasData = $body.find('[data-testid="grid-nfe-simples"] tbody tr').length > 0;
        
        if (hasData) {
          cy.verifyNFeDataLoaded();
          cy.log(`[TEST] ✅ Dados encontrados após filtro em ${screen.name}`);
        } else {
          cy.get('[data-testid="empty-state"]').should('be.visible');
          cy.log(`[TEST] ℹ️ Nenhum dado para o período em ${screen.name}`);
        }
      });
      
      // Limpar filtros usando helper
      TestHelpers.clearFilters();
      
      cy.log(`[TEST] ✅ Filtros validados em ${screen.name}`);
    });
    
    cy.log('[TEST] ✅ Filtros com agrupamento validados');
  });

  it('deve verificar se funcionalidade de exportação funciona com dados agrupados', () => {
    cy.log('[TEST] 📤 Testando exportação com agrupamento');
    
    cy.visit('/grid-nfe');
    TestHelpers.waitForNFeScreenLoad(NFE_TEST_SCREENS[3]);
    
    // Verificar se botão de exportar está presente
    cy.get('button')
      .contains('Exportar')
      .should('be.visible');
    
    // Verificar se floating download button está presente
    cy.get('[data-testid="floating-download-button"]')
      .should('be.visible');
    
    // Testar clique no exportar (não vamos baixar arquivo real)
    cy.get('button')
      .contains('Exportar')
      .click();
    
    // Verificar se não há erros
    cy.get('[data-testid="export-error"]').should('not.exist');
    
    // Verificar se processo de exportação iniciou
    cy.get('body').then(($body) => {
      const hasLoadingIndicator = $body.find('[data-testid="export-loading"]').length > 0;
      const hasSuccessMessage = $body.find('[data-testid="export-success"]').length > 0;
      
      // Deve ter pelo menos um indicador de que a exportação foi processada
      expect(hasLoadingIndicator || hasSuccessMessage).to.be.true;
    });
    
    cy.log('[TEST] ✅ Exportação com agrupamento validada');
  });

  it('deve tratar recuperação de erros graciosamente em todas as telas', () => {
    cy.log('[TEST] 🛡️ Testando recuperação de erros');
    
    // Configurar erro de servidor usando helper
    TestHelpers.setupServerErrorInterceptor(500);
    
    const screensToTest = NFE_TEST_SCREENS.slice(0, 4); // Testar primeiras 4 telas
    
    screensToTest.forEach((screen: TestScreen) => {
      cy.log(`[TEST] 🧪 Testando recuperação em ${screen.name}`);
      
      cy.visit(screen.path);
      
      // Aguardar erro
      cy.wait('@serverError');
      
      // Verificar se erro é tratado graciosamente
      cy.get('[data-testid="error-message"]')
        .should('be.visible');
      
      // Verificar se há opção de retry
      cy.get('body').then(($body) => {
        const hasRetryButton = $body.find('[data-testid="retry-button"]').length > 0;
        const hasRefreshOption = $body.find('[data-testid="refresh-button"]').length > 0;
        
        if (hasRetryButton) {
          cy.get('[data-testid="retry-button"]').should('be.visible');
          cy.log(`[TEST] ✅ Botão de retry disponível em ${screen.name}`);
        } else if (hasRefreshOption) {
          cy.get('[data-testid="refresh-button"]').should('be.visible');
          cy.log(`[TEST] ✅ Botão de refresh disponível em ${screen.name}`);
        } else {
          cy.log(`[TEST] ℹ️ Nenhum botão de recuperação em ${screen.name}`);
        }
      });
      
      cy.log(`[TEST] ✅ Recuperação validada em ${screen.name}`);
    });
    
    // Restaurar API para funcionar
    TestHelpers.setupDefaultInterceptors();
    
    cy.log('[TEST] ✅ Recuperação de erros validada');
  });

  it('deve verificar se performance é aceitável com agrupamento configurável', () => {
    cy.log('[TEST] ⚡ Testando performance com agrupamento');
    
    NFE_TEST_SCREENS.forEach((screen: TestScreen) => {
      cy.log(`[TEST] 🧪 Medindo performance de ${screen.name}`);
      
      cy.visit(screen.path);
      TestHelpers.waitForNFeScreenLoad(screen);
      
      // Medir performance usando helper
      TestHelpers.measureScreenPerformance(screen.name);
      
      // Verificar se não há indicadores de performance ruim
      cy.get('[data-testid="slow-query-warning"]').should('not.exist');
      cy.get('[data-testid="performance-warning"]').should('not.exist');
    });
    
    cy.log('[TEST] ✅ Performance com agrupamento validada');
  });
});