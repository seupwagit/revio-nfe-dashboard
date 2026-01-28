# 🐳 Docker + pnpm Best Practices

## 🎯 **Regras Obrigatórias para Docker**

### **1️⃣ Versão Node.js + pnpm (OBRIGATÓRIO)**

```dockerfile
FROM node:20-alpine
RUN corepack enable \
  && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
```

**Por que usar corepack?**
- ✅ **Oficialmente recomendado** pelo time Node.js
- ✅ **Versão consistente** do pnpm em todos os ambientes
- ✅ **Sem instalação manual** do pnpm
- ✅ **Melhor compatibilidade** com diferentes versões

**Fonte oficial**: https://nodejs.org/api/corepack.html

### **2️⃣ Monorepo com pnpm (ESSENCIAL)**

```dockerfile
# OBRIGATÓRIO: Copiar arquivos de workspace PRIMEIRO
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./

# Depois copiar package.json dos workspaces
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Instalar com lockfile frozen
RUN pnpm install --frozen-lockfile
```

**Por que essa ordem é crítica?**
- ✅ **pnpm precisa dos arquivos de workspace** para resolver dependências
- ✅ **Lockfile garante builds reproduzíveis**
- ✅ **Cache do Docker funciona melhor** com essa estrutura

**Fonte oficial**: https://pnpm.io/workspaces

### **3️⃣ Cache Inteligente (RECOMENDADO)**

```dockerfile
# Configurar store do pnpm para cache
RUN pnpm config set store-dir /pnpm-store
```

**Benefícios:**
- ⚡ **Builds mais rápidos** no Coolify
- 💾 **Menos uso de disco** com hard links
- 🔄 **Reutilização de dependências** entre builds

**Fonte oficial**: https://pnpm.io/docker

### **4️⃣ Multi-stage Build (OBRIGATÓRIO)**

```dockerfile
# Stage 1: Base com pnpm
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Stage 2: Dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/*/package.json ./apps/*/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 4: Runtime
FROM node:20-slim AS runtime
# Apenas arquivos necessários para produção
```

**Por que multi-stage?**
- 🏗️ **Separação clara** entre build e runtime
- 📦 **Imagem final menor** (sem devDependencies)
- 🔒 **Mais seguro** (menos ferramentas em produção)
- ⚡ **Melhor cache** do Docker

## ❌ **Erros Comuns (e como evitar)**

### **🚫 1. Não copiar pnpm-lock.yaml**

```dockerfile
# ❌ ERRADO
COPY package.json ./
RUN pnpm install

# ✅ CORRETO
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
RUN pnpm install --frozen-lockfile
```

**Consequências do erro:**
- 🔄 Builds inconsistentes
- 🐛 Dependências diferentes em cada deploy
- 💥 Bugs que só aparecem em produção

### **🚫 2. Usar node_modules com symlinks em runtime**

```dockerfile
# ❌ ERRADO - pnpm usa symlinks que podem quebrar
FROM node:20-alpine
COPY node_modules ./node_modules
CMD ["node", "index.js"]

# ✅ CORRETO - Multi-stage build
FROM node:20-alpine AS builder
RUN pnpm build

FROM node:20-slim AS runtime
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

**Por que symlinks são problemáticos?**
- 🔗 **pnpm usa symlinks** para economizar espaço
- 🐳 **Containers podem quebrar** symlinks
- 💥 **Runtime errors** difíceis de debugar

**Fonte**: https://pnpm.io/symlinked-node-modules-structure

### **🚫 3. Usar buildpack genérico do Coolify**

```yaml
# ❌ ERRADO - Buildpack genérico
build:
  type: "nodejs"
  
# ✅ CORRETO - Dockerfile próprio
build:
  type: "dockerfile"
  dockerfile: "Dockerfile"
```

**Por que Dockerfile próprio é melhor?**
- 🎛️ **Controle total** sobre pnpm
- 📋 **Previsibilidade** nos builds
- 🔧 **Customização** para monorepo
- 🚀 **Performance otimizada**

## 🏗️ **Template Dockerfile Completo**

```dockerfile
# Dockerfile otimizado para monorepo com pnpm
FROM node:20-alpine AS base

# Habilitar corepack (recomendação oficial)
RUN corepack enable \
  && corepack prepare pnpm@9.0.0 --activate

# Cache inteligente
RUN pnpm config set store-dir /pnpm-store

WORKDIR /app

# ============================================
# Stage: Dependencies
# ============================================
FROM base AS deps

# Copiar arquivos de workspace (ESSENCIAL)
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/*/package.json ./apps/*/
COPY packages/*/package.json ./packages/*/

# Instalar com lockfile frozen
RUN pnpm install --frozen-lockfile

# ============================================
# Stage: Build
# ============================================
FROM base AS builder

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copiar código fonte
COPY . .

# Build do monorepo
RUN pnpm build

# ============================================
# Stage: Runtime
# ============================================
FROM node:20-slim AS runtime

# Dependências do sistema (se necessário)
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Habilitar corepack
RUN corepack enable \
  && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copiar apenas arquivos de produção
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Instalar apenas deps de produção
RUN pnpm install --prod --frozen-lockfile

# Usuário não-root (segurança)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
```

## 🎯 **Checklist para Deploy**

### **Antes do Deploy:**
- [ ] ✅ Dockerfile usa `node:20-alpine`
- [ ] ✅ corepack habilitado com `pnpm@9.0.0`
- [ ] ✅ `pnpm-lock.yaml` copiado
- [ ] ✅ `pnpm-workspace.yaml` copiado
- [ ] ✅ Multi-stage build implementado
- [ ] ✅ `--frozen-lockfile` usado
- [ ] ✅ Health check configurado

### **No Coolify:**
- [ ] ✅ Build type: "dockerfile"
- [ ] ✅ Dockerfile path: "Dockerfile"
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Port mapping correto (3000)

### **Após Deploy:**
- [ ] ✅ Health check funcionando
- [ ] ✅ Logs sem erros de symlink
- [ ] ✅ Frontend servindo corretamente
- [ ] ✅ API respondendo

## 🔍 **Troubleshooting**

### **Build falha com "workspace not found"**
```bash
# Verificar se arquivos foram copiados
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
```

### **Runtime error com módulos não encontrados**
```bash
# Usar multi-stage build
FROM node:20-slim AS runtime
COPY --from=builder /app/dist ./dist
```

### **Symlink errors em produção**
```bash
# Não copiar node_modules diretamente
# Usar build compilado
RUN pnpm build
COPY --from=builder /app/dist ./dist
```

## 📚 **Referências Oficiais**

- **Node.js Corepack**: https://nodejs.org/api/corepack.html
- **pnpm Workspaces**: https://pnpm.io/workspaces
- **pnpm Docker**: https://pnpm.io/docker
- **pnpm Symlinks**: https://pnpm.io/symlinked-node-modules-structure

## 🎉 **Resultado Final**

Com essas práticas você terá:
- ⚡ **Builds rápidos e consistentes**
- 🔒 **Deploy seguro e previsível**
- 📦 **Imagens otimizadas**
- 🚀 **Performance máxima no Coolify**

**Lembre-se: Dockerfile próprio = menos dor!** 🐳✨