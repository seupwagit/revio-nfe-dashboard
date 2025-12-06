# Debug Fullstack - VS Code

Configuração completa para debug simultâneo de Frontend (React/Vite) e Backend (Node.js/TypeScript).

## 🎯 Perfis de Debug Disponíveis

### 1. 🚀 Full Stack Debug (Chrome + Backend) - RECOMENDADO

Debug completo com Chrome e Node.js rodando simultaneamente.

**Como usar:**

1. Pressione `F5` ou
2. `Ctrl+Shift+D` → Selecione "🚀 Full Stack Debug (Chrome + Backend)"
3. Clique no botão verde "Start Debugging"

**O que acontece:**

- ✅ Inicia o servidor Vite (Frontend) na porta 3000
- ✅ Inicia o servidor Backoffice (Backend) na porta 3000 com debug
- ✅ Abre o Chrome com DevTools
- ✅ Conecta o debugger do VS Code ao backend
- ✅ Permite breakpoints em ambos frontend e backend

### 2. 🚀 Full Stack Debug (Edge + Backend)

Mesma funcionalidade, mas usando Microsoft Edge.

### 3. 🔌 Attach Full Stack

Conecta a processos já em execução (útil quando os servidores já estão rodando).

**Como usar:**

1. Inicie os servidores manualmente:
   ```bash
   npm run monitor
   ```
2. No VS Code: `Ctrl+Shift+D` → "🔌 Attach Full Stack"

## 🔧 Perfis Individuais

### Frontend Only

- **🚀 Launch Chrome (Dev)**: Apenas frontend no Chrome
- **🌐 Launch Edge (Dev)**: Apenas frontend no Edge
- **🔗 Attach to Chrome**: Conecta a Chrome já aberto

### Backend Only

- **🔧 Backend (Node.js)**: Inicia e debuga apenas o backend
- **🔌 Attach Backend**: Conecta a backend já em execução

### Outros

- **🐛 Debug Cache**: Debug focado no sistema de cache
- **🧪 Debug Tests**: Debug de testes com Vitest

## 📍 Como Usar Breakpoints

### Frontend (React/TypeScript)

1. Abra qualquer arquivo `.tsx` ou `.ts` em `src/`
2. Clique na margem esquerda para adicionar breakpoint
3. Execute a ação no navegador que dispara o código
4. O VS Code pausará na linha do breakpoint

**Exemplo:**

```typescript
// src/pages/Dashboard.tsx
function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    debugger; // ← Adicione breakpoint aqui
    loadData();
  }, []);
}
```

### Backend (Node.js/TypeScript)

1. Abra qualquer arquivo em `server/`
2. Adicione breakpoint
3. Faça uma requisição da API (ex: carregar dashboard)
4. O VS Code pausará no backend

**Exemplo:**

```typescript
// server/backoffice/routes/documents.ts
router.get("/api/documents", async (req, res) => {
  debugger; // ← Adicione breakpoint aqui
  const documents = await fetchDocuments();
  res.json(documents);
});
```

## 🎮 Controles de Debug

Durante o debug, use:

- **F5**: Continue
- **F10**: Step Over (próxima linha)
- **F11**: Step Into (entrar na função)
- **Shift+F11**: Step Out (sair da função)
- **Ctrl+Shift+F5**: Restart
- **Shift+F5**: Stop

## 📊 Painéis Úteis

### Variables

Mostra todas as variáveis no escopo atual.

### Watch

Adicione expressões para monitorar:

```javascript
data.length;
user.isAuthenticated;
response.status;
```

### Call Stack

Mostra a pilha de chamadas (útil para entender o fluxo).

### Debug Console

Execute código JavaScript/TypeScript em tempo real:

```javascript
console.log(data);
JSON.stringify(user, null, 2);
```

## 🔍 Dicas Avançadas

### 1. Conditional Breakpoints

Clique com botão direito no breakpoint → "Edit Breakpoint" → Adicione condição:

```javascript
data.length > 100;
user.role === "admin";
```

### 2. Logpoints

Breakpoint que apenas loga sem pausar:

```javascript
{data.length} documentos carregados
```

### 3. Source Maps

As source maps estão configuradas para mapear código transpilado:

- Frontend: Vite gera source maps automaticamente
- Backend: TSX gera source maps inline

### 4. Skip Files

Configurado para pular:

- `node_modules/**`
- `<node_internals>/**`

## 🚨 Troubleshooting

### Porta já em uso

```bash
# Windows
npm run kill-ports
# Ou manualmente:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Breakpoints não funcionam

1. Verifique se source maps estão habilitados
2. Recarregue a página (Ctrl+R)
3. Restart do debug (Ctrl+Shift+F5)

### Backend não conecta

1. Verifique se a porta 9229 está livre
2. Certifique-se que o backend iniciou com `--inspect=9229`
3. Use "🔌 Attach Backend" se já estiver rodando

### Chrome não abre

1. Feche todas as instâncias do Chrome
2. Delete `.vscode/chrome-debug-profile`
3. Tente novamente

## 📝 Configuração de Tasks

As tasks estão configuradas em `.vscode/tasks.json`:

- **Start Frontend (Vite)**: Inicia Vite dev server
- **Start Backend (Backoffice)**: Inicia backend com debug
- **🚀 Start Full Stack**: Inicia ambos simultaneamente

## 🔗 Portas Utilizadas

- **3000**: Frontend (Vite)
- **3000**: Backend (Backoffice API)
- **9222**: Chrome Remote Debugging
- **9229**: Node.js Inspector (Backend Debug)

## 💡 Exemplos de Uso

### Debug de Requisição API

1. Adicione breakpoint em `server/backoffice/routes/documents.ts`
2. Adicione breakpoint em `src/services/api.ts`
3. Inicie Full Stack Debug
4. Carregue o dashboard
5. Veja a requisição passar pelo frontend → backend

### Debug de Estado React

1. Adicione breakpoint em `src/hooks/useDocuments.ts`
2. Use o painel "Variables" para inspecionar estado
3. Use "Watch" para monitorar `documents.length`

### Debug de Agregação MongoDB

1. Breakpoint em `server/backoffice/database/mongodb.ts`
2. Inspecione queries e resultados
3. Use Debug Console para testar queries

## 📚 Recursos Adicionais

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)

## 🎓 Atalhos Úteis

| Atalho          | Ação                 |
| --------------- | -------------------- |
| `F5`            | Start/Continue Debug |
| `Ctrl+Shift+D`  | Abrir painel Debug   |
| `F9`            | Toggle Breakpoint    |
| `F10`           | Step Over            |
| `F11`           | Step Into            |
| `Shift+F11`     | Step Out             |
| `Ctrl+Shift+F5` | Restart Debug        |
| `Shift+F5`      | Stop Debug           |
| `Ctrl+K Ctrl+I` | Show Hover           |

---

**Dica:** Para melhor experiência, use o perfil "🚀 Full Stack Debug (Chrome + Backend)" como padrão.
