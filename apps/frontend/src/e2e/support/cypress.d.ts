/// <reference types="cypress" />

/**
 * Definições de tipos para comandos customizados do Cypress
 * Baseado em .kiro/steering/testing-environment-rules.md
 * Seguindo .kiro/steering/code-quality-rules.md
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Comando de login obrigatório
       * Realiza login usando sessão do Cypress para otimização
       * @param email - Email do usuário
       * @param password - Senha do usuário
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Comando para aguardar carregamento
       * Aguarda que spinners de loading desapareçam e não haja mensagens de erro
       */
      waitForLoad(): Chainable<void>;

      /**
       * Comando para aguardar dados NFe
       * Aguarda carregamento específico de dados NFe com timeout estendido
       */
      waitForNFeData(): Chainable<void>;

      /**
       * Comando para verificar se dados NFe foram carregados
       * Verifica se há dados na tabela e se contêm informações válidas
       */
      verifyNFeDataLoaded(): Chainable<void>;

      /**
       * Comando para interceptar APIs
       * Cria interceptador de API com alias automático
       * @param method - Método HTTP (GET, POST, PUT, DELETE)
       * @param url - URL ou padrão da URL
       * @param response - Resposta mockada
       */
      mockApi(method: string, url: string, response: any): Chainable<void>;
    }
  }
}

export { };
