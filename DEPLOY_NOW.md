# 🚀 Deploy AGORA - Guia Rápido

## ✅ Correções Aplicadas

Todos os erros de build foram corrigidos:
- ✅ Tipos TypeScript atualizados
- ✅ Build de produção configurado
- ✅ Dockerfile otimizado
- ✅ Arquivos de teste excluídos

---

## 🎯 3 Passos para Deploy

### 1️⃣ Commit e Push (1 minuto)

```bash
git add .
git commit -m "fix: corrigir build TypeScript para Coolify"
git push origin main
```

### 2️⃣ Configurar Coolify (2 minutos)

**No Coolify Dashboard:**

1. Vá para seu projeto
2. Environment Variables → Adicione:

```bash
# ESSENCIAIS (copie e cole)
NODE_ENV=production
PORT=3000
BACKOFFICE_PORT=3001
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&authSource=admin&directConnection=true
VITE_API_BASE_URL=https://apinfe.revio.digital
VITE_API_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ...
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
VITE_DEFAULT_PAGE_SIZE=10000
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=60
VITE_DEFAULT_DATE_RANGE_DAYS=30
```

3. Build Configuration:
   - Build Pack: **Dockerfile**
   - Dockerfile: **Dockerfile.fullstack**

### 3️⃣ Deploy (5 minutos)

Clique em **"Deploy"** e aguarde.

---

## ✅ Verificação

### Build deve mostrar:

```
✅ Step 1/10: FROM node:20-alpine
✅ Step 2/10: WORKDIR /app
✅ Step 3/10: COPY package*.json
✅ Step 4/10: RUN npm ci
✅ Step 5/10: COPY . .
✅ Step 6/10: RUN npm run build:prod
✅ Build completed successfully!
```

### Após deploy:

```bash
# Testar frontend
curl https://seu-dominio.com

# Testar backend
curl https://seu-dominio.com/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2025-12-04T..."
}
```

---

## 🆘 Se Falhar

### Erro: "Property does not exist"
→ Variáveis não configuradas no Coolify
→ Adicione TODAS as variáveis acima

### Erro: "Module not found"
→ Build cache corrompido
→ Coolify → Settings → Clear Build Cache → Redeploy

### Erro: "Connection refused"
→ MongoDB não acessível
→ Verifique firewall/rede

---

## 📋 Checklist Final

Antes de clicar em Deploy:

- [ ] Código commitado e pushed
- [ ] Variáveis configuradas no Coolify
- [ ] Dockerfile selecionado: `Dockerfile.fullstack`
- [ ] Build Pack: Dockerfile
- [ ] Portas: 3000 (frontend), 3001 (backend)

---

## 🎉 Pronto!

**Clique em Deploy e aguarde ~5 minutos.**

Sua aplicação estará no ar em:
- Frontend: `https://seu-dominio.com`
- Backend: `https://seu-dominio.com/api/health`

---

## 📚 Documentação Completa

- [DEPLOY_FIX_SUMMARY.md](DEPLOY_FIX_SUMMARY.md) - Detalhes das correções
- [DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md) - Guia completo
- [TROUBLESHOOTING_BUILD.md](TROUBLESHOOTING_BUILD.md) - Solução de problemas

---

**Boa sorte! 🚀**
