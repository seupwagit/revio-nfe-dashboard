# 🔧 Configuração Correta do VITE_API_BASE_URL

**Data:** 2025-12-05  
**Problema:** URL incorreta no `.env.production.example`  
**Status:** ✅ Corrigido

---

## 🚨 Problema Encontrado

O arquivo `.env.production.example` estava com `VITE_API_BASE_URL` configurado incorretamente:

```bash
# ❌ ERRADO
VITE_API_BASE_URL=https://127.0.0.1:3000
```

**Por que está errado:**
1. ❌ `127.0.0.1` é localhost - não funciona em produção
2. ❌ `https://` na porta 3000 sem certificado SSL
3. ❌ Aponta diretamente para porta do backend
4. ❌ Não funciona quando acessado de outro computador

---

## ✅ Configuração Correta

### Para Produção (Coolify)

```bash
# ✅ CORRETO
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
```

**Por que está correto:**
- ✅ Usa domínio público do Coolify
- ✅ HTTPS fornecido automaticamente pelo Coolify
- ✅ Funciona de qualquer lugar
- ✅ Sem `/api` no final (adicionado automaticamente pelo código)
- ✅ Sem porta (Coolify gerencia internamente)

---

## 📋 Regras Importantes

### ✅ Formato Correto

```bash
# Produção
VITE_API_BASE_URL=https://seu-dominio.com
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br

# Desenvolvimento local
VITE_API_BASE_URL=http://localhost:3000
```

### ❌ Formatos Incorretos

```bash
# ❌ Com /api no final
VITE_API_BASE_URL=https://seu-dominio.com/api

# ❌ Com porta em produção
VITE_API_BASE_URL=https://seu-dominio.com:3000

# ❌ Localhost em produção
VITE_API_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=https://127.0.0.1:3000

# ❌ IP interno em produção
VITE_API_BASE_URL=http://10.0.0.8:3000

# ❌ HTTP em produção (sem SSL)
VITE_API_BASE_URL=http://seu-dominio.com
```

---

## 🔍 Como a URL é Usada

### No Código (src/config/env.ts)

```typescript
export const env = {
  api: {
    // Vite substitui import.meta.env.VITE_API_BASE_URL em BUILD TIME
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://apinfe.revio.digital/api',
  }
}
```

### Nas Requisições

```typescript
// Exemplo de requisição
const response = await axios.get(`${env.api.baseUrl}/api/documents`)

// Com VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
// Requisição vai para:
// https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents
```

---

## 🏗️ Arquitetura no Coolify

### Como Funciona

```
┌─────────────────────────────────────────────────────────┐
│ Usuário acessa:                                         │
│ https://nf-dashboard-homologacao.sistemasflow.com.br    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Coolify (Proxy Reverso com SSL)                         │
│ - Gerencia HTTPS automaticamente                        │
│ - Roteia requisições para o container                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Container Docker (Fullstack)                             │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ Frontend (3000)  │      │ Backend (3000)   │        │
│  │ - Serve estático │      │ - API REST       │        │
│  │ - HTML/CSS/JS    │      │ - MongoDB        │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Requisição

1. **Usuário acessa:** `https://nf-dashboard-homologacao.sistemasflow.com.br`
2. **Coolify recebe** e roteia para porta 3000 (frontend)
3. **Frontend carrega** HTML/CSS/JS
4. **JavaScript faz requisição:** `https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents`
5. **Coolify recebe** e roteia para porta 3000 (backend)
6. **Backend processa** e retorna dados
7. **Frontend exibe** os dados

---

## ⚠️ IMPORTANTE: Build Time vs Runtime

### Build Time (Durante o Build)

```bash
# No Dockerfile, durante npm run build:prod
ENV VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br

# Vite substitui no código:
baseUrl: import.meta.env.VITE_API_BASE_URL
# Vira:
baseUrl: "https://nf-dashboard-homologacao.sistemasflow.com.br"
```

### Runtime (Durante a Execução)

```bash
# Variáveis de ambiente em runtime NÃO afetam o frontend
# Porque o valor já foi substituído durante o build!

# ❌ Isso NÃO funciona:
# 1. Fazer build
# 2. Mudar VITE_API_BASE_URL
# 3. Reiniciar container
# Resultado: Ainda usa URL antiga!

# ✅ Isso funciona:
# 1. Mudar VITE_API_BASE_URL no Coolify
# 2. Fazer NOVO BUILD completo
# 3. Deploy
# Resultado: Usa URL nova!
```

---

## 🔧 Configuração no Coolify

### 1. Acessar Variáveis de Ambiente

1. Acesse seu projeto no Coolify
2. Vá em **"Environment Variables"**
3. Procure por `VITE_API_BASE_URL`

### 2. Configurar Corretamente

```bash
# ✅ Use o domínio do Coolify
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br

# Ou se tiver domínio customizado
VITE_API_BASE_URL=https://seu-dominio-customizado.com
```

### 3. Fazer Novo Build

⚠️ **OBRIGATÓRIO:** Após mudar `VITE_API_BASE_URL`, você DEVE:

1. Ir em **"Deployments"**
2. Clicar em **"Redeploy"** ou **"Force Rebuild"**
3. Aguardar build completar
4. Testar a aplicação

**NÃO basta reiniciar o container!**

---

## 🧪 Como Testar

### 1. Verificar no Console do Navegador

```javascript
// Abra F12 → Console
// Procure por requisições

// ✅ CORRETO:
GET https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents

// ❌ ERRADO:
GET http://localhost:3000/api/documents
GET https://127.0.0.1:3000/api/documents
```

### 2. Verificar no Network Tab

1. Abra F12 → Network
2. Recarregue a página
3. Procure por requisições para `/api/`
4. Verifique o domínio usado

### 3. Testar de Outro Computador

1. Acesse a aplicação de outro computador
2. Se funcionar, a URL está correta ✅
3. Se não funcionar, provavelmente está usando localhost ❌

---

## 📊 Checklist de Configuração

### Antes do Deploy

- [ ] `VITE_API_BASE_URL` usa domínio público (não localhost)
- [ ] URL sem `/api` no final
- [ ] URL usa HTTPS (não HTTP)
- [ ] URL sem porta explícita
- [ ] Variável configurada no Coolify
- [ ] Dockerfile.fullstack tem ARG e ENV para VITE_API_BASE_URL

### Após o Deploy

- [ ] Fazer build completo (não apenas restart)
- [ ] Verificar logs do build
- [ ] Testar no navegador (F12 → Network)
- [ ] Verificar se requisições vão para URL correta
- [ ] Testar de outro computador/rede

---

## 🚨 Troubleshooting

### Problema: Ainda conecta em localhost

**Causa:** Build antigo com URL antiga

**Solução:**
1. Limpar cache Docker no Coolify
2. Fazer novo build completo
3. Verificar logs do build para confirmar variável

### Problema: ERR_CONNECTION_REFUSED

**Causa:** URL incorreta ou backend não está rodando

**Solução:**
1. Verificar se backend está rodando: `/api/health`
2. Verificar logs do backend no Coolify
3. Verificar se URL está correta

### Problema: Mixed Content (HTTP/HTTPS)

**Causa:** Frontend HTTPS tentando acessar backend HTTP

**Solução:**
- Use HTTPS para ambos (Coolify fornece automaticamente)
- Ou use HTTP para ambos (apenas desenvolvimento)

---

## 📚 Arquivos Relacionados

- `.env.production.example` - Exemplo de configuração
- `src/config/env.ts` - Onde a URL é usada
- `Dockerfile.fullstack` - Onde ARGs são declarados
- `CORRECAO_VITE_ENV_COOLIFY.md` - Explicação técnica detalhada

---

## ✅ Resumo

| Ambiente | URL Correta |
|----------|-------------|
| **Produção (Coolify)** | `https://nf-dashboard-homologacao.sistemasflow.com.br` |
| **Desenvolvimento Local** | `http://localhost:3000` |
| **Staging** | `https://staging.seu-dominio.com` |

**Lembre-se:**
- ✅ Sempre use domínio público em produção
- ✅ Sempre faça novo build após mudar URL
- ✅ Sempre teste no navegador (F12)
- ❌ Nunca use localhost em produção
- ❌ Nunca adicione `/api` no final

---

**🎉 Configuração corrigida! 🚀**
