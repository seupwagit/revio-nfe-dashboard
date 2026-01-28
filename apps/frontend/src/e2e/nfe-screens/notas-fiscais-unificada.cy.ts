/**
 * Testes E2E para NotasFiscaisUnificada
 * Testa tela unificada que acessa tbl_nfe_100 com seletor de coleções
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

import { TEST_USERS } from '../fixtures/test-users';

describe('NotasFiscaisUnificada E2E - Acesso tbl_nfe_100', () => {
  beforeEach(() => {
    cy.log('[SETUP] 🔧 Configurando teste NotasFiscaisUnificada');
    
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
    
    cy.log('[SETUP] ✅ Configuração NotasFiscaisUnificada concluída');
  });

  it('deve carregar NotasFiscaisUnificada e exibir coleção NFe por padrão', () => {
    cy.log('[TEST] 🧪 Testando carregamento padrão da tela unificada');
    
    // Navegar para a página de notas fiscais unificada
    cy.visit('/notas-fiscais-unificada');
    
    // Aguardar carregamento
    cy.waitForLoad();
    
    // Verificar se a página carregou corretamente
    cy.get('h1')
      .should('be.visible')
      .and('contain', 'Notas Fiscais Eletrônicas (NF-e)');
    
    // Verificar se o seletor de coleção está presente
    cy.get('[data-testid="collection-selector"]')
      .should('be.visible');
    
    // Verificar se NFe está selecionado por padrão
    cy.get('[data-testid="collection-selector"]')
      .should('have.value', 'tbl_nfe_100');
    
    // Verificar se a grid NFe está visível
    cy.get('[data-testid="grid-nfe-simples"]')
      .should('be.visible');
    
    // Aguardar dados NFe carregarem
    cy.waitForNFeData();
    
    // Verificar se dados foram carregados de tbl_nfe_100
    cy.verifyNFeDataLoaded();
    
    cy.log('[TEST] ✅ Carregamento padrão funcionando');
  });

  it('deve alternar entre coleções e atualizar título adequadamente', () => {
    cy.log('[TEST] 🔄 Testando alternância entre coleções com atualização de título');
    
    cy.visit('/notas-fiscais-unificada');
    cy.waitForLoad();
    
    // Verificar título inicial (NFe)
    cy.get('h1')
      .should('contain', 'Notas Fiscais Eletrônicas (NF-e)');
    
    // Mudar para CFe
    cy.get('[data-testid="collection-selector"]').select('tbl_cfe_100');
    cy.waitForLoad();
    
    // Verificar se título mudou
    cy.get('h1')
      .should('contain', 'Cupons Fiscais Eletrônicos (CF-e/SAT)');
    
    // Verificar se grid mudou
    cy.get('[data-testid="grid-cfe-simples"]')
      .should('be.visible');
    cy.get('[data-testid="grid-nfe-simples"]')
      .should('not.exist');
    
    cy.log('[TEST] 🔄 Mudança para CFe realizada');
    
    // Mudar para CTe
    cy.get('[data-testid="collection-selector"]').select('tbl_cte_100');
    cy.waitForLoad();
    
    // Verificar se título mudou
    cy.get('h1')
      .should('contain', 'Conhecimentos de Transporte Eletrônicos (CT-e)');
    
    // Verificar se grid mudou
    cy.get('[data-testid="grid-cte-simples"]')
      .should('be.visible');
    cy.get('[data-testid="grid-cfe-simples"]')
      .should('not.exist');
    
    cy.log('[TEST] 🔄 Mudança para CTe realizada');
    
    // Voltar para NFe
    cy.get('[data-testid="collection-selector"]').select('tbl_nfe_100');
    cy.waitForLoad();
    
    // Verificar se voltou para NFe
    cy.get('h1')
      .should('contain', 'Notas Fiscais Eletrônicas (NF-e)');
    cy.get('[data-testid="grid-nfe-simples"]')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Alternância entre coleções funcionando');
  });

  it('deve manter filtros ao alternar coleções', () => {
    cy.log('[TEST] 🔧 Testando manutenção de filtros entre coleções');
    
    cy.visit('/notas-fiscais-unificada');
    cy.waitForLoad();
    
    // Aplicar filtros na coleção NFe
    cy.get('[data-testid="filtro-notas"]')
      .should('be.visible');
    
    // Definir período
    cy.get('[data-testid="data-inicio"]').clear().type('2024-01-01');
    cy.get('[data-testid="data-fim"]').clear().type('2024-01-31');
    
    // Aplicar filtro
    cy.get('[data-testid="aplicar-filtros"]').click();
    cy.waitForLoad();
    
    cy.log('[TEST] 🔧 Filtros aplicados na coleção NFe');
    
    // Mudar para CFe
    cy.get('[data-testid="collection-selector"]').select('tbl_cfe_100');
    cy.waitForLoad();
    
    // Verificar se filtros foram mantidos
    cy.get('[data-testid="data-inicio"]')
      .should('have.value', '2024-01-01');
    cy.get('[data-testid="data-fim"]')
      .should('have.value', '2024-01-31');
    
    cy.log('[TEST] 🔧 Filtros mantidos na coleção CFe');
    
    // Voltar para NFe
    cy.get('[data-testid="collection-selector"]').select('tbl_nfe_100');
    cy.waitForLoad();
    
    // Verificar se filtros ainda estão aplicados
    cy.get('[data-testid="data-inicio"]')
      .should('have.value', '2024-01-01');
    cy.get('[data-testid="data-fim"]')
      .should('have.value', '2024-01-31');
      
    cy.log('[TEST] ✅ Filtros mantidos entre alternâncias');
  });

  it('deve exibir recursos específicos da coleção NFe', () => {
    cy.log('[TEST] 📋 Testando recursos específicos da coleção NFe');
    
    cy.visit('/notas-fiscais-unificada');
    cy.waitForLoad();
    
    // Verificar se está na coleção NFe
    cy.get('[data-testid="collection-selector"]')
      .should('have.value', 'tbl_nfe_100');
    
    // Verificar recursos específicos de NFe
    cy.get('[data-testid="grid-nfe-simples"]')
      .should('be.visible');
    
    // Verificar colunas específicas de NFe
    cy.get('th').should('contain', 'Chave de Acesso');
    cy.get('th').should('contain', 'CNPJ Emitente');
    cy.get('th').should('contain', 'Razão Social Emitente');
    cy.get('th').should('contain', 'ICMS');
    cy.get('th').should('contain', 'IPI');
    
    // Verificar botão de visualizar DANFE
    cy.get('button')
      .contains('Visualizar')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Recursos específicos NFe funcionando');
  });

  it('deve tratar agrupamento configurável para tbl_nfe_100 na visualização unificada', () => {
    cy.log('[TEST] 🔧 Testando agrupamento configurável na visualização unificada');
    
    cy.visit('/notas-fiscais-unificada');
    cy.waitForLoad();
    cy.waitForNFeData();
    
    // Verificar se dados estão sendo processados com agrupamento configurável
    // (baseado na implementação do NFe Configurable Grouping)
    
    // Verificar se dados estão presentes
    cy.get('[data-testid="grid-nfe-simples"] tbody tr')
      .should('have.length.greaterThan', 0);
    
    // Verificar se agrupamento não causou erros
    cy.get('[data-testid="error-message"]')
      .should('not.exist');
    cy.get('[data-testid="grouping-error"]')
      .should('not.exist');
    
    // Verificar se dados estão estruturados corretamente
    cy.get('[data-testid="grid-nfe-simples"] tbody tr')
      .first()
      .within(() => {
        cy.get('td').should('have.length.greaterThan', 5);
      });
      
    cy.log('[TEST] ✅ Agrupamento configurável funcionando na visualização unificada');
  });

  it('deve tratar busca e filtragem entre coleções', () => {
    cy.log('[TEST] 🔍 Testando busca e filtragem entre coleções');
    
    cy.visit('/notas-fiscais-unificada');
    cy.waitForLoad();
    
    // Verificar filtros gerais
    cy.get('[data-testid="filtro-notas"]')
      .should('be.visible');
    
    // Testar busca por CNPJ
    cy.get('[data-testid="cnpj-filter"]')
      .clear()
      .type('12345678000195');
    cy.get('[data-testid="aplicar-filtros"]').click();
    cy.waitForLoad();
    
    // Verificar se filtro foi aplicado
    cy.get('[data-testid="grid-nfe-simples"]')
      .should('be.visible');
    
    cy.log('[TEST] 🔍 Filtro por CNPJ aplicado');
    
    // Limpar filtros
    cy.get('[data-testid="limpar-filtros"]').click();
    cy.waitForLoad();
    
    // Verificar se filtros foram limpos
    cy.get('[data-testid="cnpj-filter"]')
      .should('have.value', '');
      
    cy.log('[TEST] ✅ Busca e filtragem funcionando');
  });

  it('deve exibir estados de carregamento apropriados', () => {
    cy.log('[TEST] ⏳ Testando estados de carregamento');
    
    cy.visit('/notas-fiscais-unificada');
    
    // Verificar loading inicial
    cy.get('[data-testid="loading-spinner"]')
      .should('be.visible');
    
    // Aguardar carregamento
    cy.waitForLoad();
    
    // Verificar se loading desapareceu
    cy.get('[data-testid="loading-spinner"]')
      .should('not.exist');
    
    cy.log('[TEST] ⏳ Loading inicial funcionando');
    
    // Testar loading ao mudar coleção
    cy.get('[data-testid="collection-selector"]').select('tbl_cfe_100');
    
    // Pode haver loading temporário
    cy.waitForLoad();
    
    // Verificar se nova coleção carregou
    cy.get('[data-testid="grid-cfe-simples"]')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Estados de carregamento funcionando');
  });

  it('deve tratar estados vazios graciosamente', () => {
    cy.log('[TEST] 📭 Testando tratamento de estados vazios');
    
    // Interceptar API para retornar dados vazios
    cy.intercept('GET', '**/api/documents**', { 
      body: {
        success: true, 
        data: [], 
        total: 0 
      }
    }).as('emptyData');
    
    cy.visit('/notas-fiscais-unificada');
    
    // Aguardar resposta vazia
    cy.wait('@emptyData');
    
    // Verificar estado vazio
    cy.get('[data-testid="empty-state"]')
      .should('be.visible');
    cy.get('[data-testid="empty-message"]')
      .should('contain', 'Nenhuma nota encontrada');
    
    // Verificar sugestões para o usuário
    cy.get('[data-testid="empty-suggestions"]')
      .should('be.visible');
      
    cy.log('[TEST] ✅ Estados vazios tratados graciosamente');
  });
});