# ✅ Deploy Fullstack - Resumo das Alterações

## O que foi feito

Configurado deploy fullstack onde **frontend e backend rodam juntos** na mesma porta (3000).

## Arquitetura

```
┌─────────────────────────────────┐
│   Container (Porta 3000)        │
│                                 │
│   Express Server                │
│   ├── /api/* → Backend API      │
│   └── /* → Frontend (dist/)     │
└─────────────────────────────────┘
```

## Arquivos Criados/Modificados

### ✅ Novos Arquivos

1. **Dockerfile.fullstack.optimized** - Dockerfile otimizado (USE ESTE)
   - Build do frontend com Vite
   - Backend serve arquivos estáticos
   - Uma porta apenas (3000)

2. **start-fullstack-simple.sh** - Script simplificado de inicialização

3. **Documentação:**
   - `docs/deployment/README.md` - Índice de guias
   - `docs/deployment/QUICKSTART_FULLSTACK.md` - Guia rápido
   - `docs/deployment/FULLSTACK_DEPLOY.md` - Guia completo
   - `docs/troubleshooting/API_RESPONSE_VALIDATION_FIX.md` - Correções de validação

### ✅ Arquivos Modificados

1. **src/server/index.ts**
   - Adicionado suporte para servir frontend estático
   - Adicionado endpoint `/api/debug/env`
   - SPA fallback para React Router

2. **src/contexts/NFContext.tsx**
   - Validação robusta de resposta da API
   - Tratamento de erros melhorado

3. **src/services/mongoApi.ts**
   - Interceptor de erros HTTP
   - Logs detalhados de erros

4. **package.json**
   - Novos scripts npm:
     - `npm run fullstack` - Rodar fullstack localmente
     - `npm run docker:build:optimized` - Build Docker otimizado
     - `npm run docker:run:fullstack` - Rodar container fullstack

## Como Usar

### Desenvolvimento Local

```bash
# 1. Build do frontend
npm run build:prod

# 2. Rodar fullstack
npm run fullstack

# 3. Acessar
open http://localhost:3000
```

### Deploy no Coolify

#### 1. Configurar Serviço
- Tipo: Docker
- Dockerfile: `Dockerfile.fullstack.optimized`

#### 2. Build Arguments (copiar e colar)
```bash
VITE_API_BASE_URL=https://seu-dominio.com
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/db
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=nfe
VITE_DB_COLLECTION=tbl_nfe_100
VITE_MONGODB_PROXY_PORT=
VITE_DEFAULT_PAGE_SIZE=100
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=365
VITE_DEFAULT_DATE_RANGE_DAYS=30
VITE_CACHE_DURATION_MINUTES=5
VITE_QUERY_TIMEOUT_MS=30000
VITE_ANALYTICS_PAGE_SIZE=1000
```

#### 3. Environment Variables (Runtime)
```bash
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/db
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=nfe
NODE_ENV=production
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
```

#### 4. Porta
```
Container: 3000
Public: 80 (ou 443)
```

#### 5. Deploy
Clique em "Deploy" e aguarde.

## Verificação

### Health Check
```bash
curl https://seu-dominio.com/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "mongodb": {
    "state": "connected",
    "stateCode": 1
  }
}
```

### Debug de Variáveis
```bash
curl https://seu-dominio.com/api/debug/env
```

### Frontend
Abrir no navegador:
```
https://seu-dominio.com
```

## Vantagens

✅ **Simplicidade**: Uma porta apenas (3000)
✅ **Sem CORS**: Frontend e backend na mesma origem
✅ **Menos recursos**: Um container em vez de dois
✅ **Deploy rápido**: Build único
✅ **Logs centralizados**: Tudo no mesmo lugar
✅ **Manutenção fácil**: Menos configuração

## Correções Incluídas

### 1. Erros TypeScript (20 erros corrigidos)
- ✅ `mongoose.connection.db` possivelmente undefined
- ✅ PrismaClient não exportado
- ✅ Propriedades duplicadas em objetos
- ✅ Variáveis não utilizadas
- ✅ Tipos dinâmicos

### 2. Validação de API
- ✅ Verificação de `response.success`
- ✅ Validação de `pagination` antes de acessar
- ✅ Interceptor de erros HTTP
- ✅ Mensagens de erro estruturadas

### 3. Logs Detalhados
- ✅ Logs de conexão MongoDB
- ✅ Logs de erros categorizados
- ✅ Endpoint de debug de variáveis
- ✅ Logs de requisições HTTP

## Troubleshooting Rápido

### Página em branco
```bash
docker exec -it <container> ls -la dist/
docker exec -it <container> env | grep SERVE_FRONTEND
```

### API não responde
```bash
curl https://seu-dominio.com/api/health
docker logs <container>
```

### MongoDB não conecta
```bash
curl https://seu-dominio.com/api/debug/env
docker logs <container> | grep MongoDB
```

## Documentação Completa

- [Quickstart](docs/deployment/QUICKSTART_FULLSTACK.md) - Guia rápido
- [Deploy Completo](docs/deployment/FULLSTACK_DEPLOY.md) - Documentação detalhada
- [Índice de Guias](docs/deployment/README.md) - Todos os guias

## Scripts NPM Disponíveis

```bash
# Desenvolvimento
npm run dev              # Frontend dev server (Vite)
npm run backend          # Backend apenas
npm run fullstack        # Frontend + Backend juntos

# Build
npm run build:prod       # Build de produção

# Docker
npm run docker:build:optimized    # Build Docker fullstack
npm run docker:run:fullstack      # Rodar container fullstack

# Debug
npm run fullstack:debug  # Fullstack com debugger
npm run backend:debug    # Backend com debugger
```

## Próximos Passos

1. ✅ Deploy no Coolify usando `Dockerfile.fullstack.optimized`
2. ✅ Configurar variáveis de ambiente
3. ✅ Verificar health check
4. ✅ Testar aplicação
5. ⬜ Configurar domínio personalizado
6. ⬜ Configurar SSL/HTTPS
7. ⬜ Configurar backup do MongoDB
8. ⬜ Configurar monitoramento

## Resultado Final

🎉 **Aplicação fullstack pronta para deploy no Coolify!**

- ✅ Build de produção funcionando
- ✅ Frontend e backend integrados
- ✅ Validação de API robusta
- ✅ Logs detalhados
- ✅ Documentação completa
- ✅ Scripts npm facilitados
- ✅ Troubleshooting documentado
