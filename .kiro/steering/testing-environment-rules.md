# Steering: Testing e Environment - Regras Prioritárias

## **Configuração de Testes Obrigatória**

### **Stack de Testes Obrigatória**

**SEMPRE usar esta stack de testes:**
- ✅ **Unit Tests**: Vitest (substituindo Jest)
- ✅ **Integration Tests**: Vitest + Testcontainers
- ✅ **E2E Tests**: Cypress com gravação de vídeo
- ✅ **Component Tests**: Vitest + Testing Library

### **Vitest Configuration Obrigatória**

**vitest.config.ts (root):**
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        'src/e2e/**/*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@fiscal/shared': resolve(__dirname, './packages/shared/src')
    }
  }
});
```

**apps/frontend/vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts'
      ]
    }
  }
});
```

### **Testcontainers para Integration Tests**

**OBRIGATÓRIO para testes de integração:**
```typescript
// apps/backend/src/__tests__/integration/setup.ts
import { GenericContainer, StartedTestContainer } from 'testcontainers';

export class TestDatabase {
  private static mongoContainer: StartedTestContainer;
  private static sqlServerContainer: StartedTestContainer;

  static async setup(): Promise<void> {
    // MongoDB Container
    this.mongoContainer = await new GenericContainer('mongo:7')
      .withEnvironment({
        MONGO_INITDB_ROOT_USERNAME: 'testuser',
        MONGO_INITDB_ROOT_PASSWORD: 'testpass'
      })
      .withExposedPorts(27017)
      .start();

    // SQL Server Container
    this.sqlServerContainer = await new GenericContainer('mcr.microsoft.com/mssql/server:2022-latest')
      .withEnvironment({
        SA_PASSWORD: 'TestPass123!',
        ACCEPT_EULA: 'Y'
      })
      .withExposedPorts(1433)
      .start();

    // Set environment variables for tests
    process.env.VITE_MONGODB_CONNECTION_STRING = 
      `mongodb://testuser:testpass@localhost:${this.mongoContainer.getMappedPort(27017)}/testdb`;
    
    process.env.DATABASE_URL = 
      `sqlserver://localhost:${this.sqlServerContainer.getMappedPort(1433)};database=testdb;user=sa;password=TestPass123!;encrypt=false;trustServerCertificate=true`;
  }

  static async teardown(): Promise<void> {
    if (this.mongoContainer) {
      await this.mongoContainer.stop();
    }
    if (this.sqlServerContainer) {
      await this.sqlServerContainer.stop();
    }
  }
}
```

## **Cypress E2E Configuration**

### **Cypress Configuration Obrigatória**

**cypress.config.ts:**
```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3080',
    specPattern: 'src/e2e/**/*.cy.ts',
    supportFile: 'src/e2e/support/e2e.ts',
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Configurar plugins se necessário
      return config;
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    video: true
  }
});
```

### **Cypress Commands Customizados**

**src/e2e/support/commands.ts:**
```typescript
// Comando de login obrigatório
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
});

// Comando para aguardar carregamento
Cypress.Commands.add('waitForLoad', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
  cy.get('[data-testid="error-message"]').should('not.exist');
});

// Comando para interceptar APIs
Cypress.Commands.add('mockApi', (method: string, url: string, response: any) => {
  cy.intercept(method, url, response).as('apiCall');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      waitForLoad(): Chainable<void>;
      mockApi(method: string, url: string, response: any): Chainable<void>;
    }
  }
}
```

## **Usuários de Teste Obrigatórios**

### **Credenciais de Teste**

**SEMPRE usar estes usuários para testes:**
```typescript
// src/__tests__/fixtures/test-users.ts
export const TEST_USERS = {
  ADMIN: {
    email: 'divino@grupochama.com.br',
    password: '123456789',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  MASTER: {
    email: 'master',
    password: '12makem345',
    role: 'master',
    permissions: ['read', 'write', 'delete', 'admin', 'master']
  },
  REGULAR_USER: {
    email: 'user@test.com',
    password: 'testpass123',
    role: 'user',
    permissions: ['read']
  }
} as const;
```

### **Uso em Testes E2E**

**OBRIGATÓRIO usar credenciais reais:**
```typescript
// src/e2e/auth/login.cy.ts
import { TEST_USERS } from '../fixtures/test-users';

describe('Authentication E2E', () => {
  it('should login with admin credentials', () => {
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    cy.visit('/dashboard');
    cy.get('[data-testid="admin-panel"]').should('be.visible');
  });

  it('should login with master credentials', () => {
    cy.login(TEST_USERS.MASTER.email, TEST_USERS.MASTER.password);
    cy.visit('/dashboard');
    cy.get('[data-testid="master-controls"]').should('be.visible');
  });
});
```

## **Estrutura de Testes Obrigatória**

### **Organização de Diretórios**

```
src/
├── __tests__/                     # Testes unitários (Vitest)
│   ├── unit/
│   │   ├── backend/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.test.ts
│   │   │   │   ├── danfe.service.test.ts
│   │   │   │   └── fiscal-documents.service.test.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.test.ts
│   │   │   │   ├── danfe.routes.test.ts
│   │   │   │   └── analytics.routes.test.ts
│   │   │   └── middleware/
│   │   │       └── auth.middleware.test.ts
│   │   ├── frontend/
│   │   │   ├── components/
│   │   │   │   ├── DANFEViewer.test.tsx
│   │   │   │   ├── ProtectedRoute.test.tsx
│   │   │   │   └── ConnectivityIndicator.test.tsx
│   │   │   ├── services/
│   │   │   │   ├── httpService.test.ts
│   │   │   │   └── aggregation.test.ts
│   │   │   └── hooks/
│   │   │       └── useConnectivity.test.ts
│   │   └── shared/
│   │       ├── types/
│   │       ├── schemas/
│   │       └── utils/
│   ├── integration/               # Testes de integração (Vitest + Testcontainers)
│   │   ├── backend/
│   │   │   ├── auth-flow.integration.test.ts
│   │   │   ├── danfe-generation.integration.test.ts
│   │   │   └── database-routing.integration.test.ts
│   │   └── frontend/
│   │       ├── api-integration.test.tsx
│   │       └── component-integration.test.tsx
│   ├── fixtures/                  # Dados de teste
│   │   ├── test-users.ts
│   │   ├── mock-data.ts
│   │   └── test-documents.ts
│   └── setup.ts                   # Configuração global de testes
└── e2e/                          # Testes E2E (Cypress)
    ├── auth/
    │   ├── login.cy.ts
    │   └── protected-routes.cy.ts
    ├── danfe/
    │   ├── danfe-viewer.cy.ts
    │   └── pdf-generation.cy.ts
    ├── analytics/
    │   └── dashboard.cy.ts
    ├── downloads/
    │   └── document-download.cy.ts
    ├── fixtures/
    │   └── test-users.ts
    └── support/
        ├── commands.ts
        └── e2e.ts
```

## **Environment Files - Regras Obrigatórias**

### **SEMPRE Manter Atualizados**

**OBRIGATÓRIO manter sincronizados:**
- ✅ `.env.example` - Template para desenvolvimento
- ✅ `.env.production.example` - Template para produção
- ✅ `.env.test` - Configuração para testes

### **Variáveis de Teste Obrigatórias**

**.env.test:**
```bash
# Test Environment Configuration
NODE_ENV=test

# Test Database URLs (will be overridden by Testcontainers)
VITE_MONGODB_CONNECTION_STRING=mongodb://testuser:testpass@localhost:27017/testdb
DATABASE_URL=sqlserver://localhost:1433;database=testdb;user=sa;password=TestPass123!;encrypt=false

# Test API Configuration
VITE_API_BASE_URL=http://localhost:3081
VITE_API_BEARER_TOKEN=test_token_here

# Test Database Configuration
VITE_DB_HOST=localhost
VITE_DB_DATABASE=testdb
VITE_DB_COLLECTION=test_collection

# Test Pagination
VITE_DEFAULT_PAGE_SIZE=10
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=30

# Disable external services in tests
VITE_S3_ENDPOINT=
VITE_S3_ACCESS_KEY=
VITE_S3_SECRET_KEY=
VITE_S3_BUCKET=

# Test timeouts
VITE_QUERY_TIMEOUT_MS=5000
```

## **E2E-First Component Development**

### **Regra: Componentes DEVEM ser Criados com E2E em Mente**

**OBRIGATÓRIO seguir este fluxo:**

1. **Escrever teste E2E primeiro**
2. **Implementar componente básico**
3. **Fazer teste passar**
4. **Adicionar testes unitários**
5. **Refatorar se necessário**

### **Exemplo: Criação de Novo Componente**

**1. Teste E2E primeiro:**
```typescript
// src/e2e/components/new-component.cy.ts
describe('NewComponent E2E', () => {
  beforeEach(() => {
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
  });

  it('should display component correctly', () => {
    cy.visit('/new-component');
    cy.get('[data-testid="new-component"]').should('be.visible');
    cy.get('[data-testid="component-title"]').should('contain', 'New Component');
  });

  it('should handle user interactions', () => {
    cy.visit('/new-component');
    cy.get('[data-testid="action-button"]').click();
    cy.get('[data-testid="result-message"]').should('be.visible');
  });
});
```

**2. Implementar componente:**
```typescript
// src/components/NewComponent.tsx
import React, { useState } from 'react';

export const NewComponent: React.FC = () => {
  const [showResult, setShowResult] = useState(false);

  return (
    <div data-testid="new-component">
      <h1 data-testid="component-title">New Component</h1>
      <button 
        data-testid="action-button"
        onClick={() => setShowResult(true)}
      >
        Click Me
      </button>
      {showResult && (
        <div data-testid="result-message">
          Action completed!
        </div>
      )}
    </div>
  );
};
```

**3. Testes unitários:**
```typescript
// src/__tests__/unit/frontend/components/NewComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from '../../../../components/NewComponent';

describe('NewComponent', () => {
  it('should render title correctly', () => {
    render(<NewComponent />);
    expect(screen.getByTestId('component-title')).toHaveTextContent('New Component');
  });

  it('should show result message when button is clicked', () => {
    render(<NewComponent />);
    fireEvent.click(screen.getByTestId('action-button'));
    expect(screen.getByTestId('result-message')).toBeInTheDocument();
  });
});
```

## **Data-testid Obrigatório**

### **SEMPRE usar data-testid para Elementos Testáveis**

**Convenção obrigatória:**
```typescript
// ✅ CORRETO - Usar data-testid
<button data-testid="login-button">Login</button>
<div data-testid="user-profile">...</div>
<input data-testid="email-input" />

// ❌ INCORRETO - Não usar classes ou IDs para testes
<button className="btn-login">Login</button>
<div id="user-profile">...</div>
```

### **Padrões de Nomenclatura**

**OBRIGATÓRIO seguir estes padrões:**
- ✅ `component-name` - Para componentes principais
- ✅ `action-button` - Para botões de ação
- ✅ `field-input` - Para campos de entrada
- ✅ `error-message` - Para mensagens de erro
- ✅ `loading-spinner` - Para indicadores de carregamento
- ✅ `modal-dialog` - Para modais
- ✅ `data-grid` - Para tabelas/grids

## **Vitest Execution Rules - OBRIGATÓRIO**

### **SEMPRE usar --pool=forks quando AGENTE executar Vitest**

**REGRA CRÍTICA: Quando o AGENTE executar comandos Vitest, DEVE usar --pool=forks:**
- ✅ `vitest --pool=forks --run` - Para execução única pelo agente
- ✅ `vitest --pool=forks --coverage` - Para cobertura pelo agente
- ✅ `vitest --pool=forks --watch` - Para modo watch pelo agente (se necessário)

**Justificativa:**
- Evita problemas de isolamento entre testes
- Melhora estabilidade em ambientes Windows/WSL
- Previne vazamentos de memória entre testes
- Garante execução determinística

**IMPORTANTE**: Esta regra se aplica APENAS quando o agente executa testes. Os scripts do package.json usam configurações padrão para desenvolvimento manual.

### **Diferença entre Execução do Agente vs Manual**

**Execução pelo Agente (usar --pool=forks):**
```bash
# ✅ CORRETO - Agente executando com --pool=forks
vitest --pool=forks --run
vitest --pool=forks --coverage
```

**Execução Manual pelo Desenvolvedor (scripts padrão):**
```bash
# ✅ CORRETO - Desenvolvedor executando manualmente
pnpm test
pnpm test:watch
pnpm test:coverage
```

**Scripts do Package.json (configuração padrão):**
```json
{
  "scripts": {
    "test": "vitest --run",
    "test:watch": "vitest --watch", 
    "test:coverage": "vitest --coverage"
  }
}
```

## **Scripts de Teste Recomendados**

### **Package.json Scripts (Configuração Padrão)**

**Scripts padrão para desenvolvimento manual:**
```json
{
  "scripts": {
    "test": "vitest --run",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest --config vitest.integration.config.ts",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:e2e:record": "cypress run --record --key YOUR_RECORD_KEY",
    "test:all": "pnpm test && pnpm test:integration && pnpm test:e2e"
  }
}
```

### **Comandos do Agente**

**SEMPRE usar --pool=forks quando agente executar:**
```bash
# ✅ CORRETO - Agente executando com --pool=forks
vitest --pool=forks --run
vitest --pool=forks --coverage

# ✅ CORRETO - Desenvolvedor executando manualmente (sem --pool=forks)
pnpm test
pnpm test:watch
pnpm test:coverage
```

### **CI/CD Integration**

**GitHub Actions pode usar scripts padrão:**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage
      - run: pnpm test:integration
      - run: pnpm test:e2e:record
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## **Mocking e Fixtures**

### **Mock de APIs Obrigatório**

**Para testes unitários:**
```typescript
// src/__tests__/mocks/api.mock.ts
import { vi } from 'vitest';

export const mockHttpService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

// Mock automático
vi.mock('../services/httpService', () => ({
  httpService: mockHttpService
}));
```

### **Fixtures de Dados**

**OBRIGATÓRIO centralizar dados de teste:**
```typescript
// src/__tests__/fixtures/mock-data.ts
export const MOCK_NFE_DATA = {
  id: 'test-nfe-001',
  numero: '123456',
  serie: '1',
  dataEmissao: '2024-01-15',
  valorTotal: 1500.00,
  status: 'autorizada'
};

export const MOCK_USER_DATA = {
  id: 'test-user-001',
  nome: 'Test User',
  email: 'test@example.com',
  role: 'admin'
};
```

## **Performance Testing**

### **Métricas Obrigatórias**

**SEMPRE medir performance em E2E:**
```typescript
// src/e2e/performance/load-times.cy.ts
describe('Performance Tests', () => {
  it('should load dashboard within 3 seconds', () => {
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    
    const start = Date.now();
    cy.visit('/dashboard');
    cy.get('[data-testid="dashboard-content"]').should('be.visible').then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(3080);
    });
  });

  it('should handle large data sets efficiently', () => {
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    cy.visit('/analytics');
    
    // Mock large dataset
    cy.mockApi('GET', '/api/analytics/data', { fixture: 'large-dataset.json' });
    
    cy.get('[data-testid="load-data-button"]').click();
    cy.get('[data-testid="data-grid"]').should('be.visible');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });
});
```

## **Checklist de Testes**

### **Antes de Cada Commit**

**OBRIGATÓRIO verificar:**
- [ ] ✅ Todos os testes unitários passam
- [ ] ✅ Cobertura de testes > 80%
- [ ] ✅ Testes de integração passam
- [ ] ✅ Testes E2E críticos passam
- [ ] ✅ Novos componentes têm data-testid
- [ ] ✅ Credenciais de teste atualizadas
- [ ] ✅ Environment files sincronizados

### **Antes de Deploy**

**OBRIGATÓRIO executar:**
- [ ] ✅ Suite completa de testes
- [ ] ✅ Testes E2E com gravação de vídeo
- [ ] ✅ Testes de performance
- [ ] ✅ Validação de environment variables
- [ ] ✅ Smoke tests em produção
