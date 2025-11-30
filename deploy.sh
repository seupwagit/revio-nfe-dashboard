#!/bin/bash

# Script de Deploy para Nginx
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do NF Dashboard..."
echo ""

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Build
echo "📦 Criando build de produção..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erro: Pasta dist não foi criada"
    exit 1
fi

echo "✅ Build criado com sucesso"
echo ""

# Backup do deploy anterior
BACKUP_DIR="/data/nginx/www/nf-dashboard.backup.$(date +%Y%m%d_%H%M%S)"
if [ -d "/data/nginx/www/nf-dashboard" ]; then
    echo "💾 Fazendo backup do deploy anterior..."
    sudo cp -r /data/nginx/www/nf-dashboard "$BACKUP_DIR"
    echo "✅ Backup salvo em: $BACKUP_DIR"
else
    echo "📁 Criando diretório /data/nginx/www/nf-dashboard..."
    sudo mkdir -p /data/nginx/www/nf-dashboard
fi

echo ""

# Copiar novos arquivos
echo "📂 Copiando arquivos para /data/nginx/www/nf-dashboard..."
sudo rm -rf /data/nginx/www/nf-dashboard/*
sudo cp -r dist/* /data/nginx/www/nf-dashboard/

echo "✅ Arquivos copiados"
echo ""

# Ajustar permissões
echo "🔐 Ajustando permissões..."
sudo chown -R www-data:www-data /data/nginx/www/nf-dashboard
sudo chmod -R 755 /data/nginx/www/nf-dashboard

echo "✅ Permissões ajustadas"
echo ""

# Testar configuração do Nginx
echo "🔍 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração do Nginx OK"
    echo ""
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado"
else
    echo "❌ Erro na configuração do Nginx"
    echo "Restaurando backup..."
    sudo rm -rf /data/nginx/www/nf-dashboard/*
    sudo cp -r "$BACKUP_DIR"/* /data/nginx/www/nf-dashboard/
    exit 1
fi

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📊 Estatísticas:"
echo "   - Arquivos: $(find /data/nginx/www/nf-dashboard -type f | wc -l)"
echo "   - Tamanho: $(du -sh /data/nginx/www/nf-dashboard | cut -f1)"
echo ""
echo "🌐 Acesse: https://nf-dashboard.sistemasflow.com.br"
