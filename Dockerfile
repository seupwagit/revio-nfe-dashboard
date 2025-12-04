# Dockerfile para Deploy no Coolify
# Build otimizado para produção

# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio 2: Produção
FROM node:20-alpine

WORKDIR /app

# Instalar apenas o que é necessário para servir a aplicação
RUN npm install -g serve

# Copiar build do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Expor porta 3000 (padrão Coolify)
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["serve", "-s", "dist", "-l", "3000"]
