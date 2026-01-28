# Docker Nativo WSL Setup - Guia Completo

## Por que Docker Nativo?

### ✅ Vantagens do Docker Nativo no WSL
- **Performance Superior**: Sem overhead do Docker Desktop
- **Menor Uso de Memória**: ~200MB vs ~1GB do Docker Desktop
- **Controle Total**: Configuração completa do daemon
- **Independência**: Não depende do Windows
- **Startup Rápido**: Inicia em segundos
- **Recursos Otimizados**: Configuração específica para WSL

### ❌ Desvantagens do Docker Desktop
- **Alto Consumo de Memória**: ~1GB+ de RAM
- **Startup Lento**: Demora para inicializar
- **Dependência Windows**: Precisa estar rodando no Windows
- **Overhead**: Camada adicional de virtualização
- **Complexidade**: Configurações distribuídas entre Windows e WSL

## Instalação Docker Nativo

### 1. Executar Script de Instalação

```bash
# No WSL Ubuntu
./scripts/wsl-setup-docker-native.sh
```

### 2. Reiniciar WSL

```powershell
# No PowerShell Windows
wsl --shutdown
wsl -d Ubuntu
```

### 3. Verificar Instalação

```bash
# No WSL Ubuntu
docker --version
docker compose version
docker info
```

## Configuração Otimizada

### Daemon Configuration (`/etc/docker/daemon.json`)

```json
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
```

### Explicação das Configurações

- **`iptables: false`**: Evita conflitos de rede no WSL
- **`bridge: none`**: Usa rede do host WSL
- **`storage-driver: overlay2`**: Driver otimizado para performance
- **`log-opts`**: Limita tamanho dos logs para economizar espaço

## Gerenciamento de Serviços

### Com Systemd (Ubuntu 22.04+)

```bash
# Iniciar Docker
sudo systemctl start docker

# Parar Docker
sudo systemctl stop docker

# Status do Docker
sudo systemctl status docker

# Habilitar auto-start
sudo systemctl enable docker
```

### Sem Systemd (Ubuntu 20.04)

```bash
# Iniciar Docker
sudo /usr/local/bin/start-docker.sh

# Parar Docker
sudo pkill dockerd

# Verificar status
docker info
```

## Troubleshooting

### Docker não inicia

```bash
# Verificar logs
sudo journalctl -u docker

# Ou verificar processo
ps aux | grep docker

# Iniciar manualmente
sudo dockerd
```

### Permissões

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar mudanças
newgrp docker

# Ou fazer logout/login
exit
wsl -d Ubuntu
```

### Conflito com Docker Desktop

```bash
# Parar Docker Desktop no Windows
# Depois verificar no WSL
docker info | grep -i desktop

# Se ainda aparecer Desktop, remover:
sudo apt remove docker-desktop
```

## Performance Comparison

### Docker Desktop
```
Memory Usage: ~1.2GB
Startup Time: ~30-60 seconds
Container Start: ~3-5 seconds
Build Time: Baseline
```

### Docker Nativo
```
Memory Usage: ~200MB
Startup Time: ~5-10 seconds
Container Start: ~1-2 seconds
Build Time: 20-30% faster
```

## Comandos de Debug

### Verificar Instalação
```bash
# Diagnóstico completo
./scripts/wsl-debug-diagnose.sh

# Teste rápido
./scripts/wsl-debug-test.sh
```

### Iniciar Debug
```bash
# Via shell script
./scripts/wsl-debug-start.sh

# Via PowerShell
.\scripts\Debug-Start-WSL.ps1
```

### Monitorar Recursos
```bash
# Uso de memória do Docker
docker system df

# Processos Docker
docker system events

# Stats dos containers
docker stats
```

## Migração do Docker Desktop

### 1. Parar Docker Desktop
1. Feche Docker Desktop no Windows
2. Desabilite auto-start

### 2. Instalar Docker Nativo
```bash
./scripts/wsl-setup-docker-native.sh
```

### 3. Migrar Imagens (Opcional)
```bash
# Exportar imagens do Desktop (se necessário)
docker save -o backup.tar image1 image2

# Importar no nativo
docker load -i backup.tar
```

### 4. Testar Aplicação
```bash
# Testar debug
./scripts/wsl-debug-start.sh
```

## Configuração Avançada

### Limites de Recursos
```json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5
}
```

### Registry Mirrors
```json
{
  "registry-mirrors": [
    "https://mirror.gcr.io"
  ]
}
```

### Insecure Registries
```json
{
  "insecure-registries": [
    "localhost:5000"
  ]
}
```

## Automação

### Auto-start no WSL
O script adiciona automaticamente ao `.bashrc`:

```bash
# Auto-start Docker no WSL
sudo /usr/local/bin/start-docker.sh &> /dev/null
```

### Verificação de Saúde
```bash
#!/bin/bash
# health-check.sh
if ! docker info &> /dev/null; then
    echo "Docker não está rodando, iniciando..."
    sudo systemctl start docker || sudo /usr/local/bin/start-docker.sh
fi
```

## Próximos Passos

1. ✅ **Instalar Docker Nativo**: `./scripts/wsl-setup-docker-native.sh`
2. ✅ **Reiniciar WSL**: `wsl --shutdown && wsl -d Ubuntu`
3. ✅ **Testar Debug**: `./scripts/wsl-debug-start.sh`
4. ✅ **Configurar VS Code**: Pressionar F5 para debug
5. ✅ **Monitorar Performance**: `docker stats`

## Suporte

### Logs Importantes
- Docker daemon: `/var/log/docker.log`
- Systemd: `sudo journalctl -u docker`
- Container logs: `docker logs <container>`

### Comandos de Diagnóstico
```bash
# Sistema
free -h
df -h
ps aux | grep docker

# Docker
docker version
docker info
docker system df
docker system prune
```

### Links Úteis
- [Docker Engine Installation](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Daemon Configuration](https://docs.docker.com/engine/reference/commandline/dockerd/)
- [WSL 2 Best Practices](https://docs.microsoft.com/en-us/windows/wsl/wsl-config)