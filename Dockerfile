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
RUN ls -la /app/dist

# Production stage
FROM nginx:alpine

# Copiar arquivos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Verificar arquivos copiados
RUN ls -la /usr/share/nginx/html && \
    test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found!" && exit 1)

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remover configuração padrão do nginx se existir
RUN rm -f /etc/nginx/conf.d/default.conf.dpkg-dist

# Testar configuração do nginx
RUN nginx -t

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
