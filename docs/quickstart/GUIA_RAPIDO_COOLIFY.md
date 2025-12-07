# 🚀 Guia Rápido: Corrigir Problema no Coolify

**Problema:** Frontend conectando em `localhost:3000` ao invés da URL correta

---

## ⚡ Solução Rápida (5 minutos)

### 1️⃣ Commit e Push das Alterações

```bash
git add .
git commit -m "fix: adicionar variáveis VITE no Dockerfile para build correto"
git push origin main
```

### 2️⃣ Configurar Variáveis no Coolify

1. Acesse seu projeto no Coolify
2. Vá em **"Environment Variables"**
3. Adicione/verifique estas variáveis **OBRIGATÓRIAS:**

```bash
# URL da API (SEM /api no final!)
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br

# Token Bearer
VITE_API_BEARER_TOKEN=seu_token_completo_aqui

# MongoDB
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&authSource=admin&directConnection=true

# Porta do Backend
BACKOFFICE_PORT=3000
```

### 3️⃣ Limpar Cache Docker (Recomendado)

No Coolify:
1. Vá em **"Settings"** ou **"Configurações"**
2. Procure por **"Clear Build Cache"** ou **"Limpar Cache"**
3. Clique para limpar

### 4️⃣ Fazer Redeploy

1. Vá em **"Deployments"**
2. Clique em **"Redeploy"** ou **"Force Rebuild"**
3. Aguarde o build completar (5-10 minutos)

### 5️⃣ Verificar Logs do Build

Durante o build, procure por estas linhas nos logs:

```
Step X/Y : ARG VITE_API_BASE_URL
Step X/Y : ENV VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
```

Se aparecer, está correto! ✅

### 6️⃣ Testar a Aplicação

1. Acesse: `https://nf-dashboard-homologacao.sistemasflow.com.br`
2. Abra o Console do Navegador (F12)
3. Tente carregar dados
4. Verifique se as requisições vão para a URL correta:

```
✅ CORRETO:
GET https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents

❌ ERRADO:
GET http://localhost:3000/api/documents
```

---

## 🔍 Verificar Logs do MongoDB

Após o deploy, verifique os logs do backend no Coolify:

```
📊 Conectando ao MongoDB (Mongoose)...
   Timestamp: 2025-12-05T...
   URI: mongodb://***:***@10.0.0.8:27017
   Database: C67624577000145
   Host: 10.0.0.8
🔌 Tentando estabelecer conexão...
✅ MongoDB conectado com sucesso!
   Status: Conectado
   Tempo de conexão: 245ms
   Collections: 14 encontradas
```

Se aparecer isso, o backend está funcionando! ✅

---

## 🚨 Se Ainda Não Funcionar

### Verificar Variáveis de Ambiente

No Coolify, verifique se TODAS estas variáveis estão configuradas:

```bash
# Essenciais
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
VITE_API_BEARER_TOKEN=...
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_MONGODB_CONNECTION_STRING=mongodb://...
BACKOFFICE_PORT=3000
NODE_ENV=production
```

### Verificar URL da API

⚠️ **IMPORTANTE:** `VITE_API_BASE_URL` deve ser **SEM** `/api` no final!

- ✅ `https://nf-dashboard-homologacao.sistemasflow.com.br`
- ❌ `https://nf-dashboard-homologacao.sistemasflow.com.br/api`

### Verificar Logs de Erro

No Coolify, vá em **"Logs"** e procure por:

```
❌ ERRO CRÍTICO: Falha ao conectar MongoDB
🔌 ERRO DE REDE
🔐 ERRO DE AUTENTICAÇÃO
```

Se aparecer algum desses, siga as instruções nos logs.

---

## 📊 Checklist Final

- [ ] Commit e push do Dockerfile atualizado
- [ ] Variáveis configuradas no Coolify
- [ ] Cache Docker limpo
- [ ] Redeploy completo feito
- [ ] Logs do build verificados
- [ ] Aplicação testada no navegador
- [ ] Console do navegador sem erros
- [ ] Logs do MongoDB aparecem no Coolify
- [ ] Dados carregam corretamente

---

## 💡 Dicas

1. **Sempre faça redeploy completo** após mudar variáveis de ambiente
2. **Limpe o cache** se o build usar código antigo
3. **Verifique os logs** durante o build para confirmar variáveis
4. **Teste no navegador** com F12 aberto para ver requisições

---

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique `CORRECAO_VITE_ENV_COOLIFY.md` para detalhes técnicos
2. Verifique `LOGS_MONGODB_IMPLEMENTADOS.md` para logs do MongoDB
3. Consulte `docs/troubleshooting/MONGODB_LOGS_GUIDE.md` para diagnóstico

---

**🎉 Boa sorte! Em 5 minutos estará funcionando! 🚀**
