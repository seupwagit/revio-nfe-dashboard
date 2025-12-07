# 🐛 Problema: API Retorna HTML em Vez de JSON

## Problema

Quando acessa `/api/documents`, o servidor retorna HTML (index.html) em vez de JSON.

## Causa

O `express.static` estava configurado **ANTES** das rotas da API.

Quando o Express processa requisições, ele executa middlewares na ordem que foram definidos:

```javascript
// ❌ ERRADO (ordem antiga)
app.use(express.static('dist'))  // 1º - Tenta servir arquivo estático
app.use('/api/documents', ...)   // 2º - Nunca chega aqui

// ✅ CORRETO (ordem nova)
app.use('/api/documents', ...)   // 1º - Processa API
app.use(express.static('dist'))  // 2º - Serve arquivos estáticos
```

## Solução

Movido `express.static` para **DEPOIS** das rotas da API.

### Ordem Correta

```javascript
// 1. Middlewares básicos
app.use(cors())
app.use(express.json())

// 2. Rotas da API (PRIMEIRO)
app.use('/api/health', healthRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/documents', documentsRoutes)

// 3. Arquivos estáticos (DEPOIS)
app.use(express.static('dist'))

// 4. SPA fallback (POR ÚLTIMO)
app.get('*', (req, res) => {
  res.sendFile('dist/index.html')
})
```

## Por que Aconteceu?

O `express.static` tenta servir qualquer arquivo que exista em `dist/`.

Se houver um arquivo `dist/api/documents` (improvável), ele seria servido.

Mas o problema real é que o SPA fallback (`app.get('*')`) captura TODAS as rotas, incluindo `/api/*`.

## Como Funciona Agora

```
Requisição: GET /api/documents
    ↓
1. Verifica rotas da API
    ↓
2. ✅ Encontra /api/documents → Retorna JSON
    ↓
3. Não chega no express.static
    ↓
4. Não chega no SPA fallback
```

```
Requisição: GET /dashboard
    ↓
1. Verifica rotas da API
    ↓
2. ❌ Não encontra
    ↓
3. Verifica arquivos estáticos
    ↓
4. ❌ Não encontra dist/dashboard
    ↓
5. ✅ SPA fallback → Retorna index.html
```

## Testar

### 1. Testar API

```bash
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health
```

Deve retornar JSON:
```json
{
  "status": "ok",
  "mongodb": {...}
}
```

NÃO deve retornar HTML.

### 2. Testar Frontend

```bash
curl https://nf-dashboard-homologacao.sistemasflow.com.br/
```

Deve retornar HTML (index.html).

### 3. Testar Rota Inexistente

```bash
curl https://nf-dashboard-homologacao.sistemasflow.com.br/qualquer-coisa
```

Deve retornar HTML (index.html) - SPA fallback.

## Variáveis de Ambiente

No Coolify, configure:

```bash
# Build Arguments (para o build do frontend)
VITE_API_BASE_URL=https://nf-dashboard-homologacao.sistemasflow.com.br
VITE_MONGODB_PROXY_PORT=

# Environment Variables (runtime do backend)
SERVE_FRONTEND=true
BACKOFFICE_PORT=3000
NODE_ENV=production
```

**IMPORTANTE**: `VITE_MONGODB_PROXY_PORT` deve estar **VAZIO** quando frontend e backend estão na mesma URL.

## Estrutura de URLs

### Fullstack (mesma URL)

```
https://nf-dashboard-homologacao.sistemasflow.com.br/
├── /                    → Frontend (index.html)
├── /dashboard           → Frontend (React Router)
├── /api/health          → Backend (JSON)
├── /api/documents       → Backend (JSON)
└── /api/analytics       → Backend (JSON)
```

### Separado (URLs diferentes)

```
Frontend: https://frontend.com/
Backend:  https://api.backend.com/

Frontend chama: https://api.backend.com/api/documents
```

## Checklist de Deploy

- [ ] Código atualizado com ordem correta
- [ ] Build feito: `npm run build:prod`
- [ ] Dockerfile usa código atualizado
- [ ] Variáveis de ambiente configuradas no Coolify
- [ ] `VITE_API_BASE_URL` = URL do Coolify
- [ ] `VITE_MONGODB_PROXY_PORT` = vazio
- [ ] `SERVE_FRONTEND` = true
- [ ] Deploy feito no Coolify
- [ ] Testar: `curl https://seu-dominio.com/api/health`
- [ ] Deve retornar JSON, não HTML

## Logs Esperados

Quando funciona corretamente:

```
[API] 📥 GET /api/health
[API] 📤 ✅ GET /api/health - 200 (5ms)

[API] 📥 GET /api/documents
[API]    📋 Query: {"collection":"tbl_nfe_100"}
[DOCUMENTS] 📄 Buscando documentos
[DOCUMENTS] ✅ 100 documentos retornados em 1234ms
[API] 📤 ✅ GET /api/documents - 200 (1234ms)
```

## Resumo

**Problema**: express.static antes das rotas da API
**Causa**: Ordem errada dos middlewares
**Solução**: Mover express.static para depois das rotas
**Resultado**: API retorna JSON, frontend retorna HTML

## Próximos Passos

1. ✅ Código corrigido
2. ⬜ Fazer rebuild: `npm run build:prod`
3. ⬜ Commit e push
4. ⬜ Deploy no Coolify
5. ⬜ Testar: `curl https://seu-dominio.com/api/health`
6. ⬜ Verificar que retorna JSON
7. ⬜ Abrir frontend no navegador
8. ⬜ Verificar que grid carrega dados
