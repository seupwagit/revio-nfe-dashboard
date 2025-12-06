# Deploy Fullstack - Frontend + Backend Juntos

## Visão Geral

Este guia explica como fazer deploy do frontend e backend juntos no mesmo container, usando uma única porta.

### Arquitetura

```
┌─────────────────────────────────────────┐
│         Container (Porta 3000)          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Express Server (Node.js)        │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  API Routes (/api/*)        │  │  │
│  │  │  - /api/health              │  │  │
│  │  │  - /api/documents           │  │  │
│  │  │  - /api/analytics           │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Static Files (dist/)       │  │  │
│  │  │  - index.html               │  │  │
│  │  │  - assets/                  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Vantagens

✅ **Simplicidade**: Apenas uma porta para configurar no Coolify
✅ **Sem CORS**: Frontend e backend na mesma origem
✅ **Menos recursos**: Um container em vez de dois
✅ **Deploy mais rápido**: Build único
✅ **Logs centralizados**: Tudo no mesmo lugar

## Arquivos Necessários

### 1. Dockerfile.fullstack.optimized
Dockerfile otimizado que:
- Faz build do frontend com Vite
- Copia arquivos estáticos para o backend
- Configura backend para servir frontend

### 2. src/server/index.ts
Backend configurado para:
- Servir arquivos estáticos do `dist/`
- Responder rotas de API em `/api/*`
- SPA fallback para rotas do React Router

## Configuração no Coolify

### Passo 1: Criar Serviço

1. Acesse Coolify
2. Crie novo serviço do tipo "Docker"
3. Configure o repositório Git

### Passo 2: Configurar Build

**Dockerfile Path:**
```
Dockerfile.fullstack.optimized
```

**Build Arguments (ARGs):**
Adicione todas as variáveis VITE_* como build arguments:

```bash
VITE_API_BASE_URL=https://seu-dominio.com
VITE_MONGODB_CONNECTION_STRING=mongodb://...
VITE_DB_HOST=seu-mongodb-host
VITE_DB_DATABASE=seu-database
VITE_MONGODB_PROXY_PORT=
# ... outras variáveis
```

### Passo 3: Variáveis de Ambiente (Runtime)

Adicione as variáveis que o backend precisa em runtime:

```bash
# MongoDB
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/database
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=database-name

# Servidor
NODE_ENV=production
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
```

### Passo 4: Configurar Porta

**Port Mapping:**
```
Container Port: 3000
Public Port: 80 (ou 443 com SSL)
```

### Passo 5: Health Check

O Coolify usará o health check definido no Dockerfile:
```
http://localhost:3000/api/health
```

## Variáveis de Ambiente

### Build Time (ARGs)

Estas variáveis são necessárias durante o build do Vite:

```bash
# API
VITE_API_BASE_URL=https://seu-dominio.com
VITE_API_BEARER_TOKEN=seu-token
VITE_MONGODB_PROXY_PORT=

# MongoDB
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=database-name
VITE_DB_COLLECTION=collection-name
VITE_MONGODB_CONNECTION_STRING=mongodb://...

# Configurações
VITE_DEFAULT_PAGE_SIZE=100
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=365
VITE_DEFAULT_DATE_RANGE_DAYS=30
VITE_CACHE_DURATION_MINUTES=5
VITE_QUERY_TIMEOUT_MS=30000
VITE_ANALYTICS_PAGE_SIZE=1000

# Integrações (opcionais)
VITE_API_GOOGLE_GEMINI=
VITE_PUBLIC_BUILDER_KEY=
VITE_S3_ENDPOINT=
VITE_S3_ACCESS_KEY=
VITE_S3_SECRET_KEY=
VITE_S3_BUCKET=
VITE_S3_REGION=
```

### Runtime (ENVs)

Estas variáveis são usadas pelo backend em produção:

```bash
# MongoDB (obrigatório)
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/database
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=database-name

# Servidor
NODE_ENV=production
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
```

## Como Funciona

### 1. Build do Frontend

Durante o build do Docker:
```bash
npm run build:prod
# Gera arquivos em dist/
# - dist/index.html
# - dist/assets/*.js
# - dist/assets/*.css
```

### 2. Backend Serve Frontend

O Express está configurado para:

```typescript
// Servir arquivos estáticos
app.use(express.static('dist'))

// Rotas de API
app.use('/api/health', healthRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/analytics', analyticsRoutes)

// SPA fallback (deve vir por último)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'))
})
```

### 3. Roteamento

**Requisições de API:**
```
GET /api/health → Backend responde com JSON
GET /api/documents → Backend consulta MongoDB
POST /api/analytics → Backend faz agregação
```

**Requisições de Frontend:**
```
GET / → Backend retorna dist/index.html
GET /dashboard → Backend retorna dist/index.html (React Router)
GET /assets/index.js → Backend retorna arquivo estático
```

## Testando Localmente

### Opção 1: Docker

```bash
# Build
docker build -f Dockerfile.fullstack.optimized -t nf-dashboard:fullstack .

# Run
docker run -p 3000:3000 \
  -e VITE_MONGODB_CONNECTION_STRING="mongodb://..." \
  -e VITE_DB_HOST="localhost" \
  -e VITE_DB_DATABASE="nfe" \
  nf-dashboard:fullstack

# Acessar
open http://localhost:3000
```

### Opção 2: Local (sem Docker)

```bash
# 1. Build do frontend
npm run build:prod

# 2. Iniciar backend com frontend
SERVE_FRONTEND=true npm run server

# Acessar
open http://localhost:3000
```

## Troubleshooting

### Frontend não carrega

**Problema:** Página em branco ou 404

**Solução:**
1. Verificar se `dist/` foi copiado para o container:
   ```bash
   docker exec -it <container> ls -la dist/
   ```

2. Verificar logs do backend:
   ```bash
   docker logs <container>
   ```

3. Verificar se `SERVE_FRONTEND=true` está definido

### API não responde

**Problema:** Erro 404 nas chamadas de API

**Solução:**
1. Verificar se rotas de API vêm ANTES do SPA fallback
2. Verificar logs do backend
3. Testar health check:
   ```bash
   curl http://localhost:3000/api/health
   ```

### MongoDB não conecta

**Problema:** Backend não consegue conectar ao MongoDB

**Solução:**
1. Verificar variáveis de ambiente:
   ```bash
   curl http://localhost:3000/api/debug/env
   ```

2. Verificar se MongoDB está acessível do container
3. Verificar connection string
4. Verificar logs de conexão

### Build falha

**Problema:** Docker build falha

**Solução:**
1. Verificar se todos os ARGs estão definidos no Coolify
2. Verificar logs do build
3. Testar build localmente:
   ```bash
   docker build -f Dockerfile.fullstack.optimized .
   ```

## Comparação: Fullstack vs Separado

### Fullstack (Recomendado)

**Vantagens:**
- ✅ Uma porta apenas
- ✅ Sem CORS
- ✅ Deploy mais simples
- ✅ Menos recursos

**Desvantagens:**
- ❌ Backend e frontend no mesmo processo
- ❌ Não pode escalar separadamente

### Separado

**Vantagens:**
- ✅ Escalabilidade independente
- ✅ Isolamento de processos

**Desvantagens:**
- ❌ Duas portas para configurar
- ❌ Problemas de CORS
- ❌ Mais complexo
- ❌ Mais recursos

## Próximos Passos

1. ✅ Configurar serviço no Coolify
2. ✅ Adicionar variáveis de ambiente
3. ✅ Fazer deploy
4. ✅ Verificar health check
5. ✅ Testar aplicação
6. ✅ Configurar domínio e SSL

## Referências

- [Dockerfile.fullstack.optimized](../../Dockerfile.fullstack.optimized)
- [src/server/index.ts](../../src/server/index.ts)
- [Guia de Deploy no Coolify](./COOLIFY_DEPLOY.md)
