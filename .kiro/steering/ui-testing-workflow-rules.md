# Steering: UI Testing Workflow - Regras Obrigatórias

## **REGRAS CRÍTICAS PARA FUNCIONALIDADES UI**

### **Fluxo Obrigatório para Alterações de UI**

**SEMPRE que nova funcionalidade ou alteração de funcionalidades exigir interação com UI, DEVE seguir este fluxo:**

1. **Testes Unitários (Jest/Vitest)**
2. **Testes de Integração (se necessário)**
3. **Testes de Componente (se aplicável)**
4. **Testes E2E (Cypress)**
5. **Correções iterativas até sucesso completo**

### **Regra 1: Testes Unitários Obrigatórios**

**SEMPRE criar testes unitários relevantes:**
- ✅ Usar Jest/Vitest conforme configuração do projeto
- ✅ Realizar correções no teste E código até que TODOS os testes passem
- ✅ Cobertura mínima de 80% para componentes UI
- ✅ Testar todas as interações do usuário
- ✅ Testar estados de loading, erro e sucesso

**Estrutura obrigatória:**
```typescript
// ✅ CORRETO - Teste unitário completo
describe('ComponenteUI', () => {
  beforeEach(() => {
    // Setup necessário
  });

  it('should render correctly with initial props', () => {
    // Teste de renderização
  });

  it('should handle user interactions', () => {
    // Teste de interações
  });

  it('should display loading state', () => {
    // Teste de estado de loading
  });

  it('should handle error states', () => {
    // Teste de estados de erro
  });
});
```

### **Regra 2: Testes de Integração (Quando Necessário)**

**CRIAR testes de integração SE a funcionalidade:**
- ✅ Integra múltiplos componentes
- ✅ Faz chamadas para APIs
- ✅ Gerencia estado complexo
- ✅ Interage com serviços externos

**Realizar correções até que TODOS os testes de integração passem:**
```typescript
// ✅ CORRETO - Teste de integração
describe('Feature Integration', () => {
  it('should integrate components correctly', async () => {
    // Teste de integração entre componentes
  });

  it('should handle API calls correctly', async () => {
    // Teste de integração com APIs
  });
});
```

### **Regra 3: Testes E2E Obrigatórios (Cypress)**

**SEMPRE criar testes E2E para funcionalidades UI:**
- ✅ Usar Cypress conforme configuração do projeto
- ✅ Testar fluxo completo do usuário
- ✅ Incluir cenários de sucesso e erro
- ✅ Realizar correções até que TODOS os testes E2E passem

**Estrutura obrigatória:**
```typescript
// ✅ CORRETO - Teste E2E completo
describe('Feature E2E', () => {
  beforeEach(() => {
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
  });

  it('should complete user flow successfully', () => {
    // Teste do fluxo completo
    cy.visit('/feature-page');
    cy.get('[data-testid="action-button"]').click();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should handle error scenarios', () => {
    // Teste de cenários de erro
  });
});
```

### **Regra 4: Correções Iterativas Obrigatórias**

**PROCESSO obrigatório de correções:**

1. **Executar testes unitários**
   - Se falhar: corrigir código E testes
   - Repetir até TODOS passarem

2. **Executar testes de integração**
   - Se falhar: corrigir código E testes
   - Atualizar testes unitários relacionados se necessário
   - Repetir até TODOS passarem

3. **Executar testes E2E**
   - Se falhar: corrigir código E testes
   - Atualizar testes unitários E integração relacionados
   - Repetir até TODOS passarem

4. **Validação final**
   - Executar TODA a suíte de testes
   - TODOS os testes devem passar antes do commit

## **Scripts de Teste em TypeScript**

### **SEMPRE usar TypeScript para scripts quando possível**

**Scripts de desenvolvimento obrigatórios:**
```typescript
// scripts/test-runner.ts
import { execSync } from 'child_process';

interface TestConfig {
  unit: boolean;
  integration: boolean;
  e2e: boolean;
}

export class TestRunner {
  async runTests(config: TestConfig): Promise<void> {
    if (config.unit) {
      console.log('🧪 Executando testes unitários...');
      execSync('pnpm test:unit', { stdio: 'inherit' });
    }

    if (config.integration) {
      console.log('🔗 Executando testes de integração...');
      execSync('pnpm test:integration', { stdio: 'inherit' });
    }

    if (config.e2e) {
      console.log('🎭 Executando testes E2E...');
      execSync('pnpm test:e2e', { stdio: 'inherit' });
    }
  }
}
```

**Script de validação de UI:**
```typescript
// scripts/validate-ui-changes.ts
export class UIValidator {
  async validateUIChanges(): Promise<boolean> {
    try {
      // 1. Executar testes unitários
      await this.runUnitTests();
      
      // 2. Executar testes de integração se necessário
      await this.runIntegrationTests();
      
      // 3. Executar testes E2E
      await this.runE2ETests();
      
      console.log('✅ Todos os testes passaram!');
      return true;
    } catch (error) {
      console.error('❌ Falha nos testes:', error);
      return false;
    }
  }
}
```

## **Estrutura de Diretórios de Testes**

### **SEMPRE seguir estrutura definida:**

```
src/
├── __tests__/                     # Testes unitários (Jest/Vitest)
│   ├── unit/
│   │   ├── components/            # Testes de componentes UI
│   │   │   ├── Button.test.tsx
│   │   │   ├── Modal.test.tsx
│   │   │   └── Form.test.tsx
│   │   ├── hooks/                 # Testes de hooks customizados
│   │   │   └── useAuth.test.ts
│   │   └── services/              # Testes de serviços
│   │       └── apiService.test.ts
│   ├── integration/               # Testes de integração
│   │   ├── components/
│   │   │   └── UserFlow.integration.test.tsx
│   │   └── api/
│   │       └── authFlow.integration.test.ts
│   ├── fixtures/                  # Dados de teste
│   │   ├── mockData.ts
│   │   └── testUsers.ts
│   └── setup.ts                   # Configuração global
└── e2e/                          # Testes E2E (Cypress)
    ├── features/
    │   ├── authentication.cy.ts
    │   ├── userManagement.cy.ts
    │   └── dashboard.cy.ts
    ├── fixtures/
    │   └── users.json
    └── support/
        ├── commands.ts
        └── e2e.ts
```

## **Data-testid Obrigatório para UI**

### **SEMPRE usar data-testid em elementos testáveis:**

```typescript
// ✅ CORRETO - Com data-testid
export const LoginForm: React.FC = () => {
  return (
    <form data-testid="login-form">
      <input 
        data-testid="email-input"
        type="email"
        placeholder="Email"
      />
      <input 
        data-testid="password-input"
        type="password"
        placeholder="Senha"
      />
      <button 
        data-testid="login-button"
        type="submit"
      >
        Entrar
      </button>
    </form>
  );
};

// ❌ INCORRETO - Sem data-testid
export const LoginForm: React.FC = () => {
  return (
    <form className="login-form">
      <input type="email" />
      <input type="password" />
      <button>Entrar</button>
    </form>
  );
};
```

## **Confirmação de Regras Antes de Alterações**

### **SEMPRE pedir confirmação das regras de organização:**

**Antes de iniciar alterações, DEVE confirmar:**
- [ ] ✅ Estrutura de diretórios de testes
- [ ] ✅ Convenções de nomenclatura
- [ ] ✅ Configuração de ferramentas de teste
- [ ] ✅ Padrões de data-testid
- [ ] ✅ Estratégia de mocking
- [ ] ✅ Configuração de ambiente de teste

**Template de confirmação:**
```
🔍 CONFIRMAÇÃO DE REGRAS DE TESTE

Antes de implementar a funcionalidade UI, confirme:

1. Estrutura de diretórios:
   - Testes unitários em: src/__tests__/unit/components/
   - Testes de integração em: src/__tests__/integration/
   - Testes E2E em: src/e2e/features/

2. Ferramentas:
   - Testes unitários: Jest/Vitest
   - Testes E2E: Cypress
   - Biblioteca de teste: Testing Library

3. Convenções:
   - data-testid obrigatório
   - Nomenclatura descritiva
   - Cobertura mínima 80%

Confirma que estas regras estão corretas? (S/N)
```

## **Checklist de Validação UI**

### **Antes do Commit - Verificação Obrigatória:**

- [ ] ✅ Todos os testes unitários passam
- [ ] ✅ Todos os testes de integração passam (se aplicável)
- [ ] ✅ Todos os testes E2E passam
- [ ] ✅ Cobertura de testes > 80%
- [ ] ✅ Componentes têm data-testid
- [ ] ✅ Estados de loading/erro testados
- [ ] ✅ Interações do usuário testadas
- [ ] ✅ Responsividade testada (se aplicável)
- [ ] ✅ Acessibilidade testada (se aplicável)

### **Comandos de Validação:**

```powershell
# Executar todos os testes
pnpm test:all

# Executar com cobertura
pnpm test:coverage

# Executar E2E
pnpm test:e2e

# Validar build
pnpm build
```

## **Tratamento de Falhas**

### **Quando testes falham:**

1. **Analisar a falha**
   - Identificar se é problema no código ou no teste
   - Verificar se é regressão ou nova funcionalidade

2. **Corrigir iterativamente**
   - Corrigir código se necessário
   - Atualizar testes se necessário
   - Re-executar testes

3. **Validar correção**
   - Executar teste específico que falhou
   - Executar suíte completa
   - Confirmar que não quebrou outros testes

4. **Documentar se necessário**
   - Atualizar documentação se comportamento mudou
   - Adicionar comentários em testes complexos

**NUNCA fazer commit com testes falhando!**