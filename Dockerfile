# Multi-stage Dockerfile otimizado para Coolify
# Compatível com produção e desenvolvimento
# Seguindo regras WSL/Docker/pnpm prioritárias

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

# ARGs para variáveis de ambiente (Coolify compatibility)
ARG NODE_ENV=production
ARG PORT=3000

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

# Health check obrigatório para Coolify
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando de produção
CMD ["node", "dist/index.js"]