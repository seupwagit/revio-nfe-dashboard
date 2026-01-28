# Reorganização de Arquivos de Teste - Plano de Execução

## Problema Identificado

Estrutura de diretórios de teste inconsistente com duplicação de caminhos:
- `apps/frontend/apps/frontend/src/__tests__` (INCORRETO - estrutura duplicada)
- `apps/frontend/src/__tests__` (CORRETO - estrutura padrão)
- `apps/backend/src/__tests__` (CORRETO - mas precisa reorganização)

## Estrutura Atual de Arquivos de Teste

### Backend - Arquivos Encontrados
```
apps/backend/src/__tests__/
├── e2e/
│   └── danfe-api.e2e.test.ts
└── unit/
    └── utils/
        └── nfeGrouping.test.ts
```

### Frontend - Estrutura Correta Existente
```
apps/frontend/src/__tests__/
├── e2e/
│   └── danfe-viewer.e2e.test.tsx
├── integration/
│   ├── danfe-service.integration.test.ts
│   ├── danfe-system.integration.test.tsx
│   ├── simple-test.test.ts
│   └── performance/ (vazio)
├── unit/
│   ├── components/
│   │   ├── DANFELoadingIndicator.test.tsx
│   │   └── DANFEPDFViewer.test.tsx
│   ├── contexts/
│   │   └── AuthContext.test.tsx
│   ├── pages/
│   │   ├── GridNFeSimples.property.test.tsx
│   │   └── GridNFeSimples.test.tsx
│   └── services/
│       ├── performance/ (vazio)
│       └── validation.service.test.ts
└── setup.ts
```

### Arquivos de Teste Dispersos que Precisam ser Reorganizados
```
apps/backend/src/routes/__tests__/ (se existir)
apps/backend/src/services/__tests__/ (se existir)
apps/backend/src/tests/ (arquivos soltos)
├── auth-routes.test.ts
├── auth-services.test.ts
├── automatic-query-routing.test.ts
├── dependency-availability.test.ts
└── resilience.test.ts
```

## Plano de Reorganização

### 1. Estrutura Alvo Seguindo Regras de Steering

**Backend:**
```
apps/backend/src/__tests__/
├── unit/
│   ├── routes/
│   │   ├── auth.routes.test.ts
│   │   ├── analytics.routes.test.ts
│   │   ├── documents.routes.test.ts
│   │   └── downloads.routes.test.ts
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── analytics.service.test.ts
│   │   ├── fiscal-documents.service.test.ts
│   │   └── download.service.test.ts
│   ├── middleware/
│   │   ├── auth.middleware.test.ts
│   │   └── data-isolation.middleware.test.ts
│   └── utils/
│       ├── nfeGrouping.test.ts (já existe)
│       └── logger.test.ts
├── integration/
│   ├── auth-flow.integration.test.ts
│   ├── database-routing.integration.test.ts
│   └── resilience.integration.test.ts
├── e2e/
│   ├── danfe-api.e2e.test.ts (já existe)
│   ├── auth-api.e2e.test.ts
│   └── documents-api.e2e.test.ts
└── setup.ts
```

**Frontend:** (já está correto, apenas limpeza)
```
apps/frontend/src/__tests__/
├── unit/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── utils/
├── integration/
├── e2e/
└── setup.ts
```

### 2. Mapeamento de Arquivos para Reorganização

#### Backend - Arquivos a Mover:
```
ORIGEM → DESTINO

apps/backend/src/tests/auth-routes.test.ts 
→ apps/backend/src/__tests__/unit/routes/auth.routes.test.ts

apps/backend/src/tests/auth-services.test.ts 
→ apps/backend/src/__tests__/unit/services/auth.service.test.ts

apps/backend/src/tests/automatic-query-routing.test.ts 
→ apps/backend/src/__tests__/integration/database-routing.integration.test.ts

apps/backend/src/tests/dependency-availability.test.ts 
→ apps/backend/src/__tests__/integration/dependency-availability.integration.test.ts

apps/backend/src/tests/resilience.test.ts 
→ apps/backend/src/__tests__/integration/resilience.integration.test.ts
```

### 3. Diretórios a Remover
- `apps/frontend/apps/frontend/src/__tests__` (estrutura duplicada incorreta)
- `apps/backend/src/tests/` (após mover todos os arquivos)

### 4. Arquivos de Configuração a Verificar
- Verificar se existem arquivos de configuração de teste nos diretórios incorretos
- Mover setup.ts se necessário
- Atualizar imports nos arquivos movidos

## Comandos de Execução

### Passo 1: Criar Estrutura de Diretórios
```bash
# Backend
mkdir -p apps/backend/src/__tests__/unit/routes
mkdir -p apps/backend/src/__tests__/unit/services  
mkdir -p apps/backend/src/__tests__/unit/middleware
mkdir -p apps/backend/src/__tests__/integration

# Frontend (limpeza apenas)
# Estrutura já existe corretamente
```

### Passo 2: Mover Arquivos Backend
```bash
# Mover testes de rotas
mv apps/backend/src/tests/auth-routes.test.ts apps/backend/src/__tests__/unit/routes/auth.routes.test.ts

# Mover testes de serviços  
mv apps/backend/src/tests/auth-services.test.ts apps/backend/src/__tests__/unit/services/auth.service.test.ts

# Mover testes de integração
mv apps/backend/src/tests/automatic-query-routing.test.ts apps/backend/src/__tests__/integration/database-routing.integration.test.ts
mv apps/backend/src/tests/dependency-availability.test.ts apps/backend/src/__tests__/integration/dependency-availability.integration.test.ts
mv apps/backend/src/tests/resilience.test.ts apps/backend/src/__tests__/integration/resilience.integration.test.ts
```

### Passo 3: Remover Diretórios Vazios
```bash
# Remover estrutura duplicada frontend
rmdir apps/frontend/apps/frontend/src/__tests__/unit/components
rmdir apps/frontend/apps/frontend/src/__tests__/unit
rmdir apps/frontend/apps/frontend/src/__tests__/future-e2e
rmdir apps/frontend/apps/frontend/src/__tests__

# Remover diretório tests antigo do backend
rmdir apps/backend/src/tests
```

## Validação Pós-Reorganização

### Checklist de Verificação
- [ ] Todos os arquivos de teste foram movidos
- [ ] Estrutura segue padrões das regras de steering
- [ ] Imports foram atualizados nos arquivos movidos
- [ ] Configurações de teste apontam para novos diretórios
- [ ] Testes executam corretamente após reorganização
- [ ] Diretórios antigos foram removidos
- [ ] Nenhum arquivo foi perdido no processo

### Comandos de Teste
```bash
# Verificar se testes executam
pnpm --filter @fiscal/backend test
pnpm --filter @fiscal/frontend test

# Verificar estrutura
find apps -name "__tests__" -type d
find apps -name "*.test.*" -type f
```

## Benefícios da Reorganização

1. **Conformidade com Regras de Steering**: Estrutura alinhada com padrões documentados
2. **Organização Lógica**: Testes próximos ao código que testam
3. **Facilidade de Manutenção**: Estrutura previsível e consistente
4. **Melhor Performance**: Eliminação de estruturas duplicadas
5. **Clareza**: Separação clara entre unit, integration e e2e tests

## Próximos Passos

1. Executar comandos de reorganização
2. Atualizar imports nos arquivos movidos
3. Verificar configurações de teste
4. Executar testes para validar reorganização
5. Documentar nova estrutura no README