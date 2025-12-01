# Correção do Proxy Nginx - Resumo Visual

## O Problema

Quando a aplicação fazia uma requisição para `/api/WebView/ContadorConsulta`, o nginx estava duplicando o path:

```
❌ ERRADO (antes):

Browser: /api/WebView/ContadorConsulta
         ↓
Nginx:   location /api/ { proxy_pass https://apinfe.revio.digital/api/; }
         ↓
API:     https://apinfe.revio.digital/api/WebView/ContadorConsulta
                                        ^^^^
                                        duplicado!
```

Resultado: Requisição ficava pendente indefinidamente (404 ou timeout)

## A Solução

Remover o `/api/` do final do `proxy_pass`:

```
✅ CORRETO (agora):

Browser: /api/WebView/ContadorConsulta
         ↓
Nginx:   location /api/ { proxy_pass https://apinfe.revio.digital; }
         ↓
API:     https://apinfe.revio.digital/api/WebView/ContadorConsulta
                                        ^^^^
                                        correto!
```

## Alteração no nginx.conf

```diff
location /api/ {
-   proxy_pass https://apinfe.revio.digital/api/;
+   proxy_pass https://apinfe.revio.digital;
    proxy_ssl_server_name on;
    proxy_ssl_verify off;
    ...
}
```

## Como Funciona o proxy_pass no Nginx

### Com trailing slash no proxy_pass:
```nginx
location /api/ {
    proxy_pass https://backend.com/api/;
}
```
- Request: `/api/users` → Backend: `https://backend.com/api/users`
- O nginx **substitui** `/api/` por `/api/`

### Sem trailing slash no proxy_pass:
```nginx
location /api/ {
    proxy_pass https://backend.com;
}
```
- Request: `/api/users` → Backend: `https://backend.com/api/users`
- O nginx **mantém** o path completo

## Próximos Passos

1. Commit das alterações:
   ```bash
   git add nginx.conf Dockerfile
   git commit -m "fix: corrige duplicação de path no proxy nginx"
   git push
   ```

2. Redeploy no Coolify

3. Verificar no DevTools que as requisições funcionam:
   - Status: 200 OK
   - URL: `https://seu-dominio.com/api/WebView/...`
   - Sem erros de CORS
