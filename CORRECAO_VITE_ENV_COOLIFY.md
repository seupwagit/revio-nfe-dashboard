# 🔧 Correção: Variáveis de Ambiente Vite no Coolify

**Data:** 2025-12-05  
**Problema:** Frontend conectando em `localhost:3000` em produção  
**Status:** ✅ Corrigido

---

## 🚨 Problema Identificado

### Sintomas

O frontend em produção (Coolify) estava tentando conectar em `http://localhost:3000` ao invés da URL correta do backend:

```
GET http://localhost:3000/api/documents?collection=tbl_nfe_100&page=1&size=999999 
net::ERR_CONNECTION_REFUSED
```

### Causa Raiz

**Variáveis `VITE_*` não estavam disponíveis durante o BUILD do frontend!**

#### Como o Vite Funciona

O Vite substitui as variáveis `import.meta.env.VITE_*` **em tempo de build**, não em runtime:

```typescript
// src/config/env.ts
export const env = {
  api: {
    // Esta linha é substituída DURANTE O BUILD
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://apinfe.revio.digital/api',
  }
}
```

Se `VITE_API_BASE_URL` não estiver disponível durante o build, o Vite usa o valor padrão ou `undefined`, e esse valor fica **hardcoded** no JavaScript compilado.

#### O Que Estava Acontecendo

1. **Build no Dockerfile:** Variáveis não disponíveis
2. **Vite compila:** Usa valor padrão ou `undefined`
3. **JavaScript gerado:** Tem `localhost:3000` hardcoded
4. **Runtime no Coolify:** Variáveis de ambiente não têm efeito (tarde demais!)

---

## ✅ Solução Implementada

### Modificação no Dockerfile.fullstack

Adicionei **ARGs** e **ENVs** no estágio de build para passar as variáveis do Coolify para o Vite:

```dockerfile
# Estágio 1: Build do Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# ... instalação de dependências ...

# IMPORTANTE: Declarar ARGs para receber variáveis de ambiente do Coolify
# Estas variáveis são necessárias em BUILD TIME para o Vite
ARG VITE_API_BASE_URL
ARG VITE_API_BEARER_TOKEN
ARG VITE_DB_HOST
ARG VITE_DB_DATABASE
ARG VITE_DB_COLLECTION
ARG VITE_MONGODB_CONNECTION_STRING
# ... outras variáveis ...

# Converter ARGs em ENVs para o build do Vite
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_BEARER_TOKEN=$VITE_API_BEARER_TOKEN
ENV VITE_DB_HOST=$VITE_DB_HOST
ENV VITE_DB_DATABASE=$VITE_DB_DATABASE
# ... outras variáveis ...

# Build do frontend (TypeScript + Vite)
RUN npm run build:prod
```

### Como Funciona

1. **Coolify passa variáveis** como build args
2. **ARG captura** as variáveis do Coolify
3. **ENV converte** ARGs em variáveis de ambiente
4. **Vite lê** as variáveis durante o build
5. **JavaScript compilado** tem os valores corretos hardcoded

---

## 📋 Variáveis Adicionadas

### Obrigatórias

- `VITE_API_BASE_URL` - URL base da API (ex: `https://seu-dominio.com`)
- `VITE_API_BEARER_TOKEN` - Token de autenticação
- `VITE_DB_HOST` - Host do MongoDB
- `VITE_DB_DATABASE` - Nome do database
- `VITE_DB_COLLECTION` - Collection padrão
- `VITE_MONGODB_CONNECTION_STRING` - Connection string completa

### Opcionais

- `VITE_DEFAULT_PAGE_SIZE` - Tamanho de página (padrão: 500)
- `VITE_DEFAULT_PAGE` - Página inicial (padrão: 1)
- `VITE_MAX_DATE_RANGE_DAYS` - Máximo de dias (padrão: 365)
- `VITE_DEFAULT_DATE_RANGE_DAYS` - Range padrão (padrão: 30)
- `VITE_CACHE_DURATION_MINUTES` - Duração do cache (padrão: 90)
- `VITE_QUERY_TIMEOUT_MS` - Timeout de queries (padrão: 45000)
- `VITE_ANALYTICS_PAGE_SIZE` - Tamanho para analytics (padrão: 10000)
- `VITE_API_GOOGLE_GEMINI` - API key do Gemini
- `VITE_PUBLIC_BUILDER_KEY` - Builder.io key
- `VITE_S3_ENDPOINT` - Endpoint S3/Wasabi
- `VITE_S3_ACCESS_KEY` - Access key S3
- `VITE_S3_SECRET_KEY` - Secret key S3
- `VITE_S3_BUCKET` - Nome do bucket
- `VITE_S3_REGION` - Região S3

---

## 🔧 Configuração no Coolify

### 1. Acessar Variáveis de Ambiente

1. Acesse seu projeto no Coolify
2. Vá em **"Environment Variables"** ou **"Variáveis de Ambiente"**
3. Adicione as variáveis necessárias

### 2. Variáveis Obrigatórias

```bash
# API Configuration
VITE_API_BASE_URL=https://seu-dominio.com
VITE_API_BEARER_TOKEN=seu_token_aqui

# MongoDB Configuration
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&authSource=admin

# Backend Port
BACKOFFICE_PORT=3000
```

### 3. Importante

⚠️ **Após adicionar/modificar variáveis, você DEVE fazer um novo build!**

As variáveis são incorporadas no JavaScript durante o build, então:
- ❌ Apenas reiniciar o container NÃO funciona
- ✅ É necessário fazer um novo build completo

### 4. Como Fazer Novo Build no Coolify

1. Vá em **"Deployments"** ou **"Implantações"**
2. Clique em **"Redeploy"** ou **"Reimplantar"**
3. Aguarde o build completar
4. Verifique os logs para confirmar que as variáveis foram passadas

---

## 🧪 Como Verificar se Funcionou

### 1. Verificar no Console do Navegador

Abra o console do navegador (F12) e procure por:

```javascript
// ANTES (ERRADO)
GET http://localhost:3000/api/documents

// DEPOIS (CORRETO)
GET https://seu-dominio.com/api/documents
```

### 2. Verificar Variáveis no Build

Nos logs do Coolify durante o build, você deve ver:

```
Step X/Y : ENV VITE_API_BASE_URL=https://seu-dominio.com
```

### 3. Testar a Aplicação

1. Acesse a aplicação
2. Tente carregar dados
3. Verifique se os dados aparecem
4. Verifique o console para erros

---

## 📊 Fluxo Correto

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Coolify: Variáveis de Ambiente Configuradas              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Docker Build: ARGs recebem variáveis do Coolify          │
│    ARG VITE_API_BASE_URL                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Dockerfile: ENVs convertem ARGs                          │
│    ENV VITE_API_BASE_URL=$VITE_API_BASE_URL                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Vite Build: Lê variáveis e substitui no código           │
│    import.meta.env.VITE_API_BASE_URL → "https://..."        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. JavaScript Compilado: Valores hardcoded corretos         │
│    baseUrl: "https://seu-dominio.com"                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Runtime: Aplicação usa URLs corretas                     │
│    GET https://seu-dominio.com/api/documents ✅              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Erros Comuns

### 1. Esqueceu de Fazer Novo Build

**Sintoma:** Ainda conecta em localhost após adicionar variáveis

**Solução:** Fazer redeploy completo no Coolify

### 2. Variável com Nome Errado

**Sintoma:** Usa valor padrão ao invés do configurado

**Solução:** Verificar se o nome está exatamente como `VITE_API_BASE_URL` (case-sensitive)

### 3. Variável Não Declarada no Dockerfile

**Sintoma:** Variável não é passada para o build

**Solução:** Adicionar `ARG` e `ENV` no Dockerfile

### 4. URL com /api no Final

**Sintoma:** Requisições vão para `/api/api/documents`

**Solução:** `VITE_API_BASE_URL` deve ser sem `/api` no final:
- ✅ `https://seu-dominio.com`
- ❌ `https://seu-dominio.com/api`

---

## 📚 Referências

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker ARG vs ENV](https://docs.docker.com/engine/reference/builder/#arg)
- [Coolify Environment Variables](https://coolify.io/docs/environment-variables)

---

## ✅ Checklist de Deploy

Antes de fazer deploy no Coolify:

- [ ] Variáveis `VITE_*` configuradas no Coolify
- [ ] `VITE_API_BASE_URL` sem `/api` no final
- [ ] `VITE_MONGODB_CONNECTION_STRING` completa
- [ ] Dockerfile.fullstack atualizado com ARGs
- [ ] Commit e push das alterações
- [ ] Limpar cache Docker no Coolify (se necessário)
- [ ] Fazer redeploy completo
- [ ] Verificar logs do build
- [ ] Testar aplicação no navegador
- [ ] Verificar console do navegador (F12)
- [ ] Confirmar que não há erros de conexão

---

**🎉 Problema Resolvido!**

**Agora o frontend usará as URLs corretas em produção! 🚀**
