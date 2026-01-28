#!/bin/bash
# Script para configurar Docker Desktop com WSL integration
# Encoding: UTF-8 without BOM

set -e

# Forcar UTF-8 rigorosamente em todo o script
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

echo "[INFO] Configurando Docker Desktop com WSL integration..."
echo "======================================================="

# Verificar se estamos no WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    echo "[ERROR] Este script deve ser executado no WSL Ubuntu"
    echo "[TIP] Execute: wsl -d Ubuntu"
    exit 1
fi

echo "1. Verificando Docker Desktop no Windows..."

# Verificar se Docker Desktop esta instalado no Windows
if wsl.exe -d Ubuntu -e test -f /mnt/c/Program\ Files/Docker/Docker/Docker\ Desktop.exe; then
    echo "   [OK] Docker Desktop encontrado no Windows"
elif wsl.exe -d Ubuntu -e test -f /mnt/c/Users/$USER/AppData/Local/Docker/Docker\ Desktop.exe; then
    echo "   [OK] Docker Desktop encontrado no Windows (instalacao de usuario)"
else
    echo "   [ERROR] Docker Desktop nao encontrado no Windows"
    echo ""
    echo "[INSTALL] Para instalar Docker Desktop:"
    echo "   1. Baixe de: https://www.docker.com/products/docker-desktop"
    echo "   2. Execute o instalador no Windows"
    echo "   3. Habilite 'Use the WSL 2 based engine'"
    echo "   4. Habilite integracao com Ubuntu na aba Resources > WSL Integration"
    echo ""
    exit 1
fi

echo ""
echo "2. Verificando integracao WSL..."

# Verificar se docker esta disponivel no WSL
if command -v docker &> /dev/null; then
    echo "   [OK] Docker disponivel no WSL"
    
    # Testar conexao
    if docker info &> /dev/null; then
        echo "   [OK] Docker daemon acessivel"
        echo "   [INFO] Versao: $(docker --version)"
    else
        echo "   [WARN] Docker daemon nao acessivel"
        echo "   [TIP] Verifique se Docker Desktop esta rodando no Windows"
    fi
else
    echo "   [ERROR] Docker nao disponivel no WSL"
    echo ""
    echo "[CONFIG] Para habilitar integracao WSL:"
    echo "   1. Abra Docker Desktop no Windows"
    echo "   2. Va em Settings > Resources > WSL Integration"
    echo "   3. Habilite 'Enable integration with my default WSL distro'"
    echo "   4. Habilite integracao com 'Ubuntu'"
    echo "   5. Clique em 'Apply & Restart'"
    echo ""
    exit 1
fi

echo ""
echo "3. Verificando docker compose..."

# Verificar docker compose
if docker compose version &> /dev/null; then
    echo "   [OK] Docker Compose (plugin) disponivel"
    echo "   [INFO] Versao: $(docker compose version)"
elif command -v docker-compose &> /dev/null; then
    echo "   [OK] Docker Compose (standalone) disponivel"
    echo "   [INFO] Versao: $(docker-compose --version)"
else
    echo "   [ERROR] Docker Compose nao encontrado"
    echo "   [TIP] Docker Compose deveria vir com Docker Desktop"
    exit 1
fi

echo ""
echo "4. Testando funcionalidade..."

# Teste basico
echo "   Testando comando basico..."
if docker run --rm hello-world &> /dev/null; then
    echo "   [OK] Docker funcionando corretamente"
else
    echo "   [ERROR] Falha no teste do Docker"
    echo "   [TIP] Verifique se Docker Desktop esta rodando"
    exit 1
fi

echo ""
echo "5. Verificando recursos do sistema..."

# Verificar recursos
echo "   [INFO] Memoria disponivel: $(free -h | grep '^Mem:' | awk '{print $7}')"
echo "   [INFO] Espaco em disco: $(df -h . | tail -1 | awk '{print $4}') disponivel"

# Verificar se WSL tem recursos suficientes
AVAILABLE_MEMORY=$(free -m | grep '^Mem:' | awk '{print $7}')
if [ "$AVAILABLE_MEMORY" -lt 2048 ]; then
    echo "   [WARN] Memoria disponivel baixa (${AVAILABLE_MEMORY}MB)"
    echo "   [TIP] Considere aumentar memoria do WSL em .wslconfig"
fi

echo ""
echo "======================================================="
echo "[SUCCESS] Docker Desktop com WSL integration configurado!"
echo ""
echo "[INFO] Configuracao atual:"
echo "   Docker: $(docker --version)"
if docker compose version &> /dev/null; then
    echo "   Compose: $(docker compose version)"
else
    echo "   Compose: $(docker-compose --version)"
fi
echo ""
echo "[NEXT] Proximos passos:"
echo "   1. Teste o debug: ./scripts/wsl-debug-start.sh"
echo "   2. Ou use PowerShell: .\\scripts\\Debug-Start-WSL.ps1"
echo ""
echo "[TIP] Se houver problemas:"
echo "   - Reinicie Docker Desktop no Windows"
echo "   - Execute: wsl --shutdown && wsl -d Ubuntu"
echo "   - Verifique Resources > WSL Integration no Docker Desktop"