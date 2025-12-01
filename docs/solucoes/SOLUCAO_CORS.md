# Solução para Problema de CORS

## Problema

A API `https://apinfe.revio.digital` não permite requisições diretas do navegador devido a restrições CORS:

```
Access to XMLHttpRequest has been blocked by CORS policy: 
Request header field authorization is not allowed by Access-Control-Allow-Headers in preflight response.
```

## Causa

A API não está configurada para aceitar o header `Authorization` em requisições cross-origin (CORS preflight).

## Solução Implementada

### 1. Proxy Reverso no Nginx

O nginx no container faz proxy das requisições para a API, evitando CORS:

```
Navegador → /api → Nginx (proxy) → https://apinfe.revio.digital/api
```

**Configuração no `nginx.conf`:**

```nginx
location /api/ {
    proxy_pass https://apinfe.revio.digital/api/;
    proxy_ssl_server_name on;
    proxy_ssl_verify off;
    
    # Headers necessários
    proxy_set_header Host apinfe.revio.digital;
    proxy_pass_request_headers on;
    
    # CORS headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
    
    # Responder OPTIONS (preflight)
    if ($request_method = OPTIONS) {
        return 204;
    }
}
```

### 2. Configuração de Ambiente

**`.env.production`:**
```bash
VITE_API_BASE_URL=/api
```

**`src/config/env.ts`:**
```typescript
api: {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  // ...
}
```

**Dockerfile:**
```dockerfile
RUN NODE_ENV=production npm run build
```

Isso garante que:
- O Vite use o `.env.production` durante o build
- A aplicação use o proxy local (`/api`) ao invés de chamar a API diretamente
- O fallback também seja `/api` caso a variável não esteja definida

### 3. Porta 3000

O Coolify espera a porta 3000 por padrão, então configuramos:

- **nginx.conf**: `listen 3000`
- **Dockerfile**: `EXPOSE 3000`
- **Healthcheck**: `http://127.0.0.1:3000/`

## Fluxo Completo

```
Internet (HTTPS)
    ↓
Coolify Proxy (SSL/TLS)
    ↓
Container Nginx (porta 3000)
    ↓
    ├─ /api/* → Proxy para https://apinfe.revio.digital/api/*
    └─ /* → Serve arquivos estáticos (React SPA)
```

## Vantagens

✅ Resolve CORS completamente
✅ Não precisa modificar a API
✅ Headers de autenticação funcionam
✅ SSL gerenciado pelo Coolify
✅ Cache e otimizações do nginx

## Desenvolvimento Local

Para desenvolvimento, o Vite já tem proxy configurado em `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://apinfe.revio.digital',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

Use `.env` com:
```bash
VITE_API_BASE_URL=/api
```

Ou aponte diretamente para a API (se estiver testando sem proxy):
```bash
VITE_API_BASE_URL=https://apinfe.revio.digital/api
```
