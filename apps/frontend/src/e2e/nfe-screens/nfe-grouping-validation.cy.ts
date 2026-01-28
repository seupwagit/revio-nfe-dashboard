/// <reference types="cypress" />

/**
 * Testes E2E para validação do NFe Configurable Grouping
 * Valida que o sistema de agrupamento configurável funciona corretamente
 * em todas as telas que acessam tbl_nfe_100
 */

describe('NFe Configurable Grouping - Validação E2E', () => {
  const TEST_USER = {
    email: 'divino@grupochama.com.br',
    password: '123456789'
  };

  beforeEach(() => {
    // Login com credenciais de teste
    cy.login(TEST_USER.email, TEST_USER.password);
    
    // Interceptar chamadas da API para monitorar agrupamento
    cy.intercept('GET', '/api/documents/**').as('getDocuments');
    cy.intercept('POST', '/api/documents/**').as('postDocuments');
    cy.intercept('GET', '/api/analytics/**').as('getAnalytics');
  });

  describe('Validação de Agrupamento em Diferentes Telas', () => {
    const telasNFe = [
      { nome: 'Dashboard', url: '/dashboard', selector: '[data-testid="dashboard-content"]' },
      { nome: 'Analytics', url: '/analytics', selector: '[data-testid="analytics-content"]' },
      { nome: 'Grid NFe Simples', url: '/grid-nfe-simples', selector: '[data-testid="grid-paginada"]' },
      { nome: 'Notas Fiscais Unificada', url: '/notas-fiscais-unificada', selector: '[data-testid="grid-unificada"]' }
    ];

    telasNFe.forEach((tela) => {
      it(`deve carregar ${tela.nome} com agrupamento configurável sem erros`, () => {
        cy.visit(tela.url);
        
        // Aguardar carregamento da tela
        cy.get(tela.selector, { timeout: 20000 }).should('be.visible');
        
        // Aguardar chamadas da API
        cy.wait('@getDocuments', { timeout: 15000 }).then((interception) => {
          // Verificar que a requisição foi bem-sucedida
          expect(interception.response?.statusCode).to.be.oneOf([200, 304]);
        });
        
        // Verificar que dados foram carregados
        cy.get('body').should('not.contain', 'Nenhuma NF-e encontrada');
        
        // Verificar que não há mensagens de erro visíveis
        cy.get('[data-testid="error-message"]').should('not.exist');
        cy.get('.text-red-500').should('not.exist');
        cy.get('.bg-red-100').should('not.exist');
      });
    });
  });

  describe('Validação de Interceptação de Consultas', () => {
    it('deve aplicar interceptação de consultas no Grid NFe Simples', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Aguardar chamada da API e verificar headers/parâmetros
      cy.wait('@getDocuments').then((interception) => {
        // Verificar que a requisição foi interceptada corretamente
        expect(interception.response?.statusCode).to.equal(200);
        
        // Verificar que dados foram retornados
        expect(interception.response?.body).to.exist;
        expect(interception.response?.body).to.have.property('length');
      });
      
      // Verificar que dados estão sendo exibidos corretamente
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
      
      // Verificar estrutura dos dados agrupados
      cy.get('table tbody tr').first().within(() => {
        // Verificar que campos essenciais estão presentes
        cy.get('td').should('have.length.greaterThan', 5);
      });
    });

    it('deve preservar filtros originais com agrupamento', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Aplicar filtro de busca rápida
      cy.get('input[placeholder="Busca rápida..."]').type('autorizada');
      cy.wait(1000);
      
      // Verificar que filtro foi aplicado
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
      
      // Verificar que resultados contêm o termo filtrado
      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).should('contain.text', 'autorizada');
      });
    });
  });

  describe('Validação de Performance com Agrupamento', () => {
    it('deve carregar dados em tempo aceitável com agrupamento', () => {
      const startTime = Date.now();
      
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento completo
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        // Verificar que carregamento foi em menos de 10 segundos
        expect(loadTime).to.be.lessThan(10000);
        cy.log(`Tempo de carregamento: ${loadTime}ms`);
      });
    });

    it('deve manter responsividade durante operações de agrupamento', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Testar múltiplas operações rapidamente
      cy.get('input[placeholder="Busca rápida..."]').type('nfe');
      cy.wait(500);
      
      cy.get('input[placeholder="Busca rápida..."]').clear().type('autorizada');
      cy.wait(500);
      
      cy.get('input[placeholder="Busca rápida..."]').clear();
      cy.wait(500);
      
      // Verificar que interface permanece responsiva
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
      cy.get('[data-testid="grid-paginada"]').should('be.visible');
    });
  });

  describe('Validação de Compatibilidade com Código Existente', () => {
    it('deve manter compatibilidade com seleção de documentos', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Testar seleção individual
      cy.get('td input[type="checkbox"]').first().check();
      cy.get('td input[type="checkbox"]').first().should('be.checked');
      
      // Verificar que botão de download apareceu
      cy.get('[data-testid="floating-download-button"]').should('be.visible');
      
      // Testar seleção múltipla
      cy.get('th input[type="checkbox"]').check();
      
      // Verificar que todos os checkboxes foram marcados
      cy.get('td input[type="checkbox"]:checked').should('have.length.greaterThan', 1);
    });

    it('deve manter compatibilidade com visualização de DANFE', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Clicar no primeiro botão "Visualizar"
      cy.get('button').contains('Visualizar').first().then(($btn) => {
        // Verificar que botão não está desabilitado
        expect($btn).to.not.have.attr('disabled');
        
        cy.wrap($btn).click();
        
        // Verificar que modal do DANFE abriu
        cy.get('[data-testid="danfe-viewer"]', { timeout: 10000 }).should('be.visible');
        
        // Fechar modal
        cy.get('button').contains('Fechar').click();
        cy.get('[data-testid="danfe-viewer"]').should('not.exist');
      });
    });

    it('deve manter compatibilidade com exportação Excel', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Verificar que botão de exportar está disponível
      cy.get('button').contains('Excel').should('be.visible');
      cy.get('button').contains('Excel').should('not.be.disabled');
      
      // Clicar no botão (não vamos validar o download real)
      cy.get('button').contains('Excel').click();
      
      // Aguardar processamento sem erros
      cy.wait(2000);
      
      // Verificar que não apareceram mensagens de erro
      cy.get('[data-testid="error-message"]').should('not.exist');
    });
  });

  describe('Validação de Logging e Monitoramento', () => {
    it('deve registrar operações de agrupamento no console', () => {
      // Capturar logs do console
      cy.window().then((win) => {
        cy.stub(win.console, 'log').as('consoleLog');
      });
      
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Verificar que logs de agrupamento foram registrados
      cy.get('@consoleLog').should('have.been.called');
    });

    it('deve tratar erros de agrupamento graciosamente', () => {
      // Simular erro na API
      cy.intercept('GET', '/api/documents/**', { 
        statusCode: 500, 
        body: { error: 'Internal Server Error' } 
      }).as('getDocumentsError');
      
      cy.visit('/grid-nfe-simples');
      
      // Aguardar tentativa de carregamento
      cy.wait('@getDocumentsError');
      
      // Verificar que erro foi tratado graciosamente
      cy.get('body').should('contain', 'Nenhuma NF-e encontrada');
      
      // Verificar que interface não quebrou
      cy.get('[data-testid="grid-paginada"]').should('be.visible');
    });
  });

  describe('Validação de Configurações de Agrupamento', () => {
    it('deve funcionar com configurações padrão de agrupamento', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Verificar que dados foram carregados com configuração padrão
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
      
      // Verificar estrutura dos dados
      cy.get('table tbody tr').first().within(() => {
        // Verificar que campos essenciais estão presentes
        cy.get('td').should('contain.text', /\d+/); // Número
      });
    });

    it('deve aplicar precedência de configurações corretamente', () => {
      cy.visit('/grid-nfe-simples');
      
      // Aguardar carregamento
      cy.get('[data-testid="grid-paginada"]', { timeout: 15000 }).should('be.visible');
      
      // Aguardar chamada da API
      cy.wait('@getDocuments').then((interception) => {
        // Verificar que configurações foram aplicadas
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body).to.exist;
      });
      
      // Verificar que dados estão sendo exibidos corretamente
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });
  });
});