# ✅ Porta Alterada para 3000 (Padrão Coolify)

## Mudança Realizada

Todas as referências à porta **3000** foram alteradas para **3000** (porta padrão do Coolify).

## Arquivos Modificados

### Código
- ✅ `src/server/index.ts` - Porta padrão: 3000
- ✅ `Dockerfile.fullstack` - EXPOSE 3000
- ✅ `Dockerfile.fullstack.optimized` - EXPOSE 3000
- ✅ `start-fullstack.sh` - Porta padrão: 3000
- ✅ `start-fullstack-simple.sh` - Porta padrão: 3000
- ✅ `package.json` - Scripts Docker com porta 3000

### Documentação
- ✅ `docs/deployment/README.md`
- ✅ `docs/deployment/QUICKSTART_FULLSTACK.md`
- ✅ `docs/deployment/FULLSTACK_DEPLOY.md`
- ✅ `DEPLOY_FULLSTACK_SUMMARY.md`

## Configuração no Coolify

### Porta
```
Container Port: 3000
Public Port: 80 (ou 443 com SSL)
```

### Variáveis de Ambiente
```bash
BACKOFFICE_PORT=3000  # Porta do servidor
SERVE_FRONTEND=true   # Backend serve frontend
NODE_ENV=production
```

## Health Check

```bash
# Coolify usará automaticamente
http://localhost:3000/api/health
```

## Testando Localmente

### Docker
```bash
# Build
docker build -f Dockerfile.fullstack.optimized -t nf-dashboard:fullstack .

# Run
docker run -p 3000:3000 --env-file .env nf-dashboard:fullstack

# Acessar
open http://localhost:3000
```

### Sem Docker
```bash
# Build frontend
npm run build:prod

# Rodar fullstack
npm run fullstack

# Acessar
open http://localhost:3000
```

## URLs de Acesso

### Produção (Coolify)
```
Frontend: https://seu-dominio.com
Backend API: https://seu-dominio.com/api
Health Check: https://seu-dominio.com/api/health
Debug Env: https://seu-dominio.com/api/debug/env
```

### Local
```
Frontend: http://localhost:3000
Backend API: http://localhost:3000/api
Health Check: http://localhost:3000/api/health
Debug Env: http://localhost:3000/api/debug/env
```

## Compatibilidade

✅ **Coolify**: Porta padrão 3000
✅ **Docker**: Funciona normalmente
✅ **Local**: Funciona normalmente
✅ **Health Check**: Atualizado para porta 3000

## Próximos Passos

1. ✅ Porta alterada para 3000
2. ✅ Documentação atualizada
3. ⬜ Fazer commit das alterações
4. ⬜ Push para repositório
5. ⬜ Deploy no Coolify
6. ⬜ Verificar health check na porta 3000

## Nota

A porta 3000 é a porta padrão do Coolify, facilitando a configuração e evitando conflitos.
