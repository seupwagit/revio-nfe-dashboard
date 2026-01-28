# Steering: Windows Native e Docker - Regras Prioritárias

## **REGRAS CRÍTICAS - SEMPRE SEGUIR**

### **Windows Native Obrigatório para Comandos de Desenvolvimento**

**SEMPRE usar comandos nativos do Windows para desenvolvimento:**
- ✅ `pnpm install` (Windows Native)
- ✅ `pnpm dev` (Windows Native)  
- ✅ `git` (Windows Native)
- ✅ `docker` (Windows Native)

**NUNCA usar WSL para comandos de desenvolvimento (apenas para produção/deploy):**
- ❌ `wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm install"`
- ❌ `wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && git status"`
- ❌ `wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && docker compose up"`

### **Padrão de Comandos Windows Native**

**Template obrigatório para todos os comandos:**
```powershell
# PowerShell commands (preferred)
pnpm install
pnpm dev
pnpm build

# Or using MCP pnpm server
pnpm --filter @fiscal/frontend dev
pnpm --filter @fiscal/backend dev
```

**Exemplos práticos:**
```powershell
# Instalar dependências
pnpm install

# Build do projeto
pnpm build

# Docker operations (Windows Native)
docker compose up -d

# Git operations (Windows Native)
git add .
git commit -m "message"
```

## **Docker - Regras de Configuração**

### **Dockerfile Único e Otimizado**

**OBRIGATÓRIO:**
- ✅ **Apenas um arquivo**: `Dockerfile` (sem sufixos)
- ✅ **Compatível com Coolify**: Deve funcionar em produção
- ✅ **Multi-stage build**: Para otimização
- ✅ **Cache inteligente**: Usar layers Docker eficientemente
- ✅ **Environment templates**: `.env.test` e `.env.production.example` devem estar disponíveis no container

**PROIBIDO:**
- ❌ `Dockerfile.dev`, `Dockerfile.prod`, `Dockerfile.debug`
- ❌ Configurações específicas de ambiente no Dockerfile
- ❌ Usar npm (sempre pnpm)
- ❌ Bloquear arquivos `.env.test` e `.env.production.example` no `.dockerignore`

### **Dockerfile Padrão Obrigatório**

```dockerfile
# Multi-stage Dockerfile otimizado para Coolify
FROM node:20-alpine AS base

# Instalar ferramentas essenciais
RUN apk add --no-cache git curl bash

# Habilitar pnpm via corepack (método oficial)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Configurar diretório de trabalho
WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps

# Copiar arquivos de configuração do workspace (ORDEM IMPORTANTE)
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./

# Copiar package.json de todos os workspaces
COPY apps/*/package.json ./apps/*/
COPY packages/*/package.json ./packages/*/

# Cache inteligente do pnpm
RUN pnpm config set store-dir /pnpm-store

# Instalar dependências com cache otimizado
RUN pnpm install --frozen-lockfile --prefer-offline

# Stage 2: Builder
FROM base AS builder

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/*/node_modules ./apps/*/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules

# Copiar código fonte
COPY . .

# Build do projeto
RUN pnpm build

# Stage 3: Runtime
FROM node:20-alpine AS runtime

# Instalar apenas dependências de runtime
RUN apk add --no-cache curl bash

# Copiar apenas arquivos necessários
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules

# Expor porta (será sobrescrita pelo Coolify)
EXPOSE 3000

# Comando de produção
CMD ["node", "dist/index.js"]
```

### **Otimizações Obrigatórias**

**Cache Layers:**
```dockerfile
# CORRETO - Copiar package.json primeiro para cache
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# DEPOIS copiar código fonte
COPY . .
```

**Multi-stage para reduzir tamanho:**
```dockerfile
# Build stage - com todas as ferramentas
FROM node:20-alpine AS builder
# ... build process

# Runtime stage - apenas o necessário
FROM node:20-alpine AS runtime
COPY --from=builder /app/dist ./dist
```

## **pnpm - Regras de Uso**

### **NUNCA usar npm**

**PROIBIDO em qualquer contexto:**
- ❌ `npm install`
- ❌ `npm run dev`
- ❌ `npm build`
- ❌ Scripts que usem npm

**SEMPRE usar pnpm (Windows Native):**
- ✅ `pnpm install`
- ✅ `pnpm dev`
- ✅ `pnpm build`
- ✅ `pnpm --filter workspace-name command`

### **Cache Inteligente do pnpm**

**Configuração obrigatória:**
```bash
# No Dockerfile
RUN pnpm config set store-dir /pnpm-store

# Para desenvolvimento local (Windows)
pnpm config set store-dir ~/.pnpm-store
```

**Comandos otimizados:**
```powershell
# Instalar com cache
pnpm install --prefer-offline

# Instalar apenas produção
pnpm install --prod --frozen-lockfile

# Limpar cache se necessário
pnpm store prune
```

### **Monorepo com Workspaces**

**Estrutura obrigatória:**
```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Comandos de workspace (Windows Native):**
```powershell
# Instalar dependência em workspace específico
pnpm --filter @fiscal/backend add express

# Executar comando em workspace
pnpm --filter @fiscal/frontend dev

# Executar em todos os workspaces
pnpm --recursive build

# Executar em paralelo
pnpm --parallel --filter './apps/*' dev
```

## **Coolify Compatibility**

### **Variáveis de Ambiente**

**Usar ARGs para flexibilidade:**
```dockerfile
ARG NODE_ENV=production
ARG PORT=3000

ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
```

**Coolify irá sobrescrever:**
- `PORT` - Porta do container
- Variáveis de ambiente específicas do projeto

### **Health Check**

**Obrigatório para Coolify:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1
```

### **Logs Estruturados**

**Para integração com Coolify:**
```javascript
// Logs com prefixo para facilitar busca
console.log('[API] 📥 Request received')
console.error('[ERROR] ❌ Database connection failed')
```

## **Performance e Otimização**

### **Dockerfile Layers**

**Ordem otimizada:**
1. Instalar dependências do sistema
2. Configurar pnpm
3. Copiar package.json files
4. Instalar dependências Node.js
5. Copiar código fonte
6. Build da aplicação

### **Cache Strategy**

**Maximizar cache hits:**
```dockerfile
# Copiar apenas arquivos que mudam raramente primeiro
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./

# Instalar dependências (layer cacheável)
RUN pnpm install --frozen-lockfile

# Copiar código fonte por último
COPY . .
```

### **Tamanho da Imagem**

**Usar alpine images:**
```dockerfile
FROM node:20-alpine  # ~40MB base
# Não usar: FROM node:20  # ~400MB base
```

**Limpar cache após instalação:**
```dockerfile
RUN pnpm install --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /tmp/* /var/cache/apk/*
```

## **Verificação e Validação**

### **Teste Local (Windows Native)**

**Antes de commit, sempre testar:**
```powershell
# Build da imagem
docker build -t test-image .

# Testar container
docker run -p 3000:3000 test-image

# Verificar health
curl http://localhost:3000/api/health
```

### **Validação de Performance**

**Métricas obrigatórias:**
- Build time < 5 minutos
- Image size < 200MB (runtime)
- Startup time < 30 segundos
- Memory usage < 512MB (idle)

### **.dockerignore - Configuração Obrigatória**

**SEMPRE permitir arquivos de template de environment:**
```dockerignore
# Environment
.env
.env.local
.env.*.local
!.env.example
!.env.production.example
!.env.test
```

**Justificativa:**
- `.env.test` - Necessário para configuração de testes no container
- `.env.production.example` - Template para configuração de produção
- `.env.example` - Template para desenvolvimento

**NUNCA bloquear estes arquivos no .dockerignore:**
- ❌ `.env.test` - Usado para testes automatizados
- ❌ `.env.production.example` - Usado como referência em produção
- ❌ `.env.example` - Usado como template base

### **Compatibilidade Coolify**

**Checklist obrigatório:**
- [ ] ✅ Dockerfile único na raiz
- [ ] ✅ Multi-stage build
- [ ] ✅ Health check endpoint
- [ ] ✅ Logs estruturados
- [ ] ✅ Variáveis de ambiente via ARG
- [ ] ✅ Porta configurável
- [ ] ✅ Graceful shutdown
- [ ] ✅ .dockerignore permite .env.test e .env.production.example

## **Windows Native Development Setup**

### **Ferramentas Obrigatórias**

**SEMPRE ter instalado no Windows:**
- ✅ Node.js (versão LTS)
- ✅ pnpm (via npm ou corepack)
- ✅ Git for Windows
- ✅ Docker Desktop
- ✅ VS Code com extensões TypeScript

### **Configuração do Ambiente**

**PowerShell Profile Setup:**
```powershell
# Adicionar ao $PROFILE
Set-Alias pn pnpm
Set-Alias g git

# Função para desenvolvimento
function dev { pnpm --filter @fiscal/frontend dev }
function dev-api { pnpm --filter @fiscal/backend dev }
function dev-all { pnpm --parallel --filter './apps/*' dev }
```

### **Scripts de Desenvolvimento**

**package.json scripts otimizados:**
```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "dev:frontend": "pnpm --filter @fiscal/frontend dev",
    "dev:backend": "pnpm --filter @fiscal/backend dev",
    "build": "pnpm --recursive build",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint",
    "type-check": "pnpm --recursive type-check",
    "clean": "pnpm --recursive clean"
  }
}
```