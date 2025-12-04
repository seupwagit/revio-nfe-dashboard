# Arquitetura de Debug Fullstack

## 🏗️ Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code Debugger                        │
│                                                              │
│  ┌──────────────────┐              ┌──────────────────┐    │
│  │   Frontend       │              │    Backend       │    │
│  │   Debugger       │              │    Debugger      │    │
│  │                  │              │                  │    │
│  │  Port: 9222      │              │  Port: 9229      │    │
│  │  (Chrome)        │              │  (Node.js)       │    │
│  └────────┬─────────┘              └────────┬─────────┘    │
│           │                                 │               │
└───────────┼─────────────────────────────────┼───────────────┘
            │                                 │
            │                                 │
            ▼                                 ▼
    ┌───────────────┐                ┌──────────────────┐
    │   Chrome      │                │   Node.js        │
    │   Browser     │◄───────────────┤   Process        │
    │               │   HTTP/API     │                  │
    │  Port: 3000   │                │   Port: 3001     │
    └───────┬───────┘                └────────┬─────────┘
            │                                 │
            │                                 │
            ▼                                 ▼
    ┌───────────────┐                ┌──────────────────┐
    │   Vite Dev    │                │   MongoDB        │
    │   Server      │                │   Database       │
    │               │                │                  │
    │  Port: 3000   │                │   Port: 27017    │
    └───────────────┘                └──────────────────┘
```

## 🔄 Fluxo de Debug

### 1. Inicialização (F5)

```
1. VS Code executa preLaunchTask
   └─> Inicia Vite (Frontend)
   └─> Inicia Node.js com --inspect (Backend)

2. VS Code conecta debuggers
   └─> Chrome DevTools Protocol (Frontend)
   └─> Node.js Inspector Protocol (Backend)

3. Chrome abre automaticamente
   └─> Carrega http://localhost:3000
   └─> Source maps mapeiam código transpilado
```

### 2. Breakpoint Hit (Frontend)

```
User Action (Click/Navigate)
    │
    ▼
React Component Render
    │
    ▼
Breakpoint Hit
    │
    ▼
VS Code Pausa Execução
    │
    ├─> Variables Panel (mostra estado)
    ├─> Call Stack (mostra pilha)
    └─> Debug Console (permite comandos)
```

### 3. Breakpoint Hit (Backend)

```
Frontend API Call (axios/fetch)
    │
    ▼
HTTP Request → Backend
    │
    ▼
Express Route Handler
    │
    ▼
Breakpoint Hit
    │
    ▼
VS Code Pausa Execução
    │
    ├─> Variables Panel (req, res, data)
    ├─> Call Stack (route → service → db)
    └─> Debug Console (testar queries)
```

## 🎯 Pontos de Debug Comuns

### Frontend

```typescript
// 1. Componente React
src/pages/Dashboard.tsx
  └─> useEffect() ← Carregamento inicial
  └─> handleClick() ← Ações do usuário
  └─> render() ← Renderização

// 2. Hooks Customizados
src/hooks/useDocuments.ts
  └─> fetchDocuments() ← Chamadas API
  └─> useState() ← Gerenciamento de estado

// 3. Serviços
src/services/api.ts
  └─> axios.get() ← Requisições HTTP
  └─> transformData() ← Transformação de dados
```

### Backend

```typescript
// 1. Rotas
server/backoffice/routes/documents.ts
  └─> router.get() ← Endpoint handler
  └─> validateRequest() ← Validação
  └─> sendResponse() ← Resposta

// 2. Database
server/backoffice/database/mongodb.ts
  └─> connect() ← Conexão
  └─> query() ← Queries
  └─> aggregate() ← Agregações

// 3. Middleware
server/backoffice/middleware/
  └─> auth() ← Autenticação
  └─> errorHandler() ← Tratamento de erros
```

## 🔍 Source Maps

### Frontend (Vite)

```
TypeScript Source          Transpiled JS           Browser
─────────────────         ──────────────          ─────────
src/App.tsx        →      dist/App.js      →      Chrome
     ↑                         ↑                      ↑
     └─────────────────────────┴──────────────────────┘
              Source Map (App.js.map)
```

### Backend (TSX)

```
TypeScript Source          Transpiled JS           Node.js
─────────────────         ──────────────          ─────────
server/index.ts    →      [memory]         →      Process
     ↑                         ↑                      ↑
     └─────────────────────────┴──────────────────────┘
              Inline Source Map
```

## 🎮 Debug Workflow

### Cenário 1: Debug de Requisição API

```
1. Adicionar breakpoint em:
   - Frontend: src/services/api.ts (linha da requisição)
   - Backend: server/routes/documents.ts (linha do handler)

2. Executar ação no navegador
   └─> Breakpoint 1 (Frontend) ativa
       └─> Inspecionar: request payload, headers
       └─> Continue (F5)
           └─> Breakpoint 2 (Backend) ativa
               └─> Inspecionar: req.body, req.query
               └─> Step through: query → transform → response
               └─> Continue (F5)
                   └─> Volta ao Frontend
                       └─> Inspecionar: response data
```

### Cenário 2: Debug de Estado React

```
1. Adicionar breakpoint em:
   - Component: src/pages/Dashboard.tsx (useEffect)
   - Hook: src/hooks/useDocuments.ts (setState)

2. Recarregar página
   └─> Breakpoint 1 (useEffect) ativa
       └─> Watch: documents, loading, error
       └─> Step Into (F11) → useDocuments()
           └─> Breakpoint 2 (setState) ativa
               └─> Inspecionar: newState, prevState
               └─> Continue (F5)
                   └─> Component re-render
```

## 📊 Debug Panels

### Variables Panel
```
Local
├─ data: Array(5199)
├─ loading: false
├─ error: null
└─ filters: Object
    ├─ startDate: "2024-12-04"
    └─ endDate: "2025-12-04"

Closure
└─ useDocuments: Function

Global
└─ window: Window
```

### Call Stack
```
Dashboard.tsx:45 (useEffect callback)
  ↓
useDocuments.ts:23 (fetchDocuments)
  ↓
api.ts:15 (axios.get)
  ↓
[async]
```

### Watch Expressions
```
data.length                    → 5199
data[0].valorTotal            → 327.40
filters.startDate             → "2024-12-04"
user?.isAuthenticated         → true
```

## 🚀 Performance Tips

### 1. Skip Files
Configurado para pular:
- `node_modules/**` (bibliotecas externas)
- `<node_internals>/**` (Node.js internals)

### 2. Conditional Breakpoints
Use para evitar pausas desnecessárias:
```javascript
// Apenas quando há muitos documentos
data.length > 1000

// Apenas para usuário específico
user.id === '123'

// Apenas em caso de erro
response.status !== 200
```

### 3. Logpoints
Loga sem pausar:
```javascript
// Logpoint
Carregados {data.length} documentos em {loadTime}ms
```

## 🔧 Configurações Avançadas

### launch.json
```json
{
  "configurations": [
    {
      "name": "Backend",
      "type": "node",
      "request": "launch",
      "runtimeArgs": ["tsx", "--inspect=9229"],
      "skipFiles": ["<node_internals>/**"],
      "sourceMaps": true
    }
  ]
}
```

### tasks.json
```json
{
  "tasks": [
    {
      "label": "Start Backend",
      "command": "npx tsx --inspect=9229 server/index.ts",
      "isBackground": true
    }
  ]
}
```

## 📚 Recursos

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Node.js Inspector](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Source Maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map)

---

**Próximos Passos:**
1. Leia `DEBUG_QUICKSTART.md` para começar
2. Pratique com breakpoints simples
3. Explore breakpoints condicionais
4. Domine o Debug Console
