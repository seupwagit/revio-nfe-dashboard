# 🚀 Deploy - Guia Rápido

## 📦 Opções de Deploy

### 1. Coolify (Recomendado)
Deploy automático com CI/CD integrado.

**Leia:** [DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md)

**Quick Start:**
```bash
# 1. Configure variáveis no Coolify
# 2. Conecte repositório Git
# 3. Selecione Dockerfile.fullstack
# 4. Deploy!
```

### 2. Docker Compose (Local/VPS)
Para deploy em servidor próprio.

**Quick Start:**
```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/nf-dashboard.git
cd nf-dashboard

# 2. Configure variáveis
cp .env.example .env
nano .env

# 3. Build e iniciar
docker-compose up -d

# 4. Verificar
docker-compose logs -f
```

### 3. Docker Manual
Para máximo controle.

**Quick Start:**
```bash
# 1. Build
npm run docker:build

# 2. Run
npm run docker:run

# 3. Verificar
docker ps
docker logs container_name
```

## 🔧 Configuração Mínima

### Variáveis Essenciais

```bash
# MongoDB (OBRIGATÓRIO)
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/...

# API (OBRIGATÓRIO)
VITE_API_BASE_URL=https://apinfe.revio.digital
VITE_API_BEARER_TOKEN=seu_token

# Database (OBRIGATÓRIO)
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
```

## 🎯 Arquivos de Deploy

| Arquivo | Descrição | Uso |
|---------|-----------|-----|
| `Dockerfile.fullstack` | Build Frontend + Backend | Coolify, Docker |
| `docker-compose.yml` | Orquestração completa | Docker Compose |
| `start-fullstack.sh` | Script de inicialização | Container |
| `nginx.conf` | Proxy reverso (opcional) | Nginx |

## 🚀 Deploy Rápido

### Coolify (1 minuto)
```bash
1. Acesse Coolify
2. New Resource → Application
3. Git Repository → seu-repo
4. Dockerfile → Dockerfile.fullstack
5. Environment Variables → adicione variáveis
6. Deploy!
```

### Docker Compose (2 minutos)
```bash
# Terminal
git clone repo
cd repo
cp .env.example .env
nano .env  # Configure variáveis
docker-compose up -d
```

### Docker Manual (3 minutos)
```bash
# Terminal
git clone repo
cd repo
npm run docker:build
npm run docker:run
```

## 📊 Verificação

### Health Check
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:3000/api/health

# Resposta esperada:
# {"status":"ok","mongodb":"connected","timestamp":"..."}
```

### Logs
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f container_name

# Dentro do container
docker exec container_name tail -f /tmp/backend.log
docker exec container_name tail -f /tmp/frontend.log
```

## 🔍 Troubleshooting

### Container não inicia
```bash
# Ver logs
docker logs container_name

# Verificar variáveis
docker exec container_name env | grep VITE
```

### Backend não conecta
```bash
# Testar MongoDB
docker exec container_name ping 10.0.0.8

# Verificar connection string
docker exec container_name echo $VITE_MONGODB_CONNECTION_STRING
```

### Frontend não carrega
```bash
# Verificar build
docker exec container_name ls -la /app/dist

# Verificar processo
docker exec container_name ps aux | grep serve
```

## 📚 Documentação Completa

- **[DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md)** - Guia completo Coolify
- **[DEBUG_FULLSTACK.md](docs/DEBUG_FULLSTACK.md)** - Debug em produção
- **[README.md](README.md)** - Documentação geral

## 🆘 Suporte

**Problemas comuns:**
1. Variáveis de ambiente não configuradas → Verifique `.env`
2. MongoDB inacessível → Verifique rede/firewall
3. Build falha → Verifique logs do Docker

**Precisa de ajuda?**
- Consulte [DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md)
- Verifique logs do container
- Teste localmente primeiro

---

## ✅ Checklist

Antes de fazer deploy:

- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB acessível
- [ ] Build local funciona (`npm run build`)
- [ ] Docker build funciona (`npm run docker:build`)
- [ ] Testes passam (`npm test`)
- [ ] Documentação atualizada

---

**Pronto para deploy! 🚀**

**Próximos passos:**
1. Escolha método de deploy (Coolify recomendado)
2. Configure variáveis de ambiente
3. Faça deploy
4. Verifique health check
5. Monitore logs
