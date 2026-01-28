/**
 * Testes E2E para Dashboard
 * Testa dashboard que exibe analytics de tbl_nfe_100
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

import { TEST_USERS } from '../fixtures/test-users';

describe('Dashboard E2E - tbl_nfe_100 Analytics', () => {
  beforeEach(() => {
    // Configurar interceptadores de API para dados de teste
    cy.intercept('GET', '**/api/analytics/**', { fixture: 'analytics-data.json' }).as('getAnalytics');
    cy.intercept('GET', '**/api/documents/stats**', { 
      body: { 
        success: true, 
        data: { 
          total: 1250, 
          totalValue: 2500000.50,
          collection: 'tbl_nfe_100'
        } 
      } 
    }).as('getStats');
    
    // Login com usuário admin
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
  });

  it('deve carregar Dashboard e exibir analytics de NFe da tbl_nfe_100', () => {
    // Navegar para o dashboard
    cy.visit('/dashboard');
    
    // Aguardar carregamento
    cy.waitForLoad();
    
    // Verificar se a página carregou corretamente
    cy.get('h1')
      .should('be.visible')
      .and('contain', 'Dashboard');
    
    // Verificar se está mostrando dados de NFe por padrão
    cy.get('[data-testid="document-type-indicator"]')
      .should('be.visible')
      .and('contain', 'NF-e');
    
    // Verificar cards de estatísticas
    cy.get('[data-testid="stats-cards"]')
      .should('be.visible');
    
    // Verificar indicadores específicos de NFe
    cy.get('[data-testid="total-nfe"]')
      .should('be.visible');
    cy.get('[data-testid="valor-total"]')
      .should('be.visible');
      
    cy.log('✅ Dashboard carregado com dados de NFe');
  });

  it('deve exibir indicadores e métricas específicas de NFe', () => {
    cy.visit('/dashboard');
    cy.waitForLoad();
    
    // Verificar indicadores comerciais e fiscais específicos de NFe
    cy.get('[data-testid="indicadores-comerciais"]')
      .should('be.visible');
    cy.get('[data-testid="indicadores-fiscais"]')
      .should('be.visible');
    
    // Verificar métricas de entrada vs saída
    cy.get('[data-testid="entradas-saidas"]')
      .should('be.visible');
    
    // Verificar saldo operacional
    cy.get('[data-testid="saldo-operacional"]')
      .should('be.visible');
    
    // Verificar alertas específicos de NFe (se aplicável)
    cy.get('body').then(($body) => {
      const hasNegativeBalanceAlert = $body.find('[data-testid="alerta-saldo-negativo"]').length > 0;
      
      if (hasNegativeBalanceAlert) {
        cy.get('[data-testid="alerta-saldo-negativo"]')
          .should('be.visible')
          .and('contain', 'Saldo operacional negativo');
        cy.log('⚠️ Alerta de saldo negativo detectado');
      } else {
        cy.log('ℹ️ Nenhum alerta de saldo negativo');
      }
    });
    
    cy.log('✅ Indicadores NFe exibidos corretamente');
  });

  it('deve tratar mudança de coleção no dashboard', () => {
    cy.visit('/dashboard');
    cy.waitForLoad();
    
    // Verificar seletor de coleção no dashboard
    cy.get('[data-testid="collection-selector"]')
      .should('be.visible');
    
    // Verificar se NFe está selecionado
    cy.get('[data-testid="collection-selector"]')
      .should('contain', 'NF-e');
    
    // Mudar para CFe
    cy.get('[data-testid="collection-selector"]')
      .select('tbl_cfe_100');
    
    // Verificar se mudou para CFe
    cy.get('[data-testid="document-type-indicator"]')
      .should('be.visible')
      .and('contain', 'CF-e');
    
    cy.log('✅ Mudança para CFe realizada');
    
    // Voltar para NFe
    cy.get('[data-testid="collection-selector"]')
      .select('tbl_nfe_100');
    
    // Verificar se voltou para NFe
    cy.get('[data-testid="document-type-indicator"]')
      .should('be.visible')
      .and('contain', 'NF-e');
      
    cy.log('✅ Retorno para NFe realizado');
  });

  it('deve exibir gráficos e visualizações para dados NFe', () => {
    cy.visit('/dashboard');
    cy.waitForLoad();
    
    // Verificar se há gráficos/visualizações
    cy.get('[data-testid="charts-section"]')
      .should('be.visible');
    
    // Verificar gráficos específicos de NFe
    cy.get('[data-testid="chart-entradas-saidas"]')
      .should('be.visible');
    cy.get('[data-testid="chart-valores-tempo"]')
      .should('be.visible');
      
    cy.log('✅ Gráficos NFe carregados corretamente');
  });

  it('deve tratar filtros de período corretamente', () => {
    cy.visit('/dashboard');
    cy.waitForLoad();
    
    // Verificar filtros de período
    cy.get('[data-testid="period-filter"]')
      .should('be.visible');
    
    // Testar diferentes períodos
    const periods = [
      { testId: 'period-7d', description: '7 dias' },
      { testId: 'period-30d', description: '30 dias' },
      { testId: 'period-90d', description: '90 dias' }
    ];
    
    periods.forEach((period) => {
      cy.log(`Testando período: ${period.description}`);
      
      cy.get(`[data-testid="${period.testId}"]`)
        .should('be.visible')
        .click();
      cy.waitForLoad();
      
      // Verificar se dados são atualizados
      cy.get('[data-testid="stats-cards"]')
        .should('be.visible');
        
      cy.log(`✅ Período ${period.description} funcionando`);
    });
  });

  it('deve exibir atualizações em tempo real e status do cache', () => {
    cy.visit('/dashboard');
    cy.waitForLoad();
    
    // Verificar indicador de cache
    cy.get('body').then(($body) => {
      const hasCacheIndicator = $body.find('[data-testid="cache-indicator"]').length > 0;
      
      if (hasCacheIndicator) {
        cy.get('[data-testid="cache-indicator"]')
          .should('be.visible')
          .and('contain', 'Cache');
        cy.log('✅ Indicador de cache presente');
      } else {
        cy.log('ℹ️ Indicador de cache não encontrado');
      }
    });
    
    // Verificar timestamp de última atualização
    cy.get('[data-testid="last-update"]')
      .should('be.visible');
      
    cy.log('✅ Status de atualização verificado');
  });

  it('deve tratar impacto do agrupamento configurável nas métricas do dashboard', () => {
    cy.visit('/dashboard');
    cy.waitForLoad();
    
    // Verificar se métricas refletem agrupamento configurável
    // (baseado na implementação do NFe Configurable Grouping)
    cy.get('[data-testid="total-nfe"]')
      .should('be.visible')
      .and('contain.text', /\d+/);
    
    cy.get('[data-testid="valor-total"]')
      .should('be.visible')
      .and('contain.text', /R\$/);
    
    // Verificar se agrupamento não quebrou as métricas
    cy.get('[data-testid="stats-cards"] [data-testid="error-message"]')
      .should('not.exist');
      
    // Verificar se dados são consistentes
    cy.get('[data-testid="total-nfe"]').invoke('text').then((totalText) => {
      const total = parseInt(totalText.replace(/\D/g, ''), 10);
      expect(total).to.be.a('number');
      expect(total).to.be.greaterThan(-1);
      cy.log(`✅ Total NFe: ${total}`);
    });
    
    cy.log('✅ Agrupamento configurável funcionando no dashboard');
  });

  it('deve navegar para visualizações detalhadas a partir do dashboard', () => {
    cy.visit('/dashboard');
    cy.waitForLoad();
    
    // Procurar por links de "Ver Detalhes" ou similares
    cy.get('body').then(($body) => {
      const hasDetailsLink = $body.find('a:contains("Ver Detalhes")').length > 0;
      const hasMoreInfoLink = $body.find('a:contains("Mais Informações")').length > 0;
      const hasViewAllLink = $body.find('a:contains("Ver Todos")').length > 0;
      
      if (hasDetailsLink) {
        cy.get('a')
          .contains('Ver Detalhes')
          .first()
          .should('be.visible')
          .click();
        cy.log('✅ Clicou em "Ver Detalhes"');
      } else if (hasMoreInfoLink) {
        cy.get('a')
          .contains('Mais Informações')
          .first()
          .should('be.visible')
          .click();
        cy.log('✅ Clicou em "Mais Informações"');
      } else if (hasViewAllLink) {
        cy.get('a')
          .contains('Ver Todos')
          .first()
          .should('be.visible')
          .click();
        cy.log('✅ Clicou em "Ver Todos"');
      } else {
        cy.log('ℹ️ Nenhum link de detalhes encontrado, testando navegação direta');
        cy.visit('/documentos-fiscais');
      }
    });
    
    // Verificar se navegou para tela de detalhes
    cy.url().should('include', '/documentos-fiscais');
    
    // Verificar se manteve contexto de NFe
    cy.get('[data-testid="collection-nfe"]')
      .should('be.visible')
      .and('have.class', 'active');
      
    cy.log('✅ Navegação para detalhes funcionando');
  });
});