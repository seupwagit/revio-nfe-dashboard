# 🔧 Configuração da URL da API

Guia completo para configurar a URL base da API Revio.

## 📋 Opções Disponíveis

### 1. API Direta HTTPS (Recomendado) ✅

```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

**Vantagens:**
- ✅ Conexão segura (HTTPS)
- ✅ Sem necessidade de proxy
- ✅ Mais rápido (conexão direta)
- ✅ Funciona em produção

**Desvantagens:**
- ⚠️ Pode ter problemas de CORS (se não configurado)

**Quando usar:**
- Produção
- Desenvolvimento (se CORS estiver configurado)

---

### 2. API Direta HTTP

```env
VITE_API_BASE_URL=http://apinfe.revio.digital
```

**Vantagens:**
- ✅ Sem necessidade de proxy
- ✅ Mais rápido (conexão direta)

**Desvantagens:**
- ❌ Não é seguro (HTTP)
- ⚠️ Pode ter problemas de CORS
- ❌ Não recomendado para produção

**Quando usar:**
- Apenas para testes locais
- Quando HTTPS não funcionar

---

### 3. Proxy Local

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Vantagens:**
- ✅ Resolve problemas de CORS
- ✅ Permite debug de requisições
- ✅ Pode adicionar headers customizados

**Desvantagens:**
- ❌ Precisa rodar servidor proxy separado
- ❌ Mais lento (duas requisições)
- ❌ Não funciona em produção

**Quando usar:**
- Desenvolvimento com problemas de CORS
- Debug de requisições
- Testes locais

---

## 🚀 Como Configurar

### Passo 1: Editar .env

```bash
# Abra o arquivo .env
code .env
```

### Passo 2: Escolher URL

**Para Produção (Recomendado):**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

**Para Desenvolvimento com Proxy:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Passo 3: Reiniciar Servidor

```bash
# Parar servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### Passo 4: Verificar Logs

Abra o console do navegador (F12) e verifique:

```
Base URL: https://apinfe.revio.digital
Full URL: https://apinfe.revio.digital/WebView/Consultar
```

---

## 🔍 Como Verificar URL Atual

### Via Console do Navegador

```javascript
// Abra o console (F12) e execute:
console.log('Base URL:', import.meta.env.VITE_API_BASE_URL)
```

### Via Logs da Aplicação

Procure por:
```
Base URL: https://apinfe.revio.digital
```

### Via Chrome DevTools MCP

Peça ao Kiro:
```
"Mostre a URL base da API que está sendo usada"
```

---

## 🐛 Troubleshooting

### Problema: Ainda usa localhost:3000

**Causa:** Servidor não foi reiniciado após mudar .env

**Solução:**
```bash
# Parar servidor (Ctrl+C)
npm run dev
```

---

### Problema: CORS Error

**Erro:**
```
Access to XMLHttpRequest at 'https://apinfe.revio.digital' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solução 1: Usar Proxy Local**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run proxy
```

**Solução 2: Configurar CORS no Servidor**
(Requer acesso ao servidor da API)

---

### Problema: Connection Refused

**Erro:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**Causa:** Servidor proxy não está rodando

**Solução:**
```bash
# Se usando proxy local:
npm run proxy

# Se usando API direta:
# Verificar se URL está correta no .env
```

---

### Problema: 401 Unauthorized

**Erro:**
```
Status: 401 Unauthorized
```

**Causa:** Token inválido ou expirado

**Solução:**
1. Gerar novo token em: https://idserver.revio.digital
2. Atualizar .env:
   ```env
   VITE_API_BEARER_TOKEN=novo_token_aqui
   ```
3. Reiniciar servidor

---

## 📊 Comparação de Performance

| Configuração | Latência | Segurança | CORS | Produção |
|--------------|----------|-----------|------|----------|
| HTTPS Direta | ~100ms | ✅ Alta | ⚠️ Depende | ✅ Sim |
| HTTP Direta | ~100ms | ❌ Baixa | ⚠️ Depende | ❌ Não |
| Proxy Local | ~200ms | ✅ Alta | ✅ OK | ❌ Não |

---

## 🎯 Recomendações

### Para Desenvolvimento

**Opção 1: API Direta (se CORS OK)**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

**Opção 2: Proxy Local (se CORS problema)**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Para Produção

**Sempre usar HTTPS:**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

### Para Testes

**Usar proxy para debug:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🔗 Arquivos Relacionados

- **`.env`** - Configuração atual
- **`.env.example`** - Template de configuração
- **`src/config/env.ts`** - Leitura das variáveis
- **`src/services/api.ts`** - Cliente HTTP
- **`proxy-server.cjs`** - Servidor proxy local

---

## 💡 Dicas

1. **Sempre use HTTPS em produção**
2. **Reinicie o servidor após mudar .env**
3. **Verifique logs para confirmar URL**
4. **Use proxy apenas para desenvolvimento**
5. **Mantenha token atualizado**

---

**Última atualização:** 01/12/2024
