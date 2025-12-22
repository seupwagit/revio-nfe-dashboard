# Debug Fullstack no VS Code

**Data:** 2025-12-22  
**Status:** ✅ Configurado

## 🎯 Visão Geral

O projeto está configurado para debug fullstack no VS Code, permitindo debugar simultaneamente:
- **Frontend** (React + Vite) no Chrome/Edge
- **Backend** (Node.js + Express) com tsx

## 🚀 Como Usar

### Método 1: Atalho Rápido (Recomendado)

1. Pressione **F5**
2. O VS Code irá:
   - Iniciar o backend em modo debug (porta 9229)
   - Iniciar o frontend (Vite dev server)
   - Abrir o Chrome com DevTools conectado
3. Pronto! Você pode colocar breakpoints em qualquer arquivo

### Método 2: Menu de Debug

1. Pressione **Ctrl+Shift+D** (ou clique no ícone de debug)
2. Selecione **"🚀 Full Stack Debug"** no dropdown
3. Clique no botão verde "Start Debugging" ou pressione **F5**

## 🔧 Perfis Disponíveis

### Perfis Principais

#### 🚀 Full Stack Debug (PADRÃO)
- **O que faz:** Inicia backend + frontend no Chrome
- **Quando usar:** Desenvolvimento normal do dia a dia
- **Atalho:** F5
- **Portas:**
  - Frontend: http://localhost:3000
  - Backend: http://localhost:3000/api
  - Debug Backend: 9229

#### 🚀 Full Stack Debug (Edge + Backend)
- **O que faz:** Inicia backend + frontend no Edge
- **Quando usar:** Testar compatibilidade com Edge
- **Portas:** Mesmas do perfil Chrome

#### 🔌 Attach Full Stack
- **O que faz:** Conecta a processos já em execução
- **Quando usar:** Quando você já iniciou os servidores manualmente
- **Requisitos:**
  - Backend rodando com `npm run backend:debug`
  - Chrome aberto com `--remote-debugging-port=9222`

### Perfis Individuais

#### 🚀 Launch Chrome (Dev)
- Debug apenas do frontend no Chrome
- Inicia automaticamente o Vite dev server

#### 🌐 Launch Edge (Dev)
- Debug apenas do frontend no Edge
- Inicia automaticamente o Vite dev server

#### 🔧 Backend (Node.js)
- Debug apenas do backend
- Útil quando você quer focar apenas no servidor

#### 🔗 Attach to Chrome
- Conecta a uma instância Chrome já aberta
- Chrome deve estar rodando com `--remote-debugging-port=9222`

#### 🐛 Debug Cache (Chrome)
- Debug com foco no sistema de cache
- Abre automaticamente o DevTools

#### 🧪 Debug Tests
- Debug de testes unitários com Vitest

## 📍 Colocando Breakpoints

### Frontend (src/frontend/)

```typescript
// src/frontend/components/GridPaginada.tsx
export function GridPaginada() {
  const [data, setData] = useState([])
  
  debugger; // ← Breakpoint aqui
  
  useEffect(() => {
    loadData()
  }, [])
  
  return <div>...</div>
}
```

### Backend (src/backend/)

```typescript
// src/backend/routes/documents.ts
router.get('/documents', async (req, res) => {
  debugger; // ← Breakpoint aqui
  
  const documents = await db.collection('documents').find().toArray()
  res.json(documents)
})
```

## 🔍 Recursos de Debug

### Frontend
- ✅ Breakpoints em arquivos .tsx/.ts
- ✅ Source maps funcionando
- ✅ Console do navegador integrado
- ✅ Inspeção de estado React
- ✅ Network tab para requisições

### Backend
- ✅ Breakpoints em arquivos .ts
- ✅ Inspeção de variáveis
- ✅ Call stack completo
- ✅ Console integrado
- ✅ Watch expressions
- ✅ Hot reload com tsx

## 🛠️ Configuração Técnica

### Source Maps

O projeto está configurado para mapear corretamente os arquivos:

```json
"sourceMapPathOverrides": {
  "/@fs/*": "${workspaceFolder}/*",
  "/src/frontend/*": "${workspaceFolder}/src/frontend/*",
  "/*": "${workspaceFolder}/*"
}
```

### Portas

- **3000**: Frontend (Vite) e Backend (Express)
- **9229**: Debug do Backend (Node.js Inspector)
- **9222**: Remote debugging do Chrome

### Variáveis de Ambiente

O backend é iniciado com:
```json
"env": {
  "NODE_ENV": "development"
}
```

## 🎨 Painéis do VS Code

Quando o debug está ativo, você verá:

1. **VARIABLES**: Variáveis locais e globais
2. **WATCH**: Expressões que você quer monitorar
3. **CALL STACK**: Pilha de chamadas
4. **BREAKPOINTS**: Lista de breakpoints ativos
5. **DEBUG CONSOLE**: Console interativo

## 🔄 Workflow Recomendado

### Desenvolvimento Normal

1. Pressione **F5** para iniciar tudo
2. Coloque breakpoints onde necessário
3. Navegue no navegador
4. Quando atingir um breakpoint:
   - Inspecione variáveis
   - Execute passo a passo (F10, F11)
   - Continue (F5)
5. Faça alterações no código
6. Hot reload acontece automaticamente

### Debug de API

1. Inicie com **F5**
2. Coloque breakpoint no backend (ex: `src/backend/routes/documents.ts`)
3. No frontend, faça uma requisição que chame essa rota
4. O VS Code para no breakpoint do backend
5. Inspecione a requisição, dados, etc.

### Debug de Componente React

1. Inicie com **F5**
2. Coloque breakpoint no componente (ex: `src/frontend/components/GridPaginada.tsx`)
3. Navegue até a página que usa o componente
4. O Chrome para no breakpoint
5. Inspecione props, state, hooks

## 🚨 Troubleshooting

### Backend não inicia

**Problema:** Backend não conecta ao MongoDB

**Solução:**
1. Verifique o arquivo `.env`
2. Confirme que `VITE_MONGODB_CONNECTION_STRING` está definido
3. Teste a conexão: `npm run test-mongodb`

### Frontend não carrega

**Problema:** Vite não inicia ou porta 3000 ocupada

**Solução:**
1. Mate processos na porta 3000:
   - Use a task "Kill Port 3000" no VS Code
   - Ou execute: `scripts\kill-ports.bat`
2. Tente novamente

### Breakpoints não funcionam

**Problema:** Breakpoints aparecem cinza/vazios

**Solução:**
1. Verifique se os source maps estão habilitados
2. Recarregue a página (Ctrl+R)
3. Reinicie o debug (Ctrl+Shift+F5)

### Chrome não abre

**Problema:** Chrome não abre automaticamente

**Solução:**
1. Feche todas as instâncias do Chrome
2. Limpe o cache: `.vscode/chrome-debug-profile`
3. Tente novamente

## 📚 Comandos Úteis

### Durante o Debug

- **F5**: Continue
- **F10**: Step Over (próxima linha)
- **F11**: Step Into (entrar na função)
- **Shift+F11**: Step Out (sair da função)
- **Ctrl+Shift+F5**: Restart
- **Shift+F5**: Stop

### No Debug Console

```javascript
// Avaliar expressões
> user.name
> JSON.stringify(data, null, 2)
> await fetch('/api/health').then(r => r.json())
```

## 🎯 Dicas Pro

1. **Use Logpoints**: Clique com botão direito na margem → "Add Logpoint"
   - Não para a execução, apenas loga
   
2. **Conditional Breakpoints**: Clique com botão direito no breakpoint
   - Para apenas quando uma condição é verdadeira
   - Ex: `user.id === 123`

3. **Watch Expressions**: Adicione expressões para monitorar
   - Ex: `data.length`, `isLoading`, `error?.message`

4. **Debug Console**: Execute código no contexto atual
   - Teste funções
   - Modifique variáveis
   - Faça requisições

5. **Multiple Terminals**: O VS Code abre terminais separados
   - Um para o frontend (Vite)
   - Um para o backend (tsx)
   - Você pode ver os logs de ambos

## 📖 Referências

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
