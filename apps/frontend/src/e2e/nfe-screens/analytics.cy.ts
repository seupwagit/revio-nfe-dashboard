/**
 * Testes E2E para Analytics
 * Testa tela de analytics que processa dados de tbl_nfe_100
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

import { TEST_USERS } from '../fixtures/test-users';

describe('Analytics E2E - tbl_nfe_100 Data Processing', () => {
  beforeEach(() => {
    // Configurar interceptadores de API para dados de teste
    cy.intercept('GET', '**/api/analytics/**', { fixture: 'analytics-data.json' }).as('getAnalytics');
    cy.intercept('GET', '**/api/analytics/summary**', { 
      body: { 
        success: true, 
        data: { 
          totalCount: 1250, 
          totalValue: 2500000.50,
          averageValue: 2000.40,
          collection: 'tbl_nfe_100'
        } 
      } 
    }).as('getAnalyticsSummary');
    
    // Login com usuário admin
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
  });

  it('deve carregar página de Analytics e exibir análise de dados NFe', () => {
    // Navegar para a página de analytics
    cy.visit('/analytics');
    
    // Aguardar carregamento
    cy.waitForLoad();
    
    // Verificar se a página carregou corretamente
    cy.get('h1')
      .should('be.visible')
      .and('contain', 'Analytics');
    
    // Verificar se está analisando dados de NFe por padrão
    cy.get('[data-testid="collection-filter"]')
      .should('be.visible')
      .and('have.value', 'tbl_nfe_100');
    
    // Verificar se há gráficos e visualizações
    cy.get('[data-testid="analytics-charts"]')
      .should('be.visible');
      
    cy.log('✅ Analytics carregado com dados NFe');
  });

  it('should handle collection filtering for tbl_nfe_100', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Verificar seletor de coleção
    cy.get('[data-testid="collection-filter"]').should('be.visible');
    
    // Verificar opções disponíveis
    cy.get('[data-testid="collection-filter"] option[value="tbl_nfe_100"]').should('contain', 'NF-e');
    cy.get('[data-testid="collection-filter"] option[value="tbl_cfe_100"]').should('contain', 'CF-e');
    cy.get('[data-testid="collection-filter"] option[value="tbl_cte_100"]').should('contain', 'CT-e');
    
    // Selecionar NFe explicitamente
    cy.get('[data-testid="collection-filter"]').select('tbl_nfe_100');
    
    // Aguardar atualização dos dados
    cy.waitForLoad();
    
    // Verificar se dados de NFe foram carregados
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
  });

  it('should display period filters and handle date ranges', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Verificar filtros de período
    cy.get('[data-testid="period-selector"]').should('be.visible');
    
    // Testar diferentes períodos
    cy.get('[data-testid="period-7d"]').click();
    cy.waitForLoad();
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
    
    cy.get('[data-testid="period-30d"]').click();
    cy.waitForLoad();
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
    
    cy.get('[data-testid="period-90d"]').click();
    cy.waitForLoad();
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
    
    // Testar período customizado
    cy.get('[data-testid="period-custom"]').click();
    
    // Definir datas customizadas
    cy.get('[data-testid="date-start"]').type('2024-01-01');
    cy.get('[data-testid="date-end"]').type('2024-12-31');
    cy.get('[data-testid="apply-custom-period"]').click();
    
    cy.waitForLoad();
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
  });

  it('should display various chart types for NFe analytics', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Verificar diferentes tipos de gráficos
    cy.get('[data-testid="chart-volume-tempo"]').should('be.visible');
    cy.get('[data-testid="chart-valores-tempo"]').should('be.visible');
    cy.get('[data-testid="chart-status-distribuicao"]').should('be.visible');
    cy.get('[data-testid="chart-top-emitentes"]').should('be.visible');
    
    // Verificar se gráficos têm dados
    cy.get('[data-testid="chart-volume-tempo"] svg').should('be.visible');
    cy.get('[data-testid="chart-valores-tempo"] svg').should('be.visible');
  });

  it('should handle interactive chart features', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Testar interação com gráficos
    cy.get('[data-testid="chart-volume-tempo"] svg').trigger('mouseover');
    
    // Verificar tooltip ou detalhes
    cy.get('[data-testid="chart-tooltip"]').should('be.visible');
    
    // Testar zoom ou filtro por clique
    cy.get('[data-testid="chart-volume-tempo"] svg').click();
  });

  it('should display summary statistics for NFe data', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Verificar estatísticas resumidas
    cy.get('[data-testid="summary-stats"]').should('be.visible');
    
    // Verificar métricas específicas de NFe
    cy.get('[data-testid="total-nfe-count"]').should('contain.text', /\d+/);
    cy.get('[data-testid="total-nfe-value"]').should('contain.text', /R\$/);
    cy.get('[data-testid="average-nfe-value"]').should('contain.text', /R\$/);
    
    // Verificar distribuição por status
    cy.get('[data-testid="status-breakdown"]').should('be.visible');
    cy.get('[data-testid="status-autorizada"]').should('be.visible');
    cy.get('[data-testid="status-cancelada"]').should('be.visible');
  });

  it('should handle configurable grouping impact on analytics', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Verificar se analytics refletem agrupamento configurável
    // (baseado na implementação do NFe Configurable Grouping)
    
    // Verificar se dados estão sendo processados corretamente
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
    cy.get('[data-testid="summary-stats"]').should('be.visible');
    
    // Verificar se não há erros de agrupamento
    cy.get('[data-testid="error-message"]').should('not.exist');
    cy.get('[data-testid="grouping-error"]').should('not.exist');
    
    // Verificar se métricas fazem sentido
    cy.get('[data-testid="total-nfe-count"]').should('not.contain', '0');
  });

  it('should export analytics data correctly', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Verificar botão de exportar
    cy.get('[data-testid="export-button"]').should('be.visible');
    
    // Testar exportação (se implementada)
    cy.get('[data-testid="export-button"]').click();
    
    // Verificar opções de exportação
    cy.get('[data-testid="export-options"]').should('be.visible');
    cy.get('[data-testid="export-excel"]').should('be.visible');
    cy.get('[data-testid="export-pdf"]').should('be.visible');
  });

  it('should handle real-time data updates', () => {
    cy.visit('/analytics');
    cy.waitForLoad();
    
    // Verificar indicador de última atualização
    cy.get('[data-testid="last-update-time"]').should('be.visible');
    
    // Verificar botão de atualizar
    cy.get('[data-testid="refresh-button"]').should('be.visible');
    
    // Testar atualização manual
    cy.get('[data-testid="refresh-button"]').click();
    cy.waitForLoad();
    
    // Verificar se dados foram atualizados
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
  });

  it('should handle error states in analytics processing', () => {
    // Interceptar API para simular erro
    cy.intercept('GET', '**/api/analytics/**', { statusCode: 500 }).as('analyticsError');
    
    cy.visit('/analytics');
    
    // Aguardar tentativa de carregamento
    cy.wait('@analyticsError');
    
    // Verificar se erro é tratado graciosamente
    cy.get('[data-testid="analytics-error"]').should('be.visible');
    cy.get('[data-testid="retry-analytics"]').should('be.visible');
    
    // Testar retry
    cy.intercept('GET', '**/api/analytics/**', { fixture: 'analytics-data.json' }).as('analyticsSuccess');
    cy.get('[data-testid="retry-analytics"]').click();
    
    cy.wait('@analyticsSuccess');
    cy.get('[data-testid="analytics-charts"]').should('be.visible');
  });
});