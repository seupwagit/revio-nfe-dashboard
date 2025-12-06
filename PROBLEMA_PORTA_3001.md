# Problema: Frontend Tentando Acessar Porta 3001

## Causa

O frontend foi buildado com `VITE_MONGODB_PROXY_PORT=3001` mas o servidor está rodando na porta 3000.

## Por que acontece?

As variáveis `VITE_*` são injetadas no código durante o **build time** (quando roda `npm run build:prod`). Se você mudar a variável no `.env` depois do build, o frontend continuará usando o valor antigo.

## Solução

### 1. Fazer Rebuild do Frontend

```bash
# Parar o servidor (Ctrl+C)

# Fazer rebuild
npm run build:prod

# Reiniciar servidor
npm run fullstack:restart
```

### 2. Verificar Variável no .env

Arquivo `.env` deve ter:
```bash
VITE_MONGODB_PROXY_PORT=3000
```

**NÃO** deve ter:
```bash
VITE_MONGODB_PROXY_PORT=3001  # ❌ ERRADO
```

### 3. Limpar Cache (se necessário)

```bash
# Limpar cache do Vite
npm run debug:cache:clear

# Rebuild
npm run build:prod

# Reiniciar
npm run fullstack:restart
```

## Como Verificar

### 1. Ver Requisições no DevTools

Abra DevTools (F12) → Network tab

Deve mostrar:
```
✅ http://localhost:3000/api/documents
```

NÃO deve mostrar:
```
❌ http://localhost:3001/api/documents
```

### 2. Ver Logs do Console

Console deve mostrar:
```
🔍 Buscando documentos via API REST...
✅ Recebidos X registros...
```

NÃO deve mostrar:
```
❌ Failed to load resource: the server responded with a status of 500
❌ Erro HTTP na API MongoDB
```

### 3. Testar API Diretamente

```bash
# Deve funcionar (porta 3000)
curl http://localhost:3000/api/health

# Não deve funcionar (porta 3001)
curl http://localhost:3001/api/health
```

## Fluxo Correto

```bash
# 1. Verificar .env
cat .env | findstr VITE_MONGODB_PROXY_PORT
# Deve mostrar: VITE_MONGODB_PROXY_PORT=3000

# 2. Fazer rebuild
npm run build:prod

# 3. Reiniciar servidor
npm run fullstack:restart

# 4. Abrir navegador
start http://localhost:3000

# 5. Verificar DevTools
# Network tab deve mostrar requisições para :3000
```

## Prevenção

### Sempre fazer rebuild após mudar variáveis VITE_*

Qualquer mudança em variáveis que começam com `VITE_` requer rebuild:

```bash
# Mudou alguma variável VITE_* no .env?
# Então faça:
npm run build:prod
npm run fullstack:restart
```

### Variáveis que requerem rebuild:

- `VITE_API_BASE_URL`
- `VITE_MONGODB_PROXY_PORT`
- `VITE_DB_HOST`
- `VITE_DB_DATABASE`
- `VITE_DB_COLLECTION`
- Qualquer outra `VITE_*`

### Variáveis que NÃO requerem rebuild:

- `BACKOFFICE_PORT` (backend apenas)
- `SERVE_FRONTEND` (backend apenas)
- `NODE_ENV` (backend apenas)
- `VITE_MONGODB_CONNECTION_STRING` (backend apenas)

## Script Automático

Criei um script que faz tudo automaticamente:

```bash
npm run rebuild-and-restart
```

Este script:
1. Para o servidor
2. Limpa cache
3. Faz rebuild
4. Reinicia servidor

## Resumo

**Problema**: Frontend buildado com porta 3001
**Causa**: Build antigo com variável antiga
**Solução**: Rebuild do frontend
**Comando**: `npm run build:prod && npm run fullstack:restart`

## Checklist

- [ ] Verificar `.env` tem `VITE_MONGODB_PROXY_PORT=3000`
- [ ] Parar servidor (Ctrl+C)
- [ ] Fazer rebuild: `npm run build:prod`
- [ ] Reiniciar: `npm run fullstack:restart`
- [ ] Abrir navegador: http://localhost:3000
- [ ] Verificar Network tab mostra requisições para :3000
- [ ] Verificar grid carrega dados

## Próximos Passos

Após rebuild:
1. ✅ Frontend usa porta 3000
2. ✅ Backend responde na porta 3000
3. ✅ Sem erros de conexão
4. ⬜ Grid deve carregar dados
5. ⬜ Se grid vazia, ver `TROUBLESHOOTING_GRID_VAZIA.md`
