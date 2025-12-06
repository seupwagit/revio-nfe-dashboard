#!/bin/sh

# Script de inicialização Fullstack Simplificado
# Backend serve o frontend na mesma porta

set -e

echo "=========================================="
echo "  🚀 SpedRevio Fullstack Application"
echo "=========================================="
echo ""

# Verificar variáveis de ambiente essenciais
if [ -z "$VITE_MONGODB_CONNECTION_STRING" ]; then
    echo "❌ VITE_MONGODB_CONNECTION_STRING não definida!"
    exit 1
fi

echo "✅ Variáveis de ambiente OK"
echo ""

# Configurações
PORT=${BACKOFFICE_PORT:-3000}

echo "📊 Iniciando servidor fullstack na porta $PORT..."
echo "   Frontend: http://localhost:$PORT"
echo "   Backend API: http://localhost:$PORT/api"
echo "   Health Check: http://localhost:$PORT/api/health"
echo ""

# Iniciar servidor
exec tsx src/server/index.ts
