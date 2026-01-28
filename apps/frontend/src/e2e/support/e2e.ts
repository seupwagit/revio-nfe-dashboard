/**
 * Configuração E2E do Cypress
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

// Importar comandos customizados
import './commands';

// Configurações globais para E2E
beforeEach(() => {
  cy.log('[SETUP] 🔧 Configurando ambiente de teste E2E');
  
  // Interceptar chamadas de API para evitar erros de rede em testes
  cy.intercept('GET', '**/api/**', { fixture: 'empty-response.json' }).as('defaultApiCalls');
  
  // Configurar viewport padrão para consistência
  cy.viewport(1280, 720);
  
  cy.log('[SETUP] ✅ Ambiente E2E configurado');
});

// Tratar erros não capturados
Cypress.on('uncaught:exception', (err) => {
  cy.log(`[ERROR] ⚠️ Erro não capturado: ${err.message}`);
  
  // Lista de erros conhecidos que podem ser ignorados
  const ignoredErrors = [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Script error',
    'Network request failed'
  ];
  
  // Verificar se é um erro que pode ser ignorado
  const shouldIgnore = ignoredErrors.some(ignoredError => 
    err.message.includes(ignoredError)
  );
  
  if (shouldIgnore) {
    cy.log(`[ERROR] ℹ️ Erro ignorado: ${err.message}`);
    return false; // Não falhar o teste
  }
  
  // Log do erro para debug
  cy.log(`[ERROR] ❌ Erro crítico: ${err.message}`);
  console.error('Cypress uncaught exception:', err);
  
  // Permitir que outros erros falhem o teste
  return true;
});

// Configurar logs estruturados para melhor debugging
Cypress.on('log:added', (attrs) => {
  if (attrs.name === 'log') {
    console.log(`[CYPRESS] ${attrs.message}`);
  }
});

export { };

