# ✅ Correção: Ordem das Rotas

## Problema Resolvido

API retornava HTML em vez de JSON porque `express.static` estava ANTES das rotas da API.

## O que foi feito?

Mudei a ordem no `src/server/index.ts`:

### Antes (❌ Errado)
```javascript
app.use(express.static('dist'))  // Arquivos estáticos PRIMEIRO
app.use('/api/documents', ...)   // API DEPOIS
```

### Depois (✅ Correto)
```javascript
app.use('/api/documents', ...)   // API PRIMEIRO
app.use(express.static('dist'))  // Arquivos estáticos DEPOIS
```

## Ordem Correta

```javascript
1. express.json()           // Parse JSON
2. /api/health              // Rotas da API
3. /api/analytics           // Rotas da API
4. /api/documents           // Rotas da API
5. express.static('dist')   // Arquivos estáticos
6. app.get('*', ...)        // SPA fallback
```

## Testar

```bash
# Deve retornar JSON
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health

# Deve retornar HTML
curl https://nf-dashboard-homologacao.sistemasflow.com.br/
```

## Variáveis no Coolify

```bash
# Build Arguments
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
VITE_MONGODB_PROXY_PORT=

# Environment Variables
SERVE_FRONTEND=true
BACKOFFICE_PORT=3000
```

**IMPORTANTE**: `VITE_MONGODB_PROXY_PORT` deve estar **VAZIO**.

## Próximos Passos

```bash
# 1. Rebuild
npm run build:prod

# 2. Commit
git add .
git commit -m "fix: ordem correta das rotas - API antes de static"

# 3. Push
git push

# 4. Deploy no Coolify

# 5. Testar
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health
```

## Resultado Esperado

✅ `/api/health` → JSON
✅ `/api/documents` → JSON
✅ `/` → HTML
✅ `/dashboard` → HTML (SPA)

---

**Documentação completa**: `PROBLEMA_API_RETORNA_HTML.md`
