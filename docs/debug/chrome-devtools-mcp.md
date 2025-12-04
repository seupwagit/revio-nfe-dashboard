# 🔧 Debug com Chrome DevTools MCP

Este documento explica como usar o Chrome DevTools MCP para debugar o cache e a aplicação em tempo real.

## 📋 O que é Chrome DevTools MCP?

O Chrome DevTools MCP permite que o Kiro (IA) acesse o Chrome DevTools remotamente, podendo:

- ✅ Ver logs do console
- ✅ Executar JavaScript no navegador
- ✅ Ver requisições de rede (API calls)
- ✅ Inspecionar localStorage/sessionStorage
- ✅ Tirar screenshots
- ✅ Verificar performance
- ✅ Debugar cache em tempo real

## 🚀 Como Usar

### 1. Verificação Rápida do Cache

**Via Script:**
```bash
node scripts/check-cache.mjs
```

**Via Kiro:**
```
"Verifique o cache usando Chrome DevTools MCP"
```

**O que faz:**
- Executa `window.debugCache()` no navegador
- Mostra todas as chaves em cache
- Mostra idade e tempo restante de cada cache
- Mostra quantos registros tem

### 2. Relatório Completo

**Via Script:**
```bash
node scripts/check-cache.mjs --full
```

**Via Kiro:**
```
"Gere um relatório completo do cache via Chrome DevTools"
```

**O que faz:**
- ✓ Status do cache (streamingCache)
- ✓ LocalStorage (cache persistente)
- ✓ Network requests (últimas 20 requisições)
- ✓ Console logs (últimos 50 logs)
- ✓ Performance metrics (tempo de carregamento)

### 3. Limpar Cache

**Via Script:**
```bash
node scripts/check-cache.mjs --clear
```

**Via Kiro:**
```
"Limpe o cache usando Chrome DevTools MCP"
```

**⚠️ ATENÇÃO:** Isso limpa TODO o cache! Use apenas se necessário.

## 🎯 Comandos Úteis para o Kiro

### Debug Básico
```
"Mostre os logs do console relacionados ao cache"
"Quais foram as últimas requisições da API?"
"Verifique se o cache está funcionando"
```

### Debug Avançado
```
"Execute window.debugCache() no navegador"
"Mostre o conteúdo do localStorage"
"Quantas requisições da API foram feitas?"
"Qual o tempo de carregamento da página?"
```

### Testes
```
"Faça uma busca na grid e verifique se usou cache"
"Limpe o cache e faça a mesma busca novamente"
"Compare o tempo com e sem cache"
```

## 📊 Exemplo de Relatório

```json
{
  "timestamp": "2024-12-01T10:30:00.000Z",
  "cache": {
    "entries": 3,
    "totalRecords": 1234,
    "completeEntries": 2,
    "partialEntries": 1
  },
  "localStorage": {
    "totalKeys": 15,
    "cacheKeys": 5,
    "cacheData": {
      "grid_cache_tbl_nfe_100": {
        "size": 524288,
        "age": 15,
        "records": 500
      }
    }
  },
  "network": {
    "total": 12,
    "apiRequests": 3,
    "requests": [
      {
        "url": "https://api.revio.com.br/consulta",
        "method": "POST",
        "status": 200,
        "time": 1234
      }
    ]
  },
  "console": {
    "total": 45,
    "cacheLogs": 12,
    "recentLogs": [
      {
        "type": "log",
        "text": "💾 Cache HIT! Idade: 15 min, Resta: 75 min",
        "timestamp": "10:29:45"
      }
    ]
  },
  "performance": {
    "loadTime": 1234,
    "domContentLoaded": 890,
    "resources": 45,
    "apiCalls": 3
  }
}
```

## 🔍 Comandos JavaScript Disponíveis

Você pode pedir ao Kiro para executar estes comandos no navegador:

### Ver Cache
```javascript
window.debugCache()
```

### Ver LocalStorage
```javascript
Object.keys(localStorage).filter(k => k.includes('cache'))
```

### Ver Tamanho do Cache
```javascript
Object.keys(localStorage).reduce((total, key) => {
  if (key.includes('cache')) {
    return total + localStorage.getItem(key).length
  }
  return total
}, 0)
```

### Limpar Cache
```javascript
streamingCache.clearAll()
```

### Ver Estatísticas
```javascript
streamingCache.getStats()
```

## 💡 Dicas

1. **Use o relatório completo** quando algo não funcionar
2. **Verifique os logs do console** para ver se há erros
3. **Compare requisições** com e sem cache
4. **Monitore o tempo** de carregamento
5. **Limpe o cache** apenas se necessário

## 🐛 Troubleshooting

### Cache não está funcionando?
```
"Verifique o cache e mostre os logs de erro"
```

### Requisições muito lentas?
```
"Mostre as últimas requisições da API e seus tempos"
```

### Cache expirando muito rápido?
```
"Execute window.debugCache() e mostre a idade de cada cache"
```

### LocalStorage cheio?
```
"Mostre o tamanho total do localStorage"
```

## 📚 Recursos

- [Chrome DevTools MCP Docs](https://github.com/modelcontextprotocol/servers/tree/main/src/chrome-devtools)
- [Documentação do Cache](./cache-system.md)
- [Troubleshooting](./troubleshooting.md)

---

**Última atualização:** 01/12/2024
