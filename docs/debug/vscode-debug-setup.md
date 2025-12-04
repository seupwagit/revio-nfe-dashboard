# 🔧 Setup de Debug do VSCode - Guia Completo

Configuração completa de debug para o SpedRevio no VSCode.

## ✅ O que foi Configurado

### 1. Launch Configurations (`.vscode/launch.json`)

5 configurações de debug prontas para usar:

| Configuração | Descrição | Quando Usar |
|--------------|-----------|-------------|
| 🚀 Launch Chrome (Dev) | Inicia Chrome com debug | Desenvolvimento normal |
| 🔗 Attach to Chrome | Conecta ao Chrome aberto | Chrome já está rodando |
| 🌐 Launch Edge (Dev) | Inicia Edge com debug | Preferência por Edge |
| 🐛 Debug Cache (Chrome) | Debug específico do cache | Problemas com cache |
| 🧪 Debug Tests | Debug de testes | Testes unitários |

### 2. Tasks (`.vscode/tasks.json`)

Tarefas automatizadas:

- **npm: dev** - Servidor de desenvolvimento
- **npm: build** - Build de produção
- **Debug: Check Cache** - Verificar cache
- **Debug: Full Cache Report** - Relatório completo
- **Debug: Clear Cache** - Limpar cache

### 3. Settings (`.vscode/settings.json`)

Configurações otimizadas:

- ✅ Format on save
- ✅ ESLint auto-fix
- ✅ TypeScript workspace
- ✅ Tailwind CSS IntelliSense
- ✅ Debug auto-attach

### 4. Extensions (`.vscode/extensions.json`)

Extensões recomendadas:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Chrome Debugger
- Path IntelliSense
- Error Lens

## 🚀 Como Usar

### Debug Básico

1. **Abrir Debug Panel**
   - Pressione `Ctrl+Shift+D`
   - Ou clique no ícone de debug na sidebar

2. **Selecionar Configuração**
   - Escolha "🚀 Launch Chrome (Dev)"
   - Pressione `F5`

3. **Colocar Breakpoints**
   - Clique na margem esquerda do editor
   - Ou pressione `F9` na linha desejada

4. **Iniciar Debug**
   - Pressione `F5`
   - Chrome abre automaticamente
   - Aplicação carrega com debug ativo

### Debug do Cache

1. **Selecionar Configuração**
   - Escolha "🐛 Debug Cache (Chrome)"

2. **Colocar Breakpoints**
   ```typescript
   // src/services/streamingCache.ts
   getFromCache(key: string) {
     const cached = this.cache.get(key) // ← Breakpoint aqui
     // ...
   }
   ```

3. **Iniciar Debug**
   - Pressione `F5`
   - DevTools abre automaticamente

4. **Fazer Busca**
   - Use a aplicação normalmente
   - VSCode para nos breakpoints

5. **Inspecionar Variáveis**
   - Ver `key`, `cached`, `age`, etc.
   - Usar Debug Console para executar código

## 🎯 Cenários Comuns

### 1. Cache não está funcionando

**Breakpoints:**
```typescript
// src/services/streamingCache.ts
getFromCache(key: string) {
  const cached = this.cache.get(key) // ← Aqui
  if (!cached) {
    console.log('❌ Cache MISS') // ← E aqui
    return null
  }
}
```

**Watch Expressions:**
- `this.cache.size`
- `Date.now() - cached.timestamp`
- `this.CACHE_DURATION`

### 2. Requisições muito lentas

**Breakpoints:**
```typescript
// src/services/api.ts
async function fetchNotasFiscais(filtros: Filtros) {
  const cacheKey = streamingCache.getCacheKey(filtros) // ← Aqui
  const cached = streamingCache.getFromCache(cacheKey) // ← E aqui
}
```

**Network Tab:**
- Abra DevTools (F12)
- Vá em Network
- Veja tempo de cada requisição

### 3. Dados não aparecem na grid

**Breakpoints:**
```typescript
// src/contexts/NFContext.tsx
const carregarDados = async () => {
  const dados = await fetchNotasFiscais(filtrosComCollection) // ← Aqui
  setNotas(dados) // ← E aqui
}
```

**Watch Expressions:**
- `dados.length`
- `filtrosComCollection`
- `notas.length`

## 💡 Dicas Avançadas

### 1. Conditional Breakpoints

Clique direito no breakpoint > "Edit Breakpoint" > "Expression"

```javascript
// Parar apenas quando cache expira
Date.now() - cached.timestamp > 90 * 60 * 1000

// Parar apenas para valores grandes
valorTotal > 10000

// Parar apenas para collection específica
collection === 'tbl_nfe_100'
```

### 2. Logpoints

Clique direito > "Add Logpoint"

```javascript
// Log sem modificar código
Cache age: {Date.now() - cached.timestamp}ms

// Log com variáveis
Fetching {filtros.collection} from {filtros.dataInicio} to {filtros.dataFim}
```

### 3. Debug Console

Execute código durante o debug:

```javascript
// Ver cache completo
streamingCache.debugCache()

// Ver estatísticas
streamingCache.getStats()

// Testar função
streamingCache.getCacheKey(filtros)

// Modificar variável
cached.timestamp = Date.now()
```

### 4. Call Stack Navigation

Use o Call Stack para:
- Ver onde a função foi chamada
- Navegar entre níveis
- Inspecionar variáveis em cada nível

### 5. Watch Expressions

Adicione expressões para monitorar:

```javascript
// Tamanho do cache
streamingCache.cache.size

// Idade do cache (minutos)
Math.floor((Date.now() - cached.timestamp) / 60000)

// Tempo restante (minutos)
Math.floor((90 * 60 * 1000 - (Date.now() - cached.timestamp)) / 60000)

// Quantidade de registros
cached.data.length

// LocalStorage usado
Object.keys(localStorage).length
```

## 🔧 Troubleshooting

### Chrome não abre?

1. Verifique se porta 5173 está livre:
   ```bash
   netstat -ano | findstr :5173
   ```

2. Inicie servidor manualmente:
   ```bash
   npm run dev
   ```

3. Use "Attach to Chrome" em vez de "Launch"

### Breakpoints não funcionam?

1. Verifique source maps:
   - Abra DevTools
   - Sources > Veja se arquivos .ts aparecem

2. Limpe cache:
   - DevTools > Application > Clear storage

3. Reinicie debug:
   - `Ctrl+Shift+F5`

### DevTools não abre?

1. Use configuração "🐛 Debug Cache"
2. Ou abra manualmente com `F12`
3. Ou adicione `--auto-open-devtools-for-tabs` no launch.json

### Variáveis não aparecem?

1. Verifique se está no escopo correto
2. Use Debug Console para avaliar
3. Adicione Watch Expression

## 📚 Recursos

- [VSCode Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [JavaScript Debugging](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_went_wrong)
- [Source Maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map)

## 🎓 Próximos Passos

1. **Instale as extensões recomendadas**
   - VSCode mostra notificação automaticamente
   - Ou vá em Extensions > "Show Recommended Extensions"

2. **Teste o debug**
   - Pressione `F5`
   - Coloque um breakpoint
   - Veja se funciona

3. **Explore as configurações**
   - Teste cada configuração de debug
   - Veja qual funciona melhor para você

4. **Aprenda os atalhos**
   - `F5` - Start
   - `F9` - Breakpoint
   - `F10` - Step over
   - `F11` - Step into

---

**Última atualização:** 01/12/2024
