# 🐛 Guia de Debug - Full Stack

## Configuração Padrão

O projeto está configurado com **Debug Full Stack** como perfil padrão.

### Como Iniciar Debug

#### Opção 1: Atalho (Recomendado)
Pressione **F5** - Inicia automaticamente o Full Stack Debug

#### Opção 2: Menu Debug
1. Pressione **Ctrl+Shift+D** (abre painel de debug)
2. Selecione "🚀 Full Stack Debug"
3. Pressione **F5** ou clique no botão ▶️

## Perfis de Debug Disponíveis

### 🚀 Full Stack Debug (PADRÃO)
- **O que faz**: Inicia frontend + backend + MongoDB
- **Quando usar**: Desenvolvimento normal, debug completo
- **Porta**: 3000
- **Browser**: Chrome com DevTools

### 🚀 Launch Chrome (Dev)
- **O que faz**: Apenas frontend no Chrome
- **Quando usar**: Debug focado no frontend
- **Porta**: 3000

### 🌐 Launch Edge (Dev)
- **O que faz**: Apenas frontend no Edge
- **Quando usar**: Testar compatibilidade Edge
- **Porta**: 3000

### 🔗 Attach to Chrome
- **O que faz**: Conecta a Chrome já aberto
- **Quando usar**: Chrome já está rodando na porta 9222
- **Requisito**: Chrome com `--remote-debugging-port=9222`

### 🐛 Debug Cache
- **O que faz**: Debug com foco no sistema de cache
- **Quando usar**: Problemas com cache MongoDB
- **Features**: DevTools aberto automaticamente

### 🧪 Debug Tests
- **O que faz**: Debug de testes unitários
- **Quando usar**: Debugar testes com Vitest
- **Requisito**: Testes configurados

## Breakpoints

### Como Adicionar
1. Clique na margem esquerda do editor (ao lado do número da linha)
2. Ou pressione **F9** na linha desejada

### Tipos de Breakpoints
- **Breakpoint Normal**: Para na linha
- **Conditional Breakpoint**: Para apenas se condição for verdadeira
- **Logpoint**: Loga mensagem sem parar

### Locais Úteis para Breakpoints

#### Frontend (React)
```typescript
// src/contexts/NFContext.tsx
const carregarDados = async () => {
  // ⬅️ Breakpoint aqui para debug de carregamento
}

// src/services/fiscalDocuments.ts
public async fetchDocuments() {
  // ⬅️ Breakpoint aqui para debug de queries
}
```

#### MongoDB Services
```typescript
// src/services/mongoConnection.ts
public async connect() {
  // ⬅️ Breakpoint aqui para debug de conexão
}

// src/services/mongoQuery.ts
public async find() {
  // ⬅️ Breakpoint aqui para debug de queries
}
```

#### Cache
```typescript
// src/services/mongoCache.ts
public getFromCache() {
  // ⬅️ Breakpoint aqui para debug de cache
}
```

## Console do Navegador

### Comandos Úteis

```javascript
// Ver status do cache MongoDB
window.debugMongoCache()

// Ver todas as collections
// (Use MCP MongoDB tools)

// Limpar cache
localStorage.clear()
sessionStorage.clear()
```

## Debug MongoDB

### Usando MCP MongoDB Tools

O projeto tem MCP MongoDB configurado. Use os comandos:

```bash
# Listar databases
mcp_MongoDB_list_databases

# Listar collections
mcp_MongoDB_list_collections

# Ver schema
mcp_MongoDB_collection_schema

# Executar query
mcp_MongoDB_find
```

### Verificar Conexão

```bash
npm run test-mongodb
```

## Problemas Comuns

### 1. Debug não inicia
**Solução**: 
- Verifique se porta 3000 está livre
- Feche outras instâncias do Chrome
- Execute: `npm install`

### 2. Breakpoints não funcionam
**Solução**:
- Verifique se sourcemaps estão habilitados
- Recarregue a página (Ctrl+R)
- Reinicie o debug (Ctrl+Shift+F5)

### 3. MongoDB não conecta
**Solução**:
- Verifique `.env` - `VITE_MONGODB_CONNECTION_STRING`
- Teste conexão: `npm run test-mongodb`
- Verifique firewall/rede

### 4. Cache não funciona
**Solução**:
- Abra DevTools (F12)
- Vá em Application > Storage
- Limpe cache: `localStorage.clear()`
- Use: `window.debugMongoCache()`

### 5. Dados não carregam
**Solução**:
- Abra Console (F12)
- Verifique erros em vermelho
- Verifique Network tab
- Verifique variáveis `.env`

## Atalhos Úteis

| Atalho | Ação |
|--------|------|
| **F5** | Iniciar/Continuar Debug |
| **Shift+F5** | Parar Debug |
| **Ctrl+Shift+F5** | Reiniciar Debug |
| **F9** | Toggle Breakpoint |
| **F10** | Step Over (próxima linha) |
| **F11** | Step Into (entrar na função) |
| **Shift+F11** | Step Out (sair da função) |
| **Ctrl+Shift+D** | Abrir painel Debug |
| **F12** | Abrir DevTools |

## Logs

### Frontend
Logs aparecem em:
- Console do navegador (F12)
- Terminal do VS Code (Output)

### MongoDB
Logs aparecem em:
- Console do navegador (queries)
- Terminal do VS Code (conexão)

### Formato dos Logs

```
✅ Sucesso
❌ Erro
⚠️ Warning
🔄 Processando
💾 Cache
📊 Dados
🔌 Conexão
```

## Performance

### Chrome DevTools

1. Abra DevTools (F12)
2. Vá em **Performance** tab
3. Clique em Record (●)
4. Execute ação
5. Pare gravação
6. Analise timeline

### MongoDB Queries

Use `explain()` para analisar queries:

```typescript
const explain = await queryService.explain({
  collection: 'tbl_nfe_100',
  filter: { DT_DOC: { $gte: new Date('2024-01-01') } }
});
console.log('Query plan:', explain);
```

## Dicas

1. **Use Logpoints** ao invés de `console.log()`
2. **Conditional Breakpoints** para casos específicos
3. **Watch expressions** para monitorar variáveis
4. **Call Stack** para entender fluxo de execução
5. **Network tab** para debug de requisições

## Recursos

- [VS Code Debug](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [MongoDB Debug](https://www.mongodb.com/docs/manual/reference/explain-results/)
