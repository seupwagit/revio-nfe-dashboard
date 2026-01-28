/// <reference types="cypress" />
/// <reference path="./cypress.d.ts" />

/**
 * Comandos customizados do Cypress
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

// Comando de login obrigatório
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.log(`[LOGIN] 🔐 Realizando login com usuário: ${email}`);
  
  cy.session([email, password], () => {
    cy.visit('/login');
    
    // Aguardar página carregar
    cy.get('[data-testid="email-input"]', { timeout: 10000 }).should('be.visible');
    
    // Preencher credenciais
    cy.get('[data-testid="email-input"]').clear().type(email);
    cy.get('[data-testid="password-input"]').clear().type(password);
    
    // Realizar login
    cy.get('[data-testid="login-button"]').click();
    
    // Verificar sucesso do login
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="user-menu"]', { timeout: 10000 }).should('be.visible');
    
    cy.log(`[LOGIN] ✅ Login realizado com sucesso para: ${email}`);
  });
});

// Comando para aguardar carregamento
Cypress.Commands.add('waitForLoad', () => {
  cy.log('[WAIT] ⏳ Aguardando carregamento da página');
  
  // Aguardar spinners desaparecerem
  cy.get('[data-testid="loading-spinner"]', { timeout: 15000 }).should('not.exist');
  
  // Verificar se não há mensagens de erro
  cy.get('[data-testid="error-message"]').should('not.exist');
  
  // Aguardar um pouco para estabilizar
  cy.wait(500);
  
  cy.log('[WAIT] ✅ Carregamento concluído');
});

// Comando para aguardar dados NFe
Cypress.Commands.add('waitForNFeData', () => {
  cy.log('[NFE] ⏳ Aguardando carregamento de dados NFe');
  
  // Aguardar spinners desaparecerem
  cy.get('[data-testid="loading-spinner"]', { timeout: 15000 }).should('not.exist');
  
  // Aguardar processamento adicional específico para NFe
  cy.wait(2000);
  
  cy.log('[NFE] ✅ Dados NFe carregados');
});

// Comando para verificar se dados NFe foram carregados
Cypress.Commands.add('verifyNFeDataLoaded', () => {
  cy.log('[NFE] 🔍 Verificando se dados NFe foram carregados');
  
  // Verificar se há linhas na tabela
  cy.get('table tbody tr').should('have.length.greaterThan', 0);
  
  // Verificar se há dados válidos (números, valores, etc.)
  cy.get('table tbody tr').first().should('contain.text', /\d+/);
  
  cy.log('[NFE] ✅ Dados NFe verificados e válidos');
});

// Comando para interceptar APIs
Cypress.Commands.add('mockApi', (method: string, url: string, response: any) => {
  cy.log(`[API] 🔌 Interceptando ${method} ${url}`);
  
  // Validar método HTTP
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  const upperMethod = method.toUpperCase();
  
  if (!validMethods.includes(upperMethod)) {
    throw new Error(`[API] ❌ Método HTTP inválido: ${method}`);
  }
  
  cy.intercept(upperMethod as any, url, response).as('apiCall');
  
  cy.log(`[API] ✅ Interceptador configurado para ${upperMethod} ${url}`);
});

export { };

