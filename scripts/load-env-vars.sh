#!/bin/bash

echo "🔧 CARREGANDO VARIÁVEIS DE AMBIENTE"
echo "=================================="

# Carregar variáveis do .env
if [ -f ".env" ]; then
    echo "📋 Carregando .env..."
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    echo "✅ Variáveis carregadas do .env"
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Verificar variáveis críticas
echo ""
echo "📋 Verificando variáveis críticas..."

CRITICAL_VARS=(
    "PORT"
    "VITE_PORT" 
    "BACKOFFICE_PORT"
    "VITE_API_BASE_URL"
)

for var in "${CRITICAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var = ${!var}"
    else
        echo "❌ $var não definida"
    fi
done

echo ""
echo "🎯 URLs DE DEBUG:"
echo "=================="
echo "Frontend: http://localhost:${VITE_PORT:-4000}"
echo "Backend:  http://localhost:${BACKOFFICE_PORT:-4001}"
echo "API Base: ${VITE_API_BASE_URL:-'não definida'}"

# Exportar para uso em outros scripts
echo ""
echo "📤 Exportando variáveis para o ambiente..."
export PORT="${PORT:-4000}"
export VITE_PORT="${VITE_PORT:-4000}"
export BACKOFFICE_PORT="${BACKOFFICE_PORT:-4001}"

echo "✅ Variáveis exportadas com sucesso!"