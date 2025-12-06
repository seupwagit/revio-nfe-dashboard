# 🌐 Configuração de CORS

Guia completo para configurar CORS (Cross-Origin Resource Sharing) no SpedRevio.

## 📋 O que é CORS?

CORS é um mecanismo de segurança que permite que um servidor indique quais origens (domínios) podem acessar seus recursos.

### Problema Comum

```
Access to XMLHttpRequest at 'https://apinfe.revio.digital' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## ✅ Configurações Implementadas

### 1. Vite Dev Server (vite.config.ts)

```typescript
server: {
  cors: {
    origin: '*',                    // Permite todas as origens
    methods: ['GET', 'POST', ...],  // Métodos permitidos
    allowedHeaders: [...],          // Headers permitidos
    credentials: true,              // Permite cookies/auth
  },
  host: true,                       // Aceita de qualquer IP
  port: 5173,
}
```

**Permite:**
- ✅ Requisições de qualquer origem
- ✅ Todos os métodos HTTP
- ✅ Headers customizados (Authorization, etc.)
- ✅ Credenciais (cookies, tokens)
- ✅ Acesso de qualquer IP da rede

### 2. Proxy Server (scripts/proxy-server.cjs)

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
```

**Permite:**
- ✅ Requisições de qualquer origem
- ✅ Métodos GET, POST, PUT, DELETE, OPTIONS
- ✅ Headers Content-Type, Authorization, Accept

### 3. Vite Proxy (vite.config.ts)

```typescript
proxy: {
  '/api': {
    target: 'https://apinfe.revio.digital',
    changeOrigin: true,  // Muda o header Origin
    secure: false,       // Aceita certificados inválidos
  }
}
```

**Permite:**
- ✅ Proxy transparente para API
- ✅ Resolve problemas de CORS
- ✅ Mantém autenticação

## 🚀 Como Usar

### Opção 1: Vite Dev Server (Recomendado)

**Configuração:**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

**Iniciar:**
```bash
npm run dev
```

**Acesso:**
- Local: `http://localhost:3000`
- Rede: `http://192.168.x.x:3000`
- Qualquer IP: `http://0.0.0.0:3000`

**CORS:** ✅ Configurado automaticamente

---

### Opção 2: Proxy Server Standalone

**Configuração:**
```env
VITE_API_BASE_URL=http://localhost:3000
```

**Iniciar:**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run proxy
```

**Acesso:**
- Dev Server: `http://localhost:3000`
- Proxy: `http://localhost:3000`

**CORS:** ✅ Configurado no proxy

---

### Opção 3: API Direta (Sem Proxy)

**Configuração:**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

**Iniciar:**
```bash
npm run dev
```

**CORS:** ⚠️ Depende da configuração do servidor da API

---

## 🔍 Verificar Configuração

### Via Console do Navegador

```javascript
// Fazer uma requisição de teste
fetch('http://localhost:5173/api/test', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://example.com'
  }
})
.then(res => {
  console.log('CORS Headers:', res.headers)
})
```

### Via Chrome DevTools

1. Abra DevTools (F12)
2. Vá em Network
3. Faça uma requisição
4. Veja os headers da resposta:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: ...`
   - `Access-Control-Allow-Headers: ...`

### Via curl

```bash
# Testar CORS
curl -I -X OPTIONS http://localhost:5173/api/test \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: GET"
```

**Resposta esperada:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
```

## 🐛 Troubleshooting

### Problema 1: CORS Error Ainda Aparece

**Erro:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Soluções:**

**1. Verificar se servidor está rodando:**
```bash
# Deve mostrar: Server running on http://localhost:5173
npm run dev
```

**2. Limpar cache do navegador:**
- Ctrl+Shift+Delete
- Limpar cache e cookies
- Recarregar (Ctrl+F5)

**3. Usar proxy local:**
```env
VITE_API_BASE_URL=http://localhost:3000
```
```bash
npm run proxy
```

**4. Verificar configuração:**
```bash
# Ver vite.config.ts
cat vite.config.ts | grep -A 10 "cors:"
```

---

### Problema 2: Preflight Request Falha

**Erro:**
```
Response to preflight request doesn't pass access control check
```

**Causa:** Servidor não responde a requisições OPTIONS

**Solução:**

**No proxy-server.cjs:**
```javascript
if (req.method === 'OPTIONS') {
  res.writeHead(200);
  res.end();
  return;
}
```

**No vite.config.ts:**
```typescript
cors: {
  preflightContinue: false,
  optionsSuccessStatus: 204
}
```

---

### Problema 3: Credentials Not Allowed

**Erro:**
```
The value of the 'Access-Control-Allow-Credentials' header 
in the response is '' which must be 'true'
```

**Solução:**

**No vite.config.ts:**
```typescript
cors: {
  credentials: true
}
```

**No proxy-server.cjs:**
```javascript
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

---

### Problema 4: Acesso de Outro Computador

**Erro:**
```
ERR_CONNECTION_REFUSED ao acessar de outro PC
```

**Solução:**

**1. Verificar host no vite.config.ts:**
```typescript
server: {
  host: true, // ou '0.0.0.0'
  port: 5173
}
```

**2. Verificar firewall:**
```bash
# Windows: Permitir porta 5173
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
```

**3. Descobrir IP local:**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

**4. Acessar de outro PC:**
```
http://192.168.x.x:5173
```

---

## 🔒 Segurança

### ⚠️ ATENÇÃO: Produção

**Não use CORS aberto em produção!**

```typescript
// ❌ NÃO FAZER EM PRODUÇÃO
cors: {
  origin: '*'
}

// ✅ FAZER EM PRODUÇÃO
cors: {
  origin: [
    'https://seu-dominio.com',
    'https://app.seu-dominio.com'
  ]
}
```

### Configuração Segura para Produção

```typescript
// vite.config.ts (produção)
export default defineConfig({
  server: {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://seu-dominio.com']
        : '*',
      credentials: true
    }
  }
})
```

### Variáveis de Ambiente

```env
# .env.development
VITE_CORS_ORIGIN=*

# .env.production
VITE_CORS_ORIGIN=https://seu-dominio.com
```

## 📊 Comparação de Opções

| Opção | CORS | Performance | Segurança | Produção |
|-------|------|-------------|-----------|----------|
| Vite Dev Server | ✅ Configurado | ⚡ Rápido | ⚠️ Dev only | ❌ Não |
| Proxy Standalone | ✅ Configurado | 🐢 Lento | ✅ OK | ⚠️ Possível |
| API Direta | ⚠️ Depende | ⚡ Rápido | ✅ Melhor | ✅ Sim |

## 💡 Recomendações

### Para Desenvolvimento

1. **Use Vite Dev Server** com CORS aberto
2. **Não se preocupe com segurança** (é local)
3. **Teste de outros dispositivos** (host: true)

### Para Produção

1. **Configure CORS específico** (apenas domínios permitidos)
2. **Use HTTPS** sempre
3. **Valide tokens** no backend
4. **Monitore requisições** suspeitas

### Para Testes

1. **Use proxy local** para debug
2. **Teste com curl** antes de usar no navegador
3. **Verifique headers** no DevTools

## 🔗 Recursos

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Vite: Server Options](https://vitejs.dev/config/server-options.html)
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)

---

**Última atualização:** 01/12/2024
