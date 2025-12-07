# 🚀 Início Rápido

## Problema: Porta 3000 em Uso

Se você ver o erro:
```
Error: listen EADDRINUSE: address already in use :::3000
```

## Solução Rápida

### Opção 1: Reiniciar Automaticamente
```bash
npm run fullstack:restart
```

Este comando:
1. Mata qualquer processo na porta 3000
2. Aguarda 2 segundos
3. Inicia o servidor novamente

### Opção 2: Matar Manualmente
```bash
# 1. Encontrar processo
netstat -ano | findstr :3000

# 2. Matar processo (substitua <PID> pelo número encontrado)
taskkill /F /PID <PID>

# 3. Iniciar servidor
npm run fullstack
```

### Opção 3: Usar Script Kill-Ports
```bash
npm run kill-ports
npm run fullstack
```

## Iniciar Servidor

Depois de matar a porta 3000:

```bash
npm run fullstack
```

Ou use o restart que faz tudo automaticamente:

```bash
npm run fullstack:restart
```

## Verificar se Está Rodando

### 1. Abrir no Navegador
```
http://localhost:3000
```

### 2. Testar Health Check
```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "mongodb": {
    "state": "connected",
    "stateCode": 1
  }
}
```

### 3. Ver Processos na Porta 3000
```bash
netstat -ano | findstr :3000
```

## Logs Esperados

Quando funciona:
```
✅ MongoDB conectado com sucesso!
   Status: Conectado
   Tempo de conexão: 68ms
   ReadyState: 1
   Collections: 14 encontradas

✅ Backoffice Server rodando!
   URL: http://localhost:3000
```

## Comandos Disponíveis

```bash
# Iniciar servidor
npm run fullstack

# Reiniciar (mata porta 3000 e inicia)
npm run fullstack:restart

# Matar portas 3000 e 3001
npm run kill-ports

# Backend apenas
npm run backend

# Frontend dev (Vite)
npm run dev

# Build de produção
npm run build:prod
```

## Fluxo Recomendado

```bash
# 1. Reiniciar servidor (mata porta e inicia)
npm run fullstack:restart

# 2. Aguardar logs de sucesso
# Procurar por: "✅ Backoffice Server rodando!"

# 3. Abrir navegador
start http://localhost:3000

# 4. Verificar DevTools (F12)
# - Console: ver logs
# - Componente <DebugGrid />: ver estado
```

## Troubleshooting

### Porta ainda em uso após matar
```bash
# Matar TODOS os processos Node.js
taskkill /F /IM node.exe

# Ou reiniciar computador (última opção)
```

### MongoDB não conecta
```bash
# Verificar variáveis
curl http://localhost:3000/api/debug/env

# Ver logs do servidor
# Procurar por erros de conexão
```

### Grid vazia
Ver: `TROUBLESHOOTING_GRID_VAZIA.md`

### Frontend não carrega
```bash
# 1. Verificar se dist/ existe
dir dist

# 2. Fazer build se necessário
npm run build:prod

# 3. Reiniciar servidor
npm run fullstack:restart
```

## Scripts Criados

- `start-fullstack.bat` - Inicia servidor
- `restart-fullstack.bat` - Mata porta 3000 e reinicia
- `scripts/kill-ports.bat` - Mata portas 3000 e 3001

## Próximos Passos

1. ✅ Matar porta 3000
2. ✅ Iniciar servidor
3. ⬜ Abrir http://localhost:3000
4. ⬜ Verificar se grid carrega
5. ⬜ Se grid vazia, ver `TROUBLESHOOTING_GRID_VAZIA.md`

## Ajuda Rápida

| Problema | Comando |
|----------|---------|
| Porta em uso | `npm run fullstack:restart` |
| Matar portas | `npm run kill-ports` |
| Iniciar servidor | `npm run fullstack` |
| Ver health | `curl http://localhost:3000/api/health` |
| Ver logs | Olhar terminal onde rodou `npm run fullstack` |
| Grid vazia | Ver `TROUBLESHOOTING_GRID_VAZIA.md` |

## Status Atual

✅ MongoDB conectado (14 collections)
✅ Backend funcionando
✅ Frontend build OK
⚠️ Porta 3000 estava em uso (resolvido com restart)

**Use**: `npm run fullstack:restart` para reiniciar automaticamente!
