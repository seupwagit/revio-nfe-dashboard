# 🚀 Deploy no Coolify - Fullstack

Guia completo para deploy da aplicação SpedRevio (Frontend + Backend) no Coolify.

## 📋 Pré-requisitos

- Coolify instalado e configurado
- Acesso ao repositório Git
- Variáveis de ambiente configuradas
- MongoDB acessível (10.0.0.8:27017)
- SQL Server acessível (10.0.0.4:1433)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Coolify Container               │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │   Frontend   │  │    Backend      │ │
│  │   (Serve)    │  │   (Node.js)     │ │
│  │   Port 3000  │  │   Port 3001     │ │
│  └──────────────┘  └─────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
           │                    │
           │                    │
           ▼                    ▼
    ┌──────────┐         ┌──────────┐
    │  Nginx   │         │ MongoDB  │
    │  Proxy   │         │  10.0.0.8│
    └──────────┘         └──────────┘
```

## 🔧 Configuração no Coolify

### 1. Criar Novo Projeto

1. Acesse o Coolify Dashboard
2. Clique em "New Resource"
3. Selecione "Application"
4. Escolha "Docker Compose" ou "Dockerfile"

### 2. Configurar Repositório

**Git Repository:**
```
Repository URL: https://github.com/seu-usuario/nf-dashboard
Branch: main
```

**Build Configuration:**
```
Build Pack: Dockerfile
Dockerfile: Dockerfile.fullstack
```

### 3. Configurar Portas

**Portas Expostas:**
```
3000 → Frontend (HTTP)
3001 → Backend API (HTTP)
```

**Port Mapping:**
```
Public Port: 80 → Container Port: 3000
```

### 4. Variáveis de Ambiente

Adicione as seguintes variáveis no Coolify:

#### Essenciais

```bash
# Node Environment
NODE_ENV=production
PORT=3000
BACKOFFICE_PORT=3001

# MongoDB (OBRIGATÓRIO)
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&authSource=admin&directConnection=true

# API Configuration
VITE_API_BASE_URL=https://apinfe.revio.digital
VITE_API_BEARER_TOKEN=seu_token_aqui

# Database
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
```

#### Opcionais

```bash
# Query Configuration
VITE_DEFAULT_PAGE_SIZE=10000
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=60
VITE_DEFAULT_DATE_RANGE_DAYS=30

# S3/Wasabi
VITE_S3_ENDPOINT=https://s3.wasabisys.com
VITE_S3_ACCESS_KEY=7YDC7UG085G6BS8A714S
VITE_S3_SECRET_KEY=HYKatJ4XbvaOsCsz9uJJGm2ZBgZWfsgZ5XHun1Vs
VITE_S3_BUCKET=revio-bucket
VITE_S3_REGION=us-east-1

# SQL Server
VITE_DB_SERVER=10.0.0.4
VITE_DB_USER=sa
VITE_DB_PASSWORD=zaqwsx2001
```

### 5. Configurar Domínio

**Domínio Customizado:**
```
Domain: nf-dashboard.seudominio.com.br
SSL: Enabled (Let's Encrypt)
```

**Ou usar domínio Coolify:**
```
Domain: app-xxxxx.coolify.io
```

### 6. Health Check

```yaml
Health Check Path: /api/health
Health Check Port: 3001
Interval: 30s
Timeout: 10s
Retries: 3
Start Period: 40s
```

## 🚀 Deploy

### Método 1: Deploy Automático (Git Push)

1. Configure webhook no Coolify
2. Faça push para o repositório:
```bash
git add .
git commit -m "Deploy to Coolify"
git push origin main
```
3. Coolify detecta e faz deploy automaticamente

### Método 2: Deploy Manual

1. No Coolify Dashboard
2. Vá para seu projeto
3. Clique em "Deploy"
4. Aguarde o build e deploy

### Método 3: Docker Compose Local

Para testar localmente antes do deploy:

```bash
# 1. Criar arquivo .env
cp .env.example .env

# 2. Editar .env com suas credenciais
nano .env

# 3. Build e iniciar
docker-compose up --build

# 4. Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 📊 Monitoramento

### Logs

**Ver logs no Coolify:**
1. Acesse seu projeto
2. Clique em "Logs"
3. Selecione o container

**Ver logs via CLI:**
```bash
# Logs do container
docker logs -f container_name

# Logs do backend
docker exec container_name tail -f /tmp/backend.log

# Logs do frontend
docker exec container_name tail -f /tmp/frontend.log
```

### Health Check

**Verificar saúde da aplicação:**
```bash
# Frontend
curl http://seu-dominio.com

# Backend
curl http://seu-dominio.com:3001/api/health

# Ou se estiver usando proxy reverso
curl http://seu-dominio.com/api/health
```

### Métricas

O Coolify fornece métricas automáticas:
- CPU Usage
- Memory Usage
- Network I/O
- Disk Usage

## 🔧 Troubleshooting

### Problema: Container não inicia

**Solução:**
```bash
# 1. Verificar logs
docker logs container_name

# 2. Verificar variáveis de ambiente
docker exec container_name env | grep VITE

# 3. Verificar se MongoDB está acessível
docker exec container_name ping -c 3 10.0.0.8
```

### Problema: Backend não conecta ao MongoDB

**Solução:**
```bash
# 1. Verificar connection string
docker exec container_name echo $VITE_MONGODB_CONNECTION_STRING

# 2. Testar conexão
docker exec container_name node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.VITE_MONGODB_CONNECTION_STRING);
client.connect().then(() => {
  console.log('✅ Conectado!');
  client.close();
}).catch(err => {
  console.error('❌ Erro:', err.message);
});
"
```

### Problema: Frontend não carrega

**Solução:**
```bash
# 1. Verificar se build foi criado
docker exec container_name ls -la /app/dist

# 2. Verificar se serve está rodando
docker exec container_name ps aux | grep serve

# 3. Testar porta
docker exec container_name wget -O- http://localhost:3000
```

### Problema: API retorna 502

**Solução:**
```bash
# 1. Verificar se backend está rodando
docker exec container_name ps aux | grep tsx

# 2. Verificar porta do backend
docker exec container_name netstat -tlnp | grep 3001

# 3. Testar endpoint
docker exec container_name wget -O- http://localhost:3001/api/health
```

## 🔄 Atualizações

### Deploy de Nova Versão

**Automático (Git):**
```bash
git add .
git commit -m "Nova versão"
git push origin main
# Coolify faz deploy automaticamente
```

**Manual:**
1. Acesse Coolify Dashboard
2. Clique em "Redeploy"
3. Aguarde o processo

### Rollback

**No Coolify:**
1. Acesse "Deployments"
2. Selecione versão anterior
3. Clique em "Redeploy"

**Via Docker:**
```bash
# Listar imagens
docker images

# Usar imagem anterior
docker run -d --name app imagem:tag-anterior
```

## 📈 Otimizações

### 1. Cache de Build

Adicione no Dockerfile:
```dockerfile
# Cache de dependências
COPY package*.json ./
RUN npm ci --only=production
```

### 2. Multi-stage Build

Já implementado no `Dockerfile.fullstack` para reduzir tamanho da imagem.

### 3. Compressão

O serve já usa compressão gzip automaticamente.

### 4. CDN

Configure CDN no Coolify para assets estáticos:
```
CDN: Cloudflare
Assets Path: /assets/*
```

## 🔒 Segurança

### 1. Variáveis Sensíveis

Nunca commite:
- `.env`
- Tokens
- Senhas
- Connection strings

Use o gerenciador de secrets do Coolify.

### 2. HTTPS

Sempre use SSL/TLS:
```
SSL: Enabled
Certificate: Let's Encrypt (auto-renew)
```

### 3. Firewall

Configure regras no Coolify:
```
Allow: 80, 443 (HTTP/HTTPS)
Deny: 3000, 3001 (acesso direto)
```

### 4. Rate Limiting

Configure no Nginx (proxy reverso do Coolify):
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

## 📚 Recursos

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 🆘 Suporte

**Problemas com deploy:**
1. Verifique logs no Coolify
2. Teste localmente com Docker Compose
3. Verifique variáveis de ambiente
4. Consulte documentação do Coolify

**Problemas com aplicação:**
1. Verifique logs do backend (`/tmp/backend.log`)
2. Verifique logs do frontend (`/tmp/frontend.log`)
3. Teste endpoints individualmente
4. Verifique conectividade com MongoDB

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB acessível
- [ ] SQL Server acessível (opcional)
- [ ] Domínio configurado
- [ ] SSL habilitado
- [ ] Health check configurado
- [ ] Logs funcionando
- [ ] Backup configurado
- [ ] Monitoramento ativo

---

**Pronto para deploy! 🚀**
