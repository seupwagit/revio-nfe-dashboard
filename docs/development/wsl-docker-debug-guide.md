# 🐧 Debug com Docker no Ubuntu WSL

## Configuração para usar Docker nativo do Ubuntu WSL (não Docker Desktop)

### 1. Verificar Docker no WSL

```bash
# Entrar no WSL Ubuntu
wsl -d Ubuntu

# Verificar se Docker está instalado e rodando
docker --version
docker-compose --version
sudo systemctl status docker

# Se Docker não estiver rodando
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker (evitar sudo)
sudo usermod -aG docker $USER
# Reiniciar WSL após este comando
```

### 2. Configurar VS Code para WSL

#### Extensões Necessárias:
```bash
# Instalar extensões via comando
code --install-extension ms-vscode-remote.remote-wsl
code --install-extension ms-vscode-remote.remote-containers
code --install-extension ms-vscode.vscode-typescript-next
```

#### Abrir Projeto no WSL:
```bash
# No Windows, abrir terminal WSL
wsl -d Ubuntu

# Navegar para o projeto (exemplo)
cd /mnt/c/Drive/Projetos/revio-nfe-dashboard

# Abrir VS Code no contexto WSL
code .
```

### 3. Configuração Específica para WSL

#### .vscode/settings.json (WSL-specific):
```json
{
  "remote.WSL.fileWatcher.polling": true,
  "remote.WSL.fileWatcher.pollingInterval": 3000,
  "terminal.integrated.defaultProfile.linux": "bash",
  "docker.host": "unix:///var/run/docker.sock",
  "docker.dockerPath": "/usr/bin/docker",
  "docker.composeCommand": "docker-compose"
}
```

### 4. Scripts Otimizados para WSL