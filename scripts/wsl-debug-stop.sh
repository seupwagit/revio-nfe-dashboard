#!/bin/bash
# Script para parar debug no WSL com Docker nativo
# Funciona em qualquer diretório e sistema
# Encoding: UTF-8 without BOM

set -e

# Forcar UTF-8 rigorosamente em todo o script
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

# Timeout para operações
STOP_TIMEOUT=60

# Detectar diretório do projeto automaticamente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Verificar se estamos na raiz do projeto
if [[ ! -f "$PROJECT_ROOT/package.json" || ! -f "$PROJECT_ROOT/docker-compose.debug.yml" ]]; then
    echo "❌ [ERROR] Não foi possível detectar a raiz do projeto"
    echo "💡 [TIP] Execute este script a partir da raiz do projeto ou de scripts/"
    echo "💡 [TIP] Procurando por: package.json e docker-compose.debug.yml"
    exit 1
fi

# Mudar para o diretório do projeto
cd "$PROJECT_ROOT"

echo ""
echo "=========================================="
echo "🛑 PARANDO DEBUG WSL DOCKER NATIVO"
echo "=========================================="
echo ""
echo "📁 Projeto: $PROJECT_ROOT"
echo ""

# Verificar se estamos no WSL
echo "[1/5] 🔍 Verificando ambiente WSL..."
if [[ ! -f /proc/version ]] || ! grep -qi microsoft /proc/version; then
    echo "❌ [ERROR] Este script deve ser executado no WSL Ubuntu"
    echo "💡 [TIP] Execute: wsl -d Ubuntu"
    exit 1
fi
echo "✅ [OK] Executando no WSL Ubuntu"

# Verificar se docker compose esta disponivel
echo ""
echo "[2/5] 🔧 Verificando Docker Compose..."
if timeout 10 docker compose version &> /dev/null; then
    echo "✅ [OK] Usando docker compose (NATIVO)"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    echo "✅ [OK] Usando docker-compose"
    COMPOSE_CMD="docker-compose"
else
    echo "⚠️  [WARN] Docker Compose nao encontrado, usando 'docker compose'"
    COMPOSE_CMD="docker compose"
fi

# Parar containers de debug com timeout
echo ""
echo "[3/5] 🛑 Parando containers de debug..."
echo "⏳ [INFO] Parando containers (timeout: ${STOP_TIMEOUT}s)..."

# Executar parada em background para mostrar progresso
(
    timeout $STOP_TIMEOUT $COMPOSE_CMD -f docker-compose.debug.yml down --timeout 30 2>&1 | while IFS= read -r line; do
        echo "   [STOP] $line"
    done
) &
STOP_PID=$!

# Mostrar progresso enquanto parada executa
while kill -0 $STOP_PID 2>/dev/null; do
    echo "   🛑 Parando containers..."
    sleep 2
done

wait $STOP_PID
STOP_EXIT_CODE=$?

if [ $STOP_EXIT_CODE -ne 0 ]; then
    echo "⚠️  [WARN] Timeout ou erro na parada normal, forçando..."
    echo ""
    echo "[4/5] 🔨 Forçando parada de containers..."
    
    # Forçar parada de containers específicos
    if docker ps | grep -q fiscal; then
        echo "   🔨 Parando containers fiscal..."
        timeout 30 docker stop $(docker ps -q --filter "name=fiscal") 2>/dev/null || true
        echo "   🗑️  Removendo containers fiscal..."
        timeout 30 docker rm $(docker ps -aq --filter "name=fiscal") 2>/dev/null || true
    fi
    
    # Limpar recursos órfãos
    echo "   🧹 Limpando recursos órfãos..."
    timeout 20 docker container prune -f 2>/dev/null || true
    timeout 20 docker network prune -f 2>/dev/null || true
    
    echo "✅ [OK] Parada forçada concluída"
else
    echo "✅ [OK] Containers parados normalmente"
fi

# Verificar se containers foram parados
echo ""
echo "[5/5] 🔍 Verificando se containers foram parados..."
if docker ps | grep -q fiscal; then
    echo "⚠️  [WARN] Alguns containers ainda estao rodando:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep fiscal || true
    
    echo ""
    echo "🔨 [INFO] Última tentativa de parada forçada..."
    docker stop $(docker ps -q --filter "name=fiscal") 2>/dev/null || true
    docker rm $(docker ps -aq --filter "name=fiscal") 2>/dev/null || true
    
    # Verificar novamente
    if docker ps | grep -q fiscal; then
        echo "❌ [ERROR] Alguns containers ainda estão rodando"
        echo "💡 [TIP] Tente manualmente: docker stop \$(docker ps -q --filter 'name=fiscal')"
    else
        echo "✅ [OK] Todos os containers foram parados após força"
    fi
else
    echo "✅ [OK] Todos os containers foram parados corretamente"
fi

# Verificar portas liberadas (se .env existir)
echo ""
echo "🔍 [INFO] Verificando portas liberadas..."
if [[ -f .env ]] && command -v netstat &> /dev/null; then
    # Carregar variáveis do .env para verificar portas
    set -a
    source <(grep -v '^#' .env | grep -v '^$' | sed 's/\r$//' | iconv -f utf-8 -t utf-8 2>/dev/null || cat)
    set +a
    
    BACKEND_PORT=${BACKOFFICE_PORT:-4001}
    FRONTEND_PORT=${VITE_PORT:-4000}
    
    if netstat -tuln 2>/dev/null | grep -q ":${BACKEND_PORT} "; then
        echo "⚠️  [WARN] Porta ${BACKEND_PORT} ainda em uso"
    else
        echo "✅ [OK] Porta ${BACKEND_PORT} liberada"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":${FRONTEND_PORT} "; then
        echo "⚠️  [WARN] Porta ${FRONTEND_PORT} ainda em uso"
    else
        echo "✅ [OK] Porta ${FRONTEND_PORT} liberada"
    fi
else
    echo "💡 [INFO] Verificação de portas pulada (netstat não disponível ou .env não encontrado)"
fi

echo ""
echo "=========================================="
echo "✅ DEBUG PARADO COM SUCESSO!"
echo "=========================================="
echo ""
echo "💡 Para iniciar novamente:"
echo "   ./scripts/wsl-debug-start.sh"
echo "   Ou use VS Code: F5 → 'Debug Backend (WSL Docker Nativo)'"
echo ""
echo "🔍 Para verificar se tudo foi limpo:"
echo "   docker ps | grep fiscal"
echo "   docker compose -f docker-compose.debug.yml ps"
echo ""