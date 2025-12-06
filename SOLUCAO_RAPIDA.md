# 🚨 Solução Rápida - Erro 500 na API

## Problema

Frontend mostra erro:
```
Failed to load resource: the server responded with a status of 500
❌ Erro HTTP na API MongoDB
```

E tenta acessar porta **3001** em vez de **3000**.

## Solução em 1 Comando

```bash
npm run fullstack:rebuild
```

Este comando faz:
1. ✅ Mata processos na porta 3000
2. ✅ Limpa cache do Vite
3. ✅ Faz rebuild do frontend (com porta 3000)
4. ✅ Inicia servidor fullstack

## Ou Passo a Passo

```bash
# 1. Parar servidor (Ctrl+C no terminal)

# 2. Fazer rebuild
npm run build:prod

# 3. Reiniciar
npm run fullstack:restart

# 4. Abrir navegador
start http://localhost:3000
```

## Por que aconteceu?

O frontend foi buildado com `VITE_MONGODB_PROXY_PORT=3001` (valor antigo).

Mudamos para porta 3000, mas o frontend ainda tinha o build antigo.

## Como Verificar se Funcionou

### 1. DevTools Network Tab
Requisições devem ir para:
```
✅ http://localhost:3000/api/documents
```

### 2. Console
Deve mostrar:
```
✅ Recebidos X registros da collection...
```

### 3. Grid
Deve carregar dados (não ficar vazia).

## Comandos Úteis

```bash
# Rebuild e reiniciar (recomendado)
npm run fullstack:rebuild

# Apenas reiniciar (sem rebuild)
npm run fullstack:restart

# Apenas iniciar
npm run fullstack

# Verificar health
curl http://localhost:3000/api/health

# Testar API
curl "http://localhost:3000/api/documents?collection=tbl_nfe_100&dtIni=2024-01-01&dtFim=2024-12-31&page=1&size=10"
```

## Quando Fazer Rebuild?

Sempre que mudar variáveis `VITE_*` no `.env`:

- `VITE_API_BASE_URL`
- `VITE_MONGODB_PROXY_PORT` ← Este foi o caso
- `VITE_DB_HOST`
- `VITE_DB_DATABASE`
- Qualquer outra `VITE_*`

## Fluxo Completo

```bash
# 1. Rebuild e reiniciar
npm run fullstack:rebuild

# 2. Aguardar logs de sucesso
# Procurar: "✅ Backoffice Server rodando!"

# 3. Abrir navegador
start http://localhost:3000

# 4. Verificar DevTools (F12)
# - Network: requisições para :3000
# - Console: sem erros
# - Grid: deve carregar dados
```

## Se Ainda Não Funcionar

### Grid Vazia
Ver: `TROUBLESHOOTING_GRID_VAZIA.md`

### Porta em Uso
```bash
npm run fullstack:restart
```

### MongoDB Não Conecta
```bash
curl http://localhost:3000/api/debug/env
```

### Build Falha
```bash
# Ver erros TypeScript
npm run checktype

# Limpar tudo e tentar novamente
npm run debug:cache:clear
npm run build:prod
```

## Status Esperado

Após `npm run fullstack:rebuild`:

```
✅ MongoDB conectado com sucesso!
   Status: Conectado
   Collections: 14 encontradas

✅ Backoffice Server rodando!
   URL: http://localhost:3000
```

No navegador:
```
✅ Grid carrega dados
✅ Sem erros no console
✅ Requisições para :3000 (não :3001)
```

## Resumo

**Problema**: Frontend usa porta 3001
**Causa**: Build antigo
**Solução**: `npm run fullstack:rebuild`
**Tempo**: ~10 segundos

---

**Use sempre**: `npm run fullstack:rebuild` quando mudar variáveis VITE_*
