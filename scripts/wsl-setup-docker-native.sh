#!/bin/bash
# Script para instalar Docker NATIVO no WSL Ubuntu
# Encoding: UTF-8 without BOM
# EVITA Docker Desktop - Instalacao nativa no WSL

set -e

# Forcar UTF-8 rigorosamente em todo o script
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

echo "[INFO] Instalando Docker NATIVO no WSL Ubuntu..."
echo "[INFO] Esta instalacao EVITA Docker Desktop para Windows"
echo "========================================================="

# Verificar se estamos no WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    echo "[ERROR] Este script deve ser executado no WSL Ubuntu"
    echo "[TIP] Execute: wsl -d Ubuntu"
    exit 1
fi

# Verificar se Docker Desktop esta instalado (para avisar)
if command -v docker &> /dev/null && docker info 2>/dev/null | grep -q "Docker Desktop"; then
    echo "[WARN] Docker Desktop detectado!"
    echo "[INFO] Este script instalara Docker NATIVO no WSL"
    echo "[INFO] Isso pode conflitar com Docker Desktop"
    echo ""
    read -p "Continuar com instalacao nativa? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "[CANCEL] Instalacao cancelada"
        exit 0
    fi
fi

# Verificar se ja esta instalado
if command -v docker &> /dev/null && ! docker info 2>/dev/null | grep -q "Docker Desktop"; then
    echo "[WARN] Docker nativo ja esta instalado"
    docker --version
    echo ""
    read -p "Reinstalar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "[SKIP] Instalacao pulada"
        exit 0
    fi
fi

echo "1. Removendo instalacoes antigas..."
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

echo "2. Atualizando sistema..."
sudo apt update

echo "3. Instalando dependencias..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

echo "4. Adicionando chave GPG do Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "5. Adicionando repositorio do Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "6. Atualizando lista de pacotes..."
sudo apt update

echo "7. Instalando Docker CE..."
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "8. Configurando usuario..."
sudo usermod -aG docker $USER

echo "9. Configurando Docker daemon para WSL..."
# Criar configuracao otimizada para WSL
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "hosts": ["unix:///var/run/docker.sock"],
  "iptables": false,
  "bridge": "none",
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo "10. Configurando systemd para WSL..."
# Verificar se systemd esta disponivel
if command -v systemctl &> /dev/null; then
    echo "    [INFO] Systemd disponivel, configurando servicos..."
    sudo systemctl enable docker
    sudo systemctl start docker
else
    echo "    [WARN] Systemd nao disponivel, configurando inicio manual..."
    # Criar script de inicio para WSL sem systemd
    sudo tee /usr/local/bin/start-docker.sh > /dev/null <<'EOF'
#!/bin/bash
# Script para iniciar Docker no WSL sem systemd

# Verificar se Docker ja esta rodando
if ! docker info &> /dev/null; then
    echo "Iniciando Docker daemon..."
    sudo dockerd > /var/log/docker.log 2>&1 &
    
    # Aguardar Docker iniciar
    for i in {1..30}; do
        if docker info &> /dev/null; then
            echo "Docker iniciado com sucesso!"
            break
        fi
        sleep 1
    done
    
    if ! docker info &> /dev/null; then
        echo "Falha ao iniciar Docker"
        exit 1
    fi
else
    echo "Docker ja esta rodando"
fi
EOF
    sudo chmod +x /usr/local/bin/start-docker.sh
    
    # Adicionar ao .bashrc para inicio automatico
    if ! grep -q "start-docker.sh" ~/.bashrc; then
        echo "" >> ~/.bashrc
        echo "# Auto-start Docker no WSL" >> ~/.bashrc
        echo "sudo /usr/local/bin/start-docker.sh &> /dev/null" >> ~/.bashrc
    fi
fi

echo "11. Testando instalacao..."
# Iniciar Docker se nao estiver rodando
if ! docker info &> /dev/null; then
    if command -v systemctl &> /dev/null; then
        sudo systemctl start docker
    else
        sudo /usr/local/bin/start-docker.sh
    fi
fi

# Aguardar Docker ficar disponivel
echo "    Aguardando Docker inicializar..."
for i in {1..30}; do
    if docker info &> /dev/null; then
        break
    fi
    sleep 1
done

# Testar com hello-world
if docker run --rm hello-world &> /dev/null; then
    echo "    [SUCCESS] Docker funcionando corretamente!"
else
    echo "    [ERROR] Falha no teste do Docker"
    exit 1
fi

echo ""
echo "========================================================="
echo "[SUCCESS] Docker nativo instalado com sucesso no WSL!"
echo ""
echo "[INFO] Versoes instaladas:"
docker --version
docker compose version
echo ""
echo "[IMPORTANT] Para usar Docker sem sudo:"
echo "   1. Faca logout do WSL: exit"
echo "   2. Faca login novamente: wsl -d Ubuntu"
echo "   3. Ou execute: newgrp docker"
echo ""
if ! command -v systemctl &> /dev/null; then
    echo "[INFO] Docker sera iniciado automaticamente no proximo login"
    echo "[TIP] Para iniciar manualmente: sudo /usr/local/bin/start-docker.sh"
fi
echo ""
echo "[NEXT] Proximos passos:"
echo "   1. Reinicie o WSL: wsl --shutdown && wsl -d Ubuntu"
echo "   2. Teste o debug: ./scripts/wsl-debug-start.sh"
echo "   3. Ou use PowerShell: .\\scripts\\Debug-Start-WSL.ps1"
echo ""
echo "[BENEFITS] Vantagens do Docker nativo:"
echo "   - Melhor performance (sem overhead do Docker Desktop)"
echo "   - Menor uso de memoria"
echo "   - Controle total sobre configuracao"
echo "   - Sem dependencia do Windows"