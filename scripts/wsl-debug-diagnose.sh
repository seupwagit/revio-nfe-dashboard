#!/bin/bash
# Script de diagnostico para debug WSL
# Encoding: UTF-8 without BOM

set -e

# Forcar UTF-8 rigorosamente em todo o script
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

echo "[INFO] Diagnostico do ambiente de debug WSL..."
echo "================================================"

# Verificar se estamos no WSL
echo "1. Verificando ambiente WSL..."
if [[ -f /proc/version ]] && grep -qi microsoft /proc/version; then
    echo "   [OK] Executando no WSL"
    echo "   [INFO] Versao: $(grep microsoft /proc/version)"
else
    echo "   [ERROR] NAO esta executando no WSL"
    echo "   [TIP] Execute: wsl -d Ubuntu"
    exit 1
fi

# Verificar encoding
echo ""
echo "2. Verificando encoding UTF-8..."
if [[ "$LC_ALL" == "C.UTF-8" ]] || [[ "$LANG" == *"UTF-8"* ]]; then
    echo "   [OK] UTF-8 configurado corretamente"
    echo "   [INFO] LC_ALL: $LC_ALL"
    echo "   [INFO] LANG: $LANG"
else
    echo "   [WARN] UTF-8 nao configurado, aplicando correcao..."
    export LC_ALL=C.UTF-8
    export LANG=C.UTF-8
    export LANGUAGE=C.UTF-8
    echo "   [OK] UTF-8 configurado"
fi

# Verificar arquivo .env
echo ""
echo "3. Verificando arquivo .env..."
if [[ -f .env ]]; then
    echo "   [OK] Arquivo .env encontrado"
    echo "   [INFO] Tamanho: $(wc -l < .env) linhas"
    
    # Verificar encoding do arquivo .env
    if file .env | grep -q "UTF-8"; then
        echo "   [OK] Arquivo .env em UTF-8"
    else
        echo "   [WARN] Arquivo .env pode nao estar em UTF-8"
        echo "   [TIP] Converta para UTF-8: iconv -f iso-8859-1 -t utf-8 .env > .env.utf8 && mv .env.utf8 .env"
    fi
    
    # Verificar variaveis importantes
    echo "   [INFO] Variaveis importantes:"
    if grep -q "BACKOFFICE_PORT" .env; then
        BACKEND_PORT=$(grep "BACKOFFICE_PORT" .env | cut -d'=' -f2 | tr -d '\r')
        echo "      BACKOFFICE_PORT: ${BACKEND_PORT}"
    else
        echo "      [WARN] BACKOFFICE_PORT nao encontrada"
    fi
    
    if grep -q "VITE_PORT" .env; then
        FRONTEND_PORT=$(grep "VITE_PORT" .env | cut -d'=' -f2 | tr -d '\r')
        echo "      VITE_PORT: ${FRONTEND_PORT}"
    else
        echo "      [WARN] VITE_PORT nao encontrada"
    fi
    
    if grep -q "DATABASE_URL" .env; then
        echo "      [OK] DATABASE_URL configurada"
    else
        echo "      [WARN] DATABASE_URL nao encontrada"
    fi
    
    if grep -q "VITE_MONGODB_CONNECTION_STRING" .env; then
        echo "      [OK] VITE_MONGODB_CONNECTION_STRING configurada"
    else
        echo "      [WARN] VITE_MONGODB_CONNECTION_STRING nao encontrada"
    fi
else
    echo "   [ERROR] Arquivo .env NAO encontrado"
    echo "   [TIP] Crie o arquivo .env na raiz do projeto"
    exit 1
fi

# Verificar Docker
echo ""
echo "4. Verificando Docker..."
if command -v docker &> /dev/null; then
    echo "   [OK] Docker instalado"
    echo "   [INFO] Versao: $(docker --version)"
    
    # Verificar se Docker esta rodando
    if docker info &> /dev/null; then
        echo "   [OK] Docker daemon rodando"
        echo "   [INFO] Containers ativos: $(docker ps -q | wc -l)"
        
        # Verificar se e Docker Desktop ou nativo
        if docker info 2>/dev/null | grep -q "Docker Desktop"; then
            echo "   [WARN] Docker Desktop detectado"
            echo "   [TIP] Para melhor performance, considere Docker nativo:"
            echo "      ./scripts/wsl-setup-docker-native.sh"
        else
            echo "   [OK] Docker nativo detectado (recomendado)"
        fi
    else
        echo "   [WARN] Docker daemon NAO esta rodando"
        echo "   [TIP] Para iniciar Docker:"
        echo "      1. Se nativo: sudo systemctl start docker"
        echo "      2. Se Desktop: inicie Docker Desktop no Windows"
        echo "      3. Para instalar nativo: ./scripts/wsl-setup-docker-native.sh"
    fi
else
    echo "   [ERROR] Docker NAO instalado"
    echo "   [TIP] Opcoes de instalacao (RECOMENDADO: nativo):"
    echo "      1. Docker nativo (recomendado): ./scripts/wsl-setup-docker-native.sh"
    echo "      2. Docker Desktop: ./scripts/wsl-setup-docker-desktop.sh"
    exit 1
fi

# Verificar docker-compose
echo ""
echo "5. Verificando Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "   [OK] docker-compose instalado"
    echo "   [INFO] Versao: $(docker-compose --version)"
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    echo "   [OK] docker compose (plugin) disponivel"
    echo "   [INFO] Versao: $(docker compose version)"
    COMPOSE_CMD="docker compose"
else
    echo "   [ERROR] Docker Compose NAO encontrado"
    echo "   [TIP] Opcoes:"
    echo "      1. Se usando Docker Desktop: verifique se esta atualizado"
    echo "      2. Se usando Docker nativo: instale docker-compose"
    echo "      3. Execute: ./scripts/wsl-setup-docker.sh"
    exit 1
fi

# Verificar arquivos de configuracao
echo ""
echo "6. Verificando arquivos de configuracao..."
if [[ -f docker-compose.debug.yml ]]; then
    echo "   [OK] docker-compose.debug.yml encontrado"
    # Verificar encoding do arquivo
    if file docker-compose.debug.yml | grep -q "UTF-8"; then
        echo "   [OK] docker-compose.debug.yml em UTF-8"
    else
        echo "   [WARN] docker-compose.debug.yml pode nao estar em UTF-8"
    fi
else
    echo "   [ERROR] docker-compose.debug.yml NAO encontrado"
    exit 1
fi

if [[ -f Dockerfile.debug ]]; then
    echo "   [OK] Dockerfile.debug encontrado"
else
    echo "   [ERROR] Dockerfile.debug NAO encontrado"
    exit 1
fi

if [[ -f .vscode/launch.json ]]; then
    echo "   [OK] .vscode/launch.json encontrado"
else
    echo "   [WARN] .vscode/launch.json NAO encontrado"
fi

if [[ -f .vscode/tasks.json ]]; then
    echo "   [OK] .vscode/tasks.json encontrado"
else
    echo "   [WARN] .vscode/tasks.json NAO encontrado"
fi

# Verificar permissoes dos scripts
echo ""
echo "7. Verificando permissoes dos scripts..."
for script in wsl-debug-start.sh wsl-debug-stop.sh wsl-setup-docker.sh wsl-debug-test.sh; do
    if [[ -f "scripts/$script" ]]; then
        if [[ -x "scripts/$script" ]]; then
            echo "   [OK] scripts/$script executavel"
        else
            echo "   [WARN] scripts/$script sem permissao de execucao"
            echo "   [TIP] Execute: chmod +x scripts/$script"
        fi
    else
        echo "   [ERROR] scripts/$script NAO encontrado"
    fi
done

# Verificar portas em uso
echo ""
echo "8. Verificando portas..."
BACKEND_PORT=${BACKOFFICE_PORT:-4001}
FRONTEND_PORT=${VITE_PORT:-4000}

if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":${BACKEND_PORT} "; then
        echo "   [WARN] Porta ${BACKEND_PORT} (backend) ja esta em uso"
        echo "   [INFO] Processo: $(netstat -tulnp 2>/dev/null | grep ":${BACKEND_PORT} " | awk '{print $7}' | head -1)"
    else
        echo "   [OK] Porta ${BACKEND_PORT} (backend) disponivel"
    fi
    
    if netstat -tuln | grep -q ":${FRONTEND_PORT} "; then
        echo "   [WARN] Porta ${FRONTEND_PORT} (frontend) ja esta em uso"
        echo "   [INFO] Processo: $(netstat -tulnp 2>/dev/null | grep ":${FRONTEND_PORT} " | awk '{print $7}' | head -1)"
    else
        echo "   [OK] Porta ${FRONTEND_PORT} (frontend) disponivel"
    fi
    
    if netstat -tuln | grep -q ":9229 "; then
        echo "   [WARN] Porta 9229 (debug) ja esta em uso"
    else
        echo "   [OK] Porta 9229 (debug) disponivel"
    fi
else
    echo "   [WARN] netstat nao disponivel, nao foi possivel verificar portas"
fi

# Verificar containers existentes
echo ""
echo "9. Verificando containers existentes..."
if docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -q fiscal; then
    echo "   [INFO] Containers relacionados ao projeto:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep fiscal | sed 's/^/      /'
else
    echo "   [OK] Nenhum container do projeto encontrado"
fi

# Verificar conectividade de rede
echo ""
echo "10. Verificando conectividade..."
if ping -c 1 google.com &> /dev/null; then
    echo "   [OK] Conectividade com internet OK"
else
    echo "   [WARN] Problemas de conectividade com internet"
fi

if ping -c 1 localhost &> /dev/null; then
    echo "   [OK] Conectividade local OK"
else
    echo "   [WARN] Problemas de conectividade local"
fi

# Verificar recursos do sistema
echo ""
echo "11. Verificando recursos do sistema..."
echo "    [INFO] Memoria disponivel: $(free -h | grep '^Mem:' | awk '{print $7}')"
echo "    [INFO] Espaco em disco: $(df -h . | tail -1 | awk '{print $4}') disponivel"
echo "    [INFO] Load average: $(uptime | awk -F'load average:' '{print $2}')"

echo ""
echo "================================================"
echo "[SUCCESS] Diagnostico concluido!"
echo ""

# Sugestoes baseadas nos problemas encontrados
echo "[TIP] Proximos passos sugeridos:"
echo "   1. Se tudo estiver OK: ./scripts/wsl-debug-start.sh"
echo "   2. Se Docker nao estiver rodando: sudo systemctl start docker"
echo "   3. Se houver problemas de permissao: chmod +x scripts/*.sh"
echo "   4. Para logs detalhados: docker compose -f docker-compose.debug.yml logs"
echo ""
echo "[HELP] Se ainda houver problemas:"
echo "   1. Verifique os logs: docker compose -f docker-compose.debug.yml logs"
echo "   2. Teste manualmente: docker run hello-world"
echo "   3. Reinicie o WSL: wsl --shutdown && wsl -d Ubuntu"