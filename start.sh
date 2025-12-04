#!/bin/bash

# Script de inicialização para produção
# Usado pelo Coolify para iniciar a aplicação

echo "🚀 Iniciando aplicação na porta 3000..."

# Verifica se o build existe
if [ ! -d "dist" ]; then
  echo "📦 Build não encontrado. Executando build..."
  npm run build
fi

# Inicia o servidor
echo "✅ Iniciando servidor..."
npm run start
