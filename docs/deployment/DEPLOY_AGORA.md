# 🚀 Deploy Agora - Passo a Passo

## Situação Atual

✅ Código corrigido localmente
❌ Coolify rodando versão antiga (API retorna HTML)

## Solução em 5 Passos

### 1️⃣ Commit e Push

```bash
git add .
git commit -m "fix: ordem correta das rotas - API antes de static"
git push origin main
```

### 2️⃣ Abrir Coolify

1. Acesse https://coolify.io (ou seu Coolify)
2. Faça login
3. Vá para o serviço **nf-dashboard-homologacao**

### 3️⃣ Verificar Variáveis

**Environment Variables** (Runtime):

```bash
SERVE_FRONTEND=true
BACKOFFICE_PORT=3000
NODE_ENV=production
VITE_MONGODB_CONNECTION_STRING=mongodb://...
```

**Build Arguments** (Build Time):

```bash
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
VITE_MONGODB_PROXY_PORT=
```

⚠️ **IMPORTANTE**: `VITE_MONGODB_PROXY_PORT` deve estar **VAZIO**

### 4️⃣ Deploy

1. Clique em **"Deploy"** ou **"Redeploy"**
2. Aguarde build completar (5-10 minutos)
3. Verifique logs

**Logs esperados:**
```
[MONGODB] ✅ MongoDB conectado com sucesso!
✅ Backoffice Server rodando!
```

### 5️⃣ Testar

```bash
# Deve retornar JSON
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health
```

Se retornar JSON: ✅ **Funcionou!**
Se retornar HTML: ❌ **Ainda não deployou**

## Verificação Rápida

### ✅ Funcionando

```bash
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health
```

Retorna:
```json
{
  "status": "ok",
  "mongodb": {...}
}
```

### ❌ Ainda não funcionando

Retorna:
```html
<!DOCTYPE html>
<html>...
```

**Solução**: Aguardar deploy completar ou fazer redeploy.

## Troubleshooting Rápido

### Deploy não inicia

- Verificar se commit foi para branch correto
- Verificar se Coolify está configurado para auto-deploy
- Fazer deploy manual

### Build falha

- Ver logs do build no Coolify
- Verificar erros TypeScript
- Testar localmente: `npm run build:prod`

### API ainda retorna HTML

- Aguardar cache limpar (pode levar alguns minutos)
- Fazer **Force Redeploy**
- Verificar se `SERVE_FRONTEND=true`

## Variáveis Críticas

### ✅ Correto

```bash
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
VITE_MONGODB_PROXY_PORT=          ← VAZIO!
SERVE_FRONTEND=true
```

### ❌ Errado

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_MONGODB_PROXY_PORT=3001      ← NÃO!
SERVE_FRONTEND=false              ← NÃO!
```

## Tempo Estimado

- Commit e push: 1 minuto
- Build no Coolify: 5-10 minutos
- Teste: 1 minuto

**Total**: ~10 minutos

## Após Deploy

1. ✅ Testar `/api/health`
2. ✅ Testar `/api/documents`
3. ✅ Abrir frontend no navegador
4. ✅ Verificar se grid carrega dados

## Comandos de Teste

```bash
# Health check
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health

# Documents
curl "https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents?collection=tbl_nfe_100&page=1&size=10&dtIni=2024-01-01&dtFim=2024-12-31"

# Frontend (deve retornar HTML)
curl https://nf-dashboard-homologacao.sistemasflow.com.br/
```

## Resumo

1. ✅ Commit e push
2. ✅ Verificar variáveis no Coolify
3. ✅ Deploy
4. ✅ Aguardar build
5. ✅ Testar API

**Problema será resolvido após deploy!**

---

**Checklist completo**: [CHECKLIST_DEPLOY_COOLIFY.md](CHECKLIST_DEPLOY_COOLIFY.md)
