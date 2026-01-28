#!/bin/bash
# Script otimizado para debug no WSL com Docker nativo
# Funciona em qualquer diretório e sistema
# Encoding: UTF-8 without BOM

set -e

# Forcar UTF-8 rigorosamente em todo o script
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

# Timeout global para operações
GLOBAL_TIMEOUT=300  # 5 minutos
DOCKER_TIMEOUT=120  # 2 minutos para Docker
SERVICE_TIMEOUT=60  # 1 minuto para verificação de serviços

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

echo "🎯 [INFO] Projeto detectado em: $PROJECT_ROOT"

# Função para cleanup em caso de erro ou interrupção
cleanup() {
    echo ""
    echo "🧹 [CLEANUP] Limpando recursos em caso de erro..."
    docker compose -f docker-compose.debug.yml down --timeout 10 2>/dev/null || true
    docker stop $(docker ps -q --filter "name=fiscal") 2>/dev/null || true
    exit 1
}

# Configurar trap para cleanup
trap cleanup INT TERM ERR

echo ""
echo "=========================================="
echo "🚀 INICIANDO DEBUG WSL DOCKER NATIVO"
echo "=========================================="
echo ""

# Verificar se estamos no WSL
echo "[1/12] 🔍 Verificando ambiente WSL..."
if [[ ! -f /proc/version ]] || ! grep -qi microsoft /proc/version; then
    echo "❌ [ERROR] Este script deve ser executado no WSL Ubuntu"
    echo "💡 [TIP] Execute: wsl -d Ubuntu"
    exit 1
fi
echo "✅ [OK] Executando no WSL Ubuntu"

# Verificar se arquivo .env existe
echo ""
echo "[2/12] 📄 Verificando arquivo .env..."
if [[ ! -f .env ]]; then
    echo "❌ [ERROR] Arquivo .env nao encontrado em: $(pwd)"
    echo "💡 [TIP] Certifique-se de que o arquivo .env existe na raiz do projeto"
    exit 1
fi
echo "✅ [OK] Arquivo .env encontrado em: $(pwd)/.env"

# Carregar variaveis do .env com encoding UTF-8
echo ""
echo "[3/12] ⚙️  Carregando variaveis do arquivo .env..."
set -a  # Exportar automaticamente todas as variaveis
source <(grep -v '^#' .env | grep -v '^$' | sed 's/\r$//' | iconv -f utf-8 -t utf-8)
set +a

# Validar variáveis críticas do .env
BACKEND_PORT=${BACKOFFICE_PORT:-4001}
FRONTEND_PORT=${VITE_PORT:-4000}

if [[ -z "$BACKEND_PORT" || -z "$FRONTEND_PORT" ]]; then
    echo "❌ [ERROR] Variaveis de porta nao encontradas no .env"
    echo "💡 [TIP] Verifique se BACKOFFICE_PORT e VITE_PORT estao definidas"
    exit 1
fi

echo "✅ [OK] Variaveis carregadas do .env:"
echo "   🔗 Backend (BACKOFFICE_PORT):  ${BACKEND_PORT}"
echo "   🌐 Frontend (VITE_PORT):       ${FRONTEND_PORT}"
echo "   🐛 Debug:                      9229"
echo "   🗄️  MongoDB Host:              ${VITE_DB_HOST:-'não definido'}"
echo "   🗃️  SQL Server:                ${VITE_DB_SERVER:-'não definido'}"

# Verificar se Docker esta instalado
echo ""
echo "[4/12] 🐳 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ [ERROR] Docker nao encontrado no WSL"
    echo "💡 [TIP] Para instalar Docker NATIVO (recomendado):"
    echo "   ./scripts/wsl-setup-docker-native.sh"
    exit 1
fi
echo "✅ [OK] Docker instalado"

# Verificar se Docker esta rodando com timeout
echo ""
echo "[5/12] 🔄 Verificando status do Docker..."
if ! timeout 30 docker info &> /dev/null; then
    echo "⚠️  [WARN] Docker nao esta rodando, tentando iniciar..."
    
    # Tentar iniciar com systemd primeiro
    if command -v systemctl &> /dev/null; then
        echo "🔧 [INFO] Iniciando Docker com systemd..."
        sudo systemctl start docker
    elif [ -f /usr/local/bin/start-docker.sh ]; then
        echo "🔧 [INFO] Iniciando Docker com script personalizado..."
        sudo /usr/local/bin/start-docker.sh
    else
        echo "❌ [ERROR] Nao foi possivel iniciar Docker automaticamente"
        echo "💡 [TIP] Inicie manualmente: sudo systemctl start docker"
        exit 1
    fi
    
    # Aguardar Docker iniciar com timeout
    echo "⏳ [INFO] Aguardando Docker inicializar (max 60s)..."
    for i in {1..60}; do
        if timeout 5 docker info &> /dev/null; then
            echo "✅ [OK] Docker iniciado após ${i} segundos"
            break
        fi
        if [ $i -eq 60 ]; then
            echo "❌ [ERROR] Timeout ao iniciar Docker"
            echo "💡 [TIP] Verifique os logs: sudo journalctl -u docker"
            exit 1
        fi
        sleep 1
        echo -n "."
    done
    echo ""
else
    echo "✅ [OK] Docker rodando"
fi

# Verificar se e Docker nativo (recomendado)
if timeout 10 docker info 2>/dev/null | grep -q "Docker Desktop"; then
    echo "⚠️  [WARN] Docker Desktop detectado"
    echo "💡 [TIP] Para melhor performance, considere Docker nativo"
else
    echo "🎯 [EXCELLENT] Docker nativo detectado (otimo!)"
fi

# Verificar se docker compose esta disponivel (PRIORIZAR NATIVO)
echo ""
echo "[6/12] 🔧 Verificando Docker Compose..."
if timeout 10 docker compose version &> /dev/null; then
    echo "✅ [OK] Usando docker compose (NATIVO)"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    echo "✅ [OK] Usando docker-compose"
    COMPOSE_CMD="docker-compose"
else
    echo "❌ [ERROR] Docker Compose nao encontrado"
    echo "💡 [TIP] Para instalar: ./scripts/wsl-setup-docker-native.sh"
    exit 1
fi

# Definir variaveis de ambiente para WSL
export DOCKER_HOST=unix:///var/run/docker.sock
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1

# Parar containers existentes com timeout
echo ""
echo "[7/12] 🛑 Parando containers existentes..."
timeout 30 $COMPOSE_CMD -f docker-compose.debug.yml down 2>/dev/null || {
    echo "⚠️  [WARN] Timeout ao parar containers, forçando parada..."
    docker stop $(docker ps -q --filter "name=fiscal") 2>/dev/null || true
    docker rm $(docker ps -aq --filter "name=fiscal") 2>/dev/null || true
}
echo "✅ [OK] Containers parados"

# Limpar containers orfaos se existirem
echo ""
echo "[8/12] 🧹 Limpando containers orfaos..."
timeout 20 docker container prune -f 2>/dev/null || true
echo "✅ [OK] Limpeza concluida"

# Verificar portas em uso
echo ""
echo "[9/12] 🔍 Verificando portas em uso..."
if command -v netstat &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":${BACKEND_PORT} "; then
        echo "⚠️  [WARN] Porta ${BACKEND_PORT} já está em uso"
        echo "💡 [TIP] Pode ser um container anterior, continuando..."
    fi
    if netstat -tuln 2>/dev/null | grep -q ":${FRONTEND_PORT} "; then
        echo "⚠️  [WARN] Porta ${FRONTEND_PORT} já está em uso"
        echo "� [iTIP] Pode ser um container anterior, continuando..."
    fi
fi
echo "✅ [OK] Verificação de portas concluída"

# Construir containers com timeout
echo ""
echo "[10/12] 🔨 Construindo containers..."
echo "⏳ [INFO] Isso pode levar alguns minutos (timeout: ${DOCKER_TIMEOUT}s)..."

# Executar build em background para mostrar progresso
(
    timeout $DOCKER_TIMEOUT $COMPOSE_CMD -f docker-compose.debug.yml build --no-cache 2>&1 | while IFS= read -r line; do
        echo "   [BUILD] $line"
    done
) &
BUILD_PID=$!

# Mostrar progresso enquanto build executa
while kill -0 $BUILD_PID 2>/dev/null; do
    echo "   🔨 Build em progresso..."
    sleep 5
done

wait $BUILD_PID
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "❌ [ERROR] Falha no build dos containers"
    echo "💡 [TIP] Verifique os logs acima para detalhes"
    exit 1
fi
echo "✅ [OK] Build concluído com sucesso"

# Iniciar containers com timeout
echo ""
echo "[11/12] 🚀 Iniciando containers..."
echo "⏳ [INFO] Iniciando serviços (timeout: ${DOCKER_TIMEOUT}s)..."

# Executar start em background para mostrar progresso
(
    timeout $DOCKER_TIMEOUT $COMPOSE_CMD -f docker-compose.debug.yml up -d 2>&1 | while IFS= read -r line; do
        echo "   [START] $line"
    done
) &
START_PID=$!

# Mostrar progresso enquanto start executa
while kill -0 $START_PID 2>/dev/null; do
    echo "   🚀 Containers iniciando..."
    sleep 3
done

wait $START_PID
START_EXIT_CODE=$?

if [ $START_EXIT_CODE -ne 0 ]; then
    echo "❌ [ERROR] Falha ao iniciar containers"
    echo "💡 [TIP] Verifique os logs: $COMPOSE_CMD -f docker-compose.debug.yml logs"
    exit 1
fi
echo "✅ [OK] Containers iniciados"

# Aguardar containers ficarem prontos
echo ""
echo "[12/12] ⏳ Aguardando containers ficarem prontos..."
for i in {1..20}; do
    echo "   Aguardando... ${i}/20 segundos"
    sleep 1
done

# Verificar status dos containers
echo ""
echo "📊 [INFO] Status dos containers:"
timeout 10 $COMPOSE_CMD -f docker-compose.debug.yml ps || echo "⚠️  [WARN] Timeout ao verificar status"

# Funcao para verificar se servico esta respondendo
check_service() {
    local url=$1
    local name=$2
    local max_attempts=15
    local attempt=1
    
    echo "🔍 [INFO] Verificando $name..."
    while [ $attempt -le $max_attempts ]; do
        if timeout 10 curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            echo "✅ [OK] $name respondendo em $url"
            return 0
        fi
        echo "   Tentativa $attempt/$max_attempts..."
        sleep 3
        ((attempt++))
    done
    
    echo "⚠️  [WARN] $name ainda nao esta respondendo em $url"
    echo "💡 [TIP] Verifique os logs: $COMPOSE_CMD -f docker-compose.debug.yml logs $name"
    return 1
}

# Verificar servicos usando as portas do .env
echo ""
echo "🔍 Verificando servicos (usando portas do .env)..."
check_service "http://localhost:${BACKEND_PORT}/api/health" "Backend"
check_service "http://localhost:${FRONTEND_PORT}" "Frontend"

# Verificar conexoes externas (se configuradas)
if [[ -n "${VITE_MONGODB_CONNECTION_STRING}" ]]; then
    echo ""
    echo "🗄️  [INFO] Configuracao MongoDB (do .env):"
    echo "   Host: ${VITE_DB_HOST}"
    echo "   Database: ${VITE_DB_DATABASE}"
    echo "   ✅ [OK] Configuracao MongoDB carregada"
fi

if [[ -n "${DATABASE_URL}" ]]; then
    echo ""
    echo "🗃️  [INFO] Configuracao SQL Server (do .env):"
    echo "   Server: ${VITE_DB_SERVER}"
    echo "   Database: SpedRevio"
    echo "   ✅ [OK] Configuracao SQL Server carregada"
fi

# Mostrar logs se houver problemas no backend
if ! timeout 10 curl -s "http://localhost:${BACKEND_PORT}/api/health" > /dev/null 2>&1; then
    echo ""
    echo "📋 [INFO] Logs do backend (ultimas 20 linhas):"
    timeout 10 $COMPOSE_CMD -f docker-compose.debug.yml logs --tail=20 backend-debug || echo "⚠️  [WARN] Timeout ao obter logs"
fi

# Remover trap de cleanup (sucesso)
trap - INT TERM ERR

echo ""
echo "=========================================="
echo "🎉 AMBIENTE DE DEBUG INICIADO COM SUCESSO!"
echo "=========================================="
echo ""
echo "📁 Projeto: $PROJECT_ROOT"
echo ""
echo "🌐 URLs (usando portas do .env):"
echo "   Frontend: http://localhost:${FRONTEND_PORT}"
echo "   Backend:  http://localhost:${BACKEND_PORT}"
echo "   Health:   http://localhost:${BACKEND_PORT}/api/health"
echo ""
echo "⚙️  Configuracoes carregadas do .env:"
echo "   VITE_PORT (Frontend):     ${FRONTEND_PORT}"
echo "   BACKOFFICE_PORT (Backend): ${BACKEND_PORT}"
echo "   MongoDB: ${VITE_DB_HOST}:27017/${VITE_DB_DATABASE}"
echo "   SQL Server: ${VITE_DB_SERVER}:1433"
echo "   S3 Bucket: ${VITE_S3_BUCKET}"
echo ""
echo "🐛 Debug no VS Code:"
echo "   1. ✅ Containers iniciados automaticamente"
echo "   2. 🔌 Debug port: localhost:9229"
echo "   3. 🎯 Pronto para breakpoints!"
echo "   4. 🌐 VS Code abrirá: http://localhost:${FRONTEND_PORT}"
echo ""
echo "📋 Comandos uteis:"
echo "   Ver logs:    $COMPOSE_CMD -f docker-compose.debug.yml logs -f"
echo "   Parar:       $COMPOSE_CMD -f docker-compose.debug.yml down"
echo "   Reiniciar:   $COMPOSE_CMD -f docker-compose.debug.yml restart"
echo "   Shell:       docker exec -it fiscal-backend-debug bash"
echo ""
echo "🛑 Para parar: ./scripts/wsl-debug-stop.sh"
echo ""
echo "=========================================="
echo "✅ PRONTO PARA DEBUG!"
echo "=========================================="