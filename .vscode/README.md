# 🔧 Configurações de Debug do VSCode

Este diretório contém as configurações de debug e desenvolvimento para o VSCode.

## 📋 Arquivos

- **`launch.json`** - Configurações de debug
- **`tasks.json`** - Tarefas automatizadas
- **`settings.json`** - Configurações do workspace
- **`extensions.json`** - Extensões recomendadas

## 🚀 Configurações de Debug Disponíveis

### 1. 🚀 Launch Chrome (Dev)
Inicia o Chrome com a aplicação em modo debug.

**Como usar:**
1. Pressione `F5` ou vá em "Run and Debug"
2. Selecione "🚀 Launch Chrome (Dev)"
3. O Chrome abre automaticamente com DevTools

**Recursos:**
- ✅ Source maps habilitados
- ✅ Breakpoints funcionam
- ✅ Hot reload automático
- ✅ Remote debugging na porta 9222
- ✅ CORS desabilitado para testes

### 2. 🔗 Attach to Chrome
Conecta a uma instância do Chrome já aberta.

**Como usar:**
1. Abra o Chrome com: `chrome.exe --remote-debugging-port=9222`
2. Navegue até `http://localhost:5173`
3. No VSCode, selecione "🔗 Attach to Chrome"
4. Pressione `F5`

**Quando usar:**
- Chrome já está aberto
- Quer debugar sem fechar o navegador
- Múltiplas abas abertas

### 3. 🌐 Launch Edge (Dev)
Igual ao Chrome, mas usando Microsoft Edge.

**Como usar:**
1. Pressione `F5`
2. Selecione "🌐 Launch Edge (Dev)"

### 4. 🐛 Debug Cache (Chrome)
Modo especial para debugar o sistema de cache.

**Como usar:**
1. Selecione "🐛 Debug Cache (Chrome)"
2. Pressione `F5`
3. DevTools abre automaticamente
4. Console mostra logs detalhados do cache

**Recursos:**
- ✅ DevTools abre automaticamente
- ✅ Trace habilitado
- ✅ Logs detalhados
- ✅ Perfil isolado (não afeta seu Chrome normal)

### 5. 🧪 Debug Tests
Debug de testes unitários (quando implementados).

**Como usar:**
1. Selecione "🧪 Debug Tests"
2. Pressione `F5`
3. Breakpoints nos testes funcionam

## 📝 Tarefas Disponíveis

Pressione `Ctrl+Shift+P` e digite "Tasks: Run Task":

### Desenvolvimento
- **`npm: dev`** - Inicia servidor de desenvolvimento
- **`npm: build`** - Build de produção

### Debug do Cache
- **`Debug: Check Cache`** - Verificação rápida do cache
- **`Debug: Full Cache Report`** - Relatório completo
- **`Debug: Clear Cache`** - Limpar todo o cache

## 🎯 Atalhos Úteis

| Atalho | Ação |
|--------|------|
| `F5` | Iniciar debug |
| `Shift+F5` | Parar debug |
| `Ctrl+Shift+F5` | Reiniciar debug |
| `F9` | Toggle breakpoint |
| `F10` | Step over |
| `F11` | Step into |
| `Shift+F11` | Step out |
| `Ctrl+Shift+P` | Command palette |

## 🔍 Breakpoints

### Tipos de Breakpoints

1. **Breakpoint Normal** - `F9` na linha
2. **Conditional Breakpoint** - Clique direito > "Add Conditional Breakpoint"
3. **Logpoint** - Clique direito > "Add Logpoint"

### Exemplos de Conditional Breakpoints

```javascript
// Parar apenas quando valor > 1000
valorTotal > 1000

// Parar apenas para collection específica
collection === 'tbl_nfe_100'

// Parar apenas quando cache expira
Date.now() - cached.timestamp > 90 * 60 * 1000
```

## 🐛 Debug do Cache

### Pontos de Debug Recomendados

1. **`src/services/streamingCache.ts`**
   - `getFromCache()` - Ver quando cache é usado
   - `updateCache()` - Ver quando cache é atualizado
   - `cleanExpired()` - Ver quando cache expira

2. **`src/services/api.ts`**
   - `fetchNotasFiscais()` - Ver requisições da API
   - `fetchNotasInChunks()` - Ver divisão em chunks

3. **`src/contexts/NFContext.tsx`**
   - `carregarDados()` - Ver fluxo de carregamento

### Exemplo de Debug Session

1. Coloque breakpoint em `streamingCache.getFromCache()`
2. Inicie "🐛 Debug Cache (Chrome)"
3. Faça uma busca na aplicação
4. VSCode para no breakpoint
5. Inspecione variáveis:
   - `key` - Chave do cache
   - `cached` - Dados em cache
   - `age` - Idade do cache
   - `remainingMinutes` - Tempo restante

## 💡 Dicas

### 1. Debug Console
Use o Debug Console para executar código:
```javascript
// Ver cache completo
streamingCache.debugCache()

// Ver estatísticas
streamingCache.getStats()

// Limpar cache
streamingCache.clearAll()
```

### 2. Watch Expressions
Adicione expressões para monitorar:
- `Date.now() - cached.timestamp`
- `Object.keys(localStorage).length`
- `streamingCache.cache.size`

### 3. Call Stack
Use o Call Stack para entender o fluxo:
1. Onde a função foi chamada
2. Quais parâmetros foram passados
3. Estado das variáveis em cada nível

### 4. Logpoints
Use Logpoints em vez de `console.log()`:
- Não precisa modificar código
- Não precisa rebuild
- Pode adicionar/remover durante debug

## 🔧 Troubleshooting

### Chrome não abre?
1. Verifique se a porta 5173 está livre
2. Execute `npm run dev` manualmente primeiro
3. Tente "🔗 Attach to Chrome" em vez de "Launch"

### Breakpoints não funcionam?
1. Verifique se source maps estão habilitados
2. Limpe o cache do navegador
3. Reinicie o debug (`Ctrl+Shift+F5`)

### DevTools não abre automaticamente?
1. Use "🐛 Debug Cache (Chrome)"
2. Ou abra manualmente com `F12`

### Cache não aparece no debug?
1. Verifique se `window.debugCache` existe
2. Execute no Debug Console: `window.debugCache()`
3. Veja logs no Console do Chrome

## 📚 Recursos

- [VSCode Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Source Maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map)

---

**Última atualização:** 01/12/2024
