# Testes E2E - Sistema Fiscal NFe

Este diretório contém os testes End-to-End (E2E) para o sistema fiscal NFe, implementados com Cypress seguindo as regras de qualidade de código definidas em `.kiro/steering/code-quality-rules.md` e `.kiro/steering/testing-environment-rules.md`.

## Estrutura dos Testes

```
src/e2e/
├── console-errors/           # Testes de detecção de erros
│   └── console-error-detection.cy.ts
├── fixtures/                 # Dados de teste
│   ├── analytics-data.json
│   ├── empty-response.json
│   ├── nfe-sample-data.json
│   └── test-users.ts
├── integration/              # Testes de integração
│   └── nfe-system-integration.cy.ts
├── nfe-screens/             # Testes de telas NFe
│   ├── analytics.cy.ts
│   ├── dashboard.cy.ts
│   ├── documentos-fiscais.cy.ts
│   ├── grid-nfe-simples.cy.ts
│   └── notas-fiscais-unificada.cy.ts
└── support/                 # Configuração e comandos
    ├── commands.ts
    ├── cypress.d.ts
    └── e2e.ts
```

## Comandos Customizados

### `cy.login(email, password)`
Realiza login usando sessão do Cypress para otimização de performance.

```typescript
cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
```

### `cy.waitForLoad()`
Aguarda que spinners de loading desapareçam e não haja mensagens de erro.

```typescript
cy.waitForLoad();
```

### `cy.waitForNFeData()`
Aguarda carregamento específico de dados NFe com timeout estendido.

```typescript
cy.waitForNFeData();
```

### `cy.verifyNFeDataLoaded()`
Verifica se há dados na tabela e se contêm informações válidas.

```typescript
cy.verifyNFeDataLoaded();
```

### `cy.mockApi(method, url, response)`
Cria interceptador de API com alias automático.

```typescript
cy.mockApi('GET', '/api/documents', { fixture: 'nfe-sample-data.json' });
```

## Usuários de Teste

Os testes utilizam credenciais reais definidas em `fixtures/test-users.ts`:

- **ADMIN**: `divino@grupochama.com.br` / `123456789`
- **MASTER**: `master` / `12makem345`
- **REGULAR_USER**: `user@test.com` / `testpass123`

## Executando os Testes

### Comandos Disponíveis

```bash
# Executar todos os testes E2E
pnpm test:e2e

# Abrir interface do Cypress
pnpm test:e2e:open

# Executar com interface gráfica
pnpm test:e2e:headed

# Executar em navegador específico
pnpm test:e2e:chrome
pnpm test:e2e:firefox

# Executar com gravação (se configurado)
pnpm test:e2e:record

# Executar todos os tipos de teste
pnpm test:all
```

### Pré-requisitos

1. **Aplicação rodando**: Frontend deve estar rodando em `http://localhost:3080`
2. **Backend ativo**: API deve estar disponível em `http://localhost:3001`
3. **Dados de teste**: Usuários de teste devem existir no sistema

## Padrões de Qualidade

### Nomenclatura de Testes

✅ **CORRETO** - Português brasileiro descritivo:
```typescript
it('deve carregar Dashboard e exibir analytics de NFe da tbl_nfe_100', () => {
  // Implementação
});
```

❌ **INCORRETO** - Inglês ou não descritivo:
```typescript
it('should load dashboard', () => {
  // Implementação
});
```

### Logs Estruturados

Todos os testes utilizam logs estruturados com contexto:

```typescript
cy.log('[TEST] 🧪 Testando carregamento padrão da tela');
cy.log('[TEST] ✅ Carregamento funcionando corretamente');
```

### Data-testid Obrigatório

Todos os elementos testáveis devem ter `data-testid`:

```typescript
cy.get('[data-testid="grid-nfe-simples"]').should('be.visible');
```

### Tratamento de Erros

Os testes incluem verificação de estados de erro:

```typescript
// Interceptar para simular erro
cy.intercept('GET', '**/api/documents**', { statusCode: 500 }).as('apiError');

// Verificar tratamento gracioso
cy.get('[data-testid="error-message"]').should('be.visible');
```

## Fixtures de Dados

### `nfe-sample-data.json`
Dados de exemplo para testes de NFe com estrutura completa.

### `analytics-data.json`
Dados de analytics para testes de dashboard e relatórios.

### `empty-response.json`
Resposta vazia para testes de estados sem dados.

### `test-users.ts`
Credenciais de usuários para diferentes cenários de teste.

## Interceptadores de API

Os testes utilizam interceptadores para:

1. **Dados consistentes**: Garantir dados previsíveis
2. **Performance**: Evitar dependência de APIs externas
3. **Cenários específicos**: Simular erros e estados especiais

```typescript
beforeEach(() => {
  cy.intercept('GET', '**/api/documents/**', { fixture: 'nfe-sample-data.json' }).as('getDocuments');
  cy.intercept('GET', '**/api/analytics/**', { fixture: 'analytics-data.json' }).as('getAnalytics');
});
```

## Detecção de Erros

### Console Error Detection

O arquivo `console-error-detection.cy.ts` verifica:

- ✅ Ausência de erros JavaScript
- ✅ Warnings críticos
- ✅ Vazamentos de memória
- ✅ Performance warnings
- ✅ Erros específicos do agrupamento configurável

### Métricas de Performance

Os testes monitoram:

- **Tempo de carregamento**: < 3 segundos
- **Uso de memória**: < 50MB de aumento
- **Warnings de performance**: < 3 por tela

## Configuração do Cypress

### cypress.config.ts

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3080',
    specPattern: 'apps/frontend/src/e2e/**/*.cy.ts',
    supportFile: 'apps/frontend/src/e2e/support/e2e.ts',
    video: true,
    videoCompression: 32,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000
  }
});
```

### Variáveis de Ambiente

```typescript
env: {
  API_BASE_URL: 'http://localhost:3001',
  TEST_USER_EMAIL: 'divino@grupochama.com.br',
  TEST_USER_PASSWORD: '123456789'
}
```

## Troubleshooting

### Problemas Comuns

1. **Comandos customizados não reconhecidos**
   - Verificar se `cypress.d.ts` está importado
   - Confirmar que `commands.ts` está sendo carregado

2. **Timeouts em testes**
   - Aumentar `defaultCommandTimeout` no config
   - Usar `cy.waitForLoad()` antes de interações

3. **Dados não carregam**
   - Verificar se interceptadores estão configurados
   - Confirmar que fixtures existem e são válidas

4. **Erros de TypeScript**
   - Executar `pnpm type-check` para verificar tipos
   - Confirmar que referências estão corretas

### Debug

Para debug detalhado:

```bash
# Executar com logs detalhados
DEBUG=cypress:* pnpm test:e2e

# Executar teste específico
pnpm test:e2e --spec "src/e2e/nfe-screens/dashboard.cy.ts"
```

## Contribuindo

### Adicionando Novos Testes

1. **Seguir estrutura existente**
2. **Usar comandos customizados**
3. **Incluir logs estruturados**
4. **Adicionar data-testid nos elementos**
5. **Testar cenários de erro**
6. **Documentar fixtures necessárias**

### Checklist de Qualidade

- [ ] ✅ Nomenclatura em português brasileiro
- [ ] ✅ Logs estruturados com contexto
- [ ] ✅ Data-testid em elementos testáveis
- [ ] ✅ Tratamento de estados de erro
- [ ] ✅ Interceptadores de API configurados
- [ ] ✅ Fixtures de dados válidas
- [ ] ✅ Comandos customizados utilizados
- [ ] ✅ TypeScript sem erros
- [ ] ✅ Documentação atualizada

---

**Última atualização**: Janeiro 2026  
**Mantido por**: Equipe de Desenvolvimento