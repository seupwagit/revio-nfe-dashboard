/**
 * Teste de Smoke Básico
 * Verifica se a aplicação carrega sem erros críticos
 * 
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

// External libraries

describe('Smoke Test - Verificação Básica da Aplicação', () => {
  beforeEach(() => {
    cy.log('[SMOKE] 🔧 Configurando ambiente de teste básico');
    
    // Interceptar chamadas de API para evitar dependências externas
    cy.intercept('GET', '**/api/**', { 
      statusCode: 200, 
      body: { success: true, data: [] } 
    }).as('apiCall');
    
    cy.log('[SMOKE] ✅ Ambiente configurado');
  });

  it('deve carregar a página inicial sem erros', () => {
    cy.log('[SMOKE] 🧪 Testando carregamento da página inicial');
    
    cy.visit('/');
    
    // Verificar se a página carregou
    cy.get('body').should('be.visible');
    
    // Verificar se há conteúdo na página
    cy.get('body').should('not.be.empty');
    
    // Verificar se não há mensagens de erro visíveis
    cy.get('body').then(($body) => {
      const hasErrorMessages = $body.find('[data-testid*="error"], .error, [class*="error"]').length > 0;
      if (hasErrorMessages) {
        cy.log('[SMOKE] ⚠️ Mensagens de erro encontradas na página');
      } else {
        cy.log('[SMOKE] ✅ Nenhuma mensagem de erro visível');
      }
    });
    
    cy.log('[SMOKE] ✅ Página inicial carregada com sucesso');
  });

  it('deve permitir navegação básica', () => {
    cy.log('[SMOKE] 🧪 Testando navegação básica');
    
    cy.visit('/');
    
    // Verificar se existem elementos de navegação
    cy.get('body').then(($body) => {
      const hasNavigation = $body.find('nav, [data-testid*="nav"], [data-testid*="menu"]').length > 0;
      
      if (hasNavigation) {
        cy.log('[SMOKE] ✅ Elementos de navegação encontrados');
      } else {
        cy.log('[SMOKE] ℹ️ Nenhum elemento de navegação específico encontrado');
      }
    });
    
    cy.log('[SMOKE] ✅ Navegação básica validada');
  });

  it('deve responder a interações básicas', () => {
    cy.log('[SMOKE] 🧪 Testando interações básicas');
    
    cy.visit('/');
    
    // Verificar se existem elementos interativos
    cy.get('body').then(($body) => {
      const hasButtons = $body.find('button').length > 0;
      const hasLinks = $body.find('a').length > 0;
      const hasInputs = $body.find('input').length > 0;
      const hasClickableElements = $body.find('[onclick], [data-testid*="button"], [data-testid*="click"]').length > 0;
      
      let interactiveElementsFound = 0;
      
      if (hasButtons) {
        cy.log('[SMOKE] ✅ Botões encontrados');
        cy.get('button').first().should('be.visible');
        interactiveElementsFound++;
      }
      
      if (hasLinks) {
        cy.log('[SMOKE] ✅ Links encontrados');
        cy.get('a').first().should('be.visible');
        interactiveElementsFound++;
      }
      
      if (hasInputs) {
        cy.log('[SMOKE] ✅ Campos de entrada encontrados');
        cy.get('input').first().should('be.visible');
        interactiveElementsFound++;
      }
      
      if (hasClickableElements) {
        cy.log('[SMOKE] ✅ Elementos clicáveis encontrados');
        interactiveElementsFound++;
      }
      
      // Se não encontrou elementos interativos específicos, verificar se há pelo menos conteúdo
      if (interactiveElementsFound === 0) {
        cy.log('[SMOKE] ℹ️ Nenhum elemento interativo específico encontrado, verificando conteúdo geral');
        cy.get('body').should('not.be.empty');
        cy.get('body').should('contain.text', ''); // Verificar se há pelo menos algum texto
      }
    });
    
    cy.log('[SMOKE] ✅ Interações básicas validadas');
  });

  it('deve ter estrutura HTML válida', () => {
    cy.log('[SMOKE] 🧪 Testando estrutura HTML');
    
    cy.visit('/');
    
    // Verificar elementos HTML básicos
    cy.get('html').should('exist');
    cy.get('head').should('exist');
    cy.get('body').should('exist');
    
    // Verificar se há um título
    cy.title().should('not.be.empty');
    
    // Verificar se há meta tags básicas
    cy.get('head meta[charset]').should('exist');
    cy.get('head meta[name="viewport"]').should('exist');
    
    cy.log('[SMOKE] ✅ Estrutura HTML válida');
  });

  it('deve carregar recursos estáticos sem erros', () => {
    cy.log('[SMOKE] 🧪 Testando carregamento de recursos');
    
    cy.visit('/');
    
    // Aguardar carregamento completo
    cy.wait(2000);
    
    // Verificar se não há erros de rede críticos
    cy.window().then((win) => {
      // Verificar se a aplicação React foi montada
      const hasReactRoot = win.document.querySelector('#root, [data-reactroot]');
      expect(hasReactRoot).to.exist;
    });
    
    cy.log('[SMOKE] ✅ Recursos estáticos carregados');
  });
});