# ✅ Alterações Finais - Deploy Fullstack Porta 3000

## Resumo

Configurado deploy fullstack com frontend e backend juntos na **porta 3000** (padrão Coolify).

## Mudanças Realizadas

### 1. Porta Alterada: 3000 → 3000
- ✅ Código do servidor
- ✅ Dockerfiles
- ✅ Scripts de inicialização
- ✅ Documentação completa
- ✅ Health checks

### 2. Arquitetura Fullstack
```
┌─────────────────────────────────┐
│   Container (Porta 3000)        │
│                                 │
│   Express Server                │
│   ├── /api/* → Backend API      │
│   └── /* → Frontend (dist/)     │
└─────────────────────────────────┘
```

### 3. Validação de API
- ✅ Verificação de `response.success`
- ✅ Validação de `pagination`
- ✅ Interceptor de erros HTTP
- ✅ Logs detalhados

### 4. Correções TypeScript
- ✅ 20 erros corrigidos
- ✅ Build de produção funcionando
- ✅ Tipos validados

## Arquivos Principais

### Para Deploy no Coolify
```
Dockerfile.fullstack.optimized  ← Use este
```

### Configuração
```bash
# Build Arguments
VITE_API_BASE_URL=https://seu-dominio.com
VITE_MONGODB_CONNECTION_STRING=mongodb://...
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=nfe
VITE_MONGODB_PROXY_PORT=

# Environment Variables (Runtime)
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
NODE_ENV=production
```

### Porta
```
Container: 3000
Public: 80 (ou 443)
```

## Como Usar

### No Coolify

1. **Criar serviço Docker**
2. **Dockerfile**: `Dockerfile.fullstack.optimized`
3. **Adicionar Build Arguments** (ver acima)
4. **Adicionar Environment Variables** (ver acima)
5. **Configurar porta**: Container 3000 → Public 80
6. **Deploy**

### Localmente

```bash
# Build
npm run build:prod

# Rodar fullstack
npm run fullstack

# Acessar
open http://localhost:3000
```

### Docker Local

```bash
# Build
docker build -f Dockerfile.fullstack.optimized -t nf-dashboard:fullstack .

# Run
docker run -p 3000:3000 --env-file .env nf-dashboard:fullstack

# Acessar
open http://localhost:3000
```

## Verificação

### Health Check
```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "mongodb": {
    "state": "connected"
  }
}
```

### Debug
```bash
curl http://localhost:3000/api/debug/env
```

### Frontend
```
http://localhost:3000
```

## Vantagens

✅ **Porta padrão Coolify** (3000)
✅ **Uma porta apenas** (sem CORS)
✅ **Deploy simplificado**
✅ **Menos recursos**
✅ **Logs centralizados**
✅ **Build otimizado**
✅ **Validação robusta**
✅ **TypeScript sem erros**

## Documentação

- [Quickstart](docs/deployment/QUICKSTART_FULLSTACK.md)
- [Deploy Completo](docs/deployment/FULLSTACK_DEPLOY.md)
- [Índice](docs/deployment/README.md)
- [Resumo Fullstack](DEPLOY_FULLSTACK_SUMMARY.md)
- [Mudança de Porta](PORTA_3000_ALTERADA.md)

## Scripts NPM

```bash
npm run dev              # Frontend dev (Vite)
npm run backend          # Backend apenas
npm run fullstack        # Frontend + Backend (porta 3000)
npm run build:prod       # Build de produção
npm run docker:build:optimized    # Build Docker
npm run docker:run:fullstack      # Run Docker
```

## Checklist Final

- ✅ Porta alterada para 3000
- ✅ Dockerfiles atualizados
- ✅ Scripts atualizados
- ✅ Documentação atualizada
- ✅ Build funcionando
- ✅ TypeScript sem erros
- ✅ Validação de API implementada
- ✅ Logs detalhados
- ⬜ Commit das alterações
- ⬜ Push para repositório
- ⬜ Deploy no Coolify
- ⬜ Verificar em produção

## Próximos Passos

1. Fazer commit:
   ```bash
   git add .
   git commit -m "feat: deploy fullstack na porta 3000 com validação de API"
   ```

2. Push:
   ```bash
   git push origin main
   ```

3. Deploy no Coolify:
   - Usar `Dockerfile.fullstack.optimized`
   - Configurar variáveis de ambiente
   - Porta 3000

4. Verificar:
   - Health check
   - Frontend carregando
   - API respondendo
   - MongoDB conectado

## Suporte

Em caso de problemas:

1. Verificar logs: `docker logs <container>`
2. Testar health: `curl http://localhost:3000/api/health`
3. Verificar env: `curl http://localhost:3000/api/debug/env`
4. Consultar documentação em `docs/deployment/`

---

**Status**: ✅ Pronto para deploy no Coolify!
