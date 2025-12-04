# 🔧 Scripts de Debug

Scripts utilitários para debug e manutenção da aplicação.

## 📋 Scripts Disponíveis

### 1. Debug do Cache

Verifica o status do cache usando Chrome DevTools MCP.

```bash
# Verificação rápida
npm run debug:cache

# Relatório completo
npm run debug:cache:full

# Limpar cache
npm run debug:cache:clear
```

**Ou use diretamente:**
```bash
node scripts/check-cache.mjs
node scripts/check-cache.mjs --full
node scripts/check-cache.mjs --clear
```

## 🤖 Usando com Kiro (IA)

Você pode pedir ao Kiro para executar estes comandos via Chrome DevTools MCP:

### Exemplos de Comandos

**Verificar Cache:**
```
"Verifique o cache usando Chrome DevTools MCP"
"Mostre o status do cache"
"Execute window.debugCache() no navegador"
```

**Relatório Completo:**
```
"Gere um relatório completo do cache"
"Mostre logs, network requests e performance"
```

**Limpar Cache:**
```
"Limpe o cache usando Chrome DevTools MCP"
"Execute streamingCache.clearAll() no navegador"
```

**Debug de Problemas:**
```
"Mostre os logs de erro do console"
"Quais foram as últimas requisições da API?"
"Verifique se o cache está funcionando"
```

## 📚 Documentação

- [Chrome DevTools MCP](../docs/debug/chrome-devtools-mcp.md) - Guia completo
- [Sistema de Cache](../docs/debug/cache-system.md) - Como funciona o cache
- [Troubleshooting](../docs/debug/troubleshooting.md) - Solução de problemas

## 💡 Dicas

1. **Use o Kiro** para executar comandos via MCP (mais fácil)
2. **Verifique o cache** antes de reportar problemas
3. **Gere relatórios** quando algo não funcionar
4. **Limpe o cache** apenas se necessário

## 🔍 Outros Scripts

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint

# Servidor de agregação
npm run aggregation

# Servidor proxy
npm run proxy
```

---

**Última atualização:** 01/12/2024
