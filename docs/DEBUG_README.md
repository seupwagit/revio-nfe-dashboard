# 🐛 Debug Fullstack - Documentação Completa

## 📚 Índice de Documentação

### 🚀 Início Rápido
- **[DEBUG_QUICKSTART.md](DEBUG_QUICKSTART.md)** - Comece aqui! Guia de 3 passos para começar a debugar.

### 🏗️ Arquitetura
- **[DEBUG_ARCHITECTURE.md](DEBUG_ARCHITECTURE.md)** - Entenda como o debug fullstack funciona internamente.

### 📖 Guia Completo
- **[DEBUG_FULLSTACK.md](DEBUG_FULLSTACK.md)** - Documentação completa com todos os recursos e configurações.

### 💡 Exemplos Práticos
- **[DEBUG_EXAMPLES.md](DEBUG_EXAMPLES.md)** - 7 exemplos práticos de debug com soluções passo a passo.

---

## 🎯 O Que Foi Configurado

### ✅ VS Code Launch Configurations

**Perfis Principais:**
- 🚀 **Full Stack Debug (Chrome + Backend)** - Debug completo (PADRÃO)
- 🚀 **Full Stack Debug (Edge + Backend)** - Mesma funcionalidade com Edge
- 🔌 **Attach Full Stack** - Conecta a processos já rodando

**Perfis Individuais:**
- 🚀 Launch Chrome (Dev) - Apenas frontend
- 🌐 Launch Edge (Dev) - Apenas frontend
- 🔗 Attach to Chrome - Conecta a Chrome existente
- 🔧 Backend (Node.js) - Apenas backend
- 🔌 Attach Backend - Conecta a backend existente
- 🐛 Debug Cache - Debug focado em cache
- 🧪 Debug Tests - Debug de testes

### ✅ VS Code Tasks

**Tasks Principais:**
- **Start Frontend (Vite)** - Inicia Vite dev server
- **Start Backend (Backoffice)** - Inicia backend com debug habilitado
- **🚀 Start Full Stack** - Inicia ambos simultaneamente

**Tasks Auxiliares:**
- Kill Port 3000/3000 - Libera portas ocupadas
- Debug: Check Cache - Verifica cache
- Test MongoDB Connection - Testa conexão

### ✅ Scripts NPM

```json
{
  "backend": "npx tsx server/backoffice/index.ts",
  "backend:debug": "npx tsx --inspect=9229 server/backoffice/index.ts",
  "kill-ports": "scripts\\kill-ports.bat",
  "monitor": "node scripts/auto-monitor.mjs"
}
```

### ✅ Configurações VS Code

- Debug console nunca abre automaticamente
- Debug toolbar sempre visível
- Source maps habilitados
- Skip files configurado (node_modules, internals)
- Terminal padrão: Command Prompt

---

## 🚀 Como Usar

### Método 1: F5 (Mais Rápido)
```
1. Pressione F5
2. Aguarde servidores iniciarem
3. Chrome abre automaticamente
4. Adicione breakpoints
5. Use a aplicação
```

### Método 2: Menu Debug
```
1. Ctrl+Shift+D (abre painel Debug)
2. Selecione perfil desejado
3. Clique no botão verde "Start Debugging"
4. Adicione breakpoints
5. Use a aplicação
```

### Método 3: Attach (Servidores Rodando)
```
1. npm run monitor (inicia servidores)
2. Ctrl+Shift+D
3. Selecione "🔌 Attach Full Stack"
4. Clique em "Start Debugging"
```

---

## 🎮 Atalhos Essenciais

| Atalho | Ação |
|--------|------|
| `F5` | Start/Continue Debug |
| `Ctrl+Shift+D` | Abrir painel Debug |
| `F9` | Toggle Breakpoint |
| `F10` | Step Over (próxima linha) |
| `F11` | Step Into (entrar na função) |
| `Shift+F11` | Step Out (sair da função) |
| `Ctrl+Shift+F5` | Restart Debug |
| `Shift+F5` | Stop Debug |

---

## 📍 Onde Adicionar Breakpoints

### Frontend (React/TypeScript)
```
src/
├── pages/
│   ├── Dashboard.tsx ← Componentes principais
│   └── Notas.tsx
├── hooks/
│   └── useDocuments.ts ← Lógica de negócio
├── services/
│   └── api.ts ← Chamadas HTTP
└── components/
    └── DocumentGrid.tsx ← Componentes reutilizáveis
```

### Backend (Node.js/TypeScript)
```
server/backoffice/
├── routes/
│   ├── documents.ts ← Endpoints API
│   └── analytics.ts
├── database/
│   └── mongodb.ts ← Queries e agregações
└── middleware/
    └── errorHandler.ts ← Tratamento de erros
```

---

## 🔍 Recursos de Debug

### 1. Breakpoints Simples
Clique na margem esquerda do editor.

### 2. Conditional Breakpoints
Clique com botão direito → "Edit Breakpoint" → Adicione condição:
```javascript
data.length > 100
user.role === 'admin'
response.status !== 200
```

### 3. Logpoints
Breakpoint que apenas loga sem pausar:
```javascript
Carregados {data.length} documentos
Usuário {user.name} fez login
```

### 4. Watch Expressions
Adicione no painel "Watch":
```javascript
data.length
user.isAuthenticated
JSON.stringify(filters, null, 2)
```

### 5. Debug Console
Execute código em tempo real:
```javascript
console.table(documents)
documents.filter(d => d.status === 'autorizada')
await api.get('/test')
```

---

## 🚨 Troubleshooting

### Porta já em uso
```bash
npm run kill-ports
```

### Breakpoints não funcionam
1. Verifique se source maps estão habilitados
2. Recarregue a página (Ctrl+R)
3. Restart debug (Ctrl+Shift+F5)

### Backend não conecta
1. Verifique se porta 9229 está livre
2. Certifique-se que backend iniciou com `--inspect=9229`
3. Use "🔌 Attach Backend" se já estiver rodando

### Chrome não abre
1. Feche todas as instâncias do Chrome
2. Delete `.vscode/chrome-debug-profile`
3. Tente novamente

### Servidores não iniciam
```bash
# Libere as portas
npm run kill-ports

# Ou manualmente
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🎓 Fluxo de Aprendizado

### Nível 1: Básico (1 dia)
1. ✅ Leia [DEBUG_QUICKSTART.md](DEBUG_QUICKSTART.md)
2. ✅ Pressione F5 e explore
3. ✅ Adicione breakpoints simples
4. ✅ Use F10 (Step Over) e F5 (Continue)

### Nível 2: Intermediário (1 semana)
1. ✅ Leia [DEBUG_FULLSTACK.md](DEBUG_FULLSTACK.md)
2. ✅ Use Watch expressions
3. ✅ Explore Call Stack
4. ✅ Use Debug Console
5. ✅ Pratique com [DEBUG_EXAMPLES.md](DEBUG_EXAMPLES.md)

### Nível 3: Avançado (1 mês)
1. ✅ Leia [DEBUG_ARCHITECTURE.md](DEBUG_ARCHITECTURE.md)
2. ✅ Use Conditional Breakpoints
3. ✅ Use Logpoints
4. ✅ Debug de performance
5. ✅ Debug de queries MongoDB

---

## 📊 Portas Utilizadas

| Porta | Serviço | Descrição |
|-------|---------|-----------|
| 3000 | Frontend | Vite Dev Server |
| 3000 | Backend | Backoffice API |
| 9222 | Chrome | Remote Debugging |
| 9229 | Node.js | Inspector Protocol |
| 27017 | MongoDB | Database |

---

## 💡 Dicas Pro

### 1. Use Compound Configurations
O perfil "Full Stack Debug" já está configurado para iniciar frontend e backend juntos.

### 2. Skip Files
Configurado para pular `node_modules` e internals do Node.js, focando apenas no seu código.

### 3. Source Maps
Funcionam automaticamente para mapear TypeScript → JavaScript.

### 4. Auto Attach
VS Code pode auto-attach a processos Node.js. Configure em Settings → "Debug: Node Auto Attach".

### 5. Terminal Integration
Use o terminal integrado do VS Code para ver logs enquanto debuga.

---

## 🔗 Links Úteis

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [TypeScript Debugging](https://code.visualstudio.com/docs/typescript/typescript-debugging)

---

## 📝 Checklist de Configuração

- ✅ `.vscode/launch.json` configurado
- ✅ `.vscode/tasks.json` configurado
- ✅ `.vscode/settings.json` configurado
- ✅ `package.json` com scripts de debug
- ✅ `scripts/kill-ports.bat` criado
- ✅ Documentação completa criada
- ✅ Exemplos práticos documentados

---

## 🎯 Próximos Passos

1. **Comece Agora**: Leia [DEBUG_QUICKSTART.md](DEBUG_QUICKSTART.md)
2. **Pratique**: Use os exemplos em [DEBUG_EXAMPLES.md](DEBUG_EXAMPLES.md)
3. **Aprofunde**: Leia [DEBUG_FULLSTACK.md](DEBUG_FULLSTACK.md)
4. **Domine**: Estude [DEBUG_ARCHITECTURE.md](DEBUG_ARCHITECTURE.md)

---

**Dúvidas?** Consulte a documentação ou use o Debug Console para experimentar!

**Boa sorte com o debug! 🚀**
