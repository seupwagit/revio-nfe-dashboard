# Debug Docker WSL - Guia Atualizado

## Pré-requisitos

1. **WSL 2 com Ubuntu** instalado e funcionando
2. **Docker** instalado no WSL Ubuntu (não Docker Desktop)
3. **Arquivo .env** configurado na raiz do projeto

## Instalação Rápida

### 1. Instalar Docker no WSL Ubuntu
```bash
# No WSL Ubuntu
./scripts/wsl-setup-docker.sh
```

### 2. Verificar Ambiente
```bash
# Diagnóstico completo
./scripts/wsl-debug-diagnose.sh

# Ou do Windows
scripts\debug-diagnose-wsl.bat
```

## Como Usar

### Opção 1: Do Windows (Recomendado)
```batch
REM Iniciar debug
scripts\debug-start-wsl.bat

REM Parar debug
scripts\debug-stop-wsl.bat

REM Diagnóstico
scripts\debug-diagnose-wsl.bat
```

### Opção 2: Do WSL Ubuntu
```bash
# Iniciar debug
./scripts/wsl-debug-start.sh

# Parar debug
./scripts/wsl-debug-stop.sh

# Teste rápido
./scripts/wsl-debug-test.sh
```

### Opção 3: VS Code
1. Abra o projeto no VS Code
2. Pressione `F5`
3. Selecione "🐧 Debug Backend (WSL Docker Nativo)"
4. O ambiente será iniciado automaticamente

## URLs de Acesso

Após iniciar o debug:
- **Frontend**: http://localhost:4000 (ou porta do VITE_PORT)
- **Backend**: http://localhost:4001 (ou porta do BACKOFFICE_PORT)
- **Health Check**: http://localhost:4001/api/health
- **Debug Port**: localhost:9229

## Configurações Automáticas

O sistema carrega automaticamente todas as variáveis do arquivo `.env`:
- Portas do frontend e backend
- Configurações de banco de dados (MongoDB e SQL Server)
- Configurações S3
- Tokens de API
- Configurações de email

## Troubleshooting

### Problemas Comuns

1. **Script não executa**:
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Docker não encontrado**:
   ```bash
   ./scripts/wsl-setup-docker.sh
   ```

3. **Portas em uso**:
   ```bash
   docker-compose -f docker-compose.debug.yml down
   ```

4. **Permissões do Docker**:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

### Logs e Diagnóstico

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.debug.yml logs -f

# Logs específicos
docker-compose -f docker-compose.debug.yml logs backend-debug
docker-compose -f docker-compose.debug.yml logs frontend-debug

# Status dos containers
docker-compose -f docker-compose.debug.yml ps

# Entrar no container
docker exec -it fiscal-backend-debug bash
```

## Recursos Avançados

### Hot Reload
- ✅ Mudanças no código são refletidas automaticamente
- ✅ Source maps habilitados para debugging
- ✅ Volumes montados para desenvolvimento

### Debug no VS Code
- ✅ Breakpoints funcionam normalmente
- ✅ Variáveis e call stack visíveis
- ✅ Console integrado
- ✅ Restart automático

### Monitoramento
- ✅ Health checks automáticos
- ✅ Verificação de conectividade
- ✅ Logs estruturados
- ✅ Métricas de performance

## Arquitetura

```
Windows Host
├── VS Code (Debug Client)
├── Browser (Frontend Access)
└── WSL Ubuntu
    ├── Docker Engine
    ├── fiscal-frontend-debug (Port 4000)
    ├── fiscal-backend-debug (Port 4001, Debug 9229)
    └── fiscal-mongodb-debug (Port 27018, opcional)
```

## Comandos Úteis

```bash
# Rebuild containers
docker-compose -f docker-compose.debug.yml build --no-cache

# Restart específico
docker-compose -f docker-compose.debug.yml restart backend-debug

# Limpar sistema
docker system prune -f

# Ver recursos
docker stats

# Verificar rede
docker network inspect fiscal-network
```

Para mais detalhes, consulte: `docs/troubleshooting/wsl-docker-debug-issues.md`