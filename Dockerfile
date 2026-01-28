# Dockerfile otimizado para Monorepo (Coolify)
FROM node:20-alpine AS base

# Dependências de sistema
RUN apk add --no-cache git curl bash
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# --- Stage 1: Build Dependencies ---
FROM base AS builder

# Copiar arquivos de configuração do workspace
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Instalar dependências (incluindo devDeps para build)
RUN pnpm install --no-frozen-lockfile

# Copiar código fonte
COPY . .

# Build do monorepo
# 1. Build do shared (dependência de todos)
# 2. Build do frontend (gera os estáticos)
# 3. Build do backend
RUN pnpm --filter @fiscal/shared build && \
  pnpm --filter @fiscal/frontend build && \
  pnpm --filter @fiscal/backend build

# --- Stage 2: Production Runtime ---
FROM node:20-alpine AS runtime

RUN apk add --no-cache curl bash
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV BACKOFFICE_PORT=3000
ENV SERVE_FRONTEND=true

# Copiar apenas os arquivos necessários para rodar
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Instalar apenas dependências de produção
RUN pnpm install --no-frozen-lockfile --prod

# Copiar as distros construídas
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist

# Expor porta única
EXPOSE 3000

# Health check para Coolify
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando para iniciar o backend
CMD ["node", "apps/backend/dist/index.js"]