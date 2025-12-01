# Fix CORS - Deploy Atualizado

## Problemas Identificados e Corrigidos

### 1. Build não carregava .env.production
A aplicação estava fazendo requisições diretas para `https://apinfe.revio.digital` ao invés de usar o proxy nginx em `/api`.

**Causa**: O Dockerfile usava `NODE_ENV=production npm run build`, que não faz o Vite carregar o `.env.production`.

**Solução**: Alterado para `npm run build -- --mode production`

### 2. Nginx duplicava o /api no proxy
As requisições ficavam pendentes porque o nginx fazia proxy para `https://apinfe.revio.digital/api/api/...`

**Causa**: `proxy_pass https://apinfe.revio.digital/api/;` duplicava o path.

**Solução**: Alterado para `proxy_pass https://apinfe.revio.digital;`

## Solução Aplicada

Alterado o comando de build no Dockerfile para:

```dockerfile
RUN npm run build -- --mode production
```

Isso faz o Vite carregar explicitamente o `.env.production`, que contém:

```bash
VITE_API_BASE_URL=/api
```

## Como Fazer o Deploy

### Opção 1: Teste Local Primeiro (Recomendado)

Execute o script de teste:

**Windows:**
```powershell
.\test-nginx-proxy.ps1
```

**Linux/Mac:**
```bash
chmod +x test-nginx-proxy.sh
./test-nginx-proxy.sh
```

Se o teste passar (status 200), prossiga para o deploy.

### Opção 2: Deploy no Coolify

1. Commit e push das alterações:
   ```bash
   git add Dockerfile nginx.conf
   git commit -m "fix: corrige proxy nginx e carregamento de .env.production"
   git push
   ```

2. No Coolify, vá até o projeto e clique em "Redeploy"

3. Aguarde o build completar. Você verá no log:
   ```
   ✅ URL da API não encontrada no build (correto - deve usar /api)
   ```

## Verificação

Após o deploy, abra o DevTools (F12) na aba Network e verifique:

✅ **Correto**: Requisições para `https://nf-dashboard-homologacao.sistemasflow.com.br/api/WebView/...`

❌ **Errado**: Requisições para `https://apinfe.revio.digital/api/WebView/...`

## Fluxo Correto

```
Browser → https://nf-dashboard-homologacao.sistemasflow.com.br/api
         ↓
    Nginx Proxy (dentro do container)
         ↓
    https://apinfe.revio.digital/api
```

O nginx adiciona os headers CORS necessários, resolvendo o problema.
