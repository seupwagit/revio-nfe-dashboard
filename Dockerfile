# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Verificar se o build foi criado
RUN ls -la /app/dist && \
    test -f /app/dist/index.html || (echo "ERROR: Build failed - index.html not found!" && exit 1)

# Production stage
FROM nginx:alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Remover configuração padrão do nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copiar configuração customizada do Nginx ANTES dos arquivos
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Verificar arquivos copiados e permissões
RUN ls -la /usr/share/nginx/html && \
    test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found in final image!" && exit 1) && \
    chmod -R 755 /usr/share/nginx/html

# Testar configuração do nginx
RUN nginx -t

# Expor porta 3000 (padrão do Coolify)
EXPOSE 3000

# Health check mais robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=5 http://127.0.0.1:3000/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
