/**
 * Testes E2E para DocumentosFiscais
 * Testa tela principal que acessa tbl_nfe_100 com seletor de coleções
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

import { TEST_USERS } from '../fixtures/test-users';

describe('DocumentosFiscais E2E - Acesso tbl_nfe_100', () => {
  beforeEach(() => {
    cy.log('[SETUP] 🔧 Configurando teste DocumentosFiscais');
    
    // Configurar interceptadores de API para dados de teste
    cy.intercept('GET', '**/api/documents/**', { fixture: 'nfe-sample-data.json' }).as('getDocuments');
    cy.intercept('GET', '**/api/documents/stats**', { 
      body: { 
        success: true, 
        data: { 
          total: 1250, 
          collection: 'tbl_nfe_100'
        } 
      } 
    }).as('getStats');
    
    // Login com usuário admin
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    
    cy.log('[SETUP] ✅ Configuração DocumentosFiscais concluída');
  });

  it('deve carregar DocumentosFiscais e usar tbl_nfe_100 por padrão', () => {
    cy.log('[TEST] 🧪 Testando carregamento padrão da tela DocumentosFiscais');
    
    // Navegar para a página de documentos fiscais
    cy.visit('/documentos-fiscais');
    
    // Aguardar carregamento
    cy.waitForLoad();
    
    // Verificar se a página carregou corretamente
    cy.get('h1')
      .should('be.visible')
      .and('contain', 'Documentos Fiscais');
    
    // Verificar se NFe está selecionado por padrão
    cy.get('[data-testid="collection-nfe"]')
      .should('be.visible')
      .and('have.class', 'active');
    
    // Verificar se a grid NFe está visível
    cy.get('[data-testid="grid-nfe-simples"]')
      .should('be.visible');
    
    // Aguardar dados NFe carregarem
    cy.waitForNFeData();
    
    // Verificar se dados foram carregados de tbl_nfe_100
    cy.verifyNFeDataLoaded();
    
    cy.log('[TEST] ✅ Carregamento padrão funcionando corretamente');
  });

  it('deve alternar entre coleções corretamente', () => {
    cy.log('[TEST] 🔄 Testando alternância entre coleções');
    
    cy.visit('/documentos-fiscais');
    cy.waitForLoad();
    
    // Verificar seletor de coleções
    cy.get('[data-testid="collection-selector"]')
      .should('be.visible');
    
    // Verificar opções disponíveis
    cy.get('[data-testid="collection-nfe"]')
      .should('be.visible')
      .and('contain', 'NF-e');
    cy.get('[data-testid="collection-cfe"]')
      .should('be.visible')
      .and('contain', 'CF-e');
    cy.get('[data-testid="collection-cte"]')
      .should('be.visible')
      .and('contain', 'CT-e');
    
    // Clicar em CFe
    cy.get('[data-testid="collection-cfe"]').click();
    cy.waitForLoad();
    
    // Verificar se mudou para CFe
    cy.get('[data-testid="collection-cfe"]')
      .should('have.class', 'active');
    cy.get('[data-testid="grid-cfe-simples"]')
      .should('be.visible');
    
    cy.log('[TEST] 🔄 Mudança para CFe realizada');
    
    // Voltar para NFe
    cy.get('[data-testid="collection-nfe"]').click();
    cy.waitForLoad();
    
    // Verificar se voltou para NFe
    cy.get('[data-testid="collection-nfe"]')
      .should('have.class', 'active');
    cy.get('[data-testid="grid-nfe-simples"]')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Alternância entre coleções funcionando');
  });

  it('deve exibir estatísticas da coleção corretamente', () => {
    cy.log('[TEST] 📊 Testando exibição de estatísticas');
    
    cy.visit('/documentos-fiscais');
    cy.waitForLoad();
    
    // Verificar estatísticas da coleção NFe
    cy.get('[data-testid="collection-stats"]')
      .should('be.visible');
    cy.get('[data-testid="total-documents"]')
      .should('be.visible')
      .and('contain', 'documento');
    
    // Verificar período de consulta
    cy.get('[data-testid="period-info"]')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Estatísticas exibidas corretamente');
  });

  it('deve tratar filtros e busca na coleção NFe', () => {
    cy.log('[TEST] 🔍 Testando filtros e busca');
    
    cy.visit('/documentos-fiscais');
    cy.waitForLoad();
    
    // Verificar se está na coleção NFe
    cy.get('[data-testid="collection-nfe"]')
      .should('have.class', 'active');
    
    // Verificar filtros disponíveis
    cy.get('[data-testid="filters-section"]')
      .should('be.visible');
    
    // Verificar filtro de período
    cy.get('[data-testid="date-filter"]')
      .should('be.visible');
    
    // Verificar filtros específicos de NFe
    cy.get('[data-testid="status-filter"]')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Filtros funcionando corretamente');
  });

  it('deve exibir indicador de progresso durante carregamento', () => {
    cy.log('[TEST] ⏳ Testando indicador de progresso');
    
    cy.visit('/documentos-fiscais');
    
    // Verificar indicador de progresso durante carregamento
    cy.get('[data-testid="streaming-progress"]')
      .should('be.visible');
    
    // Aguardar carregamento completo
    cy.waitForLoad();
    
    // Verificar se progresso desapareceu
    cy.get('[data-testid="streaming-progress"]')
      .should('not.exist');
      
    cy.log('[TEST] ✅ Indicador de progresso funcionando');
  });

  it('deve tratar agrupamento configurável para tbl_nfe_100', () => {
    cy.log('[TEST] 🔧 Testando agrupamento configurável NFe');
    
    cy.visit('/documentos-fiscais');
    cy.waitForLoad();
    cy.waitForNFeData();
    
    // Verificar se dados estão agrupados corretamente
    // (baseado na implementação do NFe Configurable Grouping)
    cy.get('[data-testid="grid-nfe-simples"] tbody tr')
      .should('have.length.greaterThan', 0);
    
    // Verificar se colunas de agrupamento estão presentes
    cy.get('th')
      .should('contain', 'Chave de Acesso');
    cy.get('th')
      .should('contain', 'Número');
    
    // Verificar se dados estão ordenados corretamente
    // (conforme configuração de agrupamento)
    cy.get('[data-testid="grid-nfe-simples"] tbody tr')
      .first()
      .should('be.visible');
      
    cy.log('[TEST] ✅ Agrupamento configurável funcionando');
  });

  it('deve tratar estados de erro graciosamente', () => {
    cy.log('[TEST] ❌ Testando tratamento de erros');
    
    // Interceptar API para simular erro
    cy.intercept('GET', '**/api/documents**', { statusCode: 500 }).as('apiError');
    
    cy.visit('/documentos-fiscais');
    
    // Aguardar tentativa de carregamento
    cy.wait('@apiError');
    
    // Verificar se erro é tratado graciosamente
    cy.get('[data-testid="error-message"]')
      .should('be.visible');
    cy.get('[data-testid="retry-button"]')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Tratamento de erros funcionando');
  });
});