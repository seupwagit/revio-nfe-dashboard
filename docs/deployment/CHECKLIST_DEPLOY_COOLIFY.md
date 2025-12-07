# ✅ Checklist de Deploy no Coolify

## Problema Atual

API retorna HTML em vez de JSON porque o Coolify está rodando código antigo.

## Solução: Deploy da Versão Corrigida

### 1. Verificar Código Local

```bash
# Verificar se ordem está correta em src/server/index.ts
# Deve ser:
# 1. Rotas da API (/api/*)
# 2. express.static (dist/)
# 3. SPA fallback (*)
```

✅ Código já está correto localmente.

### 2. Fazer Commit

```bash
git add .
git commit -m "fix: ordem correta das rotas - API antes de static files"
git push origin main
```

### 3. Configurar Variáveis no Coolify

#### Build Arguments (Build Time)

```bash
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
VITE_MONGODB_PROXY_PORT=
VITE_DB_HOST=seu-mongodb-host
VITE_DB_DATABASE=seu-database
VITE_DB_COLLECTION=tbl_nfe_100
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/db
```

**IMPORTANTE**: `VITE_MONGODB_PROXY_PORT` deve estar **VAZIO** (sem valor).

#### Environment Variables (Runtime)

```bash
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/db
VITE_DB_HOST=seu-mongodb-host
VITE_DB_DATABASE=seu-database
SERVE_FRONTEND=true
BACKOFFICE_PORT=3000
NODE_ENV=production
```

### 4. Configurar Dockerfile

```
Dockerfile: Dockerfile.fullstack.optimized
```

### 5. Configurar Porta

```
Container Port: 3000
Public Port: 80 (ou 443 com SSL)
```

### 6. Fazer Deploy

1. Acesse Coolify
2. Vá para seu serviço
3. Clique em **"Deploy"** ou **"Redeploy"**
4. Aguarde build completar

### 7. Verificar Logs

Durante o deploy, verifique logs:

```
[MONGODB] 📊 Conectando ao MongoDB...
[MONGODB] ✅ MongoDB conectado com sucesso!
✅ Backoffice Server rodando!
```

### 8. Testar API

```bash
# Deve retornar JSON
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health

# Resposta esperada:
{
  "status": "ok",
  "mongodb": {
    "state": "connected"
  }
}
```

**NÃO deve retornar HTML!**

### 9. Testar Documentos

```bash
curl "https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents?collection=tbl_nfe_100&page=1&size=10&dtIni=2024-01-01&dtFim=2024-12-31"
```

Deve retornar JSON com array de documentos.

### 10. Testar Frontend

Abra no navegador:
```
https://nf-dashboard-homologacao.sistemasflow.com.br
```

Deve carregar o frontend (React).

## Checklist Completo

- [ ] Código local está correto (ordem das rotas)
- [ ] Commit feito
- [ ] Push para repositório
- [ ] Variáveis de ambiente configuradas no Coolify
- [ ] `VITE_MONGODB_PROXY_PORT` está VAZIO
- [ ] `SERVE_FRONTEND=true` configurado
- [ ] Dockerfile correto (`Dockerfile.fullstack.optimized`)
- [ ] Porta 3000 configurada
- [ ] Deploy iniciado no Coolify
- [ ] Logs mostram MongoDB conectado
- [ ] Logs mostram "Backoffice Server rodando"
- [ ] `/api/health` retorna JSON (não HTML)
- [ ] `/api/documents` retorna JSON (não HTML)
- [ ] Frontend carrega no navegador
- [ ] Grid carrega dados

## Troubleshooting

### API ainda retorna HTML após deploy

**Causa**: Cache do Coolify ou build não completou.

**Solução**:
1. Limpar cache do Coolify (se houver opção)
2. Fazer **Force Redeploy**
3. Verificar logs do build
4. Verificar se commit foi para branch correto

### Build falha

**Causa**: Erro TypeScript ou dependências.

**Solução**:
1. Ver logs do build no Coolify
2. Testar build localmente: `npm run build:prod`
3. Corrigir erros
4. Commit e push novamente

### MongoDB não conecta

**Causa**: Variáveis de ambiente incorretas.

**Solução**:
1. Verificar `VITE_MONGODB_CONNECTION_STRING`
2. Testar conexão do container ao MongoDB
3. Verificar firewall/rede
4. Ver logs: buscar por `[MONGODB]`

### Frontend não carrega

**Causa**: `SERVE_FRONTEND` não está true.

**Solução**:
1. Adicionar `SERVE_FRONTEND=true` nas variáveis de ambiente
2. Redeploy

## Ordem Correta no Código

```typescript
// src/server/index.ts

// 1. Middlewares básicos
app.use(cors())
app.use(express.json())

// 2. Rotas da API (PRIMEIRO)
app.get('/api/debug/env', ...)
app.use('/api/health', healthRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/documents', documentsRoutes)

// 3. Arquivos estáticos (DEPOIS)
if (process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(distPath))
}

// 4. SPA fallback (POR ÚLTIMO)
if (process.env.SERVE_FRONTEND === 'true') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}
```

## Verificação Final

Após deploy bem-sucedido:

```bash
# 1. Health check
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health
# ✅ Deve retornar JSON

# 2. Documents
curl "https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents?collection=tbl_nfe_100&page=1&size=10&dtIni=2024-01-01&dtFim=2024-12-31"
# ✅ Deve retornar JSON com array

# 3. Frontend
curl https://nf-dashboard-homologacao.sistemasflow.com.br/
# ✅ Deve retornar HTML (index.html)

# 4. Rota inexistente
curl https://nf-dashboard-homologacao.sistemasflow.com.br/qualquer-coisa
# ✅ Deve retornar HTML (SPA fallback)
```

## Resumo

**Problema**: API retorna HTML
**Causa**: Código antigo no Coolify
**Solução**: Deploy da versão corrigida
**Tempo estimado**: 5-10 minutos

## Próximos Passos

1. ✅ Código já está correto
2. ⬜ Fazer commit e push
3. ⬜ Configurar variáveis no Coolify
4. ⬜ Deploy no Coolify
5. ⬜ Testar API
6. ⬜ Verificar frontend

---

**Importante**: Não esqueça de deixar `VITE_MONGODB_PROXY_PORT` **VAZIO**!
