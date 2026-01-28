# Troubleshooting: Debug Docker WSL

## Problemas Comuns e Soluções

### 1. Script não executa

**Problema**: `./scripts/wsl-debug-start.sh: Permission denied`

**Solução**:
```bash
chmod +x scripts/*.sh
```

### 2. Docker não encontrado no WSL

**Problema**: `Docker não encontrado no WSL`

**Soluções**:

**Opção A - Instalar Docker no WSL (Recomendado)**:
```bash
./scripts/wsl-setup-docker.sh
```

**Opção B - Usar Docker Desktop**:
1. Instale Docker Desktop no Windows
2. Habilite "Use the WSL 2 based engine"
3. Habilite integração com sua distribuição WSL

### 3. Docker daemon não está rodando

**Problema**: `Cannot connect to the Docker daemon`

**Soluções**:
```bash
# Iniciar Docker
sudo systemctl start docker

# Habilitar para iniciar automaticamente
sudo systemctl enable docker

# Verificar status
sudo systemctl status docker
```

### 4. Permissões do Docker

**Problema**: `permission denied while trying to connect to the Docker daemon socket`

**Solução**:
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar mudanças (escolha uma opção)
newgrp docker
# OU
exit  # e faça login novamente no WSL
```

### 5. Portas já em uso

**Problema**: `Port already in use`

**Soluções**:
```bash
# Verificar quais processos estão usando as portas
netstat -tulnp | grep :4000
netstat -tulnp | grep :4001
netstat -tulnp | grep :9229

# Parar containers existentes
docker compose -f docker-compose.debug.yml down

# Matar processos específicos (se necessário)
sudo kill -9 <PID>
```

### 6. Containers não iniciam

**Problema**: Containers falham ao iniciar

**Diagnóstico**:
```bash
# Ver logs detalhados
docker compose -f docker-compose.debug.yml logs

# Ver logs de um serviço específico
docker compose -f docker-compose.debug.yml logs backend-debug
docker compose -f docker-compose.debug.yml logs frontend-debug

# Verificar status
docker compose -f docker-compose.debug.yml ps
```

**Soluções**:
```bash
# Rebuild sem cache
docker compose -f docker-compose.debug.yml build --no-cache

# Limpar containers órfãos
docker container prune -f

# Limpar imagens órfãs
docker image prune -f
```

### 7. Variáveis de ambiente não carregam

**Problema**: Configurações do .env não são aplicadas

**Verificações**:
```bash
# Verificar se .env existe
ls -la .env

# Verificar conteúdo (sem mostrar senhas)
grep -v "PASSWORD\|SECRET\|KEY" .env

# Testar carregamento manual
export $(grep -v '^#' .env | grep -v '^$' | xargs)
echo $BACKOFFICE_PORT
echo $VITE_PORT
```

### 8. VS Code não conecta ao debugger

**Problema**: VS Code não consegue conectar na porta 9229

**Soluções**:

1. **Verificar se a porta está exposta**:
```bash
docker ps | grep 9229
```

2. **Testar conexão manual**:
```bash
telnet localhost 9229
# OU
nc -z localhost 9229
```

3. **Verificar configuração do VS Code**:
   - Arquivo `.vscode/launch.json` deve ter a configuração correta
   - Porta deve ser 9229
   - Address deve ser "localhost"

4. **Reiniciar container backend**:
```bash
docker compose -f docker-compose.debug.yml restart backend-debug
```

### 9. Hot reload não funciona

**Problema**: Mudanças no código não são refletidas automaticamente

**Verificações**:
```bash
# Verificar se volumes estão montados corretamente
docker inspect fiscal-backend-debug | grep -A 10 "Mounts"
docker inspect fiscal-frontend-debug | grep -A 10 "Mounts"
```

**Soluções**:
- Verificar se os caminhos dos volumes no `docker-compose.debug.yml` estão corretos
- Reiniciar containers se necessário

### 10. Problemas de conectividade entre containers

**Problema**: Frontend não consegue acessar backend

**Verificações**:
```bash
# Verificar rede Docker
docker network ls
docker network inspect fiscal-network

# Testar conectividade entre containers
docker exec fiscal-frontend-debug ping fiscal-backend-debug
```

**Soluções**:
- Verificar se ambos containers estão na mesma rede
- Usar nomes de serviço corretos nas URLs

## Scripts de Diagnóstico

### Diagnóstico Completo
```bash
./scripts/wsl-debug-diagnose.sh
```

### Teste Rápido
```bash
./scripts/wsl-debug-test.sh
```

### Verificar Variáveis de Ambiente
```bash
./scripts/debug-env-check.sh
```

## Comandos Úteis

### Gerenciamento de Containers
```bash
# Iniciar debug
./scripts/wsl-debug-start.sh

# Parar debug
./scripts/wsl-debug-stop.sh

# Ver logs em tempo real
docker compose -f docker-compose.debug.yml logs -f

# Entrar no container backend
docker exec -it fiscal-backend-debug bash

# Entrar no container frontend
docker exec -it fiscal-frontend-debug bash

# Reiniciar serviço específico
docker compose -f docker-compose.debug.yml restart backend-debug
```

### Limpeza do Sistema
```bash
# Parar todos containers
docker compose -f docker-compose.debug.yml down

# Remover volumes também
docker compose -f docker-compose.debug.yml down -v

# Limpeza geral
docker system prune -f

# Limpeza completa (cuidado!)
docker system prune -a -f
```

### Monitoramento
```bash
# Ver recursos usados pelos containers
docker stats

# Ver processos nos containers
docker exec fiscal-backend-debug ps aux
docker exec fiscal-frontend-debug ps aux

# Ver portas abertas
netstat -tulnp | grep -E ":(4000|4001|9229)"
```

## Configurações Avançadas

### Ajustar Timeouts
Se os containers demoram muito para iniciar, ajuste os timeouts no `docker-compose.debug.yml`:

```yaml
services:
  backend-debug:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s
```

### Debug com Breakpoints
1. Coloque breakpoints no VS Code
2. Inicie o debug: F5 → "🐧 Debug Backend (WSL Docker Nativo)"
3. Faça requisições para o backend
4. O VS Code deve parar nos breakpoints

### Logs Estruturados
Para melhor debugging, configure logs estruturados no backend:

```typescript
// apps/backend/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});
```

## Contato para Suporte

Se os problemas persistirem:
1. Execute `./scripts/wsl-debug-diagnose.sh`
2. Colete os logs: `docker compose -f docker-compose.debug.yml logs > debug-logs.txt`
3. Documente os passos que levaram ao problema
4. Inclua informações do sistema: `uname -a`, `docker --version`