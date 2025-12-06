# Quickstart - Deploy Fullstack

## TL;DR

Frontend e backend juntos, uma porta só (3000).

## No Coolify

### 1. Criar Serviço
- Tipo: Docker
- Repositório: seu-repo-git

### 2. Dockerfile
```
Dockerfile.fullstack.optimized
```

### 3. Build Arguments (copie e cole)
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

### 4. Environment Variables (Runtime)
```bash
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/db
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=nfe
NODE_ENV=production
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
```

### 5. Port
```
Container: 3000
Public: 80 (ou 443)
```

### 6. Deploy
Clique em "Deploy" e aguarde.

## Verificar

### Health Check
```bash
curl https://seu-dominio.com/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "mongodb": { "state": "connected" }
}
```

### Debug Env
```bash
curl https://seu-dominio.com/api/debug/env
```

### Frontend
Abra no navegador:
```
https://seu-dominio.com
```

## Troubleshooting Rápido

### Página em branco
```bash
# Verificar se dist/ existe
docker exec -it <container> ls -la dist/

# Verificar SERVE_FRONTEND
docker exec -it <container> env | grep SERVE_FRONTEND
```

### API não responde
```bash
# Testar health
curl https://seu-dominio.com/api/health

# Ver logs
docker logs <container>
```

### MongoDB não conecta
```bash
# Verificar variáveis
curl https://seu-dominio.com/api/debug/env

# Ver logs de conexão
docker logs <container> | grep MongoDB
```

## Diferenças do Deploy Separado

| Aspecto | Fullstack | Separado |
|---------|-----------|----------|
| Portas | 1 (3000) | 2 (3000 + 3000) |
| CORS | Não precisa | Precisa configurar |
| Complexidade | Baixa | Média |
| Recursos | Menos | Mais |

## Próximos Passos

1. ✅ Deploy funcionando
2. Configure domínio personalizado
3. Configure SSL/HTTPS
4. Configure backup do MongoDB
5. Configure monitoramento

## Ajuda

Documentação completa: [FULLSTACK_DEPLOY.md](./FULLSTACK_DEPLOY.md)
