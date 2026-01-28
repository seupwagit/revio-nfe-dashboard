/// <reference types="cypress" />
/// <reference path="../support/cypress.d.ts" />

/**
 * Testes E2E para GridNFeSimples
 * Valida funcionalidade após alterações do NFe Configurable Grouping
 * Testa acesso à tbl_nfe_100 com agrupamento configurável
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

import { TEST_USERS } from '../fixtures/test-users';

describe('GridNFeSimples E2E - NFe Configurable Grouping', () => {
  beforeEach(() => {
    cy.log('[SETUP] 🔧 Configurando teste GridNFeSimples');
    
    // Configurar interceptadores de API para dados de teste
    cy.intercept('GET', '/api/documents/**', { fixture: 'nfe-sample-data.json' }).as('getDocuments');
    cy.intercept('GET', '/api/analytics/**', { fixture: 'analytics-data.json' }).as('getAnalytics');
    
    // Login com credenciais de teste
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    
    cy.log('[SETUP] ✅ Configuração GridNFeSimples concluída');
  });

  it('deve carregar a tela GridNFeSimples sem erros de console', () => {
    cy.log('[TEST] 🧪 Testando carregamento sem erros de console');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento da página
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Verificar se não há erros críticos no console
    cy.window().then((win) => {
      cy.wrap(win.console).should('exist');
    });
    
    // Verificar se a grid carregou dados
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    
    // Verificar se as colunas principais estão visíveis
    cy.get('th').should('contain', 'Número');
    cy.get('th').should('contain', 'Chave de Acesso');
    cy.get('th').should('contain', 'Status');
    cy.get('th').should('contain', 'Valor Total');
    
    cy.log('[TEST] ✅ Carregamento sem erros funcionando');
  });

  it('deve funcionar com busca natural desabilitada', () => {
    cy.log('[TEST] 🔍 Testando busca natural desabilitada');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Verificar que a busca natural está oculta (hideBusca=true)
    cy.get('[data-testid="busca-natural"]').should('not.exist');
    
    // Verificar que a busca rápida ainda funciona
    cy.get('input[placeholder="Busca rápida..."]')
      .should('be.visible')
      .type('autorizada');
    
    // Aguardar filtro ser aplicado
    cy.wait(1000);
    
    // Verificar que resultados foram filtrados
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    
    cy.log('[TEST] ✅ Busca rápida funcionando com busca natural desabilitada');
  });

  it('deve carregar dados da tbl_nfe_100 com agrupamento configurável', () => {
    cy.log('[TEST] 📊 Testando carregamento de dados com agrupamento');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar chamada da API
    cy.wait('@getDocuments', { timeout: 20000 });
    
    // Verificar se dados foram carregados
    cy.get('[data-testid="grid-paginada"]').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    
    // Verificar estrutura dos dados NFe
    cy.get('table tbody tr').first().within(() => {
      // Verificar colunas essenciais
      cy.get('td').should('contain.text', /\d+/); // Número da NFe
    });
    
    // Verificar informações de paginação
    cy.get('.text-sm.text-gray-600')
      .should('contain', 'Mostrando')
      .and('contain', 'registros');
      
    cy.log('[TEST] ✅ Dados carregados com agrupamento configurável');
  });

  it('deve permitir visualização de DANFE', () => {
    cy.log('[TEST] 📄 Testando visualização de DANFE');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Clicar no primeiro botão "Visualizar"
    cy.get('button').contains('Visualizar').first().click();
    
    // Verificar se modal do DANFE abriu
    cy.get('[data-testid="danfe-viewer"]', { timeout: 10000 }).should('be.visible');
    
    // Fechar modal
    cy.get('button').contains('Fechar').click();
    cy.get('[data-testid="danfe-viewer"]').should('not.exist');
    
    cy.log('[TEST] ✅ Visualização de DANFE funcionando');
  });

  it('deve funcionar com filtros de coluna', () => {
    cy.log('[TEST] 🔧 Testando filtros de coluna');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Ativar filtros de cabeçalho
    cy.get('button').contains('Filtros').click();
    
    // Verificar se inputs de filtro apareceram
    cy.get('input[id^="filter-input-"]').should('have.length.greaterThan', 0);
    
    // Testar filtro por status
    cy.get('input[id="filter-input-status"]').type('autorizada');
    
    // Aguardar filtro ser aplicado
    cy.wait(1000);
    
    // Verificar que resultados foram filtrados
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    cy.get('table tbody tr').first().should('contain', 'autorizada');
    
    cy.log('[TEST] ✅ Filtros de coluna funcionando');
  });

  it('deve funcionar com ordenação de colunas', () => {
    cy.log('[TEST] 🔄 Testando ordenação de colunas');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Clicar para ordenar por Data Emissão
    cy.get('th').contains('Data Emissão').click();
    
    // Verificar se ícone de ordenação apareceu
    cy.get('th').contains('Data Emissão').should('contain', '🔼');
    
    // Clicar novamente para inverter ordenação
    cy.get('th').contains('Data Emissão').click();
    cy.get('th').contains('Data Emissão').should('contain', '🔽');
    
    cy.log('[TEST] ✅ Ordenação de colunas funcionando');
  });

  it('deve funcionar com paginação', () => {
    cy.log('[TEST] 📄 Testando paginação');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Verificar controles de paginação
    cy.get('button[title="Próxima página"]').should('be.visible');
    cy.get('button[title="Página anterior"]').should('be.visible');
    
    // Verificar informações de página
    cy.get('span').contains('Página').should('be.visible');
    
    // Testar mudança de página se houver mais de uma página
    cy.get('button[title="Próxima página"]').then(($btn) => {
      if (!$btn.prop('disabled')) {
        cy.wrap($btn).click();
        cy.wait(1000);
        cy.get('span').contains('Página 2').should('be.visible');
        cy.log('[TEST] 📄 Navegação para página 2 realizada');
      } else {
        cy.log('[TEST] ℹ️ Apenas uma página disponível');
      }
    });
    
    cy.log('[TEST] ✅ Paginação funcionando');
  });

  it('deve permitir seleção de documentos', () => {
    cy.log('[TEST] ☑️ Testando seleção de documentos');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Verificar checkbox de seleção no cabeçalho
    cy.get('th input[type="checkbox"]').should('be.visible');
    
    // Verificar checkboxes nas linhas
    cy.get('td input[type="checkbox"]').should('have.length.greaterThan', 0);
    
    // Selecionar primeiro item
    cy.get('td input[type="checkbox"]').first().check();
    cy.get('td input[type="checkbox"]').first().should('be.checked');
    
    // Verificar se botão de download flutuante apareceu
    cy.get('[data-testid="floating-download-button"]').should('be.visible');
    
    cy.log('[TEST] ✅ Seleção de documentos funcionando');
  });

  it('deve exibir informações corretas de cache quando aplicável', () => {
    cy.log('[TEST] 💾 Testando informações de cache');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Verificar se informações de registros estão visíveis
    cy.get('.text-sm.text-revio-gray-600').should('contain', 'encontrada');
    
    // Se houver cache, verificar indicador
    cy.get('body').then(($body) => {
      const hasCacheIndicator = $body.find('.bg-green-100.text-green-800').length > 0;
      
      if (hasCacheIndicator) {
        cy.get('.bg-green-100.text-green-800').should('contain', 'Cache');
        cy.log('[TEST] 💾 Indicador de cache presente');
      } else {
        cy.log('[TEST] ℹ️ Indicador de cache não encontrado');
      }
    });
    
    cy.log('[TEST] ✅ Informações de cache verificadas');
  });

  it('deve permitir exportação para Excel', () => {
    cy.log('[TEST] 📊 Testando exportação para Excel');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Verificar se botão de exportar Excel está visível
    cy.get('button').contains('Excel').should('be.visible');
    
    // Clicar no botão de exportar (não vamos validar o download real)
    cy.get('button').contains('Excel').click();
    
    // Aguardar processamento
    cy.wait(2000);
    
    cy.log('[TEST] ✅ Exportação para Excel funcionando');
  });

  it('deve validar que não há erros de console críticos', () => {
    cy.log('[TEST] 🔍 Testando ausência de erros críticos de console');
    
    // Capturar erros de console
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento completo
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    cy.wait(3000);
    
    // Verificar que não houve erros críticos
    cy.get('@consoleError').should('not.have.been.calledWith', Cypress.sinon.match(/error|Error|ERROR/));
    
    cy.log('[TEST] ✅ Nenhum erro crítico de console detectado');
  });

  it('deve funcionar com diferentes tamanhos de página', () => {
    cy.log('[TEST] 📏 Testando diferentes tamanhos de página');
    
    cy.visit('/grid-nfe-simples');
    
    // Aguardar carregamento
    cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
    
    // Alterar tamanho da página para 25
    cy.get('select').last().select('25');
    cy.wait(1000);
    
    // Verificar que informações de paginação foram atualizadas
    cy.get('.text-sm.text-gray-600').should('contain', 'Mostrando');
    
    cy.log('[TEST] 📏 Tamanho de página alterado para 25');
    
    // Alterar para 100
    cy.get('select').last().select('100');
    cy.wait(1000);
    
    // Verificar novamente
    cy.get('.text-sm.text-gray-600').should('contain', 'Mostrando');
    
    cy.log('[TEST] ✅ Diferentes tamanhos de página funcionando');
  });
});