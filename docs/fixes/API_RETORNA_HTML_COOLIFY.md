# 🔧 API Retorna HTML no Coolify - Soluções

## Problema

Após deploy no Coolify, `/api/documents` retorna HTML em vez de JSON.

## Correções Aplicadas

### 1. Ordem das Rotas Corrigida ✅

```typescript
// Ordem correta:
1. Rotas da API (/api/*)
2. express.static (dist/)
3. SPA fallback (*)
```

### 2. Middleware de Content-Type Adicionado ✅

```typescript
// Força Content-Type JSON para todas as rotas /api/*
app.use('/api/*', (_req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})
```

### 3. Header Explícito no Debug Endpoint ✅

```typescript
app.get('/api/debug/env', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.json({...})
})
```

## Verificações no Coolify

### 1. Verificar Se Request Chega no Container

**Logs do Coolify** → Procure por:
```
[API] 📥 GET /api/documents
```

- **Se aparecer**: Container recebe request, problema pode ser no response
- **Se NÃO aparecer**: Proxy do Coolify não está encaminhando

### 2. Testar Dentro do Container

```bash
# SSH no servidor
ssh user@servidor

# Listar containers
docker ps | grep nf-dashboard

# Testar dentro do container
docker exec -it <container-id> curl http://localhost:3000/api/health

# Deve retornar JSON
```

### 3. Verificar Configuração do Coolify

#### Port Mapping
```
Container Port: 3000
```

#### Environment Variables
```bash
SERVE_FRONTEND=true
BACKOFFICE_PORT=3000
NODE_ENV=production
```

#### Proxy
- ✅ Habilitado
- ❌ Sem configuração customizada de Nginx

### 4. Verificar Se Há Nginx Customizado

Se você configurou um `nginx.conf` customizado:

1. Coolify → Seu Serviço → Settings
2. Procure por "Custom Nginx Configuration"
3. **Remova** temporariamente
4. Redeploy

O Coolify deve gerenciar o proxy automaticamente.

## Soluções por Cenário

### Cenário 1: Request Não Chega no Container

**Sintoma**: Logs não mostram `[API] 📥 GET /api/documents`

**Causa**: Proxy do Coolify não está encaminhando

**Solução**:
1. Verificar Port Mapping no Coolify
2. Verificar se Proxy está habilitado
3. Remover configuração customizada de Nginx
4. Redeploy

### Cenário 2: Request Chega Mas Retorna HTML

**Sintoma**: Logs mostram request mas response é HTML

**Causa**: SPA fallback capturando a rota

**Solução**: ✅ Já corrigido com ordem das rotas

### Cenário 3: Cache do Coolify/CDN

**Sintoma**: Mesmo após deploy, ainda retorna HTML

**Causa**: Cache

**Solução**:
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Testar com `curl` (sem cache)
3. Aguardar alguns minutos
4. Fazer Hard Refresh (Ctrl+F5)

### Cenário 4: Build Não Completou

**Sintoma**: Deploy diz "sucesso" mas código antigo

**Causa**: Build falhou silenciosamente

**Solução**:
1. Ver logs completos do build
2. Procurar por erros
3. Fazer **Force Redeploy**

## Comandos de Teste

### Teste 1: Health Check

```bash
curl -v https://nf-dashboard-homologacao.sistemasflow.com.br/api/health
```

Procure por:
```
< Content-Type: application/json
```

Se mostrar `text/html`, ainda está retornando HTML.

### Teste 2: Documents

```bash
curl -v "https://nf-dashboard-homologacao.sistemasflow.com.br/api/documents?collection=tbl_nfe_100&page=1&size=10&dtIni=2024-01-01&dtFim=2024-12-31"
```

### Teste 3: Debug Env

```bash
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/debug/env
```

Deve retornar JSON com variáveis de ambiente.

## Checklist de Verificação

- [ ] Código local tem ordem correta das rotas
- [ ] Middleware de Content-Type adicionado
- [ ] Commit e push feitos
- [ ] Deploy completou no Coolify
- [ ] Logs mostram "Backoffice Server rodando"
- [ ] Logs mostram "MongoDB conectado"
- [ ] Port Mapping é 3000
- [ ] SERVE_FRONTEND=true
- [ ] Proxy habilitado no Coolify
- [ ] Sem configuração customizada de Nginx
- [ ] Cache do navegador limpo
- [ ] Testado com curl (sem cache)
- [ ] Request aparece nos logs do container
- [ ] Content-Type é application/json

## Solução Definitiva

Se nada funcionar, tente esta abordagem:

### 1. Desabilitar SPA Fallback Temporariamente

Comente o SPA fallback para testar:

```typescript
// Comentar temporariamente:
/*
if (process.env.SERVE_FRONTEND === 'true') {
  app.get('*', (_req, res) => {
    const distPath = path.join(__dirname, '../../dist')
    res.sendFile(path.join(distPath, 'index.html'))
  })
}
*/
```

Deploy e teste. Se funcionar, o problema é o SPA fallback.

### 2. Adicionar Rota de Teste

Adicione uma rota simples para testar:

```typescript
app.get('/api/test', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.json({ message: 'API funcionando!' })
})
```

Teste:
```bash
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/test
```

### 3. Verificar Traefik/Proxy do Coolify

O Coolify usa Traefik como proxy reverso. Verifique:

1. Coolify → Settings → Proxy
2. Ver configuração do Traefik
3. Verificar se há regras que interferem

## Próximos Passos

1. ✅ Código já foi corrigido
2. ⬜ Fazer commit e push
3. ⬜ Deploy no Coolify
4. ⬜ Verificar logs
5. ⬜ Testar com curl
6. ⬜ Verificar Content-Type no response
7. ⬜ Se ainda retornar HTML, verificar proxy do Coolify

## Resumo

**Correções aplicadas**:
- ✅ Ordem das rotas corrigida
- ✅ Middleware de Content-Type adicionado
- ✅ Headers explícitos

**Próximo passo**: Deploy e teste

**Se ainda não funcionar**: Verificar configuração do proxy do Coolify
