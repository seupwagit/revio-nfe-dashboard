#!/bin/bash
# Script para instalar Docker no WSL Ubuntu
# Encoding: UTF-8 without BOM

set -e

# Forcar UTF-8 rigorosamente em todo o script
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

echo "[INFO] Instalando Docker no WSL Ubuntu..."
echo "========================================="

# Verificar se estamos no WSL
if [[ ! -f /proc/version ]] || ! grep -qi microsoft /proc/version; then
    echo "[ERROR] Este script deve ser executado no WSL Ubuntu"
    echo "[TIP] Execute: wsl -d Ubuntu"
    exit 1
fi

# Verificar se ja esta instalado
if command -v docker &> /dev/null; then
    echo "[WARN] Docker ja esta instalado"
    docker --version
    echo "[TIP] Para reinstalar, remova primeiro: sudo apt remove docker docker-engine docker.io containerd runc"
    exit 0
fi

echo "1. Atualizando sistema..."
sudo apt update

echo "2. Instalando dependencias..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

echo "3. Adicionando chave GPG do Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "4. Adicionando repositorio do Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "5. Atualizando lista de pacotes..."
sudo apt update

echo "6. Instalando Docker..."
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "7. Adicionando usuario ao grupo docker..."
sudo usermod -aG docker $USER

echo "8. Habilitando Docker para iniciar automaticamente..."
sudo systemctl enable docker

echo "9. Iniciando Docker..."
sudo systemctl start docker

echo "10. Testando instalacao..."
if sudo docker run hello-world; then
    echo "[SUCCESS] Docker instalado com sucesso!"
else
    echo "[ERROR] Falha no teste do Docker"
    exit 1
fi

echo ""
echo "========================================="
echo "[SUCCESS] Instalacao concluida!"
echo ""
echo "[IMPORTANT] Para usar Docker sem sudo:"
echo "   1. Faca logout do WSL: exit"
echo "   2. Faca login novamente: wsl -d Ubuntu"
echo "   3. Ou execute: newgrp docker"
echo ""
echo "[INFO] Versoes instaladas:"
docker --version
docker compose version
echo ""
echo "[TIP] Para testar: docker run hello-world"