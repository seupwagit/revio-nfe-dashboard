#!/bin/bash

# =============================================================================
# Script de Configuração Remota - Revio NFe Dashboard
# Alvo: appdox.revio.digital
# Local: /data/nginx/www/appdox.revio.digital
# =============================================================================

set -e

DOMAIN="appdox.revio.digital"
WEB_ROOT="/data/nginx/www/$DOMAIN"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
BUNDLE_PACKAGE="/tmp/appdox-deploy-bundle.tar.gz"

# Garantir que ferramentas comuns estejam no PATH
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Localizar Node e PNPM
if [ -d "$HOME/.local/share/pnpm" ]; then
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

echo "🚀 Iniciando configuração remota unificada para $DOMAIN..."

# 1. Preparar diretórios
echo "📁 Preparando diretório em $WEB_ROOT..."
mkdir -p "$WEB_ROOT"
mkdir -p /var/log/pm2

# 2. Extrair Bundle Unificado
if [ -f "$BUNDLE_PACKAGE" ]; then
    echo "🛑 Parando PM2 antes da limpeza..."
    if command -v pm2 &> /dev/null; then
        pm2 stop "appdox-backend" &> /dev/null || true
    fi

    echo "📦 Limpando diretório de destino (incluindo node_modules para limpeza completa) em $WEB_ROOT..."
    # Remove tudo para garantir limpeza total conforme solicitado
    rm -rf "${WEB_ROOT:?}"/*
    
    echo "📦 Extraindo bundle unificado para $WEB_ROOT..."
    tar -xzf "$BUNDLE_PACKAGE" -C "$WEB_ROOT"
    rm "$BUNDLE_PACKAGE"
else
    echo "❌ ERRO: Pacote do bundle $BUNDLE_PACKAGE não encontrado."
    exit 1
fi

cd "$WEB_ROOT"

# 3. Extrair Porta Dinâmica do .env
# Tenta BACKOFFICE_PORT primeiro, depois PORT, fallback para 4001
APP_PORT=$(grep "^BACKOFFICE_PORT=" .env | cut -d'=' -f2 || echo "")
if [ -z "$APP_PORT" ]; then
    APP_PORT=$(grep "^PORT=" .env | cut -d'=' -f2 || echo "4001")
fi
echo "🔌 Porta detectada via .env: $APP_PORT"

# 4. Instalar dependências PNPM na raiz
echo "📦 Instalando dependências com pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "📥 Instalando pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=latest sh -
    export PNPM_HOME="/root/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

pnpm install --shamefully-hoist --no-frozen-lockfile

# 5. Gerar Prisma Client
if [ -d "prisma" ]; then
    echo "💎 Gerando Prisma Client..."
    # Prisma agora está na raiz do bundle
    npx prisma generate
else
    echo "⚠️ Aviso: Pasta prisma não encontrada. Pulando geração."
fi

# 6. Configurar Nginx Snippet (Porta Dinâmica)
echo "⚙️ Atualizando snippet do Nginx..."
mkdir -p /etc/nginx/snippets
cat > "/etc/nginx/snippets/${DOMAIN}-locations.conf" <<EOF
    # Backend API Proxy
    location ^~ /api/ {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # SPA Fallback (Frontend está em $WEB_ROOT/dist)
    location / {
        root $WEB_ROOT/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $WEB_ROOT/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
EOF

# 7. Configurar Nginx Site
echo "⚙️ Configurando Nginx site..."
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $WEB_ROOT/dist;
    index index.html;

    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;

    include /etc/nginx/snippets/${DOMAIN}-locations.conf;
}
EOF

# Ativar e recarregar
if [ ! -f "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_CONF" "$NGINX_ENABLED"
fi
nginx -t && systemctl reload nginx

# 8. PM2 - Backend
echo "🔄 Reiniciando backend com PM2 na porta $APP_PORT..."
if command -v pm2 &> /dev/null; then
    pm2 delete "appdox-backend" &> /dev/null || true
    
    # O backend dist está em apps/backend/dist/apps/backend/src/index.js (devido ao aninhamento do monorepo)
    pm2 start "apps/backend/dist/apps/backend/src/index.js" \
        --name "appdox-backend" \
        --cwd "$WEB_ROOT" \
        --output "/var/log/pm2/appdox-backend-out.log" \
        --error "/var/log/pm2/appdox-backend-error.log" \
        --update-env
    
    pm2 save
fi

# 9. Health Check
echo "🔍 Validando Health Check (local)..."
sleep 5
if curl -s "http://localhost:${APP_PORT}/api/health" | grep -q "ok\|Healthy"; then
    echo "✅ Backend respondendo corretamente na porta $APP_PORT!"
else
    echo "⚠️ AVISO: Backend não respondeu ao health check. Verifique 'pm2 logs appdox-backend'."
fi

# 10. SSL (Certbot)
if command -v certbot &> /dev/null; then
    echo "🔐 Validando SSL..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@revio.digital --redirect
fi

echo "✅ Deploy unificado concluído com sucesso!"

