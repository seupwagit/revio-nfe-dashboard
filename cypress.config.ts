import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000',
    specPattern: 'apps/frontend/src/e2e/**/*.cy.ts',
    supportFile: 'apps/frontend/src/e2e/support/e2e.ts',
    fixturesFolder: 'apps/frontend/src/e2e/fixtures',
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      // Variáveis de ambiente para testes
      API_BASE_URL: 'http://localhost:4001',
      TEST_USER_EMAIL: 'divino@grupochama.com.br',
      TEST_USER_PASSWORD: '123456789'
    },
    setupNodeEvents(on, config) {
      // Configurar plugins se necessário
      
      // Task para logs customizados
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
      
      return config;
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'apps/frontend/src/**/*.cy.{js,jsx,ts,tsx}',
    video: true
  }
});