# Steering: Stack Tecnológica e Dependências - Documentação Completa

## **STACK TECNOLÓGICA DO PROJETO**

### **Informações Gerais**

**Nome do Projeto**: Sistema Fiscal - Dashboard NFe com Visualizador DANFE  
**Tipo**: Monorepo Full-Stack  
**Arquitetura**: Frontend (React) + Backend (Node.js) + Shared (Biblioteca TypeScript)  
**Gerenciador de Pacotes**: pnpm 9.0.0 (OBRIGATÓRIO)  
**Node.js**: >= 20.0.0 (OBRIGATÓRIO)  
**TypeScript**: 5.6.2 (modo strict habilitado)

---

## **FRONTEND STACK (apps/frontend/)**

### **Framework e Ferramentas de Build**

**Framework Principal:**
- ✅ **React**: 18.3.1
- ✅ **React DOM**: 18.3.1
- ✅ **React Router DOM**: 6.26.1

**Ferramenta de Build:**
- ✅ **Vite**: 5.4.2 (ferramenta de build moderna e rápida)
- ✅ **@vitejs/plugin-react**: 4.3.1

**TypeScript:**
- ✅ **TypeScript**: 5.6.2
- ✅ **@types/react**: 18.3.3
- ✅ **@types/react-dom**: 18.3.0

### **UI e Styling**

**CSS Framework:**
- ✅ **Tailwind CSS**: 3.4.10
- ✅ **PostCSS**: 8.4.45
- ✅ **Autoprefixer**: 10.4.20

**Ícones:**
- ✅ **lucide-react**: 0.441.0 (biblioteca de ícones moderna)

### **Componentes e Visualização**

**Tabelas:**
- ✅ **@tanstack/react-table**: 8.21.3 (tabelas avançadas)

**Gráficos:**
- ✅ **recharts**: 3.5.1 (gráficos e visualizações)

**PDF:**
- ✅ **react-pdf**: 10.2.0 (visualização de PDFs)
- ✅ **pdfjs-dist**: 5.4.530 (PDF.js core)
- ✅ **jspdf**: 3.0.4 (geração de PDFs)
- ✅ **html2canvas**: 1.4.1 (captura de tela para PDF)

**Markdown:**
- ✅ **react-markdown**: 9.0.1
- ✅ **remark-gfm**: 4.0.0 (GitHub Flavored Markdown)

**Árvores:**
- ✅ **react-arborist**: 3.4.0 (componente de árvore)

**Excel:**
- ✅ **xlsx**: 0.18.5 (leitura/escrita de Excel)

### **Testes (Frontend)**

**Framework de Testes:**
- ✅ **Vitest**: 1.0.0 (executor de testes moderno)
- ✅ **@vitest/coverage-v8**: 1.0.0 (cobertura de testes)

**Biblioteca de Testes:**
- ✅ **@testing-library/react**: 14.1.2
- ✅ **@testing-library/jest-dom**: 6.1.4
- ✅ **@testing-library/user-event**: 14.5.1

**Ambiente de Testes:**
- ✅ **jsdom**: 23.0.1 (simulação de DOM)

### **Linting e Qualidade (Frontend)**

- ✅ **ESLint**: 8.57.0
- ✅ **@typescript-eslint/eslint-plugin**: 7.13.1
- ✅ **@typescript-eslint/parser**: 7.13.1
- ✅ **eslint-plugin-react-hooks**: 4.6.2
- ✅ **eslint-plugin-react-refresh**: 0.4.7

---

## **BACKEND STACK (apps/backend/)**

### **Runtime e Framework**

**Runtime:**
- ✅ **Node.js**: >= 20.0.0
- ✅ **TypeScript**: 5.6.2

**Framework:**
- ✅ **Express**: 4.18.2 (framework web)
- ✅ **@types/express**: 5.0.6

### **Desenvolvimento:**
- ✅ **tsx**: 4.21.0 (execução de TypeScript)
- ✅ **nodemon**: 3.0.2 (recarga automática)
- ✅ **ts-node**: 10.9.1

### **Bancos de Dados**

**MongoDB:**
- ✅ **mongodb**: 7.0.0 (driver nativo)
- ✅ **mongoose**: 9.0.0 (ODM)

**SQL Server:**
- ✅ **@prisma/client**: 5.20.0
- ✅ **prisma**: 5.20.0 (ORM)

### **Autenticação e Segurança**

**JWT:**
- ✅ **jsonwebtoken**: 9.0.3
- ✅ **@types/jsonwebtoken**: 9.0.10

**Hash de Senhas:**
- ✅ **bcrypt**: 6.0.0
- ✅ **@types/bcrypt**: 6.0.0

**CORS:**
- ✅ **cors**: 2.8.5
- ✅ **@types/cors**: 2.8.19

### **Processamento de Arquivos**

**Geração de PDF:**
- ✅ **danfe-pdf**: 1.0.1
- ✅ **nfe-danfe-pdf**: 1.0.3
- ✅ **nfe-xml-to-pdf**: 1.0.0

**Excel:**
- ✅ **xlsx**: 0.18.5

**Compressão:**
- ✅ **jszip**: 3.10.1

### **Serviços em Nuvem**

**AWS S3:**
- ✅ **@aws-sdk/client-s3**: 3.958.0

### **Utilitários**

**Ambiente:**
- ✅ **dotenv**: 17.2.3

**UUID:**
- ✅ **uuid**: 13.0.0
- ✅ **@types/uuid**: 10.0.0

### **Testes (Backend)**

**Framework de Testes:**
- ✅ **Vitest**: 2.1.0

**Testes Baseados em Propriedades:**
- ✅ **fast-check**: 4.3.0 (property-based testing)

**Testes de Integração:**
- ✅ **@testcontainers/mongodb**: 11.9.0 (containers para testes)

---

## **SHARED PACKAGE (packages/shared/)**

### **Propósito**

Pacote compartilhado contendo:
- ✅ **Types**: Interfaces e tipos TypeScript
- ✅ **Constants**: Constantes e configurações
- ✅ **Schemas**: Schemas de validação
- ✅ **Errors**: Classes de erro customizadas
- ✅ **DTOs**: Data Transfer Objects
- ✅ **Utils**: Funções utilitárias

### **Dependências**

**Build:**
- ✅ **TypeScript**: 5.6.2 (apenas devDependency)

**Runtime:**
- ✅ Sem dependências externas (zero dependencies)

### **Exportações**

```json
{
  ".": "./dist/index.js",
  "./types/*": "./dist/types/*.js",
  "./utils/*": "./dist/utils/*.js",
  "./constants/*": "./dist/constants/*.js",
  "./errors/*": "./dist/errors/*.js"
}
```

---

## **CONFIGURAÇÃO TYPESCRIPT**

### **Configuração Modo Strict (OBRIGATÓRIO)**

**Todas as configurações TypeScript DEVEM ter:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### **Resolução de Módulos**

**Root (tsconfig.json):**
- ✅ **target**: ES2022
- ✅ **module**: NodeNext
- ✅ **moduleResolution**: NodeNext

**Frontend (apps/frontend/tsconfig.json):**
- ✅ **target**: ES2020
- ✅ **module**: ESNext
- ✅ **moduleResolution**: bundler
- ✅ **jsx**: react-jsx
- ✅ **lib**: ["ES2020", "DOM", "DOM.Iterable"]

**Backend (apps/backend/tsconfig.json):**
- ✅ **target**: ES2020
- ✅ **module**: ES2020
- ✅ **moduleResolution**: node
- ✅ **lib**: ["ES2020"]

### **Aliases de Caminho (OBRIGATÓRIO)**

**Todos os workspaces DEVEM ter:**
```json
{
  "compilerOptions": {
    "paths": {
      "@fiscal/shared": ["../../packages/shared/src"],
      "@fiscal/shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

---

## **DOCKER E IMPLANTAÇÃO**

### **Configuração Docker**

**Imagem Base:**
- ✅ **node:20-alpine** (imagem leve e segura)

**Build Multi-estágio:**
1. **base**: Setup inicial com pnpm
2. **deps**: Instalação de dependências
3. **builder**: Build do projeto
4. **runtime**: Imagem final otimizada

**Gerenciador de Pacotes no Docker:**
- ✅ **pnpm**: Habilitado via corepack
- ✅ **Cache**: /pnpm-store para otimização

### **Compatibilidade Coolify**

**OBRIGATÓRIO para produção:**
- ✅ Health check endpoint: `/api/health`
- ✅ Porta configurável via ENV: `PORT=3000`
- ✅ Logs estruturados com prefixos
- ✅ Graceful shutdown
- ✅ Environment variables via ARG

**Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1
```

---

## **FERRAMENTAS DE DESENVOLVIMENTO**

### **Gerenciador de Pacotes**

**OBRIGATÓRIO usar pnpm:**
- ✅ **Versão**: 9.0.0 (exata)
- ✅ **Instalação**: Via corepack ou npm global
- ✅ **Workspace**: pnpm-workspace.yaml configurado

**NUNCA usar:**
- ❌ npm
- ❌ yarn
- ❌ Outras versões de pnpm

### **Scripts Disponíveis**

**Root Level:**
```bash
pnpm dev              # Desenvolvimento paralelo
pnpm build            # Build de todos os pacotes
pnpm test             # Testes de todos os pacotes
pnpm lint             # Lint de todos os pacotes
pnpm type-check       # Type checking
pnpm clean            # Limpar artifacts
```

**Workspace Specific:**
```bash
pnpm --filter '@fiscal/frontend' dev
pnpm --filter '@fiscal/backend' build
pnpm --filter '@fiscal/shared' test
```

---

## **ENVIRONMENT VARIABLES**

### **Frontend (.env)**

**OBRIGATÓRIO:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_API_BEARER_TOKEN=your_token_here
VITE_MONGODB_CONNECTION_STRING=mongodb://localhost:27017/fiscal
VITE_DB_HOST=localhost
VITE_DB_DATABASE=fiscal_db
VITE_DB_COLLECTION=nfe_collection
```

**Opcional:**
```env
VITE_APP_NAME=Sistema Fiscal
VITE_DEFAULT_PAGE_SIZE=50
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=90
```

### **Backend (.env)**

**OBRIGATÓRIO:**
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=sqlserver://localhost:1433;database=fiscal;user=sa;password=pass
JWT_SECRET=your-secret-key-min-32-chars
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/fiscal
```

**Opcional:**
```env
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
LOG_LEVEL=info
```

### **Test (.env.test)**

**OBRIGATÓRIO para testes:**
```env
NODE_ENV=test
VITE_MONGODB_CONNECTION_STRING=mongodb://testuser:testpass@localhost:27017/testdb
DATABASE_URL=sqlserver://localhost:1433;database=testdb;user=sa;password=TestPass123!
VITE_API_BASE_URL=http://localhost:3001
VITE_DEFAULT_PAGE_SIZE=10
```

---

## **TESTING STACK**

### **Unit Tests**

**Framework:**
- ✅ **Vitest**: Test runner moderno
- ✅ **@testing-library/react**: Testing de componentes
- ✅ **jsdom**: DOM simulation

**Configuração:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Frontend
    // environment: 'node', // Backend
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### **Integration Tests**

**Tools:**
- ✅ **Testcontainers**: Containers para testes
- ✅ **@testcontainers/mongodb**: MongoDB container

### **Property-Based Tests**

**Framework:**
- ✅ **fast-check**: Property-based testing
- ✅ Mínimo 100 iterações por teste

### **E2E Tests (Planejado)**

**Framework:**
- ✅ **Cypress**: E2E testing (a ser implementado)
- ✅ Gravação de vídeo habilitada
- ✅ Screenshots em falhas

---

## **CODE QUALITY TOOLS**

### **Linting**

**ESLint:**
- ✅ **Versão**: 8.57.0
- ✅ **Parser**: @typescript-eslint/parser
- ✅ **Plugins**: 
  - @typescript-eslint/eslint-plugin
  - eslint-plugin-react-hooks (frontend)
  - eslint-plugin-react-refresh (frontend)

### **Type Checking**

**TypeScript:**
- ✅ **Strict mode**: Habilitado
- ✅ **noImplicitAny**: true
- ✅ **strictNullChecks**: true
- ✅ **Project references**: Configurado

### **Formatting (Recomendado)**

**Prettier (a ser configurado):**
- ✅ Integração com ESLint
- ✅ Formatação automática

---

## **VERSIONING E COMPATIBILITY**

### **Node.js Versions**

**Suportado:**
- ✅ **Node.js**: >= 20.0.0
- ✅ **Recomendado**: 20.x LTS

**Não suportado:**
- ❌ Node.js < 20.0.0

### **Package Manager Versions**

**Obrigatório:**
- ✅ **pnpm**: 9.0.0 (exata)

**Configurado em:**
- ✅ `package.json`: `"packageManager": "pnpm@9.0.0"`
- ✅ `.npmrc`: `package-manager=pnpm@9.0.0`

### **Browser Support (Frontend)**

**Targets:**
- ✅ **Chrome**: >= 90
- ✅ **Firefox**: >= 88
- ✅ **Safari**: >= 14
- ✅ **Edge**: >= 90

---

## **PERFORMANCE OPTIMIZATIONS**

### **Build Optimizations**

**Vite (Frontend):**
- ✅ Code splitting automático
- ✅ Tree shaking
- ✅ Minificação
- ✅ Lazy loading de rotas

**TypeScript:**
- ✅ Project references para builds incrementais
- ✅ Composite projects
- ✅ Declaration maps

### **Runtime Optimizations**

**Frontend:**
- ✅ React.memo para componentes pesados
- ✅ useMemo para cálculos custosos
- ✅ useCallback para callbacks
- ✅ Lazy loading de componentes

**Backend:**
- ✅ Connection pooling (Prisma)
- ✅ Cache em memória
- ✅ Operações paralelas com Promise.all
- ✅ Streaming de dados grandes

---

## **SECURITY CONSIDERATIONS**

### **Dependencies**

**Audit Regular:**
```bash
pnpm audit
pnpm audit --fix
```

**Update Strategy:**
- ✅ Patch updates: Automático
- ✅ Minor updates: Revisar changelog
- ✅ Major updates: Testar extensivamente

### **Environment Variables**

**NUNCA commitar:**
- ❌ `.env` (local development)
- ❌ `.env.local`
- ❌ Secrets ou tokens

**SEMPRE commitar:**
- ✅ `.env.example` (template)
- ✅ `.env.production.example` (template)
- ✅ `.env.test` (valores de teste)

### **Authentication**

**JWT:**
- ✅ Secret mínimo 32 caracteres
- ✅ Expiração configurada (1h padrão)
- ✅ Refresh tokens (a implementar)

**Password:**
- ✅ bcrypt para hashing
- ✅ Mínimo 8 caracteres
- ✅ Validação de complexidade

---

## **MONITORING E LOGGING**

### **Logging Structure**

**Prefixos obrigatórios:**
```typescript
console.log('[API] 📥 Request received');
console.error('[ERROR] ❌ Database failed');
console.warn('[WARN] ⚠️ Rate limit exceeded');
console.info('[INFO] ℹ️ Cache hit');
```

**Structured Logging:**
```typescript
logger.info('User created', {
  userId: user.id,
  email: user.email,
  action: 'user_creation',
  timestamp: new Date().toISOString()
});
```

### **Performance Monitoring**

**Métricas obrigatórias:**
- ✅ API response time
- ✅ Database query time
- ✅ Memory usage
- ✅ Cache hit rate

---

## **MIGRATION NOTES**

### **De npm para pnpm**

**Passos:**
1. Remover `node_modules/` e `package-lock.json`
2. Instalar pnpm: `npm install -g pnpm@9.0.0`
3. Executar: `pnpm install`
4. Atualizar scripts para usar pnpm

### **De JavaScript para TypeScript**

**Já migrado:**
- ✅ Frontend: 100% TypeScript
- ✅ Backend: 100% TypeScript
- ✅ Shared: 100% TypeScript

---

## **TROUBLESHOOTING**

### **Problemas Comuns**

**"pnpm not found":**
```bash
npm install -g pnpm@9.0.0
```

**"Module not found @fiscal/shared":**
```bash
pnpm --filter '@fiscal/shared' build
```

**"Port already in use":**
```bash
npx kill-port 3000 3001
```

**"TypeScript errors":**
```bash
pnpm type-check
pnpm --filter '@fiscal/shared' build
```

### **Validation Scripts**

**Validar configuração:**
```bash
pnpm validate
pnpm validate:config
pnpm validate:structure
pnpm validate:files
```

---

## **CHECKLIST DE SETUP**

### **Novo Desenvolvedor**

- [ ] ✅ Node.js >= 20.0.0 instalado
- [ ] ✅ pnpm 9.0.0 instalado globalmente
- [ ] ✅ Git configurado
- [ ] ✅ VS Code com extensões TypeScript
- [ ] ✅ `.env` criado a partir de `.env.example`
- [ ] ✅ `pnpm install` executado
- [ ] ✅ `pnpm build` executado com sucesso
- [ ] ✅ `pnpm dev` funcionando
- [ ] ✅ Testes passando: `pnpm test`

### **Novo Projeto**

- [ ] ✅ Estrutura de monorepo criada
- [ ] ✅ pnpm-workspace.yaml configurado
- [ ] ✅ TypeScript strict mode habilitado
- [ ] ✅ ESLint configurado
- [ ] ✅ Vitest configurado
- [ ] ✅ Docker configurado
- [ ] ✅ CI/CD configurado
- [ ] ✅ Documentação atualizada

---

## **REFERÊNCIAS RÁPIDAS**

### **Comandos Essenciais**

```bash
# Desenvolvimento
pnpm dev                              # Iniciar tudo
pnpm --filter '@fiscal/frontend' dev  # Frontend apenas
pnpm --filter '@fiscal/backend' dev   # Backend apenas

# Build
pnpm build                            # Build tudo
pnpm --filter '@fiscal/shared' build  # Shared primeiro

# Testes
pnpm test                             # Todos os testes
pnpm test:coverage                    # Com cobertura

# Quality
pnpm lint                             # Lint
pnpm type-check                       # Type check
```

### **Estrutura de Imports**

```typescript
// 1. Node.js built-ins
import path from 'path';

// 2. External libraries
import express from 'express';

// 3. Internal packages (workspace)
import { UserDTO } from '@fiscal/shared/types';

// 4. Relative imports
import { AuthService } from './auth.service';
```

### **Versões Críticas**

- **Node.js**: >= 20.0.0
- **pnpm**: 9.0.0 (exata)
- **TypeScript**: 5.6.2
- **React**: 18.3.1
- **Express**: 4.18.2
- **Vite**: 5.4.2
- **Vitest**: 1.0.0 (frontend) / 2.1.0 (backend)

---

**Última atualização**: Janeiro 2026  
**Mantido por**: Equipe de Desenvolvimento
