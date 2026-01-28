#!/bin/bash
# Script de teste para debug WSL
# Encoding: UTF-8 without BOM

set -e

# Forcar UTF-8 rigorosamente em todo o script
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

echo "[INFO] Testando ambiente de debug WSL..."
echo "========================================"

# Verificar se estamos no WSL
echo "1. Testando ambiente WSL..."
if [[ -f /proc/version ]] && grep -qi microsoft /proc/version; then
    echo "   [OK] Executando no WSL"
else
    echo "   [ERROR] NAO esta executando no WSL"
    exit 1
fi

# Carregar variaveis do .env se existir
if [[ -f .env ]]; then
    echo "2. Carregando variaveis do .env..."
    set -a
    source <(grep -v '^#' .env | grep -v '^$' | sed 's/\r$//' | iconv -f utf-8 -t utf-8)
    set +a
    
    BACKEND_PORT=${BACKOFFICE_PORT:-4001}
    FRONTEND_PORT=${VITE_PORT:-4000}
    
    echo "   [OK] Variaveis carregadas"
    echo "   Backend Port: ${BACKEND_PORT}"
    echo "   Frontend Port: ${FRONTEND_PORT}"
else
    echo "2. [WARN] Arquivo .env nao encontrado"
    BACKEND_PORT=4001
    FRONTEND_PORT=4000
fi

# Verificar se containers estao rodando
echo ""
echo "3. Verificando containers..."
if docker ps | grep -q fiscal-backend-debug; then
    echo "   [OK] Container backend rodando"
    BACKEND_RUNNING=true
else
    echo "   [WARN] Container backend NAO esta rodando"
    BACKEND_RUNNING=false
fi

if docker ps | grep -q fiscal-frontend-debug; then
    echo "   [OK] Container frontend rodando"
    FRONTEND_RUNNING=true
else
    echo "   [WARN] Container frontend NAO esta rodando"
    FRONTEND_RUNNING=false
fi

# Testar conectividade se containers estiverem rodando
echo ""
echo "4. Testando conectividade..."

if [ "$BACKEND_RUNNING" = true ]; then
    echo "   Testando backend em http://localhost:${BACKEND_PORT}/api/health..."
    if curl -s --max-time 10 "http://localhost:${BACKEND_PORT}/api/health" > /dev/null; then
        echo "   [OK] Backend respondendo"
    else
        echo "   [ERROR] Backend NAO esta respondendo"
    fi
else
    echo "   [SKIP] Backend nao esta rodando"
fi

if [ "$FRONTEND_RUNNING" = true ]; then
    echo "   Testando frontend em http://localhost:${FRONTEND_PORT}..."
    if curl -s --max-time 10 "http://localhost:${FRONTEND_PORT}" > /dev/null; then
        echo "   [OK] Frontend respondendo"
    else
        echo "   [ERROR] Frontend NAO esta respondendo"
    fi
else
    echo "   [SKIP] Frontend nao esta rodando"
fi

# Testar porta de debug
echo ""
echo "5. Testando porta de debug..."
if nc -z localhost 9229 2>/dev/null; then
    echo "   [OK] Porta de debug 9229 acessivel"
else
    echo "   [WARN] Porta de debug 9229 NAO acessivel"
fi

# Verificar logs se houver problemas
echo ""
echo "6. Verificando logs recentes..."
if [ "$BACKEND_RUNNING" = true ]; then
    echo "   [INFO] Ultimas 5 linhas do log do backend:"
    docker logs fiscal-backend-debug --tail=5 2>/dev/null | sed 's/^/      /' || echo "      [ERROR] Nao foi possivel obter logs"
fi

if [ "$FRONTEND_RUNNING" = true ]; then
    echo "   [INFO] Ultimas 5 linhas do log do frontend:"
    docker logs fiscal-frontend-debug --tail=5 2>/dev/null | sed 's/^/      /' || echo "      [ERROR] Nao foi possivel obter logs"
fi

echo ""
echo "========================================"
echo "[INFO] Teste concluido!"
echo ""

# Sugestoes baseadas nos resultados
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo "[TIP] Para iniciar o debug: ./scripts/wsl-debug-start.sh"
fi

echo "[TIP] Para diagnostico completo: ./scripts/wsl-debug-diagnose.sh"
echo "[TIP] Para ver logs: docker compose -f docker-compose.debug.yml logs -f"