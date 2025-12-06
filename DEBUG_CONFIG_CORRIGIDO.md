# ✅ Configuração de Debug Corrigida

**Data:** 2025-12-05  
**Problema:** `preLaunchTask "npm: dev" not found`  
**Status:** ✅ Corrigido

---

## 🚨 Problema

Ao tentar iniciar o debug "Launch Chrome (Dev)", o VS Code apresentava o erro:

```
Could not find the task 'npm: dev'
```

---

## 🔍 Causa

A configuração de debug em `.vscode/launch.json` referenciava uma task `npm: dev` que não existia em `.vscode/tasks.json`.

---

## ✅ Correções Aplicadas

### 1. Adicionada Task `npm: dev` no `tasks.json`

```json
{
  "label": "npm: dev",
  "type": "npm",
  "script": "dev",
  "isBackground": true,
  "problemMatcher": {
    "owner": "vite",
    "pattern": {
      "regexp": "^([^\\s].*):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
      "file": 1,
      "line": 2,
      "column": 3,
      "severity": 4,
      "message": 5
    },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "^.*VITE.*preparing.*$",
      "endsPattern": "^.*Local:.*http://localhost:3000.*$"
    }
  },
  "presentation": {
    "reveal": "always",
    "panel": "dedicated",
    "focus": false,
    "showReuseMessage": false,
    "group": "fullstack"
  }
}
```

**Melhorias:**
- ✅ Task com nome correto `npm: dev`
- ✅ Problem matcher configurado para Vite
- ✅ Background task com padrões de início/fim
- ✅ Detecta quando Vite está pronto

### 2. Removida Propriedade Inválida no `launch.json`

**Antes:**
```json
{
  "name": "🐛 Debug Cache (Chrome)",
  "console": "integratedTerminal",  // ❌ Propriedade inválida
  "trace": true
}
```

**Depois:**
```json
{
  "name": "🐛 Debug Cache (Chrome)",
  "trace": true  // ✅ Propriedade removida
}
```

---

## 🎯 Configurações de Debug Disponíveis

### 1. 🚀 Full Stack Debug (F5)
- Inicia backend + frontend
- Abre Chrome automaticamente
- Debug de ambos simultaneamente

### 2. 🚀 Launch Chrome (Dev)
- Inicia apenas frontend no Chrome
- Executa `npm: dev` automaticamente
- ✅ **AGORA FUNCIONA!**

### 3. 🔗 Attach to Chrome
- Conecta a Chrome já aberto
- Porta: 9222

### 4. 🌐 Launch Edge (Dev)
- Inicia frontend no Edge
- Alternativa ao Chrome

### 5. 🔧 Backend (Node.js)
- Debug apenas do backend
- Porta: 9229

### 6. 🔌 Attach Backend
- Conecta a backend já rodando
- Porta: 9229

### 7. 🐛 Debug Cache (Chrome)
- Chrome com DevTools aberto
- Para debug de cache

### 8. 🧪 Debug Tests
- Debug de testes Vitest
- Breakpoints em testes

---

## 🚀 Como Usar

### Método 1: Atalho (Recomendado)

1. Pressione **F5**
2. Aguarde Vite iniciar
3. Chrome abre automaticamente
4. Coloque breakpoints e debug!

### Método 2: Painel de Debug

1. Pressione **Ctrl+Shift+D**
2. Selecione configuração desejada
3. Clique em "Start Debugging" (▶️)
4. Ou pressione **F5**

### Método 3: Menu

1. Menu **Run** → **Start Debugging**
2. Ou **Run** → **Run Without Debugging** (Ctrl+F5)

---

## 🐛 Colocando Breakpoints

### Frontend (React/TypeScript)

```typescript
// src/components/Dashboard.tsx
export function Dashboard() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    // Clique na margem esquerda aqui ←
    fetchData()
  }, [])
}
```

### Backend (Node.js)

```typescript
// server/backoffice/routes/documents.ts
router.get('/', async (req, res) => {
  // Clique na margem esquerda aqui ←
  const documents = await fetchDocuments()
  res.json(documents)
})
```

---

## ⌨️ Atalhos de Debug

| Atalho | Ação |
|--------|------|
| **F5** | Start/Continue |
| **F10** | Step Over (próxima linha) |
| **F11** | Step Into (entrar na função) |
| **Shift+F11** | Step Out (sair da função) |
| **Ctrl+Shift+F5** | Restart |
| **Shift+F5** | Stop |
| **F9** | Toggle Breakpoint |

---

## 🚨 Problemas Comuns

### 1. Porta 3000 ou 3000 ocupada

**Solução:**
```bash
npm run kill-ports
```

Ou manualmente:
```bash
# Windows
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %P /F
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %P /F
```

### 2. Breakpoints não funcionam

**Soluções:**
1. Verifique se está em modo desenvolvimento (`npm run dev`)
2. Limpe o cache: `npm run debug:cache:clear`
3. Reinicie o VS Code
4. Verifique source maps no `vite.config.ts`

### 3. "Cannot connect to runtime"

**Soluções:**
1. Mate processos nas portas: `npm run kill-ports`
2. Reinicie o VS Code
3. Verifique se Chrome/Edge está fechado

### 4. MongoDB não conecta

**Solução:**
1. Verifique `.env` configurado
2. Teste conexão: `npm run test-mongodb`
3. Verifique variáveis:
   - `VITE_MONGODB_CONNECTION_STRING`
   - `VITE_DB_HOST`
   - `VITE_DB_DATABASE`

---

## 📊 Painéis de Debug

### Variables
- Mostra todas as variáveis no escopo atual
- Expanda objetos para ver propriedades

### Watch
- Adicione expressões para monitorar
- Exemplo: `data.length`, `user.name`

### Call Stack
- Mostra a pilha de chamadas
- Clique para navegar entre funções

### Breakpoints
- Lista todos os breakpoints
- Ative/desative individualmente
- Adicione condições

### Debug Console
- Execute código durante o debug
- Avalie expressões
- Modifique variáveis

---

## 📚 Documentação Criada

- **`docs/development/DEBUG_GUIDE.md`** - Guia completo de debug com exemplos e troubleshooting

---

## ✅ Checklist

Antes de debugar:

- [ ] `.env` configurado
- [ ] MongoDB acessível
- [ ] Portas 3000 e 3000 livres
- [ ] `npm install` executado
- [ ] VS Code atualizado

---

## 🎯 Teste Rápido

1. Pressione **F5**
2. Aguarde mensagem: `Local: http://localhost:3000`
3. Chrome abre automaticamente
4. Coloque breakpoint em `src/App.tsx`
5. Recarregue a página
6. Execução deve pausar no breakpoint ✅

---

**🎉 Debug configurado e funcionando! 🚀**

**Pressione F5 e comece a debugar!**
