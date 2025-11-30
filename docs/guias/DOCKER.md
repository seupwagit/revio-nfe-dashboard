# Docker Setup

Este guia mostra como executar o NF Dashboard usando Docker.

## Pré-requisitos

- Docker instalado
- Docker Compose instalado (opcional)

## 1. Build da Imagem

```bash
# Build da imagem
docker build -t nf-dashboard .

# Verificar imagem criada
docker images | grep nf-dashboard
```

## 2. Executar Container

### Opção 1: Docker Run

```bash
docker run -d \
  --name nf-dashboard \
  -p 3000:80 \
  --restart unless-stopped \
  nf-dashboard
```

Acesse: http://localhost:3000

### Opção 2: Docker Compose

```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## 3. Variáveis de Ambiente

Para passar variáveis de ambiente no build:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://apinfe.revio.digital/api \
  --build-arg VITE_API_BEARER_TOKEN=seu_token \
  --build-arg VITE_DB_HOST=10.0.0.8 \
  --build-arg VITE_DB_DATABASE=C67624577000145 \
  --build-arg VITE_DB_COLLECTION=tbl_nfe_100 \
  -t nf-dashboard .
```

**Importante**: Variáveis `VITE_*` precisam ser passadas no **build time**, não no runtime.

## 4. Dockerfile Multi-Stage

O Dockerfile usa multi-stage build:

1. **Stage 1 (builder)**: Instala dependências e faz build
2. **Stage 2 (production)**: Copia apenas os arquivos necessários para Nginx

Isso resulta em uma imagem final muito menor (~25MB vs ~500MB).

## 5. Comandos Úteis

```bash
# Ver logs
docker logs -f nf-dashboard

# Entrar no container
docker exec -it nf-dashboard sh

# Ver status
docker ps | grep nf-dashboard

# Parar container
docker stop nf-dashboard

# Remover container
docker rm nf-dashboard

# Remover imagem
docker rmi nf-dashboard

# Ver uso de recursos
docker stats nf-dashboard
```

## 6. Health Check

O container inclui um health check que verifica se o Nginx está respondendo:

```bash
# Ver status do health check
docker inspect --format='{{.State.Health.Status}}' nf-dashboard
```

Status possíveis:
- `starting`: Iniciando
- `healthy`: Saudável
- `unhealthy`: Com problemas

## 7. Nginx Configuration

A configuração do Nginx está em `nginx.conf` e inclui:

- Suporte a SPA (Single Page Application)
- Gzip compression
- Cache de assets estáticos
- Security headers
- Health check endpoint

## 8. Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker logs nf-dashboard

# Verificar se a porta está em uso
netstat -tulpn | grep 3000
```

### Página em branco

1. Verifique se o build foi feito corretamente
2. Verifique as variáveis de ambiente
3. Verifique o console do navegador (F12)

### Erro de permissão

```bash
# Reconstruir com permissões corretas
docker build --no-cache -t nf-dashboard .
```

## 9. Produção

Para produção, use um registry:

```bash
# Tag da imagem
docker tag nf-dashboard registry.seu-dominio.com/nf-dashboard:latest

# Push para registry
docker push registry.seu-dominio.com/nf-dashboard:latest

# Pull e executar em produção
docker pull registry.seu-dominio.com/nf-dashboard:latest
docker run -d -p 80:80 registry.seu-dominio.com/nf-dashboard:latest
```

## 10. Docker Compose com Variáveis

Crie um arquivo `.env` na raiz:

```env
VITE_API_BASE_URL=https://apinfe.revio.digital/api
VITE_API_BEARER_TOKEN=seu_token
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
```

E atualize o `docker-compose.yml`:

```yaml
version: '3.8'

services:
  nf-dashboard:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=${VITE_API_BASE_URL}
        - VITE_API_BEARER_TOKEN=${VITE_API_BEARER_TOKEN}
        - VITE_DB_HOST=${VITE_DB_HOST}
        - VITE_DB_DATABASE=${VITE_DB_DATABASE}
        - VITE_DB_COLLECTION=${VITE_DB_COLLECTION}
    ports:
      - "3000:80"
    restart: unless-stopped
```

## 11. Otimizações

### Reduzir tamanho da imagem

O Dockerfile já usa:
- Alpine Linux (imagem base pequena)
- Multi-stage build
- `.dockerignore` para excluir arquivos desnecessários

### Melhorar performance

- Use cache do Docker: `docker build --cache-from nf-dashboard .`
- Use BuildKit: `DOCKER_BUILDKIT=1 docker build .`

## 12. CI/CD

Exemplo de GitHub Actions:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t nf-dashboard .
      
      - name: Push to registry
        run: |
          docker tag nf-dashboard registry.seu-dominio.com/nf-dashboard:latest
          docker push registry.seu-dominio.com/nf-dashboard:latest
```
