# 🔧 Correções Aplicadas - Build no Coolify

## ❌ Problema Original

Build falhando no Coolify com erros TypeScript:
```
error TS2339: Property 'VITE_XXX' does not exist on type 'ImportMetaEnv'
error TS7016: Could not find a declaration file for module 'react-dom/client'
error TS2307: Cannot find module 'vitest' or its corresponding type declarations
```

---

## ✅ Correções Aplicadas

### 1. Atualizado `src/vite-env.d.ts`

**Antes:**
```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_BEARER_TOKEN: string
  // ... apenas 8 variáveis
}
```

**Depois:**
```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_BEARER_TOKEN: string
  readonly VITE_DB_HOST: string
  readonly VITE_DB_DATABASE: string
  readonly VITE_DB_COLLECTION: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_DEFAULT_PAGE: string
  readonly VITE_MAX_DATE_RANGE_DAYS: string
  readonly VITE_DEFAULT_DATE_RANGE_DAYS: string
  readonly VITE_ANALYTICS_PAGE_SIZE: string
  readonly VITE_MONGODB_PROXY_PORT: string
  readonly VITE_CACHE_DURATION_MINUTES: string
  readonly VITE_MONGODB_CONNECTION_STRING: string
  readonly VITE_API_GOOGLE_GEMINI: string
  readonly VITE_QUERY_TIMEOUT_MS: string
  readonly VITE_MAX_PAGE_SIZE: string
  readonly VITE_S3_ENDPOINT: string
  readonly VITE_S3_ACCESS_KEY: string
  readonly VITE_S3_SECRET_KEY: string
  readonly VITE_S3_BUCKET: string
  readonly VITE_S3_REGION: string
  readonly VITE_DB_SERVER: string
  readonly VITE_DB_USER: string
  readonly VITE_DB_PASSWORD: string
  readonly VITE_PORT: string
  readonly VITE_AGGREGATION_PORT: string
  readonly VITE_PUBLIC_BUILDER_KEY: string
}
```

### 2. Criado `tsconfig.prod.json`

Novo arquivo que exclui arquivos de teste da compilação:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true,
    "noEmit": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "tests"
  ]
}
```

### 3. Adicionado script `build:prod` no `package.json`

```json
{
  "scripts": {
    "build:prod": "tsc --project tsconfig.prod.json && vite build"
  }
}
```

### 4. Atualizado `Dockerfile.fullstack`

**Antes:**
```dockerfile
RUN npm ci --only=production
RUN npm run build
```

**Depois:**
```dockerfile
# Copiar tsconfig
COPY tsconfig*.json ./

# Instalar TODAS as dependências (incluindo devDependencies)
RUN npm ci

# Build usando tsconfig.prod.json
RUN npm run build:prod
```

### 5. Atualizado `.dockerignore`

**Antes:**
```
tests
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
```

**Depois:**
```
# Mantém arquivos de teste para build passar
coverage
.nyc_output
```

---

## 🚀 Como Fazer Deploy Agora

### Passo 1: Commit das Correções

```bash
git add .
git commit -m "fix: corrigir build TypeScript para produção"
git push origin main
```

### Passo 2: Configurar Variáveis no Coolify

No Coolify, adicione TODAS as variáveis de ambiente:

**Essenciais (OBRIGATÓRIAS):**
```bash
NODE_ENV=production
PORT=3000
BACKOFFICE_PORT=3000
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&authSource=admin&directConnection=true
VITE_API_BASE_URL=https://apinfe.revio.digital
VITE_API_BEARER_TOKEN=seu_token_aqui
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
```

**Recomendadas:**
```bash
VITE_DEFAULT_PAGE_SIZE=10000
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=60
VITE_DEFAULT_DATE_RANGE_DAYS=30
VITE_ANALYTICS_PAGE_SIZE=20000
VITE_CACHE_DURATION_MINUTES=90
VITE_QUERY_TIMEOUT_MS=45000
VITE_MAX_PAGE_SIZE=2000
```

**Opcionais:**
```bash
VITE_API_GOOGLE_GEMINI=sua_chave_aqui
VITE_S3_ENDPOINT=https://s3.wasabisys.com
VITE_S3_ACCESS_KEY=7YDC7UG085G6BS8A714S
VITE_S3_SECRET_KEY=HYKatJ4XbvaOsCsz9uJJGm2ZBgZWfsgZ5XHun1Vs
VITE_S3_BUCKET=revio-bucket
VITE_S3_REGION=us-east-1
VITE_DB_SERVER=10.0.0.4
VITE_DB_USER=sa
VITE_DB_PASSWORD=zaqwsx2001
```

### Passo 3: Configurar Build no Coolify

1. **Build Pack:** Dockerfile
2. **Dockerfile:** `Dockerfile.fullstack`
3. **Build Context:** `.`

### Passo 4: Deploy

Clique em "Deploy" no Coolify.

---

## ✅ Verificação

### Build deve passar agora:

```
✅ [builder 1/6] FROM node:20-alpine
✅ [builder 2/6] WORKDIR /app
✅ [builder 3/6] COPY package*.json ./
✅ [builder 4/6] RUN npm ci
✅ [builder 5/6] COPY . .
✅ [builder 6/6] RUN npm run build:prod
✅ Build completed successfully
```

### Após deploy, verificar:

```bash
# Frontend
curl https://seu-dominio.com

# Backend
curl https://seu-dominio.com/api/health

# Resposta esperada:
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2025-12-04T..."
}
```

---

## 🔍 Troubleshooting

### Se ainda falhar:

1. **Verificar logs no Coolify**
   - Vá para Deployments → Ver logs completos

2. **Testar localmente**
   ```bash
   npm run build:prod
   npm run docker:build
   ```

3. **Verificar variáveis**
   - Todas as variáveis configuradas no Coolify?
   - Valores corretos (sem espaços extras)?

4. **Limpar cache do Docker**
   - No Coolify: Settings → Clear Build Cache

---

## 📚 Arquivos Modificados

- ✅ `src/vite-env.d.ts` - Tipos de ambiente
- ✅ `tsconfig.prod.json` - Config TypeScript produção
- ✅ `package.json` - Script build:prod
- ✅ `Dockerfile.fullstack` - Build otimizado
- ✅ `.dockerignore` - Exclusões otimizadas

---

## 🎯 Próximos Passos

1. ✅ Commit e push das correções
2. ✅ Configurar variáveis no Coolify
3. ✅ Deploy
4. ✅ Verificar aplicação
5. ✅ Monitorar logs

---

**Build deve funcionar agora! 🚀**

Se ainda tiver problemas, consulte [TROUBLESHOOTING_BUILD.md](TROUBLESHOOTING_BUILD.md)
